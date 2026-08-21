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
