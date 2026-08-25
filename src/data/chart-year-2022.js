// 2022 RAM charts are published as separate Body Builder configuration tables.
// Keep the source values together, then derive tow/payload rows so the two
// results always describe the same axle, GVWR, drivetrain, cab, and box.
function rows(config, values) {
  return values.map(([engine, engineVariant, axleRatio, gvwr, maxPayload, gcwr, maxTow]) => ({
    ...config,
    rearWheels: config.rearWheels || (config.model === '3500' ? (gvwr >= 13500 ? 'DRW' : 'SRW') : undefined),
    engine,
    engineVariant,
    axleRatio: String(axleRatio),
    gvwr,
    maxPayload,
    gcwr,
    maxTow,
  }));
}

const PENTASTAR = '3.6L Pentastar V6 eTorque';
const ECODIESEL = '3.0L EcoDiesel V6';
const HEMI_1500 = '5.7L HEMI V8 eTorque';
const TRX = '6.2L Supercharged HEMI V8';
const HEMI_HD = '6.4L HEMI V8';
const CUMMINS = '6.7L Cummins HO';
const STANDARD = 'Standard';
const ETORQUE = 'eTorque';
const HO = 'HO';

// 2022 RAM 1500 (DT) Weight and Tow Chart, dated July 14, 2021. The source
// tables publish HFE, Tradesman, and TRX baselines; the matcher preserves the
// full drivetrain/cab/box/engine family and exposes axle/GVWR choices when a
// sticker does not identify the exact chart row.
const LD_ROWS_2022 = [
  ...rows({ model: '1500', trimStrict: 'HFE', cab: 'Quad', bed: `6'4"`, drive: '4x2' }, [
    [PENTASTAR, null, '3.21', 6010, 1240, 11900, 6760],
    [ECODIESEL, null, '3.21', 6990, 1750, 13900, 8290],
  ]),
  ...rows({ model: '1500', cab: 'Quad', bed: `6'4"`, drive: '4x2' }, [
    [PENTASTAR, null, '3.55', 7100, 2300, 12900, 7700],
    [ECODIESEL, null, '3.21', 7200, 2090, 13900, 8340], [ECODIESEL, null, '3.92', 7200, 2090, 15600, 10040], [ECODIESEL, null, '3.92', 7200, 2090, 18200, 12560],
    [HEMI_1500, STANDARD, '3.21', 6900, 1930, 13900, 8490], [HEMI_1500, STANDARD, '3.92', 6900, 1930, 17000, 11590],
    [HEMI_1500, ETORQUE, '3.21', 6900, 1840, 13900, 8450], [HEMI_1500, ETORQUE, '3.92', 6900, 1840, 17000, 11550], [HEMI_1500, ETORQUE, '3.92', 6900, 1840, 18350, 12750],
  ]),
  ...rows({ model: '1500', cab: 'Crew', bed: `6'4"`, drive: '4x2' }, [
    [PENTASTAR, null, '3.21', 6900, 1990, 11900, 6490], [PENTASTAR, null, '3.55', 6900, 1990, 12900, 7490],
    [ECODIESEL, null, '3.21', 7000, 1770, 13900, 8160], [ECODIESEL, null, '3.92', 7000, 1770, 15600, 9860],
    [HEMI_1500, STANDARD, '3.21', 6900, 1800, 13900, 8440], [HEMI_1500, STANDARD, '3.92', 6900, 1800, 17000, 11540],
    [HEMI_1500, ETORQUE, '3.21', 6900, 1710, 13900, 8210], [HEMI_1500, ETORQUE, '3.92', 6900, 1710, 17000, 11310],
  ]),
  ...rows({ model: '1500', cab: 'Crew', bed: `5'7"`, drive: '4x2' }, [
    [PENTASTAR, null, '3.21', 6900, 2020, 11900, 6550], [PENTASTAR, null, '3.55', 6900, 2020, 12900, 7550],
    [ECODIESEL, null, '3.21', 7000, 1800, 13900, 8100], [ECODIESEL, null, '3.92', 7000, 1800, 15600, 9800],
    [HEMI_1500, STANDARD, '3.21', 6900, 1850, 13900, 8420], [HEMI_1500, STANDARD, '3.92', 6900, 1850, 17000, 11520],
    [HEMI_1500, ETORQUE, '3.21', 6900, 1760, 13900, 8200], [HEMI_1500, ETORQUE, '3.92', 6900, 1760, 17000, 11300],
  ]),
  ...rows({ model: '1500', cab: 'Quad', bed: `6'4"`, drive: '4x4' }, [
    [PENTASTAR, null, '3.21', 6800, 1830, 11900, 6510], [PENTASTAR, null, '3.55', 6800, 1830, 12900, 7510],
    [ECODIESEL, null, '3.21', 7100, 1810, 13900, 8050], [ECODIESEL, null, '3.92', 7100, 1810, 15600, 9750],
    [HEMI_1500, STANDARD, '3.21', 7100, 1940, 13900, 8240], [HEMI_1500, STANDARD, '3.92', 7100, 1940, 17000, 11340],
    [HEMI_1500, ETORQUE, '3.21', 7100, 1850, 13900, 8220], [HEMI_1500, ETORQUE, '3.92', 7100, 1850, 17000, 11320],
  ]),
  ...rows({ model: '1500', cab: 'Crew', bed: `6'4"`, drive: '4x4' }, [
    [PENTASTAR, null, '3.21', 6900, 1790, 11900, 6120], [PENTASTAR, null, '3.55', 6900, 1790, 12900, 7120],
    [ECODIESEL, null, '3.21', 7200, 1750, 13900, 7760], [ECODIESEL, null, '3.92', 7200, 1750, 15600, 9460],
    [HEMI_1500, STANDARD, '3.21', 7100, 1800, 13900, 8210], [HEMI_1500, STANDARD, '3.92', 7100, 1800, 17000, 11310],
    [HEMI_1500, ETORQUE, '3.21', 7100, 1700, 13900, 7820], [HEMI_1500, ETORQUE, '3.92', 7100, 1700, 17000, 10920],
  ]),
  ...rows({ model: '1500', cab: 'Crew', bed: `5'7"`, drive: '4x4' }, [
    [PENTASTAR, null, '3.21', 6900, 1840, 11900, 6320], [PENTASTAR, null, '3.55', 6900, 1840, 12900, 7320],
    [ECODIESEL, null, '3.21', 7200, 1830, 13900, 7960], [ECODIESEL, null, '3.92', 7200, 1830, 15600, 9660],
    [HEMI_1500, STANDARD, '3.21', 7100, 1850, 13900, 8160], [HEMI_1500, STANDARD, '3.92', 7100, 1850, 17000, 11260],
    [HEMI_1500, ETORQUE, '3.21', 7100, 1790, 13900, 8110], [HEMI_1500, ETORQUE, '3.92', 7100, 1790, 17000, 11210],
  ]),
  ...rows({ model: '1500', trimStrict: 'TRX', cab: 'Crew', bed: `5'7"`, drive: '4x4' }, [[TRX, null, '3.55', 7800, 1310, 15160, 8100]]),
];

// 2022 RAM 1500 Classic (DS) Weight and Tow Chart, dated August 9, 2021.
// DS is a separate platform, so it must never share rows with the DT 1500.
const CLASSIC_V6 = '3.6L Pentastar V6';
const CLASSIC_HEMI = '5.7L HEMI V8';
const CLASSIC_ROWS_2022 = [
  ...rows({ model: '1500 Classic', cab: 'Quad', bed: `6'4"`, drive: '4x2' }, [[CLASSIC_V6, null, '3.21', 6800, 1930, 9850, 4610], [CLASSIC_V6, null, '3.55', 6800, 1930, 12900, 7660], [CLASSIC_HEMI, null, '3.21', 6800, 1710, 13800, 8340], [CLASSIC_HEMI, null, '3.92', 6800, 1710, 15975, 10520], [CLASSIC_HEMI, null, '3.21', 6900, 1810, 13800, 8310], [CLASSIC_HEMI, null, '3.92', 6900, 1810, 15975, 10490]]),
  ...rows({ model: '1500 Classic', cab: 'Regular', bed: `6'4"`, drive: '4x2' }, [[CLASSIC_V6, null, '3.21', 6025, 1510, 9850, 4950], [CLASSIC_V6, null, '3.55', 6025, 1510, 12200, 7300], [CLASSIC_HEMI, null, '3.21', 6350, 1610, 13800, 8660], [CLASSIC_HEMI, null, '3.92', 6350, 1610, 14350, 9210]]),
  ...rows({ model: '1500 Classic', cab: 'Regular', bed: `8'`, drive: '4x2' }, [[CLASSIC_V6, null, '3.21', 6600, 1910, 9850, 4720], [CLASSIC_V6, null, '3.55', 6600, 1910, 12400, 7270], [CLASSIC_HEMI, null, '3.21', 6600, 1680, 13800, 8440], [CLASSIC_HEMI, null, '3.92', 6600, 1680, 15975, 10620]]),
  ...rows({ model: '1500 Classic', cab: 'Crew', bed: `6'4"`, drive: '4x2' }, [[CLASSIC_HEMI, null, '3.21', 6800, 1610, 13800, 8240], [CLASSIC_HEMI, null, '3.92', 6800, 1610, 15975, 10420], [CLASSIC_HEMI, null, '3.21', 6900, 1710, 13800, 8210], [CLASSIC_HEMI, null, '3.92', 6900, 1710, 15975, 10390]]),
  ...rows({ model: '1500 Classic', cab: 'Crew', bed: `5'7"`, drive: '4x2' }, [[CLASSIC_V6, null, '3.21', 6800, 1870, 9850, 4540], [CLASSIC_V6, null, '3.55', 6800, 1870, 12900, 7590], [CLASSIC_HEMI, null, '3.21', 6800, 1650, 13800, 8290], [CLASSIC_HEMI, null, '3.92', 6800, 1650, 15975, 10460], [CLASSIC_HEMI, null, '3.21', 6900, 1750, 13800, 8260], [CLASSIC_HEMI, null, '3.92', 6900, 1750, 15975, 10430]]),
  ...rows({ model: '1500 Classic', cab: 'Quad', bed: `6'4"`, drive: '4x4' }, [[CLASSIC_V6, null, '3.21', 6800, 1750, 9850, 4390], [CLASSIC_V6, null, '3.55', 6800, 1750, 12900, 7440], [CLASSIC_HEMI, null, '3.21', 6800, 1520, 13800, 8160], [CLASSIC_HEMI, null, '3.92', 6800, 1520, 15975, 10330], [CLASSIC_HEMI, null, '3.21', 6900, 1620, 13800, 8030], [CLASSIC_HEMI, null, '3.92', 6900, 1620, 15975, 10200]]),
  ...rows({ model: '1500 Classic', cab: 'Regular', bed: `6'4"`, drive: '4x4' }, [[CLASSIC_V6, null, '3.21', 6300, 1580, 9850, 4710], [CLASSIC_V6, null, '3.55', 6300, 1580, 12200, 7060], [CLASSIC_HEMI, null, '3.21', 6350, 1400, 13800, 8450], [CLASSIC_HEMI, null, '3.92', 6350, 1400, 14350, 9000]]),
  ...rows({ model: '1500 Classic', cab: 'Regular', bed: `8'`, drive: '4x4' }, [[CLASSIC_V6, null, '3.21', 6600, 1710, 9850, 4530], [CLASSIC_V6, null, '3.55', 6600, 1710, 12400, 7080], [CLASSIC_HEMI, null, '3.21', 6600, 1490, 13800, 8250], [CLASSIC_HEMI, null, '3.92', 6600, 1490, 15975, 10420]]),
  ...rows({ model: '1500 Classic', cab: 'Crew', bed: `6'4"`, drive: '4x4' }, [[CLASSIC_HEMI, null, '3.21', 6800, 1430, 13800, 8060], [CLASSIC_HEMI, null, '3.92', 6800, 1430, 15850, 10110], [CLASSIC_HEMI, null, '3.21', 6900, 1530, 13800, 8030], [CLASSIC_HEMI, null, '3.92', 6900, 1530, 15850, 10080]]),
  ...rows({ model: '1500 Classic', cab: 'Crew', bed: `5'7"`, drive: '4x4' }, [[CLASSIC_V6, null, '3.21', 6800, 1720, 9850, 4350], [CLASSIC_V6, null, '3.55', 6800, 1720, 12900, 7400], [CLASSIC_HEMI, null, '3.21', 6800, 1460, 13800, 8090], [CLASSIC_HEMI, null, '3.92', 6800, 1460, 15975, 10270], [CLASSIC_HEMI, null, '3.21', 6900, 1560, 13800, 8000], [CLASSIC_HEMI, null, '3.92', 6900, 1560, 15975, 10180]]),
  ...rows({ model: '1500 Classic', trimStrict: 'SSV', cab: 'Crew', bed: `5'7"`, drive: '4x4' }, [[CLASSIC_HEMI, null, '3.21', 6800, 1390, 13800, 8020], [CLASSIC_HEMI, null, '3.92', 6800, 1390, 15975, 10200], [CLASSIC_HEMI, null, '3.21', 6900, 1490, 13800, 8020], [CLASSIC_HEMI, null, '3.92', 6900, 1490, 15975, 10200]]),
];

function hdRows(model, drive, cab, bed, ramBox, values) {
  return rows({ model, drive, cab, bed, rearWheels: model === '2500' ? 'SRW' : undefined, ramBox }, values);
}

const HD_ROWS_2022 = [
  // 2500 4x2 (DJ)
  ...hdRows('2500', '4x2', 'Regular', `8'`, false, [[HEMI_HD, null, '3.73', 10000, 4010, 22000, 15540], [HEMI_HD, null, '4.10', 10000, 4010, 24200, 17740], [HEMI_HD, null, '3.73', 9900, 3910, 22000, 15540], [HEMI_HD, null, '4.10', 9900, 3910, 24200, 17740], [CUMMINS, STANDARD, '3.73', 10000, 3150, 27320, 19990], [CUMMINS, STANDARD, '3.73', 9900, 3050, 27320, 19990]]),
  ...hdRows('2500', '4x2', 'Crew', `6'4"`, true, [[HEMI_HD, null, '3.73', 10000, 3540, 22000, 15070], [HEMI_HD, null, '4.10', 10000, 3540, 24200, 17270], [HEMI_HD, null, '3.73', 9900, 3440, 22000, 15070], [HEMI_HD, null, '4.10', 9900, 3440, 24200, 17270], [CUMMINS, STANDARD, '3.73', 10000, 2660, 27700, 19240], [CUMMINS, STANDARD, '3.73', 9900, 2610, 27700, 18820]]),
  ...hdRows('2500', '4x2', 'Crew', `6'4"`, false, [[HEMI_HD, null, '3.73', 10000, 3660, 22000, 15190], [HEMI_HD, null, '4.10', 10000, 3660, 24200, 17390], [HEMI_HD, null, '3.73', 9900, 3560, 22000, 15190], [HEMI_HD, null, '4.10', 9900, 3560, 24200, 17390], [CUMMINS, STANDARD, '3.73', 10000, 2770, 27700, 20000], [CUMMINS, STANDARD, '3.73', 9900, 2680, 27700, 20000]]),
  ...hdRows('2500', '4x2', 'Crew', `8'`, false, [[HEMI_HD, null, '3.73', 10000, 3530, 22000, 15060], [HEMI_HD, null, '4.10', 10000, 3530, 24200, 17260], [HEMI_HD, null, '3.73', 9900, 3420, 22000, 15050], [HEMI_HD, null, '4.10', 9900, 3420, 24200, 17250], [CUMMINS, STANDARD, '3.73', 10000, 2630, 27840, 20000], [CUMMINS, STANDARD, '3.73', 9900, 2520, 27840, 19990]]),
  // 2500 4x4 (DJ)
  ...hdRows('2500', '4x4', 'Regular', `8'`, false, [[HEMI_HD, null, '3.73', 10000, 3690, 22000, 15220], [HEMI_HD, null, '4.10', 10000, 3690, 24200, 17420], [HEMI_HD, null, '3.73', 9900, 3580, 22000, 15210], [HEMI_HD, null, '4.10', 9900, 3580, 24200, 17410], [CUMMINS, STANDARD, '3.73', 10000, 2810, 27650, 19980], [CUMMINS, STANDARD, '3.73', 9900, 2710, 27650, 19980]]),
  ...hdRows('2500', '4x4', 'Mega', `6'4"`, true, [[HEMI_HD, null, '3.73', 10000, 2810, 22000, 14340], [HEMI_HD, null, '4.10', 10000, 2810, 24200, 16530], [HEMI_HD, null, '3.73', 9900, 2710, 22000, 14340], [HEMI_HD, null, '4.10', 9900, 2710, 24200, 16530], [CUMMINS, STANDARD, '3.73', 10000, 1920, 24240, 14480], [CUMMINS, STANDARD, '3.73', 9900, 1820, 24240, 13480]]),
  ...hdRows('2500', '4x4', 'Mega', `6'4"`, false, [[HEMI_HD, null, '3.73', 10000, 2940, 22000, 14470], [HEMI_HD, null, '4.10', 10000, 2940, 24200, 16660], [HEMI_HD, null, '3.73', 9900, 2840, 22000, 14470], [HEMI_HD, null, '4.10', 9900, 2840, 24200, 16660], [CUMMINS, STANDARD, '3.73', 10000, 2040, 24240, 15620], [CUMMINS, STANDARD, '3.73', 9900, 1940, 24240, 14620]]),
  ...rows({ model: '2500', trimStrict: 'Power Wagon', rearWheels: 'SRW', drive: '4x4', cab: 'Crew', bed: `6'4"`, ramBox: true }, [[HEMI_HD, null, '4.10', 8565, 1520, 18000, 10440]]),
  ...rows({ model: '2500', trimStrict: 'Power Wagon', rearWheels: 'SRW', drive: '4x4', cab: 'Crew', bed: `6'4"`, ramBox: false }, [[HEMI_HD, null, '4.10', 8565, 1630, 18000, 10590]]),
  ...hdRows('2500', '4x4', 'Crew', `8'`, false, [[HEMI_HD, null, '3.73', 10000, 3170, 22000, 14700], [HEMI_HD, null, '4.10', 10000, 3170, 24200, 16900], [HEMI_HD, null, '3.73', 9900, 3080, 22000, 14710], [HEMI_HD, null, '4.10', 9900, 3080, 24200, 16910], [CUMMINS, STANDARD, '3.73', 10000, 2300, 26400, 18230], [CUMMINS, STANDARD, '3.73', 9900, 2200, 26400, 17210]]),
  ...hdRows('2500', '4x4', 'Crew', `6'4"`, true, [[HEMI_HD, null, '3.73', 10000, 3230, 22000, 14760], [HEMI_HD, null, '4.10', 10000, 3230, 24200, 16960], [HEMI_HD, null, '3.73', 9900, 3160, 22000, 14790], [HEMI_HD, null, '4.10', 9900, 3160, 24200, 16990], [CUMMINS, STANDARD, '3.73', 10000, 2360, 27980, 18840], [CUMMINS, STANDARD, '3.73', 9900, 2300, 27980, 18220]]),
  ...hdRows('2500', '4x4', 'Crew', `6'4"`, false, [[HEMI_HD, null, '3.73', 10000, 3360, 22000, 14890], [HEMI_HD, null, '4.10', 10000, 3360, 24200, 17090], [HEMI_HD, null, '3.73', 9900, 3250, 22000, 14880], [HEMI_HD, null, '4.10', 9900, 3250, 24200, 17080], [CUMMINS, STANDARD, '3.73', 10000, 2490, 27980, 19990], [CUMMINS, STANDARD, '3.73', 9900, 2410, 27980, 19340]]),
];

const D2_VALUES = {
  regular: [[HEMI_HD, null, '3.73', 11000, 4590, 22000, 15120], [HEMI_HD, null, '4.10', 11000, 4590, 24200, 17320], [HEMI_HD, null, '3.73', 14000, 7230, 22600, 15360], [HEMI_HD, null, '4.10', 14000, 7230, 25000, 17760], [CUMMINS, STANDARD, '3.73', 14000, 6400, 28300, 20230], [CUMMINS, STANDARD, '4.10', 14000, 6400, 30300, 22230], [CUMMINS, STANDARD, '3.73', 11800, 4510, 28300, 20540], [CUMMINS, STANDARD, '3.73', 13500, 5890, 28300, 20220], [CUMMINS, STANDARD, '4.10', 13500, 5890, 30300, 22220], [CUMMINS, HO, '3.73', 14000, 6120, 41600, 33250], [CUMMINS, HO, '4.10', 14000, 6120, 43000, 34650], [CUMMINS, HO, '3.73', 11800, 4370, 34540, 25970], [CUMMINS, HO, '3.73', 13500, 5620, 41600, 33250], [CUMMINS, HO, '4.10', 13500, 5620, 43000, 34320]],
  megaRamBox: [[HEMI_HD, null, '3.73', 11400, 4280, 22000, 14410], [HEMI_HD, null, '4.10', 11400, 4280, 24200, 16610], [CUMMINS, STANDARD, '3.73', 12300, 4110, 28300, 19640], [CUMMINS, HO, '3.73', 12300, 3970, 32710, 23300]],
  megaStandard: [[HEMI_HD, null, '3.73', 14000, 6630, 22600, 14760], [HEMI_HD, null, '4.10', 14000, 6630, 25000, 17160], [HEMI_HD, null, '3.73', 11400, 4340, 22000, 14470], [HEMI_HD, null, '4.10', 11400, 4340, 24200, 16670], [CUMMINS, STANDARD, '3.73', 12300, 4290, 28300, 19820], [CUMMINS, STANDARD, '3.73', 14000, 5660, 28300, 19490], [CUMMINS, STANDARD, '4.10', 14000, 5660, 30300, 21490], [CUMMINS, STANDARD, '3.73', 13500, 5160, 28300, 19490], [CUMMINS, STANDARD, '4.10', 13500, 5160, 30300, 21490], [CUMMINS, HO, '3.73', 12300, 4130, 32710, 24070], [CUMMINS, HO, '3.73', 14000, 5440, 41600, 32570], [CUMMINS, HO, '4.10', 14000, 5440, 41955, 32930], [CUMMINS, HO, '3.73', 13500, 4940, 41600, 29810], [CUMMINS, HO, '4.10', 13500, 4940, 41955, 29810]],
  crewLong: [[HEMI_HD, null, '3.73', 14000, 6700, 22600, 14830], [HEMI_HD, null, '4.10', 14000, 6700, 25000, 17230], [HEMI_HD, null, '3.73', 11400, 4450, 22000, 14580], [HEMI_HD, null, '4.10', 11400, 4450, 24200, 16780], [CUMMINS, STANDARD, '3.73', 12300, 4490, 28300, 20020], [CUMMINS, STANDARD, '3.73', 14000, 5850, 28300, 19680], [CUMMINS, STANDARD, '4.10', 14000, 5850, 30300, 21680], [CUMMINS, STANDARD, '3.73', 13500, 5350, 28300, 19680], [CUMMINS, STANDARD, '4.10', 13500, 5350, 30300, 21680], [CUMMINS, HO, '3.73', 12300, 4330, 33610, 25120], [CUMMINS, HO, '3.73', 14000, 5580, 41600, 32710], [CUMMINS, HO, '4.10', 14000, 5580, 43000, 34070], [CUMMINS, HO, '3.73', 13500, 5080, 41600, 30720], [CUMMINS, HO, '4.10', 13500, 5080, 43000, 30720]],
  crewRamBox: [[HEMI_HD, null, '3.73', 11000, 4140, 22000, 14670], [HEMI_HD, null, '4.10', 11000, 4140, 24200, 16870], [CUMMINS, STANDARD, '3.73', 11800, 4050, 28300, 20080], [CUMMINS, HO, '3.73', 11800, 3870, 32580, 23000]],
  crewStandard: [[HEMI_HD, null, '3.73', 11000, 4250, 22000, 14780], [HEMI_HD, null, '4.10', 11000, 4250, 24200, 16980], [CUMMINS, STANDARD, '3.73', 11800, 4190, 28300, 20220], [CUMMINS, HO, '3.73', 11800, 4010, 32580, 23600]],
};

HD_ROWS_2022.push(
  ...hdRows('3500', '4x4', 'Regular', `8'`, false, D2_VALUES.regular),
  ...hdRows('3500', '4x4', 'Mega', `6'4"`, true, D2_VALUES.megaRamBox),
  ...hdRows('3500', '4x4', 'Mega', `6'4"`, false, D2_VALUES.megaStandard),
  ...hdRows('3500', '4x4', 'Crew', `8'`, false, D2_VALUES.crewLong),
  ...hdRows('3500', '4x4', 'Crew', `6'4"`, true, D2_VALUES.crewRamBox),
  ...hdRows('3500', '4x4', 'Crew', `6'4"`, false, D2_VALUES.crewStandard),
  ...hdRows('3500', '4x2', 'Regular', `8'`, false, [[HEMI_HD, null, '3.73', 14000, 7680, 22600, 15810], [HEMI_HD, null, '4.10', 14000, 7680, 25000, 18210], [HEMI_HD, null, '3.73', 10700, 4640, 22000, 15470], [HEMI_HD, null, '4.10', 10700, 4640, 24200, 17670], [CUMMINS, STANDARD, '3.73', 11500, 4610, 28300, 20940], [CUMMINS, STANDARD, '3.73', 14000, 6830, 28300, 20660], [CUMMINS, STANDARD, '4.10', 14000, 6830, 30300, 22660], [CUMMINS, STANDARD, '3.73', 13500, 6330, 28300, 20660], [CUMMINS, STANDARD, '4.10', 13500, 6330, 30300, 22660], [CUMMINS, HO, '3.73', 11500, 4490, 34630, 26780], [CUMMINS, HO, '3.73', 14000, 6560, 41600, 33690], [CUMMINS, HO, '4.10', 14000, 6560, 45000, 37090], [CUMMINS, HO, '3.73', 13500, 6060, 41600, 33690], [CUMMINS, HO, '4.10', 13500, 6060, 45000, 35250]]),
  ...hdRows('3500', '4x2', 'Crew', `6'4"`, true, [[HEMI_HD, null, '3.73', 10700, 4150, 22000, 14980], [HEMI_HD, null, '4.10', 10700, 4150, 24200, 17180], [CUMMINS, STANDARD, '3.73', 11500, 4030, 28300, 20360], [CUMMINS, HO, '3.73', 11500, 3940, 32240, 23130]]),
  ...hdRows('3500', '4x2', 'Crew', `6'4"`, false, [[HEMI_HD, null, '3.73', 10700, 4280, 22000, 15110], [HEMI_HD, null, '4.10', 10700, 4280, 24200, 17310], [CUMMINS, STANDARD, '3.73', 11500, 4180, 28300, 20510], [CUMMINS, HO, '3.73', 11500, 4080, 32240, 24100]]),
  ...hdRows('3500', '4x2', 'Crew', `8'`, false, [[HEMI_HD, null, '3.73', 11100, 4510, 22000, 14940], [HEMI_HD, null, '4.10', 11100, 4510, 24200, 17140], [HEMI_HD, null, '3.73', 14000, 7050, 22600, 15180], [HEMI_HD, null, '4.10', 14000, 7050, 25000, 17580], [CUMMINS, STANDARD, '3.73', 12000, 4540, 28300, 20370], [CUMMINS, STANDARD, '3.73', 14000, 6180, 28300, 20010], [CUMMINS, STANDARD, '4.10', 14000, 6180, 30300, 22010], [CUMMINS, STANDARD, '3.73', 13500, 5680, 28300, 20010], [CUMMINS, STANDARD, '4.10', 13500, 5680, 30300, 22010], [CUMMINS, HO, '3.73', 12000, 4440, 33670, 25560], [CUMMINS, HO, '3.73', 14000, 5930, 41600, 33060], [CUMMINS, HO, '4.10', 14000, 5930, 43000, 34460], [CUMMINS, HO, '3.73', 13500, 5430, 41600, 33060], [CUMMINS, HO, '4.10', 13500, 5430, 43000, 33080]]),
);

const TOW_ROWS_2022 = [...LD_ROWS_2022, ...CLASSIC_ROWS_2022, ...HD_ROWS_2022].map(({ maxPayload, ...row }) => row);
const PAYLOAD_ROWS_2022 = [...LD_ROWS_2022, ...CLASSIC_ROWS_2022, ...HD_ROWS_2022].map(({ maxTow, gcwr, axleRatio, ...row }) => row);

module.exports = {
  HD_ROWS_2022,
  LIGHT_DUTY_PAYLOAD_ROWS_2022: PAYLOAD_ROWS_2022.filter((row) => row.model === '1500' || row.model === '1500 Classic'),
  LIGHT_DUTY_TOW_ROWS_2022: TOW_ROWS_2022.filter((row) => row.model === '1500' || row.model === '1500 Classic'),
  HD_PAYLOAD_ROWS_2022: PAYLOAD_ROWS_2022.filter((row) => row.model !== '1500' && row.model !== '1500 Classic'),
  HD_TOW_ROWS_2022: TOW_ROWS_2022.filter((row) => row.model !== '1500' && row.model !== '1500 Classic'),
};
