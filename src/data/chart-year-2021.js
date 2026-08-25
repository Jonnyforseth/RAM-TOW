// 2021 RAM pickup towing charts are published as Body Builder configuration
// tables. Keep every source row tied to its model, drivetrain, cab, box,
// axle, GVWR, and rear-wheel configuration so the matcher never borrows a
// capacity from a different pickup configuration.
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

function hdRows(model, drive, cab, bed, ramBox, values, rearWheels = model === '2500' ? 'SRW' : undefined) {
  return rows({ model, drive, cab, bed, ramBox, rearWheels }, values);
}

const PENTASTAR = '3.6L Pentastar V6 eTorque';
const ECODIESEL = '3.0L EcoDiesel V6';
const HEMI_1500 = '5.7L HEMI V8 eTorque';
const TRX = '6.2L Supercharged HEMI V8';
const CLASSIC_V6 = '3.6L Pentastar V6';
const CLASSIC_HEMI = '5.7L HEMI V8';
const HEMI_HD = '6.4L HEMI V8';
const CUMMINS = '6.7L Cummins HO';
const STANDARD = 'Standard';
const ETORQUE = 'eTorque';
const HO = 'HO';

// 2021 RAM 1500 (DT) Base Weight, GCW and Trailer Tow, dated December 2, 2020.
const LD_ROWS_2021 = [
  ...rows({ model: '1500', trimStrict: 'HFE', cab: 'Quad', bed: `6'4"`, drive: '4x2' }, [
    [PENTASTAR, null, '3.21', 6010, 1240, 11900, 6760],
  ]),
  ...rows({ model: '1500', cab: 'Quad', bed: `6'4"`, drive: '4x2' }, [
    [PENTASTAR, null, '3.55', 7100, 2300, 12900, 7740],
    [ECODIESEL, null, '3.21', 7200, 2060, 13900, 8380], [ECODIESEL, null, '3.92', 7200, 2060, 15600, 10080], [ECODIESEL, null, '3.92', 7200, 2060, 18250, 12560],
    [HEMI_1500, STANDARD, '3.21', 6900, 1930, 13900, 8550], [HEMI_1500, STANDARD, '3.92', 6900, 1930, 17000, 11650],
    [HEMI_1500, ETORQUE, '3.21', 6900, 1840, 13900, 8460], [HEMI_1500, ETORQUE, '3.92', 6900, 1840, 17000, 11560], [HEMI_1500, ETORQUE, '3.92', 6900, 1840, 18350, 12750],
  ]),
  ...rows({ model: '1500', cab: 'Crew', bed: `6'4"`, drive: '4x2' }, [
    [PENTASTAR, null, '3.21', 6900, 2030, 11900, 6540], [PENTASTAR, null, '3.55', 6900, 2030, 12900, 7540],
    [ECODIESEL, null, '3.21', 6990, 1747, 13900, 8290], [ECODIESEL, null, '3.21', 7000, 1799, 13900, 8220], [ECODIESEL, null, '3.92', 7000, 1799, 15600, 9920],
    [HEMI_1500, STANDARD, '3.21', 6900, 1840, 13900, 8350], [HEMI_1500, STANDARD, '3.92', 6900, 1840, 17000, 11450],
    [HEMI_1500, ETORQUE, '3.21', 6900, 1760, 13900, 8270], [HEMI_1500, ETORQUE, '3.92', 6900, 1760, 17000, 11370],
  ]),
  ...rows({ model: '1500', cab: 'Crew', bed: `5'7"`, drive: '4x2' }, [
    [PENTASTAR, null, '3.21', 6900, 2000, 11900, 6600], [PENTASTAR, null, '3.55', 6900, 2000, 12900, 7600],
    [ECODIESEL, null, '3.21', 7000, 1740, 13900, 8250], [ECODIESEL, null, '3.92', 7000, 1740, 15600, 9950],
    [HEMI_1500, STANDARD, '3.21', 6900, 1810, 13900, 8400], [HEMI_1500, STANDARD, '3.92', 6900, 1810, 17000, 11500],
    [HEMI_1500, ETORQUE, '3.21', 6900, 1710, 13900, 8310], [HEMI_1500, ETORQUE, '3.92', 6900, 1710, 17000, 11410],
  ]),
  ...rows({ model: '1500', cab: 'Quad', bed: `6'4"`, drive: '4x4' }, [
    [PENTASTAR, null, '3.21', 6800, 1830, 11900, 6530], [PENTASTAR, null, '3.55', 6800, 1830, 12900, 7530],
    [ECODIESEL, null, '3.21', 7100, 1770, 13900, 8170], [ECODIESEL, null, '3.92', 7100, 1770, 15600, 9870],
    [HEMI_1500, STANDARD, '3.21', 7100, 1940, 13900, 8330], [HEMI_1500, STANDARD, '3.92', 7100, 1940, 17000, 11430],
    [HEMI_1500, ETORQUE, '3.21', 7100, 1820, 13900, 8230], [HEMI_1500, ETORQUE, '3.92', 7100, 1820, 17000, 11330],
  ]),
  ...rows({ model: '1500', cab: 'Crew', bed: `5'7"`, drive: '4x4' }, [
    [PENTASTAR, null, '3.21', 6900, 1838, 11900, 6460], [PENTASTAR, null, '3.55', 6900, 1838, 12900, 7460],
    [ECODIESEL, null, '3.21', 7200, 1770, 13900, 7780], [ECODIESEL, null, '3.92', 7200, 1770, 15600, 9480],
    [HEMI_1500, STANDARD, '3.21', 7100, 1870, 13900, 8220], [HEMI_1500, STANDARD, '3.92', 7100, 1870, 17000, 11320],
    [HEMI_1500, ETORQUE, '3.21', 7100, 1800, 13900, 8100], [HEMI_1500, ETORQUE, '3.92', 7100, 1800, 17000, 11200],
    [TRX, null, '3.55', 7800, 1310, 15160, 8100],
  ]),
  ...rows({ model: '1500', cab: 'Crew', bed: `6'4"`, drive: '4x4' }, [
    [PENTASTAR, null, '3.21', 6900, 1790, 11900, 6290], [PENTASTAR, null, '3.55', 6900, 1790, 12900, 7290],
    [ECODIESEL, null, '3.21', 7200, 1740, 13900, 7910], [ECODIESEL, null, '3.92', 7200, 1740, 15600, 9610],
    [HEMI_1500, STANDARD, '3.21', 7100, 1800, 13900, 8200], [HEMI_1500, STANDARD, '3.92', 7100, 1800, 17000, 11300],
    [HEMI_1500, ETORQUE, '3.21', 7100, 1690, 13900, 7940], [HEMI_1500, ETORQUE, '3.92', 7100, 1690, 17000, 11040],
  ]),
];

// 2021 RAM 1500 Classic (DS) Base Weight GCW Trailer Tow, dated October 28, 2020.
const CLASSIC_ROWS_2021 = [
  ...rows({ model: '1500 Classic', cab: 'Quad', bed: `6'4"`, drive: '4x2' }, [[CLASSIC_V6, null, '3.21', 6800, 1930, 9850, 4610], [CLASSIC_V6, null, '3.55', 6800, 1930, 12900, 7660], [CLASSIC_HEMI, null, '3.21', 6800, 1710, 13800, 8340], [CLASSIC_HEMI, null, '3.92', 6800, 1710, 15975, 10520], [CLASSIC_HEMI, null, '3.21', 6900, 1810, 13800, 8310], [CLASSIC_HEMI, null, '3.92', 6900, 1810, 15975, 10480]]),
  ...rows({ model: '1500 Classic', cab: 'Regular', bed: `6'4"`, drive: '4x2' }, [[CLASSIC_V6, null, '3.21', 6025, 1510, 9850, 4940], [CLASSIC_V6, null, '3.55', 6025, 1510, 12200, 7290], [CLASSIC_HEMI, null, '3.21', 6350, 1610, 13800, 8650], [CLASSIC_HEMI, null, '3.92', 6350, 1610, 14350, 9200]]),
  ...rows({ model: '1500 Classic', cab: 'Regular', bed: `8'`, drive: '4x2' }, [[CLASSIC_V6, null, '3.21', 6600, 1910, 9850, 4720], [CLASSIC_V6, null, '3.55', 6600, 1910, 12400, 7270], [CLASSIC_HEMI, null, '3.21', 6600, 1680, 13800, 8430], [CLASSIC_HEMI, null, '3.92', 6600, 1680, 15975, 10610]]),
  ...rows({ model: '1500 Classic', cab: 'Crew', bed: `6'4"`, drive: '4x2' }, [[CLASSIC_HEMI, null, '3.21', 6800, 1610, 13800, 8240], [CLASSIC_HEMI, null, '3.92', 6800, 1610, 15975, 10420], [CLASSIC_HEMI, null, '3.21', 6900, 1710, 13800, 8210], [CLASSIC_HEMI, null, '3.92', 6900, 1710, 15975, 10380]]),
  ...rows({ model: '1500 Classic', cab: 'Crew', bed: `5'7"`, drive: '4x2' }, [[CLASSIC_V6, null, '3.21', 6800, 1870, 9850, 4530], [CLASSIC_V6, null, '3.55', 6800, 1870, 12900, 7580], [CLASSIC_HEMI, null, '3.21', 6800, 1650, 13800, 8290], [CLASSIC_HEMI, null, '3.92', 6800, 1650, 15975, 10460], [CLASSIC_HEMI, null, '3.21', 6900, 1750, 13800, 8250], [CLASSIC_HEMI, null, '3.92', 6900, 1750, 15975, 10430]]),
  ...rows({ model: '1500 Classic', cab: 'Quad', bed: `6'4"`, drive: '4x4' }, [[CLASSIC_V6, null, '3.21', 6800, 1740, 9850, 4370], [CLASSIC_V6, null, '3.55', 6800, 1740, 12900, 7420], [CLASSIC_HEMI, null, '3.21', 6800, 1520, 13800, 8160], [CLASSIC_HEMI, null, '3.92', 6800, 1520, 15975, 10330], [CLASSIC_HEMI, null, '3.21', 6900, 1620, 13800, 8020], [CLASSIC_HEMI, null, '3.92', 6900, 1620, 15975, 10200]]),
  ...rows({ model: '1500 Classic', cab: 'Regular', bed: `6'4"`, drive: '4x4' }, [[CLASSIC_V6, null, '3.21', 6300, 1580, 9850, 4710], [CLASSIC_V6, null, '3.55', 6300, 1580, 12200, 7060], [CLASSIC_HEMI, null, '3.21', 6350, 1400, 13800, 8450], [CLASSIC_HEMI, null, '3.92', 6350, 1400, 14350, 9000]]),
  ...rows({ model: '1500 Classic', cab: 'Regular', bed: `8'`, drive: '4x4' }, [[CLASSIC_V6, null, '3.21', 6600, 1710, 9850, 4520], [CLASSIC_V6, null, '3.55', 6600, 1710, 12400, 7070], [CLASSIC_HEMI, null, '3.21', 6600, 1490, 13800, 8240], [CLASSIC_HEMI, null, '3.92', 6600, 1490, 15975, 10420]]),
  ...rows({ model: '1500 Classic', cab: 'Crew', bed: `6'4"`, drive: '4x4' }, [[CLASSIC_HEMI, null, '3.21', 6800, 1430, 13800, 8060], [CLASSIC_HEMI, null, '3.92', 6800, 1430, 15850, 10110], [CLASSIC_HEMI, null, '3.21', 6900, 1530, 13800, 8020], [CLASSIC_HEMI, null, '3.92', 6900, 1530, 15850, 10070]]),
  ...rows({ model: '1500 Classic', cab: 'Crew', bed: `5'7"`, drive: '4x4' }, [[CLASSIC_V6, null, '3.21', 6800, 1720, 9850, 4350], [CLASSIC_V6, null, '3.55', 6800, 1720, 12900, 7400], [CLASSIC_HEMI, null, '3.21', 6800, 1460, 13800, 8090], [CLASSIC_HEMI, null, '3.92', 6800, 1460, 15975, 10270], [CLASSIC_HEMI, null, '3.21', 6900, 1560, 13800, 8000], [CLASSIC_HEMI, null, '3.92', 6900, 1560, 15975, 10170]]),
];

// 2021 RAM 2500 (DJ) 6.4L and 6.7L Base Weight GCW Trailer Tow charts.
const HD_ROWS_2021 = [
  // 2500 4x2.
  ...hdRows('2500', '4x2', 'Regular', `8'`, false, [[HEMI_HD, null, '3.73', 10000, 4010, 21500, 15040], [HEMI_HD, null, '4.10', 10000, 4010, 24000, 17540], [HEMI_HD, null, '3.73', 9900, 3910, 21500, 15040], [HEMI_HD, null, '4.10', 9900, 3910, 24000, 17540], [CUMMINS, STANDARD, '3.73', 10000, 3160, 27320, 20000], [CUMMINS, STANDARD, '3.73', 9900, 3060, 27320, 20000]]),
  ...hdRows('2500', '4x2', 'Crew', `6'4"`, true, [[HEMI_HD, null, '3.73', 10000, 3540, 21500, 14570], [HEMI_HD, null, '4.10', 10000, 3540, 24000, 17070], [HEMI_HD, null, '3.73', 9900, 3440, 21500, 14570], [HEMI_HD, null, '4.10', 9900, 3440, 24000, 17070], [CUMMINS, STANDARD, '3.73', 10000, 2670, 27700, 19240], [CUMMINS, STANDARD, '3.73', 9900, 2610, 27700, 18820]]),
  ...hdRows('2500', '4x2', 'Crew', `6'4"`, false, [[HEMI_HD, null, '3.73', 10000, 3660, 21500, 14690], [HEMI_HD, null, '4.10', 10000, 3660, 24000, 17190], [HEMI_HD, null, '3.73', 9900, 3560, 21500, 14690], [HEMI_HD, null, '4.10', 9900, 3560, 24000, 17190], [CUMMINS, STANDARD, '3.73', 10000, 2780, 27700, 20000], [CUMMINS, STANDARD, '3.73', 9900, 2680, 27700, 20000]]),
  ...hdRows('2500', '4x2', 'Crew', `8'`, false, [[HEMI_HD, null, '3.73', 10000, 3530, 21500, 14560], [HEMI_HD, null, '4.10', 10000, 3530, 24000, 17060], [HEMI_HD, null, '3.73', 9900, 3420, 21500, 14550], [HEMI_HD, null, '4.10', 9900, 3420, 24000, 17050], [CUMMINS, STANDARD, '3.73', 10000, 2640, 27840, 20000], [CUMMINS, STANDARD, '3.73', 9900, 2530, 27840, 20000]]),
  // 2500 4x4.
  ...hdRows('2500', '4x4', 'Mega', `6'4"`, true, [[HEMI_HD, null, '3.73', 10000, 2810, 21500, 13840], [HEMI_HD, null, '4.10', 10000, 2810, 24000, 16330], [HEMI_HD, null, '3.73', 9900, 2710, 21500, 13840], [HEMI_HD, null, '4.10', 9900, 2710, 24000, 16330], [CUMMINS, STANDARD, '3.73', 10000, 1930, 24240, 14560], [CUMMINS, STANDARD, '3.73', 9900, 1830, 24240, 13560]]),
  ...hdRows('2500', '4x4', 'Mega', `6'4"`, false, [[HEMI_HD, null, '3.73', 10000, 2940, 21500, 13970], [HEMI_HD, null, '4.10', 10000, 2940, 24000, 16460], [HEMI_HD, null, '3.73', 9900, 2840, 21500, 13970], [HEMI_HD, null, '4.10', 9900, 2840, 24000, 16460], [CUMMINS, STANDARD, '3.73', 10000, 2040, 24240, 15690], [CUMMINS, STANDARD, '3.73', 9900, 1940, 24240, 14690]]),
  ...hdRows('2500', '4x4', 'Regular', `8'`, false, [[HEMI_HD, null, '3.73', 10000, 3690, 21500, 14720], [HEMI_HD, null, '4.10', 10000, 3690, 24000, 17220], [HEMI_HD, null, '3.73', 9900, 3580, 21500, 14710], [HEMI_HD, null, '4.10', 9900, 3580, 24000, 17210], [CUMMINS, STANDARD, '3.73', 10000, 2810, 27650, 19990], [CUMMINS, STANDARD, '3.73', 9900, 2720, 27650, 19990]]),
  ...hdRows('2500', '4x4', 'Crew', `6'4"`, true, [[HEMI_HD, null, '3.73', 10000, 3230, 21500, 14260], [HEMI_HD, null, '4.10', 10000, 3230, 24000, 16760], [HEMI_HD, null, '3.73', 9900, 3160, 21500, 14290], [HEMI_HD, null, '4.10', 9900, 3160, 24000, 16790], [CUMMINS, STANDARD, '3.73', 10000, 2370, 27980, 18920], [CUMMINS, STANDARD, '3.73', 9900, 2300, 27980, 18290]]),
  ...hdRows('2500', '4x4', 'Crew', `6'4"`, false, [[HEMI_HD, null, '3.73', 10000, 3360, 21500, 14390], [HEMI_HD, null, '4.10', 10000, 3360, 24000, 16890], [HEMI_HD, null, '3.73', 9900, 3250, 21500, 14380], [HEMI_HD, null, '4.10', 9900, 3250, 24000, 16880], [CUMMINS, STANDARD, '3.73', 10000, 2500, 27980, 20000], [CUMMINS, STANDARD, '3.73', 9900, 2420, 27980, 19420]]),
  ...rows({ model: '2500', trimStrict: 'Power Wagon', rearWheels: 'SRW', drive: '4x4', cab: 'Crew', bed: `6'4"`, ramBox: true }, [[HEMI_HD, null, '4.10', 8565, 1520, 18000, 10440]]),
  ...rows({ model: '2500', trimStrict: 'Power Wagon', rearWheels: 'SRW', drive: '4x4', cab: 'Crew', bed: `6'4"`, ramBox: false }, [[HEMI_HD, null, '4.10', 8565, 1630, 18000, 10590]]),
  ...hdRows('2500', '4x4', 'Crew', `8'`, false, [[HEMI_HD, null, '3.73', 10000, 3170, 21500, 14200], [HEMI_HD, null, '4.10', 10000, 3170, 24000, 16700], [HEMI_HD, null, '3.73', 9900, 3080, 21500, 14210], [HEMI_HD, null, '4.10', 9900, 3080, 24000, 16710], [CUMMINS, STANDARD, '3.73', 10000, 2310, 26400, 18230], [CUMMINS, STANDARD, '3.73', 9900, 2200, 26400, 17290]]),
];

function add3500(config, values) {
  HD_ROWS_2021.push(...rows({ model: '3500', ...config }, values));
}

// 2021 RAM 3500 (D2) 6.4L, Cummins standard-output, and Cummins HO charts.
// Values remain split by rear wheels even when a sticker has not yet exposed
// that detail, allowing the UI to present a transparent refinement range.
add3500({ drive: '4x2', cab: 'Regular', bed: `8'`, rearWheels: 'DRW' }, [[HEMI_HD, null, '3.73', 14000, 7680, 21500, 14710], [HEMI_HD, null, '4.10', 14000, 7680, 25000, 18210], [CUMMINS, STANDARD, '3.73', 14000, 6840, 28300, 20670], [CUMMINS, STANDARD, '4.10', 14000, 6840, 30300, 22670], [CUMMINS, HO, '3.73', 14000, 6570, 41600, 33700], [CUMMINS, HO, '4.10', 14000, 6570, 45000, 37100]]);
add3500({ drive: '4x2', cab: 'Regular', bed: `8'`, rearWheels: 'SRW' }, [[HEMI_HD, null, '3.73', 10700, 4640, 21500, 14970], [HEMI_HD, null, '4.10', 10700, 4640, 24000, 17470], [CUMMINS, STANDARD, '3.73', 11500, 4610, 28300, 20940], [CUMMINS, HO, '3.73', 11500, 4490, 34630, 26830]]);
add3500({ drive: '4x2', cab: 'Crew', bed: `6'4"`, rearWheels: 'SRW', ramBox: true }, [[HEMI_HD, null, '3.73', 10700, 4160, 21500, 14490], [HEMI_HD, null, '4.10', 10700, 4160, 24000, 16990], [CUMMINS, STANDARD, '3.73', 11500, 4040, 28300, 20370], [CUMMINS, HO, '3.73', 11500, 3950, 32240, 23180]]);
add3500({ drive: '4x2', cab: 'Crew', bed: `6'4"`, rearWheels: 'SRW', ramBox: false }, [[HEMI_HD, null, '3.73', 10700, 4280, 21500, 14610], [HEMI_HD, null, '4.10', 10700, 4280, 24000, 17110], [CUMMINS, STANDARD, '3.73', 11500, 4190, 28300, 20520], [CUMMINS, HO, '3.73', 11500, 4090, 32240, 24150]]);
add3500({ drive: '4x2', cab: 'Crew', bed: `8'`, rearWheels: 'SRW' }, [[HEMI_HD, null, '3.73', 11100, 4510, 21500, 14440], [HEMI_HD, null, '4.10', 11100, 4510, 24000, 16940], [CUMMINS, STANDARD, '3.73', 12000, 4540, 28300, 20370], [CUMMINS, HO, '3.73', 12000, 4450, 33670, 25560]]);
add3500({ drive: '4x2', cab: 'Crew', bed: `8'`, rearWheels: 'DRW' }, [[HEMI_HD, null, '3.73', 14000, 7050, 21500, 14080], [HEMI_HD, null, '4.10', 14000, 7050, 25000, 17580], [CUMMINS, STANDARD, '3.73', 14000, 6190, 28300, 20020], [CUMMINS, STANDARD, '4.10', 14000, 6190, 30300, 22020], [CUMMINS, HO, '3.73', 14000, 5940, 41600, 33070], [CUMMINS, HO, '4.10', 14000, 5940, 43000, 34470]]);
add3500({ drive: '4x4', cab: 'Mega', bed: `6'4"`, rearWheels: 'SRW', ramBox: true }, [[HEMI_HD, null, '3.73', 11400, 4280, 21500, 13910], [HEMI_HD, null, '4.10', 11400, 4280, 24000, 16410], [CUMMINS, STANDARD, '3.73', 12300, 4120, 28300, 19650], [CUMMINS, HO, '3.73', 12300, 3980, 32710, 23300]]);
add3500({ drive: '4x4', cab: 'Mega', bed: `6'4"`, rearWheels: 'SRW', ramBox: false }, [[HEMI_HD, null, '3.73', 11400, 4340, 21500, 13970], [HEMI_HD, null, '4.10', 11400, 4340, 24000, 16470], [CUMMINS, STANDARD, '3.73', 12300, 4300, 28300, 19830], [CUMMINS, HO, '3.73', 12300, 4140, 32710, 24080]]);
add3500({ drive: '4x4', cab: 'Mega', bed: `6'4"`, rearWheels: 'DRW', ramBox: false }, [[HEMI_HD, null, '3.73', 14000, 6630, 21500, 13660], [HEMI_HD, null, '4.10', 14000, 6630, 25000, 17160], [CUMMINS, STANDARD, '3.73', 14000, 5670, 28300, 19500], [CUMMINS, STANDARD, '4.10', 14000, 5670, 30300, 21500], [CUMMINS, HO, '3.73', 14000, 5450, 41600, 32580], [CUMMINS, HO, '4.10', 14000, 5450, 43000, 33200]]);
add3500({ drive: '4x4', cab: 'Regular', bed: `8'`, rearWheels: 'SRW' }, [[HEMI_HD, null, '3.73', 11000, 4590, 21500, 14620], [HEMI_HD, null, '4.10', 11000, 4590, 24000, 17120], [CUMMINS, STANDARD, '3.73', 11800, 4520, 28300, 20550], [CUMMINS, HO, '3.73', 11800, 4370, 34540, 26020]]);
add3500({ drive: '4x4', cab: 'Regular', bed: `8'`, rearWheels: 'DRW' }, [[HEMI_HD, null, '3.73', 14000, 7230, 21500, 14260], [HEMI_HD, null, '4.10', 14000, 7230, 25000, 17760], [CUMMINS, STANDARD, '3.73', 14000, 6400, 28300, 20230], [CUMMINS, STANDARD, '4.10', 14000, 6400, 30300, 22230], [CUMMINS, HO, '3.73', 14000, 6130, 41600, 33260], [CUMMINS, HO, '4.10', 14000, 6130, 43000, 34660]]);
add3500({ drive: '4x4', cab: 'Crew', bed: `6'4"`, rearWheels: 'SRW', ramBox: true }, [[HEMI_HD, null, '3.73', 11000, 4140, 21500, 14170], [HEMI_HD, null, '4.10', 11000, 4140, 24000, 16670], [CUMMINS, STANDARD, '3.73', 11800, 4060, 28300, 20090], [CUMMINS, HO, '3.73', 11800, 3880, 32580, 23000]]);
add3500({ drive: '4x4', cab: 'Crew', bed: `6'4"`, rearWheels: 'SRW', ramBox: false }, [[HEMI_HD, null, '3.73', 11000, 4250, 21500, 14280], [HEMI_HD, null, '4.10', 11000, 4250, 24000, 16780], [CUMMINS, STANDARD, '3.73', 11800, 4200, 28300, 20230], [CUMMINS, HO, '3.73', 11800, 4020, 32580, 23650]]);
add3500({ drive: '4x4', cab: 'Crew', bed: `8'`, rearWheels: 'SRW' }, [[HEMI_HD, null, '3.73', 11400, 4450, 21500, 14080], [HEMI_HD, null, '4.10', 11400, 4450, 24000, 16580], [CUMMINS, STANDARD, '3.73', 12300, 4500, 28300, 20030], [CUMMINS, HO, '3.73', 12300, 4330, 33610, 25120]]);
add3500({ drive: '4x4', cab: 'Crew', bed: `8'`, rearWheels: 'DRW' }, [[HEMI_HD, null, '3.73', 14000, 6700, 21500, 13730], [HEMI_HD, null, '4.10', 14000, 6700, 25000, 17230], [CUMMINS, STANDARD, '3.73', 14000, 5860, 28300, 19690], [CUMMINS, STANDARD, '4.10', 14000, 5860, 30300, 21690], [CUMMINS, HO, '3.73', 14000, 5590, 41600, 32720], [CUMMINS, HO, '4.10', 14000, 5590, 43000, 34120]]);

const TOW_ROWS_2021 = [...LD_ROWS_2021, ...CLASSIC_ROWS_2021, ...HD_ROWS_2021].map(({ maxPayload, ...row }) => row);
const PAYLOAD_ROWS_2021 = [...LD_ROWS_2021, ...CLASSIC_ROWS_2021, ...HD_ROWS_2021].map(({ maxTow, gcwr, axleRatio, ...row }) => row);

module.exports = {
  HD_ROWS_2021,
  LIGHT_DUTY_PAYLOAD_ROWS_2021: PAYLOAD_ROWS_2021.filter((row) => row.model === '1500' || row.model === '1500 Classic'),
  LIGHT_DUTY_TOW_ROWS_2021: TOW_ROWS_2021.filter((row) => row.model === '1500' || row.model === '1500 Classic'),
  HD_PAYLOAD_ROWS_2021: PAYLOAD_ROWS_2021.filter((row) => row.model !== '1500' && row.model !== '1500 Classic'),
  HD_TOW_ROWS_2021: TOW_ROWS_2021.filter((row) => row.model !== '1500' && row.model !== '1500 Classic'),
};
