const test = require('node:test');
const assert = require('node:assert/strict');

const { buildReverseInsights, buildReverseRecommendations, buildVinCapacitySummary, cleanSpec, findMatches, getOverrideOptions } = require('../src/lib/chart-service');
const { detectGVWR, detectModelYearFromVin, detectVehicleMarket, extractDetectedSpec, infer2024ChartGvwr, infer2025ChartGvwr } = require('../src/lib/sticker-service');

test('detectModelYearFromVin reads 2019 through 2026 model years from the VIN', () => {
  assert.equal(detectModelYearFromVin('1C6RR7KT1KS000000'), 2019);
  assert.equal(detectModelYearFromVin('1C6SRFFT0LN000000'), 2020);
  assert.equal(detectModelYearFromVin('1C6RR7KT1MS000000'), 2021);
  assert.equal(detectModelYearFromVin('1C6SRFJT6NN288764'), 2022);
  assert.equal(detectModelYearFromVin('3C6UR5CL4PG612936'), 2023);
  assert.equal(detectModelYearFromVin('1C6SRFJT9RN198059'), 2024);
  assert.equal(detectModelYearFromVin('1C6SRFHP9SN402052'), 2025);
  assert.equal(detectModelYearFromVin('1C6SRFHP9TN402052'), 2026);
});

test('2019 RAM 1500 keeps standard HEMI and eTorque chart rows separate', () => {
  const standard = cleanSpec({
    year: 2019, model: '1500', engine: '5.7L HEMI V8 eTorque', engineVariant: 'Standard', drive: '4x4', cab: 'Crew', bed: `5'7"`, axleRatio: '3.92', gvwr: 7100,
  });
  const eTorque = cleanSpec({ ...standard, engineVariant: 'eTorque' });

  assert.equal(buildVinCapacitySummary(standard, findMatches(standard, { year: 2019 }), 'tow').min, 11340);
  assert.equal(buildVinCapacitySummary(eTorque, findMatches(eTorque, { year: 2019 }), 'tow').min, 11250);
});

test('2023 Canadian 1500 Sport eTorque returns an axle-dependent chart range', () => {
  const spec = cleanSpec({
    year: 2023,
    model: '1500',
    trim: 'Sport',
    market: 'CA',
    engine: '5.7L HEMI V8 eTorque',
    engineVariant: 'eTorque',
    drive: '4x4',
    cab: 'Crew',
    bed: `5'7"`,
  });
  const matches = findMatches(spec, { year: 2023 });
  const towSummary = buildVinCapacitySummary(spec, matches, 'tow');

  assert.equal(matches.towMatches.length, 2);
  assert.deepEqual([towSummary.min, towSummary.max], [8270, 11370]);
  assert.deepEqual(getOverrideOptions(spec, matches).axleRatio, ['3.21', '3.92']);
});

test('2023 Canadian Limited Longhorn uses a clearly marked mechanical-chart fallback', () => {
  const canadianSpec = cleanSpec({
    year: 2023,
    market: 'CA',
    model: '2500',
    trim: 'Limited Longhorn',
    engine: '6.7L Cummins HO',
    engineVariant: 'Standard',
    drive: '4x4',
    cab: 'Crew',
    bed: `6'4"`,
    rearWheels: 'SRW',
    axleRatio: '3.73',
  });
  const canadianMatches = findMatches(canadianSpec, { year: 2023 });
  const towSummary = buildVinCapacitySummary(canadianSpec, canadianMatches, 'tow');
  const usMatches = findMatches({ ...canadianSpec, market: null }, { year: 2023 });

  assert.ok(canadianMatches.towMatches.length > 0);
  assert.ok(canadianMatches.towMatches.every((row) => row.canadianTrimFallback));
  assert.deepEqual([towSummary.min, towSummary.max], [19170, 19980]);
  assert.match(towSummary.note, /Canadian-market trim naming/);
  assert.equal(usMatches.towMatches.length, 0);
});

test('2019 RAM 1500 Classic keeps six-speed and eight-speed HEMI rows distinct', () => {
  const eightSpeed = cleanSpec({
    year: 2019, model: '1500 Classic', engine: '5.7L HEMI V8', transmission: '8-Speed', drive: '4x4', cab: 'Crew', bed: `5'7"`, axleRatio: '3.92', gvwr: 6900,
  });
  const sixSpeed = cleanSpec({ ...eightSpeed, transmission: '6-Speed' });

  assert.equal(buildVinCapacitySummary(eightSpeed, findMatches(eightSpeed, { year: 2019 }), 'tow').min, 10220);
  assert.equal(buildVinCapacitySummary(sixSpeed, findMatches(sixSpeed, { year: 2019 }), 'tow').min, 10180);
});

test('2019 RAM 1500 Classic detects typographic-dash transmission text from a sticker', () => {
  const detected = extractDetectedSpec('1C6RR7TT0KS612208', `
    2019 MODEL YEAR RAM 1500 CLASSIC BIG HORN CREW CAB 4X4
    Engine: 5.7L HEMI V8 engine
    Transmission: 8–speed automatic transmission
  `, {
    ModelYear: '2019',
    DriveType: '4WD/4-Wheel Drive/4x4',
    DisplacementL: '5.7',
    EngineCylinders: '8',
  });

  assert.equal(detected.transmission, '8-Speed');
});

test('2019 RAM 2500 keeps gas and Cummins chart rows distinct', () => {
  const gas = cleanSpec({
    year: 2019, model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', drive: '4x4', cab: 'Crew', bed: `6'4"`, ramBox: false, axleRatio: '4.10', gvwr: 10000,
  });
  const diesel = cleanSpec({
    year: 2019, model: '2500', engine: '6.7L Cummins HO', engineVariant: 'Standard', rearWheels: 'SRW', drive: '4x4', cab: 'Mega', bed: `6'4"`, ramBox: false, axleRatio: '3.73', gvwr: 10000,
  });

  assert.equal(buildVinCapacitySummary(gas, findMatches(gas, { year: 2019 }), 'tow').min, 16910);
  assert.equal(buildVinCapacitySummary(diesel, findMatches(diesel, { year: 2019 }), 'tow').min, 16520);
});

test('2019 RAM 3500 keeps SRW and DRW Cummins rows distinct', () => {
  const srw = cleanSpec({
    year: 2019, model: '3500', engine: '6.7L Cummins HO', engineVariant: 'Standard', rearWheels: 'SRW', drive: '4x4', cab: 'Crew', bed: `8'`, ramBox: false, axleRatio: '3.73', gvwr: 12300,
  });
  const drwHo = cleanSpec({
    year: 2019, model: '3500', engine: '6.7L Cummins HO', engineVariant: 'HO', rearWheels: 'DRW', drive: '4x4', cab: 'Crew', bed: `8'`, ramBox: false, axleRatio: '4.10', gvwr: 14000,
  });

  assert.equal(buildVinCapacitySummary(srw, findMatches(srw, { year: 2019 }), 'tow').min, 20110);
  assert.equal(buildVinCapacitySummary(srw, findMatches(srw, { year: 2019 }), 'payload').min, 4580);
  assert.equal(buildVinCapacitySummary(drwHo, findMatches(drwHo, { year: 2019 }), 'tow').min, 34130);
  assert.equal(buildVinCapacitySummary(drwHo, findMatches(drwHo, { year: 2019 }), 'payload').min, 5600);
});

test('2019 Canadian-format stickers recognize Regular Cab and the pounds value in GVWR', () => {
  const detected = extractDetectedSpec('3C63R3BLXKG662766', `
    2019 MODEL YEAR RAM 3500 BIG HORN REG CAB 4X4
    Engine: 6.7L Cummins I-6 HO turbocharged diesel engine
    Transmission: 6-speed AISIN heavy-duty automatic transmission
    3.73 rear axle ratio
    GVWR: 5352 kg (11,800 lb)
    FCA Canada Inc. This Vehicle Is Manufactured To Meet Specific Canadian Requirements.
  `, {
    ModelYear: '2019',
    DriveType: '4WD/4-Wheel Drive/4x4',
    DisplacementL: '6.7',
    EngineCylinders: '6',
    FuelTypePrimary: 'Diesel',
  });

  assert.equal(detected.cab, 'Regular');
  assert.equal(detected.bed, `8'`);
  assert.equal(detected.gvwr, 11800);
  assert.equal(detected.market, 'CA');
  assert.equal(buildVinCapacitySummary(detected, findMatches(detected, { year: 2019 }), 'tow').min, 26440);
});

test('Canadian market stickers are detected and allow metric GVWR formatting', () => {
  const canadianSticker = `
    FCA Canada Inc.
    This Vehicle Is Manufactured To Meet Specific Canadian Requirements.
    GVWR: 5 352 kg (11 800 lb)
    For more information visit: www.ramtruck.ca
  `;

  assert.equal(detectVehicleMarket(canadianSticker), 'CA');
  assert.equal(detectGVWR(canadianSticker), 11800);
});

test('2020 RAM 1500 keeps standard HEMI and eTorque chart rows separate', () => {
  const standard = cleanSpec({
    year: 2020, model: '1500', engine: '5.7L HEMI V8 eTorque', engineVariant: 'Standard', drive: '4x4', cab: 'Crew', bed: `5'7"`, axleRatio: '3.92', gvwr: 7100,
  });
  const eTorque = cleanSpec({ ...standard, engineVariant: 'eTorque' });

  assert.equal(buildVinCapacitySummary(standard, findMatches(standard, { year: 2020 }), 'tow').min, 11290);
  assert.equal(buildVinCapacitySummary(eTorque, findMatches(eTorque, { year: 2020 }), 'tow').min, 11080);
});

test('2020 RAM 1500 Classic stays on DS rows', () => {
  const spec = cleanSpec({
    year: 2020, model: '1500 Classic', engine: '5.7L HEMI V8', drive: '4x4', cab: 'Crew', bed: `5'7"`, axleRatio: '3.92', gvwr: 6900,
  });

  assert.equal(buildVinCapacitySummary(spec, findMatches(spec, { year: 2020 }), 'tow').min, 10260);
  assert.equal(buildVinCapacitySummary(spec, findMatches(spec, { year: 2020 }), 'payload').min, 1560);
});

test('2020 RAM 2500 preserves gas, Cummins, drive, and GVWR rows', () => {
  const gas = cleanSpec({
    year: 2020, model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', drive: '4x4', cab: 'Crew', bed: `6'4"`, ramBox: false, axleRatio: '4.10', gvwr: 10000,
  });
  const diesel = cleanSpec({
    year: 2020, model: '2500', engine: '6.7L Cummins HO', engineVariant: 'Standard', rearWheels: 'SRW', drive: '4x4', cab: 'Mega', bed: `6'4"`, ramBox: false, axleRatio: '3.73', gvwr: 9900,
  });

  assert.equal(buildVinCapacitySummary(gas, findMatches(gas, { year: 2020 }), 'tow').min, 16880);
  assert.equal(buildVinCapacitySummary(diesel, findMatches(diesel, { year: 2020 }), 'tow').min, 14690);
  assert.equal(buildVinCapacitySummary(diesel, findMatches(diesel, { year: 2020 }), 'payload').min, 1940);
});

test('2020 RAM 3500 keeps SRW, DRW, standard Cummins, and HO Cummins distinct', () => {
  const srw = cleanSpec({
    year: 2020, model: '3500', engine: '6.7L Cummins HO', engineVariant: 'Standard', rearWheels: 'SRW', drive: '4x4', cab: 'Crew', bed: `6'4"`, ramBox: false, axleRatio: '3.73', gvwr: 11800,
  });
  const drwHo = cleanSpec({
    year: 2020, model: '3500', engine: '6.7L Cummins HO', engineVariant: 'HO', rearWheels: 'DRW', drive: '4x4', cab: 'Crew', bed: `8'`, axleRatio: '4.10', gvwr: 14000,
  });

  assert.equal(buildVinCapacitySummary(srw, findMatches(srw, { year: 2020 }), 'tow').min, 20220);
  assert.equal(buildVinCapacitySummary(srw, findMatches(srw, { year: 2020 }), 'payload').min, 4190);
  assert.equal(buildVinCapacitySummary(drwHo, findMatches(drwHo, { year: 2020 }), 'tow').min, 34110);
  assert.equal(buildVinCapacitySummary(drwHo, findMatches(drwHo, { year: 2020 }), 'payload').min, 5590);
});

test('2021 RAM 1500 keeps standard HEMI and eTorque chart rows separate', () => {
  const standard = cleanSpec({
    year: 2021, model: '1500', engine: '5.7L HEMI V8 eTorque', engineVariant: 'Standard', drive: '4x4', cab: 'Crew', bed: `5'7"`, axleRatio: '3.92', gvwr: 7100,
  });
  const eTorque = cleanSpec({ ...standard, engineVariant: 'eTorque' });

  assert.equal(buildVinCapacitySummary(standard, findMatches(standard, { year: 2021 }), 'tow').min, 11320);
  assert.equal(buildVinCapacitySummary(eTorque, findMatches(eTorque, { year: 2021 }), 'tow').min, 11200);
});

test('2021 RAM 1500 Classic stays on DS rows', () => {
  const spec = extractDetectedSpec(
    '1C6RR7KT1MS000000',
    '2021 MODEL YEAR RAM 1500 CLASSIC TRADESMAN CREW CAB 4X4 5\'7" BOX 5.7L V8 HEMI 3.92 AXLE RATIO GVW RATING 6,900 LB',
    { DriveType: '4WD/4-Wheel Drive/4x4', CabType: 'Crew/Super Crew/Crew Max', EngineModel: '5.7L V8' },
  );
  const matches = findMatches(spec, { year: 2021 });

  assert.equal(spec.model, '1500 Classic');
  assert.equal(spec.engine, '5.7L HEMI V8');
  assert.equal(buildVinCapacitySummary(spec, matches, 'tow').min, 10170);
  assert.equal(buildVinCapacitySummary(spec, matches, 'payload').min, 1560);
});

test('2021 RAM 2500 preserves gas, Cummins, drive, and GVWR rows', () => {
  const gas = cleanSpec({
    year: 2021, model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', drive: '4x4', cab: 'Crew', bed: `6'4"`, ramBox: false, axleRatio: '4.10', gvwr: 10000,
  });
  const diesel = cleanSpec({
    year: 2021, model: '2500', engine: '6.7L Cummins HO', engineVariant: 'Standard', rearWheels: 'SRW', drive: '4x4', cab: 'Mega', bed: `6'4"`, ramBox: false, axleRatio: '3.73', gvwr: 9900,
  });

  assert.equal(buildVinCapacitySummary(gas, findMatches(gas, { year: 2021 }), 'tow').min, 16890);
  assert.equal(buildVinCapacitySummary(diesel, findMatches(diesel, { year: 2021 }), 'tow').min, 14690);
  assert.equal(buildVinCapacitySummary(diesel, findMatches(diesel, { year: 2021 }), 'payload').min, 1940);
});

test('2021 RAM 3500 keeps SRW, DRW, standard Cummins, and HO Cummins distinct', () => {
  const srw = cleanSpec({
    year: 2021, model: '3500', engine: '6.7L Cummins HO', engineVariant: 'Standard', rearWheels: 'SRW', drive: '4x4', cab: 'Crew', bed: `6'4"`, ramBox: false, axleRatio: '3.73', gvwr: 11800,
  });
  const drwHo = cleanSpec({
    year: 2021, model: '3500', engine: '6.7L Cummins HO', engineVariant: 'HO', rearWheels: 'DRW', drive: '4x4', cab: 'Crew', bed: `8'`, axleRatio: '4.10', gvwr: 14000,
  });

  assert.equal(buildVinCapacitySummary(srw, findMatches(srw, { year: 2021 }), 'tow').min, 20230);
  assert.equal(buildVinCapacitySummary(srw, findMatches(srw, { year: 2021 }), 'payload').min, 4200);
  assert.equal(buildVinCapacitySummary(drwHo, findMatches(drwHo, { year: 2021 }), 'tow').min, 34120);
  assert.equal(buildVinCapacitySummary(drwHo, findMatches(drwHo, { year: 2021 }), 'payload').min, 5590);
});

test('2021 chassis cabs are detected as unsupported instead of matching pickup rows', () => {
  const spec = extractDetectedSpec(
    '3C63R3GL1MG000000',
    '2021 MODEL YEAR RAM 3500 CHASSIS CAB TRADESMAN REGULAR CAB 4X4 Engine: 6.7L I6 Cummins Turbo Diesel Engine',
    { DriveType: '4WD/4-Wheel Drive/4x4', CabType: 'Regular', BedType: 'Long', DisplacementL: '6.7', EngineCylinders: '6', FuelTypePrimary: 'Diesel' },
  );

  assert.equal(spec.model, 'Chassis Cab');
  assert.equal(findMatches(spec, { year: 2021 }).towMatches.length, 0);
});

test('2022 RAM 1500 Classic uses DS rows and does not fall through to DT rows', () => {
  const spec = extractDetectedSpec(
    '1C6RR7KT0NS000000',
    '2022 MODEL YEAR RAM 1500 CLASSIC TRADESMAN CREW CAB 4X4 5\'7" BOX 5.7L V8 HEMI 3.92 AXLE RATIO GVW RATING 6,900 LB',
    { DriveType: '4WD/4-Wheel Drive/4x4', CabType: 'Crew/Super Crew/Crew Max', EngineModel: '5.7L V8' },
  );

  assert.equal(spec.model, '1500 Classic');
  assert.equal(spec.engine, '5.7L HEMI V8');
  assert.equal(buildVinCapacitySummary(spec, findMatches(spec, { year: 2022 }), 'tow').min, 10180);
  assert.equal(buildVinCapacitySummary(spec, findMatches(spec, { year: 2022 }), 'payload').min, 1560);
});

test('2022 RAM 1500 Classic keeps its Regular Cab and DT rows distinct', () => {
  const classic = cleanSpec({
    year: 2022, model: '1500 Classic', engine: '5.7L HEMI V8', drive: '4x2', cab: 'Regular', bed: `8'`, axleRatio: '3.92', gvwr: 6600,
  });

  const matches = findMatches(classic, { year: 2022 });
  const summary = buildVinCapacitySummary(classic, matches, 'tow');
  assert.equal(summary.min, 10620);
  assert.equal(matches.towMatches[0].model, '1500 Classic');
});

test('2022 1500 keeps standard HEMI and eTorque chart rows separate', () => {
  const standard = cleanSpec({
    year: 2022, model: '1500', engine: '5.7L HEMI V8 eTorque', engineVariant: 'Standard', drive: '4x4', cab: 'Crew', bed: `5'7"`, axleRatio: '3.92', gvwr: 7100,
  });
  const eTorque = cleanSpec({ ...standard, engineVariant: 'eTorque' });

  const standardSummary = buildVinCapacitySummary(standard, findMatches(standard, { year: 2022 }), 'tow');
  const eTorqueSummary = buildVinCapacitySummary(eTorque, findMatches(eTorque, { year: 2022 }), 'tow');

  assert.equal(standardSummary.min, 11260);
  assert.equal(eTorqueSummary.min, 11210);
});

test('2022 1500 EcoDiesel uses its 4x4 crew long-box row', () => {
  const spec = cleanSpec({
    year: 2022, model: '1500', engine: '3.0L EcoDiesel V6', drive: '4x4', cab: 'Crew', bed: `6'4"`, axleRatio: '3.92', gvwr: 7200,
  });
  const matches = findMatches(spec, { year: 2022 });

  assert.equal(buildVinCapacitySummary(spec, matches, 'tow').min, 9460);
  assert.equal(buildVinCapacitySummary(spec, matches, 'payload').min, 1750);
});

test('2022 2500 keeps 4x2, 4x4, and Power Wagon gas rows distinct', () => {
  const fourByFour = cleanSpec({
    year: 2022, model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', drive: '4x4', cab: 'Crew', bed: `6'4"`, ramBox: false, axleRatio: '4.10', gvwr: 10000,
  });
  const fourByTwo = cleanSpec({ ...fourByFour, drive: '4x2' });
  const powerWagon = cleanSpec({ ...fourByFour, drive: '4x4', trim: 'Power Wagon', axleRatio: '4.10', gvwr: 8565 });

  assert.equal(buildVinCapacitySummary(fourByFour, findMatches(fourByFour, { year: 2022 }), 'tow').min, 17090);
  assert.equal(buildVinCapacitySummary(fourByTwo, findMatches(fourByTwo, { year: 2022 }), 'tow').min, 17390);
  assert.equal(buildVinCapacitySummary(powerWagon, findMatches(powerWagon, { year: 2022 }), 'tow').min, 10590);
});

test('2022 2500 standard Cummins offers GVWR refinement when the sticker omits it', () => {
  const spec = cleanSpec({
    year: 2022, model: '2500', engine: '6.7L Cummins HO', engineVariant: 'Standard', rearWheels: 'SRW', drive: '4x4', cab: 'Mega', bed: `6'4"`, ramBox: false, axleRatio: '3.73',
  });
  const matches = findMatches(spec, { year: 2022 });
  const summary = buildVinCapacitySummary(spec, matches, 'tow');

  assert.deepEqual([summary.min, summary.max], [14620, 15620]);
  assert.deepEqual(getOverrideOptions(spec, matches).gvwr, ['9900', '10000']);
});

test('2022 3500 holds SRW, DRW, standard Cummins, and HO Cummins rows apart', () => {
  const srw = cleanSpec({
    year: 2022, model: '3500', engine: '6.7L Cummins HO', engineVariant: 'Standard', rearWheels: 'SRW', drive: '4x4', cab: 'Crew', bed: `6'4"`, ramBox: false, axleRatio: '3.73', gvwr: 11800,
  });
  const drwHo = cleanSpec({
    year: 2022, model: '3500', engine: '6.7L Cummins HO', engineVariant: 'HO', rearWheels: 'DRW', drive: '4x4', cab: 'Crew', bed: `8'`, ramBox: false, axleRatio: '4.10', gvwr: 14000,
  });

  assert.equal(buildVinCapacitySummary(srw, findMatches(srw, { year: 2022 }), 'tow').min, 20220);
  assert.equal(buildVinCapacitySummary(srw, findMatches(srw, { year: 2022 }), 'payload').min, 4190);
  assert.equal(buildVinCapacitySummary(drwHo, findMatches(drwHo, { year: 2022 }), 'tow').min, 34070);
  assert.equal(buildVinCapacitySummary(drwHo, findMatches(drwHo, { year: 2022 }), 'payload').min, 5580);
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

test('2026 Hurricane HO Tungsten uses the matching Limited chart configuration, not the RHO row', () => {
  const spec = cleanSpec({
    year: 2026,
    model: '1500',
    engine: '3.0L Hurricane HO',
    trim: 'Tungsten',
    drive: '4x4',
    cab: 'Crew',
    bed: `5'7"`,
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
