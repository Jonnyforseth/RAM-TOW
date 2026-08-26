export const PERKINS_INVENTORY_SNAPSHOT_NAME = 'perkins-daily-verified-inventory';
export const PERKINS_INVENTORY_SNAPSHOT_MAX_AGE_MS = 26 * 60 * 60 * 1000;

function getSnapshotStub(env) {
  const binding = env?.PERKINS_INVENTORY_SNAPSHOT;
  if (!binding) {
    return null;
  }
  return binding.get(binding.idFromName(PERKINS_INVENTORY_SNAPSHOT_NAME));
}

async function readJson(response) {
  if (!response.ok) {
    throw new Error(`Verified inventory snapshot request failed with ${response.status}.`);
  }
  return response.json();
}

export async function getPerkinsInventorySnapshot(env) {
  const stub = getSnapshotStub(env);
  if (!stub) {
    return { configured: false, snapshot: null, status: null };
  }

  const payload = await readJson(await stub.fetch('https://inventory-snapshot/snapshot'));
  return {
    configured: true,
    snapshot: payload.snapshot || null,
    status: payload.status || null,
  };
}

export async function schedulePerkinsInventoryRefresh(env) {
  const stub = getSnapshotStub(env);
  if (!stub) {
    return { configured: false, scheduled: false };
  }

  const payload = await readJson(await stub.fetch('https://inventory-snapshot/refresh-if-stale'));
  return {
    configured: true,
    scheduled: Boolean(payload.scheduled),
    status: payload.status || null,
  };
}
