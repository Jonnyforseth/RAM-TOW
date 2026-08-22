const test = require('node:test');
const assert = require('node:assert/strict');

const { buildReverseInsights, buildReverseRecommendations, buildVinCapacitySummary, cleanSpec, findMatches, getOverrideOptions } = require('../src/lib/chart-service');
const { detectGVWR, detectModelYearFromVin, extractDetectedSpec, infer2024ChartGvwr, infer2025ChartGvwr } = require('../src/lib/sticker-service');

test('detectModelYearFromVin reads 2023 through 2026 model years from the VIN', () => {
  assert.equal(detectModelYearFromVin('3C6UR5CL4PG612936'), 2023);
  assert.equal(detectModelYearFromVin('1C6SRFJT9RN198059'), 2024);
  assert.equal(detectModelYearFromVin('1C6SRFHP9SN402052'), 2025);
  assert.equal(detectModelYearFromVin('1C6SRFHP9TN402052'), 2026);
});

test('2023 2500 standard Cummins uses the correct chart range until door-sticker GVWR is selected', () => {
  const stickerText = `
    A 2023 MODEL YEAR RAM 2500 TRADESMAN CREW CAB 4X4 THIS VEHICLE
    Engine: 6.7L I6 Cummins Turbo Diesel Engine
    6-Speed Automatic 68RFE Transmission
    3.73 Axle Ratio
  `;
  const detected = extractDetectedSpec('3C6UR5CL4PG612936', stickerText, {
    Trim: 'Tradesman',
    ModelYear: '2023',
    DriveType: '4WD/4-Wheel Drive/4x4',
    BodyCabType: 'Crew/Super Crew/Crew Max',
    BedType: 'Short',
    DisplacementL: '6.7',
    EngineCylinders: '6',
    FuelTypePrimary: 'Diesel',
  });
  const matches = findMatches(detected, { year: 2023 });
  const overrides = getOverrideOptions(detected, matches);

  assert.equal(detected.year, 2023);
  assert.equal(detected.engineVariant, 'Standard');
  assert.equal(detected.bed, null);
  assert.deepEqual([buildVinCapacitySummary(detected, matches, 'tow').min, buildVinCapacitySummary(detected, matches, 'tow').max], [17210, 18230]);
  assert.deepEqual([buildVinCapacitySummary(detected, matches, 'payload').min, buildVinCapacitySummary(detected, matches, 'payload').max], [2200, 2300]);
  assert.deepEqual(overrides.gvwr, ['9900', '10000']);

  const exactSpec = cleanSpec({ ...detected, gvwr: 10000, ramBox: false });
  const exactMatches = findMatches(exactSpec, { year: 2023 });
  assert.equal(buildVinCapacitySummary(exactSpec, exactMatches, 'tow').min, 18230);
  assert.equal(buildVinCapacitySummary(exactSpec, exactMatches, 'payload').min, 2300);
});

test('truck title cab information takes priority over unrelated sticker text', () => {
  const detected = extractDetectedSpec('3C6UR5CL4PG612936', `
    A 2023 MODEL YEAR RAM 2500 TRADESMAN CREW CAB 4X4 THIS VEHICLE
    Quad lamp package
    Engine: 6.7L I6 Cummins Turbo Diesel Engine
  `, {
    Trim: 'Tradesman',
    DriveType: '4WD/4-Wheel Drive/4x4',
    BodyCabType: 'Quad Cab',
  });

  assert.equal(detected.cab, 'Crew');
});

test('2023 matcher does not cross EcoDiesel, Hurricane, standard HEMI, eTorque, or RamBox rows', () => {
  const ecoDiesel = cleanSpec({ year: 2023, model: '1500', engine: '3.0L EcoDiesel V6', drive: '4x4', cab: 'Crew', bed: `6'4"`, trim: 'Big Horn' });
  assert.equal(findMatches(ecoDiesel, { year: 2023 }).towMatches[0].engine, '3.0L EcoDiesel V6');

  const standardHemi = cleanSpec({ year: 2023, model: '1500', engine: '5.7L HEMI V8 eTorque', engineVariant: 'Standard', drive: '4x4', cab: 'Crew', bed: `5'7"`, trim: 'Tradesman' });
  assert.ok(findMatches(standardHemi, { year: 2023 }).towMatches.every((row) => row.engineVariant !== 'eTorque'));

  const noRamBox = cleanSpec({ year: 2023, model: '2500', engine: '6.4L HEMI V8', drive: '4x4', cab: 'Crew', bed: `6'4"`, rearWheels: 'SRW', ramBox: false, trim: 'Power Wagon' });
  assert.ok(findMatches(noRamBox, { year: 2023 }).towMatches.every((row) => row.ramBox === false));
});

test('2023 3500 chart rows keep dual-rear-wheel ratings separate from SRW', () => {
  const dually = cleanSpec({ year: 2023, model: '3500', engine: '6.7L Cummins HO', engineVariant: 'HO', drive: '4x4', cab: 'Crew', bed: `8'`, rearWheels: 'DRW', trim: 'Tradesman', axleRatio: '4.10', gvwr: 14000 });
  const matches = findMatches(dually, { year: 2023 });

  assert.equal(matches.towMatches[0].rearWheels, 'DRW');
  assert.equal(matches.towMatches[0].maxTow, 34070);
  assert.equal(matches.payloadMatches[0].rearWheels, 'DRW');
});

test('2023 2500 Rebel diesel uses its separate official Rebel chart row', () => {
  const spec = cleanSpec({
    year: 2023,
    model: '2500',
    engine: '6.7L Cummins HO',
    engineVariant: 'Standard',
    drive: '4x4',
    cab: 'Crew',
    bed: `6'4"`,
    rearWheels: 'SRW',
    trim: 'Power Wagon, Rebel',
    axleRatio: '3.73',
  });
  const matches = findMatches(spec, { year: 2023 });

  assert.equal(matches.towMatches[0].trimStrict, 'Rebel');
  assert.equal(buildVinCapacitySummary(spec, matches, 'tow').min, 14920);
  assert.equal(buildVinCapacitySummary(spec, matches, 'payload').min, 1980);
});

test('2023 2500 Laramie diesel uses the official Crew 6\'4 configuration range', () => {
  const spec = cleanSpec({
    year: 2023,
    model: '2500',
    engine: '6.7L Cummins HO',
    engineVariant: 'Standard',
    drive: '4x4',
    cab: 'Crew',
    rearWheels: 'SRW',
    trim: 'Laramie',
    axleRatio: '3.73',
  });
  const matches = findMatches(spec, { year: 2023 });
  const towSummary = buildVinCapacitySummary(spec, matches, 'tow');
  const payloadSummary = buildVinCapacitySummary(spec, matches, 'payload');

  assert.equal(matches.towMatches[0].trimStrict, 'Laramie');
  assert.deepEqual([towSummary.min, towSummary.max], [19170, 19980]);
  assert.deepEqual([payloadSummary.min, payloadSummary.max], [2390, 2480]);
  assert.deepEqual(getOverrideOptions(spec, matches).gvwr, ['9900', '10000']);
});

test('2023 3500 Big Horn dually long-box matches its chart drivetrain family', () => {
  const spec = cleanSpec({
    year: 2023,
    model: '3500',
    engine: '6.7L Cummins HO',
    engineVariant: 'Standard',
    drive: '4x4',
    cab: 'Crew',
    bed: `8'`,
    rearWheels: 'DRW',
    trim: 'Big Horn',
    axleRatio: '4.10',
  });
  const matches = findMatches(spec, { year: 2023 });
  const towSummary = buildVinCapacitySummary(spec, matches, 'tow');
  const payloadSummary = buildVinCapacitySummary(spec, matches, 'payload');

  assert.equal(matches.towMatches[0].trimStrict, 'Big Horn / Lone Star');
  assert.equal(towSummary.min, 21680);
  assert.equal(payloadSummary.min, 5350);
  assert.equal(payloadSummary.max, 5850);
  assert.deepEqual(getOverrideOptions(spec, matches).gvwr, ['13500', '14000']);
});

test('2024 1500 5.7L 4x4 Crew Cab uses the 2024 chart, not the newer chart set', () => {
  const spec = cleanSpec({
    year: 2024, model: '1500', engine: '5.7L HEMI V8 eTorque', drive: '4x4', cab: 'Crew', bed: `5'7"`, axleRatio: '3.21',
  });
  const matches = findMatches(spec, { year: 2024 });

  assert.equal(matches.towMatches[0].maxTow, 8090);
  assert.equal(matches.payloadMatches[0].maxPayload, 1810);
});

test('2024 2500 standard-output Cummins keeps the GVWR range and exposes both choices', () => {
  const spec = cleanSpec({
    year: 2024, model: '2500', engine: '6.7L Cummins HO', engineVariant: 'Standard', rearWheels: 'SRW', drive: '4x4', cab: 'Mega', bed: `6'4"`, axleRatio: '3.73', trim: 'Limited',
  });
  const matches = findMatches(spec, { year: 2024 });
  const towSummary = buildVinCapacitySummary(spec, matches, 'tow');
  const payloadSummary = buildVinCapacitySummary(spec, matches, 'payload');
  const overrides = getOverrideOptions(spec, matches);

  assert.deepEqual([towSummary.min, towSummary.max], [15840, 15880]);
  assert.deepEqual([payloadSummary.min, payloadSummary.max], [2020, 2080]);
  assert.equal(towSummary.isRange, true);
  assert.deepEqual(overrides.gvwr, ['9900', '10000']);
});

test('2024 DRW 3500 high-output Cummins uses the inferred 14,000 lb chart GVWR', () => {
  const inferredGvwr = infer2024ChartGvwr({ year: 2024, model: '3500', rearWheels: 'DRW' });
  const spec = cleanSpec({
    year: 2024, model: '3500', engine: '6.7L Cummins HO', engineVariant: 'HO', rearWheels: 'DRW', drive: '4x4', cab: 'Crew', bed: `8'`, axleRatio: '4.10', inferredGvwr,
  });
  const matches = findMatches(spec, { year: 2024 });

  assert.equal(inferredGvwr, 14000);
  assert.equal(buildVinCapacitySummary(spec, matches, 'tow').min, 33960);
  assert.equal(buildVinCapacitySummary(spec, matches, 'payload').min, 5560);
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

test('2026 Hurricane HO Limited stays on the Limited chart row instead of including RHO', () => {
  const spec = cleanSpec({
    year: 2026,
    model: '1500',
    engine: '3.0L Hurricane HO',
    trim: 'Limited',
    drive: '4x4',
    cab: 'Crew',
    bed: `5'7"`,
    axleRatio: '3.92',
    gvwr: 7100,
  });

  const matches = findMatches(spec, { year: 2026 });
  const towSummary = buildVinCapacitySummary(spec, matches, 'tow');
  const payloadSummary = buildVinCapacitySummary(spec, matches, 'payload');

  assert.deepEqual(matches.towMatches.map((row) => row.trim), ['Limited']);
  assert.equal(towSummary.isRange, false);
  assert.equal(towSummary.min, 9240);
  assert.equal(payloadSummary.isRange, false);
  assert.equal(payloadSummary.min, 1390);
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

test('2025 3500 Cummins Crew Cab long-box 4x4 SRW uses the chart-derived 12,300 GVWR row', () => {
  const inferredGvwr = infer2025ChartGvwr({
    year: 2025,
    model: '3500',
    engine: '6.7L Cummins HO',
    rearWheels: 'SRW',
    cab: 'Crew',
    bed: `8'`,
    drive: '4x4',
  });
  const spec = cleanSpec({
    year: 2025,
    model: '3500',
    engine: '6.7L Cummins HO',
    rearWheels: 'SRW',
    cab: 'Crew',
    bed: `8'`,
    drive: '4x4',
    axleRatio: '3.42',
    inferredGvwr,
  });
  const matches = findMatches(spec, { year: 2025 });

  assert.equal(inferredGvwr, 12300);
  assert.equal(matches.towMatches[0].maxTow, 25180);
  assert.equal(matches.payloadMatches[0].maxPayload, 4310);
  assert.equal(buildVinCapacitySummary(spec, matches, 'tow').isRange, false);
  assert.equal(buildVinCapacitySummary(spec, matches, 'payload').isRange, false);
});

test('2025 3500 Cummins Crew Cab long-box DRW uses the 14,000 GVWR row', () => {
  const inferredGvwr = infer2025ChartGvwr({
    year: 2025,
    model: '3500',
    engine: '6.7L Cummins HO',
    rearWheels: 'DRW',
    cab: 'Crew',
    bed: `8'`,
    drive: '4x4',
  });
  const spec = cleanSpec({
    year: 2025,
    model: '3500',
    engine: '6.7L Cummins HO',
    rearWheels: 'DRW',
    cab: 'Crew',
    bed: `8'`,
    drive: '4x4',
    axleRatio: '3.42',
    inferredGvwr,
  });
  const matches = findMatches(spec, { year: 2025 });

  assert.equal(inferredGvwr, 14000);
  assert.equal(matches.towMatches[0].maxTow, 33890);
  assert.equal(matches.payloadMatches[0].maxPayload, 5530);
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

  assert.ok(recommendations.length >= 1);
  assert.equal(recommendations.every((row) => row.model === '1500'), true);
});

test('buildReverseRecommendations labels good, better, and best trailer-fit tiers from chart reserve', () => {
  const trailerWeight = 10150;
  const recommendations = buildReverseRecommendations({
    trailerWeight,
    tongueWeight: 1014,
    modelPreference: '',
  });

  assert.equal(recommendations[0].recommendationTier, 'good');
  assert.equal(recommendations[0].towReservePercent, Math.round((recommendations[0].towSurplus / trailerWeight) * 100));
  assert.equal(recommendations.some((row) => row.recommendationTier === 'better'), true);
  assert.equal(recommendations.some((row) => row.recommendationTier === 'best'), true);
  assert.equal(recommendations.every((row) => row.drive === '4x4'), true);
  assert.equal(recommendations.every((row) => row.towReservePercent >= 10 || row.isMaximum3500Dually), true);
});

test('a light trailer gets three engine-diverse RAM 1500 recommendations before stepping up to HD', () => {
  const recommendations = buildReverseRecommendations({
    trailerWeight: 5000,
    tongueWeight: 500,
    modelPreference: '',
  });

  assert.equal(recommendations.length, 3);
  assert.equal(recommendations.every((row) => row.model === '1500'), true);
  assert.equal(new Set(recommendations.map((row) => row.engineFamily)).size, 3);
  assert.equal(recommendations.every((row) => row.towReservePercent >= 10), true);
  assert.equal(recommendations.every((row) => row.headlineMaxTow >= row.maxTow), true);
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
