const test = require('node:test');
const assert = require('node:assert/strict');

const {
  applyVerifiedCapacities,
  buildFilteredInventoryUrl,
  buildCandidateProfile,
  dedupeInventoryByVin,
  extractMileage,
  findBestInventoryMatch,
  findVerifiedInventoryByVin,
  filterVerifiedInventorySnapshot,
  getMatchingPerkinsEngineFilters,
  inventoryMatchesCandidateProfile,
  meetsTrailerRequirements,
  sortVerifiedInventoryRows,
} = require('../src/lib/perkins-service');
const { getVinInventoryLink } = require('../src/lib/inventory-link-service');

test('extractMileage prefers vehicle structured data and supports Perkins mileage markup', () => {
  assert.equal(extractMileage('', { mileageFromOdometer: { value: 1858 } }), 1858);
  assert.equal(extractMileage('<dl><dt>42,605</dt><dd>Miles</dd></dl>', null), 42605);
  assert.equal(extractMileage('', null), null);
});

test('daily verified inventory snapshots filter by trailer requirements without rescanning VINs', () => {
  const snapshot = {
    source: 'https://perkinsmotors.com',
    generatedAt: '2026-08-26T12:00:00.000Z',
    checkedCount: 42,
    rows: [
      {
        model: '1500',
        maxTow: 9590,
        maxPayload: 1630,
        inventoryMatch: { stockNumber: 'LOW', currentPrice: 36000 },
      },
      {
        model: '2500',
        maxTow: 15000,
        maxPayload: 2800,
        fifthWheelGooseneckPrep: true,
        inventoryMatch: { stockNumber: 'HD', currentPrice: 52000 },
      },
    ],
  };

  const result = filterVerifiedInventorySnapshot(snapshot, {
    trailerWeight: 10000,
    tongueWeight: 1000,
    modelPreference: '',
  });

  assert.equal(result.checkedCount, 42);
  assert.equal(result.verifiedCount, 1);
  assert.equal(result.results[0].inventoryMatch.stockNumber, 'HD');
  assert.equal(result.results[0].towSurplus, 5000);
  assert.equal(result.results[0].payloadSurplus, 1800);
});

test('gooseneck inventory results require VIN-confirmed factory prep equipment', () => {
  const snapshot = {
    rows: [
      {
        model: '3500',
        maxTow: 30000,
        maxPayload: 5000,
        fifthWheelGooseneckPrep: false,
        inventoryMatch: { stockNumber: 'NO-PREP', currentPrice: 60000 },
      },
      {
        model: '3500',
        maxTow: 30000,
        maxPayload: 5000,
        fifthWheelGooseneckPrep: true,
        inventoryMatch: { stockNumber: 'PREP', currentPrice: 62000 },
      },
    ],
  };

  const result = filterVerifiedInventorySnapshot(snapshot, {
    trailerWeight: 15000,
    tongueWeight: 1800,
    hitchType: 'gooseneck',
    modelPreference: '3500',
  });

  assert.equal(result.verifiedCount, 1);
  assert.equal(result.results[0].inventoryMatch.stockNumber, 'PREP');
});

test('VIN lookups for 2025 and older route to the matching used RAM model inventory', async () => {
  const link = await getVinInventoryLink({ year: 2025, model: '2500', engine: '6.7L Cummins HO' }, {});
  const url = new URL(link.url);

  assert.equal(link.inventoryType, 'used');
  assert.equal(url.searchParams.get('condition'), 'used');
  assert.equal(url.searchParams.get('make'), 'Ram');
  assert.equal(url.searchParams.get('model'), '2500');
  assert.equal(url.searchParams.get('utm_campaign'), 'vin_lookup_used');
});

test('2026 VIN links retain their configuration-specific inventory lookup', async () => {
  const link = await getVinInventoryLink({ year: 2026, model: '1500', engine: '5.7L HEMI V8 eTorque', drive: '4x4', cab: 'Crew', bed: `5'7"` }, {
    towMatches: [{ model: '1500', engine: '5.7L HEMI V8 eTorque', drive: '4x4', cab: 'Crew', bed: `5'7"` }],
  });

  assert.notEqual(link?.inventoryType, 'used');
});

test('buildFilteredInventoryUrl keeps a VIN setup in Perkins filters and adds VIN UTM attribution', () => {
  const inventoryLink = buildFilteredInventoryUrl(
    {
      model: '2500',
      engine: '6.4L HEMI V8',
      drive: '4x4',
      cab: 'Crew',
      bed: `6'4"`,
    },
    {
      baseUrl: 'https://perkinsmotors.com/sale/ram-2500-colorado-springs-co',
      engines: ['6.4L V8'],
      drivetrains: ['4X4'],
      cabs: ['Crew Cab'],
      wheelbases: ['149', '169'],
    },
    { campaign: 'vin_lookup', context: 'vin_lookup' }
  );

  const url = new URL(inventoryLink.url);
  assert.equal(url.searchParams.get('model'), '2500');
  assert.equal(url.searchParams.get('engine'), '6.4L V8');
  assert.equal(url.searchParams.get('drivetrain'), '4X4');
  assert.equal(url.searchParams.get('cab_type'), 'Crew Cab');
  assert.equal(url.searchParams.get('wheelbase_code'), '149');
  assert.equal(url.searchParams.get('utm_campaign'), 'vin_lookup');
  assert.match(url.searchParams.get('utm_content'), /^vin_lookup_ram-2500/);
});

test('buildFilteredInventoryUrl carries trailer target attribution to Perkins', () => {
  const inventoryLink = buildFilteredInventoryUrl(
    { model: '3500', engine: '6.7L Cummins HO', drive: '4x4', cab: 'Crew', bed: `8'` },
    {
      baseUrl: 'https://perkinsmotors.com/sale/ram-3500-colorado-springs-co',
      engines: ['6.7L I6 Cummins HO Turbo Diesel Eng'],
      drivetrains: ['4X4'],
      cabs: ['Crew Cab'],
      wheelbases: ['169.5'],
    },
    { campaign: 'trailer_fit', trailerWeight: 12000, tongueWeight: 1200 }
  );

  const url = new URL(inventoryLink.url);
  assert.equal(url.searchParams.get('utm_campaign'), 'trailer_fit');
  assert.equal(url.searchParams.get('utm_term'), 'tow-12000-payload-1200');
});

test('findBestInventoryMatch rejects drive mismatches for reverse lookup inventory pairing', () => {
  const row = {
    model: '1500',
    engine: '5.7L HEMI V8 eTorque',
    trim: null,
    drive: '4x2',
    cab: 'Crew',
    bed: `5'7"`,
    rearWheels: null,
    axleRatio: '3.92',
  };

  const inventory = [
    {
      year: 2026,
      model: '1500',
      trim: 'Big Horn/Lone Star',
      title: '2026 Ram 1500 Big Horn/Lone Star 4X4 Truck',
      stockNumber: '556673',
      inventoryUrl: 'https://perkinsmotors.com/example-4x4',
      inventoryVin: '1C6SRFFT6TN229347',
      price: 51835,
      drive: '4x4',
      cab: 'Crew',
      bed: `5'7"`,
      rearWheels: null,
      engine: '5.7L HEMI V8 eTorque',
      axleRatios: ['3.92'],
      trimKey: 'big horn',
    },
  ];

  assert.equal(findBestInventoryMatch(row, inventory), null);
});

test('findBestInventoryMatch keeps exact reverse lookup inventory pairings', () => {
  const row = {
    model: '1500',
    engine: '3.0L Hurricane SO',
    trim: null,
    drive: '4x4',
    cab: 'Crew',
    bed: `5'7"`,
    rearWheels: null,
    axleRatio: '3.92',
  };

  const inventory = [
    {
      year: 2026,
      model: '1500',
      trim: 'Big Horn/Lone Star',
      title: '2026 Ram 1500 Big Horn/Lone Star 4X4 Truck',
      stockNumber: '556683',
      inventoryUrl: 'https://perkinsmotors.com/example-hurricane-4x4',
      inventoryVin: '3C6SRFFP0T4215716',
      price: 57557,
      drive: '4x4',
      cab: 'Crew',
      bed: `5'7"`,
      rearWheels: null,
      engine: '3.0L Hurricane SO',
      axleRatios: ['3.92'],
      trimKey: 'big horn',
    },
  ];

  const match = findBestInventoryMatch(row, inventory);

  assert.ok(match);
  assert.equal(match.stockNumber, '556683');
  assert.equal(match.matchLabel, 'Exact Perkins match');
});

test('buildCandidateProfile narrows 1500 reverse lookup candidates to valid engine families', () => {
  const profile = buildCandidateProfile([
    { model: '1500', engine: '3.0L Hurricane SO', drive: '4x4', cab: 'Crew', bed: `5'7"`, axleRatio: '3.92' },
    { model: '1500', engine: '5.7L HEMI V8 eTorque', drive: '4x2', cab: 'Crew', bed: `5'7"`, axleRatio: '3.92' },
  ]);

  assert.deepEqual(profile.engines.sort(), ['3.0L Hurricane SO', '5.7L HEMI V8 eTorque']);
  assert.deepEqual(profile.drives.sort(), ['4x2', '4x4']);
  assert.deepEqual(profile.axleRatios, ['3.92']);
});

test('inventoryMatchesCandidateProfile rejects impossible inventory engines before VIN verification', () => {
  const profile = buildCandidateProfile([
    { model: '1500', engine: '3.0L Hurricane SO', drive: '4x4', cab: 'Crew', bed: `5'7"`, axleRatio: '3.92' },
    { model: '1500', engine: '5.7L HEMI V8 eTorque', drive: '4x2', cab: 'Crew', bed: `5'7"`, axleRatio: '3.92' },
  ]);

  const v6Truck = {
    inventoryVin: '1C6RRFGG4TN361362',
    year: 2026,
    engine: '3.6L Pentastar V6 eTorque',
    drive: '4x4',
    cab: 'Crew',
    bed: null,
    rearWheels: null,
    axleRatios: ['3.21'],
    trim: 'Tradesman',
  };

  const hemiTruck = {
    inventoryVin: '1C6SRFFT6TN229347',
    year: 2026,
    engine: '5.7L HEMI V8 eTorque',
    drive: '4x4',
    cab: 'Crew',
    bed: null,
    rearWheels: null,
    axleRatios: ['3.92'],
    trim: 'Big Horn/Lone Star',
  };

  assert.equal(inventoryMatchesCandidateProfile(v6Truck, profile), false);
  assert.equal(inventoryMatchesCandidateProfile(hemiTruck, profile), true);
});

test('VIN-verified capacities can disqualify a reverse lookup truck that chart minimums overstate', () => {
  const chartRow = {
    model: '1500',
    engine: '5.7L HEMI V8 eTorque',
    drive: '4x2',
    cab: 'Crew',
    bed: `5'7"`,
    axleRatio: '3.92',
    towGCWR: 17000,
    payloadGVWR: 6900,
    maxTow: 11320,
    maxPayload: 1650,
  };

  const verified = {
    sourceVin: '1C6SRFFT6TN229347',
    drive: '4x4',
    cab: 'Crew',
    bed: `5'7"`,
    axleRatio: '3.92',
    towGCWR: 15850,
    payloadGVWR: 7100,
    towCapacity: 9590,
    payloadCapacity: 1630,
    engine: '5.7L HEMI V8 eTorque',
  };

  const merged = applyVerifiedCapacities(chartRow, verified);

  assert.equal(merged.maxTow, 9590);
  assert.equal(merged.maxPayload, 1630);
  assert.equal(merged.drive, '4x4');
  assert.equal(meetsTrailerRequirements(merged, { trailerWeight: 10150, tongueWeight: 1041 }), false);
});

test('lowest-price inventory rows sort by listed price and do not repeat stock numbers', () => {
  const results = sortVerifiedInventoryRows([
    { maxTow: 12000, maxPayload: 2000, inventoryMatch: { stockNumber: 'A', currentPrice: 53000 } },
    { maxTow: 13000, maxPayload: 2100, inventoryMatch: { stockNumber: 'B', currentPrice: 49000 } },
    { maxTow: 12500, maxPayload: 2050, inventoryMatch: { stockNumber: 'A', currentPrice: 48000 } },
  ]);

  assert.deepEqual(results.map((row) => row.inventoryMatch.stockNumber), ['A', 'B']);
});

test('certified listings take precedence when the same VIN is also listed as used', () => {
  const inventory = dedupeInventoryByVin([
    { inventoryVin: '1C6SRFFT6TN229347', inventoryUrl: 'https://perkinsmotors.com/used', condition: 'used' },
    { inventoryVin: '1C6SRFFT6TN229347', inventoryUrl: 'https://perkinsmotors.com/certified', condition: 'certified' },
    { inventoryVin: '3C6SRFGP4T4178622', inventoryUrl: 'https://perkinsmotors.com/new', condition: 'new' },
  ]);

  assert.equal(inventory.length, 2);
  assert.equal(inventory.find((item) => item.inventoryVin === '1C6SRFFT6TN229347').condition, 'certified');
});

test('getMatchingPerkinsEngineFilters includes both HEMI aliases for the 5.7L eTorque engine', () => {
  const matches = getMatchingPerkinsEngineFilters(
    [
      '3.0L I6',
      '3.0L I6 Hurricane SO Twin Turbo ESS',
      '5.7L V8 HEMI MDS VVT eTorque Engine',
      'HEMI 5.7L V8 Multi Displacement VVT eTorque',
    ],
    '5.7L HEMI V8 eTorque'
  );

  assert.deepEqual(matches, [
    '5.7L V8 HEMI MDS VVT eTorque Engine',
    'HEMI 5.7L V8 Multi Displacement VVT eTorque',
  ]);
});

test('getMatchingPerkinsEngineFilters keeps all 3.0L I6 options visible for Hurricane HO', () => {
  const matches = getMatchingPerkinsEngineFilters(
    [
      '3.0L I6',
      '3.0L I6 Hurricane SO Twin Turbo ESS',
      '3.0L I6 Hurricane HO Twin Turbo ESS',
      '5.7L V8 HEMI MDS VVT eTorque Engine',
    ],
    '3.0L Hurricane HO'
  );

  assert.deepEqual(matches, [
    '3.0L I6',
    '3.0L I6 Hurricane SO Twin Turbo ESS',
    '3.0L I6 Hurricane HO Twin Turbo ESS',
  ]);
});

test('getMatchingPerkinsEngineFilters includes generic and Cummins-labelled 6.7L I6 diesel options', () => {
  const matches = getMatchingPerkinsEngineFilters(
    [
      '6.4L V8',
      '6.7L I6',
      '6.7L I6 Cummins HO Turbo Diesel Eng',
      'Cummins 6.7L I6 Turbodiesel',
    ],
    '6.7L Cummins HO'
  );

  assert.deepEqual(matches, [
    '6.7L I6',
    '6.7L I6 Cummins HO Turbo Diesel Eng',
    'Cummins 6.7L I6 Turbodiesel',
  ]);
});

test('an exact Perkins stock VIN is found directly from the daily snapshot', () => {
  const row = {
    inventoryMatch: {
      inventoryVin: '1C6RREJP1TN000001',
      inventoryUrl: 'https://perkinsmotors.com/example',
      currentPrice: 52000,
    },
  };
  const found = findVerifiedInventoryByVin({ rows: [row] }, '1c6rrejp1tn000001');

  assert.equal(found, row);
});
