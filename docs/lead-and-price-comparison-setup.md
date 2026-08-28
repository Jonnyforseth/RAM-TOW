# RAM Tow Lead And New-Vehicle Comparison Setup

The VIN result page has two optional commerce features:

- Exact Perkins stock match: uses the existing daily verified inventory snapshot. No additional configuration is required.
- Lower-priced comparable new RAM: validates a public exact-VIN listing as new with a visible price, then shows a Perkins option only when its verified configuration score is at least 80% and its advertised price is lower.

## Required Cloudflare secrets

Set these in the Cloudflare Worker production environment before enabling the new features:

```powershell
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put BRAVE_SEARCH_API_KEY
npx wrangler secret put LEAD_FROM_EMAIL
```

- `RESEND_API_KEY`: API key from Resend. Verify the sender domain before use.
- `BRAVE_SEARCH_API_KEY`: Brave Search API subscription token. This is used only to discover public exact-VIN new-vehicle listing pages.
- `LEAD_FROM_EMAIL`: a verified Resend sender, for example `RAM Tow Leads <leads@ramtow.com>`.

The inquiry recipient defaults to `jforseth@perkinsmotors.com`. Set `LEAD_RECIPIENT_EMAIL` as a Worker variable only if that destination changes.

## Guardrails

- The comparison endpoint skips VINs already found in the Perkins daily inventory snapshot.
- It does not show a card unless the public listing explicitly confirms the exact VIN, new condition, and advertised price.
- Perkins candidates must match known towing-critical configuration fields: model, engine, drivetrain, cab, bed, rear-wheel setup, and axle ratio when available.
- The external listing URL and VIN are not sent to Google Analytics. Inquiry events also contain no contact information, VIN, trailer values, or pricing.
- The card is intentionally hidden when no lower-priced qualifying Perkins option is found.
