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
const scannerViewport = document.querySelector('.scanner-viewport');
const scannerFallbackHost = document.querySelector('#scanner-fallback-host');
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

const VIN_BARCODE_FORMATS = ['code_39', 'code_128', 'pdf417'];
let scannerStream = null;
let scannerDetector = null;
let scannerLoopHandle = 0;
let scannerActive = false;
let scannerBusy = false;
let scannerMode = null;
let html5Scanner = null;

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

function normalizeVinCandidate(value) {
  const cleaned = String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  const match = cleaned.match(/[A-HJ-NPR-Z0-9]{17}/);
  return match ? match[0] : null;
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

function setScannerPresentation(mode) {
  scannerMode = mode;
  if (scannerViewport) {
    scannerViewport.classList.toggle('hidden', mode === 'html5');
  }
  if (scannerFallbackHost) {
    scannerFallbackHost.classList.toggle('hidden', mode !== 'html5');
  }
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

async function stopHtml5Scanner() {
  if (!html5Scanner) {
    if (scannerFallbackHost) {
      scannerFallbackHost.innerHTML = '';
    }
    return;
  }

  try {
    if (html5Scanner.isScanning) {
      await html5Scanner.stop();
    }
  } catch (_error) {
    // Ignore teardown errors and keep cleaning up.
  }

  try {
    html5Scanner.clear();
  } catch (_error) {
    // Ignore clear errors if the scanner surface is already gone.
  }

  html5Scanner = null;
  if (scannerFallbackHost) {
    scannerFallbackHost.innerHTML = '';
  }
}

async function closeScannerModal() {
  scannerActive = false;
  scannerBusy = false;
  cancelScannerLoop();
  stopScannerStream();
  await stopHtml5Scanner();
  if (scannerVideo) {
    scannerVideo.pause();
    scannerVideo.srcObject = null;
  }
  setScannerPresentation('native');
  if (scannerModal) {
    scannerModal.classList.add('hidden');
    scannerModal.setAttribute('aria-hidden', 'true');
  }
}

function isAppleMobileBrowser() {
  const agent = navigator.userAgent || '';
  return /iPhone|iPad|iPod/i.test(agent);
}

function getHtml5VinFormats() {
  const formats = window.Html5QrcodeSupportedFormats;
  if (!formats) {
    return undefined;
  }

  return [
    formats.CODE_39,
    formats.CODE_128,
    formats.PDF_417,
  ].filter((value) => value != null);
}

async function ensureScannerDetector() {
  if (scannerDetector) {
    return scannerDetector;
  }

  if (!('BarcodeDetector' in window)) {
    throw new Error('This browser does not support camera barcode scanning yet.');
  }

  let formats = VIN_BARCODE_FORMATS;
  if (typeof window.BarcodeDetector.getSupportedFormats === 'function') {
    const supported = await window.BarcodeDetector.getSupportedFormats();
    const filtered = VIN_BARCODE_FORMATS.filter((format) => supported.includes(format));
    if (!filtered.length) {
      throw new Error('This phone browser does not expose the VIN barcode formats we need.');
    }
    formats = filtered;
  }

  scannerDetector = new window.BarcodeDetector({ formats });
  return scannerDetector;
}

async function startHtml5FallbackScanner() {
  if (!window.Html5Qrcode) {
    throw new Error('The iPhone-compatible VIN scanner did not load correctly.');
  }
  if (!scannerFallbackHost) {
    throw new Error('Scanner surface is missing.');
  }

  setScannerPresentation('html5');
  scannerFallbackHost.innerHTML = '<div id="scanner-reader"></div>';

  const formatsToSupport = getHtml5VinFormats();
  html5Scanner = new window.Html5Qrcode('scanner-reader', {
    verbose: false,
    formatsToSupport,
    useBarCodeDetectorIfSupported: false,
  });

  const scanBox = (viewfinderWidth, viewfinderHeight) => ({
    width: Math.max(240, Math.floor(viewfinderWidth * 0.84)),
    height: Math.max(96, Math.floor(viewfinderHeight * 0.28)),
  });

  await html5Scanner.start(
    { facingMode: 'environment' },
    {
      fps: 10,
      qrbox: scanBox,
      aspectRatio: 1.333334,
      disableFlip: false,
    },
    async (decodedText) => {
      const vin = normalizeVinCandidate(decodedText);
      if (vin) {
        await processDetectedVin(vin);
      }
    },
    () => {
      // Ignore frame-level decode misses while scanning live.
    }
  );

  scannerActive = true;
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

async function scanFrame() {
  if (!scannerActive || !scannerVideo) {
    return;
  }

  if (scannerBusy || scannerVideo.readyState < 2) {
    scannerLoopHandle = requestAnimationFrame(scanFrame);
    return;
  }

  scannerBusy = true;
  try {
    const detector = await ensureScannerDetector();
    const barcodes = await detector.detect(scannerVideo);
    for (const barcode of barcodes) {
      const vin = normalizeVinCandidate(barcode?.rawValue || barcode?.displayValue || '');
      if (vin) {
        await processDetectedVin(vin);
        return;
      }
    }
  } catch (error) {
    setScannerStatus(error.message || 'VIN scan failed. Try typing the VIN instead.', true);
  } finally {
    scannerBusy = false;
  }

  if (scannerActive) {
    scannerLoopHandle = requestAnimationFrame(scanFrame);
  }
}

async function openScannerModal() {
  hideStatus(vinStatus);
  if (scannerModal) {
    scannerModal.classList.remove('hidden');
    scannerModal.setAttribute('aria-hidden', 'false');
  }
  setScannerPresentation('native');
  setScannerStatus('Point the camera at the VIN barcode and hold steady.');

  const shouldPreferHtml5Fallback = isAppleMobileBrowser() || !('BarcodeDetector' in window);

  if (shouldPreferHtml5Fallback) {
    try {
      setScannerStatus('Starting iPhone-compatible scanner...');
      await startHtml5FallbackScanner();
      setScannerStatus('Point the camera at the VIN barcode and hold steady.');
      return;
    } catch (error) {
      await closeScannerModal();
      showStatus(vinStatus, error.message || 'Could not start the VIN scanner on this phone.', true);
      return;
    }
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    if (window.Html5Qrcode) {
      try {
        setScannerStatus('Starting fallback VIN scanner...');
        await startHtml5FallbackScanner();
        setScannerStatus('Point the camera at the VIN barcode and hold steady.');
        return;
      } catch (error) {
        await closeScannerModal();
        showStatus(vinStatus, error.message || 'This device does not allow live camera access here.', true);
        return;
      }
    }
    await closeScannerModal();
    showStatus(vinStatus, 'This device does not allow live camera access here. Type the VIN manually.', true);
    return;
  }

  try {
    await ensureScannerDetector();
  } catch (error) {
    if (window.Html5Qrcode) {
      try {
        setScannerStatus('Starting fallback VIN scanner...');
        await startHtml5FallbackScanner();
        setScannerStatus('Point the camera at the VIN barcode and hold steady.');
        return;
      } catch (fallbackError) {
        await closeScannerModal();
        showStatus(vinStatus, fallbackError.message || error.message || 'VIN barcode scanning is not available on this browser.', true);
        return;
      }
    }
    await closeScannerModal();
    showStatus(vinStatus, error.message || 'VIN barcode scanning is not available on this browser.', true);
    return;
  }

  try {
    scannerStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });

    if (!scannerVideo) {
      throw new Error('Scanner video surface is missing.');
    }

    scannerVideo.srcObject = scannerStream;
    await scannerVideo.play();
    scannerActive = true;
    scannerMode = 'native';
    cancelScannerLoop();
    scannerLoopHandle = requestAnimationFrame(scanFrame);
  } catch (error) {
    if (window.Html5Qrcode) {
      try {
        stopScannerStream();
        setScannerStatus('Native camera access failed. Trying fallback scanner...');
        await startHtml5FallbackScanner();
        setScannerStatus('Point the camera at the VIN barcode and hold steady.');
        return;
      } catch (fallbackError) {
        await closeScannerModal();
        showStatus(vinStatus, fallbackError.message || error.message || 'Could not open the camera. Type the VIN manually.', true);
        return;
      }
    }
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

  const vin = vinInput.value.trim().toUpperCase();
  if (!vin) {
    showStatus(vinStatus, 'Enter a VIN first.', true);
    return;
  }

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
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && scannerActive) {
    void closeScannerModal();
  }
});
