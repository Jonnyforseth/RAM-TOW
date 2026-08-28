import { onRequestGet as onHealthGet } from '../functions/api/health.js';
import { onRequestGet as onLookupVinGet } from '../functions/api/lookup-vin/[vin].js';
import { onRequestPost as onMatchConfigPost } from '../functions/api/match-config.js';
import { onRequestPost as onReverseLookupPost } from '../functions/api/reverse-lookup.js';
import { onRequestPost as onPerkinsCapableInventoryPost } from '../functions/api/perkins-capable-inventory.js';
import { onRequestPost as onCompareNewVinPost } from '../functions/api/compare-new-vin.js';
import { onRequestPost as onLeadPost } from '../functions/api/lead.js';
import { json } from '../functions/_shared/http.js';
import { PERKINS_INVENTORY_SNAPSHOT_MAX_AGE_MS, PERKINS_INVENTORY_SNAPSHOT_NAME, schedulePerkinsInventoryRefresh } from '../functions/_shared/perkins-inventory-snapshot.js';
import perkinsService from './lib/perkins-service.js';

const { buildVerifiedInventorySnapshot, INVENTORY_SNAPSHOT_VERSION } = perkinsService;
const DAILY_REFRESH_MS = 24 * 60 * 60 * 1000;

function snapshotIsStale(snapshot) {
  const generatedAt = Date.parse(snapshot?.generatedAt || '');
  return Number(snapshot?.version) !== INVENTORY_SNAPSHOT_VERSION || !Number.isFinite(generatedAt) || Date.now() - generatedAt >= PERKINS_INVENTORY_SNAPSHOT_MAX_AGE_MS;
}

export class PerkinsInventorySnapshot {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  async getStatus() {
    return (await this.ctx.storage.get('status')) || null;
  }

  async scheduleRefreshIfNeeded() {
    const snapshot = await this.ctx.storage.get('snapshot');
    const status = await this.getStatus();
    if (!snapshotIsStale(snapshot) || status?.state === 'refreshing') {
      return { scheduled: false, status };
    }

    await this.ctx.storage.setAlarm(Date.now() + 250);
    return { scheduled: true, status };
  }

  async fetch(request) {
    const pathname = new URL(request.url).pathname;
    if (pathname === '/snapshot') {
      return json({
        ok: true,
        snapshot: (await this.ctx.storage.get('snapshot')) || null,
        status: await this.getStatus(),
      });
    }

    if (pathname === '/refresh-if-stale') {
      const refresh = await this.scheduleRefreshIfNeeded();
      return json({ ok: true, ...refresh });
    }

    return json({ ok: false, error: 'Not found.' }, { status: 404 });
  }

  async alarm() {
    await this.ctx.storage.put('status', {
      state: 'refreshing',
      startedAt: new Date().toISOString(),
      error: null,
    });

    try {
      const snapshot = await buildVerifiedInventorySnapshot();
      await this.ctx.storage.put('snapshot', snapshot);
      await this.ctx.storage.put('status', {
        state: 'ready',
        completedAt: new Date().toISOString(),
        generatedAt: snapshot.generatedAt,
        checkedCount: snapshot.checkedCount,
        verifiedCount: snapshot.verifiedCount,
        error: null,
      });
      await this.ctx.storage.setAlarm(Date.now() + DAILY_REFRESH_MS);
    } catch (error) {
      await this.ctx.storage.put('status', {
        state: 'failed',
        completedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error || 'Inventory refresh failed.'),
      });
      // Retry a failed ingestion without making shoppers trigger a new scrape.
      await this.ctx.storage.setAlarm(Date.now() + 60 * 60 * 1000);
    }
  }
}

const STATIC_LANDING_PAGES = new Map([
  ['/ram-2500-towing-capacity', '/ram-2500-towing-capacity/index.html'],
  ['/ram-3500-towing-capacity', '/ram-3500-towing-capacity/index.html'],
  ['/can-a-ram-1500-tow-10000-lbs', '/can-a-ram-1500-tow-10000-lbs/index.html'],
  ['/privacy', '/privacy/index.html'],
  ['/how-ramtow-calculates-towing-capacity', '/how-ramtow-calculates-towing-capacity/index.html'],
  ['/trailer-fit', '/trailer-fit/index.html'],
  ['/ram-towing-guides', '/ram-towing-guides/index.html'],
  ['/ram-towing-questions', '/ram-towing-questions/index.html'],
  ['/ram-1500-towing-capacity', '/ram-1500-towing-capacity/index.html'],
  ['/ram-1500-hemi-vs-hurricane-towing', '/ram-1500-hemi-vs-hurricane-towing/index.html'],
  ['/ram-2500-6-4-hemi-towing-capacity', '/ram-2500-6-4-hemi-towing-capacity/index.html'],
  ['/ram-2500-cummins-towing-capacity', '/ram-2500-cummins-towing-capacity/index.html'],
  ['/ram-3500-srw-vs-dually-towing', '/ram-3500-srw-vs-dually-towing/index.html'],
  ['/how-to-find-ram-axle-ratio-by-vin', '/how-to-find-ram-axle-ratio-by-vin/index.html'],
]);

async function pageResponse(response, pathname) {
  return withPageCacheHeaders(response, pathname);
}

function methodNotAllowed() {
  return new Response(JSON.stringify({ ok: false, error: 'Method not allowed.' }), {
    status: 405,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  });
}

function withPageCacheHeaders(response, pathname) {
  const shouldRevalidate = pathname === '/' || pathname.endsWith('.html') || pathname === '/styles.css';
  if (!shouldRevalidate) {
    return response;
  }

  const headers = new Headers(response.headers);
  // Avoid a stale document referencing an older stylesheet after a deployment.
  headers.set('cache-control', 'no-cache, must-revalidate');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (url.hostname.toLowerCase() === 'www.ramtow.com') {
      url.hostname = 'ramtow.com';
      return Response.redirect(url.toString(), 301);
    }

    if (request.method === 'GET' && pathname.length > 1 && pathname.endsWith('/')) {
      const canonicalPath = pathname.slice(0, -1);
      if (STATIC_LANDING_PAGES.has(canonicalPath)) {
        url.pathname = canonicalPath;
        return Response.redirect(url.toString(), 301);
      }
      if (canonicalPath.startsWith('/ram-towing-guides/')) {
        url.pathname = canonicalPath;
        return Response.redirect(url.toString(), 301);
      }
    }

    if (pathname === '/api/health') {
      if (request.method !== 'GET') {
        return methodNotAllowed();
      }
      return onHealthGet({ request, env });
    }

    if (pathname.startsWith('/api/lookup-vin/')) {
      if (request.method !== 'GET') {
        return methodNotAllowed();
      }
      const vin = pathname.slice('/api/lookup-vin/'.length).trim();
      return onLookupVinGet({
        request,
        env,
        params: { vin: decodeURIComponent(vin) },
      });
    }

    if (pathname === '/api/match-config') {
      if (request.method !== 'POST') {
        return methodNotAllowed();
      }
      return onMatchConfigPost({ request, env });
    }

    if (pathname === '/api/reverse-lookup') {
      if (request.method !== 'POST') {
        return methodNotAllowed();
      }
      return onReverseLookupPost({ request, env });
    }

    if (pathname === '/api/perkins-capable-inventory') {
      if (request.method !== 'POST') {
        return methodNotAllowed();
      }
      return onPerkinsCapableInventoryPost({ request, env });
    }

    if (pathname === '/api/compare-new-vin') {
      if (request.method !== 'POST') {
        return methodNotAllowed();
      }
      return onCompareNewVinPost({ request, env });
    }

    if (pathname === '/api/lead') {
      if (request.method !== 'POST') {
        return methodNotAllowed();
      }
      return onLeadPost({ request, env });
    }

    const staticPage = STATIC_LANDING_PAGES.get(pathname);
    if (staticPage) {
      const assetUrl = new URL(staticPage, url);
      return pageResponse(await env.ASSETS.fetch(new Request(assetUrl, request)), staticPage);
    }

    if (pathname.startsWith('/ram-towing-guides/')) {
      const guideAsset = new URL(`${pathname}/index.html`, url);
      return pageResponse(await env.ASSETS.fetch(new Request(guideAsset, request)), guideAsset.pathname);
    }

    return pageResponse(await env.ASSETS.fetch(request), pathname);
  },

  async scheduled(_controller, env) {
    // The Durable Object decides whether the daily snapshot is stale. The
    // four-hour cron is only a resilient wake-up and does not rescan daily data.
    await schedulePerkinsInventoryRefresh(env);
  },
};
