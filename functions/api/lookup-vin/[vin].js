import stickerService from '../../../src/lib/sticker-service.js';
import chartService from '../../../src/lib/chart-service.js';
import { json, errorResponse } from '../../_shared/http.js';

const { lookupVin } = stickerService;
const { findMatches, findRawChartHints, getOverrideOptions } = chartService;

export async function onRequestGet(context) {
  try {
    const vinResult = await lookupVin(context.params.vin);
    const matches = findMatches(vinResult.detectedSpec);

    let rawHints = [];
    try {
      rawHints = await findRawChartHints(vinResult.detectedSpec);
    } catch (_error) {
      rawHints = [];
    }

    return json({
      ok: true,
      vin: vinResult.vin,
      pdfUrl: vinResult.pdfUrl,
      stickerTitle: vinResult.detectedSpec.stickerTitle,
      detectedSpec: vinResult.detectedSpec,
      towMatch: matches.towMatches[0] || null,
      payloadMatch: matches.payloadMatches[0] || null,
      matches,
      overrideOptions: getOverrideOptions(vinResult.detectedSpec, matches),
      rawHints,
      notes: [
        'Results are based on the 2026 RAM towing and payload PDFs loaded into this local site.',
        'If bed length, GVWR, or rear wheel setup is missing from the sticker, use the override fields to lock in the exact configuration.',
      ],
    });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
