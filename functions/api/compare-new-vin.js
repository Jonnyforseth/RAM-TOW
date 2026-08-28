import stickerService from '../../src/lib/sticker-service.js';
import chartService from '../../src/lib/chart-service.js';
import inventoryLinkService from '../../src/lib/inventory-link-service.js';
import perkinsService from '../../src/lib/perkins-service.js';
import { findPublicNewVehicleListing } from '../_shared/new-vehicle-listing.js';
import { getPerkinsInventorySnapshot, schedulePerkinsInventoryRefresh } from '../_shared/perkins-inventory-snapshot.js';
import { json, errorResponse } from '../_shared/http.js';

const { lookupVin } = stickerService;
const { findMatches } = chartService;
const { buildInventorySetup } = inventoryLinkService;
const { findLowerPricedNewComparable, findVerifiedInventoryByVin } = perkinsService;

function validateVin(value) {
  const vin = String(value || '').trim().toUpperCase();
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
    throw new Error('Enter a valid 17-character VIN first.');
  }
  return vin;
}

export async function onRequestPost(context) {
  try {
    const vin = validateVin((await context.request.json())?.vin);
    const snapshotState = await getPerkinsInventorySnapshot(context.env);
    if (snapshotState.configured) {
      void schedulePerkinsInventoryRefresh(context.env);
    }
    if (!snapshotState.snapshot) {
      return json({ ok: true, state: 'inventory_preparing' }, { status: 202 });
    }

    const exactRow = findVerifiedInventoryByVin(snapshotState.snapshot, vin);
    if (exactRow?.inventoryMatch) {
      return json({ ok: true, state: 'perkins_exact', exactInventory: exactRow.inventoryMatch });
    }

    const vinResult = await lookupVin(vin);
    const modelYear = Number(vinResult.detectedSpec?.year);
    // Older VINs can still be decoded, but an automatic new-vehicle price
    // comparison is intentionally limited to current-era new inventory.
    if (!Number.isFinite(modelYear) || modelYear < 2025) {
      return json({ ok: true, state: 'not_current_new' });
    }

    const listingSearch = await findPublicNewVehicleListing(vin, context.env);
    if (listingSearch.state !== 'found' || !listingSearch.listing) {
      return json({ ok: true, state: listingSearch.state });
    }

    const matches = findMatches(vinResult.detectedSpec, { year: modelYear });
    const target = buildInventorySetup(vinResult.detectedSpec, matches);
    const comparable = findLowerPricedNewComparable(snapshotState.snapshot, target, listingSearch.listing.price);

    if (!comparable?.inventoryMatch) {
      return json({
        ok: true,
        state: 'no_lower_match',
        competitor: {
          seller: listingSearch.listing.seller,
          price: listingSearch.listing.price,
        },
      });
    }

    return json({
      ok: true,
      state: 'lower_priced_match',
      competitor: {
        seller: listingSearch.listing.seller,
        price: listingSearch.listing.price,
      },
      comparable: comparable.inventoryMatch,
      matchPercent: comparable.comparison.matchPercent,
      savings: comparable.comparison.savings,
      checkedAt: snapshotState.snapshot.generatedAt || null,
    });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
