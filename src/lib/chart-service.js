const fs = require('fs');
const { createPdfParser } = require('./pdf-runtime');
const {
  DEFAULT_CHART_YEAR,
  GOOSENECK_REQUIRED_OVER,
  HITCH_LIMITS,
  getPdfPaths,
  getTowRows,
  getPayloadRows,
  resolveChartYear,
} = require('../data/chart-data');

const towRows = getTowRows(DEFAULT_CHART_YEAR);
const payloadRows = getPayloadRows(DEFAULT_CHART_YEAR);

const chartCache = {
  textsByYear: {},
};

const CRITICAL_MISMATCH_KEYS = new Set(['model', 'engine', 'drive', 'cab', 'bed', 'rearWheels']);

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function toNumber(value) {
  if (value == null || value === '') {
    return null;
  }
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  return cleaned ? Number(cleaned) : null;
}

function normalizeDrive(value) {
  const text = normalize(value);
  if (!text) {
    return null;
  }
  if (text.includes('4x4') || text.includes('4 wheel drive') || text.includes('4wd')) {
    return '4x4';
  }
  if (text.includes('4x2') || text.includes('2wd') || text.includes('rear wheel drive')) {
    return '4x2';
  }
  return null;
}

function normalizeCab(value) {
  const text = normalize(value);
  const raw = String(value || '').toLowerCase();
  if (!text) {
    return null;
  }
  if (text.includes('mega')) {
    return 'Mega';
  }
  if (text.includes('quad')) {
    return 'Quad';
  }
  if (/\breg(ular)?\s+cab\b/i.test(raw) || /\bstandard\s+cab\b/i.test(raw)) {
    return 'Regular';
  }
  if (text.includes('regular')) {
    return 'Regular';
  }
  if (text.includes('crew')) {
    return 'Crew';
  }
  return null;
}

function normalizeBed(value) {
  const raw = String(value || '').toLowerCase();
  const text = normalize(value);
  if (!raw.trim()) {
    return null;
  }
  if (/^8\s*'?\s*$/i.test(raw) || /8\s*'\s*(box|bed)?/i.test(raw) || /\b8\s*ft\.?\s*(box|bed)?/i.test(raw) || /long box/i.test(raw) || /long bed/i.test(raw)) {
    return `8'`;
  }
  if (/5\s*'\s*7\s*(box|bed)?/i.test(raw) || /\b5\s*ft\.?\s*7\b/i.test(raw) || /\bshort box\b/i.test(raw) || /\bshort bed\b/i.test(raw)) {
    return `5'7"`;
  }
  if (/6\s*'\s*4\s*(box|bed)?/i.test(raw) || /\b6\s*ft\.?\s*4\b/i.test(raw) || /\bstandard box\b/i.test(raw) || /\bstandard bed\b/i.test(raw)) {
    return `6'4"`;
  }
  if (text === 'short') {
    return `5'7"`;
  }
  if (text === 'long') {
    return `8'`;
  }
  return null;
}

function normalizeRearWheels(value) {
  const text = normalize(value);
  if (!text) {
    return null;
  }
  if (text.includes('drw') || text.includes('dual rear')) {
    return 'DRW';
  }
  if (text.includes('srw') || text.includes('single rear')) {
    return 'SRW';
  }
  return null;
}

function normalizeEngine(value) {
  const text = normalize(value);
  if (!text) {
    return null;
  }
  if (text.includes('pentastar') || (text.includes('3 6l') && text.includes('v6'))) {
    return '3.6L Pentastar V6 eTorque';
  }
  if (text.includes('5 7l') && text.includes('hemi')) {
    return '5.7L HEMI V8 eTorque';
  }
  if (text.includes('hurricane h o') || text.includes('hurricane ho') || (text.includes('hurricane') && text.includes('ho'))) {
    return '3.0L Hurricane HO';
  }
  if (text.includes('hurricane') || text.includes('twin turbo')) {
    return '3.0L Hurricane SO';
  }
  if (text.includes('6 4l') && text.includes('hemi')) {
    return '6.4L HEMI V8';
  }
  if (text.includes('cummins') || (text.includes('6 7l') && text.includes('high output'))) {
    return '6.7L Cummins HO';
  }
  return null;
}

function cleanSpec(input = {}) {
  return {
    vin: String(input.vin || '').toUpperCase(),
    year: input.year ? Number(input.year) : null,
    model: input.model ? String(input.model) : null,
    drive: normalizeDrive(input.drive),
    cab: normalizeCab(input.cab),
    bed: normalizeBed(input.bed),
    rearWheels: normalizeRearWheels(input.rearWheels),
    engine: normalizeEngine(input.engine),
    trim: input.trim ? String(input.trim).trim() : null,
    axleRatio: input.axleRatio ? String(input.axleRatio).trim() : null,
    gvwr: toNumber(input.gvwr),
    gvwrClassMin: toNumber(input.gvwrClassMin),
    gvwrClassMax: toNumber(input.gvwrClassMax),
  };
}

function normalizeHitchType(value) {
  const text = normalize(value);
  if (!text) {
    return 'conventional';
  }
  if (text.includes('gooseneck') || text.includes('5th') || text.includes('fifth') || text.includes('pin')) {
    return 'gooseneck';
  }
  return 'conventional';
}

function trimMatches(expected, actual) {
  if (!expected) {
    return true;
  }
  if (!actual) {
    return false;
  }
  return normalize(actual).includes(normalize(expected));
}

function scoreRow(row, spec, isPayload) {
  let score = 0;
  const mismatches = [];

  if (spec.model && row.model !== spec.model) {
    mismatches.push('model');
  } else if (spec.model) {
    score += 40;
  }

  if (spec.engine && row.engine !== spec.engine) {
    mismatches.push('engine');
  } else if (spec.engine) {
    score += 30;
  }

  if (spec.drive && row.drive !== spec.drive) {
    mismatches.push('drive');
  } else if (spec.drive) {
    score += 22;
  }

  if (spec.cab && row.cab !== spec.cab) {
    mismatches.push('cab');
  } else if (spec.cab) {
    score += 20;
  }

  if (spec.bed && row.bed !== spec.bed) {
    mismatches.push('bed');
  } else if (spec.bed) {
    score += 20;
  }

  if (spec.rearWheels && row.rearWheels && row.rearWheels !== spec.rearWheels) {
    mismatches.push('rearWheels');
  } else if (spec.rearWheels && row.rearWheels === spec.rearWheels) {
    score += 18;
  }

  if (spec.trim && !trimMatches(row.trim || row.trimHint, spec.trim)) {
    mismatches.push('trim');
  } else if (spec.trim && trimMatches(row.trim || row.trimHint, spec.trim)) {
    score += 12;
  }

  if (!isPayload && spec.axleRatio && row.axleRatio !== spec.axleRatio) {
    mismatches.push('axleRatio');
  } else if (!isPayload && spec.axleRatio) {
    score += 16;
  }

  if (spec.gvwr && row.gvwr && row.gvwr !== spec.gvwr) {
    mismatches.push('gvwr');
  } else if (spec.gvwr && row.gvwr) {
    score += 16;
  }

  if (row.confidence === 'medium') {
    score -= 6;
  }

  return { score, mismatches };
}

function compareRankedMatches(left, right) {
  if (right.scoreInfo.score !== left.scoreInfo.score) {
    return right.scoreInfo.score - left.scoreInfo.score;
  }

  if (left.scoreInfo.mismatches.length !== right.scoreInfo.mismatches.length) {
    return left.scoreInfo.mismatches.length - right.scoreInfo.mismatches.length;
  }

  const leftConfidencePenalty = left.row.confidence === 'medium' ? 1 : 0;
  const rightConfidencePenalty = right.row.confidence === 'medium' ? 1 : 0;
  if (leftConfidencePenalty !== rightConfidencePenalty) {
    return leftConfidencePenalty - rightConfidencePenalty;
  }

  return (left.row.gvwr || 0) - (right.row.gvwr || 0);
}

function decorateMatch(row, scoreInfo, type) {
  return {
    ...row,
    matchScore: scoreInfo.score,
    mismatches: scoreInfo.mismatches,
    chartSource: type === 'tow' ? 'RAM towing chart' : 'RAM payload chart',
  };
}

function hasDisallowedMismatch(scoreInfo) {
  return scoreInfo.mismatches.some((key) => CRITICAL_MISMATCH_KEYS.has(key));
}

function sameMatchFamily(left, right) {
  return ['model', 'engine', 'drive', 'cab', 'bed', 'rearWheels']
    .every((key) => (left?.[key] || null) === (right?.[key] || null));
}

function listToSentence(items) {
  if (!items.length) {
    return '';
  }
  if (items.length === 1) {
    return items[0];
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
}

function buildVinCapacitySummary(spec, matches, kind) {
  const matchList = kind === 'payload' ? matches.payloadMatches || [] : matches.towMatches || [];
  const primary = matchList[0] || null;

  if (!primary) {
    return null;
  }

  let candidateRows = matchList.filter((row) => sameMatchFamily(row, primary));

  const selectedDetails = [];
  if (spec.axleRatio) {
    selectedDetails.push(`axle ratio ${spec.axleRatio}`);
    candidateRows = candidateRows.filter((row) => !row.axleRatio || row.axleRatio === spec.axleRatio);
  }

  if (spec.gvwr) {
    selectedDetails.push(`GVWR ${formatNumber(spec.gvwr)} lb`);
    candidateRows = candidateRows.filter((row) => !row.gvwr || row.gvwr === spec.gvwr);
  } else {
    const gvwrMin = toNumber(spec.gvwrClassMin);
    const gvwrMax = toNumber(spec.gvwrClassMax);
    if (gvwrMin || gvwrMax) {
      candidateRows = candidateRows.filter((row) => {
        if (!row.gvwr) {
          return true;
        }
        if (gvwrMin && row.gvwr < gvwrMin) {
          return false;
        }
        if (gvwrMax && row.gvwr > gvwrMax) {
          return false;
        }
        return true;
      });
    }
  }

  if (!candidateRows.length) {
    return {
      isRange: false,
      selectionMismatch: selectedDetails.length > 0,
      min: null,
      max: null,
      candidateCount: 0,
      reasonText: selectedDetails.join(' and ') || null,
      note: selectedDetails.length
        ? `The selected ${selectedDetails.join(' and ')} does not have a matching RAM ${kind === 'payload' ? 'payload' : 'towing'} chart row for this detected truck setup. Check the door sticker and try another selection.`
        : 'No matching RAM chart row was found for this truck setup.',
    };
  }

  const capacityKey = kind === 'payload' ? 'maxPayload' : 'maxTow';
  const values = Array.from(new Set(candidateRows.map((row) => row[capacityKey]).filter(Number.isFinite))).sort((a, b) => a - b);
  const axleValues = Array.from(new Set(candidateRows.map((row) => row.axleRatio).filter(Boolean)));
  const gvwrValues = Array.from(new Set(candidateRows.map((row) => row.gvwr).filter(Number.isFinite)));
  const needsRange = values.length > 1 && (!spec.axleRatio || !spec.gvwr);

  const summary = {
    isRange: needsRange,
    selectionMismatch: false,
    min: values[0] ?? primary[capacityKey] ?? null,
    max: values.at(-1) ?? primary[capacityKey] ?? null,
    candidateCount: candidateRows.length,
    reasonText: null,
    note: null,
  };

  if (!needsRange) {
    return summary;
  }

  const reasons = [];
  if (!spec.axleRatio && axleValues.length > 1) {
    reasons.push('axle ratio');
  }
  if (!spec.gvwr && gvwrValues.length > 1) {
    reasons.push('door-sticker GVWR');
  }

  summary.reasonText = listToSentence(reasons) || 'sticker details';
  summary.note = `Range shown because the window sticker does not clearly confirm ${summary.reasonText}. Confirm on the door sticker or with your dealer.`;

  return summary;
}

function findMatches(spec, options = {}) {
  const chartYear = resolveChartYear(options.year || spec?.year);
  const towRowsForYear = getTowRows(chartYear);
  const payloadRowsForYear = getPayloadRows(chartYear);

  const towMatches = towRowsForYear
    .map((row) => ({ row, scoreInfo: scoreRow(row, spec, false) }))
    .filter(({ scoreInfo }) => scoreInfo.mismatches.length <= 2 && !hasDisallowedMismatch(scoreInfo))
    .sort(compareRankedMatches)
    .map(({ row, scoreInfo }) => decorateMatch(row, scoreInfo, 'tow'));

  const payloadMatches = payloadRowsForYear
    .map((row) => ({ row, scoreInfo: scoreRow(row, spec, true) }))
    .filter(({ scoreInfo }) => scoreInfo.mismatches.length <= 2 && !hasDisallowedMismatch(scoreInfo))
    .sort(compareRankedMatches)
    .map(({ row, scoreInfo }) => decorateMatch(row, scoreInfo, 'payload'));

  return {
    towMatches: towMatches.slice(0, 6),
    payloadMatches: payloadMatches.slice(0, 6),
  };
}

function getOverrideOptions(spec, matches) {
  const options = {
    model: new Set(),
    engine: new Set(),
    drive: new Set(),
    cab: new Set(),
    bed: new Set(),
    rearWheels: new Set(),
    axleRatio: new Set(),
    gvwr: new Set(),
    trim: new Set(),
  };

  for (const row of [...matches.towMatches, ...matches.payloadMatches]) {
    for (const key of Object.keys(options)) {
      if (row[key]) {
        options[key].add(String(row[key]));
      }
    }
    if (row.trimHint) {
      options.trim.add(String(row.trimHint));
    }
  }

  for (const key of Object.keys(options)) {
    if (spec[key]) {
      options[key].add(String(spec[key]));
    }
    options[key] = Array.from(options[key]).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }

  return options;
}

async function ensureChartTexts(year = DEFAULT_CHART_YEAR) {
  const chartYear = resolveChartYear(year);
  if (chartCache.textsByYear[chartYear]) {
    return chartCache.textsByYear[chartYear];
  }

  const texts = {
    ram1500: '',
    ramHD: '',
  };
  const pdfPaths = getPdfPaths(chartYear);

  for (const [key, path] of Object.entries(pdfPaths)) {
    if (!path || !fs.existsSync(path)) {
      texts[key] = '';
      continue;
    }
    const parser = await createPdfParser(fs.readFileSync(path));
    const result = await parser.getText();
    texts[key] = result.text;
    await parser.destroy();
  }

  chartCache.textsByYear[chartYear] = texts;
  return texts;
}

function getEngineNeedle(spec) {
  if (spec.engine) {
    return spec.engine;
  }
  if (spec.model === '1500') {
    return 'Hurricane';
  }
  return 'Cummins';
}

function makeSnippet(text, needle) {
  const haystack = text || '';
  const idx = haystack.toLowerCase().indexOf(needle.toLowerCase());
  if (idx === -1) {
    return null;
  }
  const start = Math.max(0, idx - 220);
  const end = Math.min(haystack.length, idx + 460);
  return haystack.slice(start, end).replace(/\s+/g, ' ').trim();
}

async function findRawChartHints(spec, options = {}) {
  const chartYear = resolveChartYear(options.year || spec?.year);
  const texts = await ensureChartTexts(chartYear);
  const chartText = spec.model === '1500' ? texts.ram1500 : texts.ramHD;
  const hints = [];
  const needles = [getEngineNeedle(spec), spec.axleRatio, spec.gvwr, spec.trim].filter(Boolean);

  for (const needle of needles) {
    const snippet = makeSnippet(chartText, String(needle));
    if (snippet) {
      hints.push({ needle: String(needle), snippet });
    }
  }

  return hints.slice(0, 3);
}

function pairPayloadRows(towRow, tongueWeight, payloadRowsForYear = payloadRows) {
  return payloadRowsForYear.filter((payloadRow) => {
    if (payloadRow.model !== towRow.model) {
      return false;
    }
    if (payloadRow.engine !== towRow.engine) {
      return false;
    }
    if (payloadRow.cab !== towRow.cab) {
      return false;
    }
    if (payloadRow.bed !== towRow.bed) {
      return false;
    }
    if (payloadRow.drive !== towRow.drive) {
      return false;
    }
    if ((payloadRow.rearWheels || towRow.rearWheels) && payloadRow.rearWheels !== towRow.rearWheels) {
      return false;
    }
    if ((payloadRow.trim || towRow.trim) && !trimMatches(payloadRow.trim || towRow.trim, towRow.trim || payloadRow.trim)) {
      return false;
    }
    if (towRow.trimHint && !trimMatches(towRow.trimHint, payloadRow.trimHint || payloadRow.trim)) {
      return false;
    }
    if (tongueWeight > payloadRow.maxPayload) {
      return false;
    }
    return true;
  });
}

function collectReverseLookupRows({ trailerWeight, tongueWeight, modelPreference, hitchType }) {
  const modelFilter = String(modelPreference || '').trim();
  const hitchMode = normalizeHitchType(hitchType);
  const towRowsForYear = towRows;
  const payloadRowsForYear = payloadRows;
  const results = [];

  for (const towRow of towRowsForYear) {
    if (modelFilter && towRow.model !== modelFilter) {
      continue;
    }
    if (hitchMode === 'gooseneck' && towRow.model === '1500') {
      continue;
    }
    if (towRow.maxTow < trailerWeight) {
      continue;
    }
    if (hitchMode === 'conventional') {
      const hitchLimit = HITCH_LIMITS[towRow.model];
      if (hitchLimit && tongueWeight > hitchLimit) {
        continue;
      }
      const gooseneckRequiredOver = GOOSENECK_REQUIRED_OVER[towRow.model];
      if (gooseneckRequiredOver && trailerWeight > gooseneckRequiredOver) {
        continue;
      }
    }
    const payloadCandidates = pairPayloadRows(towRow, tongueWeight, payloadRowsForYear);
    for (const payloadRow of payloadCandidates) {
      results.push({
        model: towRow.model,
        engine: towRow.engine,
        trim: towRow.trim || payloadRow.trim || towRow.trimHint || payloadRow.trimHint || null,
        drive: towRow.drive,
        cab: towRow.cab,
        bed: towRow.bed,
        rearWheels: towRow.rearWheels || null,
        axleRatio: towRow.axleRatio || null,
        towGCWR: towRow.gcwr || null,
        payloadGVWR: payloadRow.gvwr || null,
        maxTow: towRow.maxTow,
        maxPayload: payloadRow.maxPayload,
        towSurplus: towRow.maxTow - trailerWeight,
        payloadSurplus: payloadRow.maxPayload - tongueWeight,
        confidence: towRow.confidence || payloadRow.confidence || 'high',
        hitchType: hitchMode,
      });
    }
  }

  return results
    .sort((a, b) => {
      const modelDiff = Number(a.model) - Number(b.model);
      if (modelDiff !== 0) {
        return modelDiff;
      }
      if (a.maxTow !== b.maxTow) {
        return a.maxTow - b.maxTow;
      }
      if (a.maxPayload !== b.maxPayload) {
        return a.maxPayload - b.maxPayload;
      }
      return (a.payloadGVWR || 0) - (b.payloadGVWR || 0);
    });
}

function reverseLookup({ trailerWeight, tongueWeight, modelPreference, hitchType }) {
  return collectReverseLookupRows({ trailerWeight, tongueWeight, modelPreference, hitchType }).slice(0, 12);
}

function getReverseProfileKey(row) {
  return [
    row.model || '',
    row.engine || '',
    row.drive || '',
    row.rearWheels || '',
  ].join('|');
}

function getRecommendationTitle(row, context = {}) {
  const modelName = `RAM ${row.model}`;

  if (context.kind === 'minimum') {
    return context.modelFilter ? `Minimum ${modelName} setup` : 'Minimum setup';
  }

  if (context.kind === 'alternate') {
    return `${modelName} alternate`;
  }

  if (context.kind === 'stepup') {
    return `${modelName} step-up`;
  }

  return modelName;
}

function buildReverseRecommendations({ trailerWeight, tongueWeight, modelPreference, hitchType }) {
  const rows = collectReverseLookupRows({ trailerWeight, tongueWeight, modelPreference, hitchType });
  const modelFilter = String(modelPreference || '').trim();
  const uniqueRows = [];
  const seenProfiles = new Set();

  for (const row of rows) {
    const profileKey = getReverseProfileKey(row);
    if (seenProfiles.has(profileKey)) {
      continue;
    }
    seenProfiles.add(profileKey);
    uniqueRows.push(row);
  }

  if (!uniqueRows.length) {
    return [];
  }

  const selected = [];
  const selectedKeys = new Set();
  const primaryModel = uniqueRows[0].model;
  const maxPrimaryCount = modelFilter ? 4 : 3;

  function addRow(row, kind) {
    if (!row) {
      return false;
    }
    const key = getReverseProfileKey(row);
    if (selectedKeys.has(key)) {
      return false;
    }
    selected.push({
      ...row,
      recommendationTitle: getRecommendationTitle(row, { kind, modelFilter }),
    });
    selectedKeys.add(key);
    return true;
  }

  addRow(uniqueRows[0], 'minimum');

  for (const row of uniqueRows) {
    if (selected.length >= maxPrimaryCount) {
      break;
    }
    if (row.model !== primaryModel) {
      continue;
    }
    addRow(row, 'alternate');
  }

  if (!modelFilter) {
    const seenModels = new Set([primaryModel]);
    for (const row of uniqueRows) {
      if (selected.length >= 4) {
        break;
      }
      if (seenModels.has(row.model)) {
        continue;
      }
      if (addRow(row, 'stepup')) {
        seenModels.add(row.model);
      }
    }
  }

  return selected;
}

function buildReverseInsights({ trailerWeight, tongueWeight, modelPreference, hitchType }, recommendations = []) {
  const modelFilter = String(modelPreference || '').trim();
  const hitchMode = normalizeHitchType(hitchType);
  const insights = [];
  const has1500Recommendation = recommendations.some((row) => row.model === '1500');

  if (hitchMode === 'conventional' && has1500Recommendation && tongueWeight > HITCH_LIMITS['1500']) {
    insights.push({
      type: 'warning',
      title: 'RAM 1500 receiver-hitch limit',
      message: `RAM 1500 is excluded here because ${formatNumber(tongueWeight)} lb of tongue weight exceeds the 1,100 lb conventional Class IV hitch limit in the 2026 RAM 1500 tow chart footnotes.`,
    });
  }

  if (hitchMode === 'conventional' && trailerWeight > GOOSENECK_REQUIRED_OVER['2500']) {
    insights.push({
      type: 'warning',
      title: 'Heavy-trailer hitch requirement',
      message: 'For trailers over 20,000 lb on a RAM 2500 and over 23,000 lb on a RAM 3500, the 2026 RAM HD chart requires a 5th-wheel or gooseneck hitch instead of a conventional receiver hitch.',
    });
  }

  if (hitchMode === 'gooseneck' && has1500Recommendation) {
    insights.push({
      type: 'note',
      title: '1500 hitch type note',
      message: 'RAM 1500 recommendations are not shown in 5th-wheel / gooseneck mode because the 2026 RAM 1500 tow chart workflow here is built around conventional receiver-hitch ratings.',
    });
  }

  if (hitchMode === 'conventional' && has1500Recommendation && trailerWeight >= 5000) {
    insights.push({
      type: 'note',
      title: 'Weight-distributing hitch note',
      message: 'The 2026 RAM 1500 tow chart recommends a weight-distributing system for trailers over 5,000 lb.',
    });
  }

  return insights;
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

module.exports = {
  buildReverseInsights,
  buildReverseRecommendations,
  buildVinCapacitySummary,
  cleanSpec,
  collectReverseLookupRows,
  ensureChartTexts,
  findMatches,
  findRawChartHints,
  getOverrideOptions,
  normalizeHitchType,
  normalizeBed,
  normalizeCab,
  normalizeDrive,
  normalizeEngine,
  normalizeRearWheels,
  reverseLookup,
  towRows,
  payloadRows,
};
