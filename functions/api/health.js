import chartService from '../../src/lib/chart-service.js';
import { json, errorResponse } from '../_shared/http.js';

const { ensureChartTexts, towRows, payloadRows } = chartService;

export async function onRequestGet() {
  try {
    await ensureChartTexts();
    return json({
      ok: true,
      towRows: towRows.length,
      payloadRows: payloadRows.length,
      date: '2026-08-21',
      runtime: 'cloudflare-pages-functions',
    });
  } catch (error) {
    return errorResponse(error, 500);
  }
}
