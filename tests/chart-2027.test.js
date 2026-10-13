const test = require('node:test');
const assert = require('node:assert/strict');
const fixtures = require('./fixtures/2027-vins.json');
const { extractDetectedSpec, detectModelYearFromVin } = require('../src/lib/sticker-service');
const { cleanSpec, findMatches, buildVinCapacitySummary } = require('../src/lib/chart-service');
const { getTowRows, getPayloadRows, resolveChartYear, DEFAULT_CHART_YEAR } = require('../src/data/chart-data');

const expectedLiveVins = [
  ['eTorque', 7990, 1640],
  ['Standard', 11190, 1720],
  [null, 8160, 1840],
  [null, 8160, 1840],
];

fixtures.forEach((fixture, index) => {
  test(`2027 live VIN fixture ${fixture.vin} selects the supplied chart ratings`, () => {
    const spec = extractDetectedSpec(fixture.vin, fixture.stickerText, fixture.decoded);
    const matches = findMatches(spec);
    const [variant, tow, payload] = expectedLiveVins[index];
    assert.equal(detectModelYearFromVin(fixture.vin), 2027);
    assert.equal(spec.year, 2027);
    assert.equal(spec.engineVariant, variant);
    for (const [kind, expected] of [['tow', tow], ['payload', payload]]) {
      const summary = buildVinCapacitySummary(spec, matches, kind);
      assert.equal(summary.selectionMismatch, false);
      assert.equal(summary.isRange, false);
      assert.equal(summary.min, expected);
      assert.equal(summary.max, expected);
    }
  });
});

test('2027 HEMI without a sticker retains both variants, even with known axle and GVWR', () => {
  const fixture = fixtures[0];
  const spec = { ...extractDetectedSpec(fixture.vin, '', fixture.decoded), axleRatio: '3.92', gvwr: 7100 };
  assert.equal(spec.engineVariant, null);
  const matches = findMatches(spec);
  const tow = buildVinCapacitySummary(spec, matches, 'tow');
  const payload = buildVinCapacitySummary(spec, matches, 'payload');
  assert.equal(tow.isRange, true);
  assert.deepEqual([tow.min, tow.max], [11090, 11190]);
  assert.match(tow.note, /eTorque or standard/);
  assert.equal(payload.isRange, true);
  assert.deepEqual([payload.min, payload.max], [1640, 1720]);
});

for (const [label, input, tow, payload] of [
  ['Pentastar Quad 4x2 maximum', { engine: '3.6L Pentastar V6 eTorque', cab: 'Quad', bed: `6'4"`, drive: '4x2', axleRatio: '3.55', gvwr: 7200 }, 8100, 2340],
  ['Pentastar Crew 4x4', { engine: '3.6L Pentastar V6 eTorque', axleRatio: '3.21', gvwr: 6900 }, 6330, 1770],
  ['Hurricane Quad 4x2 maximum', { engine: '3.0L Hurricane SO', cab: 'Quad', bed: `6'4"`, drive: '4x2', axleRatio: '3.92', gvwr: 6900 }, 11530, 1870],
  ['Hurricane Crew long bed', { engine: '3.0L Hurricane SO', bed: `6'4"`, axleRatio: '3.92', gvwr: 7100 }, 11170, 1710],
  ['RHO', { engine: '3.0L Hurricane HO', trim: 'RHO', axleRatio: '3.92', gvwr: 7800 }, 8370, 1530],
  ['Limited', { engine: '3.0L Hurricane HO', trim: 'Limited', axleRatio: '3.92', gvwr: 7100 }, 9240, 1450],
  ['Limited long bed', { engine: '3.0L Hurricane HO', trim: 'Limited', bed: `6'4"`, axleRatio: '3.92', gvwr: 7100 }, 9480, 1450],
]) {
  test(`2027 ${label} matches the PDF and stays separate from other configurations`, () => {
    const spec = cleanSpec({ year: 2027, model: '1500', cab: 'Crew', bed: `5'7"`, drive: '4x4', ...input });
    const matches = findMatches(spec);
    assert.equal(buildVinCapacitySummary(spec, matches, 'tow').min, tow);
    assert.equal(buildVinCapacitySummary(spec, matches, 'payload').min, payload);
    if (input.trim) assert.ok(matches.towMatches.every(row => row.trim === input.trim));
  });
}

test('2027 chart coverage never borrows HD or blank configurations from 2026', () => {
  assert.equal(resolveChartYear(2027), 2027);
  assert.equal(DEFAULT_CHART_YEAR, 2026, 'trailer-fit keeps the complete LD/HD year');
  assert.equal(getTowRows(2027).length, 30);
  assert.equal(getPayloadRows(2027).length, 17);
  assert.ok(getTowRows(2027).every(row => row.model === '1500'));
  for (const input of [
    { model: '2500', engine: '6.7L Cummins HO' },
    { model: '1500', engine: '5.7L HEMI V8', cab: 'Quad' },
    { model: '1500', engine: '3.6L Pentastar V6 eTorque', cab: 'Crew', bed: `6'4"` },
  ]) {
    assert.deepEqual(findMatches(cleanSpec({ year: 2027, ...input })), { towMatches: [], payloadMatches: [] });
  }
  const spec = cleanSpec({ year: 2027, model: '1500', engine: '3.0L Hurricane SO', cab: 'Crew', bed: `5'7"`, drive: '4x4', axleRatio: '3.21' });
  assert.equal(buildVinCapacitySummary(spec, findMatches(spec), 'tow').selectionMismatch, true);
});
