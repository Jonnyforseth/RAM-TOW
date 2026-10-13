// Source: 27MY_Ram_1500_PayTow_2.7.pdf, page 1 (supplied RAM chart).
// Each pair is 4x2 / 4x4. Blank and NA cells are deliberately not rows.
// Keep the existing HEMI family key; engineVariant distinguishes its ratings.
const LIGHT_DUTY_TOW_ROWS_2027 = [];
const LIGHT_DUTY_PAYLOAD_ROWS_2027 = [];
const V6 = '3.6L Pentastar V6 eTorque';
const HEMI = '5.7L HEMI V8 eTorque';
const SO = '3.0L Hurricane SO';
const HO = '3.0L Hurricane HO';
const SHORT = `5'7"`;
const LONG = `6'4"`;

function tow(engine, cab, bed, axleRatio, gcwr, capacities, extra = {}) {
  capacities.forEach((maxTow, index) => {
    if (maxTow == null) return;
    LIGHT_DUTY_TOW_ROWS_2027.push({ model: '1500', engine, cab, bed,
      drive: index === 0 ? '4x2' : '4x4', axleRatio, gcwr, maxTow, ...extra });
  });
}

function payload(engine, cab, bed, gvwr, capacities, extra = {}) {
  capacities.forEach((maxPayload, index) => {
    if (maxPayload == null) return;
    LIGHT_DUTY_PAYLOAD_ROWS_2027.push({ model: '1500', engine, cab, bed,
      drive: index === 0 ? '4x2' : '4x4', gvwr: gvwr[index], maxPayload, ...extra });
  });
}

tow(V6, 'Quad', LONG, '3.21', 11900, [null, 6460]);
tow(V6, 'Crew', SHORT, '3.21', 11900, [6550, 6330]);
tow(V6, 'Quad', LONG, '3.55', 12900, [null, 7460]);
tow(V6, 'Crew', SHORT, '3.55', 12900, [7550, 7330]);
tow(V6, 'Quad', LONG, '3.55', 13370, [8100, null]);

tow(HEMI, 'Crew', SHORT, '3.21', 13900, [8270, 7990], { engineVariant: 'eTorque' });
tow(HEMI, 'Crew', SHORT, '3.92', 17000, [11370, 11090], { engineVariant: 'eTorque' });
tow(HEMI, 'Crew', SHORT, '3.21', 13900, [8370, 8090], { engineVariant: 'Standard' });
tow(HEMI, 'Crew', SHORT, '3.92', 17000, [11470, 11190], { engineVariant: 'Standard' });

tow(SO, 'Quad', LONG, '3.21', 13900, [8430, null]);
tow(SO, 'Crew', SHORT, '3.21', 13900, [8320, null]);
tow(SO, 'Crew', LONG, '3.21', 13900, [8310, null]);
tow(SO, 'Quad', LONG, '3.55', 13900, [null, 8270]);
tow(SO, 'Crew', SHORT, '3.55', 13900, [null, 8160]);
tow(SO, 'Crew', LONG, '3.55', 13900, [null, 8070]);
tow(SO, 'Quad', LONG, '3.92', 17000, [11530, 11370]);
tow(SO, 'Crew', SHORT, '3.92', 17000, [11420, 11260]);
tow(SO, 'Crew', LONG, '3.92', 17000, [11410, 11170]);

tow(HO, 'Crew', SHORT, '3.92', 15160, [null, 8370], { trim: 'RHO' });
tow(HO, 'Crew', SHORT, '3.92', 15160, [null, 9240], { trim: 'Limited', trimAliases: ['Tungsten'] });
tow(HO, 'Crew', LONG, '3.92', 16100, [null, 9480], { trim: 'Limited', trimAliases: ['Tungsten'] });

payload(V6, 'Quad', LONG, [null, 6800], [null, 1770]);
payload(V6, 'Crew', SHORT, [6900, 6900], [1960, 1770]);
payload(V6, 'Quad', LONG, [7200, null], [2340, null]);
payload(HEMI, 'Crew', SHORT, [6900, 7100], [1680, 1640], { engineVariant: 'eTorque' });
payload(HEMI, 'Crew', SHORT, [6900, 7100], [1760, 1720], { engineVariant: 'Standard' });
payload(SO, 'Quad', LONG, [6900, 7100], [1870, 1880]);
payload(SO, 'Crew', SHORT, [6900, 7100], [1800, 1840]);
payload(SO, 'Crew', LONG, [6900, 7100], [1680, 1710]);
payload(HO, 'Crew', SHORT, [null, 7100], [null, 1450], { trim: 'Limited', trimAliases: ['Tungsten'] });
payload(HO, 'Crew', LONG, [null, 7100], [null, 1450], { trim: 'Limited', trimAliases: ['Tungsten'] });
payload(HO, 'Crew', SHORT, [null, 7800], [null, 1530], { trim: 'RHO' });
// The source also prints an unpaired, unlabeled "1,380" in the HO long-bed
// 7,800-GVWR cell. It does not identify a drivetrain/trim; do not invent one.

module.exports = { LIGHT_DUTY_TOW_ROWS_2027, LIGHT_DUTY_PAYLOAD_ROWS_2027 };
