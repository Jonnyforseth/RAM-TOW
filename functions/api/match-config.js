import chartService from '../../src/lib/chart-service.js';
import inventoryLinkService from '../../src/lib/inventory-link-service.js';
import { json, errorResponse } from '../_shared/http.js';

const { buildVinCapacitySummary, cleanSpec, findMatches, findRawChartHints, getOverrideOptions } = chartService;
const { getVinInventoryLink } = inventoryLinkService;

export async function onRequestPost(context) {
  try {
    const spec = cleanSpec(await context.request.json());
    const chartYear = spec.year || 2026;
    const matches = findMatches(spec, { year: chartYear });
    let perkinsInventoryLink = null;

    try {
      perkinsInventoryLink = await getVinInventoryLink(spec, matches);
    } catch (_error) {
      // Keep chart refinements available if Perkins inventory is unreachable.
    }

    let rawHints = [];
    try {
      rawHints = await findRawChartHints(spec, { year: chartYear });
    } catch (_error) {
      rawHints = [];
    }

    return json({
      ok: true,
      spec,
      chartYear,
      towMatch: matches.towMatches[0] || null,
      payloadMatch: matches.payloadMatches[0] || null,
      towSummary: buildVinCapacitySummary(spec, matches, 'tow'),
      payloadSummary: buildVinCapacitySummary(spec, matches, 'payload'),
      matches,
      overrideOptions: getOverrideOptions(spec, matches),
      rawHints,
      perkinsInventoryLink,
    });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
