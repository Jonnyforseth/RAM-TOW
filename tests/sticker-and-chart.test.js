const test = require('node:test');
const assert = require('node:assert/strict');

const { buildReverseInsights, buildReverseRecommendations, buildVinCapacitySummary, cleanSpec, findMatches } = require('../src/lib/chart-service');
const { detectGVWR, detectModelYearFromVin, extractDetectedSpec } = require('../src/lib/sticker-service');

test('detectModelYearFromVin reads 2025 and 2026 model years from the VIN', () => {
  assert.equal(detectModelYearFromVin('1C6SRFHP9SN402052'), 2025);
  assert.equal(detectModelYearFromVin('1C6SRFHP9TN402052'), 2026);
});

test('detectGVWR prefers the highest GVW rating when multiple values appear', () => {
  const stickerText = `
    OPTIONAL EQUIPMENT
    3.42 Axle Ratio
    GVW Rating - 9,900 Pounds
    Off-Road Package
    GVW Rating - 11,040 Pounds
  `;

  assert.equal(detectGVWR(stickerText), 11040);
});

test(`extractDetectedSpec maps HD short-bed decode values to 6'4"`, () => {
  const stickerText = `
    A 2026 MODEL YEAR RAM 2500 BIG HORN CREW CAB 4X4 THIS VEHICLE
    Engine: 6.7L I6 Cummins HO Turbo Diesel Engine
    3.42 Axle Ratio
    GVW Rating - 11,040 Pounds
  `;

  const detectedSpec = extractDetectedSpec('3C63R5DL6TG179673', stickerText, {
    Trim: 'Big Horn',
    DriveType: '4WD/4-Wheel Drive/4x4',
    BodyClass: 'Pickup',
    BedType: 'Short',
  });

  assert.equal(detectedSpec.model, '2500');
  assert.equal(detectedSpec.cab, 'Crew');
  assert.equal(detectedSpec.bed, `6'4"`);
  assert.equal(detectedSpec.gvwr, 11040);
});

test(`extractDetectedSpec recognizes REG CAB LONG BOX as Regular 8'`, () => {
  const stickerText = `
    A
    2026 MODEL YEAR

    RAM 2500 TRADESMAN REG CAB 4X4 LONG BOX

    THIS VEHICLE
    Engine: 6.7L I6 Cummins HO Turbo Diesel Engine
    3.42 Axle Ratio
    GVW Rating - 10,000 Pounds
  `;

  const detectedSpec = extractDetectedSpec('3C6MR5AL4TG321656', stickerText, {
    Trim: 'Tradesman',
    DriveType: '4WD/4-Wheel Drive/4x4',
    BodyClass: 'Pickup',
    BedType: '',
  });

  assert.equal(detectedSpec.model, '2500');
  assert.equal(detectedSpec.cab, 'Regular');
  assert.equal(detectedSpec.bed, `8'`);
  assert.equal(detectedSpec.axleRatio, '3.42');
  assert.equal(detectedSpec.gvwr, 10000);
});

test('extractDetectedSpec keeps a 2025 sticker on the 2025 charts', () => {
  const stickerText = `
    A 2025 MODEL YEAR RAM 1500 LIMITED CREW CAB 4X4 THIS VEHICLE
    Engine: 3.0L I6 Twin Turbo Hurricane H/O
    3.92 Rear Axle Ratio
    GVW Rating - 7,100 Pounds
  `;

  const detectedSpec = extractDetectedSpec('1C6SRFHP9SN402052', stickerText, {
    Trim: 'Limited',
    ModelYear: '2025',
    DriveType: '4WD/4-Wheel Drive/4x4',
    BodyClass: 'Pickup',
    BedType: 'Short',
  });

  assert.equal(detectedSpec.year, 2025);
  assert.equal(detectedSpec.engine, '3.0L Hurricane HO');
  assert.equal(detectedSpec.bed, `5'7"`);
});

test('extractDetectedSpec falls back to decoded 1500 cab and engine when Chrysler has no sticker PDF', () => {
  const stickerText = 'We are unable to retrieve a window sticker for this VIN at this time.';

  const detectedSpec = extractDetectedSpec('1C6RREFT0TN427745', stickerText, {
    Trim: 'Big Horn/Lonestar',
    DriveType: '4x2',
    BodyClass: 'Pickup',
    BodyCabType: 'Crew/Super Crew/Crew Max',
    Series2: 'Crew Cab',
    BedType: 'Short',
    DisplacementL: '5.7',
    EngineCylinders: '8',
    FuelTypePrimary: 'Gasoline',
    GVWR: 'Class 2E: 6,001 - 7,000 lb (2,722 - 3,175 kg)',
  });

  assert.equal(detectedSpec.stickerAvailable, false);
  assert.equal(detectedSpec.engine, '5.7L HEMI V8 eTorque');
  assert.equal(detectedSpec.cab, 'Crew');
  assert.equal(detectedSpec.bed, `5'7"`);
  assert.equal(detectedSpec.drive, '4x2');
  assert.equal(detectedSpec.gvwr, null);
});

test('findMatches uses GVWR to choose the correct HD tow row', () => {
  const spec = cleanSpec({
    model: '2500',
    engine: '6.7L Cummins HO',
    drive: '4x4',
    cab: 'Crew',
    bed: `6'4"`,
    rearWheels: 'SRW',
    axleRatio: '3.42',
    gvwr: 11040,
  });

  const matches = findMatches(spec);

  assert.equal(matches.towMatches[0].gvwr, 11040);
  assert.equal(matches.towMatches[0].maxTow, 18230);
  assert.equal(matches.payloadMatches[0].gvwr, 11040);
  assert.equal(matches.payloadMatches[0].maxPayload, 3300);
});

test('findMatches selects the Regular Cab long-box HD tow row for reg cab stickers', () => {
  const spec = cleanSpec({
    model: '2500',
    engine: '6.7L Cummins HO',
    drive: '4x4',
    cab: 'Regular',
    bed: `8'`,
    rearWheels: 'SRW',
    axleRatio: '3.42',
    gvwr: 10000,
  });

  const matches = findMatches(spec);

  assert.equal(matches.towMatches[0].cab, 'Regular');
  assert.equal(matches.towMatches[0].bed, `8'`);
  assert.equal(matches.towMatches[0].maxTow, 19900);
  assert.equal(matches.payloadMatches[0].cab, 'Regular');
  assert.equal(matches.payloadMatches[0].bed, `8'`);
  assert.equal(matches.payloadMatches[0].maxPayload, 2550);
});

test('findMatches returns the 2026 gas 2500 crew long-bed row instead of falling through to no match', () => {
  const spec = cleanSpec({
    year: 2026,
    model: '2500',
    engine: '6.4L HEMI V8',
    drive: '4x4',
    cab: 'Crew',
    bed: `8'`,
    rearWheels: 'SRW',
    axleRatio: '3.73',
    gvwr: 9900,
  });

  const matches = findMatches(spec, { year: 2026 });

  assert.equal(matches.towMatches[0].cab, 'Crew');
  assert.equal(matches.towMatches[0].bed, `8'`);
  assert.equal(matches.towMatches[0].maxTow, 14730);
  assert.equal(matches.payloadMatches[0].cab, 'Crew');
  assert.equal(matches.payloadMatches[0].bed, `8'`);
  assert.equal(matches.payloadMatches[0].maxPayload, 3020);
});

test('findMatches keeps the 2025 gas 2500 crew long-bed row on the 2025 chart set', () => {
  const spec = cleanSpec({
    year: 2025,
    model: '2500',
    engine: '6.4L HEMI V8',
    drive: '4x4',
    cab: 'Crew',
    bed: `8'`,
    rearWheels: 'SRW',
    axleRatio: '4.10',
    gvwr: 10000,
  });

  const matches = findMatches(spec, { year: 2025 });

  assert.equal(matches.towMatches[0].cab, 'Crew');
  assert.equal(matches.towMatches[0].bed, `8'`);
  assert.equal(matches.towMatches[0].maxTow, 16920);
  assert.equal(matches.payloadMatches[0].cab, 'Crew');
  assert.equal(matches.payloadMatches[0].bed, `8'`);
  assert.equal(matches.payloadMatches[0].maxPayload, 3110);
});

test('buildVinCapacitySummary returns a range when the sticker does not pin down axle ratio or exact GVWR', () => {
  const spec = {
    ...cleanSpec({
      year: 2026,
      model: '2500',
      engine: '6.4L HEMI V8',
      drive: '4x4',
      cab: 'Crew',
      bed: `8'`,
      rearWheels: 'SRW',
    }),
    gvwrClassMin: 9001,
    gvwrClassMax: 10000,
  };

  const matches = findMatches(spec, { year: 2026 });
  const towSummary = buildVinCapacitySummary(spec, matches, 'tow');
  const payloadSummary = buildVinCapacitySummary(spec, matches, 'payload');

  assert.equal(towSummary.isRange, true);
  assert.equal(towSummary.min, 14720);
  assert.equal(towSummary.max, 16930);
  assert.match(towSummary.note, /door sticker or with your dealer/i);

  assert.equal(payloadSummary.isRange, true);
  assert.equal(payloadSummary.min, 3020);
  assert.equal(payloadSummary.max, 3110);
});

test('buildVinCapacitySummary stays exact when the VIN result includes axle ratio and GVWR', () => {
  const spec = cleanSpec({
    year: 2026,
    model: '2500',
    engine: '6.4L HEMI V8',
    drive: '4x4',
    cab: 'Crew',
    bed: `8'`,
    rearWheels: 'SRW',
    axleRatio: '4.10',
    gvwr: 10000,
  });

  const matches = findMatches(spec, { year: 2026 });
  const towSummary = buildVinCapacitySummary(spec, matches, 'tow');
  const payloadSummary = buildVinCapacitySummary(spec, matches, 'payload');

  assert.equal(towSummary.isRange, false);
  assert.equal(towSummary.min, 16920);
  assert.equal(towSummary.max, 16920);
  assert.equal(payloadSummary.isRange, false);
  assert.equal(payloadSummary.min, 3110);
  assert.equal(payloadSummary.max, 3110);
});

test('findMatches supports the 2026 3500 gas HEMI chart rows', () => {
  const spec = cleanSpec({
    year: 2026,
    model: '3500',
    engine: '6.4L HEMI V8',
    drive: '4x4',
    cab: 'Crew',
    bed: `6'4"`,
    rearWheels: 'SRW',
    axleRatio: '4.10',
    gvwr: 11040,
  });

  const matches = findMatches(spec, { year: 2026 });

  assert.equal(matches.towMatches[0].maxTow, 17010);
  assert.equal(matches.payloadMatches[0].maxPayload, 4250);
});

test('buildVinCapacitySummary keeps an honest range for ambiguous 3500 gas HEMI stickers', () => {
  const spec = cleanSpec({
    year: 2026,
    model: '3500',
    engine: '6.4L HEMI V8',
    drive: '4x4',
    cab: 'Crew',
    bed: `6'4"`,
    rearWheels: 'SRW',
  });

  const matches = findMatches(spec, { year: 2026 });
  const towSummary = buildVinCapacitySummary(spec, matches, 'tow');

  assert.equal(towSummary.isRange, true);
  assert.equal(towSummary.min, 14770);
  assert.equal(towSummary.max, 17010);
  assert.match(towSummary.note, /axle ratio/i);
});

test('a selected GVWR never leaves a stale towing result when that chart row does not exist', () => {
  const spec = cleanSpec({
    year: 2026,
    model: '3500',
    engine: '6.7L Cummins HO',
    drive: '4x4',
    cab: 'Crew',
    bed: `8'`,
    rearWheels: 'SRW',
    axleRatio: '3.42',
    gvwr: 12000,
  });

  const matches = findMatches(spec, { year: 2026 });
  const towSummary = buildVinCapacitySummary(spec, matches, 'tow');
  const payloadSummary = buildVinCapacitySummary(spec, matches, 'payload');

  assert.equal(towSummary.selectionMismatch, true);
  assert.match(towSummary.note, /does not have a matching RAM towing chart row/i);
  assert.equal(payloadSummary.selectionMismatch, false);
  assert.equal(payloadSummary.min, 4310);
});

test('findMatches uses 2025 light-duty chart rows when the sticker is a 2025 truck', () => {
  const spec = cleanSpec({
    year: 2025,
    model: '1500',
    engine: '3.0L Hurricane HO',
    drive: '4x4',
    cab: 'Crew',
    bed: `5'7"`,
    axleRatio: '3.92',
    gvwr: 7100,
    trim: 'Limited',
  });

  const matches = findMatches(spec, { year: 2025 });

  assert.equal(matches.towMatches[0].maxTow, 9340);
  assert.equal(matches.payloadMatches[0].maxPayload, 1340);
});

test('findMatches no longer falls back to a 3.6L Quad when a 1500 sticker is unavailable', () => {
  const spec = extractDetectedSpec('1C6RREFT0TN427745', 'We are unable to retrieve a window sticker for this VIN at this time.', {
    Trim: 'Big Horn/Lonestar',
    DriveType: '4x2',
    BodyClass: 'Pickup',
    BodyCabType: 'Crew/Super Crew/Crew Max',
    Series2: 'Crew Cab',
    BedType: 'Short',
    DisplacementL: '5.7',
    EngineCylinders: '8',
    FuelTypePrimary: 'Gasoline',
  });

  const matches = findMatches(spec, { year: 2026 });

  assert.equal(matches.towMatches[0].engine, '5.7L HEMI V8 eTorque');
  assert.equal(matches.towMatches[0].cab, 'Crew');
  assert.equal(matches.towMatches[0].bed, `5'7"`);
  assert.equal(matches.towMatches[0].drive, '4x2');
  assert.equal(matches.towMatches[0].maxTow, 8220);
});

test('buildReverseRecommendations prefers the lowest qualifying 1500 setup before stepping up to HD', () => {
  const recommendations = buildReverseRecommendations({
    trailerWeight: 10150,
    tongueWeight: 1014,
    modelPreference: '',
  });

  assert.ok(recommendations.length >= 3);
  assert.equal(recommendations[0].recommendationTitle, 'Minimum setup');
  assert.equal(recommendations[0].model, '1500');
  assert.equal(recommendations[0].engine, '3.0L Hurricane SO');
  assert.equal(recommendations[0].drive, '4x4');
  assert.equal(recommendations[0].axleRatio, '3.92');
  assert.equal(recommendations.some((row) => row.model === '2500'), true);
});

test('buildReverseRecommendations stays inside the chosen model filter', () => {
  const recommendations = buildReverseRecommendations({
    trailerWeight: 10150,
    tongueWeight: 1014,
    modelPreference: '1500',
  });

  assert.ok(recommendations.length >= 2);
  assert.equal(recommendations.every((row) => row.model === '1500'), true);
});

test('buildReverseInsights explains when 1500 is excluded by tongue-weight footnote', () => {
  const recommendations = buildReverseRecommendations({
    trailerWeight: 10150,
    tongueWeight: 1041,
    modelPreference: '',
    hitchType: 'conventional',
  });

  const insights = buildReverseInsights({
    trailerWeight: 10150,
    tongueWeight: 1041,
    modelPreference: '',
    hitchType: 'conventional',
  }, recommendations);

  assert.equal(insights.some((item) => /1,100 lb conventional Class IV hitch limit/i.test(item.message)), false);
});

test('buildReverseRecommendations rejects 28,500 lb conventional-hitch lookups but allows gooseneck 3500 matches', () => {
  const conventional = buildReverseRecommendations({
    trailerWeight: 28500,
    tongueWeight: 2850,
    modelPreference: '',
    hitchType: 'conventional',
  });

  const gooseneck = buildReverseRecommendations({
    trailerWeight: 28500,
    tongueWeight: 2850,
    modelPreference: '',
    hitchType: 'gooseneck',
  });

  assert.equal(conventional.length, 0);
  assert.ok(gooseneck.length >= 1);
  assert.equal(gooseneck[0].model, '3500');
  assert.equal(gooseneck[0].rearWheels, 'DRW');
});

test('buildReverseInsights explains when heavy conventional trailer weights require gooseneck or fifth-wheel', () => {
  const recommendations = buildReverseRecommendations({
    trailerWeight: 28500,
    tongueWeight: 2850,
    modelPreference: '',
    hitchType: 'conventional',
  });

  const insights = buildReverseInsights({
    trailerWeight: 28500,
    tongueWeight: 2850,
    modelPreference: '',
    hitchType: 'conventional',
  }, recommendations);

  assert.equal(insights.some((item) => /requires a 5th-wheel or gooseneck hitch/i.test(item.message)), true);
});

test('buildReverseInsights hides 1500-specific notes when only 2500 and 3500 recommendations remain', () => {
  const recommendations = buildReverseRecommendations({
    trailerWeight: 13500,
    tongueWeight: 1500,
    modelPreference: '',
    hitchType: 'conventional',
  });

  const insights = buildReverseInsights({
    trailerWeight: 13500,
    tongueWeight: 1500,
    modelPreference: '',
    hitchType: 'conventional',
  }, recommendations);

  assert.equal(recommendations.some((row) => row.model === '1500'), false);
  assert.equal(insights.some((item) => /RAM 1500 receiver-hitch limit/i.test(item.title)), false);
  assert.equal(insights.some((item) => /Weight-distributing hitch note/i.test(item.title)), false);
});
