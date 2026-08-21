const state = {
  lastVinResponse: null,
};

const vinForm = document.querySelector('#vin-form');
const vinInput = document.querySelector('#vin-input');
const vinStatus = document.querySelector('#vin-status');
const vinResults = document.querySelector('#vin-results');
const detectedPills = document.querySelector('#detected-pills');
const stickerLink = document.querySelector('#sticker-link');
const overrideGrid = document.querySelector('#override-grid');
const applyOverridesButton = document.querySelector('#apply-overrides');
const towCapacity = document.querySelector('#tow-capacity');
const towDetail = document.querySelector('#tow-detail');
const payloadCapacity = document.querySelector('#payload-capacity');
const payloadDetail = document.querySelector('#payload-detail');
const chartHints = document.querySelector('#chart-hints');
const overrideTemplate = document.querySelector('#override-template');

const reverseForm = document.querySelector('#reverse-form');
const reverseStatus = document.querySelector('#reverse-status');
const reverseResults = document.querySelector('#reverse-results');

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

function renderOverrideGrid(spec, overrideOptions) {
  overrideGrid.innerHTML = '';
  const fields = [
    ['model', 'Model'],
    ['trim', 'Trim'],
    ['engine', 'Engine'],
    ['drive', 'Drive'],
    ['cab', 'Cab'],
    ['bed', 'Bed'],
    ['rearWheels', 'Rear Wheels'],
    ['axleRatio', 'Axle Ratio'],
    ['gvwr', 'GVWR'],
  ];

  for (const [key, label] of fields) {
    const fragment = overrideTemplate.content.cloneNode(true);
    const field = fragment.querySelector('.field');
    const span = fragment.querySelector('span');
    const select = fragment.querySelector('select');

    field.dataset.key = key;
    span.textContent = label;
    select.name = key;

    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = 'Auto';
    select.appendChild(blank);

    for (const option of overrideOptions[key] || []) {
      const element = document.createElement('option');
      element.value = option;
      element.textContent = option;
      if (String(spec[key] || '') === option) {
        element.selected = true;
      }
      select.appendChild(element);
    }

    overrideGrid.appendChild(fragment);
  }
}

function renderPrimaryMatch(match, capacityNode, detailNode, kind) {
  if (!match) {
    capacityNode.textContent = 'No clear match';
    detailNode.textContent = 'Use the overrides to tighten the configuration and try again.';
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

function renderHints(hints) {
  chartHints.innerHTML = '';
  if (!hints?.length) {
    const card = document.createElement('article');
    card.className = 'hint-card';
    card.innerHTML = '<h4>No extra hint needed</h4><p>The structured match had enough information.</p>';
    chartHints.appendChild(card);
    return;
  }

  for (const hint of hints) {
    const card = document.createElement('article');
    card.className = 'hint-card';
    card.innerHTML = `
      <h4>Chart reference: ${hint.needle}</h4>
      <p>${hint.snippet}</p>
    `;
    chartHints.appendChild(card);
  }
}

function renderInventoryMatch(row) {
  if (!row.inventoryMatch) {
    return `
      <div class="inventory-match">
        <span class="inventory-label">Perkins Inventory</span>
        <p>No current Perkins truck lined up cleanly with this chart result right now.</p>
      </div>
    `;
  }

  const title = escapeHtml(row.inventoryMatch.inventoryTitle || 'Open truck');
  const stockNumber = escapeHtml(row.inventoryMatch.stockNumber || '-');
  const link = escapeHtml(row.inventoryMatch.inventoryUrl || '#');
  const label = escapeHtml(row.inventoryMatch.matchLabel || 'Perkins match');
  const price = row.inventoryMatch.currentPrice ? formatNumber(row.inventoryMatch.currentPrice) : null;

  return `
    <div class="inventory-match">
      <span class="inventory-label">${label}</span>
      <p><span class="inventory-stock">Stock ${stockNumber}</span>${price ? ` &bull; <span class="inventory-price">$${price}</span>` : ''}</p>
      <a href="${link}" target="_blank" rel="noreferrer">${title}</a>
    </div>
  `;
}

function renderVinResponse(response) {
  state.lastVinResponse = response;
  stickerLink.href = response.pdfUrl;
  renderDetectedSpec(response.detectedSpec);
  renderOverrideGrid(response.detectedSpec, response.overrideOptions);
  renderPrimaryMatch(response.towMatch, towCapacity, towDetail, 'tow');
  renderPrimaryMatch(response.payloadMatch, payloadCapacity, payloadDetail, 'payload');
  renderHints(response.rawHints);
  vinResults.classList.remove('hidden');
}

function collectOverrideSpec() {
  const spec = { ...(state.lastVinResponse?.detectedSpec || {}) };
  overrideGrid.querySelectorAll('select').forEach((select) => {
    spec[select.name] = select.value || null;
  });
  return spec;
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

applyOverridesButton.addEventListener('click', async () => {
  if (!state.lastVinResponse) {
    return;
  }

  showStatus(vinStatus, 'Re-running chart match with your overrides...');
  try {
    const response = await fetchJson('/api/match-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collectOverrideSpec()),
    });
    hideStatus(vinStatus);
    renderVinResponse({
      ...state.lastVinResponse,
      ...response,
      pdfUrl: state.lastVinResponse.pdfUrl,
      detectedSpec: response.spec,
    });
  } catch (error) {
    showStatus(vinStatus, error.message, true);
  }
});

reverseForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideStatus(reverseStatus);
  reverseResults.classList.add('hidden');
  reverseResults.innerHTML = '';

  showStatus(reverseStatus, 'Finding the lowest-priced Perkins trucks that clear your trailer...');

  try {
    const payload = {
      trailerWeight: Number(document.querySelector('#trailer-weight').value),
      tongueWeight: Number(document.querySelector('#tongue-weight').value),
      modelPreference: document.querySelector('#model-preference').value,
    };

    const response = await fetchJson('/api/reverse-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    hideStatus(reverseStatus);
    reverseResults.classList.remove('hidden');

    if (!response.results.length) {
      const card = document.createElement('article');
      card.className = 'alternate-card';
      card.innerHTML = '<h4>No chart-backed match found</h4><p>Try a larger model class, lighter tongue weight, or confirm the trailer numbers.</p>';
      reverseResults.appendChild(card);
      return;
    }

    for (const row of response.results) {
      const card = document.createElement('article');
      card.className = 'alternate-card';
      card.innerHTML = `
        <h4>${row.inventoryMatch?.inventoryTitle || `${row.model} ${row.trim || ''} ${row.cab} ${row.bed} ${row.drive}`}</h4>
        <p>${row.engine}${row.rearWheels ? ` &bull; ${row.rearWheels}` : ''}${row.axleRatio ? ` &bull; Axle ${row.axleRatio}` : ''}</p>
        <p>Needs: Tow ${formatCapacity(row.maxTow)} &bull; Payload ${formatCapacity(row.maxPayload)}</p>
        <p>Chart match: GCWR ${row.towGCWR ? formatNumber(row.towGCWR) : '-'} lb &bull; GVWR ${row.payloadGVWR ? formatNumber(row.payloadGVWR) : '-'} lb</p>
        <p>Headroom: ${formatCapacity(row.towSurplus)} tow &bull; ${formatCapacity(row.payloadSurplus)} payload</p>
        ${renderInventoryMatch(row)}
        ${row.confidence === 'medium' ? '<span class="confidence">HD edge case: verify against chart</span>' : ''}
      `;
      reverseResults.appendChild(card);
    }
  } catch (error) {
    showStatus(reverseStatus, error.message, true);
  }
});
