const test = require('node:test');
const assert = require('node:assert/strict');

const { cleanSpec, findMatches } = require('../src/lib/chart-service');
const { detectGVWR, extractDetectedSpec } = require('../src/lib/sticker-service');

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
