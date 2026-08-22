const targetNode = document.querySelector('#fit-target');
const statusNode = document.querySelector('#fit-status');
const summaryNode = document.querySelector('#fit-summary');
const insightsNode = document.querySelector('#fit-insights');
const resultsNode = document.querySelector('#fit-results');

const TRUCK_PROFILES = {
  '1500': {
    images: [
      'https://www.ramtrucks.com/content/dam/fca-brands/na/ramtrucks/en_us/2026/ram-1500/capability/desktop/my26-ram-1500-capability-hero-version2-desktop.jpg',
      'https://www.ramtrucks.com/content/dam/fca-brands/na/ramtrucks/en_us/2026/ram-1500/overview/desktop/my26-ram-1500-overview-gallery-expanded1-desktop.jpg',
      'https://www.ramtrucks.com/content/dam/fca-brands/na/ramtrucks/en_us/2026/ram-1500/overview/desktop/my26-ram-1500-overview-gallery-expanded2-desktop.jpg',
    ],
    imageAlt: 'RAM 1500 truck',
    comfort: 'The RAM 1500 is the everyday-comfort choice, with a rear multi-link coil-spring suspension designed for a smoother unloaded ride than a traditional HD leaf-spring setup.',
    technology: 'Available Trailer Hitch Assist, Trailer Reverse Guidance with Dynamic Gridlines, Integrated Trailer Health Monitor, Digital Rearview Mirror with Tow Mode, power telescoping trailer tow mirrors, and Active-Level four-corner air suspension.',
    trimPaths: {
      pentastar: [
        ['Tradesman / Express', 'A work-first 3.6L V6 starting point for a lighter trailer and a straightforward daily truck.'],
        ['Big Horn', 'Adds a broader comfort and equipment path while retaining the standard 3.6L V6.'],
      ],
      hemi: [
        ['Big Horn', 'The practical 5.7L HEMI towing path with room to add the equipment you need.'],
        ['Laramie', 'A 5.7L HEMI choice for more long-haul comfort and available tow technology.'],
        ['Rebel', 'A 4x4-focused 5.7L HEMI option when capability and a more aggressive setup both matter.'],
      ],
      'hurricane-so': [
        ['Big Horn', 'A balanced 3.0L Hurricane Standard Output path for everyday use and serious towing.'],
        ['Laramie', 'Pairs the Hurricane Standard Output engine with a more refined long-distance cabin.'],
        ['Rebel', 'A 4x4-focused Hurricane Standard Output choice for shoppers who also want off-pavement confidence.'],
      ],
      'hurricane-ho': [
        ['RHO', 'The high-performance 3.0L Hurricane High Output path with an off-road focus.'],
        ['Limited / Limited Longhorn', 'Premium High Output choices for customers who want luxury with strong power.'],
        ['Tungsten', 'The flagship High Output option with the most upscale cabin experience.'],
      ],
    },
  },
  '2500': {
    images: [
      'https://www.ramtrucks.com/content/dam/fca-brands/na/ramtrucks/en_us/2026/ram-2500/overview/desktop/my26-ram-2500-overview-featurepanel-01-desktop.jpg.image.1440.jpg',
      'https://www.ramtrucks.com/content/dam/fca-brands/na/ramtrucks/en_us/2026/ram-2500/overview/desktop/my26-ram-2500-vlp-gallery-expanded-01-desktop-v1.jpg',
      'https://www.ramtrucks.com/content/dam/fca-brands/na/ramtrucks/en_us/2026/ram-2500/overview/desktop/my26-ram-2500-vlp-gallery-expanded-04-desktop-v1.jpg',
    ],
    imageAlt: 'RAM 2500 Heavy Duty truck',
    comfort: 'The RAM 2500 balances heavy-duty capability with a rear coil-spring setup, making it a strong bridge between an everyday pickup and a dedicated tow rig.',
    technology: 'Standard trailer brake control, plus available Trailer Reverse Steering Control, Trailer Tire Pressure Monitoring, 360-degree Surround View Camera, fifth-wheel/gooseneck prep, and Auto-Level rear air suspension on 4x4 models.',
    trimPaths: {
      hemi: [
        ['Tradesman / Big Horn', 'The 6.4L HEMI work-truck foundation for customers who want heavy-duty capability without diesel ownership.'],
        ['Laramie / Limited Longhorn / Limited', 'A 6.4L HEMI path with more long-distance comfort and available towing technology.'],
        ['Rebel / Power Wagon', 'The gas HD choices for shoppers who want an off-road-capable 2500 alongside trailer duty.'],
      ],
      cummins: [
        ['Tradesman / Big Horn', 'The practical High Output Cummins starting point for frequent heavier trailer work.'],
        ['Laramie / Limited Longhorn / Limited', 'Diesel tow rigs with upgraded comfort for long highway and fifth-wheel trips.'],
        ['Rebel / Power Wagon', 'Available High Output diesel paths for shoppers who also want a more adventurous 2500 configuration.'],
      ],
    },
  },
  '3500': {
    images: [
      'https://www.ramtrucks.com/content/dam/fca-brands/na/ramtrucks/en_us/2026/ram-3500/overview/desktop/my26-ram-3500-overview-featurepanel-01-desktop.jpg.image.1440.jpg',
      'https://www.ramtrucks.com/content/dam/fca-brands/na/ramtrucks/en_us/2026/ram-3500/overview/desktop/my26-ram-3500-vlp-gallery-expanded-01-desktop-v2.jpg',
      'https://www.ramtrucks.com/content/dam/fca-brands/na/ramtrucks/en_us/2026/ram-3500/overview/desktop/my26-ram-3500-vlp-gallery-expanded-04-desktop-v2.jpg',
    ],
    imageAlt: 'RAM 3500 Heavy Duty truck',
    comfort: 'The RAM 3500 is the payload and pin-weight specialist. Its work-focused rear suspension and available Auto-Level rear air suspension are designed around serious towing needs.',
    technology: 'Standard trailer brake control, plus available Trailer Reverse Steering Control, Trailer Tire Pressure Monitoring, 360-degree Surround View Camera, fifth-wheel/gooseneck prep, power trailer tow mirrors, and Auto-Level rear air suspension.',
    trimPaths: {
      hemi: [
        ['Tradesman / Big Horn', 'The 6.4L HEMI work-first path when payload and conventional towing matter most.'],
        ['Laramie', 'A gas 3500 configuration that adds a more comfortable long-haul cabin.'],
        ['Limited Longhorn / Limited', 'Premium gas 3500 paths for customers who want HD capability without giving up cabin refinement.'],
      ],
      cummins: [
        ['Tradesman / Big Horn', 'The High Output Cummins work-truck path for substantial fifth-wheel, gooseneck, and trailer duty.'],
        ['Laramie', 'A High Output Cummins choice that balances serious towing hardware with everyday comfort.'],
        ['Limited Longhorn / Limited', 'Premium diesel tow rigs for customers who spend long days behind the wheel.'],
      ],
    },
  },
};

const TIER_LABELS = {
  good: { label: 'Good Fit' },
  better: { label: 'Better Fit' },
  best: { label: 'Best Fit' },
};

const PERKINS_MODEL_URLS = {
  '1500': 'https://perkinsmotors.com/sale/ram-1500-colorado-springs-co?utm_source=ramtow.com&utm_medium=referral&utm_campaign=trailer_fit_image',
  '2500': 'https://perkinsmotors.com/sale/ram-2500-colorado-springs-co?utm_source=ramtow.com&utm_medium=referral&utm_campaign=trailer_fit_image',
  '3500': 'https://perkinsmotors.com/sale/ram-3500-colorado-springs-co?utm_source=ramtow.com&utm_medium=referral&utm_campaign=trailer_fit_image',
};

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value));
}

function formatPounds(value) {
  return `${formatNumber(value)} lb`;
}

function getTarget() {
  const params = new URLSearchParams(window.location.search);
  const trailerWeight = Number(params.get('trailerWeight'));
  const tongueWeight = Number(params.get('tongueWeight'));
  if (!Number.isFinite(trailerWeight) || trailerWeight <= 0 || !Number.isFinite(tongueWeight) || tongueWeight <= 0) {
    return null;
  }
  return {
    trailerWeight,
    tongueWeight,
    hitchType: params.get('hitchType') === 'gooseneck' ? 'gooseneck' : 'conventional',
    modelPreference: params.get('modelPreference') || '',
  };
}

function fitTargetLabel(target) {
  return `${formatPounds(target.trailerWeight)} loaded trailer &middot; ${formatPounds(target.tongueWeight)} ${target.hitchType === 'gooseneck' ? 'pin weight' : 'tongue weight'}`;
}

function renderInsight(item) {
  return `<article class="fit-insight fit-insight-${escapeHtml(item.type || 'note')}"><strong>${escapeHtml(item.title || 'Towing note')}</strong><p>${escapeHtml(item.message || '')}</p></article>`;
}

function tierReserveCopy(row) {
  if (row.isMaximum3500Dually && row.towReservePercent < 10) {
    return 'Maximum RAM 3500 DRW rating';
  }
  return `${row.tierFallback ? 'Step-up option' : 'Chart match'} · +${formatNumber(row.towReservePercent)}% headroom`;
}

function consumerFitDescription(row, target) {
  const towRoom = formatPounds(row.towSurplus);
  if (row.isMaximum3500Dually && row.towReservePercent < 10) {
    return `This is the maximum-capability RAM 3500 DRW option for a trailer this heavy.`;
  }
  if (row.recommendationTier === 'good') {
    return `A right-sized 4x4 choice for your ${formatPounds(target.trailerWeight)} trailer, with ${towRoom} of towing room left over.`;
  }
  if (row.tierFallback) {
    return `A smart step up when you want more breathing room for passengers, cargo, and a future larger trailer.`;
  }
  return `A strong alternative that gives your ${formatPounds(target.trailerWeight)} trailer ${towRoom} of extra towing room.`;
}

function inventoryImageLink(row) {
  return PERKINS_MODEL_URLS[row.model] || 'https://perkinsmotors.com/?utm_source=ramtow.com&utm_medium=referral&utm_campaign=trailer_fit_image';
}

function powertrainKey(row) {
  const engine = String(row.engine || '').toLowerCase();
  if (engine.includes('cummins')) return 'cummins';
  if (engine.includes('hemi')) return 'hemi';
  if (engine.includes('pentastar')) return 'pentastar';
  if (engine.includes('hurricane') && /\bho\b|high output/.test(engine)) return 'hurricane-ho';
  if (engine.includes('hurricane')) return 'hurricane-so';
  return 'hemi';
}

function trimMarkup(profile, row) {
  const paths = profile.trimPaths?.[powertrainKey(row)] || [];
  if (!paths.length) {
    return '<li><strong>Configuration-specific path</strong><span>A Perkins RAM Expert can confirm current trim and engine availability on a candidate VIN.</span></li>';
  }
  return paths.map(([name, description]) => `
    <li><strong>${escapeHtml(name)}</strong><span>${escapeHtml(description)}</span></li>
  `).join('');
}

function inventoryMarkup(row, target) {
  const link = row.inventoryLink?.url;
  if (!link) {
    return `<p class="fit-inventory-fallback">Call a Perkins RAM Expert at <a href="tel:+17192492040">719-249-2040</a> to find a matching RAM ${escapeHtml(row.model)}.</p>`;
  }
  return `
    <a class="button button-secondary fit-shop-button" href="${escapeHtml(link)}" target="_blank" rel="noreferrer">Shop matching RAM ${escapeHtml(row.model)}s at Perkins Motors</a>
    <p class="fit-inventory-note">Your target is carried into this Perkins Motors link: ${escapeHtml(formatPounds(target.trailerWeight))} tow / ${escapeHtml(formatPounds(target.tongueWeight))} payload. Verify every candidate VIN in RAM Tow.</p>
  `;
}

function renderRecommendation(row, target, index) {
  const profile = TRUCK_PROFILES[row.model] || TRUCK_PROFILES['3500'];
  const tier = TIER_LABELS[row.recommendationTier] || TIER_LABELS.good;
  const configuration = [row.cab, row.bed, row.drive, row.rearWheels, row.axleRatio ? `Axle ${row.axleRatio}` : null].filter(Boolean).join(' &bull; ');
  const headlineConfiguration = [
    row.headlineTowConfiguration?.cab,
    row.headlineTowConfiguration?.bed,
    row.headlineTowConfiguration?.rearWheels,
    row.headlineTowConfiguration?.axleRatio ? `Axle ${row.headlineTowConfiguration.axleRatio}` : null,
  ].filter(Boolean).join(' &bull; ');
  const image = profile.images[index % profile.images.length];
  const imageLink = inventoryImageLink(row);
  const engineMessage = row.engine?.includes('Cummins')
    ? 'Diesel torque focus for sustained heavy trailer work.'
    : row.engine?.includes('HEMI')
    ? 'Gas V8 power for customers who want HD capability without moving to a diesel.'
    : 'Light-duty powertrain focused on capable towing and everyday driving.';

  return `
    <article class="fit-card fit-card-${escapeHtml(row.recommendationTier || 'good')}">
      <a class="fit-card-image-link" href="${escapeHtml(imageLink)}" target="_blank" rel="noreferrer" aria-label="Shop RAM ${escapeHtml(row.model)} trucks at Perkins Motors">
      <div class="fit-card-image-wrap">
        <img class="fit-card-image" src="${image}" alt="${escapeHtml(profile.imageAlt)}" loading="lazy" referrerpolicy="no-referrer">
        <div class="fit-tier"><span>${escapeHtml(tier.label)}</span><strong>${escapeHtml(tierReserveCopy(row))}</strong></div>
      </div>
      </a>
      <div class="fit-card-body">
        <p class="fit-card-kicker">RAM chart recommendation</p>
        <h2>RAM ${escapeHtml(row.model)} <span>${escapeHtml(row.engine || '')}</span></h2>
        <p class="fit-card-lead">${escapeHtml(consumerFitDescription(row, target))}</p>

        <div class="fit-numbers">
          <div><span>4x4 engine max tow</span><strong>${escapeHtml(formatPounds(row.headlineMaxTow || row.maxTow))}</strong><small>Highest RAM chart rating for this engine in 4x4</small></div>
          <div><span>Matched payload</span><strong>${escapeHtml(formatPounds(row.maxPayload))}</strong><small>${escapeHtml(formatPounds(row.payloadSurplus))} above your input</small></div>
        </div>

        <div class="fit-config">
          <strong>Minimum chart configuration</strong>
          <p>${configuration || 'Confirm configuration with the VIN lookup.'}</p>
          <p>Matched chart towing capacity: ${escapeHtml(formatPounds(row.maxTow))} (${escapeHtml(formatPounds(row.towSurplus))} above your trailer).</p>
          ${headlineConfiguration ? `<p class="fit-headline-config">Highest 4x4 engine rating configuration: ${headlineConfiguration}.</p>` : ''}
          <p>${escapeHtml(engineMessage)}</p>
        </div>

        <div class="fit-benefit-grid">
          <section><span>Ride & comfort</span><p>${escapeHtml(profile.comfort)}</p></section>
          <section class="fit-tech"><span>Available towing technology</span><p>${escapeHtml(profile.technology)}</p></section>
        </div>

        <section class="fit-trims">
          <h3>2026 ${escapeHtml(row.engine || 'RAM')} trim paths to consider</h3>
          <ul>${trimMarkup(profile, row)}</ul>
        </section>

        <div class="fit-card-actions">
          ${inventoryMarkup(row, target)}
          <a class="fit-call-link" href="tel:+17192492040">Need a second opinion? Call a Perkins RAM Expert: 719-249-2040</a>
        </div>
      </div>
    </article>
  `;
}

function renderSummary(rows, target) {
  const primary = rows[0];
  const modelName = `RAM ${primary.model}`;
  const alternatives = [...new Set(rows.slice(1).map((row) => `RAM ${row.model}`))];
  const comparison = alternatives.length
    ? ` We also included ${alternatives.join(' and ')} comparisons so you can decide how much reserve and truck you want.`
    : '';
  summaryNode.innerHTML = `
    <div>
      <p class="fit-eyebrow">Your best starting point</p>
      <h2>${modelName} is the smallest RAM class that fits this trailer.</h2>
      <p>For ${fitTargetLabel(target)}, the first chart-backed configuration below clears both towing and payload requirements.${comparison}</p>
    </div>
    <div class="fit-summary-stat"><span>Starting capacity</span><strong>${formatPounds(primary.maxTow)}</strong><small>${formatPounds(primary.maxPayload)} payload</small></div>
  `;
  summaryNode.classList.remove('hidden');
}

async function loadRecommendations() {
  const target = getTarget();
  if (!target) {
    targetNode.textContent = 'Enter your loaded trailer and tongue or pin weight to find the right RAM truck.';
    statusNode.classList.add('fit-status-error');
    statusNode.innerHTML = 'No trailer details were provided. <a href="/">Return to the RAM towing calculator</a> to start a match.';
    return;
  }

  targetNode.innerHTML = fitTargetLabel(target);
  try {
    const response = await fetch('/api/reverse-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(target),
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || 'Unable to build a RAM trailer match right now.');
    }

    statusNode.classList.add('hidden');
    const insights = payload.insights || [];
    if (insights.length) {
      insightsNode.innerHTML = insights.map(renderInsight).join('');
      insightsNode.classList.remove('hidden');
    }

    const rows = payload.results || [];
    if (!rows.length) {
      resultsNode.innerHTML = `
        <article class="fit-empty-state">
          <p class="fit-eyebrow">No chart match</p>
          <h2>No RAM chart configuration clears this full combination.</h2>
          <p>Try a different hitch type, check the loaded trailer and tongue or pin weight, or call a Perkins RAM Expert at <a href="tel:+17192492040">719-249-2040</a> for help with a heavy-duty towing solution.</p>
          <a class="button button-primary" href="/">Adjust trailer details</a>
        </article>
      `;
      resultsNode.classList.remove('hidden');
      return;
    }

    renderSummary(rows, target);
    resultsNode.innerHTML = rows.map((row, index) => renderRecommendation(row, target, index)).join('');
    resultsNode.classList.remove('hidden');
  } catch (error) {
    statusNode.classList.add('fit-status-error');
    statusNode.innerHTML = `${escapeHtml(error.message)} <a href="/">Return to the calculator</a> and try again.`;
  }
}

void loadRecommendations();
