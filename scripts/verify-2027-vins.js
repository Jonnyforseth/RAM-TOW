// Opt-in live integration check: NHTSA + Chrysler -> production VIN API handler.
// Public dealer VINs captured on 2026-10-13; availability can change.
const assert = require('node:assert/strict');

async function main() {
  const { onRequestGet } = await import('../functions/api/lookup-vin/[vin].js');
  for (const [vin, tow, payload] of [
    ['1C6SRFFT0VN556121', 7990, 1640],
    ['1C6SRFFT4VN561340', 11190, 1720],
    ['1C6SRFFP3VN563065', 8160, 1840],
    ['1C6SRFFP0VN557787', 8160, 1840],
  ]) {
    const response = await onRequestGet({ params: { vin }, env: {} });
    const result = await response.json();
    assert.equal(response.status, 200, JSON.stringify(result));
    assert.equal(result.chartYear, 2027);
    assert.equal(result.detectedSpec.stickerAvailable, true, 'live sticker is required for exact validation');
    for (const [summary, expected] of [[result.towSummary, tow], [result.payloadSummary, payload]]) {
      assert.equal(summary.selectionMismatch, false);
      assert.equal(summary.isRange, false);
      assert.equal(summary.min, expected);
      assert.equal(summary.max, expected);
    }
    console.log(`${vin}: 2027 | ${result.detectedSpec.displayEngine} | axle ${result.detectedSpec.axleRatio} | tow ${tow} lb | chart payload ${payload} lb`);
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
