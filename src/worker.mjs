import { onRequestGet as onHealthGet } from '../functions/api/health.js';
import { onRequestGet as onLookupVinGet } from '../functions/api/lookup-vin/[vin].js';
import { onRequestPost as onMatchConfigPost } from '../functions/api/match-config.js';
import { onRequestPost as onReverseLookupPost } from '../functions/api/reverse-lookup.js';

const STATIC_LANDING_PAGES = new Map([
  ['/ram-2500-towing-capacity', '/ram-2500-towing-capacity/index.html'],
  ['/ram-3500-towing-capacity', '/ram-3500-towing-capacity/index.html'],
  ['/can-a-ram-1500-tow-10000-lbs', '/can-a-ram-1500-tow-10000-lbs/index.html'],
  ['/trailer-fit', '/trailer-fit/index.html'],
]);

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

    const staticPage = STATIC_LANDING_PAGES.get(pathname);
    if (staticPage) {
      const assetUrl = new URL(staticPage, url);
      return withPageCacheHeaders(await env.ASSETS.fetch(new Request(assetUrl, request)), staticPage);
    }

    return withPageCacheHeaders(await env.ASSETS.fetch(request), pathname);
  },
};
