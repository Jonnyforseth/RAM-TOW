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

let pdfParseModulePromise = null;

async function getPdfParseModule() {
  ensurePdfRuntimeGlobals();

  if (!pdfParseModulePromise) {
    pdfParseModulePromise = import('pdf-parse');
  }

  return pdfParseModulePromise;
}

async function createPdfParser(data) {
  const module = await getPdfParseModule();
  return new module.PDFParse({ data });
}

module.exports = {
  createPdfParser,
  ensurePdfRuntimeGlobals,
};
