const fs = require('fs');
const { createPdfParser } = require('./pdf-runtime');
const { PDF_PATHS, HITCH_LIMITS, getTowRows, getPayloadRows } = require('../data/chart-data');

const towRows = getTowRows();
const payloadRows = getPayloadRows();

const chartCache = {
  ready: false,
  texts: {
    ram1500: '',
    ramHD: '',
  },
};

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
  if (text.includes('hurricane ho') || (text.includes('hurricane') && text.includes('ho'))) {
    return '3.0L Hurricane HO';
  }
  if (text.includes('hurricane') || text.includes('twin turbo')) {
    return '3.0L Hurricane SO';
  }
  if (text.includes('6 4l') && text.includes('hemi')) {
    return '6.4L HEMI V8';
  }
  if (text.includes('cummins')) {
    return '6.7L Cummins HO';
  }
  return null;
}

function cleanSpec(input = {}) {
  return {
    vin: String(input.vin || '').toUpperCase(),
    model: input.model ? String(input.model) : null,
    drive: normalizeDrive(input.drive),
    cab: normalizeCab(input.cab),
    bed: normalizeBed(input.bed),
    rearWheels: normalizeRearWheels(input.rearWheels),
    engine: normalizeEngine(input.engine),
    trim: input.trim ? String(input.trim).trim() : null,
    axleRatio: input.axleRatio ? String(input.axleRatio).trim() : null,
    gvwr: toNumber(input.gvwr),
  };
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

function findMatches(spec) {
  const towMatches = towRows
    .map((row) => ({ row, scoreInfo: scoreRow(row, spec, false) }))
    .filter(({ scoreInfo }) => scoreInfo.mismatches.length <= 2)
    .sort(compareRankedMatches)
    .map(({ row, scoreInfo }) => decorateMatch(row, scoreInfo, 'tow'));

  const payloadMatches = payloadRows
    .map((row) => ({ row, scoreInfo: scoreRow(row, spec, true) }))
    .filter(({ scoreInfo }) => scoreInfo.mismatches.length <= 2)
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

async function ensureChartTexts() {
  if (chartCache.ready) {
    return chartCache.texts;
  }

  for (const [key, path] of Object.entries(PDF_PATHS)) {
    if (!path || !fs.existsSync(path)) {
      chartCache.texts[key] = '';
      continue;
    }
    const parser = await createPdfParser(fs.readFileSync(path));
    const result = await parser.getText();
    chartCache.texts[key] = result.text;
    await parser.destroy();
  }

  chartCache.ready = true;
  return chartCache.texts;
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

async function findRawChartHints(spec) {
  const texts = await ensureChartTexts();
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

function pairPayloadRows(towRow, tongueWeight) {
  return payloadRows.filter((payloadRow) => {
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

function collectReverseLookupRows({ trailerWeight, tongueWeight, modelPreference }) {
  const modelFilter = String(modelPreference || '').trim();
  const results = [];

  for (const towRow of towRows) {
    if (modelFilter && towRow.model !== modelFilter) {
      continue;
    }
    if (towRow.maxTow < trailerWeight) {
      continue;
    }
    const hitchLimit = HITCH_LIMITS[towRow.model];
    if (hitchLimit && tongueWeight > hitchLimit) {
      continue;
    }
    const payloadCandidates = pairPayloadRows(towRow, tongueWeight);
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

function reverseLookup({ trailerWeight, tongueWeight, modelPreference }) {
  return collectReverseLookupRows({ trailerWeight, tongueWeight, modelPreference }).slice(0, 12);
}

module.exports = {
  cleanSpec,
  collectReverseLookupRows,
  ensureChartTexts,
  findMatches,
  findRawChartHints,
  getOverrideOptions,
  normalizeBed,
  normalizeCab,
  normalizeDrive,
  normalizeEngine,
  normalizeRearWheels,
  reverseLookup,
  towRows,
  payloadRows,
};
