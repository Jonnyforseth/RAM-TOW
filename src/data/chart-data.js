const DEFAULT_CHART_YEAR = 2026;
const SUPPORTED_CHART_YEARS = [2025, 2026];

const PDF_PATHS_BY_YEAR = {
  2025: {
    ram1500: 'C:/Users/Jonat/Downloads/25MY_Ram_1500_Customer_PayTow_2.0.pdf',
    ramHD: 'C:/Users/Jonat/Downloads/my25_Ram_HD_Customer_TowPayChart_3.65.pdf',
  },
  2026: {
    ram1500: 'C:/Users/Jonat/Downloads/26MY_Ram_1500_PayTow_2.3.pdf',
    ramHD: 'C:/Users/Jonat/Downloads/my26_Ram_HD_Customer_TowPayChart_1.9.pdf',
  },
};

const LIGHT_DUTY_TOW_ROWS_2025 = [
  { model: '1500', engine: '3.6L Pentastar V6 eTorque', cab: 'Quad', bed: `6'4"`, drive: '4x2', axleRatio: '3.21', gcwr: 11900, maxTow: 6720, trimHint: 'HFE' },
  { model: '1500', engine: '3.6L Pentastar V6 eTorque', cab: 'Quad', bed: `6'4"`, drive: '4x4', axleRatio: '3.21', gcwr: 11900, maxTow: 6480 },
  { model: '1500', engine: '3.6L Pentastar V6 eTorque', cab: 'Crew', bed: `5'7"`, drive: '4x2', axleRatio: '3.21', gcwr: 11900, maxTow: 6580 },
  { model: '1500', engine: '3.6L Pentastar V6 eTorque', cab: 'Crew', bed: `5'7"`, drive: '4x4', axleRatio: '3.21', gcwr: 11900, maxTow: 6370 },
  { model: '1500', engine: '3.6L Pentastar V6 eTorque', cab: 'Quad', bed: `6'4"`, drive: '4x2', axleRatio: '3.55', gcwr: 12900, maxTow: 7680 },
  { model: '1500', engine: '3.6L Pentastar V6 eTorque', cab: 'Quad', bed: `6'4"`, drive: '4x4', axleRatio: '3.55', gcwr: 12900, maxTow: 7480 },
  { model: '1500', engine: '3.6L Pentastar V6 eTorque', cab: 'Crew', bed: `5'7"`, drive: '4x2', axleRatio: '3.55', gcwr: 12900, maxTow: 7580 },
  { model: '1500', engine: '3.6L Pentastar V6 eTorque', cab: 'Crew', bed: `5'7"`, drive: '4x4', axleRatio: '3.55', gcwr: 12900, maxTow: 7370 },
  { model: '1500', engine: '3.6L Pentastar V6 eTorque', cab: 'Crew', bed: `6'4"`, drive: '4x2', axleRatio: '3.55', gcwr: 13370, maxTow: 8110, confidence: 'medium' },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Quad', bed: `6'4"`, drive: '4x2', axleRatio: '3.21', gcwr: 13900, maxTow: 8480, trimHint: 'HFE' },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Crew', bed: `5'7"`, drive: '4x2', axleRatio: '3.21', gcwr: 13900, maxTow: 8410 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Crew', bed: `6'4"`, drive: '4x2', axleRatio: '3.21', gcwr: 13900, maxTow: 8380 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Quad', bed: `6'4"`, drive: '4x4', axleRatio: '3.55', gcwr: 13900, maxTow: 8350 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Crew', bed: `5'7"`, drive: '4x4', axleRatio: '3.55', gcwr: 13900, maxTow: 8240 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Crew', bed: `6'4"`, drive: '4x4', axleRatio: '3.55', gcwr: 13900, maxTow: 8160 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Quad', bed: `6'4"`, drive: '4x2', axleRatio: '3.92', gcwr: 17000, maxTow: 11570, confidence: 'medium' },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Quad', bed: `6'4"`, drive: '4x4', axleRatio: '3.92', gcwr: 17000, maxTow: 11450 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Crew', bed: `5'7"`, drive: '4x2', axleRatio: '3.92', gcwr: 17000, maxTow: 11510 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Crew', bed: `5'7"`, drive: '4x4', axleRatio: '3.92', gcwr: 17000, maxTow: 11340 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Crew', bed: `6'4"`, drive: '4x2', axleRatio: '3.92', gcwr: 17000, maxTow: 11480 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Crew', bed: `6'4"`, drive: '4x4', axleRatio: '3.92', gcwr: 17000, maxTow: 11260 },
  { model: '1500', engine: '3.0L Hurricane HO', trim: 'RHO', cab: 'Crew', bed: `5'7"`, drive: '4x4', axleRatio: '3.92', gcwr: 15160, maxTow: 8380 },
  { model: '1500', engine: '3.0L Hurricane HO', trim: 'Limited', cab: 'Crew', bed: `5'7"`, drive: '4x4', axleRatio: '3.92', gcwr: 15873, maxTow: 9340 },
  { model: '1500', engine: '3.0L Hurricane HO', trim: 'Limited', cab: 'Crew', bed: `6'4"`, drive: '4x4', axleRatio: '3.92', gcwr: 16134, maxTow: 9920 },
];

const LIGHT_DUTY_PAYLOAD_ROWS_2025 = [
  { model: '1500', engine: '3.6L Pentastar V6 eTorque', cab: 'Quad', bed: `6'4"`, drive: '4x2', gvwr: 6010, maxPayload: 1190, trimHint: 'HFE' },
  { model: '1500', engine: '3.6L Pentastar V6 eTorque', cab: 'Quad', bed: `6'4"`, drive: '4x2', gvwr: 6800, maxPayload: 1940 },
  { model: '1500', engine: '3.6L Pentastar V6 eTorque', cab: 'Quad', bed: `6'4"`, drive: '4x4', gvwr: 6800, maxPayload: 1810 },
  { model: '1500', engine: '3.6L Pentastar V6 eTorque', cab: 'Quad', bed: `6'4"`, drive: '4x2', gvwr: 6900, maxPayload: 2010 },
  { model: '1500', engine: '3.6L Pentastar V6 eTorque', cab: 'Quad', bed: `6'4"`, drive: '4x2', gvwr: 7200, maxPayload: 2370 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Quad', bed: `6'4"`, drive: '4x2', gvwr: 6875, maxPayload: 1820, trimHint: 'HFE' },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Quad', bed: `6'4"`, drive: '4x2', gvwr: 6900, maxPayload: 1870 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Quad', bed: `6'4"`, drive: '4x4', gvwr: 7100, maxPayload: 1980 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Crew', bed: `5'7"`, drive: '4x2', gvwr: 6900, maxPayload: 1850 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Crew', bed: `5'7"`, drive: '4x4', gvwr: 7100, maxPayload: 1890 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Crew', bed: `6'4"`, drive: '4x2', gvwr: 6900, maxPayload: 1820 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Crew', bed: `6'4"`, drive: '4x4', gvwr: 7100, maxPayload: 1790 },
  { model: '1500', engine: '3.0L Hurricane HO', trim: 'Limited', cab: 'Crew', bed: `5'7"`, drive: '4x4', gvwr: 7100, maxPayload: 1340 },
  { model: '1500', engine: '3.0L Hurricane HO', trim: 'Limited', cab: 'Crew', bed: `6'4"`, drive: '4x4', gvwr: 7100, maxPayload: 1380 },
  { model: '1500', engine: '3.0L Hurricane HO', trim: 'RHO', cab: 'Crew', bed: `5'7"`, drive: '4x4', gvwr: 7800, maxPayload: 1520 },
];

const HD_TOW_ROWS_2025 = [
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', axleRatio: '4.10', gvwr: 8565, gcwr: 18000, maxTow: 10530, trimHint: 'Power Wagon' },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Regular', bed: `8'`, drive: '4x4', axleRatio: '3.73', gvwr: 9900, gcwr: 22050, maxTow: 15230 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', axleRatio: '3.73', gvwr: 9900, gcwr: 22050, maxTow: 14920 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `8'`, drive: '4x4', axleRatio: '3.73', gvwr: 9900, gcwr: 22050, maxTow: 14730 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Regular', bed: `8'`, drive: '4x4', axleRatio: '3.73', gvwr: 10000, gcwr: 22050, maxTow: 15240 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', axleRatio: '3.73', gvwr: 10000, gcwr: 22050, maxTow: 14930 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `8'`, drive: '4x4', axleRatio: '3.73', gvwr: 10000, gcwr: 22050, maxTow: 14720 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Regular', bed: `8'`, drive: '4x4', axleRatio: '4.10', gvwr: 9900, gcwr: 24250, maxTow: 17430 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', axleRatio: '4.10', gvwr: 9900, gcwr: 24250, maxTow: 17120 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `8'`, drive: '4x4', axleRatio: '4.10', gvwr: 9900, gcwr: 24250, maxTow: 16930 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Regular', bed: `8'`, drive: '4x4', axleRatio: '4.10', gvwr: 10000, gcwr: 24250, maxTow: 17440 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', axleRatio: '4.10', gvwr: 10000, gcwr: 24250, maxTow: 17130 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `8'`, drive: '4x4', axleRatio: '4.10', gvwr: 10000, gcwr: 24250, maxTow: 16920 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Mega', bed: `6'4"`, drive: '4x4', axleRatio: '3.42', gvwr: 9900, gcwr: 24290, maxTow: 14630 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Mega', bed: `6'4"`, drive: '4x4', axleRatio: '3.42', gvwr: 10000, gcwr: 24290, maxTow: 15380 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Mega', bed: `6'4"`, drive: '4x4', axleRatio: '3.42', gvwr: 11040, gcwr: 24290, maxTow: 15710 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', axleRatio: '3.42', gvwr: 9900, gcwr: 26580, maxTow: 17080 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', axleRatio: '3.42', gvwr: 10000, gcwr: 26580, maxTow: 18230 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', axleRatio: '3.42', gvwr: 10190, gcwr: 26580, maxTow: 18230 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', axleRatio: '3.42', gvwr: 11040, gcwr: 26580, maxTow: 18230 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Regular', bed: `8'`, drive: '4x4', axleRatio: '3.42', gvwr: 9900, gcwr: 28110, maxTow: 18820 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Regular', bed: `8'`, drive: '4x4', axleRatio: '3.42', gvwr: 10000, gcwr: 27820, maxTow: 19900 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Regular', bed: `8'`, drive: '4x4', axleRatio: '3.42', gvwr: 11040, gcwr: 27820, maxTow: 19930 },
  { model: '3500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `8'`, drive: '4x4', axleRatio: '3.42', gvwr: 11800, gcwr: 31820, maxTow: 23550, confidence: 'medium' },
  { model: '3500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `8'`, drive: '4x4', axleRatio: '3.42', gvwr: 11830, gcwr: 34000, maxTow: 26080, confidence: 'medium' },
  { model: '3500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', axleRatio: '3.42', gvwr: 12300, gcwr: 33610, maxTow: 25180, confidence: 'medium' },
  { model: '3500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Mega', bed: `6'4"`, drive: '4x4', axleRatio: '3.42', gvwr: 12300, gcwr: 32720, maxTow: 24080, confidence: 'medium' },
  { model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', cab: 'Crew', bed: `8'`, drive: '4x4', axleRatio: '3.42', gvwr: 14000, gcwr: 45000, maxTow: 36610, confidence: 'medium' },
  { model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', axleRatio: '3.42', gvwr: 14000, gcwr: 42800, maxTow: 33890, confidence: 'medium' },
  { model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', cab: 'Mega', bed: `6'4"`, drive: '4x4', axleRatio: '3.42', gvwr: 14000, gcwr: 41950, maxTow: 32880, confidence: 'medium' },
];

const HD_PAYLOAD_ROWS_2025 = [
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', gvwr: 8565, maxPayload: 1570, trimHint: 'Power Wagon' },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Regular', bed: `8'`, drive: '4x4', gvwr: 9900, maxPayload: 3520 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', gvwr: 9900, maxPayload: 3210 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `8'`, drive: '4x4', gvwr: 9900, maxPayload: 3020 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Regular', bed: `8'`, drive: '4x4', gvwr: 10000, maxPayload: 3630 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', gvwr: 10000, maxPayload: 3320 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `8'`, drive: '4x4', gvwr: 10000, maxPayload: 3110 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Regular', bed: `8'`, drive: '4x4', gvwr: 9900, maxPayload: 2450 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', gvwr: 9900, maxPayload: 2170 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `8'`, drive: '4x4', gvwr: 9900, maxPayload: 2010 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Mega', bed: `6'4"`, drive: '4x4', gvwr: 9900, maxPayload: 1790 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Regular', bed: `8'`, drive: '4x4', gvwr: 10000, maxPayload: 2550 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', gvwr: 10000, maxPayload: 2260 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `8'`, drive: '4x4', gvwr: 10000, maxPayload: 2120 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Mega', bed: `6'4"`, drive: '4x4', gvwr: 10000, maxPayload: 1860 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Regular', bed: `8'`, drive: '4x4', gvwr: 11040, maxPayload: 3590 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', gvwr: 11040, maxPayload: 3300 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `8'`, drive: '4x4', gvwr: 11040, maxPayload: 3160 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Mega', bed: `6'4"`, drive: '4x4', gvwr: 11040, maxPayload: 2900 },
  { model: '3500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', gvwr: 11500, maxPayload: 3970, confidence: 'medium' },
  { model: '3500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `8'`, drive: '4x4', gvwr: 11830, maxPayload: 4040, confidence: 'medium' },
  { model: '3500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `8'`, drive: '4x4', gvwr: 12000, maxPayload: 4310, confidence: 'medium' },
  { model: '3500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Mega', bed: `6'4"`, drive: '4x4', gvwr: 12300, maxPayload: 4100, confidence: 'medium' },
  { model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', cab: 'Crew', bed: `8'`, drive: '4x4', gvwr: 14000, maxPayload: 5530, confidence: 'medium' },
  { model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', gvwr: 14000, maxPayload: 5380, confidence: 'medium' },
];

const LIGHT_DUTY_TOW_ROWS_2026 = [
  { model: '1500', engine: '3.6L Pentastar V6 eTorque', cab: 'Quad', bed: `6'4"`, drive: '4x4', axleRatio: '3.21', gcwr: 11900, maxTow: 6470 },
  { model: '1500', engine: '3.6L Pentastar V6 eTorque', cab: 'Crew', bed: `5'7"`, drive: '4x2', axleRatio: '3.21', gcwr: 11900, maxTow: 6570 },
  { model: '1500', engine: '3.6L Pentastar V6 eTorque', cab: 'Crew', bed: `5'7"`, drive: '4x4', axleRatio: '3.21', gcwr: 11900, maxTow: 6340 },
  { model: '1500', engine: '3.6L Pentastar V6 eTorque', cab: 'Quad', bed: `6'4"`, drive: '4x2', axleRatio: '3.55', gcwr: 12900, maxTow: 7660 },
  { model: '1500', engine: '3.6L Pentastar V6 eTorque', cab: 'Quad', bed: `6'4"`, drive: '4x4', axleRatio: '3.55', gcwr: 12900, maxTow: 7470 },
  { model: '1500', engine: '3.6L Pentastar V6 eTorque', cab: 'Crew', bed: `5'7"`, drive: '4x2', axleRatio: '3.55', gcwr: 12900, maxTow: 7570 },
  { model: '1500', engine: '3.6L Pentastar V6 eTorque', cab: 'Crew', bed: `5'7"`, drive: '4x4', axleRatio: '3.55', gcwr: 12900, maxTow: 7340 },
  { model: '1500', engine: '3.6L Pentastar V6 eTorque', cab: 'Crew', bed: `6'4"`, drive: '4x2', axleRatio: '3.55', gcwr: 13370, maxTow: 8130 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Quad', bed: `6'4"`, drive: '4x2', axleRatio: '3.21', gcwr: 13900, maxTow: 8510 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Crew', bed: `5'7"`, drive: '4x2', axleRatio: '3.21', gcwr: 13900, maxTow: 8390 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Crew', bed: `6'4"`, drive: '4x2', axleRatio: '3.21', gcwr: 13900, maxTow: 8320 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Quad', bed: `6'4"`, drive: '4x4', axleRatio: '3.55', gcwr: 13900, maxTow: 8270 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Crew', bed: `5'7"`, drive: '4x4', axleRatio: '3.55', gcwr: 13900, maxTow: 8100 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Crew', bed: `6'4"`, drive: '4x4', axleRatio: '3.55', gcwr: 13900, maxTow: 8120 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Quad', bed: `6'4"`, drive: '4x2', axleRatio: '3.92', gcwr: 17000, maxTow: 11610 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Quad', bed: `6'4"`, drive: '4x4', axleRatio: '3.92', gcwr: 17000, maxTow: 11370 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Crew', bed: `5'7"`, drive: '4x2', axleRatio: '3.92', gcwr: 17000, maxTow: 11490 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Crew', bed: `5'7"`, drive: '4x4', axleRatio: '3.92', gcwr: 17000, maxTow: 11200 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Crew', bed: `6'4"`, drive: '4x2', axleRatio: '3.92', gcwr: 17000, maxTow: 11420 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Crew', bed: `6'4"`, drive: '4x4', axleRatio: '3.92', gcwr: 17000, maxTow: 11220 },
  { model: '1500', engine: '5.7L HEMI V8 eTorque', cab: 'Crew', bed: `5'7"`, drive: '4x2', axleRatio: '3.21', gcwr: 13900, maxTow: 8220 },
  { model: '1500', engine: '5.7L HEMI V8 eTorque', cab: 'Crew', bed: `5'7"`, drive: '4x4', axleRatio: '3.55', gcwr: 13900, maxTow: 7640 },
  { model: '1500', engine: '5.7L HEMI V8 eTorque', cab: 'Crew', bed: `5'7"`, drive: '4x2', axleRatio: '3.92', gcwr: 17000, maxTow: 11320 },
  { model: '1500', engine: '5.7L HEMI V8 eTorque', cab: 'Crew', bed: `5'7"`, drive: '4x4', axleRatio: '3.92', gcwr: 15850, maxTow: 9590 },
  { model: '1500', engine: '3.0L Hurricane HO', trim: 'RHO', cab: 'Crew', bed: `5'7"`, drive: '4x4', axleRatio: '3.92', gcwr: 15160, maxTow: 8360 },
  { model: '1500', engine: '3.0L Hurricane HO', trim: 'Limited', cab: 'Crew', bed: `5'7"`, drive: '4x4', axleRatio: '3.92', gcwr: 15420, maxTow: 9240 },
  { model: '1500', engine: '3.0L Hurricane HO', trim: 'Limited', cab: 'Crew', bed: `6'4"`, drive: '4x4', axleRatio: '3.92', gcwr: 16220, maxTow: 10000 },
];

const LIGHT_DUTY_PAYLOAD_ROWS_2026 = [
  { model: '1500', engine: '3.6L Pentastar V6 eTorque', cab: 'Quad', bed: `6'4"`, drive: '4x4', gvwr: 6800, maxPayload: 1770 },
  { model: '1500', engine: '3.6L Pentastar V6 eTorque', cab: 'Quad', bed: `6'4"`, drive: '4x2', gvwr: 6900, maxPayload: 1980 },
  { model: '1500', engine: '3.6L Pentastar V6 eTorque', cab: 'Quad', bed: `6'4"`, drive: '4x4', gvwr: 6900, maxPayload: 1790 },
  { model: '1500', engine: '3.6L Pentastar V6 eTorque', cab: 'Quad', bed: `6'4"`, drive: '4x2', gvwr: 7200, maxPayload: 2360 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Quad', bed: `6'4"`, drive: '4x2', gvwr: 6900, maxPayload: 1930 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Quad', bed: `6'4"`, drive: '4x4', gvwr: 7100, maxPayload: 1910 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Crew', bed: `5'7"`, drive: '4x2', gvwr: 6900, maxPayload: 1820 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Crew', bed: `5'7"`, drive: '4x4', gvwr: 7100, maxPayload: 1840 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Crew', bed: `6'4"`, drive: '4x2', gvwr: 6900, maxPayload: 1730 },
  { model: '1500', engine: '3.0L Hurricane SO', cab: 'Crew', bed: `6'4"`, drive: '4x4', gvwr: 7100, maxPayload: 1750 },
  { model: '1500', engine: '5.7L HEMI V8 eTorque', cab: 'Crew', bed: `5'7"`, drive: '4x2', gvwr: 6900, maxPayload: 1650 },
  { model: '1500', engine: '5.7L HEMI V8 eTorque', cab: 'Crew', bed: `5'7"`, drive: '4x4', gvwr: 7100, maxPayload: 1630 },
  { model: '1500', engine: '3.0L Hurricane HO', trim: 'Limited', cab: 'Crew', bed: `5'7"`, drive: '4x4', gvwr: 7100, maxPayload: 1390 },
  { model: '1500', engine: '3.0L Hurricane HO', trim: 'Limited', cab: 'Crew', bed: `6'4"`, drive: '4x4', gvwr: 7100, maxPayload: 1450 },
  { model: '1500', engine: '3.0L Hurricane HO', trim: 'RHO', cab: 'Crew', bed: `5'7"`, drive: '4x4', gvwr: 7800, maxPayload: 1490 },
];

const HD_TOW_ROWS_2026 = [
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', axleRatio: '4.10', gvwr: 8565, gcwr: 18000, maxTow: 10530, trimHint: 'Power Wagon' },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Regular', bed: `8'`, drive: '4x4', axleRatio: '3.73', gvwr: 9900, gcwr: 22050, maxTow: 15220 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', axleRatio: '3.73', gvwr: 9900, gcwr: 22050, maxTow: 14920 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `8'`, drive: '4x4', axleRatio: '3.73', gvwr: 9900, gcwr: 22050, maxTow: 14730 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Regular', bed: `8'`, drive: '4x4', axleRatio: '3.73', gvwr: 10000, gcwr: 22050, maxTow: 15240 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', axleRatio: '3.73', gvwr: 10000, gcwr: 22050, maxTow: 14930 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `8'`, drive: '4x4', axleRatio: '3.73', gvwr: 10000, gcwr: 22050, maxTow: 14720 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Regular', bed: `8'`, drive: '4x4', axleRatio: '3.73', gvwr: 11040, gcwr: 22050, maxTow: 15150 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `8'`, drive: '4x4', axleRatio: '3.73', gvwr: 11040, gcwr: 22050, maxTow: 14580 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Regular', bed: `8'`, drive: '4x4', axleRatio: '4.10', gvwr: 9900, gcwr: 24250, maxTow: 17420 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', axleRatio: '4.10', gvwr: 9900, gcwr: 24250, maxTow: 17120 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `8'`, drive: '4x4', axleRatio: '4.10', gvwr: 9900, gcwr: 24250, maxTow: 16930 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Regular', bed: `8'`, drive: '4x4', axleRatio: '4.10', gvwr: 10000, gcwr: 24250, maxTow: 17440 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', axleRatio: '4.10', gvwr: 10000, gcwr: 24250, maxTow: 17130 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `8'`, drive: '4x4', axleRatio: '4.10', gvwr: 10000, gcwr: 24250, maxTow: 16920 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Mega', bed: `6'4"`, drive: '4x4', axleRatio: '3.42', gvwr: 9900, gcwr: 24290, maxTow: 14630 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Mega', bed: `6'4"`, drive: '4x4', axleRatio: '3.42', gvwr: 10000, gcwr: 24290, maxTow: 15380 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Mega', bed: `6'4"`, drive: '4x4', axleRatio: '3.42', gvwr: 11040, gcwr: 24290, maxTow: 15710 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', axleRatio: '3.42', gvwr: 9900, gcwr: 26580, maxTow: 17080 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', axleRatio: '3.42', gvwr: 10000, gcwr: 26580, maxTow: 18230 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', axleRatio: '3.42', gvwr: 10190, gcwr: 26580, maxTow: 18230 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', axleRatio: '3.42', gvwr: 11040, gcwr: 26580, maxTow: 18230 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Regular', bed: `8'`, drive: '4x4', axleRatio: '3.42', gvwr: 9900, gcwr: 28110, maxTow: 18820 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Regular', bed: `8'`, drive: '4x4', axleRatio: '3.42', gvwr: 10000, gcwr: 27820, maxTow: 19900 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Regular', bed: `8'`, drive: '4x4', axleRatio: '3.42', gvwr: 11040, gcwr: 27820, maxTow: 19930 },
  { model: '3500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `8'`, drive: '4x4', axleRatio: '3.42', gvwr: 11800, gcwr: 31820, maxTow: 23550, confidence: 'medium' },
  { model: '3500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', axleRatio: '3.42', gvwr: 12300, gcwr: 33610, maxTow: 25180, confidence: 'medium' },
  { model: '3500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Mega', bed: `6'4"`, drive: '4x4', axleRatio: '3.42', gvwr: 12300, gcwr: 32720, maxTow: 24080, confidence: 'medium' },
  { model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', cab: 'Crew', bed: `8'`, drive: '4x4', axleRatio: '3.42', gvwr: 14000, gcwr: 45000, maxTow: 36610, confidence: 'medium' },
  { model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', axleRatio: '3.42', gvwr: 14000, gcwr: 42800, maxTow: 33890, confidence: 'medium' },
  { model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', cab: 'Mega', bed: `6'4"`, drive: '4x4', axleRatio: '3.42', gvwr: 14000, gcwr: 41950, maxTow: 32890, confidence: 'medium' },
];

const HD_PAYLOAD_ROWS_2026 = [
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', gvwr: 8565, maxPayload: 1570, trimHint: 'Power Wagon' },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Regular', bed: `8'`, drive: '4x4', gvwr: 9900, maxPayload: 3510 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', gvwr: 9900, maxPayload: 3210 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `8'`, drive: '4x4', gvwr: 9900, maxPayload: 3020 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Regular', bed: `8'`, drive: '4x4', gvwr: 10000, maxPayload: 3630 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', gvwr: 10000, maxPayload: 3320 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `8'`, drive: '4x4', gvwr: 10000, maxPayload: 3110 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Regular', bed: `8'`, drive: '4x4', gvwr: 11040, maxPayload: 4580 },
  { model: '2500', engine: '6.4L HEMI V8', rearWheels: 'SRW', cab: 'Crew', bed: `8'`, drive: '4x4', gvwr: 11040, maxPayload: 4010 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Regular', bed: `8'`, drive: '4x4', gvwr: 9900, maxPayload: 2450 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', gvwr: 9900, maxPayload: 2170 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `8'`, drive: '4x4', gvwr: 9900, maxPayload: 2010 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Mega', bed: `6'4"`, drive: '4x4', gvwr: 9900, maxPayload: 1790 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Regular', bed: `8'`, drive: '4x4', gvwr: 10000, maxPayload: 2550 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', gvwr: 10000, maxPayload: 2260 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `8'`, drive: '4x4', gvwr: 10000, maxPayload: 2120 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Mega', bed: `6'4"`, drive: '4x4', gvwr: 10000, maxPayload: 1860 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Regular', bed: `8'`, drive: '4x4', gvwr: 11040, maxPayload: 3590 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', gvwr: 11040, maxPayload: 3300 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `8'`, drive: '4x4', gvwr: 11040, maxPayload: 3160 },
  { model: '2500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Mega', bed: `6'4"`, drive: '4x4', gvwr: 11040, maxPayload: 2900 },
  { model: '3500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', gvwr: 11500, maxPayload: 3970, confidence: 'medium' },
  { model: '3500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `8'`, drive: '4x4', gvwr: 11830, maxPayload: 4040, confidence: 'medium' },
  { model: '3500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Crew', bed: `8'`, drive: '4x4', gvwr: 12000, maxPayload: 4310, confidence: 'medium' },
  { model: '3500', engine: '6.7L Cummins HO', rearWheels: 'SRW', cab: 'Mega', bed: `6'4"`, drive: '4x4', gvwr: 12300, maxPayload: 4100, confidence: 'medium' },
  { model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', cab: 'Crew', bed: `8'`, drive: '4x4', gvwr: 14000, maxPayload: 5530, confidence: 'medium' },
  { model: '3500', engine: '6.7L Cummins HO', rearWheels: 'DRW', cab: 'Crew', bed: `6'4"`, drive: '4x4', gvwr: 14000, maxPayload: 5380, confidence: 'medium' },
];

const HITCH_LIMITS = {
  '1500': 1100,
  '2500': 2000,
  '3500': 2300,
};

const GOOSENECK_REQUIRED_OVER = {
  '2500': 20000,
  '3500': 23000,
};

const CHART_DATA_BY_YEAR = {
  2025: {
    pdfPaths: PDF_PATHS_BY_YEAR[2025],
    towRows: [...LIGHT_DUTY_TOW_ROWS_2025, ...HD_TOW_ROWS_2025],
    payloadRows: [...LIGHT_DUTY_PAYLOAD_ROWS_2025, ...HD_PAYLOAD_ROWS_2025],
  },
  2026: {
    pdfPaths: PDF_PATHS_BY_YEAR[2026],
    towRows: [...LIGHT_DUTY_TOW_ROWS_2026, ...HD_TOW_ROWS_2026],
    payloadRows: [...LIGHT_DUTY_PAYLOAD_ROWS_2026, ...HD_PAYLOAD_ROWS_2026],
  },
};

function resolveChartYear(year) {
  const numericYear = Number(year);
  if (SUPPORTED_CHART_YEARS.includes(numericYear)) {
    return numericYear;
  }
  return DEFAULT_CHART_YEAR;
}

function getChartData(year = DEFAULT_CHART_YEAR) {
  return CHART_DATA_BY_YEAR[resolveChartYear(year)];
}

function getPdfPaths(year = DEFAULT_CHART_YEAR) {
  return { ...getChartData(year).pdfPaths };
}

function getTowRows(year = DEFAULT_CHART_YEAR) {
  return [...getChartData(year).towRows];
}

function getPayloadRows(year = DEFAULT_CHART_YEAR) {
  return [...getChartData(year).payloadRows];
}

module.exports = {
  CHART_DATA_BY_YEAR,
  DEFAULT_CHART_YEAR,
  GOOSENECK_REQUIRED_OVER,
  PDF_PATHS_BY_YEAR,
  HITCH_LIMITS,
  SUPPORTED_CHART_YEARS,
  getChartData,
  getPayloadRows,
  getPdfPaths,
  getTowRows,
  resolveChartYear,
};
