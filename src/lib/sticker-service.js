const {
  cleanSpec,
  normalizeBed,
  normalizeCab,
  normalizeDrive,
  normalizeEngine,
  normalizeRearWheels,
} = require('./chart-service');
const { createPdfParser } = require('./pdf-runtime');

const WINDOW_STICKER_BASE_URL = 'https://www.chrysler.com/hostd/windowsticker/getWindowStickerPdf.do?vin=';
const NHTSA_BASE_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/';

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

async function decodeVin(vin) {
  const response = await fetch(`${NHTSA_BASE_URL}${vin}?format=json&modelyear=2026`);
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
  return normalizeCab(stickerText) || normalizeCab(decoded.CabType) || normalizeCab(decoded.BodyClass);
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

function detectEngine(stickerText) {
  const engineLine = stickerText.match(/Engine:\s*(.+)/i)?.[1] || stickerText;
  return normalizeEngine(engineLine);
}

function extractDetectedSpec(vin, stickerText, decoded) {
  const model = detectModel(vin, stickerText);
  const cab = detectCab(stickerText, decoded);
  const trim = detectTrim(stickerText, decoded);
  const spec = cleanSpec({
    vin,
    model,
    drive: normalizeDrive(stickerText) || normalizeDrive(decoded.DriveType),
    cab,
    bed: detectBed(vin, stickerText, decoded, model, cab),
    rearWheels: detectRearWheels(vin, stickerText, model),
    engine: detectEngine(stickerText),
    trim,
    axleRatio: detectAxleRatio(stickerText),
    gvwr: detectGVWR(stickerText),
  });

  return {
    ...spec,
    model,
    trim,
    stickerTitle: stickerText.match(/A 2026 MODEL YEAR\s+(.+?)\s+THIS VEHICLE/i)?.[1]?.replace(/\s+/g, ' ').trim() || null,
  };
}

async function lookupVin(vinInput) {
  const vin = assertVin(vinInput);
  const [{ pdfUrl, text }, decoded] = await Promise.all([fetchStickerText(vin), decodeVin(vin)]);
  const detectedSpec = extractDetectedSpec(vin, text, decoded);

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
  extractDetectedSpec,
  lookupVin,
};
