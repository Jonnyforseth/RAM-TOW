const {
  findMatches,
  normalizeBed,
  normalizeCab,
  normalizeDrive,
  normalizeEngine,
  normalizeRearWheels,
} = require('./chart-service');
const { lookupVin } = require('./sticker-service');

const MODEL_LISTING_URLS = {
  '1500': 'https://perkinsmotors.com/sale/ram-1500-colorado-springs-co',
  '2500': 'https://perkinsmotors.com/sale/ram-2500-colorado-springs-co',
  '3500': 'https://perkinsmotors.com/sale/ram-3500-colorado-springs-co',
};

const CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_LISTING_PAGES = 6;
const DETAIL_CONCURRENCY = 6;
const MAX_RESULTS = 12;
const MAX_PER_TRIM = 2;
const VERIFY_CONCURRENCY = 4;

const inventoryCache = new Map();
const verificationCache = new Map();
const filterCache = new Map();

function decodeHtml(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x2F;/g, '/')
    .replace(/&#(\d+);/g, (_match, number) => String.fromCharCode(Number(number)));
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeTrim(value) {
  return normalizeText(value)
    .replace(/\blone star\b/g, 'big horn')
    .replace(/\b4x4\b/g, '')
    .replace(/\btruck\b/g, '')
    .replace(/\bcrew cab\b/g, '')
    .replace(/\bquad cab\b/g, '')
    .replace(/\bmega cab\b/g, '')
    .replace(/\bregular cab\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTags(html) {
  return decodeHtml(
    String(html || '')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function toNumber(value) {
  if (value == null || value === '') {
    return null;
  }
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  if (!cleaned) {
    return null;
  }
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'RAM-Tow-Desk/1.0 (+local inventory matcher)',
    },
  });

  if (!response.ok) {
    throw new Error(`Perkins inventory request failed with ${response.status} for ${url}`);
  }

  return response.text();
}

function collectJsonLdBlocks(html) {
  const blocks = [];
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    const raw = match[1]?.trim();
    if (!raw) {
      continue;
    }
    try {
      blocks.push(JSON.parse(raw));
    } catch (_error) {
      // Ignore malformed JSON-LD blocks.
    }
  }
  return blocks;
}

function walkJson(node, visit) {
  if (Array.isArray(node)) {
    for (const item of node) {
      walkJson(item, visit);
    }
    return;
  }
  if (!node || typeof node !== 'object') {
    return;
  }
  visit(node);
  for (const value of Object.values(node)) {
    walkJson(value, visit);
  }
}

function absoluteUrl(value, baseUrl) {
  if (!value) {
    return null;
  }
  try {
    return new URL(value, baseUrl).toString();
  } catch (_error) {
    return null;
  }
}

function extractListingUrls(html, pageUrl) {
  const urls = [];

  for (const block of collectJsonLdBlocks(html)) {
    walkJson(block, (node) => {
      if (node['@type'] !== 'ItemList' || !Array.isArray(node.itemListElement)) {
        return;
      }
      for (const item of node.itemListElement) {
        const url = absoluteUrl(item?.url, pageUrl);
        if (url && url.includes('/for-sale/ram-')) {
          urls.push(url);
        }
      }
    });
  }

  if (!urls.length) {
    for (const match of html.matchAll(/data-vehicle-url="([^"]+)"/gi)) {
      const url = absoluteUrl(match[1], pageUrl);
      if (url) {
        urls.push(url);
      }
    }
  }

  return unique(urls);
}

function extractNextPageUrl(html, pageUrl) {
  const next = html.match(/<link[^>]+rel=["']next["'][^>]+href=["']([^"']+)["']/i)?.[1];
  return absoluteUrl(next, pageUrl);
}

async function getListingDetailUrls(baseUrl) {
  const seenPages = new Set();
  const urls = [];
  let nextPageUrl = baseUrl;
  let pageCount = 0;

  while (nextPageUrl && !seenPages.has(nextPageUrl) && pageCount < MAX_LISTING_PAGES) {
    seenPages.add(nextPageUrl);
    const html = await fetchText(nextPageUrl);
    urls.push(...extractListingUrls(html, nextPageUrl));
    nextPageUrl = extractNextPageUrl(html, nextPageUrl);
    pageCount += 1;
  }

  return unique(urls);
}

function extractDefinitionValue(html, label) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<dt>([\\s\\S]*?)<\\/dt>\\s*<dd>${escapedLabel}<\\/dd>`, 'i');
  const value = html.match(pattern)?.[1];
  if (!value) {
    return null;
  }
  return stripTags(value);
}

function extractTitle(html) {
  return decodeHtml(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractModel(url, title) {
  return (
    url.match(/ram-(1500|2500|3500)/i)?.[1] ||
    title.match(/\bRam\s+(1500|2500|3500)\b/i)?.[1] ||
    null
  );
}

function extractYear(title) {
  const year = Number(title.match(/\b(20\d{2})\s+Ram\b/i)?.[1]);
  return Number.isFinite(year) ? year : null;
}

function extractTrimFromTitle(title, model) {
  if (!model) {
    return null;
  }
  const match = title.match(new RegExp(`\\bRam\\s+${model}\\s+(.+?)\\s+4X[24]\\s+Truck\\b`, 'i'));
  return match ? decodeHtml(match[1]).trim() : null;
}

function extractStockNumber(html) {
  const stock = html.match(/Stock:\s*<span[^>]*>\s*([^<]+)\s*<\/span>/i)?.[1];
  return stock ? decodeHtml(stock).trim() : null;
}

function extractVin(html, url) {
  const inlineVin = html.match(/VIN:\s*<span[^>]*>\s*([A-HJ-NPR-Z0-9]{17})\s*<\/span>/i)?.[1];
  if (inlineVin) {
    return inlineVin.trim().toUpperCase();
  }
  const urlVin = url.match(/-([a-hj-npr-z0-9]{17})$/i)?.[1];
  return urlVin ? urlVin.toUpperCase() : null;
}

function extractAxleRatios(text) {
  const ratios = [];
  const patterns = [
    /(\d\.\d{2})\s+Rear Axle Ratio/gi,
    /Rear Axle with (\d\.\d{2}) Ratio/gi,
    /Electronic Locker Rear Axle with (\d\.\d{2}) Ratio/gi,
    /(\d\.\d{2})\s+Ratio/gi,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      ratios.push(match[1]);
    }
  }

  return unique(ratios).filter((ratio) => /^\d\.\d{2}$/.test(ratio));
}

function extractCurrentPrice(html) {
  const finalPrice = toNumber(html.match(/<div class="amount final-price">\s*\$([^<]+)<\/div>/i)?.[1]);
  if (finalPrice) {
    return finalPrice;
  }

  const currentPrice = toNumber(html.match(/<div class="amount internet-price">\s*\$([^<]+)<\/div>/i)?.[1]);
  if (currentPrice) {
    return currentPrice;
  }

  return null;
}

function extractVehicleJsonLd(html) {
  for (const block of collectJsonLdBlocks(html)) {
    let found = null;
    walkJson(block, (node) => {
      if (found) {
        return;
      }
      if (node['@type'] === 'Car' && node.offers?.price) {
        found = node;
      }
    });
    if (found) {
      return found;
    }
  }
  return null;
}

function buildInventoryItem(url, html) {
  const title = extractTitle(html);
  const text = stripTags(html);
  const vehicle = extractVehicleJsonLd(html);
  const model = extractModel(url, title);
  const year = extractYear(title);
  const drivetrainValue = extractDefinitionValue(html, 'Drivetrain') || vehicle?.additionalProperty?.find?.((item) => item?.name === 'Drivetrain')?.value;
  const cabValue = extractDefinitionValue(html, 'Cab Type');
  const engineValue = extractDefinitionValue(html, 'Engine') || vehicle?.additionalProperty?.find?.((item) => item?.name === 'Engine')?.value;
  const bed = normalizeBed(text);
  const axleRatios = extractAxleRatios(text);
  const price = toNumber(vehicle?.offers?.price) || extractCurrentPrice(html);
  const trim = vehicle?.vehicleConfiguration || extractTrimFromTitle(title, model);
  const baseTitle = vehicle?.name
    ? `${vehicle.name} ${normalizeDrive(`${vehicle.driveWheelConfiguration || ''} ${title}`) === '4x4' ? '4X4 Truck' : 'Truck'}`
    : title.replace(/\s+For Sale Colorado Springs CO\s*-\s*[^-]+$/i, '').trim();

  return {
    year,
    model,
    trim,
    trimKey: normalizeTrim(trim || baseTitle),
    title: baseTitle.replace(/\s+/g, ' ').trim(),
    stockNumber: extractStockNumber(html) || vehicle?.sku || null,
    inventoryUrl: url,
    inventoryVin: extractVin(html, url) || vehicle?.vehicleIdentificationNumber || null,
    drive: normalizeDrive(`${drivetrainValue || ''} ${title} ${vehicle?.driveWheelConfiguration || ''}`),
    cab: normalizeCab(`${cabValue || ''} ${title}`),
    bed,
    rearWheels: normalizeRearWheels(text),
    engine: normalizeEngine(`${engineValue || ''} ${title} ${text}`),
    axleRatios,
    price,
  };
}

async function mapWithConcurrency(items, limit, iteratee) {
  const results = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      results[currentIndex] = await iteratee(items[currentIndex], currentIndex);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function loadModelInventory(model) {
  const url = MODEL_LISTING_URLS[model];
  if (!url) {
    return [];
  }

  const cached = inventoryCache.get(model);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.items;
  }

  const detailUrls = await getListingDetailUrls(url);
  const items = await mapWithConcurrency(detailUrls, DETAIL_CONCURRENCY, async (detailUrl) => {
    try {
      const html = await fetchText(detailUrl);
      return buildInventoryItem(detailUrl, html);
    } catch (_error) {
      return null;
    }
  });

  const cleanedItems = items.filter((item) => item && item.model === model);
  inventoryCache.set(model, {
    fetchedAt: Date.now(),
    items: cleanedItems,
  });

  return cleanedItems;
}

function extractFilterValues(html, filterKey) {
  const values = [];
  const inputPattern = /<input\b[^>]*>/gi;

  for (const match of html.matchAll(inputPattern)) {
    const inputHtml = match[0];
    const key = inputHtml.match(/data-filter-key="([^"]+)"/i)?.[1];
    const value = inputHtml.match(/data-filter-value="([^"]+)"/i)?.[1];
    if (!key || !value) {
      continue;
    }
    if (key.toLowerCase() !== String(filterKey).toLowerCase()) {
      continue;
    }
    values.push(decodeHtml(value.trim()));
  }

  return unique(values);
}

async function loadModelFilters(model) {
  const baseUrl = MODEL_LISTING_URLS[model];
  if (!baseUrl) {
    return null;
  }

  const cached = filterCache.get(model);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.value;
  }

  const html = await fetchText(baseUrl);
  const value = {
    baseUrl,
    engines: extractFilterValues(html, 'engine'),
    drivetrains: extractFilterValues(html, 'drivetrain'),
    trims: extractFilterValues(html, 'trim'),
    cabs: extractFilterValues(html, 'cab_type'),
    wheelbases: extractFilterValues(html, 'wheelbase_code'),
  };

  filterCache.set(model, {
    fetchedAt: Date.now(),
    value,
  });

  return value;
}

function matchesPerkinsEngineFilter(filterValue, engine) {
  const text = normalizeText(filterValue);

  switch (engine) {
    case '3.6L Pentastar V6 eTorque':
      return text.includes('3 6l') || text.includes('pentastar');
    case '5.7L HEMI V8 eTorque':
      return text.includes('5 7l') && text.includes('hemi');
    case '3.0L Hurricane SO':
      return text.includes('3 0l') && text.includes('hurricane') && text.includes('so');
    case '3.0L Hurricane HO':
      // Perkins splits the Hurricane inventory inconsistently, so show every 3.0L I6 option.
      return text.includes('3 0l') && text.includes('i6');
    case '6.4L HEMI V8':
      return text.includes('6 4l') && (text.includes('hemi') || text.includes('v8'));
    case '6.7L Cummins HO':
      return text.includes('6 7l') && text.includes('i6');
    default:
      return false;
  }
}

function getMatchingPerkinsEngineFilters(availableFilters, engine) {
  return unique((availableFilters || []).filter((value) => matchesPerkinsEngineFilter(value, engine)));
}

function getMatchingPerkinsCabFilter(availableFilters, cab) {
  const normalizedCab = normalizeCab(cab);
  return (availableFilters || []).find((value) => normalizeCab(value) === normalizedCab) || null;
}

// Perkins exposes bed length through wheelbase rather than a dedicated bed filter.
// Only use a wheelbase where the RAM cab/bed pairing is unambiguous.
function getMatchingPerkinsWheelbaseFilters(model, cab, bed, availableFilters) {
  const key = `${model}|${normalizeCab(cab)}|${String(bed || '').replace(/\s+/g, '')}`;
  const expected = {
    '1500|Crew|5\'7"': ['144.5', '145.1'],
    '1500|Quad|6\'4"': ['140.5'],
    '2500|Regular|8\'': ['140.5'],
    '2500|Crew|6\'4"': ['149', '149.0'],
    '2500|Crew|8\'': ['169', '169.0'],
    '2500|Mega|6\'4"': ['160.5'],
    '3500|Regular|8\'': ['140'],
    '3500|Crew|6\'4"': ['149.5'],
    '3500|Crew|8\'': ['169.5'],
  }[key] || [];

  return unique(expected.filter((value) => (availableFilters || []).includes(value)));
}

function slugifyTrackingValue(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function applyTrackingParams(url, row, tracking = {}) {
  const trackedUrl = new URL(url);
  const source = tracking.source || 'ramtow.com';
  const medium = tracking.medium || 'referral';
  const campaign = tracking.campaign || 'perkins_inventory';
  const content = tracking.content || [
    tracking.context || 'inventory',
    `ram-${row.model || 'truck'}`,
    slugifyTrackingValue(row.engine),
    slugifyTrackingValue(row.drive),
    slugifyTrackingValue(row.cab),
    slugifyTrackingValue(row.bed),
  ].filter(Boolean).join('_');

  trackedUrl.searchParams.set('utm_source', source);
  trackedUrl.searchParams.set('utm_medium', medium);
  trackedUrl.searchParams.set('utm_campaign', campaign);
  trackedUrl.searchParams.set('utm_content', content);

  if (tracking.trailerWeight && tracking.tongueWeight) {
    trackedUrl.searchParams.set(
      'utm_term',
      `tow-${Math.round(tracking.trailerWeight)}-payload-${Math.round(tracking.tongueWeight)}`
    );
  }

  return trackedUrl.toString();
}

function encodeFilterParam(key, values) {
  const filtered = (Array.isArray(values) ? values : [values]).filter(Boolean);
  if (!filtered.length) {
    return null;
  }

  const encodedValue =
    filtered.length === 1
      ? encodeURIComponent(filtered[0])
      : filtered.map((value) => encodeURIComponent(value)).join('~');

  return `${encodeURIComponent(key)}=${encodedValue}`;
}

function buildFilteredInventoryUrl(row, filters, tracking = {}) {
  if (!filters?.baseUrl) {
    return null;
  }

  const applied = [];
  const advancedSearchUrl = new URL('https://perkinsmotors.com/advanced-search');
  const engineValues = getMatchingPerkinsEngineFilters(filters.engines, row.engine);
  const drivetrainValue = filters.drivetrains.find((value) => normalizeDrive(value) === row.drive);
  const cabValue = getMatchingPerkinsCabFilter(filters.cabs, row.cab);
  const wheelbaseValues = getMatchingPerkinsWheelbaseFilters(
    String(row.model || ''),
    row.cab,
    row.bed,
    filters.wheelbases
  );
  const queryParts = [
    encodeFilterParam('condition', 'new'),
    encodeFilterParam('make', 'Ram'),
    encodeFilterParam('model', String(row.model || '')),
  ];

  if (engineValues.length) {
    queryParts.push(encodeFilterParam('engine', engineValues));
    for (const value of engineValues) {
      applied.push(`Engine: ${value}`);
    }
  }

  if (drivetrainValue) {
    queryParts.push(encodeFilterParam('drivetrain', drivetrainValue));
    applied.push(`Drivetrain: ${drivetrainValue}`);
  }

  if (cabValue) {
    queryParts.push(encodeFilterParam('cab_type', cabValue));
    applied.push(`Cab: ${cabValue}`);
  }

  if (wheelbaseValues.length) {
    queryParts.push(encodeFilterParam('wheelbase_code', wheelbaseValues));
    applied.push(`Bed: ${row.bed} (wheelbase)`);
  } else if (row.bed) {
    applied.push(`Bed to verify: ${row.bed}`);
  }

  advancedSearchUrl.search = queryParts.filter(Boolean).join('&');

  return {
    url: applyTrackingParams(advancedSearchUrl.toString(), row, tracking),
    applied,
  };
}

async function attachInventorySearchLinks(recommendations, tracking = {}) {
  const models = unique(recommendations.map((row) => row.model).filter((model) => MODEL_LISTING_URLS[model]));
  const filtersByModel = Object.fromEntries(
    await Promise.all(models.map(async (model) => [model, await loadModelFilters(model)]))
  );

  return {
    source: 'https://perkinsmotors.com',
    checkedAt: new Date().toISOString(),
    results: recommendations.map((row) => {
      const inventoryLink = buildFilteredInventoryUrl(row, filtersByModel[row.model], tracking);
      return {
        ...row,
        inventoryLink,
      };
    }),
  };
}

function trimMatches(expected, actual) {
  if (!expected || !actual) {
    return false;
  }
  const normalizedExpected = normalizeTrim(expected);
  const normalizedActual = normalizeTrim(actual);
  if (!normalizedExpected || !normalizedActual) {
    return false;
  }
  return (
    normalizedExpected === normalizedActual ||
    normalizedExpected.includes(normalizedActual) ||
    normalizedActual.includes(normalizedExpected)
  );
}

function scoreInventoryMatch(row, item) {
  let score = 0;
  const mismatches = [];

  if (row.engine && item.engine) {
    if (row.engine === item.engine) {
      score += 40;
    } else {
      mismatches.push('engine');
      score -= 40;
    }
  }

  if (row.drive && item.drive) {
    if (row.drive === item.drive) {
      score += 22;
    } else {
      mismatches.push('drive');
      score -= 20;
    }
  }

  if (row.cab && item.cab) {
    if (row.cab === item.cab) {
      score += 18;
    } else {
      mismatches.push('cab');
      score -= 16;
    }
  }

  if (row.bed && item.bed) {
    if (row.bed === item.bed) {
      score += 14;
    } else {
      mismatches.push('bed');
      score -= 10;
    }
  }

  if (row.rearWheels && item.rearWheels) {
    if (row.rearWheels === item.rearWheels) {
      score += 18;
    } else {
      mismatches.push('rearWheels');
      score -= 28;
    }
  }

  if (row.trim && item.trim) {
    if (trimMatches(row.trim, item.trim)) {
      score += 12;
    } else {
      mismatches.push('trim');
      score -= 8;
    }
  }

  if (row.axleRatio) {
    if (item.axleRatios.includes(row.axleRatio)) {
      score += 18;
    } else if (item.axleRatios.length) {
      mismatches.push('axleRatio');
      score -= 14;
    }
  }

  if (item.year === 2026) {
    score += 4;
  } else if (item.year && item.year > 2026) {
    score += 2;
  }

  return {
    score,
    mismatches,
  };
}

function findBestInventoryMatch(row, inventory) {
  const candidates = inventory
    .filter((item) => item.model === row.model)
    .map((item) => ({
      item,
      scoreInfo: scoreInventoryMatch(row, item),
    }))
    .filter(({ item, scoreInfo }) => {
      if (scoreInfo.mismatches.includes('engine')) {
        return false;
      }
      if (scoreInfo.mismatches.includes('drive')) {
        return false;
      }
      if (scoreInfo.mismatches.includes('cab')) {
        return false;
      }
      if (scoreInfo.mismatches.includes('bed')) {
        return false;
      }
      if (scoreInfo.mismatches.includes('rearWheels')) {
        return false;
      }
      if (scoreInfo.mismatches.includes('axleRatio')) {
        return false;
      }
      if (scoreInfo.score < 20) {
        return false;
      }
      return Boolean(item.stockNumber && item.inventoryUrl && item.price);
    })
    .sort((left, right) => {
      if (right.scoreInfo.score !== left.scoreInfo.score) {
        return right.scoreInfo.score - left.scoreInfo.score;
      }
      if (left.item.price !== right.item.price) {
        return left.item.price - right.item.price;
      }
      return (right.item.year || 0) - (left.item.year || 0);
    });

  const best = candidates[0];
  if (!best) {
    return null;
  }

  const exactFields = ['drive', 'cab', 'trim', 'axleRatio', 'bed', 'rearWheels'];
  const exact = exactFields.every((field) => !best.scoreInfo.mismatches.includes(field));

  return {
    stockNumber: best.item.stockNumber,
    inventoryUrl: best.item.inventoryUrl,
    inventoryTitle: best.item.title,
    inventoryVin: best.item.inventoryVin,
    currentPrice: best.item.price,
    matchLabel: exact ? 'Exact Perkins match' : 'Closest Perkins match',
    matchScore: best.scoreInfo.score,
    trimKey: best.item.trimKey || normalizeTrim(best.item.trim || best.item.title),
  };
}

function buildCandidateProfile(rows) {
  const sourceRows = Array.isArray(rows) ? rows : [];

  return {
    engines: unique(sourceRows.map((row) => row.engine)),
    drives: unique(sourceRows.map((row) => row.drive)),
    cabs: unique(sourceRows.map((row) => row.cab)),
    beds: unique(sourceRows.map((row) => row.bed)),
    rearWheels: unique(sourceRows.map((row) => row.rearWheels)),
    axleRatios: unique(sourceRows.map((row) => row.axleRatio)),
    trims: unique(sourceRows.map((row) => row.trim)),
  };
}

function inventoryMatchesCandidateProfile(item, profile) {
  if (!item?.inventoryVin) {
    return false;
  }

  if (item.year && item.year < 2026) {
    return false;
  }

  const scalarChecks = [
    ['engine', profile.engines],
    ['drive', profile.drives],
    ['cab', profile.cabs],
    ['bed', profile.beds],
    ['rearWheels', profile.rearWheels],
  ];

  for (const [field, allowed] of scalarChecks) {
    if (item[field] && allowed.length && !allowed.includes(item[field])) {
      return false;
    }
  }

  if (
    profile.axleRatios.length &&
    item.axleRatios.length &&
    !item.axleRatios.some((ratio) => profile.axleRatios.includes(ratio))
  ) {
    return false;
  }

  if (
    profile.trims.length &&
    item.trim &&
    !profile.trims.some((trim) => trimMatches(trim, item.trim))
  ) {
    return false;
  }

  return true;
}

function applyVerifiedCapacities(row, verified) {
  if (!verified) {
    return row;
  }

  return {
    ...row,
    trim: verified.trim || row.trim,
    drive: verified.drive || row.drive,
    cab: verified.cab || row.cab,
    bed: verified.bed || row.bed,
    engine: verified.engine || row.engine,
    axleRatio: verified.axleRatio || row.axleRatio,
    towGCWR: verified.towGCWR ?? row.towGCWR,
    payloadGVWR: verified.payloadGVWR ?? row.payloadGVWR,
    maxTow: verified.towCapacity ?? row.maxTow,
    maxPayload: verified.payloadCapacity ?? row.maxPayload,
    verificationSource: verified.sourceVin ? 'vin' : row.verificationSource || null,
  };
}

function meetsTrailerRequirements(row, requirements = {}) {
  const trailerWeight = Number(requirements?.trailerWeight);
  const tongueWeight = Number(requirements?.tongueWeight);

  if (Number.isFinite(trailerWeight) && trailerWeight > 0 && row.maxTow < trailerWeight) {
    return false;
  }

  if (Number.isFinite(tongueWeight) && tongueWeight > 0 && row.maxPayload < tongueWeight) {
    return false;
  }

  return true;
}

async function verifyInventoryCapabilities(inventoryMatch) {
  const vin = String(inventoryMatch?.inventoryVin || '').trim().toUpperCase();
  if (!vin) {
    return null;
  }

  const cached = verificationCache.get(vin);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.value;
  }

  let value = null;

  try {
    const vinLookup = await lookupVin(vin);
    const matches = findMatches(vinLookup.detectedSpec);
    const towMatch = matches.towMatches[0] || null;
    const payloadMatch = matches.payloadMatches[0] || null;

    if (towMatch && payloadMatch) {
      value = {
        sourceVin: vin,
        detectedSpec: vinLookup.detectedSpec,
        towMatch,
        payloadMatch,
        trim: vinLookup.detectedSpec.trim || null,
        drive: towMatch.drive || vinLookup.detectedSpec.drive || null,
        cab: towMatch.cab || payloadMatch.cab || vinLookup.detectedSpec.cab || null,
        bed: towMatch.bed || payloadMatch.bed || vinLookup.detectedSpec.bed || null,
        engine: towMatch.engine || payloadMatch.engine || vinLookup.detectedSpec.engine || null,
        axleRatio: towMatch.axleRatio || vinLookup.detectedSpec.axleRatio || null,
        towGCWR: towMatch.gcwr || null,
        payloadGVWR: payloadMatch.gvwr || null,
        towCapacity: towMatch.maxTow,
        payloadCapacity: payloadMatch.maxPayload,
      };
    }
  } catch (_error) {
    value = null;
  }

  verificationCache.set(vin, {
    fetchedAt: Date.now(),
    value,
  });

  return value;
}

function createVerifiedInventoryRow(item, verified, requirements) {
  const row = {
    model: verified.detectedSpec?.model || item.model || null,
    engine: verified.engine || item.engine || null,
    trim: verified.trim || item.trim || null,
    drive: verified.drive || item.drive || null,
    cab: verified.cab || item.cab || null,
    bed: verified.bed || item.bed || null,
    rearWheels: verified.detectedSpec?.rearWheels || item.rearWheels || null,
    axleRatio: verified.axleRatio || null,
    towGCWR: verified.towGCWR || null,
    payloadGVWR: verified.payloadGVWR || null,
    maxTow: verified.towCapacity,
    maxPayload: verified.payloadCapacity,
    towSurplus: verified.towCapacity - requirements.trailerWeight,
    payloadSurplus: verified.payloadCapacity - requirements.tongueWeight,
    confidence: 'high',
    verificationSource: 'vin',
    inventoryMatch: {
      stockNumber: item.stockNumber,
      inventoryUrl: item.inventoryUrl,
      inventoryTitle: item.title,
      inventoryVin: item.inventoryVin,
      currentPrice: item.price,
      matchLabel: 'VIN-verified Perkins match',
      matchScore: 100,
      trimKey: item.trimKey || normalizeTrim(item.trim || item.title),
    },
  };

  return row;
}

function sortAndLimitResults(results) {
  const matchedResults = results.filter((row) => row.inventoryMatch);
  const sorted = [...matchedResults].sort((left, right) => {
    const leftPrice = left.inventoryMatch?.currentPrice ?? Number.POSITIVE_INFINITY;
    const rightPrice = right.inventoryMatch?.currentPrice ?? Number.POSITIVE_INFINITY;
    if (leftPrice !== rightPrice) {
      return leftPrice - rightPrice;
    }
    if (left.maxTow !== right.maxTow) {
      return left.maxTow - right.maxTow;
    }
    if (left.maxPayload !== right.maxPayload) {
      return left.maxPayload - right.maxPayload;
    }
    return (right.inventoryMatch?.matchScore || 0) - (left.inventoryMatch?.matchScore || 0);
  });

  const seenStocks = new Set();
  const trimCounts = new Map();
  const trimmed = [];

  for (const row of sorted) {
    const stockNumber = row.inventoryMatch?.stockNumber;
    if (stockNumber) {
      if (seenStocks.has(stockNumber)) {
        continue;
      }
      seenStocks.add(stockNumber);
    }

    const trimKey =
      row.inventoryMatch?.trimKey ||
      normalizeTrim(row.trim || `${row.model} ${row.engine} ${row.cab} ${row.bed} ${row.drive}`);
    const count = trimCounts.get(trimKey) || 0;
    if (count >= MAX_PER_TRIM) {
      continue;
    }

    trimCounts.set(trimKey, count + 1);
    trimmed.push(row);

    if (trimmed.length >= MAX_RESULTS) {
      break;
    }
  }

  return trimmed;
}

async function attachInventoryMatches(results, requirements = {}) {
  const models = unique(results.map((row) => row.model).filter((model) => MODEL_LISTING_URLS[model]));
  const inventoryEntries = await Promise.all(
    models.map(async (model) => [model, await loadModelInventory(model)])
  );
  const inventoryByModel = Object.fromEntries(inventoryEntries);
  const profilesByModel = Object.fromEntries(
    models.map((model) => [model, buildCandidateProfile(results.filter((row) => row.model === model))])
  );

  const candidateInventory = models.flatMap((model) =>
    (inventoryByModel[model] || []).filter((item) => inventoryMatchesCandidateProfile(item, profilesByModel[model]))
  );

  const verified = await mapWithConcurrency(candidateInventory, VERIFY_CONCURRENCY, async (item) => {
    const capabilities = await verifyInventoryCapabilities({
      inventoryVin: item.inventoryVin,
    });
    if (!capabilities) {
      return null;
    }

    const verifiedRow = createVerifiedInventoryRow(item, capabilities, requirements);
    if (!meetsTrailerRequirements(verifiedRow, requirements)) {
      return null;
    }

    return verifiedRow;
  });

  return {
    source: 'https://perkinsmotors.com',
    checkedAt: new Date().toISOString(),
    results: sortAndLimitResults(verified.filter(Boolean)),
  };
}

module.exports = {
  applyVerifiedCapacities,
  attachInventoryMatches,
  attachInventorySearchLinks,
  buildFilteredInventoryUrl,
  buildCandidateProfile,
  findBestInventoryMatch,
  getMatchingPerkinsEngineFilters,
  inventoryMatchesCandidateProfile,
  meetsTrailerRequirements,
  scoreInventoryMatch,
};
