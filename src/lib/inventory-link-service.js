const { attachInventorySearchLinks } = require('./perkins-service');

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

  const response = await attachInventorySearchLinks([setup], {
    campaign: 'vin_lookup',
    context: 'vin_lookup',
  });

  return response.results[0]?.inventoryLink || null;
}

module.exports = {
  buildInventorySetup,
  getVinInventoryLink,
};
