// 2020 RAM pickup charts are separate DT, DS, DJ, and D2 Body Builder tables.
// Keep every source row tied to the exact pickup setup so ranges are shown only
// when a VIN/sticker genuinely leaves an axle, GVWR, or rear-wheel choice open.
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
const CLASSIC_V6 = '3.6L Pentastar V6';
const CLASSIC_HEMI = '5.7L HEMI V8';
const HEMI_HD = '6.4L HEMI V8';
const CUMMINS = '6.7L Cummins HO';
const STANDARD = 'Standard';
const ETORQUE = 'eTorque';
const HO = 'HO';

// 2020 RAM 1500 (DT) Base Weight GCW and Trailer Tow, dated November 15, 2019.
const LD_ROWS_2020 = [
  ...rows({ model: '1500', cab: 'Quad', bed: `6'4"`, drive: '4x2' }, [
    [PENTASTAR, null, '3.55', 7100, 2300, 12900, 7710],
    [ECODIESEL, null, '3.21', 7200, 2040, 13900, 8370], [ECODIESEL, null, '3.92', 7200, 2040, 15600, 10070], [ECODIESEL, null, '3.92', 7200, 2040, 18200, 12560],
    [HEMI_1500, STANDARD, '3.21', 6900, 1900, 13900, 8520], [HEMI_1500, STANDARD, '3.92', 6900, 1900, 17000, 11620],
    [HEMI_1500, ETORQUE, '3.21', 6900, 1820, 13900, 8440], [HEMI_1500, ETORQUE, '3.92', 6900, 1820, 17000, 11540], [HEMI_1500, ETORQUE, '3.92', 6900, 1820, 18350, 12750],
  ]),
  ...rows({ model: '1500', cab: 'Crew', bed: `5'7"`, drive: '4x2' }, [
    [PENTASTAR, null, '3.21', 6900, 1960, 11900, 6580], [PENTASTAR, null, '3.55', 6900, 1960, 12900, 7580],
    [ECODIESEL, null, '3.21', 7000, 1740, 13900, 8250], [ECODIESEL, null, '3.92', 7000, 1740, 15600, 9950],
    [HEMI_1500, STANDARD, '3.21', 6900, 1760, 13900, 8380], [HEMI_1500, STANDARD, '3.92', 6900, 1760, 17000, 11480],
    [HEMI_1500, ETORQUE, '3.21', 6900, 1680, 13900, 8290], [HEMI_1500, ETORQUE, '3.92', 6900, 1680, 17000, 11390],
  ]),
  ...rows({ model: '1500', cab: 'Crew', bed: `6'4"`, drive: '4x2' }, [
    [PENTASTAR, null, '3.21', 6900, 2000, 11900, 6620], [PENTASTAR, null, '3.55', 6900, 2000, 12900, 7620],
    [ECODIESEL, null, '3.21', 7000, 1780, 13900, 8210], [ECODIESEL, null, '3.92', 7000, 1780, 15600, 9910],
    [HEMI_1500, STANDARD, '3.21', 6900, 1800, 13900, 8430], [HEMI_1500, STANDARD, '3.92', 6900, 1800, 17000, 11530],
    [HEMI_1500, ETORQUE, '3.21', 6900, 1720, 13900, 8290], [HEMI_1500, ETORQUE, '3.92', 6900, 1720, 17000, 11390],
  ]),
  ...rows({ model: '1500', cab: 'Quad', bed: `6'4"`, drive: '4x4' }, [
    [PENTASTAR, null, '3.21', 6800, 1810, 11900, 6460], [PENTASTAR, null, '3.55', 6800, 1810, 12900, 7460],
    [ECODIESEL, null, '3.21', 7100, 1750, 13900, 8160], [ECODIESEL, null, '3.92', 7100, 1750, 15600, 9860],
    [HEMI_1500, STANDARD, '3.21', 7100, 1900, 13900, 8310], [HEMI_1500, STANDARD, '3.92', 7100, 1900, 17000, 11410],
    [HEMI_1500, ETORQUE, '3.21', 7100, 1820, 13900, 8220], [HEMI_1500, ETORQUE, '3.92', 7100, 1820, 17000, 11320],
  ]),
  ...rows({ model: '1500', cab: 'Crew', bed: `5'7"`, drive: '4x4' }, [
    [PENTASTAR, null, '3.21', 6900, 1770, 11900, 6390], [PENTASTAR, null, '3.55', 6900, 1770, 12900, 7390],
    [ECODIESEL, null, '3.21', 7200, 1750, 13900, 7850], [ECODIESEL, null, '3.92', 7200, 1750, 15600, 9550],
    [HEMI_1500, STANDARD, '3.21', 7100, 1780, 13900, 8190], [HEMI_1500, STANDARD, '3.92', 7100, 1780, 17000, 11290],
    [HEMI_1500, ETORQUE, '3.21', 7100, 1680, 13900, 7980], [HEMI_1500, ETORQUE, '3.92', 7100, 1680, 17000, 11080],
  ]),
  ...rows({ model: '1500', cab: 'Crew', bed: `6'4"`, drive: '4x4' }, [
    [PENTASTAR, null, '3.21', 6900, 1810, 11900, 6410], [PENTASTAR, null, '3.55', 6900, 1810, 12900, 7410],
    [ECODIESEL, null, '3.21', 7200, 1800, 13900, 8010], [ECODIESEL, null, '3.92', 7200, 1800, 15600, 9710],
    [HEMI_1500, STANDARD, '3.21', 7100, 1830, 13900, 8180], [HEMI_1500, STANDARD, '3.92', 7100, 1830, 17000, 11280],
    [HEMI_1500, ETORQUE, '3.21', 7100, 1760, 13900, 8120], [HEMI_1500, ETORQUE, '3.92', 7100, 1760, 17000, 11220],
  ]),
];

// 2020 RAM 1500 Classic (DS) Base Weight GCW and Trailer Tow, dated November 15, 2019.
const CLASSIC_ROWS_2020 = [
  ...rows({ model: '1500 Classic', cab: 'Quad', bed: `6'4"`, drive: '4x2' }, [[CLASSIC_V6, null, '3.21', 6800, 1920, 9850, 4530], [CLASSIC_V6, null, '3.55', 6800, 1920, 12900, 7580], [CLASSIC_HEMI, null, '3.21', 6800, 1700, 13800, 8340], [CLASSIC_HEMI, null, '3.92', 6800, 1700, 15975, 10510], [CLASSIC_HEMI, null, '3.21', 6900, 1800, 13800, 8310], [CLASSIC_HEMI, null, '3.92', 6900, 1800, 15975, 10480]]),
  ...rows({ model: '1500 Classic', cab: 'Regular', bed: `6'4"`, drive: '4x2' }, [[CLASSIC_V6, null, '3.21', 6025, 1500, 9850, 4960], [CLASSIC_V6, null, '3.55', 6025, 1500, 12200, 7310], [CLASSIC_HEMI, null, '3.21', 6350, 1610, 13800, 8690], [CLASSIC_HEMI, null, '3.92', 6350, 1610, 14350, 9240]]),
  ...rows({ model: '1500 Classic', cab: 'Regular', bed: `8'`, drive: '4x2' }, [[CLASSIC_V6, null, '3.21', 6600, 1900, 9850, 4750], [CLASSIC_V6, null, '3.55', 6600, 1900, 12400, 7300], [CLASSIC_HEMI, null, '3.21', 6600, 1680, 13800, 8510], [CLASSIC_HEMI, null, '3.92', 6600, 1680, 15975, 10680]]),
  ...rows({ model: '1500 Classic', cab: 'Crew', bed: `6'4"`, drive: '4x2' }, [[CLASSIC_HEMI, null, '3.21', 6800, 1600, 13800, 8240], [CLASSIC_HEMI, null, '3.92', 6800, 1600, 15975, 10410], [CLASSIC_HEMI, null, '3.21', 6900, 1700, 13800, 8200], [CLASSIC_HEMI, null, '3.92', 6900, 1700, 15975, 10370]]),
  ...rows({ model: '1500 Classic', cab: 'Crew', bed: `5'7"`, drive: '4x2' }, [[CLASSIC_V6, null, '3.21', 6800, 1870, 9850, 4470], [CLASSIC_V6, null, '3.55', 6800, 1870, 12900, 7520], [CLASSIC_HEMI, null, '3.21', 6800, 1650, 13800, 8280], [CLASSIC_HEMI, null, '3.92', 6800, 1650, 15975, 10460], [CLASSIC_HEMI, null, '3.21', 6900, 1750, 13800, 8240], [CLASSIC_HEMI, null, '3.92', 6900, 1750, 15975, 10410]]),
  ...rows({ model: '1500 Classic', cab: 'Quad', bed: `6'4"`, drive: '4x4' }, [[CLASSIC_V6, null, '3.21', 6800, 1740, 9850, 4350], [CLASSIC_V6, null, '3.55', 6800, 1740, 12900, 7400], [CLASSIC_HEMI, null, '3.21', 6800, 1520, 13800, 8150], [CLASSIC_HEMI, null, '3.92', 6800, 1520, 15975, 10330], [CLASSIC_HEMI, null, '3.21', 6900, 1620, 13800, 8100], [CLASSIC_HEMI, null, '3.92', 6900, 1620, 15975, 10280]]),
  ...rows({ model: '1500 Classic', cab: 'Regular', bed: `6'4"`, drive: '4x4' }, [[CLASSIC_V6, null, '3.21', 6300, 1580, 9850, 4740], [CLASSIC_V6, null, '3.55', 6300, 1580, 12200, 7090], [CLASSIC_HEMI, null, '3.21', 6350, 1400, 13800, 8480], [CLASSIC_HEMI, null, '3.92', 6350, 1400, 14350, 9030]]),
  ...rows({ model: '1500 Classic', cab: 'Regular', bed: `8'`, drive: '4x4' }, [[CLASSIC_V6, null, '3.21', 6600, 1710, 9850, 4550], [CLASSIC_V6, null, '3.55', 6600, 1710, 12400, 7100], [CLASSIC_HEMI, null, '3.21', 6600, 1490, 13800, 8280], [CLASSIC_HEMI, null, '3.92', 6600, 1490, 15975, 10450]]),
  ...rows({ model: '1500 Classic', cab: 'Crew', bed: `6'4"`, drive: '4x4' }, [[CLASSIC_HEMI, null, '3.21', 6800, 1430, 13800, 8060], [CLASSIC_HEMI, null, '3.92', 6800, 1430, 15850, 10110], [CLASSIC_HEMI, null, '3.21', 6900, 1530, 13800, 8020], [CLASSIC_HEMI, null, '3.92', 6900, 1530, 15850, 10070]]),
  ...rows({ model: '1500 Classic', cab: 'Crew', bed: `5'7"`, drive: '4x4' }, [[CLASSIC_V6, null, '3.21', 6800, 1710, 9850, 4350], [CLASSIC_V6, null, '3.55', 6800, 1710, 12900, 7400], [CLASSIC_HEMI, null, '3.21', 6800, 1460, 13800, 8090], [CLASSIC_HEMI, null, '3.92', 6800, 1460, 15975, 10270], [CLASSIC_HEMI, null, '3.21', 6900, 1560, 13800, 8080], [CLASSIC_HEMI, null, '3.92', 6900, 1560, 15975, 10260]]),
];

// 2020 RAM 2500 (DJ) Base Weight GCW and Trailer Tow, dated December 3, 2019.
const HD_ROWS_2020 = [
  ...hdRows('2500', '4x2', 'Regular', `8'`, false, [[HEMI_HD, null, '3.73', 10000, 4010, 21500, 15040], [HEMI_HD, null, '4.10', 10000, 4010, 24000, 17540], [CUMMINS, STANDARD, '3.73', 10000, 3160, 27000, 19680], [HEMI_HD, null, '3.73', 9900, 3950, 21500, 15080], [HEMI_HD, null, '4.10', 9900, 3950, 24000, 17580], [CUMMINS, STANDARD, '3.73', 9900, 3060, 27000, 19680]]),
  ...hdRows('2500', '4x2', 'Crew', `6'4"`, false, [[HEMI_HD, null, '3.73', 10000, 3660, 21500, 14690], [HEMI_HD, null, '4.10', 10000, 3660, 24000, 17190], [CUMMINS, STANDARD, '3.73', 10000, 2770, 27000, 19310], [HEMI_HD, null, '3.73', 9900, 3560, 21500, 14690], [HEMI_HD, null, '4.10', 9900, 3560, 24000, 17190], [CUMMINS, STANDARD, '3.73', 9900, 2680, 27000, 19310]]),
  ...hdRows('2500', '4x2', 'Crew', `6'4"`, true, [[HEMI_HD, null, '3.73', 10000, 3540, 21500, 14570], [HEMI_HD, null, '4.10', 10000, 3540, 24000, 17070], [CUMMINS, STANDARD, '3.73', 10000, 2660, 27000, 19180], [HEMI_HD, null, '3.73', 9900, 3440, 21500, 14570], [HEMI_HD, null, '4.10', 9900, 3440, 24000, 17070], [CUMMINS, STANDARD, '3.73', 9900, 2610, 27000, 18820]]),
  ...hdRows('2500', '4x2', 'Crew', `8'`, false, [[HEMI_HD, null, '3.73', 10000, 3520, 21500, 14550], [HEMI_HD, null, '4.10', 10000, 3520, 24000, 17050], [CUMMINS, STANDARD, '3.73', 10000, 2630, 27000, 19150], [HEMI_HD, null, '3.73', 9900, 3420, 21500, 14550], [HEMI_HD, null, '4.10', 9900, 3420, 24000, 17050], [CUMMINS, STANDARD, '3.73', 9900, 2530, 27000, 19150]]),
  ...hdRows('2500', '4x4', 'Mega', `6'4"`, false, [[HEMI_HD, null, '3.73', 10000, 2940, 21500, 13970], [HEMI_HD, null, '4.10', 10000, 2940, 24000, 16460], [CUMMINS, STANDARD, '3.73', 10000, 2040, 25265, 15690], [HEMI_HD, null, '3.73', 9900, 2840, 21500, 13970], [HEMI_HD, null, '4.10', 9900, 2840, 24000, 16460], [CUMMINS, STANDARD, '3.73', 9900, 1940, 25265, 14690]]),
  ...hdRows('2500', '4x4', 'Mega', `6'4"`, true, [[HEMI_HD, null, '3.73', 10000, 2790, 21500, 13820], [HEMI_HD, null, '4.10', 10000, 2790, 24000, 16320], [CUMMINS, STANDARD, '3.73', 10000, 1930, 25265, 14550], [HEMI_HD, null, '3.73', 9900, 2690, 21500, 13820], [HEMI_HD, null, '4.10', 9900, 2690, 24000, 16320], [CUMMINS, STANDARD, '3.73', 9900, 1830, 25265, 13550]]),
  ...hdRows('2500', '4x4', 'Regular', `8'`, false, [[HEMI_HD, null, '3.73', 10000, 3690, 21500, 14720], [HEMI_HD, null, '4.10', 10000, 3690, 24000, 17220], [CUMMINS, STANDARD, '3.73', 10000, 2810, 27000, 19330], [HEMI_HD, null, '3.73', 9900, 3580, 21500, 14710], [HEMI_HD, null, '4.10', 9900, 3580, 24000, 17210], [CUMMINS, STANDARD, '3.73', 9900, 2710, 27000, 19330]]),
  ...hdRows('2500', '4x4', 'Crew', `6'4"`, false, [[HEMI_HD, null, '3.73', 10000, 3350, 21500, 14380], [HEMI_HD, null, '4.10', 10000, 3350, 24000, 16880], [CUMMINS, STANDARD, '3.73', 10000, 2490, 27000, 19020], [HEMI_HD, null, '3.73', 9900, 3240, 21500, 14370], [HEMI_HD, null, '4.10', 9900, 3240, 24000, 16870], [CUMMINS, STANDARD, '3.73', 9900, 2380, 27000, 19010]]),
  ...hdRows('2500', '4x4', 'Crew', `6'4"`, true, [[HEMI_HD, null, '3.73', 10000, 3220, 21500, 14250], [HEMI_HD, null, '4.10', 10000, 3220, 24000, 16750], [CUMMINS, STANDARD, '3.73', 10000, 2350, 27000, 18790], [HEMI_HD, null, '3.73', 9900, 3150, 21500, 14280], [HEMI_HD, null, '4.10', 9900, 3150, 24000, 16780], [CUMMINS, STANDARD, '3.73', 9900, 2260, 27000, 17890]]),
  ...rows({ model: '2500', trimStrict: 'Power Wagon', rearWheels: 'SRW', drive: '4x4', cab: 'Crew', bed: `6'4"`, ramBox: true }, [[HEMI_HD, null, '4.10', 8565, 1620, 18000, 10580]]),
  ...rows({ model: '2500', trimStrict: 'Power Wagon', rearWheels: 'SRW', drive: '4x4', cab: 'Crew', bed: `6'4"`, ramBox: false }, [[HEMI_HD, null, '4.10', 8565, 1500, 18000, 10290]]),
  ...hdRows('2500', '4x4', 'Crew', `8'`, false, [[HEMI_HD, null, '3.73', 10000, 3160, 21500, 14190], [HEMI_HD, null, '4.10', 10000, 3160, 24000, 16690], [CUMMINS, STANDARD, '3.73', 10000, 2300, 25525, 17350], [HEMI_HD, null, '3.73', 9900, 3070, 21500, 14200], [HEMI_HD, null, '4.10', 9900, 3070, 24000, 16700], [CUMMINS, STANDARD, '3.73', 9900, 2190, 25525, 17170]]),
];

function add3500(config, values) {
  HD_ROWS_2020.push(...rows({ model: '3500', ...config }, values));
}

// 2020 RAM 3500 (D2) Base Weight GCW and Trailer Tow, dated December 3, 2019.
add3500({ drive: '4x2', cab: 'Regular', bed: `8'`, rearWheels: 'DRW' }, [[HEMI_HD, null, '3.73', 14000, 7680, 21500, 14710], [HEMI_HD, null, '4.10', 14000, 7680, 25000, 18210], [CUMMINS, STANDARD, '3.73', 14000, 6840, 28300, 20670], [CUMMINS, STANDARD, '4.10', 14000, 6840, 30300, 22670], [CUMMINS, HO, '3.73', 14000, 6570, 41600, 33700], [CUMMINS, HO, '4.10', 14000, 6570, 43000, 35100]]);
add3500({ drive: '4x2', cab: 'Regular', bed: `8'`, rearWheels: 'SRW' }, [[HEMI_HD, null, '3.73', 10700, 4640, 21500, 14970], [HEMI_HD, null, '4.10', 10700, 4640, 24000, 17470], [CUMMINS, STANDARD, '3.73', 11500, 4680, 28300, 21010], [CUMMINS, HO, '3.73', 11500, 4500, 34630, 26860]]);
add3500({ drive: '4x2', cab: 'Crew', bed: `6'4"`, rearWheels: 'SRW', ramBox: false }, [[HEMI_HD, null, '3.73', 10700, 4110, 21500, 14440], [HEMI_HD, null, '4.10', 10700, 4110, 24000, 16940], [CUMMINS, STANDARD, '3.73', 11500, 4240, 28300, 20570], [CUMMINS, HO, '3.73', 11500, 4100, 32240, 24180]]);
add3500({ drive: '4x2', cab: 'Crew', bed: `6'4"`, rearWheels: 'SRW', ramBox: true }, [[HEMI_HD, null, '3.73', 10700, 3970, 21500, 14300], [HEMI_HD, null, '4.10', 10700, 3970, 24000, 16800], [CUMMINS, STANDARD, '3.73', 11500, 4090, 28300, 20420], [CUMMINS, HO, '3.73', 11500, 3950, 32240, 23210]]);
add3500({ drive: '4x2', cab: 'Crew', bed: `8'`, rearWheels: 'SRW' }, [[HEMI_HD, null, '3.73', 11100, 4520, 21500, 14450], [HEMI_HD, null, '4.10', 11100, 4520, 24000, 16950], [CUMMINS, STANDARD, '3.73', 12000, 4600, 28300, 20430], [CUMMINS, HO, '3.73', 12000, 4450, 33670, 25580]]);
add3500({ drive: '4x2', cab: 'Crew', bed: `8'`, rearWheels: 'DRW' }, [[HEMI_HD, null, '3.73', 14000, 7050, 21500, 14080], [HEMI_HD, null, '4.10', 14000, 7050, 25000, 17580], [CUMMINS, STANDARD, '3.73', 14000, 6180, 28300, 20010], [CUMMINS, STANDARD, '4.10', 14000, 6180, 30300, 22010], [CUMMINS, HO, '3.73', 14000, 5950, 41600, 33080], [CUMMINS, HO, '4.10', 14000, 5950, 43000, 34480]]);
add3500({ drive: '4x4', cab: 'Mega', bed: `6'4"`, rearWheels: 'DRW', ramBox: false }, [[HEMI_HD, null, '3.73', 14000, 6630, 21500, 13660], [HEMI_HD, null, '4.10', 14000, 6630, 25000, 17160], [CUMMINS, STANDARD, '3.73', 14000, 5670, 28300, 19500], [CUMMINS, STANDARD, '4.10', 14000, 5670, 30300, 21500], [CUMMINS, HO, '3.73', 14000, 5400, 41600, 32530], [CUMMINS, HO, '4.10', 14000, 5400, 43000, 32880]]);
add3500({ drive: '4x4', cab: 'Mega', bed: `6'4"`, rearWheels: 'SRW', ramBox: false }, [[HEMI_HD, null, '3.73', 11400, 4340, 21500, 13970], [HEMI_HD, null, '4.10', 11400, 4340, 24000, 16470], [CUMMINS, STANDARD, '3.73', 12300, 4290, 28300, 19820], [CUMMINS, HO, '3.73', 12300, 4150, 32710, 24090]]);
add3500({ drive: '4x4', cab: 'Mega', bed: `6'4"`, rearWheels: 'SRW', ramBox: true }, [[HEMI_HD, null, '3.73', 11400, 4280, 21500, 13910], [HEMI_HD, null, '4.10', 11400, 4280, 24000, 16410], [CUMMINS, STANDARD, '3.73', 12300, 4120, 28300, 19650], [CUMMINS, HO, '3.73', 12300, 3990, 32710, 23320]]);
add3500({ drive: '4x4', cab: 'Regular', bed: `8'`, rearWheels: 'SRW' }, [[HEMI_HD, null, '3.73', 11000, 4600, 21500, 14630], [HEMI_HD, null, '4.10', 11000, 4600, 24000, 17130], [CUMMINS, STANDARD, '3.73', 11800, 4550, 28300, 20580], [CUMMINS, HO, '3.73', 11800, 4380, 34540, 26050]]);
add3500({ drive: '4x4', cab: 'Regular', bed: `8'`, rearWheels: 'DRW' }, [[HEMI_HD, null, '3.73', 14000, 7260, 21500, 14290], [HEMI_HD, null, '4.10', 14000, 7260, 25000, 17790], [CUMMINS, STANDARD, '3.73', 14000, 6400, 28300, 20230], [CUMMINS, STANDARD, '4.10', 14000, 6400, 30300, 22230], [CUMMINS, HO, '3.73', 14000, 6130, 41600, 33260], [CUMMINS, HO, '4.10', 14000, 6130, 43000, 34660]]);
add3500({ drive: '4x4', cab: 'Crew', bed: `6'4"`, rearWheels: 'SRW', ramBox: false }, [[HEMI_HD, null, '3.73', 11000, 4240, 21500, 14270], [HEMI_HD, null, '4.10', 11000, 4240, 24000, 16770], [CUMMINS, STANDARD, '3.73', 11800, 4190, 28300, 20220], [CUMMINS, HO, '3.73', 11800, 4020, 32580, 23660]]);
add3500({ drive: '4x4', cab: 'Crew', bed: `6'4"`, rearWheels: 'SRW', ramBox: true }, [[HEMI_HD, null, '3.73', 11000, 4140, 21500, 14170], [HEMI_HD, null, '4.10', 11000, 4140, 24000, 16670], [CUMMINS, STANDARD, '3.73', 11800, 4050, 28300, 20080], [CUMMINS, HO, '3.73', 11800, 3880, 32580, 23000]]);
add3500({ drive: '4x4', cab: 'Crew', bed: `8'`, rearWheels: 'DRW' }, [[HEMI_HD, null, '3.73', 14000, 6700, 21500, 13730], [HEMI_HD, null, '4.10', 14000, 6700, 25000, 17230], [CUMMINS, STANDARD, '3.73', 14000, 5850, 28300, 19680], [CUMMINS, STANDARD, '4.10', 14000, 5850, 30300, 21680], [CUMMINS, HO, '3.73', 14000, 5590, 41600, 32720], [CUMMINS, HO, '4.10', 14000, 5590, 43000, 34110]]);
add3500({ drive: '4x4', cab: 'Crew', bed: `8'`, rearWheels: 'SRW' }, [[HEMI_HD, null, '3.73', 11400, 4440, 21500, 14070], [HEMI_HD, null, '4.10', 11400, 4440, 24000, 16570], [CUMMINS, STANDARD, '3.73', 12300, 4490, 28300, 20020], [CUMMINS, HO, '3.73', 12300, 4320, 33610, 25090]]);

const TOW_ROWS_2020 = [...LD_ROWS_2020, ...CLASSIC_ROWS_2020, ...HD_ROWS_2020].map(({ maxPayload, ...row }) => row);
const PAYLOAD_ROWS_2020 = [...LD_ROWS_2020, ...CLASSIC_ROWS_2020, ...HD_ROWS_2020].map(({ maxTow, gcwr, axleRatio, ...row }) => row);

module.exports = {
  HD_ROWS_2020,
  LIGHT_DUTY_PAYLOAD_ROWS_2020: PAYLOAD_ROWS_2020.filter((row) => row.model === '1500' || row.model === '1500 Classic'),
  LIGHT_DUTY_TOW_ROWS_2020: TOW_ROWS_2020.filter((row) => row.model === '1500' || row.model === '1500 Classic'),
  HD_PAYLOAD_ROWS_2020: PAYLOAD_ROWS_2020.filter((row) => row.model !== '1500' && row.model !== '1500 Classic'),
  HD_TOW_ROWS_2020: TOW_ROWS_2020.filter((row) => row.model !== '1500' && row.model !== '1500 Classic'),
};
