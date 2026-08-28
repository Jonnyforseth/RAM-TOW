# RAM Tow Lead Delivery Setup

VIN results use the daily verified Perkins inventory snapshot to show a direct listing when the searched VIN is currently in stock. All other shoppers can request a Perkins RAM Expert review for towing confirmation and comparable inventory options.

## Required Cloudflare secrets

Set these in the Cloudflare Worker production environment before enabling the new features:

```powershell
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put LEAD_FROM_EMAIL
```

- `RESEND_API_KEY`: API key from Resend. Verify the sender domain before use.
- `LEAD_FROM_EMAIL`: a verified Resend sender, for example `RAM Tow Leads <leads@ramtow.com>`.

The inquiry recipient defaults to `jforseth@perkinsmotors.com`. Set `LEAD_RECIPIENT_EMAIL` as a Worker variable only if that destination changes.

## Local testing

The local server reads an untracked `.env` file from the project root. Create it from `.env.example`, replace the placeholder API key, then restart `npm run dev`. Cloudflare production secrets are separate and are not available at `localhost:4324`.

## Guardrails

- Inquiry events sent to Google Analytics contain no contact information, VIN, trailer values, or pricing.
- The email includes the VIN result only for the Perkins RAM Expert who follows up on the request.
