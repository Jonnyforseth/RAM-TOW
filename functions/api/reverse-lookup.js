import chartService from '../../src/lib/chart-service.js';
import perkinsService from '../../src/lib/perkins-service.js';
import { json, errorResponse } from '../_shared/http.js';

const { collectReverseLookupRows } = chartService;
const { attachInventoryMatches } = perkinsService;

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const trailerWeight = Number(body?.trailerWeight);
    const tongueWeight = Number(body?.tongueWeight);
    const modelPreference = String(body?.modelPreference || '').trim();

    if (!Number.isFinite(trailerWeight) || trailerWeight <= 0) {
      throw new Error('Enter a valid trailer weight.');
    }

    if (!Number.isFinite(tongueWeight) || tongueWeight <= 0) {
      throw new Error('Enter a valid tongue weight.');
    }

    const baseResults = collectReverseLookupRows({ trailerWeight, tongueWeight, modelPreference });
    let inventoryNotes = [];
    let results = baseResults;

    try {
      const inventoryResponse = await attachInventoryMatches(baseResults, {
        trailerWeight,
        tongueWeight,
      });
      results = inventoryResponse.results;
      inventoryNotes = [
        `Perkins inventory pairing checked live on ${new Date(inventoryResponse.checkedAt).toLocaleDateString('en-US')} from perkinsmotors.com.`,
      ];
    } catch (inventoryError) {
      inventoryNotes = [
        `Perkins inventory pairing is temporarily unavailable: ${inventoryError.message}`,
      ];
    }

    return json({
      ok: true,
      requested: {
        trailerWeight,
        tongueWeight,
        modelPreference: modelPreference || null,
      },
      results,
      notes: [
        'Reverse lookup checks both chart tow capacity and chart payload capacity.',
        'The calculator assumes conventional trailer tongue weight and uses RAM chart footnote hitch limits.',
        ...inventoryNotes,
      ],
    });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
