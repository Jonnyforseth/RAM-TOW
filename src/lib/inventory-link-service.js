const { attachInventorySearchLinks } = require('./perkins-service');

function buildUsedVinInventoryLink(spec = {}) {
  const model = String(spec.model || '');
  if (!['1500', '2500', '3500'].includes(model)) {
    return null;
  }

  const url = new URL('https://perkinsmotors.com/advanced-search');
  url.searchParams.set('condition', 'used');
  url.searchParams.set('make', 'Ram');
  url.searchParams.set('model', model);
  url.searchParams.set('utm_source', 'ramtow.com');
  url.searchParams.set('utm_medium', 'referral');
  url.searchParams.set('utm_campaign', 'vin_lookup_used');
  url.searchParams.set('utm_content', `vin_lookup_used_ram-${model}`);

  return {
    url: url.toString(),
    applied: [`Used RAM ${model}`],
    inventoryType: 'used',
  };
}

function buildInventorySetup(spec = {}, matches = {}) {
  const towMatch = matches.towMatches?.[0] || null;
  const payloadMatch = matches.payloadMatches?.[0] || null;

  return {
    model: towMatch?.model || payloadMatch?.model || spec.model || null,
    engine: towMatch?.engine || payloadMatch?.engine || spec.engine || null,
    drive: towMatch?.drive || payloadMatch?.drive || spec.drive || null,
    cab: towMatch?.cab || payloadMatch?.cab || spec.cab || null,
    bed: towMatch?.bed || payloadMatch?.bed || spec.bed || null,
    rearWheels: towMatch?.rearWheels || payloadMatch?.rearWheels || spec.rearWheels || null,
    axleRatio: towMatch?.axleRatio || spec.axleRatio || null,
    trim: spec.trim || towMatch?.trim || payloadMatch?.trim || null,
  };
}

async function getVinInventoryLink(spec, matches) {
  const setup = buildInventorySetup(spec, matches);
  if (!setup.model) {
    return null;
  }

  if (Number(spec.year) <= 2025) {
    return buildUsedVinInventoryLink(spec);
  }

  const response = await attachInventorySearchLinks([setup], {
    campaign: 'vin_lookup',
    context: 'vin_lookup',
  });

  return response.results[0]?.inventoryLink || null;
}

module.exports = {
  buildInventorySetup,
  buildUsedVinInventoryLink,
  getVinInventoryLink,
};
