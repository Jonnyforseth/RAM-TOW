const {
  cleanSpec,
  normalizeBed,
  normalizeCab,
  normalizeDrive,
  normalizeEngine,
  normalizeRearWheels,
} = require('./chart-service');
const { createPdfParser } = require('./pdf-runtime');
const { DEFAULT_CHART_YEAR, SUPPORTED_CHART_YEARS } = require('../data/chart-data');

const WINDOW_STICKER_BASE_URL = 'https://www.chrysler.com/hostd/windowsticker/getWindowStickerPdf.do?vin=';
const NHTSA_BASE_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/';
const VIN_MODEL_YEAR_MAP = {
  K: 2019,
  L: 2020,
  M: 2021,
  N: 2022,
  P: 2023,
  R: 2024,
  S: 2025,
  T: 2026,
};
const STICKER_UNAVAILABLE_PATTERN = /unable to retrieve a window sticker for this vin/i;

function assertVin(vin) {
  const trimmed = String(vin || '').trim().toUpperCase();
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(trimmed)) {
    throw new Error('Please enter a valid 17-character VIN.');
  }
  return trimmed;
}

async function fetchStickerText(vin) {
  const pdfUrl = `${WINDOW_STICKER_BASE_URL}${vin}`;
  const response = await fetch(pdfUrl);
  if (!response.ok) {
    throw new Error(`Window sticker request failed with ${response.status}.`);
  }

  const contentType = response.headers.get('content-type') || '';
  const buffer = Buffer.from(await response.arrayBuffer());
  const isPdf = contentType.includes('pdf') || buffer.subarray(0, 4).toString('ascii') === '%PDF';
  if (!isPdf) {
    throw new Error('The Chrysler endpoint did not return a PDF for that VIN.');
  }

  const parser = await createPdfParser(buffer);
  const result = await parser.getText();
  await parser.destroy();

  return {
    pdfUrl,
    text: result.text,
  };
}

function detectModelYearFromVin(vin) {
  return VIN_MODEL_YEAR_MAP[String(vin || '').toUpperCase()[9]] || null;
}

function detectModelYearFromSticker(stickerText) {
  const match = String(stickerText || '').match(/\b(20\d{2})\s+MODEL\s+YEAR\b/i);
  return match ? Number(match[1]) : null;
}

function resolveLookupYear(vin, stickerText, decoded = {}, preferredYear = null) {
  const candidates = [
    preferredYear,
    detectModelYearFromSticker(stickerText),
    Number(decoded?.ModelYear),
    detectModelYearFromVin(vin),
  ].filter(Number.isFinite);

  const supportedYear = candidates.find((year) => SUPPORTED_CHART_YEARS.includes(year));
  if (supportedYear) {
    return supportedYear;
  }

  const detectedYear = candidates[0] || null;
  if (detectedYear) {
    throw new Error(`This lookup currently supports ${SUPPORTED_CHART_YEARS.join(' and ')} RAM charts. Detected ${detectedYear}.`);
  }

  return DEFAULT_CHART_YEAR;
}

async function decodeVin(vin, modelYear) {
  const yearParam = Number.isFinite(modelYear) ? `&modelyear=${modelYear}` : '';
  const response = await fetch(`${NHTSA_BASE_URL}${vin}?format=json${yearParam}`);
  if (!response.ok) {
    throw new Error(`NHTSA VIN decode failed with ${response.status}.`);
  }
  const payload = await response.json();
  return payload.Results?.[0] || {};
}

function detectModel(vin, stickerText, decoded = {}) {
  if (/RAM\s+(?:3500|4500|5500)\s+CHASSIS\s+CAB|CHASSIS\s+CAB/i.test(stickerText)) {
    return 'Chassis Cab';
  }
  // The 2021 and 2022 1500 Classic are the older DS platform, not DT chart sets.
  if (/RAM\s+1500\s+CLASSIC/i.test(stickerText)) {
    return '1500 Classic';
  }
  if (/RAM 1500/i.test(stickerText)) {
    return '1500';
  }
  if (/RAM 2500/i.test(stickerText)) {
    return '2500';
  }
  if (/RAM 3500/i.test(stickerText)) {
    return '3500';
  }
  const decodedModel = String(decoded.Model || '').match(/^(1500|2500|3500)$/)?.[1];
  if (decodedModel) {
    return decodedModel;
  }
  if (/^1C6/i.test(vin)) {
    return '1500';
  }
  if (/^3C6/i.test(vin) || /^3C63/i.test(vin)) {
    if (vin[5] === '5') {
      return '2500';
    }
    return '3500';
  }
  return null;
}

function hasUsableStickerText(stickerText) {
  const text = String(stickerText || '').trim();
  if (!text) {
    return false;
  }
  return !STICKER_UNAVAILABLE_PATTERN.test(text);
}

function detectTrim(stickerText, decoded) {
  const raw = decoded.Trim || '';
  if (raw) {
    return raw;
  }
  const match = stickerText.match(/RAM\s+(1500|2500|3500)\s+([A-Z0-9\/\-\s]+?)\s+(CREW|MEGA|QUAD|REGULAR)/i);
  return match ? match[2].trim() : null;
}

function detectAxleRatio(stickerText) {
  const matches = [...stickerText.matchAll(/(\d\.\d{2})\s+(Rear )?Axle Ratio/gi)];
  if (!matches.length) {
    return null;
  }
  return matches[matches.length - 1][1];
}

function detectGVWR(stickerText) {
  const source = String(stickerText || '');
  const parseWeight = (value) => Number(String(value).replace(/[\s,]/g, ''));
  const weight = '((?:\\d{1,2}(?:[\\s,]\\d{3})*|\\d{3,5}))';
  const matches = [
    ...source.matchAll(new RegExp(`GVW Rating\\s+[^\\d]*${weight}`, 'gi')),
    ...source.matchAll(new RegExp(`GVWR\\s*:\\s*(?:${weight}\\s*kg\\s*)?\\(\\s*${weight}\\s*lb\\s*\\)`, 'gi')),
    ...source.matchAll(new RegExp(`GVWR\\s*:\\s*${weight}\\s*lb`, 'gi')),
  ]
    .map((match) => parseWeight(match[match.length - 1]))
    .filter(Number.isFinite);

  if (!matches.length) {
    return null;
  }

  return Math.max(...matches);
}

function detectVehicleMarket(stickerText) {
  const source = String(stickerText || '');
  return /\bFCA Canada\b|\bramtruck\.ca\b|specific Canadian requirements|sale or registration outside of Canada|\bkilomet(?:re|er)s?\b/i.test(source)
    ? 'CA'
    : null;
}

function detectCab(stickerText, decoded) {
  const titleCab = String(stickerText || '').match(/RAM\s+(?:1500|2500|3500)[\s\S]{0,140}?\b(CREW|MEGA|QUAD|REG(?:ULAR)?)(?:\s+CAB)?\b/i)?.[1];
  return (
    normalizeCab(titleCab) ||
    normalizeCab(stickerText) ||
    normalizeCab(decoded.CabType) ||
    normalizeCab(decoded.BodyCabType) ||
    normalizeCab(decoded.Series2) ||
    normalizeCab(decoded.Series) ||
    normalizeCab(decoded.BodyClass)
  );
}

function detectBed(vin, stickerText, decoded, model, cab, year) {
  const stickerBed = normalizeBed(stickerText);
  if (stickerBed) {
    return stickerBed;
  }

  const decodedBedType = String(decoded.BedType || '').trim();
  const decodedBed = /^(short|long)$/i.test(decodedBedType) ? null : normalizeBed(decodedBedType);
  if (decodedBed === `8'`) {
    return decodedBed;
  }
  if (decodedBed === `5'7"` || decodedBed === `6'4"`) {
    return decodedBed;
  }
  // Older HD VIN decodes say only "Short" or "Long" for Crew Cabs. That is
  // insufficient for the older source charts, so leave Crew values selectable.
  if ((year === 2019 || year === 2020 || year === 2021 || year === 2022 || year === 2023) && model !== '1500' && /^(short|long)$/i.test(decodedBedType)) {
    return cab === 'Mega' ? `6'4"` : cab === 'Regular' ? `8'` : null;
  }
  if (/^short$/i.test(decodedBedType)) {
    if (model === '1500 Classic') {
      return cab === 'Regular' ? `6'4"` : `5'7"`;
    }
    if (model === '1500') {
      return `5'7"`;
    }
    return `6'4"`;
  }
  if (/^long$/i.test(decodedBedType)) {
    if (model === '1500 Classic') {
      return cab === 'Regular' ? `8'` : `6'4"`;
    }
    if (model === '1500') {
      return `6'4"`;
    }
    return `8'`;
  }
  if (cab === 'Mega') {
    return `6'4"`;
  }
  if (cab === 'Regular' && model !== '1500') {
    return `8'`;
  }
  return null;
}

function detectRearWheels(vin, stickerText, model) {
  const stickerRear = normalizeRearWheels(stickerText);
  if (stickerRear) {
    return stickerRear;
  }
  if (model !== '3500') {
    return model === '2500' ? 'SRW' : null;
  }
  if (/^3C63RR/i.test(vin)) {
    return 'DRW';
  }
  if (/^3C63R3/i.test(vin)) {
    return 'SRW';
  }
  return null;
}

function detectDecodedGvwr(value) {
  const matches = [...String(value || '').matchAll(/(\d{1,2},\d{3})/g)]
    .map((match) => Number(match[1].replace(/,/g, '')))
    .filter(Number.isFinite);

  if (matches.length !== 1) {
    return null;
  }

  return matches[0];
}

function detectDecodedGvwrBounds(value) {
  const matches = [...String(value || '').matchAll(/(\d{1,2},\d{3})/g)]
    .map((match) => Number(match[1].replace(/,/g, '')))
    .filter(Number.isFinite);

  if (matches.length < 2) {
    return null;
  }

  return {
    min: Math.min(...matches),
    max: Math.max(...matches),
  };
}

function deriveEngineFromDecoded(decoded = {}) {
  const trimText = `${decoded.Trim || ''} ${decoded.Trim2 || ''} ${decoded.Series || ''} ${decoded.Series2 || ''}`.trim();
  const engineText = `${decoded.EngineModel || ''} ${decoded.EngineConfiguration || ''}`.trim();
  const displacementSource = decoded.DisplacementL || decoded.DisplacementCC || null;
  const displacement = Number(displacementSource);
  const cylinders = Number(decoded.EngineCylinders || null);
  const fuelText = String(decoded.FuelTypePrimary || '').toLowerCase();

  const normalizedDirect = normalizeEngine(engineText);
  if (normalizedDirect) {
    return normalizedDirect;
  }

  if (Number.isFinite(displacement)) {
    if (Math.abs(displacement - 5.7) < 0.12 && cylinders === 8) {
      return '5.7L HEMI V8 eTorque';
    }
    if (Math.abs(displacement - 6.2) < 0.12 && cylinders === 8) {
      return '6.2L Supercharged HEMI V8';
    }
    if (Math.abs(displacement - 3.6) < 0.12 && cylinders === 6) {
      return '3.6L Pentastar V6 eTorque';
    }
    if (Math.abs(displacement - 3.0) < 0.12 && cylinders === 6) {
      if (fuelText.includes('diesel')) {
        return '3.0L EcoDiesel V6';
      }
      if (/rho|limited|high output|h\/?o/i.test(`${engineText} ${trimText}`)) {
        return '3.0L Hurricane HO';
      }
      return '3.0L Hurricane SO';
    }
    if (Math.abs(displacement - 6.4) < 0.12 && cylinders === 8) {
      return '6.4L HEMI V8';
    }
    if (Math.abs(displacement - 6.7) < 0.12 && fuelText.includes('diesel')) {
      return '6.7L Cummins HO';
    }
  }

  return normalizeEngine(trimText);
}

function detectEngine(stickerText, decoded) {
  const engineLine = String(stickerText || '').match(/Engine:\s*(.+)/i)?.[1] || '';
  return normalizeEngine(engineLine) || normalizeEngine(stickerText) || deriveEngineFromDecoded(decoded);
}

function detectDieselVariant(stickerText, decoded) {
  const source = `${stickerText || ''} ${decoded?.EngineHP_to || ''} ${decoded?.TransmissionStyle || ''}`;
  return /high[\s-]*output|aisin/i.test(source) ? 'HO' : 'Standard';
}

function detectHemiVariant(stickerText) {
  return /etorque|bsg/i.test(String(stickerText || '')) ? 'eTorque' : 'Standard';
}

function detectTransmission(stickerText, decoded = {}) {
  const source = `${stickerText || ''} ${decoded.TransmissionStyle || ''} ${decoded.TransmissionSpeeds || ''}`.replace(/[–—]/g, '-');
  if (/8[\s-]*(?:speed|spd)|8hp\d+/i.test(source)) {
    return '8-Speed';
  }
  if (/6[\s-]*(?:speed|spd)|65rfe|68rfe|aisin/i.test(source)) {
    return '6-Speed';
  }
  return null;
}

function detectRamBox(stickerText) {
  return /ram\s*box/i.test(String(stickerText || '')) ? true : null;
}

function infer2024ChartGvwr({ year, model, rearWheels }) {
  return year === 2024 && model === '3500' && rearWheels === 'DRW' ? 14000 : null;
}

// The 2025 HD chart has a single SRW Crew Cab long-box Cummins row per drive.
// Chrysler stickers often omit GVWR for that configuration, but DRW is stated.
function infer2025ChartGvwr({ year, model, engine, rearWheels, cab, bed, drive }) {
  if (year !== 2025 || model !== '3500' || engine !== '6.7L Cummins HO' || cab !== 'Crew' || bed !== `8'`) {
    return null;
  }

  if (rearWheels === 'DRW') {
    return 14000;
  }

  if (rearWheels === 'SRW' && drive === '4x4') {
    return 12300;
  }

  if (rearWheels === 'SRW' && drive === '4x2') {
    return 12000;
  }

  return null;
}

function extractDetectedSpec(vin, stickerText, decoded, options = {}) {
  const year = resolveLookupYear(vin, stickerText, decoded, options.chartYear);
  const model = detectModel(vin, stickerText, decoded);
  const cab = detectCab(stickerText, decoded);
  const trim = detectTrim(stickerText, decoded);
  const stickerAvailable = hasUsableStickerText(stickerText);
  const decodedGvwrBounds = detectDecodedGvwrBounds(decoded.GVWR) || detectDecodedGvwrBounds(decoded.GVWR_to);
  const drive = normalizeDrive(stickerText) || normalizeDrive(decoded.DriveType);
  const bed = detectBed(vin, stickerText, decoded, model, cab, year);
  const rearWheels = detectRearWheels(vin, stickerText, model);
  const detectedEngine = detectEngine(stickerText, decoded);
  const engine = model === '1500 Classic'
    ? detectedEngine === '3.6L Pentastar V6 eTorque'
      ? '3.6L Pentastar V6'
      : detectedEngine === '5.7L HEMI V8 eTorque'
        ? '5.7L HEMI V8'
        : detectedEngine
    : detectedEngine;
  const stickerGvwr = detectGVWR(stickerText) || detectDecodedGvwr(decoded.GVWR) || detectDecodedGvwr(decoded.GVWR_to);
  const inferredGvwr = stickerGvwr
    ? null
    : infer2024ChartGvwr({ year, model, rearWheels }) || infer2025ChartGvwr({ year, model, engine, rearWheels, cab, bed, drive });
  const spec = cleanSpec({
    vin,
    year,
    model,
    drive,
    cab,
    bed,
    rearWheels,
    ramBox: detectRamBox(stickerText),
    engine,
    engineVariant: (year === 2019 || year === 2020 || year === 2021 || year === 2022 || year === 2023 || year === 2024) && engine === '6.7L Cummins HO'
      ? detectDieselVariant(stickerText, decoded)
      : (year === 2019 || year === 2020 || year === 2021 || year === 2022 || year === 2023) && engine === '5.7L HEMI V8 eTorque'
        ? detectHemiVariant(stickerText)
        : null,
    transmission: model === '1500 Classic' ? detectTransmission(stickerText, decoded) : null,
    trim,
    axleRatio: detectAxleRatio(stickerText),
    gvwr: stickerGvwr,
    inferredGvwr,
  });

  return {
    ...spec,
    year,
    model,
    trim,
    gvwrClassMin: decodedGvwrBounds?.min || null,
    gvwrClassMax: decodedGvwrBounds?.max || null,
    inferredGvwr: inferredGvwr || null,
    gvwrSource: inferredGvwr ? `${year} RAM chart configuration rule` : stickerGvwr ? 'window sticker' : null,
    market: detectVehicleMarket(stickerText),
    stickerAvailable,
    stickerTitle: stickerText.match(/(?:A\s+)?20\d{2}\s+MODEL YEAR\s+([\s\S]+?)\s+THIS VEHICLE/i)?.[1]?.replace(/\s+/g, ' ').trim() || null,
  };
}

async function lookupVin(vinInput) {
  const vin = assertVin(vinInput);
  const vinYear = detectModelYearFromVin(vin);
  const decoded = await decodeVin(vin, vinYear);
  let sticker = null;

  try {
    sticker = await fetchStickerText(vin);
  } catch (_error) {
    // Keep a valid VIN decode usable when the Chrysler sticker service fails.
  }

  const pdfUrl = sticker?.pdfUrl || null;
  const text = sticker?.text || '';
  const detectedSpec = extractDetectedSpec(vin, text, decoded, { chartYear: vinYear });

  if (detectedSpec.model === 'Chassis Cab') {
    throw new Error('VIN Lookup supports RAM pickup trucks only. Chassis cab models are not supported.');
  }

  return {
    vin,
    pdfUrl,
    stickerText: text,
    decoded,
    detectedSpec,
  };
}

module.exports = {
  WINDOW_STICKER_BASE_URL,
  assertVin,
  detectGVWR,
  detectVehicleMarket,
  detectModelYearFromSticker,
  detectModelYearFromVin,
  extractDetectedSpec,
  infer2024ChartGvwr,
  infer2025ChartGvwr,
  hasUsableStickerText,
  lookupVin,
  resolveLookupYear,
  detectDecodedGvwrBounds,
};
