const vinForm = document.querySelector('#vin-form');
const vinInput = document.querySelector('#vin-input');
const vinStatus = document.querySelector('#vin-status');
const vinResults = document.querySelector('#vin-results');
const detectedPills = document.querySelector('#detected-pills');
const stickerLink = document.querySelector('#sticker-link');
const towCapacity = document.querySelector('#tow-capacity');
const towDetail = document.querySelector('#tow-detail');
const payloadCapacity = document.querySelector('#payload-capacity');
const payloadDetail = document.querySelector('#payload-detail');
const vinScanButton = document.querySelector('#vin-scan-button');
const scannerModal = document.querySelector('#scanner-modal');
const scannerVideo = document.querySelector('#scanner-video');
const scannerStatus = document.querySelector('#scanner-status');
const scannerCloseButton = document.querySelector('#scanner-close');

const reverseForm = document.querySelector('#reverse-form');
const reverseStatus = document.querySelector('#reverse-status');
const reverseResults = document.querySelector('#reverse-results');
const hitchTypeInput = document.querySelector('#hitch-type');
const tongueWeightLabel = document.querySelector('#tongue-weight-label');
const reverseInputs = [
  document.querySelector('#trailer-weight'),
  document.querySelector('#tongue-weight'),
  hitchTypeInput,
  document.querySelector('#model-preference'),
];

const VIN_OCR_WHITELIST = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789:- ';
const VIN_OCR_INTERVAL_MS = 1200;
const VIN_CHECK_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
const VIN_TRANSLITERATION = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6,
  G: 7,
  H: 8,
  J: 1,
  K: 2,
  L: 3,
  M: 4,
  N: 5,
  P: 7,
  R: 9,
  S: 2,
  T: 3,
  U: 4,
  V: 5,
  W: 6,
  X: 7,
  Y: 8,
  Z: 9,
};
const VIN_OCR_SUBSTITUTIONS = {
  0: ['0', 'O', 'Q'],
  1: ['1', 'I', 'L'],
  2: ['2', 'Z'],
  4: ['4', 'A'],
  5: ['5', 'S'],
  6: ['6', 'G'],
  7: ['7', 'T'],
  8: ['8', 'B'],
  A: ['A', '4'],
  B: ['B', '8'],
  G: ['G', '6'],
  L: ['L', '1'],
  O: ['O', '0'],
  Q: ['Q', '0'],
  S: ['S', '5'],
  T: ['T', '7'],
  Z: ['Z', '2'],
};

let scannerStream = null;
let scannerLoopHandle = 0;
let scannerActive = false;
let scannerBusy = false;
let scannerLastAttemptAt = 0;
let scannerMissCount = 0;
let vinOcrWorker = null;
let vinOcrWorkerReady = null;

function renderInsight(item) {
  return `
    <article class="insight-card insight-${escapeHtml(item.type || 'note')}">
      <h4>${escapeHtml(item.title || 'Note')}</h4>
      <p>${escapeHtml(item.message || '')}</p>
    </article>
  `;
}

function showStatus(target, message, isError = false) {
  target.textContent = message;
  target.classList.remove('hidden', 'error');
  if (isError) {
    target.classList.add('error');
  } else {
    target.classList.remove('error');
  }
}

function hideStatus(target) {
  target.classList.add('hidden');
  target.textContent = '';
  target.classList.remove('error');
}

function resetReverseResults() {
  hideStatus(reverseStatus);
  reverseResults.classList.add('hidden');
  reverseResults.innerHTML = '';
}

function syncHitchTypeUi() {
  const hitchType = hitchTypeInput?.value || 'conventional';
  if (tongueWeightLabel) {
    tongueWeightLabel.textContent = hitchType === 'gooseneck' ? 'Pin Weight' : 'Tongue Weight';
  }
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatCapacity(value) {
  return value == null ? '-' : `${formatNumber(value)} lb`;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createPill(label, value) {
  const pill = document.createElement('div');
  pill.className = 'pill';
  pill.textContent = `${label}: ${value}`;
  return pill;
}

function renderDetectedSpec(spec) {
  detectedPills.innerHTML = '';
  const pairs = [
    ['Model', spec.model],
    ['Trim', spec.trim],
    ['Engine', spec.engine],
    ['Drive', spec.drive],
    ['Cab', spec.cab],
    ['Bed', spec.bed],
    ['Axle', spec.axleRatio],
    ['GVWR', spec.gvwr ? `${formatNumber(spec.gvwr)} lb` : null],
    ['Rear Wheels', spec.rearWheels],
  ].filter(([, value]) => value);

  for (const [label, value] of pairs) {
    detectedPills.appendChild(createPill(label, value));
  }
}

function renderPrimaryMatch(match, capacityNode, detailNode, kind) {
  if (!match) {
    capacityNode.textContent = 'No clear match';
    detailNode.textContent = 'Try another VIN or verify the sticker details.';
    return;
  }

  capacityNode.textContent = formatCapacity(kind === 'tow' ? match.maxTow : match.maxPayload);
  const lines = [
    `${match.model} ${match.cab} ${match.bed} ${match.drive}`,
    match.engine,
    match.axleRatio ? `Axle ${match.axleRatio}` : null,
    match.gvwr ? `GVWR ${formatNumber(match.gvwr)} lb` : null,
    match.gcwr ? `GCWR ${formatNumber(match.gcwr)} lb` : null,
    match.trim || match.trimHint ? `Trim hint: ${match.trim || match.trimHint}` : null,
  ].filter(Boolean);
  detailNode.innerHTML = lines.join('<br>');
}

function renderInventoryLink(row) {
  if (!row.inventoryLink?.url) {
    return `
      <div class="inventory-match">
        <span class="inventory-label">Perkins Inventory</span>
        <p>Open the RAM ${escapeHtml(row.model || '')} inventory page, then run any candidate VIN back through the lookup on the left.</p>
      </div>
    `;
  }

  const link = escapeHtml(row.inventoryLink.url);
  const applied = (row.inventoryLink.applied || []).map(escapeHtml).join(' &bull; ');

  return `
    <div class="inventory-match">
      <span class="inventory-label">Perkins Inventory</span>
      <p>${applied || 'Filtered to the closest available engine and drivetrain family on Perkins Motors.'}</p>
      <a href="${link}" target="_blank" rel="noreferrer">View filtered RAM ${escapeHtml(row.model || '')} inventory</a>
    </div>
  `;
}

function renderVinResponse(response) {
  stickerLink.href = response.pdfUrl;
  renderDetectedSpec(response.detectedSpec);
  renderPrimaryMatch(response.towMatch, towCapacity, towDetail, 'tow');
  renderPrimaryMatch(response.payloadMatch, payloadCapacity, payloadDetail, 'payload');
  vinResults.classList.remove('hidden');
}

function normalizeManualVin(value) {
  const cleaned = String(value || '')
    .toUpperCase()
    .replace(/[OQ]/g, '0')
    .replace(/[IL]/g, '1')
    .replace(/[^A-Z0-9]/g, '');

  return /^[A-HJ-NPR-Z0-9]{17}$/.test(cleaned) ? cleaned : null;
}

function transliterateVinCharacter(character) {
  if (/[0-9]/.test(character)) {
    return Number(character);
  }
  return VIN_TRANSLITERATION[character] ?? null;
}

function calculateVinCheckDigit(vin) {
  let total = 0;
  for (let index = 0; index < vin.length; index += 1) {
    const value = transliterateVinCharacter(vin[index]);
    if (value == null) {
      return null;
    }
    total += value * VIN_CHECK_WEIGHTS[index];
  }
  const remainder = total % 11;
  return remainder === 10 ? 'X' : String(remainder);
}

function isValidVin(vin) {
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin) && calculateVinCheckDigit(vin) === vin[8];
}

function scoreVinCandidate(vin, replacements) {
  let score = 100 - (replacements * 8);
  if (vin.startsWith('1C6') || vin.startsWith('3C6')) {
    score += 40;
  }
  return score;
}

function generateVinVariants(candidate) {
  const sanitized = String(candidate || '')
    .toUpperCase()
    .replace(/[|]/g, 'I')
    .replace(/[“”"]/g, '')
    .replace(/[‘’']/g, '')
    .replace(/[^A-Z0-9]/g, '');

  if (sanitized.length !== 17) {
    return [];
  }

  const positions = [];
  for (let index = 0; index < sanitized.length; index += 1) {
    const options = VIN_OCR_SUBSTITUTIONS[sanitized[index]];
    if (options?.length > 1) {
      positions.push({ index, options });
    }
  }

  const variants = new Map();
  const stack = [{ chars: sanitized.split(''), position: 0, replacements: 0 }];
  const maxReplacements = 3;
  const maxVariants = 48;

  while (stack.length && variants.size < maxVariants) {
    const current = stack.pop();
    const vin = current.chars.join('');
    if (/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
      const existing = variants.get(vin);
      if (existing == null || current.replacements < existing) {
        variants.set(vin, current.replacements);
      }
    }

    for (let offset = current.position; offset < positions.length; offset += 1) {
      if (current.replacements >= maxReplacements) {
        break;
      }

      const { index, options } = positions[offset];
      for (const option of options) {
        if (option === current.chars[index]) {
          continue;
        }
        const nextChars = current.chars.slice();
        nextChars[index] = option;
        stack.push({
          chars: nextChars,
          position: offset + 1,
          replacements: current.replacements + 1,
        });
      }
    }
  }

  return Array.from(variants.entries())
    .filter(([vin]) => isValidVin(vin))
    .map(([vin, replacements]) => ({ vin, replacements }));
}

function extractVinFromOcrText(value) {
  const text = String(value || '')
    .toUpperCase()
    .replace(/[|]/g, 'I')
    .replace(/[“”"]/g, '')
    .replace(/[‘’']/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const rawCandidates = [];
  const labeledMatches = text.match(/VIN[:\s-]*[A-Z0-9]{14,22}/g) || [];
  for (const match of labeledMatches) {
    const cleaned = match.replace(/^VIN[:\s-]*/i, '').replace(/[^A-Z0-9]/g, '');
    for (let index = 0; index <= cleaned.length - 17; index += 1) {
      rawCandidates.push(cleaned.slice(index, index + 17));
    }
  }

  const broadMatches = text.match(/[A-Z0-9]{17,22}/g) || [];
  for (const match of broadMatches) {
    const cleaned = match.replace(/[^A-Z0-9]/g, '');
    for (let index = 0; index <= cleaned.length - 17; index += 1) {
      rawCandidates.push(cleaned.slice(index, index + 17));
    }
  }

  let best = null;
  for (const candidate of rawCandidates) {
    for (const variant of generateVinVariants(candidate)) {
      const score = scoreVinCandidate(variant.vin, variant.replacements);
      if (!best || score > best.score) {
        best = { vin: variant.vin, score };
      }
    }
  }

  return best?.vin || null;
}

function setScannerStatus(message, isError = false) {
  if (!scannerStatus) {
    return;
  }
  scannerStatus.textContent = message;
  scannerStatus.style.color = isError ? '#f3b0a6' : 'rgba(246, 240, 231, 0.86)';
}

function cancelScannerLoop() {
  if (scannerLoopHandle) {
    cancelAnimationFrame(scannerLoopHandle);
    scannerLoopHandle = 0;
  }
}

function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(width));
  canvas.height = Math.max(1, Math.floor(height));
  return canvas;
}

function captureScannerFrameCanvas() {
  if (!scannerVideo || scannerVideo.readyState < 2 || !scannerVideo.videoWidth || !scannerVideo.videoHeight) {
    return null;
  }

  const canvas = createCanvas(scannerVideo.videoWidth, scannerVideo.videoHeight);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(scannerVideo, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function getOcrRegions(frameCanvas) {
  const width = frameCanvas.width;
  const height = frameCanvas.height;

  return [
    {
      left: width * 0.1,
      top: height * 0.42,
      width: width * 0.8,
      height: height * 0.16,
    },
    {
      left: width * 0.08,
      top: height * 0.38,
      width: width * 0.84,
      height: height * 0.22,
    },
    {
      left: width * 0.12,
      top: height * 0.46,
      width: width * 0.76,
      height: height * 0.12,
    },
  ];
}

function buildOcrCanvas(frameCanvas, region, mode = 'threshold') {
  const scale = 3;
  const canvas = createCanvas(region.width * scale, region.height * scale);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.imageSmoothingEnabled = false;
  context.filter = 'grayscale(1) contrast(1.45) brightness(1.08)';
  context.drawImage(
    frameCanvas,
    region.left,
    region.top,
    region.width,
    region.height,
    0,
    0,
    canvas.width,
    canvas.height
  );
  context.filter = 'none';

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  let min = 255;
  let max = 0;
  let total = 0;
  let samples = 0;

  for (let index = 0; index < data.length; index += 4) {
    const luminance = (data[index] * 0.299) + (data[index + 1] * 0.587) + (data[index + 2] * 0.114);
    min = Math.min(min, luminance);
    max = Math.max(max, luminance);
    total += luminance;
    samples += 1;
    data[index] = luminance;
    data[index + 1] = luminance;
    data[index + 2] = luminance;
  }

  const range = Math.max(1, max - min);
  const average = total / Math.max(1, samples);
  const threshold = Math.max(96, Math.min(204, average - 8));

  for (let index = 0; index < data.length; index += 4) {
    const normalized = ((data[index] - min) / range) * 255;
    let output = normalized;

    if (mode === 'threshold') {
      output = normalized > threshold ? 255 : 0;
    } else if (mode === 'invert-threshold') {
      output = normalized > threshold ? 0 : 255;
    } else if (mode === 'contrast') {
      output = normalized > 220 ? 255 : Math.max(0, Math.min(255, normalized * 1.1));
    }

    data[index] = output;
    data[index + 1] = output;
    data[index + 2] = output;
  }

  context.putImageData(imageData, 0, 0);
  return canvas;
}

function stopScannerStream() {
  if (!scannerStream) {
    return;
  }
  for (const track of scannerStream.getTracks()) {
    track.stop();
  }
  scannerStream = null;
}

async function ensureVinOcrWorker() {
  if (vinOcrWorker) {
    return vinOcrWorker;
  }

  if (vinOcrWorkerReady) {
    return vinOcrWorkerReady;
  }

  if (!window.Tesseract?.createWorker) {
    throw new Error('The VIN text reader did not load correctly.');
  }

  vinOcrWorkerReady = (async () => {
    const worker = await window.Tesseract.createWorker('eng', 1, {
      workerPath: '/vendor/tesseract-worker.min.js',
    });

    await worker.setParameters({
      tessedit_char_whitelist: VIN_OCR_WHITELIST,
      tessedit_pageseg_mode: '7',
      preserve_interword_spaces: '0',
      user_defined_dpi: '300',
    });

    vinOcrWorker = worker;
    return worker;
  })();

  try {
    return await vinOcrWorkerReady;
  } finally {
    vinOcrWorkerReady = null;
  }
}

async function terminateVinOcrWorker() {
  if (!vinOcrWorker) {
    return;
  }

  try {
    await vinOcrWorker.terminate();
  } catch (_error) {
    // Ignore worker teardown errors.
  }

  vinOcrWorker = null;
}

async function closeScannerModal() {
  scannerActive = false;
  scannerBusy = false;
  scannerLastAttemptAt = 0;
  scannerMissCount = 0;
  cancelScannerLoop();
  stopScannerStream();
  if (scannerVideo) {
    scannerVideo.pause();
    scannerVideo.srcObject = null;
  }
  if (scannerModal) {
    scannerModal.classList.add('hidden');
    scannerModal.setAttribute('aria-hidden', 'true');
  }
}

async function readVinTextFromCamera() {
  const frameCanvas = captureScannerFrameCanvas();
  if (!frameCanvas) {
    throw new Error('Camera frame is not ready yet. Hold steady for a second.');
  }

  const worker = await ensureVinOcrWorker();
  const regions = getOcrRegions(frameCanvas);
  const modes = ['threshold', 'contrast', 'invert-threshold'];

  for (const region of regions) {
    for (const mode of modes) {
      const preparedCanvas = buildOcrCanvas(frameCanvas, region, mode);
      const { data } = await worker.recognize(preparedCanvas);
      const vin = extractVinFromOcrText(data?.text || '');
      if (vin) {
        return vin;
      }
    }
  }

  throw new Error('Could not read a clean VIN from the printed label yet. Move closer and center only the printed VIN line inside the frame.');
}

async function processDetectedVin(vin) {
  await closeScannerModal();
  vinInput.value = vin;
  showStatus(vinStatus, `VIN scanned: ${vin}. Pulling sticker and matching the RAM charts...`);
  vinResults.classList.add('hidden');

  try {
    const response = await fetchJson(`/api/lookup-vin/${encodeURIComponent(vin)}`);
    hideStatus(vinStatus);
    renderVinResponse(response);
  } catch (error) {
    showStatus(vinStatus, error.message, true);
  }
}

async function scanVinTextLoop() {
  if (!scannerActive) {
    return;
  }

  scannerLoopHandle = requestAnimationFrame(scanVinTextLoop);

  if (scannerBusy || !scannerVideo || scannerVideo.readyState < 2) {
    return;
  }

  const now = performance.now();
  if (now - scannerLastAttemptAt < VIN_OCR_INTERVAL_MS) {
    return;
  }

  scannerLastAttemptAt = now;
  scannerBusy = true;

  try {
    const vin = await readVinTextFromCamera();
    setScannerStatus(`VIN found: ${vin}`);
    await processDetectedVin(vin);
  } catch (error) {
    scannerMissCount += 1;
    if (scannerMissCount === 1) {
      setScannerStatus('Reading the printed VIN text automatically...');
    } else if (scannerMissCount % 3 === 0) {
      setScannerStatus(error.message || 'Still reading... move closer and keep the VIN line level inside the frame.');
    }
  } finally {
    scannerBusy = false;
  }
}

async function openScannerModal() {
  hideStatus(vinStatus);
  if (scannerModal) {
    scannerModal.classList.remove('hidden');
    scannerModal.setAttribute('aria-hidden', 'false');
  }
  setScannerStatus('Starting camera...');

  if (!navigator.mediaDevices?.getUserMedia) {
    await closeScannerModal();
    showStatus(vinStatus, 'This device does not allow live camera access here. Type the VIN manually.', true);
    return;
  }

  try {
    scannerStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    });

    if (!scannerVideo) {
      throw new Error('Scanner video surface is missing.');
    }

    scannerVideo.srcObject = scannerStream;
    await scannerVideo.play();
    scannerActive = true;
    scannerBusy = false;
    scannerMissCount = 0;
    scannerLastAttemptAt = 0;
    cancelScannerLoop();
    setScannerStatus('Center the printed VIN line inside the frame. We will read it automatically.');
    scannerLoopHandle = requestAnimationFrame(scanVinTextLoop);
  } catch (error) {
    await closeScannerModal();
    showStatus(vinStatus, error.message || 'Could not open the camera. Type the VIN manually.', true);
  }
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const raw = await response.text();
  let payload = null;

  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch (_error) {
    const snippet = raw
      .replace(/\s+/g, ' ')
      .replace(/<[^>]+>/g, '')
      .trim()
      .slice(0, 180);
    throw new Error(snippet || `Request failed with ${response.status}.`);
  }

  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || `Request failed with ${response.status}.`);
  }
  return payload;
}

vinForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideStatus(vinStatus);
  vinResults.classList.add('hidden');

  const vin = normalizeManualVin(vinInput.value);
  if (!vin) {
    showStatus(vinStatus, 'Enter a valid 17-character VIN first.', true);
    return;
  }

  vinInput.value = vin;
  showStatus(vinStatus, 'Pulling sticker and matching the RAM charts...');

  try {
    const response = await fetchJson(`/api/lookup-vin/${encodeURIComponent(vin)}`);
    hideStatus(vinStatus);
    renderVinResponse(response);
  } catch (error) {
    showStatus(vinStatus, error.message, true);
  }
});

if (vinScanButton) {
  vinScanButton.addEventListener('click', () => {
    void openScannerModal();
  });
}

if (scannerCloseButton) {
  scannerCloseButton.addEventListener('click', () => {
    void closeScannerModal();
  });
}

if (scannerModal) {
  scannerModal.addEventListener('click', (event) => {
    if (event.target === scannerModal) {
      void closeScannerModal();
    }
  });
}

reverseForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  resetReverseResults();

  showStatus(reverseStatus, 'Building the minimum RAM setups that clear your trailer...');

  try {
    const payload = {
      trailerWeight: Number(document.querySelector('#trailer-weight').value),
      tongueWeight: Number(document.querySelector('#tongue-weight').value),
      hitchType: hitchTypeInput?.value || 'conventional',
      modelPreference: document.querySelector('#model-preference').value,
    };

    const response = await fetchJson('/api/reverse-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    hideStatus(reverseStatus);
    reverseResults.classList.remove('hidden');

    const insights = response.insights || [];
    for (const item of insights) {
      reverseResults.insertAdjacentHTML('beforeend', renderInsight(item));
    }

    const recommendations = response.results || [];

    if (!recommendations.length) {
      const card = document.createElement('article');
      card.className = 'alternate-card';
      card.innerHTML = '<h4>No chart match found</h4><p>No 2026 RAM chart setup clears that trailer and tongue-weight combination with this filter. Try a larger RAM class or adjust the trailer inputs.</p>';
      reverseResults.appendChild(card);
      return;
    }

    for (const row of recommendations) {
      const card = document.createElement('article');
      card.className = 'alternate-card';
      card.innerHTML = `
        <h4>${escapeHtml(row.recommendationTitle || `RAM ${row.model}`)}</h4>
        <p class="recommendation-kicker">RAM ${escapeHtml(row.model || '')} &bull; ${escapeHtml(row.engine || '-')} &bull; ${escapeHtml(row.drive || '-')}</p>
        <p>Minimum build: ${escapeHtml(row.cab || '-')} ${escapeHtml(row.bed || '')}${row.rearWheels ? ` &bull; ${escapeHtml(row.rearWheels)}` : ''}${row.axleRatio ? ` &bull; Axle ${escapeHtml(row.axleRatio)}` : ''}</p>
        <p>Towing Capacity: ${formatCapacity(row.maxTow)} &bull; Payload Capacity: ${formatCapacity(row.maxPayload)}</p>
        <p>Chart setup: GCWR ${row.towGCWR ? formatNumber(row.towGCWR) : '-'} lb &bull; GVWR ${row.payloadGVWR ? formatNumber(row.payloadGVWR) : '-'} lb</p>
        <p>Headroom: ${formatCapacity(row.towSurplus)} tow &bull; ${formatCapacity(row.payloadSurplus)} payload</p>
        ${renderInventoryLink(row)}
        <span class="confidence">Verify the VIN in the decoder to confirm axle ratio and exact truck configuration before you buy.</span>
      `;
      reverseResults.appendChild(card);
    }
  } catch (error) {
    showStatus(reverseStatus, error.message, true);
  }
});

for (const input of reverseInputs) {
  if (!input) {
    continue;
  }

  input.addEventListener('input', resetReverseResults);
  input.addEventListener('change', resetReverseResults);
}

if (hitchTypeInput) {
  hitchTypeInput.addEventListener('change', syncHitchTypeUi);
}

syncHitchTypeUi();

window.addEventListener('pageshow', () => {
  resetReverseResults();
  syncHitchTypeUi();
});

window.addEventListener('beforeunload', () => {
  void closeScannerModal();
  void terminateVinOcrWorker();
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && scannerActive) {
    void closeScannerModal();
  }
});
