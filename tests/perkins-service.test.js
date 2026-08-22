const test = require('node:test');
const assert = require('node:assert/strict');

const {
  applyVerifiedCapacities,
  buildFilteredInventoryUrl,
  buildCandidateProfile,
  findBestInventoryMatch,
  getMatchingPerkinsEngineFilters,
  inventoryMatchesCandidateProfile,
  meetsTrailerRequirements,
} = require('../src/lib/perkins-service');
const { getVinInventoryLink } = require('../src/lib/inventory-link-service');

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
