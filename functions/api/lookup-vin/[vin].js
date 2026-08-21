import stickerService from '../../../src/lib/sticker-service.js';
import chartService from '../../../src/lib/chart-service.js';
import inventoryLinkService from '../../../src/lib/inventory-link-service.js';
import { json, errorResponse } from '../../_shared/http.js';

const { lookupVin } = stickerService;
const { buildVinCapacitySummary, findMatches, findRawChartHints, getOverrideOptions } = chartService;
const { getVinInventoryLink } = inventoryLinkService;

export async function onRequestGet(context) {
  try {
    const vinResult = await lookupVin(context.params.vin);

    if (vinResult.detectedSpec?.stickerAvailable === false) {
      return json({
        ok: false,
        errorCode: 'STICKER_OFFLINE',
        error: 'Window sticker is offline for this truck right now. Try again.',
      }, 503);
    }

    const chartYear = vinResult.detectedSpec.year;
    const matches = findMatches(vinResult.detectedSpec, { year: chartYear });
    let perkinsInventoryLink = null;

    try {
      perkinsInventoryLink = await getVinInventoryLink(vinResult.detectedSpec, matches);
    } catch (_error) {
      // A temporary inventory request must not block the VIN capacity result.
    }

    let rawHints = [];
    try {
      rawHints = await findRawChartHints(vinResult.detectedSpec, { year: chartYear });
    } catch (_error) {
      rawHints = [];
    }

    return json({
      ok: true,
      vin: vinResult.vin,
      pdfUrl: vinResult.pdfUrl,
      stickerTitle: vinResult.detectedSpec.stickerTitle,
      detectedSpec: vinResult.detectedSpec,
      chartYear,
      towMatch: matches.towMatches[0] || null,
      payloadMatch: matches.payloadMatches[0] || null,
      towSummary: buildVinCapacitySummary(vinResult.detectedSpec, matches, 'tow'),
      payloadSummary: buildVinCapacitySummary(vinResult.detectedSpec, matches, 'payload'),
      matches,
      overrideOptions: getOverrideOptions(vinResult.detectedSpec, matches),
      rawHints,
      perkinsInventoryLink,
      notes: [
        `Results are based on the ${chartYear} RAM towing and payload PDFs loaded into this local site.`,
        'If bed length, GVWR, or rear wheel setup is missing from the sticker, use the override fields to lock in the exact configuration.',
      ],
    });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
