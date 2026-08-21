const express = require('express');
const path = require('path');
const { SUPPORTED_CHART_YEARS } = require('./data/chart-data');
const {
  buildReverseInsights,
  buildReverseRecommendations,
  cleanSpec,
  ensureChartTexts,
  findMatches,
  findRawChartHints,
  getOverrideOptions,
  towRows,
  payloadRows,
} = require('./lib/chart-service');
const { attachInventorySearchLinks } = require('./lib/perkins-service');
const { lookupVin } = require('./lib/sticker-service');

const app = express();
const PORT = 4324;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

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

    if (vinResult.detectedSpec?.stickerAvailable === false) {
      res.status(503).json({
        ok: false,
        errorCode: 'STICKER_OFFLINE',
        error: 'Window sticker is offline for this truck right now. Try again.',
      });
      return;
    }

    const chartYear = vinResult.detectedSpec.year;
    const matches = findMatches(vinResult.detectedSpec, { year: chartYear });
    const rawHints = await findRawChartHints(vinResult.detectedSpec, { year: chartYear });

    res.json({
      ok: true,
      vin: vinResult.vin,
      pdfUrl: vinResult.pdfUrl,
      stickerTitle: vinResult.detectedSpec.stickerTitle,
      detectedSpec: vinResult.detectedSpec,
      chartYear,
      towMatch: matches.towMatches[0] || null,
      payloadMatch: matches.payloadMatches[0] || null,
      matches,
      overrideOptions: getOverrideOptions(vinResult.detectedSpec, matches),
      rawHints,
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

app.post('/api/match-config', async (req, res) => {
  try {
    const spec = cleanSpec(req.body || {});
    const chartYear = spec.year || 2026;
    const matches = findMatches(spec, { year: chartYear });
    const rawHints = await findRawChartHints(spec, { year: chartYear });

    res.json({
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
      const inventoryResponse = await attachInventorySearchLinks(recommendations);
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
