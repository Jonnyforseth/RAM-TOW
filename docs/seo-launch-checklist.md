# RAM Tow Search Launch Checklist

## Google Search Console

1. Open https://search.google.com/search-console/ and add `ramtow.com` as a Domain property.
2. Copy the TXT record Google supplies and add it in the Cloudflare DNS dashboard for `ramtow.com`.
3. Verify the property, open Sitemaps, and submit `https://ramtow.com/sitemap.xml`.
4. Use URL Inspection and request indexing for the home page, `/ram-towing-guides`, and each major towing guide after deployment.
5. Review Page Indexing, Enhancements, and Search Results reports monthly. Fix any crawl, mobile, or structured-data issue before requesting a recrawl.

## Google Analytics

1. Create a Google Analytics 4 web data stream for `https://ramtow.com`.
2. Copy its Measurement ID, which starts with `G-`.
3. In Cloudflare Workers & Pages, open the `ram-tow` worker, then Settings, Variables and Secrets.
4. Add a production text variable named `GA_MEASUREMENT_ID` with the Measurement ID as its value, then redeploy.
5. Confirm Realtime shows a visit. The site records anonymous page views plus `vin_lookup_complete`, `trailer_fit_started`, and `trailer_fit_results_loaded` events. VINs, trailer weights, and user-entered personal information are never sent in those events.

## Ongoing SEO

- Update the sitemap `lastmod` date when a page receives a meaningful content update.
- Request indexing for newly published priority pages through Search Console; sitemap submission is not an instant-ranking guarantee.
- Link relevant Perkins Motors towing content and inventory pages to RAM Tow using descriptive text such as "RAM towing capacity by VIN" rather than generic "click here" links.
- Publish useful model-year, engine, axle-ratio, payload, trailer, and hitch guidance. Do not create thin pages that repeat the same answer for keyword volume.
- Keep the VIN calculator, towing charts, source disclosures, and disclaimer accessible to search crawlers.
