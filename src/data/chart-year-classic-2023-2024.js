// Source: 2023 RAM 1500 Classic Canadian towing guide and the official
// 2024 RAM 1500 Classic Payload & Towing guide. Classic remained on the DS
// platform, so it must not share the DT 1500 chart family.

function addTow(rows, year, engine, axleRatio, gcwr, entries) {
  for (const [cab, bed, fourByTwo, fourByFour] of entries) {
    if (fourByTwo) rows.push({ year, model: '1500 Classic', engine, transmission: '8-Speed', axleRatio, gcwr, cab, bed, drive: '4x2', ramBox: false, maxTow: fourByTwo });
    if (fourByFour) rows.push({ year, model: '1500 Classic', engine, transmission: '8-Speed', axleRatio, gcwr, cab, bed, drive: '4x4', ramBox: false, maxTow: fourByFour });
  }
}

function addPayload(rows, year, engine, gvwr, entries) {
  for (const [cab, bed, fourByTwo, fourByFour] of entries) {
    if (fourByTwo) rows.push({ year, model: '1500 Classic', engine, transmission: '8-Speed', gvwr, cab, bed, drive: '4x2', ramBox: false, maxPayload: fourByTwo });
    if (fourByFour) rows.push({ year, model: '1500 Classic', engine, transmission: '8-Speed', gvwr, cab, bed, drive: '4x4', ramBox: false, maxPayload: fourByFour });
  }
}

function buildClassicRows(year) {
  const towRows = [];
  const payloadRows = [];
  const v6 = '3.6L Pentastar V6';
  const hemi = '5.7L HEMI V8';

  if (year === 2023) {
    addTow(towRows, year, v6, '3.21', 9850, [
      ['Regular', `6'4"`, 4940, 4710], ['Regular', `8'`, 4720, 4520], ['Quad', `6'4"`, 4610, 4370], ['Crew', `5'7"`, 4530, 4350],
    ]);
    addTow(towRows, year, v6, '3.55', 12200, [['Regular', `6'4"`, 7290, 7060]]);
    addTow(towRows, year, v6, '3.55', 12400, [['Regular', `8'`, 7270, 7070]]);
    addTow(towRows, year, v6, '3.55', 12900, [['Quad', `6'4"`, 7660, 7420], ['Crew', `5'7"`, 7580, 7400]]);
    addTow(towRows, year, hemi, '3.21', 13800, [
      ['Regular', `6'4"`, 8650, 8450], ['Regular', `8'`, 8430, 8240], ['Quad', `6'4"`, 8340, 8160], ['Crew', `5'7"`, 8290, 8090], ['Crew', `6'4"`, 8240, 8000],
    ]);
    addTow(towRows, year, hemi, '3.92', 14350, [['Regular', `6'4"`, 9200, 9000]]);
    addTow(towRows, year, hemi, '3.92', 15850, [['Regular', `8'`, 10110, null]]);
    addTow(towRows, year, hemi, '3.92', 15975, [
      ['Regular', `6'4"`, 10610, 10420], ['Regular', `8'`, 10520, 10330], ['Quad', `6'4"`, 10460, 10270], ['Crew', `5'7"`, 10420, 10210], ['Crew', `6'4"`, 10460, 10420],
    ]);
    addPayload(payloadRows, year, v6, 6025, [['Regular', `6'4"`, 1510, null]]);
    addPayload(payloadRows, year, v6, 6300, [['Regular', `8'`, 1580, null]]);
    addPayload(payloadRows, year, v6, 6600, [['Quad', `6'4"`, 1910, 1710]]);
    addPayload(payloadRows, year, v6, 6800, [['Quad', `6'4"`, 1930, 1740], ['Crew', `5'7"`, 1870, 1720]]);
    addPayload(payloadRows, year, hemi, 6350, [['Regular', `6'4"`, 1610, 1400]]);
    addPayload(payloadRows, year, hemi, 6600, [['Regular', `8'`, 1680, 1490]]);
    addPayload(payloadRows, year, hemi, 6800, [['Quad', `6'4"`, 1710, 1520], ['Crew', `5'7"`, 1650, 1460], ['Crew', `6'4"`, 1610, 1430]]);
    addPayload(payloadRows, year, hemi, 6900, [['Quad', `6'4"`, 1810, 1620], ['Crew', `5'7"`, 1750, 1560], ['Crew', `6'4"`, 1710, 1530]]);
  }

  if (year === 2024) {
    addTow(towRows, year, v6, '3.21', 9850, [['Quad', `6'4"`, 4590, 4310], ['Crew', `5'7"`, 4530, 4320]]);
    addTow(towRows, year, v6, '3.55', 12900, [['Quad', `6'4"`, 7640, 7360], ['Crew', `5'7"`, 7580, 7370]]);
    addTow(towRows, year, hemi, '3.21', 13800, [['Quad', `6'4"`, 8330, 8040], ['Crew', `5'7"`, 8260, 7990], ['Crew', `6'4"`, 8240, 8000]]);
    addTow(towRows, year, hemi, '3.92', 15850, [['Quad', `6'4"`, null, 10050]]);
    addTow(towRows, year, hemi, '3.92', 15975, [['Quad', `6'4"`, 10500, 10210], ['Crew', `5'7"`, 10440, 10160], ['Crew', `6'4"`, 10410, null]]);
    addPayload(payloadRows, year, v6, 6800, [['Quad', `6'4"`, 1930, 1750], ['Crew', `5'7"`, 1870, 1720]]);
    addPayload(payloadRows, year, hemi, 6900, [['Quad', `6'4"`, 1810, 1620], ['Crew', `5'7"`, 1750, 1560], ['Crew', `6'4"`, 1710, 1530]]);
  }

  return { towRows, payloadRows };
}

module.exports = { buildClassicRows };
