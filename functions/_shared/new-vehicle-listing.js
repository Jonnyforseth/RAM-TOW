const MAX_CANDIDATE_PAGES = 3;

function normalizeVin(value) {
  return String(value || '').toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
}

function toNumber(value) {
  const cleaned = String(value ?? '').replace(/[^0-9.-]/g, '');
  const number = Number(cleaned);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripTags(html) {
  return decodeHtml(String(html || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim());
}

function isSafeListingUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || !host || host === 'localhost' || host.endsWith('.localhost')) {
      return false;
    }
    if (/^(?:127\.|10\.|192\.168\.|169\.254\.|0\.|\[?::1\]?)/.test(host)) {
      return false;
    }
    return true;
  } catch (_error) {
    return false;
  }
}

function collectJsonLdBlocks(html) {
  const blocks = [];
  for (const match of String(html || '').matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch (_error) {
      // Ignore malformed structured data from a dealer listing.
    }
  }
  return blocks;
}

function walkJson(value, visit) {
  if (Array.isArray(value)) {
    value.forEach((item) => walkJson(item, visit));
    return;
  }
  if (!value || typeof value !== 'object') {
    return;
  }
  visit(value);
  Object.values(value).forEach((item) => walkJson(item, visit));
}

function newConditionValue(value) {
  return /newcondition|\bnew\b/i.test(String(value || ''));
}

function listingFromHtml(html, url, vin) {
  const normalizedVin = normalizeVin(vin);
  const text = stripTags(html);
  if (!normalizedVin || !new RegExp(normalizedVin, 'i').test(text.replace(/[^A-HJ-NPR-Z0-9]/gi, ''))) {
    return null;
  }

  let structuredPrice = null;
  let newCondition = /\bnew\s+(?:ram|vehicle|truck)\b/i.test(text);
  let title = decodeHtml(String(html || '').match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '').trim();

  for (const block of collectJsonLdBlocks(html)) {
    walkJson(block, (node) => {
      if (title || !node?.name) {
        title = title || '';
      } else {
        title = String(node.name);
      }
      const offers = Array.isArray(node?.offers) ? node.offers : [node?.offers];
      for (const offer of offers.filter(Boolean)) {
        structuredPrice ||= toNumber(offer.price || offer.lowPrice);
        newCondition ||= newConditionValue(offer.itemCondition);
      }
      newCondition ||= newConditionValue(node?.itemCondition || node?.vehicleCondition);
    });
  }

  const visiblePrice = toNumber(
    String(html || '').match(/(?:final-price|internet-price|sale-price|our-price)[^>]*>\s*\$?\s*([\d,]+)/i)?.[1]
  );
  const price = structuredPrice || visiblePrice;
  if (!newCondition || !price) {
    return null;
  }

  return {
    vin: normalizedVin,
    price,
    url,
    title: title.replace(/\s+/g, ' ').trim() || 'New RAM listing',
    seller: new URL(url).hostname.replace(/^www\./i, ''),
  };
}

async function searchBraveForVin(vin, apiKey) {
  const query = `"${vin}" "new" RAM`;
  const url = new URL('https://api.search.brave.com/res/v1/web/search');
  url.searchParams.set('q', query);
  url.searchParams.set('count', '10');

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'X-Subscription-Token': apiKey,
    },
  });
  if (!response.ok) {
    throw new Error(`New-listing search is temporarily unavailable (${response.status}).`);
  }

  const payload = await response.json();
  return (payload?.web?.results || [])
    .map((result) => result?.url)
    .filter(isSafeListingUrl)
    .filter((resultUrl) => !/perkinsmotors\.com/i.test(resultUrl));
}

export async function findPublicNewVehicleListing(vin, env) {
  const normalizedVin = normalizeVin(vin);
  const apiKey = String(env?.BRAVE_SEARCH_API_KEY || '').trim();
  if (!apiKey) {
    return { state: 'not_configured', listing: null };
  }

  const candidateUrls = await searchBraveForVin(normalizedVin, apiKey);
  for (const url of candidateUrls.slice(0, MAX_CANDIDATE_PAGES)) {
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': 'RAM-Tow-Comparison/1.0 (+https://ramtow.com)' },
      });
      if (!response.ok) {
        continue;
      }
      const listing = listingFromHtml(await response.text(), url, normalizedVin);
      if (listing) {
        return { state: 'found', listing };
      }
    } catch (_error) {
      // A single dealer page should not block the shopper's VIN result.
    }
  }

  return { state: 'not_found', listing: null };
}
