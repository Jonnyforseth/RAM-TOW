// 2023 charts publish tow and payload together. Keep each source row together,
// then derive the two lookup lists so ratings cannot get out of sync.
function rows(config, values) {
  return values.map(([engine, engineVariant, axleRatio, gvwr, maxPayload, gcwr, maxTow]) => ({
    ...config,
    // The 2023 3500 source separates SRW and DRW by GVWR, not a column.
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

const HEMI = '6.4L HEMI V8';
const CUMMINS = '6.7L Cummins HO';
const GAS = null;
const STANDARD = 'Standard';
const HO = 'HO';

const HD_ROWS_2023 = [
  ...rows({ model: '2500', trimStrict: 'Tradesman', rearWheels: 'SRW', cab: 'Regular', bed: `8'`, drive: '4x2', ramBox: false }, [
    [HEMI, GAS, '3.73', 10000, 4010, 22000, 15540], [HEMI, GAS, '4.10', 10000, 4010, 24200, 17740],
    [HEMI, GAS, '3.73', 9900, 3910, 22000, 15540], [HEMI, GAS, '4.10', 9900, 3910, 24200, 17740],
    [CUMMINS, STANDARD, '3.73', 10000, 3150, 27320, 19990], [CUMMINS, STANDARD, '3.73', 9900, 3050, 27320, 19990],
  ]),
  ...rows({ model: '2500', trimStrict: 'Tradesman', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x2', ramBox: true }, [
    [HEMI, GAS, '3.73', 10000, 3540, 22000, 15070], [HEMI, GAS, '4.10', 10000, 3540, 24200, 17270],
    [HEMI, GAS, '3.73', 9900, 3440, 22000, 15070], [HEMI, GAS, '4.10', 9900, 3440, 24200, 17270],
    [CUMMINS, STANDARD, '3.73', 10000, 2660, 27700, 19240], [CUMMINS, STANDARD, '3.73', 9900, 2610, 27700, 18820],
  ]),
  ...rows({ model: '2500', trimStrict: 'Tradesman', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x2', ramBox: false }, [
    [HEMI, GAS, '3.73', 10000, 3660, 22000, 15190], [HEMI, GAS, '4.10', 10000, 3660, 24200, 17390],
    [HEMI, GAS, '3.73', 9900, 3560, 22000, 15190], [HEMI, GAS, '4.10', 9900, 3560, 24200, 17390],
    [CUMMINS, STANDARD, '3.73', 10000, 2770, 27700, 20000], [CUMMINS, STANDARD, '3.73', 9900, 2680, 27700, 20000],
  ]),
  ...rows({ model: '2500', trimStrict: 'Tradesman', rearWheels: 'SRW', cab: 'Crew', bed: `8'`, drive: '4x2', ramBox: false }, [
    [HEMI, GAS, '3.73', 10000, 3530, 22000, 15060], [HEMI, GAS, '4.10', 10000, 3530, 24200, 17260],
    [HEMI, GAS, '3.73', 9900, 3420, 22000, 15050], [HEMI, GAS, '4.10', 9900, 3420, 24200, 17250],
    [CUMMINS, STANDARD, '3.73', 10000, 2630, 27840, 20000], [CUMMINS, STANDARD, '3.73', 9900, 2520, 27840, 19900],
  ]),
  ...rows({ model: '2500', trimStrict: 'Big Horn / Lone Star', rearWheels: 'SRW', cab: 'Mega', bed: `6'4"`, drive: '4x4', ramBox: true }, [
    [HEMI, GAS, '3.73', 10000, 2810, 22000, 14340], [HEMI, GAS, '4.10', 10000, 2810, 24200, 16530],
    [HEMI, GAS, '3.73', 9900, 2710, 22000, 14340], [HEMI, GAS, '4.10', 9900, 2710, 24200, 16530],
    [CUMMINS, STANDARD, '3.73', 10000, 1920, 24240, 14480], [CUMMINS, STANDARD, '3.73', 9900, 1820, 24240, 13480],
  ]),
  ...rows({ model: '2500', trimStrict: 'Big Horn / Lone Star', rearWheels: 'SRW', cab: 'Mega', bed: `6'4"`, drive: '4x4', ramBox: false }, [
    [HEMI, GAS, '3.73', 10000, 2940, 22000, 14470], [HEMI, GAS, '4.10', 10000, 2940, 24200, 16600],
    [HEMI, GAS, '3.73', 9900, 2840, 22000, 14470], [HEMI, GAS, '4.10', 9900, 2840, 24200, 16600],
    [CUMMINS, STANDARD, '3.73', 10000, 2040, 24240, 15620], [CUMMINS, STANDARD, '3.73', 9900, 1940, 24240, 14620],
  ]),
  ...rows({ model: '2500', trimStrict: 'Tradesman', rearWheels: 'SRW', cab: 'Regular', bed: `8'`, drive: '4x4', ramBox: false }, [
    [HEMI, GAS, '3.73', 10000, 3690, 22000, 15220], [HEMI, GAS, '4.10', 10000, 3690, 24200, 17420],
    [HEMI, GAS, '3.73', 9900, 3580, 22000, 15210], [HEMI, GAS, '4.10', 9900, 3580, 24200, 17410],
    [CUMMINS, STANDARD, '3.73', 10000, 2810, 27650, 19980], [CUMMINS, STANDARD, '3.73', 9900, 2710, 27650, 19980],
  ]),
  ...rows({ model: '2500', trimStrict: 'Power Wagon', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', ramBox: true }, [[HEMI, GAS, '4.10', 8565, 1520, 18000, 10440]]),
  ...rows({ model: '2500', trimStrict: 'Power Wagon', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', ramBox: false }, [[HEMI, GAS, '4.10', 8565, 1630, 18000, 10590]]),
  // The Rebel was published in Ram's separate 2023 2500 (DJ) 4x4 chart,
  // rather than in the combined 2500/3500 HD PDF.
  ...rows({ model: '2500', trimStrict: 'Rebel', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', ramBox: false }, [[CUMMINS, STANDARD, '3.73', 9680, 1980, 23100, 14920]]),
  // Ram's separate 2023 4x4 chart publishes this standard-Cummins Crew 6'4
  // configuration as ST. Laramie shares the engine, driveline, cab, and box
  // family; keep its rating as a GVWR range until the door sticker confirms it.
  ...rows({ model: '2500', trimStrict: 'Laramie', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', ramBox: false, confidence: 'medium' }, [
    [CUMMINS, STANDARD, '3.73', 9900, 2390, 27980, 19170],
    [CUMMINS, STANDARD, '3.73', 10000, 2480, 27980, 19980],
  ]),
  ...rows({ model: '2500', trimStrict: 'Tradesman', rearWheels: 'SRW', cab: 'Crew', bed: `8'`, drive: '4x4', ramBox: false }, [
    [HEMI, GAS, '3.73', 10000, 3170, 22000, 14700], [HEMI, GAS, '4.10', 10000, 3170, 24200, 16900],
    [HEMI, GAS, '3.73', 9900, 3080, 22200, 14710], [HEMI, GAS, '4.10', 9900, 3080, 24200, 16910],
    [CUMMINS, STANDARD, '3.73', 10000, 2300, 26400, 18230], [CUMMINS, STANDARD, '3.73', 9900, 2200, 26400, 17210],
  ]),
  ...rows({ model: '3500', trimStrict: 'Tradesman', cab: 'Regular', bed: `8'`, drive: '4x2', ramBox: false }, [
    [HEMI, GAS, '3.73', 14000, 7680, 22600, 15810], [HEMI, GAS, '4.10', 14000, 7680, 25000, 18210], [HEMI, GAS, '3.73', 10700, 4640, 22000, 15470], [HEMI, GAS, '4.10', 10700, 4640, 24200, 17670],
    [CUMMINS, STANDARD, '3.73', 11500, 4610, 28300, 20940], [CUMMINS, STANDARD, '3.73', 14000, 6830, 28300, 20660], [CUMMINS, STANDARD, '4.10', 14000, 6830, 30300, 22660], [CUMMINS, STANDARD, '3.73', 13500, 6330, 28300, 20660], [CUMMINS, STANDARD, '4.10', 13500, 6330, 30300, 22660],
    [CUMMINS, HO, '3.73', 11500, 4490, 34630, 26780], [CUMMINS, HO, '3.73', 14000, 6560, 41600, 33690], [CUMMINS, HO, '4.10', 14000, 6560, 45000, 37090], [CUMMINS, HO, '3.73', 13500, 6060, 41600, 33690], [CUMMINS, HO, '4.10', 13500, 6060, 45000, 35250],
  ]),
  ...rows({ model: '3500', trimStrict: 'Tradesman', cab: 'Crew', bed: `6'4"`, drive: '4x2', ramBox: true }, [[HEMI, GAS, '3.73', 10700, 4150, 22000, 14980], [HEMI, GAS, '4.10', 10700, 4150, 24200, 17180], [CUMMINS, STANDARD, '3.73', 11500, 4030, 28300, 20360], [CUMMINS, HO, '3.73', 11500, 3940, 32240, 23130]]),
  ...rows({ model: '3500', trimStrict: 'Tradesman', cab: 'Crew', bed: `6'4"`, drive: '4x2', ramBox: false }, [[HEMI, GAS, '3.73', 10700, 4280, 22200, 15110], [HEMI, GAS, '4.10', 10700, 4280, 24200, 17310], [CUMMINS, STANDARD, '3.73', 11500, 4180, 28300, 20510], [CUMMINS, HO, '3.73', 11500, 4080, 32240, 24100]]),
  ...rows({ model: '3500', trimStrict: 'Tradesman', cab: 'Crew', bed: `8'`, drive: '4x2', ramBox: false }, [
    [HEMI, GAS, '3.73', 11100, 4510, 22000, 14940], [HEMI, GAS, '4.10', 11100, 4510, 24200, 17140], [HEMI, GAS, '3.73', 14000, 7050, 22600, 15180], [HEMI, GAS, '4.10', 14000, 7050, 25000, 17580],
    [CUMMINS, STANDARD, '3.73', 12000, 4540, 28300, 20370], [CUMMINS, STANDARD, '3.73', 14000, 6180, 28300, 20010], [CUMMINS, STANDARD, '4.10', 14000, 6180, 30300, 22010], [CUMMINS, STANDARD, '3.73', 13500, 5680, 28300, 20010], [CUMMINS, STANDARD, '4.10', 13500, 5680, 30300, 22010],
    [CUMMINS, HO, '3.73', 12000, 4440, 33670, 25560], [CUMMINS, HO, '3.73', 14000, 5930, 41600, 33060], [CUMMINS, HO, '4.10', 14000, 5930, 43000, 34460], [CUMMINS, HO, '3.73', 13500, 5430, 41600, 33060], [CUMMINS, HO, '4.10', 13500, 5430, 43000, 33080],
  ]),
  ...rows({ model: '3500', trimStrict: 'Big Horn / Lone Star', cab: 'Mega', bed: `6'4"`, drive: '4x4', ramBox: true }, [[HEMI, GAS, '3.73', 11400, 4280, 22000, 14110], [HEMI, GAS, '4.10', 11400, 4280, 24200, 16610], [CUMMINS, STANDARD, '3.73', 12300, 4110, 28300, 19640], [CUMMINS, HO, '3.73', 12300, 3970, 32710, 23300]]),
  ...rows({ model: '3500', trimStrict: 'Big Horn / Lone Star', cab: 'Mega', bed: `6'4"`, drive: '4x4', ramBox: false }, [
    [HEMI, GAS, '3.73', 14000, 6630, 22600, 14760], [HEMI, GAS, '4.10', 14000, 6630, 25000, 17160], [HEMI, GAS, '3.73', 11400, 4340, 22000, 14470], [HEMI, GAS, '4.10', 11400, 4340, 24200, 16670],
    [CUMMINS, STANDARD, '3.73', 12300, 4290, 28300, 19820], [CUMMINS, STANDARD, '3.73', 14000, 5660, 28300, 19490], [CUMMINS, STANDARD, '4.10', 14000, 5660, 30300, 21490], [CUMMINS, STANDARD, '3.73', 13500, 5160, 28300, 19490], [CUMMINS, STANDARD, '4.10', 13500, 5160, 30300, 21490],
    [CUMMINS, HO, '3.73', 12300, 4130, 32710, 24070], [CUMMINS, HO, '3.73', 14000, 5440, 41600, 32570], [CUMMINS, HO, '4.10', 14000, 5440, 41955, 32930], [CUMMINS, HO, '3.73', 13500, 4940, 41600, 29810], [CUMMINS, HO, '4.10', 13500, 4940, 41955, 29810],
  ]),
  ...rows({ model: '3500', trimStrict: 'Tradesman', cab: 'Regular', bed: `8'`, drive: '4x4', ramBox: false }, [
    [HEMI, GAS, '3.73', 11000, 4590, 22000, 15120], [HEMI, GAS, '4.10', 11000, 4590, 24200, 17320], [HEMI, GAS, '3.73', 14000, 7230, 22600, 15360], [HEMI, GAS, '4.10', 14000, 7230, 25000, 17760],
    [CUMMINS, STANDARD, '3.73', 14000, 6400, 28300, 20230], [CUMMINS, STANDARD, '4.10', 14000, 6400, 30300, 22230], [CUMMINS, STANDARD, '3.73', 11800, 4510, 28300, 20540], [CUMMINS, STANDARD, '3.73', 13500, 5890, 28300, 20220], [CUMMINS, STANDARD, '4.10', 13500, 5890, 30300, 22220],
    [CUMMINS, HO, '3.73', 14000, 6120, 41600, 33250], [CUMMINS, HO, '4.10', 14000, 6120, 43000, 34650], [CUMMINS, HO, '3.73', 11800, 4370, 34540, 25970], [CUMMINS, HO, '3.73', 13500, 5620, 41600, 33250], [CUMMINS, HO, '4.10', 13500, 5620, 43000, 34320],
  ]),
  ...rows({ model: '3500', trimStrict: 'Tradesman', cab: 'Crew', bed: `6'4"`, drive: '4x4', ramBox: true }, [[HEMI, GAS, '3.73', 11000, 4140, 22000, 14670], [HEMI, GAS, '4.10', 11000, 4140, 24200, 16870], [CUMMINS, STANDARD, '3.73', 11800, 4050, 28300, 20080], [CUMMINS, HO, '3.73', 11800, 3870, 32580, 23000]]),
  ...rows({ model: '3500', trimStrict: 'Tradesman', cab: 'Crew', bed: `6'4"`, drive: '4x4', ramBox: false }, [[HEMI, GAS, '3.73', 11000, 4250, 22000, 14780], [HEMI, GAS, '4.10', 11000, 4250, 24200, 16980], [CUMMINS, STANDARD, '3.73', 11800, 4190, 28300, 20220], [CUMMINS, HO, '3.73', 11800, 4010, 32580, 23600]]),
  ...rows({ model: '3500', trimStrict: 'Tradesman', cab: 'Crew', bed: `8'`, drive: '4x4', ramBox: false }, [
    [HEMI, GAS, '3.73', 14000, 6700, 22600, 14830], [HEMI, GAS, '4.10', 14000, 6700, 25000, 17230], [HEMI, GAS, '3.73', 11400, 4450, 22000, 14580], [HEMI, GAS, '4.10', 11400, 4450, 24200, 16780],
    [CUMMINS, STANDARD, '3.73', 12300, 4490, 28300, 20020], [CUMMINS, STANDARD, '3.73', 14000, 5850, 28300, 19680], [CUMMINS, STANDARD, '4.10', 14000, 5850, 30300, 21680], [CUMMINS, STANDARD, '3.73', 13500, 5350, 28300, 19680], [CUMMINS, STANDARD, '4.10', 13500, 5350, 30300, 21680],
    [CUMMINS, HO, '3.73', 12300, 4330, 33610, 25120], [CUMMINS, HO, '3.73', 14000, 5580, 41600, 32710], [CUMMINS, HO, '4.10', 14000, 5580, 43000, 34070], [CUMMINS, HO, '3.73', 13500, 5080, 41600, 30720], [CUMMINS, HO, '4.10', 13500, 5080, 43000, 30720],
  ]),
  // The 2023 combined HD chart lists this Crew long-box mechanical family as
  // Tradesman only. Big Horn/Lone Star share the chart drivetrain family, but
  // retain a medium-confidence marker until the door-sticker GVWR is confirmed.
  ...rows({ model: '3500', trimStrict: 'Big Horn / Lone Star', cab: 'Crew', bed: `8'`, drive: '4x4', ramBox: false, confidence: 'medium' }, [
    [HEMI, GAS, '3.73', 14000, 6700, 22600, 14830], [HEMI, GAS, '4.10', 14000, 6700, 25000, 17230], [HEMI, GAS, '3.73', 11400, 4450, 22000, 14580], [HEMI, GAS, '4.10', 11400, 4450, 24200, 16780],
    [CUMMINS, STANDARD, '3.73', 12300, 4490, 28300, 20020], [CUMMINS, STANDARD, '3.73', 14000, 5850, 28300, 19680], [CUMMINS, STANDARD, '4.10', 14000, 5850, 30300, 21680], [CUMMINS, STANDARD, '3.73', 13500, 5350, 28300, 19680], [CUMMINS, STANDARD, '4.10', 13500, 5350, 30300, 21680],
    [CUMMINS, HO, '3.73', 12300, 4330, 33610, 25120], [CUMMINS, HO, '3.73', 14000, 5580, 41600, 32710], [CUMMINS, HO, '4.10', 14000, 5580, 43000, 34070], [CUMMINS, HO, '3.73', 13500, 5080, 41600, 30720], [CUMMINS, HO, '4.10', 13500, 5080, 43000, 30720],
  ]),
];

// The 1500 chart uses the same row format, with the older EcoDiesel and two
// 5.7L variants kept distinct. These are the configurations published in the
// 2023 DT chart; exact door-sticker GVWR remains selectable when absent.
const LD_ROWS_2023 = [
  ...rows({ model: '1500', trimStrict: 'HFE', cab: 'Quad', bed: `6'4"`, drive: '4x2' }, [['3.6L Pentastar V6 eTorque', null, '3.21', 6010, 1240, 11900, 6760]]),
  ...rows({ model: '1500', trimStrict: 'Big Horn', cab: 'Crew', bed: `5'7"`, drive: '4x2' }, [['3.0L EcoDiesel V6', null, '3.21', 6990, 1730, 13900, 8280], ['3.0L EcoDiesel V6', null, '3.21', 7000, 1770, 13900, 8170], ['3.0L EcoDiesel V6', null, '3.92', 7000, 1770, 15600, 9870]]),
  ...rows({ model: '1500', trimStrict: 'Tradesman', cab: 'Crew', bed: `6'4"`, drive: '4x2' }, [['3.6L Pentastar V6 eTorque', null, '3.55', 7100, 2300, 12900, 7740], ['3.0L EcoDiesel V6', null, '3.21', 7200, 2240, 13900, 8480], ['3.0L EcoDiesel V6', null, '3.92', 7200, 2240, 15600, 10180], ['3.0L EcoDiesel V6', null, '3.92', 7200, 2240, 18200, 12560], ['5.7L HEMI V8 eTorque', 'Standard', '3.21', 6900, 1920, 13900, 8500], ['5.7L HEMI V8 eTorque', 'Standard', '3.92', 6900, 1920, 17000, 11600], ['5.7L HEMI V8 eTorque', 'eTorque', '3.21', 6900, 1850, 13900, 8420], ['5.7L HEMI V8 eTorque', 'eTorque', '3.92', 6900, 1850, 17000, 11520], ['5.7L HEMI V8 eTorque', 'eTorque', '3.92', 6900, 1850, 18350, 12750]]),
  ...rows({ model: '1500', trimStrict: 'Tradesman', cab: 'Quad', bed: `6'4"`, drive: '4x2' }, [['3.6L Pentastar V6 eTorque', null, '3.21', 6900, 1980, 11900, 6470], ['3.6L Pentastar V6 eTorque', null, '3.55', 6900, 1980, 12900, 7470], ['5.7L HEMI V8 eTorque', 'Standard', '3.21', 6900, 1810, 13900, 8370], ['5.7L HEMI V8 eTorque', 'Standard', '3.92', 6900, 1810, 17000, 11470], ['5.7L HEMI V8 eTorque', 'eTorque', '3.21', 6900, 1720, 13900, 8230], ['5.7L HEMI V8 eTorque', 'eTorque', '3.92', 6900, 1720, 17000, 11330]]),
  ...rows({ model: '1500', trimStrict: 'Big Horn', cab: 'Crew', bed: `5'7"`, drive: '4x4' }, [['3.6L Pentastar V6 eTorque', null, '3.21', 6900, 2020, 11900, 6490], ['3.6L Pentastar V6 eTorque', null, '3.55', 6900, 2020, 12900, 7490], ['5.7L HEMI V8 eTorque', 'Standard', '3.21', 6900, 1840, 13900, 8370], ['5.7L HEMI V8 eTorque', 'Standard', '3.92', 6900, 1840, 17000, 11470], ['5.7L HEMI V8 eTorque', 'eTorque', '3.21', 6900, 1760, 13900, 8270], ['5.7L HEMI V8 eTorque', 'eTorque', '3.92', 6900, 1760, 17000, 11370]]),
  ...rows({ model: '1500', trimStrict: 'Big Horn', cab: 'Crew', bed: `6'4"`, drive: '4x4' }, [['3.0L EcoDiesel V6', null, '3.21', 7200, 1740, 13900, 7710], ['3.0L EcoDiesel V6', null, '3.92', 7200, 1740, 15600, 9410]]),
  ...rows({ model: '1500', trimStrict: 'Tradesman', cab: 'Crew', bed: `5'7"`, drive: '4x2' }, [['3.0L EcoDiesel V6', null, '3.21', 7200, 1780, 13900, 7950], ['3.0L EcoDiesel V6', null, '3.92', 7200, 1780, 15600, 9650]]),
  ...rows({ model: '1500', trimStrict: 'Tradesman', cab: 'Crew', bed: `6'4"`, drive: '4x4' }, [['3.6L Pentastar V6 eTorque', null, '3.21', 6800, 1840, 11900, 6530], ['3.6L Pentastar V6 eTorque', null, '3.55', 6800, 1840, 12900, 7530], ['5.7L HEMI V8 eTorque', 'Standard', '3.21', 7100, 1940, 13900, 8370], ['5.7L HEMI V8 eTorque', 'Standard', '3.92', 7100, 1940, 17000, 11470], ['5.7L HEMI V8 eTorque', 'eTorque', '3.21', 7100, 1860, 13900, 8220], ['5.7L HEMI V8 eTorque', 'eTorque', '3.92', 7100, 1860, 17000, 11320]]),
  ...rows({ model: '1500', trimStrict: 'Tradesman', cab: 'Quad', bed: `6'4"`, drive: '4x4' }, [['3.6L Pentastar V6 eTorque', null, '3.21', 6900, 1810, 11900, 6170], ['3.6L Pentastar V6 eTorque', null, '3.55', 6900, 1810, 12900, 7170], ['5.7L HEMI V8 eTorque', 'Standard', '3.21', 7100, 1830, 13900, 8180], ['5.7L HEMI V8 eTorque', 'Standard', '3.92', 7100, 1830, 17000, 11280], ['5.7L HEMI V8 eTorque', 'eTorque', '3.21', 7100, 1750, 13900, 7810], ['5.7L HEMI V8 eTorque', 'eTorque', '3.92', 7100, 1750, 17000, 10910]]),
  ...rows({ model: '1500', trimStrict: 'Tradesman', cab: 'Crew', bed: `5'7"`, drive: '4x4' }, [['3.6L Pentastar V6 eTorque', null, '3.21', 6900, 1840, 11900, 6370], ['3.6L Pentastar V6 eTorque', null, '3.55', 6900, 1840, 12900, 7370], ['5.7L HEMI V8 eTorque', 'Standard', '3.21', 7100, 1880, 13900, 8120], ['5.7L HEMI V8 eTorque', 'Standard', '3.92', 7100, 1880, 17000, 11220], ['5.7L HEMI V8 eTorque', 'eTorque', '3.21', 7100, 1800, 13900, 8100], ['5.7L HEMI V8 eTorque', 'eTorque', '3.92', 7100, 1800, 17000, 11200]]),
  ...rows({ model: '1500', trimStrict: 'TRX', cab: 'Crew', bed: `5'7"`, drive: '4x4' }, [['6.2L Supercharged HEMI V8', null, '3.55', 7800, 1310, 15160, 8100]]),
];

const TOW_ROWS_2023 = [...LD_ROWS_2023, ...HD_ROWS_2023].map(({ maxPayload, ...row }) => row);
const PAYLOAD_ROWS_2023 = [...LD_ROWS_2023, ...HD_ROWS_2023].map(({ maxTow, gcwr, axleRatio, ...row }) => row);

module.exports = {
  HD_ROWS_2023,
  LIGHT_DUTY_PAYLOAD_ROWS_2023: PAYLOAD_ROWS_2023.filter((row) => row.model === '1500'),
  LIGHT_DUTY_TOW_ROWS_2023: TOW_ROWS_2023.filter((row) => row.model === '1500'),
  HD_PAYLOAD_ROWS_2023: PAYLOAD_ROWS_2023.filter((row) => row.model !== '1500'),
  HD_TOW_ROWS_2023: TOW_ROWS_2023.filter((row) => row.model !== '1500'),
};
