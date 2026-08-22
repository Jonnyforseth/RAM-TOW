function parseDriveValues(value) {
  const values = String(value || '')
    .split('/')
    .map((item) => Number(item.replace(/[^0-9]/g, '')) || null);

  return {
    '4x2': values[0] || null,
    '4x4': values.length > 1 ? values[1] || null : null,
  };
}

function expandDrivePairs({ valueKey, model, engine, engineVariant, rearWheels, axleRatio, gvwr, gcwr, trimHint, entries }) {
  return entries.flatMap(({ cab, bed, values }) => {
    const driveValues = parseDriveValues(values);
    return ['4x2', '4x4']
      .filter((drive) => driveValues[drive])
      .map((drive) => ({
        model, engine, ...(engineVariant ? { engineVariant } : {}), ...(rearWheels ? { rearWheels } : {}), cab, bed, drive,
        ...(axleRatio ? { axleRatio } : {}),
        ...(gvwr ? { gvwr: Array.isArray(gvwr) ? gvwr[drive === '4x2' ? 0 : 1] : gvwr } : {}),
        ...(gcwr ? { gcwr } : {}),
        ...(trimHint ? { trimHint } : {}),
        [valueKey]: driveValues[drive],
      }));
  });
}

function towRows(options) {
  return expandDrivePairs({ ...options, valueKey: 'maxTow' });
}

function payloadRows(options) {
  return expandDrivePairs({ ...options, valueKey: 'maxPayload' });
}

const LIGHT_DUTY_TOW_ROWS_2024 = [
  ...towRows({ model: '1500', engine: '3.6L Pentastar V6 eTorque', axleRatio: '3.21', gcwr: 11900, entries: [
    { cab: 'Quad', bed: `6'4"`, values: '6750/6570' }, { cab: 'Crew', bed: `5'7"`, values: '6610/6430' },
  ] }),
  ...towRows({ model: '1500', engine: '3.6L Pentastar V6 eTorque', axleRatio: '3.55', gcwr: 12900, entries: [
    { cab: 'Quad', bed: `6'4"`, values: '7760/7570' }, { cab: 'Crew', bed: `5'7"`, values: '7610/7430' },
  ] }),
  ...towRows({ model: '1500', engine: '5.7L HEMI V8 eTorque', axleRatio: '3.21', gcwr: 13900, entries: [
    { cab: 'Quad', bed: `6'4"`, values: '8420/8240' }, { cab: 'Crew', bed: `5'7"`, values: '8280/8090' }, { cab: 'Crew', bed: `6'4"`, values: '8300/8060' },
  ] }),
  ...towRows({ model: '1500', engine: '5.7L HEMI V8 eTorque', axleRatio: '3.92', gcwr: 17000, entries: [
    { cab: 'Quad', bed: `6'4"`, values: '11520/11340' }, { cab: 'Crew', bed: `5'7"`, values: '11380/11190' }, { cab: 'Crew', bed: `6'4"`, values: '11400/11160' },
  ] }),
  { model: '1500', engine: '5.7L HEMI V8 eTorque', trimHint: 'Max Tow', cab: 'Quad', bed: `6'4"`, drive: '4x2', axleRatio: '3.92', gcwr: 18350, maxTow: 12750 },
  { model: '1500', engine: '6.2L Supercharged HEMI V8', trimHint: 'TRX', cab: 'Crew', bed: `5'7"`, drive: '4x4', axleRatio: '3.55', gcwr: 15160, maxTow: 8100 },
];

const LIGHT_DUTY_PAYLOAD_ROWS_2024 = [
  { model: '1500', engine: '3.6L Pentastar V6 eTorque', trimHint: 'HFE', cab: 'Quad', bed: `6'4"`, drive: '4x2', gvwr: 6010, maxPayload: 1220 },
  { model: '1500', engine: '3.6L Pentastar V6 eTorque', cab: 'Quad', bed: `6'4"`, drive: '4x4', gvwr: 6800, maxPayload: 1840 },
  ...payloadRows({ model: '1500', engine: '3.6L Pentastar V6 eTorque', gvwr: 6900, entries: [{ cab: 'Crew', bed: `5'7"`, values: '2040/1860' }] }),
  { model: '1500', engine: '3.6L Pentastar V6 eTorque', cab: 'Quad', bed: `6'4"`, drive: '4x2', gvwr: 7100, maxPayload: 2300 },
  ...payloadRows({ model: '1500', engine: '5.7L HEMI V8 eTorque', gvwr: [6900, 7100], entries: [
    { cab: 'Quad', bed: `6'4"`, values: '1840/1860' }, { cab: 'Crew', bed: `5'7"`, values: '1780/1810' }, { cab: 'Crew', bed: `6'4"`, values: '1740/1750' },
  ] }),
  { model: '1500', engine: '6.2L Supercharged HEMI V8', trimHint: 'TRX', cab: 'Crew', bed: `5'7"`, drive: '4x4', gvwr: 7800, maxPayload: 1310 },
];

const RAW_HD_TOW_ROWS_2024 = [
  ...towRows({ model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', trimHint: 'Power Wagon', axleRatio: '4.10', gvwr: 8565, gcwr: 18000, entries: [{ cab: 'Crew', bed: `6'4"`, values: 'NA/10610' }] }),
  ...[9900, 10000].flatMap((gvwr) => [
    ...towRows({ model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', axleRatio: '3.73', gvwr, gcwr: 22000, entries: [
      { cab: 'Regular', bed: `8'`, values: gvwr === 9900 ? '15520/15210' : '15520/15220' }, { cab: 'Crew', bed: `6'4"`, values: gvwr === 9900 ? '15210/14890' : '15210/14900' },
      { cab: 'Crew', bed: `8'`, values: gvwr === 9900 ? '15070/14710' : '15070/14700' }, { cab: 'Mega', bed: `6'4"`, values: 'NA/14500' },
    ] }),
    ...towRows({ model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', axleRatio: '4.10', gvwr, gcwr: gvwr === 10000 ? 24197 : 24200, entries: [
      { cab: 'Regular', bed: `8'`, values: gvwr === 9900 ? '17720/17410' : '17720/17420' }, { cab: 'Crew', bed: `6'4"`, values: gvwr === 9900 ? '17410/17090' : '17410/17100' },
      { cab: 'Crew', bed: `8'`, values: gvwr === 9900 ? '17270/16910' : '17270/16900' }, { cab: 'Mega', bed: `6'4"`, values: gvwr === 9900 ? 'NA/16690' : 'NA/16700' },
    ] }),
  ]),
  ...towRows({ model: '3500', engine: '6.4L HEMI V8', rearWheels: 'SRW', axleRatio: '3.73', gvwr: [10700, 11000], gcwr: 22000, entries: [{ cab: 'Regular', bed: `8'`, values: '15470/15090' }, { cab: 'Crew', bed: `6'4"`, values: '15100/14760' }] }),
  ...towRows({ model: '3500', engine: '6.4L HEMI V8', rearWheels: 'SRW', axleRatio: '3.73', gvwr: [11100, 11400], gcwr: 22000, entries: [{ cab: 'Crew', bed: `8'`, values: '14930/14570' }, { cab: 'Mega', bed: `6'4"`, values: 'NA/14390' }] }),
  ...towRows({ model: '3500', engine: '6.4L HEMI V8', rearWheels: 'DRW', axleRatio: '3.73', gvwr: 14000, gcwr: 22600, entries: [{ cab: 'Regular', bed: `8'`, values: '15810/15350' }, { cab: 'Crew', bed: `8'`, values: '15170/14800' }, { cab: 'Mega', bed: `6'4"`, values: 'NA/14700' }] }),
  ...towRows({ model: '3500', engine: '6.4L HEMI V8', rearWheels: 'SRW', axleRatio: '4.10', gvwr: [10700, 11000], gcwr: 24200, entries: [{ cab: 'Regular', bed: `8'`, values: '17670/17290' }, { cab: 'Crew', bed: `6'4"`, values: '17300/16960' }] }),
  ...towRows({ model: '3500', engine: '6.4L HEMI V8', rearWheels: 'SRW', axleRatio: '4.10', gvwr: [11100, 11400], gcwr: 24200, entries: [{ cab: 'Crew', bed: `8'`, values: '17130/16770' }, { cab: 'Mega', bed: `6'4"`, values: 'NA/16590' }] }),
  ...towRows({ model: '3500', engine: '6.4L HEMI V8', rearWheels: 'DRW', axleRatio: '4.10', gvwr: 14000, gcwr: 25000, entries: [{ cab: 'Regular', bed: `8'`, values: '18210/17750' }, { cab: 'Crew', bed: `8'`, values: '17570/17200' }, { cab: 'Mega', bed: `6'4"`, values: 'NA/17100' }] }),
  ...towRows({ model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', trimHint: 'Rebel', axleRatio: '3.73', gvwr: 9680, gcwr: 23100, entries: [{ cab: 'Mega', bed: `6'4"`, values: 'NA/14900' }] }),
  ...towRows({ model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', axleRatio: '3.73', gvwr: 9900, gcwr: 24240, entries: [{ cab: 'Mega', bed: `6'4"`, values: 'NA/15880' }] }),
  ...towRows({ model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', axleRatio: '3.73', gvwr: 10000, gcwr: 24240, entries: [{ cab: 'Mega', bed: `6'4"`, values: 'NA/15840' }] }),
  ...[9900, 10000].flatMap((gvwr) => [
    ...towRows({ model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', axleRatio: '3.73', gvwr, gcwr: 26400, entries: [{ cab: 'Crew', bed: `8'`, values: gvwr === 9900 ? 'NA/18220' : 'NA/18230' }] }),
    ...towRows({ model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', axleRatio: '3.73', gvwr, gcwr: 27320, entries: [{ cab: 'Regular', bed: `8'`, values: gvwr === 9900 ? '19980/NA' : '19990/NA' }] }),
    ...towRows({ model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', axleRatio: '3.73', gvwr, gcwr: 27650, entries: [{ cab: 'Crew', bed: `6'4"`, values: 'NA/19960' }] }),
    ...towRows({ model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', axleRatio: '3.73', gvwr, gcwr: 27700, entries: [{ cab: 'Crew', bed: `6'4"`, values: '19980/NA' }] }),
    ...towRows({ model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', axleRatio: '3.73', gvwr, gcwr: gvwr === 9900 ? 27840 : 27837, entries: [{ cab: 'Crew', bed: `8'`, values: gvwr === 9900 ? '19980/NA' : '20000/NA' }] }),
    ...towRows({ model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', axleRatio: '3.73', gvwr, gcwr: gvwr === 9900 ? 27963 : 27977, entries: [{ cab: 'Crew', bed: `6'4"`, values: 'NA/20000' }] }),
  ]),
  ...towRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'SRW', axleRatio: '3.73', gvwr: [11500, 11800], gcwr: 28300, entries: [{ cab: 'Regular', bed: `8'`, values: '20940/20570' }, { cab: 'Crew', bed: `6'4"`, values: '20510/20220' }] }),
  ...towRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'SRW', axleRatio: '3.73', gvwr: [12000, 12300], gcwr: 28300, entries: [{ cab: 'Crew', bed: `8'`, values: '20360/20030' }, { cab: 'Mega', bed: `6'4"`, values: 'NA/19800' }] }),
  ...towRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', axleRatio: '3.73', gvwr: 13500, gcwr: 28300, entries: [{ cab: 'Regular', bed: `8'`, values: '20660/20220' }, { cab: 'Crew', bed: `8'`, values: '20000/19690' }, { cab: 'Mega', bed: `6'4"`, values: 'NA/19510' }] }),
  ...towRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', axleRatio: '4.10', gvwr: 13500, gcwr: 30300, entries: [{ cab: 'Regular', bed: `8'`, values: '22660/22220' }, { cab: 'Crew', bed: `8'`, values: '22000/21690' }, { cab: 'Mega', bed: `6'4"`, values: 'NA/21510' }] }),
  ...towRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', axleRatio: '3.73', gvwr: 14000, gcwr: 28300, entries: [{ cab: 'Regular', bed: `8'`, values: '20660/20220' }, { cab: 'Crew', bed: `8'`, values: '20000/19680' }, { cab: 'Mega', bed: `6'4"`, values: 'NA/19510' }] }),
  ...towRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', axleRatio: '4.10', gvwr: 14000, gcwr: 30300, entries: [{ cab: 'Regular', bed: `8'`, values: '22660/22220' }, { cab: 'Crew', bed: `8'`, values: '22000/21680' }, { cab: 'Mega', bed: `6'4"`, values: 'NA/21510' }] }),
  ...towRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'SRW', axleRatio: '3.73', gvwr: 11500, gcwr: 31961, entries: [{ cab: 'Crew', bed: `6'4"`, values: '24070/NA' }] }),
  ...towRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'SRW', axleRatio: '3.73', gvwr: 11500, gcwr: 34278, entries: [{ cab: 'Regular', bed: `8'`, values: '26800/NA' }] }),
  ...towRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'SRW', axleRatio: '3.73', gvwr: 11800, gcwr: 31946, entries: [{ cab: 'Crew', bed: `6'4"`, values: 'NA/23700' }] }),
  ...towRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'SRW', axleRatio: '3.73', gvwr: 11800, gcwr: 33918, entries: [{ cab: 'Crew', bed: `8'`, values: 'NA/26020' }] }),
  ...towRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'SRW', axleRatio: '3.73', gvwr: 12000, gcwr: 33577, entries: [{ cab: 'Crew', bed: `8'`, values: '25540/NA' }] }),
  ...towRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'SRW', axleRatio: '3.73', gvwr: 12300, gcwr: 32710, entries: [{ cab: 'Mega', bed: `6'4"`, values: 'NA/24100' }] }),
  ...towRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'SRW', axleRatio: '3.73', gvwr: 12300, gcwr: 33610, entries: [{ cab: 'Crew', bed: `8'`, values: 'NA/25180' }] }),
  ...towRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', axleRatio: '3.73', gvwr: 13500, gcwr: 38937, entries: [{ cab: 'Mega', bed: `6'4"`, values: 'NA/29930' }] }),
  ...towRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', axleRatio: '4.10', gvwr: 13500, gcwr: 38937, entries: [{ cab: 'Mega', bed: `6'4"`, values: 'NA/29930' }] }),
  ...towRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', axleRatio: '3.73', gvwr: 13500, gcwr: 39658, entries: [{ cab: 'Crew', bed: `8'`, values: 'NA/30770' }] }),
  ...towRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', axleRatio: '4.10', gvwr: 13500, gcwr: 39658, entries: [{ cab: 'Crew', bed: `8'`, values: 'NA/30770' }] }),
  ...towRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', axleRatio: '3.73', gvwr: 13500, gcwr: 41596, entries: [{ cab: 'Crew', bed: `8'`, values: '33050/NA' }] }),
  ...towRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', axleRatio: '4.10', gvwr: 13500, gcwr: 41596, entries: [{ cab: 'Crew', bed: `8'`, values: '33050/NA' }] }),
  ...towRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', axleRatio: '3.73', gvwr: 13500, gcwr: 41600, entries: [{ cab: 'Regular', bed: `8'`, values: '33690/33250' }] }),
  ...towRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', axleRatio: '4.10', gvwr: 13500, gcwr: 42657, entries: [{ cab: 'Mega', bed: `6'4"`, values: 'NA/34300' }] }),
  ...towRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', axleRatio: '4.10', gvwr: 13500, gcwr: 45000, entries: [{ cab: 'Regular', bed: `8'`, values: '37090/NA' }] }),
  ...towRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', axleRatio: '3.73', gvwr: 14000, gcwr: 41600, entries: [{ cab: 'Regular', bed: `8'`, values: '33690/33210' }, { cab: 'Crew', bed: `8'`, values: '33060/32690' }, { cab: 'Mega', bed: `6'4"`, values: 'NA/32590' }] }),
  ...towRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', axleRatio: '4.10', gvwr: 14000, gcwr: 41955, entries: [{ cab: 'Mega', bed: `6'4"`, values: 'NA/32950' }] }),
  ...towRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', axleRatio: '4.10', gvwr: 14000, gcwr: 42866, entries: [{ cab: 'Crew', bed: `8'`, values: 'NA/33960' }] }),
  ...towRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', axleRatio: '4.10', gvwr: 14000, gcwr: 43000, entries: [{ cab: 'Regular', bed: `8'`, values: 'NA/34610' }, { cab: 'Crew', bed: `8'`, values: '34460/NA' }] }),
  ...towRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', axleRatio: '4.10', gvwr: 14000, gcwr: 45000, entries: [{ cab: 'Regular', bed: `8'`, values: '37090/NA' }] }),
];

const RAW_HD_PAYLOAD_ROWS_2024 = [
  ...payloadRows({ model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', trimHint: 'Power Wagon', gvwr: 8565, entries: [{ cab: 'Crew', bed: `6'4"`, values: 'NA/1650' }] }),
  ...[9900, 10000].flatMap((gvwr) => payloadRows({ model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', gvwr, entries: [
    { cab: 'Regular', bed: `8'`, values: gvwr === 9900 ? '3900/3580' : '4000/3690' }, { cab: 'Crew', bed: `6'4"`, values: gvwr === 9900 ? '3580/3270' : '3680/3380' },
    { cab: 'Crew', bed: `8'`, values: gvwr === 9900 ? '3440/3090' : '3550/3180' }, { cab: 'Mega', bed: `6'4"`, values: gvwr === 9900 ? 'NA/2870' : 'NA/2980' },
  ] })),
  ...payloadRows({ model: '3500', engine: '6.4L HEMI V8', rearWheels: 'SRW', gvwr: [10700, 11000], entries: [{ cab: 'Regular', bed: `8'`, values: '4640/4560' }, { cab: 'Crew', bed: `6'4"`, values: '4270/4230' }] }),
  ...payloadRows({ model: '3500', engine: '6.4L HEMI V8', rearWheels: 'SRW', gvwr: [11100, 11400], entries: [{ cab: 'Crew', bed: `8'`, values: '4500/4440' }, { cab: 'Mega', bed: `6'4"`, values: 'NA/4260' }] }),
  ...payloadRows({ model: '3500', engine: '6.4L HEMI V8', rearWheels: 'DRW', gvwr: 14000, entries: [{ cab: 'Regular', bed: `8'`, values: '7680/7220' }, { cab: 'Crew', bed: `8'`, values: '7040/6670' }, { cab: 'Mega', bed: `6'4"`, values: 'NA/6570' }] }),
  ...payloadRows({ model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', trimHint: 'Rebel', gvwr: 9680, entries: [{ cab: 'Mega', bed: `6'4"`, values: 'NA/1960' }] }),
  ...[9900, 10000].flatMap((gvwr) => payloadRows({ model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', gvwr, entries: [
    { cab: 'Regular', bed: `8'`, values: gvwr === 9900 ? '3040/2690' : '3150/2790' }, { cab: 'Crew', bed: `6'4"`, values: gvwr === 9900 ? '2660/2410' : '2760/2500' },
    { cab: 'Crew', bed: `8'`, values: gvwr === 9900 ? '2520/2200' : '2640/2310' }, { cab: 'Mega', bed: `6'4"`, values: gvwr === 9900 ? 'NA/2020' : 'NA/2080' },
  ] })),
  ...payloadRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'SRW', gvwr: [11500, 11800], entries: [{ cab: 'Regular', bed: `8'`, values: '4610/4540' }, { cab: 'Crew', bed: `6'4"`, values: '4180/4190' }] }),
  ...payloadRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'SRW', gvwr: [12000, 12300], entries: [{ cab: 'Crew', bed: `8'`, values: '4530/4500' }, { cab: 'Mega', bed: `6'4"`, values: 'NA/4270' }] }),
  ...payloadRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', gvwr: 13500, entries: [{ cab: 'Regular', bed: `8'`, values: '6330/5890' }, { cab: 'Crew', bed: `8'`, values: '5670/5360' }, { cab: 'Mega', bed: `6'4"`, values: 'NA/5180' }] }),
  ...payloadRows({ model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', gvwr: 14000, entries: [{ cab: 'Regular', bed: `8'`, values: '6830/6390' }, { cab: 'Crew', bed: `8'`, values: '6170/5850' }, { cab: 'Mega', bed: `6'4"`, values: 'NA/5680' }] }),
  ...payloadRows({ model: '3500', engine: '6.7L Cummins HO', engineVariant: 'HO', rearWheels: 'SRW', gvwr: [12000, 12300], entries: [{ cab: 'Crew', bed: `8'`, values: '4440/4340' }, { cab: 'Mega', bed: `6'4"`, values: 'NA/4160' }] }),
  ...payloadRows({ model: '3500', engine: '6.7L Cummins HO', engineVariant: 'HO', rearWheels: 'DRW', gvwr: 13500, entries: [{ cab: 'Regular', bed: `8'`, values: '6060/5620' }, { cab: 'Crew', bed: `8'`, values: '5430/5090' }, { cab: 'Mega', bed: `6'4"`, values: 'NA/4960' }] }),
  ...payloadRows({ model: '3500', engine: '6.7L Cummins HO', engineVariant: 'HO', rearWheels: 'DRW', gvwr: 14000, entries: [{ cab: 'Regular', bed: `8'`, values: '6560/6080' }, { cab: 'Crew', bed: `8'`, values: '5930/5560' }, { cab: 'Mega', bed: `6'4"`, values: 'NA/5460' }] }),
];

const HD_TOW_ROWS_2024 = RAW_HD_TOW_ROWS_2024.map((row) => (
  row.engine === '6.7L Cummins HO'
    ? { ...row, engineVariant: row.gcwr >= 31000 ? 'HO' : 'Standard' }
    : row
));

const HD_PAYLOAD_ROWS_2024 = RAW_HD_PAYLOAD_ROWS_2024.map((row) => (
  row.engine === '6.7L Cummins HO' ? { ...row, engineVariant: row.engineVariant || 'Standard' } : row
));

module.exports = { HD_PAYLOAD_ROWS_2024, HD_TOW_ROWS_2024, LIGHT_DUTY_PAYLOAD_ROWS_2024, LIGHT_DUTY_TOW_ROWS_2024 };
