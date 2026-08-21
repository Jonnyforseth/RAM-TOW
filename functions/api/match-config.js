import chartService from '../../src/lib/chart-service.js';
import { json, errorResponse } from '../_shared/http.js';

const { cleanSpec, findMatches, findRawChartHints, getOverrideOptions } = chartService;

export async function onRequestPost(context) {
  try {
    const spec = cleanSpec(await context.request.json());
    const chartYear = spec.year || 2026;
    const matches = findMatches(spec, { year: chartYear });

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
      matches,
      overrideOptions: getOverrideOptions(spec, matches),
      rawHints,
    });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
