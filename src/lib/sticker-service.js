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
  if (!contentType.includes('pdf')) {
    throw new Error('The Chrysler endpoint did not return a PDF for that VIN.');
  }

  const buffer = Buffer.from(await response.arrayBuffer());
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

function detectModel(vin, stickerText) {
  if (/RAM 1500/i.test(stickerText)) {
    return '1500';
  }
  if (/RAM 2500/i.test(stickerText)) {
    return '2500';
  }
  if (/RAM 3500/i.test(stickerText)) {
    return '3500';
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
  const matches = [...String(stickerText || '').matchAll(/GVW Rating\s+[^\d]*(\d{1,2},\d{3})/gi)]
    .map((match) => Number(match[1].replace(/,/g, '')))
    .filter(Number.isFinite);

  if (!matches.length) {
    return null;
  }

  return Math.max(...matches);
}

function detectCab(stickerText, decoded) {
  return (
    normalizeCab(stickerText) ||
    normalizeCab(decoded.CabType) ||
    normalizeCab(decoded.BodyCabType) ||
    normalizeCab(decoded.Series2) ||
    normalizeCab(decoded.Series) ||
    normalizeCab(decoded.BodyClass)
  );
}

function detectBed(vin, stickerText, decoded, model, cab) {
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
  if (/^short$/i.test(decodedBedType)) {
    if (model === '1500') {
      return `5'7"`;
    }
    return `6'4"`;
  }
  if (/^long$/i.test(decodedBedType)) {
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
    if (Math.abs(displacement - 3.6) < 0.12 && cylinders === 6) {
      return '3.6L Pentastar V6 eTorque';
    }
    if (Math.abs(displacement - 3.0) < 0.12 && cylinders === 6) {
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

function extractDetectedSpec(vin, stickerText, decoded, options = {}) {
  const year = resolveLookupYear(vin, stickerText, decoded, options.chartYear);
  const model = detectModel(vin, stickerText);
  const cab = detectCab(stickerText, decoded);
  const trim = detectTrim(stickerText, decoded);
  const stickerAvailable = hasUsableStickerText(stickerText);
  const spec = cleanSpec({
    vin,
    year,
    model,
    drive: normalizeDrive(stickerText) || normalizeDrive(decoded.DriveType),
    cab,
    bed: detectBed(vin, stickerText, decoded, model, cab),
    rearWheels: detectRearWheels(vin, stickerText, model),
    engine: detectEngine(stickerText, decoded),
    trim,
    axleRatio: detectAxleRatio(stickerText),
    gvwr: detectGVWR(stickerText) || detectDecodedGvwr(decoded.GVWR) || detectDecodedGvwr(decoded.GVWR_to),
  });

  return {
    ...spec,
    year,
    model,
    trim,
    stickerAvailable,
    stickerTitle: stickerText.match(/(?:A\s+)?20\d{2}\s+MODEL YEAR\s+([\s\S]+?)\s+THIS VEHICLE/i)?.[1]?.replace(/\s+/g, ' ').trim() || null,
  };
}

async function lookupVin(vinInput) {
  const vin = assertVin(vinInput);
  const vinYear = detectModelYearFromVin(vin);
  const [{ pdfUrl, text }, decoded] = await Promise.all([fetchStickerText(vin), decodeVin(vin, vinYear)]);
  const detectedSpec = extractDetectedSpec(vin, text, decoded, { chartYear: vinYear });

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
  detectModelYearFromSticker,
  detectModelYearFromVin,
  extractDetectedSpec,
  hasUsableStickerText,
  lookupVin,
  resolveLookupYear,
};
