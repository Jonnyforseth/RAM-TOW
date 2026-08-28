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
const vinScanModal = document.querySelector('#vin-scan-modal');
const vinScanCloseButton = document.querySelector('#vin-scan-close');
const vinScanModalStatus = document.querySelector('#vin-scan-modal-status');
const vinScanVideo = document.querySelector('#vin-scan-video');
const vinRefinement = document.querySelector('#vin-refinement');
const vinBedField = document.querySelector('#vin-bed-field');
const vinBedSelect = document.querySelector('#vin-bed-select');
const vinRamBoxField = document.querySelector('#vin-rambox-field');
const vinRamBoxSelect = document.querySelector('#vin-rambox-select');
const vinAxleField = document.querySelector('#vin-axle-field');
const vinAxleSelect = document.querySelector('#vin-axle-select');
const vinGvwrField = document.querySelector('#vin-gvwr-field');
const vinGvwrSelect = document.querySelector('#vin-gvwr-select');
const vinPerkinsCta = document.querySelector('#vin-perkins-cta');
const vinPerkinsTitle = document.querySelector('#vin-perkins-title');
const vinPerkinsCopy = document.querySelector('#vin-perkins-copy');
const vinPerkinsLink = document.querySelector('#vin-perkins-link');
const vinTradeCta = document.querySelector('#vin-trade-cta');
const vinTradeCopy = document.querySelector('#vin-trade-copy');
const vinTradeLink = document.querySelector('#vin-trade-link');
const vinUnitControl = document.querySelector('#vin-unit-control');
const vinUnitButtons = [...document.querySelectorAll('[data-vin-unit]')];
const vinLeadForm = document.querySelector('#vin-lead-form');
const vinLeadStatus = document.querySelector('#vin-lead-status');
const vinLeadName = document.querySelector('#vin-lead-name');
const vinLeadZip = document.querySelector('#vin-lead-zip');
const vinLeadEmail = document.querySelector('#vin-lead-email');
const vinLeadPhone = document.querySelector('#vin-lead-phone');
const vinLeadPreference = document.querySelector('#vin-lead-preference');
const vinLeadMessage = document.querySelector('#vin-lead-message');
const vinLeadConsent = document.querySelector('#vin-lead-consent');
const vinLeadCompany = document.querySelector('#vin-lead-company');

const reverseForm = document.querySelector('#reverse-form');
const reverseStatus = document.querySelector('#reverse-status');
const reverseResults = document.querySelector('#reverse-results');
const hitchTypeInput = document.querySelector('#hitch-type');
const tongueWeightLabel = document.querySelector('#tongue-weight-label');
const trailerWeightInput = document.querySelector('#trailer-weight');
const tongueWeightInput = document.querySelector('#tongue-weight');
const modelPreferenceInput = document.querySelector('#model-preference');
const reverseInputs = [
  trailerWeightInput,
  tongueWeightInput,
  hitchTypeInput,
  modelPreferenceInput,
];

const TRAILER_TARGET_STORAGE_KEY = 'ramTowTrailerTarget';

function trackAnalytics(eventName, parameters = {}) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, parameters);
  }
}

function trackPerkinsInventoryClick(event) {
  const link = event.target.closest('[data-perkins-inventory-click]');
  if (!link) {
    return;
  }

  trackAnalytics('perkins_inventory_click', {
    inventory_context: link.dataset.perkinsInventoryClick || 'unknown',
    ram_model: link.dataset.ramModel || 'unknown',
  });
}

const VIN_OCR_WHITELIST = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789:- ';
const VIN_CHECK_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
const VIN_MODEL_YEAR_CODES = {
  A: 2010, B: 2011, C: 2012, D: 2013, E: 2014, F: 2015, G: 2016,
  H: 2017, J: 2018, K: 2019, L: 2020, M: 2021, N: 2022, P: 2023,
  R: 2024, S: 2025, T: 2026, V: 2027, W: 2028, X: 2029, Y: 2030,
};
const VIN_SCAN_FRAME = { left: 0.08, top: 0.24, width: 0.84, height: 0.52 };
const VIN_SCAN_OCR_INTERVAL_MS = 1400;
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

let vinOcrWorker = null;
let vinOcrWorkerReady = null;
let vinScanReader = null;
let vinScanControls = null;
let vinScanSessionToken = 0;
let vinScanOcrTimeout = null;
let vinScanOcrRunning = false;
let vinScanResultLocked = false;
let vinBaseSpec = null;
let vinOverrideOptions = null;
let vinRefinementRequest = 0;
let vinRefinementAvailable = false;
let vinTradeRequest = 0;
let vinMeasurementUnit = 'lb';
let vinLastResponse = null;
let vinDisplayedSpec = null;

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

function formatCapacityRange(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return '-';
  }
  if (min === max) {
    return formatCapacity(min);
  }
  return `${formatNumber(min)}-${formatNumber(max)} lb`;
}

function formatCurrency(value) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
    : '-';
}

function formatVinMass(value) {
  const pounds = Number(value);
  if (!Number.isFinite(pounds)) {
    return '-';
  }
  if (vinMeasurementUnit === 'kg') {
    return `${formatNumber(Math.round(pounds * 0.45359237))} kg`;
  }
  return `${formatNumber(pounds)} lb`;
}

function formatVinMassRange(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return '-';
  }
  if (min === max) {
    return formatVinMass(min);
  }
  if (vinMeasurementUnit === 'kg') {
    return `${formatNumber(Math.round(min * 0.45359237))}-${formatNumber(Math.round(max * 0.45359237))} kg`;
  }
  return `${formatNumber(min)}-${formatNumber(max)} lb`;
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
    ['Engine', spec.displayEngine || spec.engine],
    ['Drive', spec.drive],
    ['Cab', spec.cab],
    ['Bed', spec.bed],
    ['Axle', spec.axleRatio],
    ['Market', spec.market === 'CA' ? 'Canada' : null],
    ['GVWR', spec.gvwr ? formatVinMass(spec.gvwr) : null],
    ['Chart GVWR', !spec.gvwr && spec.inferredGvwr ? formatVinMass(spec.inferredGvwr) : null],
    ['Rear Wheels', spec.rearWheels],
  ].filter(([, value]) => value);

  for (const [label, value] of pairs) {
    detectedPills.appendChild(createPill(label, value));
  }
}

function displayMatchedEngine(match, detectedSpec) {
  // Older RAM chart rows use an eTorque family label for both 5.7L variants.
  // The sticker-derived display value preserves whether this particular truck
  // is the standard HEMI or the eTorque model.
  if (match?.engine === '5.7L HEMI V8 eTorque' && detectedSpec?.displayEngine) {
    return detectedSpec.displayEngine;
  }
  return match?.engine || detectedSpec?.displayEngine || detectedSpec?.engine || null;
}

function renderPrimaryMatch(match, capacityNode, detailNode, kind, summary, detectedSpec) {
  if (summary?.selectionMismatch) {
    capacityNode.textContent = 'No chart row';
    detailNode.innerHTML = `<span class="metric-note">${escapeHtml(summary.note)}</span>`;
    return;
  }

  if (!match) {
    capacityNode.textContent = 'No clear match';
    detailNode.textContent = 'Try another VIN or verify the sticker details.';
    return;
  }

  const showRange = summary?.isRange && Number.isFinite(summary?.min) && Number.isFinite(summary?.max);
  const resolvedGvwr = detectedSpec?.gvwr || detectedSpec?.inferredGvwr;
  capacityNode.textContent = showRange
    ? formatVinMassRange(summary.min, summary.max).toUpperCase()
    : formatVinMass(kind === 'tow' ? match.maxTow : match.maxPayload).toUpperCase();

  const canShowAxle = match.axleRatio && (!showRange || detectedSpec?.axleRatio);
  const canShowGvwr = match.gvwr && (!showRange || resolvedGvwr);
  const canShowGcwr = match.gcwr && !showRange;
  const lines = [
    `${detectedSpec?.year || 'RAM'} ${match.model} ${match.cab} ${match.bed} ${match.drive}`,
    displayMatchedEngine(match, detectedSpec),
    canShowAxle ? `Axle ${match.axleRatio}` : null,
    canShowGvwr ? `${detectedSpec?.inferredGvwr && !detectedSpec?.gvwr ? 'Chart GVWR' : 'GVWR'} ${formatVinMass(match.gvwr)}` : null,
    canShowGcwr ? `GCWR ${formatVinMass(match.gcwr)}` : null,
    match.trim || match.trimHint ? `Trim hint: ${match.trim || match.trimHint}` : null,
    (showRange || match.canadianTrimFallback) ? `<span class="metric-note">${escapeHtml(summary.note || 'Confirm the exact axle ratio and door-sticker GVWR before towing.')}</span>` : null,
  ].filter(Boolean);
  detailNode.innerHTML = lines.join('<br>');
}

function getTrailerTarget() {
  const trailerWeight = Number(trailerWeightInput?.value);
  const tongueWeight = Number(tongueWeightInput?.value);

  if (!Number.isFinite(trailerWeight) || trailerWeight <= 0 || !Number.isFinite(tongueWeight) || tongueWeight <= 0) {
    return null;
  }

  return {
    trailerWeight,
    tongueWeight,
    hitchType: hitchTypeInput?.value || 'conventional',
    modelPreference: modelPreferenceInput?.value || '',
  };
}

function saveTrailerTarget(target = getTrailerTarget()) {
  if (!target) {
    return;
  }

  try {
    sessionStorage.setItem(TRAILER_TARGET_STORAGE_KEY, JSON.stringify(target));
  } catch (_error) {
    // The calculator works normally if browser storage is unavailable.
  }
}

function formatTrailerTarget(target) {
  return `Target: ${formatCapacity(target.trailerWeight)} tow / ${formatCapacity(target.tongueWeight)} payload`;
}

function trailerTargetDataAttributes(target) {
  if (!target) {
    return '';
  }
  return `data-trailer-weight="${escapeHtml(target.trailerWeight)}" data-tongue-weight="${escapeHtml(target.tongueWeight)}" data-hitch-type="${escapeHtml(target.hitchType || 'conventional')}" data-model-preference="${escapeHtml(target.modelPreference || '')}"`;
}

function renderInventoryLink(row, target = null) {
  if (!row.inventoryLink?.url) {
    return `
      <div class="inventory-match">
        <span class="inventory-label">Inventory connections powered by Perkins Motors</span>
        <p>Open the RAM ${escapeHtml(row.model || '')} inventory page, then run any candidate VIN back through the lookup on the left.</p>
      </div>
    `;
  }

  const link = escapeHtml(row.inventoryLink.url);
  const applied = (row.inventoryLink.applied || []).map(escapeHtml).join(' &bull; ');

  return `
    <div class="inventory-match">
      <span class="inventory-label">Inventory connections powered by Perkins Motors</span>
      <p>${applied || 'Filtered to the closest available engine and drivetrain family on Perkins Motors.'}</p>
      ${target ? `<p class="inventory-target">${escapeHtml(formatTrailerTarget(target))}</p>` : ''}
      <a class="button button-secondary inventory-button" href="${link}" target="_blank" rel="noreferrer" data-perkins-inventory-click="trailer_recommendation" data-ram-model="${escapeHtml(row.model || '')}" ${trailerTargetDataAttributes(target)}>Shop matching RAM ${escapeHtml(row.model || '')}s</a>
      <p class="inventory-verify">Verify any candidate VIN in RAM Tow before purchase.</p>
    </div>
  `;
}

function renderVinPerkinsCta(response, spec) {
  const exactInventory = response.perkinsExactInventory;
  const link = exactInventory?.inventoryUrl ? { url: exactInventory.inventoryUrl } : response.perkinsInventoryLink;
  if (!link?.url || !vinPerkinsCta || !vinPerkinsLink) {
    vinPerkinsCta?.classList.add('hidden');
    return;
  }

  const isExactInventory = Boolean(exactInventory?.inventoryUrl);
  const isUsedInventory = !isExactInventory && link?.inventoryType === 'used';
  const description = [spec?.model ? `RAM ${spec.model}` : null, spec?.engine, spec?.drive, spec?.cab, spec?.bed]
    .filter(Boolean)
    .join(' | ');
  vinPerkinsTitle.textContent = isExactInventory
    ? 'This Truck Is Available at Perkins Motors'
    : 'See Comparable Trucks at Perkins Motors';
  vinPerkinsCopy.textContent = isExactInventory
    ? `${exactInventory.condition === 'new' ? 'This new RAM is' : 'This RAM is'} in stock at Perkins Motors${exactInventory.stockNumber ? `, stock ${exactInventory.stockNumber}` : ''}, listed at ${formatCurrency(exactInventory.currentPrice)}.${exactInventory.mileage != null && exactInventory.condition !== 'new' ? ` ${formatNumber(exactInventory.mileage)} miles.` : ''}`
    : isUsedInventory
    ? `View current used RAM ${spec?.model || ''} inventory at Perkins Motors.`
    : description
    ? `View current Perkins inventory filtered to this setup: ${description}.`
    : 'View the closest current Perkins inventory filters for this RAM setup.';
  vinPerkinsLink.href = link.url;
  vinPerkinsLink.dataset.perkinsInventoryClick = isExactInventory ? 'vin_lookup_exact_stock' : 'vin_lookup_setup';
  vinPerkinsLink.dataset.ramModel = spec?.model || '';
  vinPerkinsLink.textContent = isExactInventory
    ? 'View This Truck at Perkins Motors'
    : 'See Comparable Trucks at Perkins Motors';
  vinPerkinsCta.classList.remove('hidden');
}

function setTradeCtaVisible(isVisible) {
  vinTradeCta?.classList.toggle('hidden', !isVisible);
}

function getDisplayedCapacity(summary, match, key) {
  const summaryMaximum = Number(summary?.max);
  if (Number.isFinite(summaryMaximum) && summaryMaximum > 0) {
    return summaryMaximum;
  }
  const capacity = Number(key === 'tow' ? match?.maxTow : match?.maxPayload);
  return Number.isFinite(capacity) && capacity > 0 ? capacity : null;
}

async function refreshVinTradeCta(response) {
  const target = getTrailerTarget();
  const requestId = ++vinTradeRequest;
  const towCapacityValue = getDisplayedCapacity(response.towSummary, response.towMatch, 'tow');
  const payloadCapacityValue = getDisplayedCapacity(response.payloadSummary, response.payloadMatch, 'payload');

  if (!target || (!towCapacityValue && !payloadCapacityValue)) {
    setTradeCtaVisible(false);
    return;
  }

  const truckFallsShort =
    (towCapacityValue && target.trailerWeight > towCapacityValue) ||
    (payloadCapacityValue && target.tongueWeight > payloadCapacityValue);

  if (!truckFallsShort) {
    setTradeCtaVisible(false);
    return;
  }

  setTradeCtaVisible(false);
  try {
    const tradeResponse = await fetchJson('/api/reverse-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(target),
    });
    if (requestId !== vinTradeRequest) {
      return;
    }

    const upgrade = (tradeResponse.results || []).find((row) => row.inventoryLink?.url);
    if (!upgrade || !vinTradeLink || !vinTradeCopy) {
      setTradeCtaVisible(false);
      return;
    }

    vinTradeCopy.textContent = `Your current RAM falls short of ${formatTrailerTarget(target).replace('Target: ', '')}. See a RAM ${upgrade.model} setup at Perkins Motors that clears it.`;
    vinTradeLink.href = upgrade.inventoryLink.url;
    vinTradeLink.dataset.perkinsInventoryClick = 'vin_lookup_upgrade';
    vinTradeLink.dataset.ramModel = upgrade.model || '';
    vinTradeLink.setAttribute('data-trailer-weight', String(target.trailerWeight));
    vinTradeLink.setAttribute('data-tongue-weight', String(target.tongueWeight));
    vinTradeLink.setAttribute('data-hitch-type', target.hitchType);
    vinTradeLink.setAttribute('data-model-preference', target.modelPreference || '');
    setTradeCtaVisible(true);
  } catch (_error) {
    if (requestId === vinTradeRequest) {
      setTradeCtaVisible(false);
    }
  }
}

document.addEventListener('click', trackPerkinsInventoryClick);

function renderRefinementOptions(select, values, selectedValue, placeholder, formatValue = (value) => value) {
  const selected = selectedValue == null ? '' : String(selectedValue);
  select.innerHTML = [
    `<option value="">${escapeHtml(placeholder)}</option>`,
    ...values.map((value) => `<option value="${escapeHtml(value)}"${String(value) === selected ? ' selected' : ''}>${escapeHtml(formatValue(value))}</option>`),
  ].join('');
}

function renderVinRefinement(response, spec) {
  const bedOptions = vinOverrideOptions?.bed || [];
  const ramBoxOptions = vinOverrideOptions?.ramBox || [];
  const axleOptions = vinOverrideOptions?.axleRatio || [];
  const gvwrOptions = vinOverrideOptions?.gvwr || [];
  const showBed = vinRefinementAvailable && !vinBaseSpec?.bed && bedOptions.length > 1;
  const showRamBox = vinRefinementAvailable && vinBaseSpec?.ramBox == null && ramBoxOptions.length > 1;
  const showAxle = vinRefinementAvailable && !vinBaseSpec?.axleRatio && axleOptions.length > 1;
  const showGvwr = vinRefinementAvailable && !vinBaseSpec?.gvwr && gvwrOptions.length > 1;

  if (!vinRefinementAvailable || (!showBed && !showRamBox && !showAxle && !showGvwr)) {
    vinRefinement.classList.add('hidden');
    return;
  }

  vinBedField.classList.toggle('hidden', !showBed);
  vinRamBoxField.classList.toggle('hidden', !showRamBox);
  vinAxleField.classList.toggle('hidden', !showAxle);
  vinGvwrField.classList.toggle('hidden', !showGvwr);

  if (showAxle) {
    renderRefinementOptions(vinAxleSelect, axleOptions, spec.axleRatio, 'Select axle ratio');
  }
  if (showGvwr) {
    renderRefinementOptions(vinGvwrSelect, gvwrOptions, spec.gvwr, 'Select GVWR', (value) => formatVinMass(Number(value)));
  }

  vinRefinement.classList.remove('hidden');
}

function renderVinResponse(response, detectedSpec = response.detectedSpec) {
  vinLastResponse = response;
  vinDisplayedSpec = detectedSpec;
  vinUnitControl?.classList.toggle('hidden', detectedSpec?.market !== 'CA');
  if (response.pdfUrl) {
    stickerLink.href = response.pdfUrl;
  }
  stickerLink?.classList.toggle('hidden', !response.pdfUrl);
  renderDetectedSpec(detectedSpec);
  renderPrimaryMatch(response.towMatch, towCapacity, towDetail, 'tow', response.towSummary, detectedSpec);
  renderPrimaryMatch(response.payloadMatch, payloadCapacity, payloadDetail, 'payload', response.payloadSummary, detectedSpec);
  renderVinRefinement(response, detectedSpec);
  renderVinPerkinsCta(response, detectedSpec);
  void refreshVinTradeCta(response);
  vinResults.classList.remove('hidden');

  if (detectedSpec?.stickerAvailable === false) {
    showStatus(
      vinStatus,
      detectedSpec?.market === 'CA'
        ? 'The Canadian window sticker was not available from Chrysler. This result uses the VIN decode and needs door-sticker confirmation for any unresolved chart details.'
        : 'Chrysler did not return a window sticker for this VIN. This result uses the VIN decode for cab, engine, drive, and bed, then falls back to the safest matching chart row until axle ratio and exact sticker data can be confirmed.'
    );
  }
}

function showVinLookupResponse(response) {
  vinMeasurementUnit = 'lb';
  for (const button of vinUnitButtons) {
    const isSelected = button.dataset.vinUnit === vinMeasurementUnit;
    button.classList.toggle('is-active', isSelected);
    button.setAttribute('aria-pressed', String(isSelected));
  }
  vinBaseSpec = { ...response.detectedSpec };
  vinOverrideOptions = response.overrideOptions || {};
  vinRefinementAvailable = Boolean(
    (!vinBaseSpec.bed && vinOverrideOptions.bed?.length > 1) ||
    (vinBaseSpec.ramBox == null && vinOverrideOptions.ramBox?.length > 1) ||
    (!vinBaseSpec.axleRatio && vinOverrideOptions.axleRatio?.length > 1) ||
    (!vinBaseSpec.gvwr && vinOverrideOptions.gvwr?.length > 1)
  );
  renderVinResponse(response, vinBaseSpec);
  trackAnalytics('vin_lookup_complete', {
    chart_year: Number(response.chartYear) || undefined,
    ram_model: String(vinBaseSpec.model || 'unknown'),
    chart_match: Boolean(response.towSummary?.value || response.towMatch),
  });
}

for (const button of vinUnitButtons) {
  button.addEventListener('click', () => {
    const unit = button.dataset.vinUnit;
    if (unit !== 'lb' && unit !== 'kg') {
      return;
    }
    vinMeasurementUnit = unit;
    for (const unitButton of vinUnitButtons) {
      const isSelected = unitButton.dataset.vinUnit === unit;
      unitButton.classList.toggle('is-active', isSelected);
      unitButton.setAttribute('aria-pressed', String(isSelected));
    }
    if (vinLastResponse && vinDisplayedSpec) {
      renderVinResponse(vinLastResponse, vinDisplayedSpec);
    }
  });
}

async function refineVinCapacity() {
  if (!vinBaseSpec) {
    return;
  }

  const requestId = ++vinRefinementRequest;
  const isVisibleRefinement = (field) => field && !field.classList.contains('hidden');
  const selectedBed = isVisibleRefinement(vinBedField) && vinBedSelect?.value
    ? vinBedSelect.value
    : vinBaseSpec.bed;
  const selectedRamBox = isVisibleRefinement(vinRamBoxField) && vinRamBoxSelect?.value !== ''
    ? vinRamBoxSelect.value === 'true'
    : vinBaseSpec.ramBox;
  const selectedAxleRatio = isVisibleRefinement(vinAxleField) && vinAxleSelect?.value
    ? vinAxleSelect.value
    : vinBaseSpec.axleRatio;
  const selectedGvwr = isVisibleRefinement(vinGvwrField) && vinGvwrSelect?.value
    ? Number(vinGvwrSelect.value)
    : vinBaseSpec.gvwr;
  const spec = {
    ...vinBaseSpec,
    bed: selectedBed,
    ramBox: selectedRamBox,
    axleRatio: selectedAxleRatio,
    gvwr: selectedGvwr,
  };

  showStatus(vinStatus, 'Refining the RAM chart match...');

  try {
    const response = await fetchJson('/api/match-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(spec),
    });
    if (requestId !== vinRefinementRequest) {
      return;
    }

    hideStatus(vinStatus);
    renderVinResponse(response, { ...vinBaseSpec, ...response.spec });
  } catch (error) {
    if (requestId === vinRefinementRequest) {
      showStatus(vinStatus, error.message, true);
    }
  }
}

function normalizeManualVin(value) {
  const cleaned = String(value || '')
    .toUpperCase()
    .replace(/[OQ]/g, '0')
    .replace(/I/g, '1')
    .replace(/[^A-Z0-9]/g, '');

  return /^[A-HJ-NPR-Z0-9]{17}$/.test(cleaned) ? cleaned : null;
}

function getVinModelYear(vin) {
  return VIN_MODEL_YEAR_CODES[String(vin || '').toUpperCase()[9]] || null;
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
  if (vin.includes('RAM')) {
    score += 4;
  }
  return score;
}

function generateVinVariants(candidate) {
  const sanitized = String(candidate || '')
    .toUpperCase()
    .replace(/[|]/g, 'I')
    .replace(/["']/g, '')
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

function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(width));
  canvas.height = Math.max(1, Math.floor(height));
  return canvas;
}

function clampRegion(region, width, height) {
  const left = Math.max(0, Math.min(width - 1, region.left));
  const top = Math.max(0, Math.min(height - 1, region.top));
  const right = Math.max(left + 1, Math.min(width, region.left + region.width));
  const bottom = Math.max(top + 1, Math.min(height, region.top + region.height));

  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
  };
}

function stopVinScanVideoStream() {
  const stream = vinScanVideo?.srcObject;
  if (stream?.getTracks) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
  }

  if (vinScanVideo) {
    vinScanVideo.pause?.();
    vinScanVideo.srcObject = null;
    vinScanVideo.removeAttribute('src');
  }
}

function stopVinLiveScanner() {
  vinScanSessionToken += 1;
  vinScanResultLocked = false;
  vinScanOcrRunning = false;

  if (vinScanOcrTimeout) {
    clearTimeout(vinScanOcrTimeout);
    vinScanOcrTimeout = null;
  }

  if (vinScanControls?.stop) {
    try {
      vinScanControls.stop();
    } catch (_error) {
      // Ignore scanner stop errors.
    }
  }

  vinScanControls = null;
  vinScanReader = null;
  stopVinScanVideoStream();
}

function closeVinScanModal() {
  stopVinLiveScanner();
  hideStatus(vinScanModalStatus);
  vinScanModal?.classList.add('hidden');
  vinScanModal?.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

function buildLiveScanFrameCanvas() {
  if (!vinScanVideo || vinScanVideo.readyState < 2) {
    return null;
  }

  const videoWidth = vinScanVideo.videoWidth || 0;
  const videoHeight = vinScanVideo.videoHeight || 0;
  if (!videoWidth || !videoHeight) {
    return null;
  }

  const region = clampRegion({
    left: videoWidth * VIN_SCAN_FRAME.left,
    top: videoHeight * VIN_SCAN_FRAME.top,
    width: videoWidth * VIN_SCAN_FRAME.width,
    height: videoHeight * VIN_SCAN_FRAME.height,
  }, videoWidth, videoHeight);

  const canvas = createCanvas(region.width, region.height);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(
    vinScanVideo,
    region.left,
    region.top,
    region.width,
    region.height,
    0,
    0,
    canvas.width,
    canvas.height
  );
  return canvas;
}

async function completeVinLiveScan(vin, sourceLabel) {
  if (vinScanResultLocked) {
    return;
  }

  vinScanResultLocked = true;
  showStatus(vinScanModalStatus, `VIN found from ${sourceLabel}. Loading towing data...`);
  closeVinScanModal();
  await processDetectedVin(vin);
}

function scheduleVinLiveOcr(sessionToken, delay = VIN_SCAN_OCR_INTERVAL_MS) {
  if (vinScanOcrTimeout) {
    clearTimeout(vinScanOcrTimeout);
  }

  vinScanOcrTimeout = window.setTimeout(async () => {
    if (sessionToken !== vinScanSessionToken || vinScanResultLocked || vinScanOcrRunning) {
      if (sessionToken === vinScanSessionToken && !vinScanResultLocked) {
        scheduleVinLiveOcr(sessionToken, delay);
      }
      return;
    }

    const frameCanvas = buildLiveScanFrameCanvas();
    if (!frameCanvas) {
      scheduleVinLiveOcr(sessionToken, delay);
      return;
    }

    vinScanOcrRunning = true;

    try {
      const barcodeVin = await readVinFromBarcodeCanvas(frameCanvas);
      if (barcodeVin) {
        await completeVinLiveScan(barcodeVin, 'barcode');
        return;
      }

      const textVin = await readVinFromCanvas(frameCanvas);
      if (textVin) {
        await completeVinLiveScan(textVin, 'VIN text');
        return;
      }
    } catch (_error) {
      // Keep scanning until a valid VIN is found or the user closes the modal.
    } finally {
      vinScanOcrRunning = false;
    }

    if (sessionToken === vinScanSessionToken && !vinScanResultLocked) {
      scheduleVinLiveOcr(sessionToken, delay);
    }
  }, delay);
}

async function startVinLiveScanner(sessionToken) {
  const zxing = window.ZXingBrowser;
  if (!zxing?.BrowserMultiFormatReader) {
    throw new Error('The live VIN scanner did not load correctly.');
  }

  if (!vinScanVideo) {
    throw new Error('The live VIN scanner video preview is missing from this page.');
  }

  const reader = new zxing.BrowserMultiFormatReader(undefined, {
    delayBetweenScanAttempts: 220,
    delayBetweenScanSuccess: 800,
    tryPlayVideoTimeout: 5000,
  });

  reader.possibleFormats = [
    zxing.BarcodeFormat?.CODE_39,
    zxing.BarcodeFormat?.CODE_128,
    zxing.BarcodeFormat?.PDF_417,
  ].filter(Boolean);

  vinScanReader = reader;

  const controls = await reader.decodeFromConstraints({
    audio: false,
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
  }, vinScanVideo, (result) => {
    if (sessionToken !== vinScanSessionToken || vinScanResultLocked) {
      return;
    }

    const text = result?.getText?.() || result?.text || '';
    const vin = extractVinFromDecodedText(text);
    if (vin) {
      void completeVinLiveScan(vin, 'barcode');
    }
  });

  if (sessionToken !== vinScanSessionToken) {
    controls.stop();
    return;
  }

  vinScanControls = controls;
  scheduleVinLiveOcr(sessionToken, 900);
}

async function openVinScanModal() {
  if (!navigator.mediaDevices?.getUserMedia) {
    showStatus(vinStatus, 'This browser does not support live camera scanning. Type the VIN manually.', true);
    return;
  }

  stopVinLiveScanner();
  hideStatus(vinScanModalStatus);
  vinResults.classList.add('hidden');
  vinScanModal?.classList.remove('hidden');
  vinScanModal?.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  showStatus(vinStatus, 'Launching live VIN scanner...');
  showStatus(vinScanModalStatus, 'Starting camera...');

  const sessionToken = ++vinScanSessionToken;

  try {
    await startVinLiveScanner(sessionToken);
    if (sessionToken !== vinScanSessionToken) {
      return;
    }
    showStatus(vinScanModalStatus, 'Point the camera at the VIN barcode or the printed VIN line on the white door sticker. We are scanning live.');
  } catch (error) {
    closeVinScanModal();
    showStatus(
      vinStatus,
      error?.name === 'NotAllowedError'
        ? 'Camera access was blocked. Allow camera permission and try Scan VIN again.'
        : error.message || 'Could not start the live VIN scanner on this device.',
      true
    );
  }
}

function getVinOcrRegions(frameCanvas) {
  const width = frameCanvas.width;
  const height = frameCanvas.height;

  return [
    clampRegion({ left: 0, top: 0, width, height }, width, height),
    clampRegion({ left: width * 0.04, top: height * 0.08, width: width * 0.92, height: height * 0.5 }, width, height),
    clampRegion({ left: width * 0.06, top: height * 0.12, width: width * 0.88, height: height * 0.28 }, width, height),
    clampRegion({ left: width * 0.06, top: height * 0.18, width: width * 0.88, height: height * 0.18 }, width, height),
    clampRegion({ left: width * 0.08, top: height * 0.18, width: width * 0.84, height: height * 0.12 }, width, height),
  ];
}

function getVinBarcodeRegions(frameCanvas) {
  const width = frameCanvas.width;
  const height = frameCanvas.height;

  return [
    clampRegion({ left: 0, top: 0, width, height }, width, height),
    clampRegion({ left: width * 0.04, top: height * 0.46, width: width * 0.92, height: height * 0.42 }, width, height),
    clampRegion({ left: width * 0.08, top: height * 0.56, width: width * 0.84, height: height * 0.28 }, width, height),
  ];
}

function buildPreparedCanvas(frameCanvas, region, mode = 'threshold', scale = 2.8) {
  const canvas = createCanvas(region.width * scale, region.height * scale);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.imageSmoothingEnabled = false;

  if (mode === 'raw') {
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
    return canvas;
  }

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
  const threshold = Math.max(94, Math.min(210, average - 6));

  for (let index = 0; index < data.length; index += 4) {
    const normalized = ((data[index] - min) / range) * 255;
    let output = normalized;

    if (mode === 'grayscale') {
      output = Math.max(0, Math.min(255, (normalized - 128) * 1.18 + 128));
    } else if (mode === 'threshold') {
      output = normalized > threshold ? 255 : 0;
    } else if (mode === 'invert-threshold') {
      output = normalized > threshold ? 0 : 255;
    } else if (mode === 'contrast') {
      output = normalized > 220 ? 255 : Math.max(0, Math.min(255, normalized * 1.12));
    }

    data[index] = output;
    data[index + 1] = output;
    data[index + 2] = output;
  }

  context.putImageData(imageData, 0, 0);
  return canvas;
}

function extractVinFromDecodedText(value) {
  return normalizeManualVin(value) || extractVinFromOcrText(value);
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
      tessedit_pageseg_mode: '6',
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

async function readVinFromBarcodeCanvas(frameCanvas) {
  const zxing = window.ZXingBrowser;
  if (!zxing?.BrowserMultiFormatReader) {
    return null;
  }

  const reader = new zxing.BrowserMultiFormatReader();
  const formats = [
    zxing.BarcodeFormat?.CODE_39,
    zxing.BarcodeFormat?.CODE_128,
    zxing.BarcodeFormat?.PDF_417,
  ].filter(Boolean);

  if (formats.length) {
    reader.possibleFormats = formats;
  }

  const regions = getVinBarcodeRegions(frameCanvas);
  const modes = ['raw', 'contrast', 'threshold'];

  for (const region of regions) {
    for (const mode of modes) {
      const preparedCanvas = buildPreparedCanvas(frameCanvas, region, mode, 2.4);

      try {
        const result = await reader.decodeFromCanvas(preparedCanvas);
        const text = result?.getText?.() || result?.text || '';
        const vin = extractVinFromDecodedText(text);
        if (vin) {
          return vin;
        }
      } catch (_error) {
        // Keep trying other regions and modes.
      }
    }
  }

  return null;
}

async function readVinFromCanvas(frameCanvas) {
  const worker = await ensureVinOcrWorker();
  const regions = getVinOcrRegions(frameCanvas);
  const passes = [
    { psm: '7', modes: ['grayscale', 'threshold', 'contrast'] },
    { psm: '6', modes: ['grayscale', 'threshold', 'contrast', 'invert-threshold'] },
  ];

  for (const pass of passes) {
    await worker.setParameters({
      tessedit_char_whitelist: VIN_OCR_WHITELIST,
      tessedit_pageseg_mode: pass.psm,
      preserve_interword_spaces: '0',
      user_defined_dpi: '300',
    });

    for (const region of regions) {
      for (const mode of pass.modes) {
        const preparedCanvas = buildPreparedCanvas(frameCanvas, region, mode);
        const { data } = await worker.recognize(preparedCanvas);
        const vin = extractVinFromOcrText(data?.text || '');
        if (vin) {
          return vin;
        }
      }
    }
  }

  throw new Error('Could not read a clean VIN from that crop. Try a tighter crop around the white sticker or take a brighter photo.');
}

async function processDetectedVin(vin) {
  vinInput.value = vin;
  const modelYear = getVinModelYear(vin);
  if (modelYear && modelYear < 2019) {
    showStatus(vinStatus, `VIN Lookup only supports 2019 and newer RAM trucks. Detected ${modelYear}.`, true);
    return;
  }
  showStatus(vinStatus, `VIN scanned: ${vin}. Pulling sticker and matching the RAM charts...`);
  vinResults.classList.add('hidden');

  try {
    const response = await fetchJson(`/api/lookup-vin/${encodeURIComponent(vin)}`);
    hideStatus(vinStatus);
    showVinLookupResponse(response);
  } catch (error) {
    showStatus(vinStatus, error.message, true);
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
  const modelYear = getVinModelYear(vin);
  if (modelYear && modelYear < 2019) {
    showStatus(vinStatus, `VIN Lookup only supports 2019 and newer RAM trucks. Detected ${modelYear}.`, true);
    return;
  }
  showStatus(vinStatus, 'Pulling sticker and matching the RAM charts...');

  try {
    const response = await fetchJson(`/api/lookup-vin/${encodeURIComponent(vin)}`);
    hideStatus(vinStatus);
    showVinLookupResponse(response);
  } catch (error) {
    showStatus(vinStatus, error.message, true);
  }
});

vinLeadForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideStatus(vinLeadStatus);

  const response = vinLastResponse;
  if (!response?.vin) {
    showStatus(vinLeadStatus, 'Run a VIN before requesting confirmation.', true);
    return;
  }

  const payload = {
    name: vinLeadName?.value,
    zip: vinLeadZip?.value,
    email: vinLeadEmail?.value,
    phone: vinLeadPhone?.value,
    contactPreference: vinLeadPreference?.value,
    message: vinLeadMessage?.value,
    consent: Boolean(vinLeadConsent?.checked),
    company: vinLeadCompany?.value,
    vin: response.vin,
    towCapacity: towCapacity?.textContent,
    payloadCapacity: payloadCapacity?.textContent,
  };

  try {
    await fetchJson('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    vinLeadForm.reset();
    showStatus(vinLeadStatus, 'Your request is in. A RAM Tow Expert will follow up using your selected contact method.');
    // The event intentionally contains no VIN, trailer, pricing, or contact data.
    trackAnalytics('ram_tow_inquiry_submitted', { inquiry_context: 'vin_lookup' });
  } catch (error) {
    showStatus(vinLeadStatus, error.message || 'We could not send your request. Please try again.', true);
  }
});

if (vinScanButton) {
  vinScanButton.addEventListener('click', () => {
    void openVinScanModal();
  });
}

if (vinScanCloseButton) {
  vinScanCloseButton.addEventListener('click', () => {
    closeVinScanModal();
  });
}

for (const refinementInput of [vinBedSelect, vinRamBoxSelect, vinAxleSelect, vinGvwrSelect]) {
  refinementInput?.addEventListener('change', () => {
    void refineVinCapacity();
  });
}

reverseForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  resetReverseResults();
  const payload = getTrailerTarget();
  if (!payload) {
    showStatus(reverseStatus, 'Enter a loaded trailer weight and tongue or pin weight to see matching RAM trucks.', true);
    return;
  }

  saveTrailerTarget(payload);
  trackAnalytics('trailer_fit_started', {
    hitch_type: payload.hitchType,
    model_preference: payload.modelPreference || 'any',
  });
  const params = new URLSearchParams({
    trailerWeight: String(Math.round(payload.trailerWeight)),
    tongueWeight: String(Math.round(payload.tongueWeight)),
    hitchType: payload.hitchType,
  });
  if (payload.modelPreference) {
    params.set('modelPreference', payload.modelPreference);
  }
  window.location.assign(`/trailer-fit/?${params.toString()}`);
});

for (const input of reverseInputs) {
  if (!input) {
    continue;
  }

  input.addEventListener('input', resetReverseResults);
  input.addEventListener('change', resetReverseResults);
}

function restoreTrailerTarget() {
  const params = new URLSearchParams(window.location.search);
  let target = null;

  const trailerWeight = Number(params.get('trailerWeight'));
  const tongueWeight = Number(params.get('tongueWeight'));
  if (Number.isFinite(trailerWeight) && trailerWeight > 0 && Number.isFinite(tongueWeight) && tongueWeight > 0) {
    target = {
      trailerWeight,
      tongueWeight,
      hitchType: params.get('hitchType') || 'conventional',
      modelPreference: params.get('modelPreference') || '',
    };
  } else {
    try {
      target = JSON.parse(sessionStorage.getItem(TRAILER_TARGET_STORAGE_KEY) || 'null');
    } catch (_error) {
      target = null;
    }
  }

  if (!target || !Number(target.trailerWeight) || !Number(target.tongueWeight)) {
    return;
  }

  trailerWeightInput.value = Math.round(Number(target.trailerWeight));
  tongueWeightInput.value = Math.round(Number(target.tongueWeight));
  if (hitchTypeInput?.querySelector(`option[value="${target.hitchType}"]`)) {
    hitchTypeInput.value = target.hitchType;
  }
  if (modelPreferenceInput?.querySelector(`option[value="${target.modelPreference || ''}"]`)) {
    modelPreferenceInput.value = target.modelPreference || '';
  }
}

function restoreVinFromQuery() {
  const vin = normalizeManualVin(new URLSearchParams(window.location.search).get('vin'));
  if (!vin || !vinInput) {
    return;
  }
  vinInput.value = vin;
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('[data-trailer-weight][data-tongue-weight]');
  if (!link) {
    return;
  }

  saveTrailerTarget({
    trailerWeight: Number(link.dataset.trailerWeight),
    tongueWeight: Number(link.dataset.tongueWeight),
    hitchType: link.dataset.hitchType || 'conventional',
    modelPreference: link.dataset.modelPreference || '',
  });
});

if (hitchTypeInput) {
  hitchTypeInput.addEventListener('change', syncHitchTypeUi);
}

restoreTrailerTarget();
restoreVinFromQuery();
syncHitchTypeUi();

window.addEventListener('pageshow', () => {
  resetReverseResults();
  syncHitchTypeUi();
});

window.addEventListener('beforeunload', () => {
  closeVinScanModal();
  void terminateVinOcrWorker();
});
  if (showBed) {
    renderRefinementOptions(vinBedSelect, bedOptions, spec.bed, 'Select box length');
  }
  if (showRamBox) {
    renderRefinementOptions(vinRamBoxSelect, ramBoxOptions, spec.ramBox, 'Select RamBox option', (value) => String(value) === 'true' ? 'With RamBox' : 'Without RamBox');
  }
