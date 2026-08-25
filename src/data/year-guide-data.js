const RAM_CHART_BASE_URL = 'https://www.ramtrucks.com/content/dam/fca-brands/na/ramtrucks/en_us/towing';

function chartLink(path, label) {
  return { url: `${RAM_CHART_BASE_URL}/${path}`, label };
}

const YEARLINEUP_GUIDE_ARTICLES = [
  {
    slug: '2019-ram-towing-capacity-guide',
    title: '2019 RAM 1500, 2500, and 3500 Towing Capacity Guide',
    description: 'A detailed 2019 RAM towing guide covering 1500 DT versus 1500 Classic, 2500 gas and Cummins configurations, 3500 SRW or dually choices, model-year chart maxima, payload, and VIN verification.',
    lead: 'The 2019 RAM lineup needs more careful research than a single headline number suggests. It includes both the all-new RAM 1500 DT and the continuing RAM 1500 Classic DS, plus redesigned 2500 and 3500 Heavy Duty trucks. The correct tow rating depends on the specific platform and configuration.',
    why: 'The loaded 2019 chart data reaches up to 12,750 lb for a RAM 1500, 19,780 lb for a RAM 2500, and 35,100 lb for a RAM 3500 when properly equipped. Those are lineup maxima, not the rating of every 2019 RAM truck.',
    headline: '2019 chart maxima: RAM 1500 up to 12,750 lb | RAM 2500 up to 19,780 lb | RAM 3500 up to 35,100 lb',
    sections: [
      { heading: 'The first 2019 question: all-new 1500 or 1500 Classic?', paragraphs: ['RAM sold two different half-ton platforms in 2019. The all-new 1500 uses the DT chart, while the 1500 Classic uses the DS chart. They must never be treated as the same truck just because both listings say RAM 1500.', 'After the platform is identified, engine, eTorque status where applicable, axle ratio, 4x2 or 4x4 drivetrain, cab, bed, and GVWR select the actual chart row. A max-tow package headline cannot substitute for those details.'] },
      { heading: 'What changes on 2019 Heavy Duty trucks?', paragraphs: ['The 2019 RAM 2500 and 3500 use separate gas and Cummins chart families. On a 3500, standard-output versus High-Output Cummins, single versus dual rear wheels, axle ratio, cab, bed, and GVWR can materially change the towing and payload result.', 'For fifth-wheel and gooseneck trailers, do not stop at the trailer weight. Pin weight goes into the bed with the hitch, passengers, cargo, and accessories, so the yellow payload label is often the deciding number.'] },
      { heading: 'How to use a 2019 RAM rating correctly', paragraphs: ['Start with loaded trailer weight, not brochure dry weight. Use measured tongue weight for a conventional trailer or actual pin weight for a fifth-wheel or gooseneck, then compare both towing capacity and payload.', 'Run the VIN in RAM Tow, confirm the physical door labels and hitch equipment, and use the 2019 chart PDFs below for final reference. If an axle ratio or GVWR is not clear on the sticker, treat a range as a prompt to verify instead of assuming the highest number.'] },
    ],
    check: 'Use the 2019 VIN to separate DT from Classic before comparing rows. Then verify the door-jamb payload label, axle ratio, GVWR, rear-wheel setup, and hitch type against the loaded trailer.',
    referenceLinks: [
      chartLink('2019_DT_J1_Trailer%20Tow%20Official%20Report_OFFICIAL_A_2018-1-31.pdf', 'Open official 2019 RAM 1500 DT towing chart PDF'),
      chartLink('Ram_LD_DS_Trailer_Tow_Weight_Chart_MY19.pdf', 'Open official 2019 RAM 1500 Classic DS towing chart PDF'),
      chartLink('Trailer_Tow_Excel_2019_DJ_OFFICIAL_INTERNAL_2-6-19.pdf', 'Open official 2019 RAM 2500 towing chart PDF'),
      chartLink('Trailer_Tow_Excel_2019_D2_OFFICIAL_INTERNAL_2-06-18.pdf', 'Open official 2019 RAM 3500 towing chart PDF'),
    ],
    model: '',
  },
  {
    slug: '2020-ram-towing-capacity-guide',
    title: '2020 RAM 1500, 2500, and 3500 Towing Capacity Guide',
    description: 'A detailed 2020 RAM towing guide for RAM 1500, 1500 Classic, 2500, and 3500 trucks, including HEMI, eTorque, Cummins, axle ratio, GVWR, payload, fifth-wheel planning, and VIN lookup.',
    lead: 'A 2020 RAM towing answer begins with the exact platform and equipment, not a number copied from an online listing. The year includes the all-new 1500 and 1500 Classic side by side, while the Heavy Duty lineup has gas, Cummins, SRW, and dually configurations with different chart rows.',
    why: 'The loaded 2020 chart data reaches up to 12,750 lb for a RAM 1500, 19,680 lb for a RAM 2500, and 35,100 lb for a RAM 3500 when properly equipped. The actual truck can rate substantially differently.',
    headline: '2020 chart maxima: RAM 1500 up to 12,750 lb | RAM 2500 up to 19,680 lb | RAM 3500 up to 35,100 lb',
    sections: [
      { heading: 'Keep 2020 RAM 1500 and 1500 Classic data separate', paragraphs: ['The all-new 2020 RAM 1500 DT and the 2020 RAM 1500 Classic DS have separate official towing tables. The Classic can also require the HEMI transmission, axle ratio, cab, box, drivetrain, and GVWR to be identified before an exact result is appropriate.', 'On the DT truck, standard HEMI and eTorque are separate chart families. Do not assume an eTorque truck uses the same towing row as a non-eTorque HEMI or that a 4x2 headline applies to a 4x4.'] },
      { heading: 'Use GVWR and rear wheels to compare Heavy Duty trucks', paragraphs: ['A 2020 RAM 2500 may be gas or Cummins, and a 3500 may be gas, standard Cummins, or High-Output Cummins. Cab, bed, drivetrain, axle, RamBox, GVWR, and rear-wheel configuration all affect the correct chart row.', 'For a large fifth-wheel, a 3500 dually can add payload capability, but the truck still needs adequate door-label payload after the actual pin weight, hitch, people, and cargo are included.'] },
      { heading: 'Avoid the common used-truck rating mistake', paragraphs: ['A general max-tow claim describes one properly equipped truck, not the truck in a specific listing. Verify the VIN first, then match the detected configuration to the physical truck and door labels.', 'Use a weight-distributing hitch when the RAM chart and hitch instructions call for it, and never exceed the truck, receiver, ball mount, trailer, tire, axle, or brake ratings.'] },
    ],
    check: 'Run the 2020 VIN, then use real loaded trailer weight and tongue or pin weight in Trailer Match. Confirm the payload label before deciding the trailer fits.',
    referenceLinks: [
      chartLink('Ram_LD_DT_Trailer_Tow_Weight_Chart_MY20.pdf', 'Open official 2020 RAM 1500 DT towing chart PDF'),
      chartLink('Ram_LD_DS_Trailer_Tow_Weight_Chart_MY20.pdf', 'Open official 2020 RAM 1500 Classic DS towing chart PDF'),
      chartLink('Ram_HD_2500_DJ_Trailer_Tow_Weight_Chart_MY20.pdf', 'Open official 2020 RAM 2500 towing chart PDF'),
      chartLink('Ram_HD_3500_D2_Trailer_Tow_Weight_Chart_MY20.pdf', 'Open official 2020 RAM 3500 towing chart PDF'),
    ],
    model: '',
  },
  {
    slug: '2021-ram-towing-capacity-guide',
    title: '2021 RAM 1500, 2500, and 3500 Towing Capacity Guide',
    description: 'A detailed 2021 RAM towing guide covering 1500 and Classic platforms, 4x4 towing, EcoDiesel, HEMI, 2500 gas and Cummins options, 3500 SRW or dually choices, payload, and VIN-specific results.',
    lead: 'The 2021 RAM lineup has a wide towing range because engines, drivetrains, axles, cabs, beds, GVWRs, and rear-wheel setups vary. A 2021 VIN lookup is especially valuable because the same model badge can describe very different towing and payload combinations.',
    why: 'The loaded 2021 chart data reaches up to 12,750 lb for a RAM 1500, 20,000 lb for a RAM 2500, and 37,100 lb for a RAM 3500 when properly equipped. Those values identify potential, not an individual truck approval.',
    headline: '2021 chart maxima: RAM 1500 up to 12,750 lb | RAM 2500 up to 20,000 lb | RAM 3500 up to 37,100 lb',
    sections: [
      { heading: 'How to choose the right 2021 RAM 1500 starting point', paragraphs: ['A 2021 RAM 1500 4x4 must be matched to a 4x4 chart row. Engine choices, including 3.6L, HEMI, eTorque, and EcoDiesel configurations, plus axle ratio and cab or bed layout, can all alter the final capacity.', 'The 2021 RAM 1500 Classic remains a separate DS platform. Check the window sticker title or VIN result before using any all-new 1500 chart number for a Classic.'] },
      { heading: 'When a 2500 or 3500 deserves a closer look', paragraphs: ['A 2021 2500 gas or diesel truck can be a candidate for many large conventional and fifth-wheel trailers, but payload can be the limiting factor. A fifth-wheel hitch and loaded pin weight belong in the truck payload calculation.', 'On a 2021 3500, gas, standard Cummins, and High-Output Cummins configurations should be compared with SRW or DRW, axle, GVWR, and hitch type. More tow capacity does not remove the need to check pin weight and the door sticker.'] },
      { heading: 'Use the chart as a configuration tool', paragraphs: ['The chart tells you which setup is capable when properly equipped. It does not account for every accessory added after production or replace the safety labels on the truck and trailer.', 'For a purchase decision, run the candidate VIN, read the payload label, confirm receiver or bed-hitch ratings, and use scale weights after loading when possible.'] },
    ],
    check: 'Run the 2021 VIN before comparing used trucks. Confirm Classic versus all-new 1500, 4x2 versus 4x4, axle ratio, GVWR, and all payload-consuming items.',
    referenceLinks: [
      chartLink('Ram_LD_DT_Trailer-Tow-Weight-Chart_MY21_R1.pdf', 'Open official 2021 RAM 1500 DT towing chart PDF'),
      chartLink('Ram_LD_DS-Trailer-Tow-Weight-Chart_MY21.pdf', 'Open official 2021 RAM 1500 Classic DS towing chart PDF'),
      chartLink('Ram_HD-2500-DJ_Trailer-Tow-Weight-Chart_MY21.pdf', 'Open official 2021 RAM 2500 towing chart PDF'),
      chartLink('Ram_HD-3500-D2_Trailer-Tow-Weight-Chart_MY21.pdf', 'Open official 2021 RAM 3500 towing chart PDF'),
    ],
    model: '',
  },
  {
    slug: '2022-ram-towing-capacity-guide',
    title: '2022 RAM 1500, 2500, and 3500 Towing Capacity Guide',
    description: 'A detailed 2022 RAM towing guide covering RAM 1500, 1500 Classic, EcoDiesel, HEMI, Power Wagon, 2500 and 3500 gas or Cummins setups, GVWR, payload, rear wheels, and VIN lookup.',
    lead: 'The 2022 RAM lineup has a useful mix of half-ton, Classic, and Heavy Duty configurations, but the right truck for a trailer is determined by the individual configuration. Engine badges alone do not identify a safe towing or payload result.',
    why: 'The loaded 2022 chart data reaches up to 12,750 lb for a RAM 1500, 20,000 lb for a RAM 2500, and 37,090 lb for a RAM 3500 when properly equipped. Actual capacity depends on the exact 2022 chart row.',
    headline: '2022 chart maxima: RAM 1500 up to 12,750 lb | RAM 2500 up to 20,000 lb | RAM 3500 up to 37,090 lb',
    sections: [
      { heading: '2022 RAM 1500 and Classic truck differences', paragraphs: ['The 2022 RAM 1500 all-new DT chart is separate from the 2022 RAM 1500 Classic DS chart. Within the all-new truck, EcoDiesel, HEMI, eTorque, 4x2 or 4x4, axle ratio, cab, bed, and GVWR must align with the chart row.', 'A travel trailer can be below the tow rating yet still overload payload with tongue weight, passengers, a weight-distributing hitch, coolers, and cargo. The yellow payload sticker is part of every complete answer.'] },
      { heading: 'Power Wagon, 2500, and 3500 configurations are not interchangeable', paragraphs: ['A 2022 RAM 2500 Power Wagon should use its own chart rows rather than a generic 6.4L 2500 maximum. Gas and Cummins trucks also differ by axle, drive, cab, bed, RamBox, and GVWR.', 'For a 3500, SRW or DRW, standard or High-Output Cummins, GVWR, and hitch type matter most when trailer and pin weight increase. A fifth-wheel or gooseneck decision needs both a trailer-weight and payload calculation.'] },
      { heading: 'Make a 2022 used-truck comparison repeatable', paragraphs: ['Start with the trailer as loaded, then run each truck VIN. That approach filters out trucks that look similar in photos but use different powertrains, axles, or factory ratings.', 'Confirm the truck labels, the hitch system, trailer brakes, tire ratings, and all owner-manual requirements before towing. If RAM Tow shows a range, select or verify the unresolved GVWR or axle detail before relying on the result.'] },
    ],
    check: 'Use the 2022 VIN to identify the exact platform and configuration, then compare loaded tongue or pin weight with the truck payload label and hitch rating.',
    referenceLinks: [
      chartLink('Ram_LD%20DT_Weight%20%26%20Tow_MY22.pdf', 'Open official 2022 RAM 1500 DT towing chart PDF'),
      chartLink('2022_RAM_1500_Towingbua1e6piok25592o597knb5k16.pdf', 'Open official 2022 RAM 1500 Classic DS towing chart PDF'),
      chartLink('Ram_HD_DJ%204x4%20Weight%20%26%20Tow_MY22.pdf', 'Open official 2022 RAM 2500 towing chart PDF'),
      chartLink('Ram_HD_D2%204x4%20Weight%20%26%20Tow_MY22.pdf', 'Open official 2022 RAM 3500 towing chart PDF'),
    ],
    model: '',
  },
  {
    slug: '2023-ram-towing-capacity-guide',
    title: '2023 RAM 1500, 2500, and 3500 Towing Capacity Guide',
    description: 'A detailed 2023 RAM towing guide for 1500 and Heavy Duty trucks, including HEMI, EcoDiesel, gas versus Cummins, Rebel, cab and bed choices, axle ratio, GVWR, payload, and exact VIN lookup.',
    lead: 'The 2023 RAM lineup remains highly configuration-driven. A 1500, 2500, or 3500 result needs the right 2023 chart family, engine, drive, cab, bed, axle ratio, GVWR, rear-wheel setup, and trailer hitch type before it becomes useful.',
    why: 'The loaded 2023 chart data reaches up to 12,750 lb for a RAM 1500, 20,000 lb for a RAM 2500, and 37,090 lb for a RAM 3500 when properly equipped. A shopper should use those maxima only to choose a starting truck class.',
    headline: '2023 chart maxima: RAM 1500 up to 12,750 lb | RAM 2500 up to 20,000 lb | RAM 3500 up to 37,090 lb',
    sections: [
      { heading: 'Understand 2023 RAM 1500 engine and configuration choices', paragraphs: ['A 2023 RAM 1500 can have different chart results based on the available engine, eTorque status, axle, 4x2 or 4x4, cab, and bed. The VIN result is the right starting point because a generic trim listing may omit chart-critical equipment.', 'Trailer tongue weight still counts against payload. That means a truck can have enough tow rating but not enough remaining payload once people, cargo, hitch hardware, and a loaded travel trailer are accounted for.'] },
      { heading: 'Know what makes a 2023 HD result change', paragraphs: ['The 2023 Heavy Duty chart separates 2500 and 3500 rows by gas or diesel configuration, cab, bed, drivetrain, axle, GVWR, and rear wheels. Special configurations, including Rebel and Power Wagon families where applicable, should not inherit a conventional 2500 maximum.', 'A 3500 fifth-wheel or gooseneck candidate also needs actual pin weight and a compatible bed hitch. Use the truck payload sticker and component ratings, not trailer weight alone.'] },
      { heading: 'Use VIN lookup before trusting an online listing', paragraphs: ['Listings can state a model, engine, and trim while leaving out axle ratio, GVWR, or rear wheels. RAM Tow compares the available sticker to the loaded 2023 chart and exposes a range when a critical detail is not clear.', 'Use the chart PDF as the final configuration reference, then confirm the physical truck labels and speak with a RAM expert before a purchase or heavy towing trip.'] },
    ],
    check: 'Run the 2023 VIN, use Trailer Match with actual loaded weights, and verify the door payload label, axle ratio, GVWR, rear wheels, and hitch system.',
    referenceLinks: [
      chartLink('Ram_LD%20DT_Weight%20%26%20Tow_MY23.pdf', 'Open official 2023 RAM 1500 towing chart PDF'),
      chartLink('2023_RAM_2500_3500_HD_TowChart.pdf', 'Open official 2023 RAM 2500 and 3500 towing chart PDF'),
    ],
    model: '',
  },
  {
    slug: '2024-ram-towing-capacity-guide',
    title: '2024 RAM 1500, 2500, and 3500 Towing Capacity Guide',
    description: 'A detailed 2024 RAM towing guide with RAM 1500, 2500, and 3500 chart maxima, HEMI and Cummins setups, SRW and dually choices, GVWR, payload, fifth-wheel planning, and VIN verification.',
    lead: 'A 2024 RAM towing answer must match the exact vehicle to the 2024 RAM 1500 or Heavy Duty chart. Towing capacity, payload, and hitch requirements move with configuration, especially when axle ratio, cab, bed, GVWR, or rear wheels change.',
    why: 'The loaded 2024 chart data reaches up to 12,750 lb for a RAM 1500, 20,000 lb for a RAM 2500, and 37,090 lb for a RAM 3500 when properly equipped. Those are chart headlines, not universal ratings.',
    headline: '2024 chart maxima: RAM 1500 up to 12,750 lb | RAM 2500 up to 20,000 lb | RAM 3500 up to 37,090 lb',
    sections: [
      { heading: 'What matters most on a 2024 RAM 1500', paragraphs: ['The 2024 1500 chart uses distinct engine, axle, drivetrain, cab, and bed rows. A 4x4 truck must use a 4x4 row even when a similar 4x2 configuration advertises a larger maximum number.', 'Use trailer loaded weight and tongue weight together. A travel trailer, family, hitch hardware, and bed gear can use payload quickly, so the exact yellow door-label number is critical.'] },
      { heading: 'What matters most on a 2024 RAM 2500 or 3500', paragraphs: ['For 2500 and 3500 trucks, diesel versus gas is only the beginning. GVWR, cab, bed, drive, axle ratio, rear wheels, and Cummins output need to match the chart. RAM Tow can offer refinement choices where the window sticker does not settle one of those details.', 'For heavy fifth-wheel and gooseneck trailers, calculate actual pin weight and the bed-hitch weight in addition to trailer weight. A 3500 DRW can be appropriate for some combinations, but the door sticker remains authoritative for the individual truck payload.'] },
      { heading: 'How to compare 2024 candidates', paragraphs: ['Use Trailer Match to identify the truck class and configuration family that has planning room for the loaded trailer. Then run the actual VIN for every candidate truck, not one representative VIN.', 'Final confirmation should include the official chart, door labels, receiver or bed-hitch capacity, tires, axles, trailer brakes, and owner materials.'] },
    ],
    check: 'Run the 2024 VIN, resolve any GVWR or axle refinement shown by RAM Tow, and confirm both towing capacity and payload before buying or towing.',
    referenceLinks: [
      chartLink('towing-capacity-guide/brochure/24MY_Ram_1500_Customer_PayTow_2.7.pdf', 'Open official 2024 RAM 1500 towing chart PDF'),
      chartLink('towing-capacity-guide/brochure/my24_Ram_HD_Customer_TowPayChart_3.2.pdf', 'Open official 2024 RAM 2500 and 3500 towing chart PDF'),
    ],
    model: '',
  },
  {
    slug: '2025-ram-towing-capacity-guide',
    title: '2025 RAM 1500, 2500, and 3500 Towing Capacity Guide',
    description: 'A detailed 2025 RAM towing guide covering Pentastar, Hurricane SO and HO, 2500 and 3500 gas or Cummins models, GVWR, SRW or dually setups, payload, and VIN-specific towing results.',
    lead: 'The 2025 RAM lineup changes the 1500 powertrain conversation while keeping Heavy Duty configuration details just as important. The correct towing answer depends on the actual truck, not whether a listing simply says RAM 1500, 2500, or 3500.',
    why: 'The loaded 2025 chart data reaches up to 11,570 lb for a RAM 1500, 19,930 lb for a RAM 2500, and 36,610 lb for a RAM 3500 when properly equipped. The engine, drive, axle, GVWR, and body configuration determine the individual result.',
    headline: '2025 chart maxima: RAM 1500 up to 11,570 lb | RAM 2500 up to 19,930 lb | RAM 3500 up to 36,610 lb',
    sections: [
      { heading: 'Understand the 2025 RAM 1500 engine families', paragraphs: ['The 2025 RAM 1500 chart separates Pentastar V6 eTorque, Hurricane SO, and Hurricane HO trucks. Trim can matter as well: a Hurricane HO Limited is not a RAM 1500 RHO, and the chart result should not blend those separate configurations.', 'Drivetrain, axle, cab, bed, and GVWR remain part of the answer. Use the window sticker and VIN lookup to identify the truck instead of inferring capacity from the engine name.'] },
      { heading: 'Heavy Duty GVWR is a key 2025 detail', paragraphs: ['On a 2025 RAM 2500 or 3500, a sticker may not clearly expose every GVWR or axle detail needed to select one exact row. RAM Tow intentionally presents a range and refinement selection in that situation rather than hiding the uncertainty.', 'For a 3500, Cummins configuration, SRW or DRW, GVWR, axle, cab, and bed can all matter. Towing capacity and door-label payload need to work together, especially for a fifth-wheel or gooseneck.'] },
      { heading: 'Finish with the individual truck labels', paragraphs: ['A manufacturer chart describes a correctly equipped configuration. The payload sticker on the exact truck captures the effect of installed equipment and packages, so it is the final payload check.', 'Before towing, verify the hitch system, trailer brakes, tires, all axle ratings, and the trailer load as it will actually travel.'] },
    ],
    check: 'Run the 2025 VIN, verify Limited versus RHO where Hurricane HO is involved, and use any GVWR or axle selections until the towing and payload result matches the truck labels.',
    referenceLinks: [
      chartLink('towing-capacity-guide/brochure/25MY_Ram_1500_Customer_PayTow_2.0.pdf', 'Open official 2025 RAM 1500 towing chart PDF'),
      chartLink('towing-capacity-guide/brochure/my25_Ram_HD_Customer_TowPayChart_3.65.pdf', 'Open official 2025 RAM 2500 and 3500 towing chart PDF'),
    ],
    model: '',
  },
  {
    slug: '2026-ram-towing-capacity-guide',
    title: '2026 RAM 1500, 2500, and 3500 Towing Capacity Guide',
    description: 'A detailed 2026 RAM towing guide covering 1500 Hurricane, 2500 and 3500 gas or Cummins models, axle ratio, GVWR, SRW or dually selection, payload, trailer hitch choices, and VIN lookup.',
    lead: 'The 2026 RAM lineup has strong headline towing numbers, but a capable truck still needs the correct configuration and payload for the trailer. VIN Lookup matches the available window sticker to the current model-year RAM chart so shoppers can move beyond a generic maximum.',
    why: 'The loaded 2026 chart data reaches up to 11,610 lb for a RAM 1500, 19,930 lb for a RAM 2500, and 36,610 lb for a RAM 3500 when properly equipped. The 4x4 truck in a dealer listing may not match a 4x2 headline configuration.',
    headline: '2026 chart maxima: RAM 1500 up to 11,610 lb | RAM 2500 up to 19,930 lb | RAM 3500 up to 36,610 lb',
    sections: [
      { heading: 'How 2026 RAM 1500 configurations affect towing', paragraphs: ['The 2026 RAM 1500 chart separates the Pentastar V6 eTorque, Hurricane SO, and Hurricane HO configurations. Hurricane HO Limited and RHO rows are distinct, so the window sticker trim information must be read before selecting a capacity.', 'A conventional receiver-hitch trailer also has tongue-weight limits. The RAM chart notes a 1,100 lb maximum conventional Class IV tongue weight, even if a trailer-weight number appears higher, so use the hitch type and actual tongue weight in Trailer Match.'] },
      { heading: 'How 2026 Heavy Duty configurations affect towing', paragraphs: ['RAM 2500 and 3500 results can change by gas or Cummins engine, rear wheels, cab, bed, drive, axle ratio, and GVWR. A 2500 or 3500 badge does not establish one towing capacity.', 'For fifth-wheel and gooseneck work, pin weight, hitch hardware, people, cargo, and accessories count against the exact truck payload. Select a configuration with useful room rather than treating the published maximum as a target.'] },
      { heading: 'Use the current chart and the exact VIN together', paragraphs: ['RAM Tow uses the loaded 2026 source rows to identify the best match. When a sticker lacks a key axle or GVWR value, the tool makes that limitation visible and lets you refine the result.', 'Always compare the final answer to the truck payload sticker, door labels, chart footnotes, hitch equipment, trailer labels, and owner materials before towing.'] },
    ],
    check: 'Run the 2026 VIN, select the correct hitch type and loaded weights, and verify the final towing and payload figures with the exact truck labels and a RAM expert.',
    referenceLinks: [
      chartLink('towing-capacity-guide/brochure/26MY_Ram_1500_PayTow_2.3.pdf', 'Open official 2026 RAM 1500 towing chart PDF'),
      chartLink('towing-capacity-guide/brochure/my26_Ram_HD_Customer_TowPayChart_1.9.pdf', 'Open official 2026 RAM 2500 and 3500 towing chart PDF'),
    ],
    model: '',
  },
];

module.exports = { YEARLINEUP_GUIDE_ARTICLES };
