const express = require('express');
const path = require('path');
const { SUPPORTED_CHART_YEARS } = require('./data/chart-data');
const {
  buildReverseInsights,
  buildReverseRecommendations,
  buildVinCapacitySummary,
  cleanSpec,
  ensureChartTexts,
  findMatches,
  findRawChartHints,
  getOverrideOptions,
  towRows,
  payloadRows,
} = require('./lib/chart-service');
const {
  attachInventorySearchLinks,
  buildVerifiedInventorySnapshot,
  findLowerPricedNewComparable,
  findLowestPricedVerifiedInventory,
  findVerifiedInventoryByVin,
} = require('./lib/perkins-service');
const { getVinInventoryLink, buildInventorySetup } = require('./lib/inventory-link-service');
const { lookupVin } = require('./lib/sticker-service');

const app = express();
const PORT = 4324;
const LOCAL_SNAPSHOT_MAX_AGE_MS = 26 * 60 * 60 * 1000;
let localInventorySnapshot = null;
let localInventorySnapshotPromise = null;

async function getLocalInventorySnapshot() {
  const generatedAt = Date.parse(localInventorySnapshot?.generatedAt || '');
  if (localInventorySnapshot && Number.isFinite(generatedAt) && Date.now() - generatedAt < LOCAL_SNAPSHOT_MAX_AGE_MS) {
    return localInventorySnapshot;
  }
  if (!localInventorySnapshotPromise) {
    localInventorySnapshotPromise = buildVerifiedInventorySnapshot()
      .then((snapshot) => {
        localInventorySnapshot = snapshot;
        return snapshot;
      })
      .finally(() => {
        localInventorySnapshotPromise = null;
      });
  }
  return localInventorySnapshotPromise;
}

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..', 'public'), {
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html') || filePath.endsWith('styles.css')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    }
  },
}));

app.post('/api/lead', async (req, res) => {
  try {
    const { onRequestPost } = await import('../functions/api/lead.js');
    const request = new Request(`http://localhost:${PORT}/api/lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body || {}),
    });
    const response = await onRequestPost({ request, env: process.env });
    res.status(response.status).type('application/json').send(await response.text());
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message || 'Unable to submit this request.' });
  }
});

app.get('/api/health', async (_req, res) => {
  await Promise.all(SUPPORTED_CHART_YEARS.map((year) => ensureChartTexts(year)));
  res.json({
    ok: true,
    port: PORT,
    towRows: towRows.length,
    payloadRows: payloadRows.length,
    supportedVinChartYears: SUPPORTED_CHART_YEARS,
    date: '2026-08-21',
  });
});

app.get('/api/lookup-vin/:vin', async (req, res) => {
  try {
    const vinResult = await lookupVin(req.params.vin);

    const chartYear = vinResult.detectedSpec.year;
    const matches = findMatches(vinResult.detectedSpec, { year: chartYear });
    const rawHints = await findRawChartHints(vinResult.detectedSpec, { year: chartYear });
    let perkinsInventoryLink = null;
    let perkinsExactInventory = null;

    if (Number(chartYear) < 2026) {
      try {
        perkinsInventoryLink = await getVinInventoryLink(vinResult.detectedSpec, matches);
      } catch (_error) {
        // A temporary inventory request must not block the VIN capacity result.
      }
    }

    if (localInventorySnapshot) {
      perkinsExactInventory = findVerifiedInventoryByVin(localInventorySnapshot, vinResult.vin)?.inventoryMatch || null;
    }

    res.json({
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
    res.status(400).json({
      ok: false,
      error: error.message,
    });
  }
});

app.post('/api/compare-new-vin', async (req, res) => {
  try {
    const vin = String(req.body?.vin || '').trim().toUpperCase();
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
      throw new Error('Enter a valid 17-character VIN first.');
    }

    const snapshot = await getLocalInventorySnapshot();
    const exactRow = findVerifiedInventoryByVin(snapshot, vin);
    if (exactRow?.inventoryMatch) {
      res.json({ ok: true, state: 'perkins_exact', exactInventory: exactRow.inventoryMatch });
      return;
    }

    const vinResult = await lookupVin(vin);
    const modelYear = Number(vinResult.detectedSpec?.year);
    if (!Number.isFinite(modelYear) || modelYear < 2025) {
      res.json({ ok: true, state: 'not_current_new' });
      return;
    }

    const { findPublicNewVehicleListing } = await import('../functions/_shared/new-vehicle-listing.js');
    const listingSearch = await findPublicNewVehicleListing(vin, process.env);
    if (listingSearch.state !== 'found' || !listingSearch.listing) {
      res.json({ ok: true, state: listingSearch.state });
      return;
    }

    const matches = findMatches(vinResult.detectedSpec, { year: modelYear });
    const target = buildInventorySetup(vinResult.detectedSpec, matches);
    const comparable = findLowerPricedNewComparable(snapshot, target, listingSearch.listing.price);
    if (!comparable?.inventoryMatch) {
      res.json({
        ok: true,
        state: 'no_lower_match',
        competitor: { seller: listingSearch.listing.seller, price: listingSearch.listing.price },
      });
      return;
    }

    res.json({
      ok: true,
      state: 'lower_priced_match',
      competitor: { seller: listingSearch.listing.seller, price: listingSearch.listing.price },
      comparable: comparable.inventoryMatch,
      matchPercent: comparable.comparison.matchPercent,
      savings: comparable.comparison.savings,
      checkedAt: snapshot.generatedAt || null,
    });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message || 'New-vehicle pricing could not be checked.' });
  }
});

app.post('/api/match-config', async (req, res) => {
  try {
    const spec = cleanSpec(req.body || {});
    const chartYear = spec.year || 2026;
    const matches = findMatches(spec, { year: chartYear });
    const rawHints = await findRawChartHints(spec, { year: chartYear });
    let perkinsInventoryLink = null;

    try {
      perkinsInventoryLink = await getVinInventoryLink(spec, matches);
    } catch (_error) {
      // Keep chart refinements available if Perkins inventory is unreachable.
    }

    res.json({
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
    res.status(400).json({
      ok: false,
      error: error.message,
    });
  }
});

app.post('/api/reverse-lookup', async (req, res) => {
  try {
    const trailerWeight = Number(req.body?.trailerWeight);
    const tongueWeight = Number(req.body?.tongueWeight);
    const modelPreference = String(req.body?.modelPreference || '').trim();
    const hitchType = String(req.body?.hitchType || 'conventional').trim();

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

    res.json({
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
    res.status(400).json({
      ok: false,
      error: error.message,
    });
  }
});

app.post('/api/perkins-capable-inventory', async (req, res) => {
  try {
    const trailerWeight = Number(req.body?.trailerWeight);
    const tongueWeight = Number(req.body?.tongueWeight);
    const hitchType = String(req.body?.hitchType || 'conventional').trim();
    const modelPreference = String(req.body?.modelPreference || '').trim();

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

    const inventory = await findLowestPricedVerifiedInventory({
      trailerWeight,
      tongueWeight,
      hitchType,
      modelPreference,
    });

    res.json({
      ok: true,
      requested: { trailerWeight, tongueWeight, hitchType, modelPreference: modelPreference || null },
      ...inventory,
      notes: [
        'Each displayed truck was checked by its listed VIN against the RAM Tow chart matcher before it was included.',
        'Listed price and availability can change. Verify the final VIN, payload door sticker, hitch equipment, and dealer information before purchase or towing.',
      ],
    });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

app.use((_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

Promise.all(SUPPORTED_CHART_YEARS.map((year) => ensureChartTexts(year)))
  .then(() => {
    app.listen(PORT, () => {
      console.log(`RAM Tow site running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to preload chart PDFs:', error);
    process.exit(1);
  });
