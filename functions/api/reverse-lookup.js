import chartService from '../../src/lib/chart-service.js';
import perkinsService from '../../src/lib/perkins-service.js';
import { json, errorResponse } from '../_shared/http.js';

const { buildReverseInsights, buildReverseRecommendations } = chartService;
const { attachInventorySearchLinks } = perkinsService;

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const trailerWeight = Number(body?.trailerWeight);
    const tongueWeight = Number(body?.tongueWeight);
    const modelPreference = String(body?.modelPreference || '').trim();
    const hitchType = String(body?.hitchType || 'conventional').trim();

    if (!Number.isFinite(trailerWeight) || trailerWeight <= 0) {
      throw new Error('Enter a valid trailer weight.');
    }

    if (!Number.isFinite(tongueWeight) || tongueWeight <= 0) {
      throw new Error('Enter a valid tongue weight.');
    }

    const recommendations = buildReverseRecommendations({ trailerWeight, tongueWeight, modelPreference, hitchType });
    const insights = buildReverseInsights(
      { trailerWeight, tongueWeight, modelPreference, hitchType },
      recommendations
    );
    let inventoryNotes = [];
    let results = recommendations;

    try {
      const inventoryResponse = await attachInventorySearchLinks(recommendations, {
        campaign: 'trailer_fit',
        context: 'trailer_fit',
        trailerWeight,
        tongueWeight,
      });
      results = inventoryResponse.results;
      inventoryNotes = [
        `Perkins inventory filters checked live on ${new Date(inventoryResponse.checkedAt).toLocaleDateString('en-US')} from perkinsmotors.com.`,
      ];
    } catch (inventoryError) {
      inventoryNotes = [
        `Perkins inventory links are temporarily unavailable: ${inventoryError.message}`,
      ];
    }

    return json({
      ok: true,
      requested: {
        trailerWeight,
        tongueWeight,
        modelPreference: modelPreference || null,
        hitchType,
      },
      insights,
      results,
      notes: [
        'Setup recommendations check both RAM chart tow capacity and RAM chart payload capacity.',
        'Open a Perkins inventory link, then run any candidate VIN back through the lookup on the left to confirm the exact axle and final rating.',
        ...inventoryNotes,
      ],
    });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
