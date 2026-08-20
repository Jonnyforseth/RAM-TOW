const express = require('express');
const path = require('path');
const {
  cleanSpec,
  ensureChartTexts,
  findMatches,
  findRawChartHints,
  getOverrideOptions,
  reverseLookup,
  towRows,
  payloadRows,
} = require('./lib/chart-service');
const { attachInventoryMatches } = require('./lib/perkins-service');
const { lookupVin } = require('./lib/sticker-service');

const app = express();
const PORT = 4324;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/health', async (_req, res) => {
  await ensureChartTexts();
  res.json({
    ok: true,
    port: PORT,
    towRows: towRows.length,
    payloadRows: payloadRows.length,
    date: '2026-08-20',
  });
});

app.get('/api/lookup-vin/:vin', async (req, res) => {
  try {
    const vinResult = await lookupVin(req.params.vin);
    const matches = findMatches(vinResult.detectedSpec);
    const rawHints = await findRawChartHints(vinResult.detectedSpec);

    res.json({
      ok: true,
      vin: vinResult.vin,
      pdfUrl: vinResult.pdfUrl,
      stickerTitle: vinResult.detectedSpec.stickerTitle,
      detectedSpec: vinResult.detectedSpec,
      towMatch: matches.towMatches[0] || null,
      payloadMatch: matches.payloadMatches[0] || null,
      matches,
      overrideOptions: getOverrideOptions(vinResult.detectedSpec, matches),
      rawHints,
      notes: [
        'Results are based on the 2026 RAM towing and payload PDFs loaded into this local site.',
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
    const matches = findMatches(spec);
    const rawHints = await findRawChartHints(spec);

    res.json({
      ok: true,
      spec,
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

    if (!Number.isFinite(trailerWeight) || trailerWeight <= 0) {
      throw new Error('Enter a valid trailer weight.');
    }

    if (!Number.isFinite(tongueWeight) || tongueWeight <= 0) {
      throw new Error('Enter a valid tongue weight.');
    }

    const baseResults = reverseLookup({ trailerWeight, tongueWeight, modelPreference });
    let inventoryNotes = [];
    let results = baseResults;

    try {
      const inventoryResponse = await attachInventoryMatches(baseResults);
      results = inventoryResponse.results;
      inventoryNotes = [
        `Perkins inventory pairing checked live on ${new Date(inventoryResponse.checkedAt).toLocaleDateString('en-US')} from perkinsmotors.com.`,
      ];
    } catch (inventoryError) {
      inventoryNotes = [
        `Perkins inventory pairing is temporarily unavailable: ${inventoryError.message}`,
      ];
    }

    res.json({
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
    res.status(400).json({
      ok: false,
      error: error.message,
    });
  }
});

app.use((_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

ensureChartTexts()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`RAM Tow site running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to preload chart PDFs:', error);
    process.exit(1);
  });
