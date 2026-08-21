function ensurePdfRuntimeGlobals() {
  if (typeof globalThis.DOMMatrix === 'undefined') {
    class SimpleDOMMatrix {
      constructor(init) {
        const values = Array.isArray(init) ? init : [];
        this.a = values[0] ?? 1;
        this.b = values[1] ?? 0;
        this.c = values[2] ?? 0;
        this.d = values[3] ?? 1;
        this.e = values[4] ?? 0;
        this.f = values[5] ?? 0;
      }

      multiplySelf() {
        return this;
      }

      preMultiplySelf() {
        return this;
      }

      translateSelf(x = 0, y = 0) {
        this.e += x;
        this.f += y;
        return this;
      }

      scaleSelf() {
        return this;
      }

      rotateSelf() {
        return this;
      }

      invertSelf() {
        return this;
      }

      transformPoint(point = {}) {
        return {
          x: point.x ?? 0,
          y: point.y ?? 0,
        };
      }
    }

    globalThis.DOMMatrix = SimpleDOMMatrix;
  }

  if (typeof globalThis.navigator === 'undefined') {
    globalThis.navigator = {
      userAgent: 'Cloudflare-Worker',
      platform: 'Cloudflare',
      language: 'en-US',
      languages: ['en-US'],
    };
  }
}

function toUint8Array(data) {
  if (typeof Buffer !== 'undefined' && data instanceof Buffer) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  if (data instanceof Uint8Array) {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }
  throw new Error('Unsupported PDF input type.');
}

let pdfjsModulePromise = null;

async function getPdfjsModule() {
  ensurePdfRuntimeGlobals();

  if (!pdfjsModulePromise) {
    pdfjsModulePromise = (async () => {
      const [pdfjs, pdfjsWorker] = await Promise.all([
        import('pdfjs-dist/build/pdf.mjs'),
        import('pdfjs-dist/build/pdf.worker.mjs'),
      ]);

      // Preload the worker into the main thread so serverless runtimes do not
      // try to resolve ./pdf.worker.mjs dynamically at request time.
      globalThis.pdfjsWorker = pdfjsWorker;

      return pdfjs;
    })();
  }

  return pdfjsModulePromise;
}

class PdfTextParser {
  constructor(data) {
    this.data = toUint8Array(data);
    this.doc = null;
    this.pdfjs = null;
  }

  async load() {
    if (this.doc) {
      return this.doc;
    }

    this.pdfjs = await getPdfjsModule();
    const loadingTask = this.pdfjs.getDocument({
      data: this.data,
      verbosity: this.pdfjs.VerbosityLevel.ERRORS,
      disableFontFace: true,
      isEvalSupported: false,
      useSystemFonts: false,
    });

    this.doc = await loadingTask.promise;
    return this.doc;
  }

  async getText() {
    const doc = await this.load();
    const pages = [];
    let text = '';

    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
      const page = await doc.getPage(pageNumber);
      const textContent = await page.getTextContent({
        disableNormalization: false,
        includeMarkedContent: false,
      });

      const pageText = [];
      let lastY = null;

      for (const item of textContent.items) {
        if (!item || typeof item.str !== 'string') {
          continue;
        }

        const y = Array.isArray(item.transform) ? item.transform[5] : null;
        if (lastY !== null && y !== null && Math.abs(lastY - y) > 2) {
          pageText.push('\n');
        }

        pageText.push(item.str);

        if (item.hasEOL) {
          pageText.push('\n');
        } else {
          pageText.push(' ');
        }

        lastY = y;
      }

      const normalizedPageText = pageText.join('').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
      pages.push({
        num: pageNumber,
        text: normalizedPageText,
      });
      text += `${normalizedPageText}\n\n`;

      page.cleanup();
    }

    return {
      pages,
      text: text.trim(),
      total: doc.numPages,
    };
  }

  async destroy() {
    if (!this.doc) {
      return;
    }

    await this.doc.destroy();
    this.doc = null;
  }
}

async function createPdfParser(data) {
  return new PdfTextParser(data);
}

module.exports = {
  createPdfParser,
  ensurePdfRuntimeGlobals,
};
