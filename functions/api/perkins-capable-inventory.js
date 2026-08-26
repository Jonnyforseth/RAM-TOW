import perkinsService from '../../src/lib/perkins-service.js';
import { json, errorResponse } from '../_shared/http.js';
import { getPerkinsInventorySnapshot, schedulePerkinsInventoryRefresh } from '../_shared/perkins-inventory-snapshot.js';

const { filterVerifiedInventorySnapshot, findLowestPricedVerifiedInventory } = perkinsService;

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const trailerWeight = Number(body?.trailerWeight);
    const tongueWeight = Number(body?.tongueWeight);
    const hitchType = String(body?.hitchType || 'conventional').trim();
    const modelPreference = String(body?.modelPreference || '').trim();

    if (!Number.isFinite(trailerWeight) || trailerWeight <= 0) {
      throw new Error('Enter a valid loaded trailer weight.');
    }
    if (!Number.isFinite(tongueWeight) || tongueWeight <= 0) {
      throw new Error('Enter a valid tongue or pin weight.');
    }
    if (!['', '1500', '2500', '3500'].includes(modelPreference)) {
      throw new Error('Choose a valid RAM model filter.');
    }
    if (!['conventional', 'gooseneck'].includes(hitchType)) {
      throw new Error('Choose a valid hitch type.');
    }

    const requirements = {
      trailerWeight,
      tongueWeight,
      hitchType,
      modelPreference,
    };
    const snapshotState = await getPerkinsInventorySnapshot(context.env);
    const refresh = snapshotState.configured
      ? await schedulePerkinsInventoryRefresh(context.env)
      : { scheduled: false };

    if (snapshotState.configured && !snapshotState.snapshot) {
      return json({
        ok: true,
        preparing: true,
        requested: { trailerWeight, tongueWeight, hitchType, modelPreference: modelPreference || null },
        checkedAt: null,
        checkedCount: 0,
        verifiedCount: 0,
        results: [],
        refreshScheduled: refresh.scheduled,
        notes: ['The first daily Perkins inventory verification is being prepared. Check back in a few minutes.'],
      }, { status: 202 });
    }

    const inventory = snapshotState.snapshot
      ? filterVerifiedInventorySnapshot(snapshotState.snapshot, requirements)
      : await findLowestPricedVerifiedInventory(requirements);

    return json({
      ok: true,
      requested: { trailerWeight, tongueWeight, hitchType, modelPreference: modelPreference || null },
      ...inventory,
      refreshScheduled: refresh.scheduled,
      notes: [
        snapshotState.snapshot
          ? 'Each displayed truck was checked by its listed VIN against the RAM Tow chart matcher during the daily inventory verification.'
          : 'Each displayed truck was checked by its listed VIN against the RAM Tow chart matcher before it was included.',
        'Listed price and availability can change. Verify the final VIN, payload door sticker, hitch equipment, and dealer information before purchase or towing.',
      ],
    });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
