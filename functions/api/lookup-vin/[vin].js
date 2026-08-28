import stickerService from '../../../src/lib/sticker-service.js';
import chartService from '../../../src/lib/chart-service.js';
import inventoryLinkService from '../../../src/lib/inventory-link-service.js';
import perkinsService from '../../../src/lib/perkins-service.js';
import { json, errorResponse } from '../../_shared/http.js';
import { getPerkinsInventorySnapshot, schedulePerkinsInventoryRefresh } from '../../_shared/perkins-inventory-snapshot.js';

const { lookupVin } = stickerService;
const { buildVinCapacitySummary, findMatches, findRawChartHints, getOverrideOptions } = chartService;
const { getVinInventoryLink } = inventoryLinkService;
const { findVerifiedInventoryByVin } = perkinsService;

export async function onRequestGet(context) {
  try {
    const vinResult = await lookupVin(context.params.vin);

    const chartYear = vinResult.detectedSpec.year;
    const matches = findMatches(vinResult.detectedSpec, { year: chartYear });
    let perkinsInventoryLink = null;
    let perkinsExactInventory = null;

    try {
      const snapshotState = await getPerkinsInventorySnapshot(context.env);
      if (snapshotState.snapshot) {
        const exactRow = findVerifiedInventoryByVin(snapshotState.snapshot, vinResult.vin);
        perkinsExactInventory = exactRow?.inventoryMatch || null;
      }
      if (snapshotState.configured) {
        void schedulePerkinsInventoryRefresh(context.env);
      }
    } catch (_error) {
      // The daily inventory snapshot is an optional commerce enhancement.
    }

    if (Number(chartYear) < 2026) {
      try {
        perkinsInventoryLink = await getVinInventoryLink(vinResult.detectedSpec, matches);
      } catch (_error) {
        // A temporary inventory request must not block the VIN capacity result.
      }
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
      perkinsExactInventory,
      notes: [
        `Results are based on the ${chartYear} RAM towing and payload PDFs loaded into this local site.`,
        'If bed length, GVWR, or rear wheel setup is missing from the sticker, use the override fields to lock in the exact configuration.',
      ],
    });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
