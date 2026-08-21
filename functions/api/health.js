import chartService from '../../src/lib/chart-service.js';
import chartData from '../../src/data/chart-data.js';
import { json, errorResponse } from '../_shared/http.js';

const { ensureChartTexts, towRows, payloadRows } = chartService;
const { SUPPORTED_CHART_YEARS } = chartData;

export async function onRequestGet() {
  try {
    await Promise.all(SUPPORTED_CHART_YEARS.map((year) => ensureChartTexts(year)));
    return json({
      ok: true,
      towRows: towRows.length,
      payloadRows: payloadRows.length,
      supportedVinChartYears: SUPPORTED_CHART_YEARS,
      date: '2026-08-21',
      runtime: 'cloudflare-pages-functions',
    });
  } catch (error) {
    return errorResponse(error, 500);
  }
}
