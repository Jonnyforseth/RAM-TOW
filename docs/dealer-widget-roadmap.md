# Dealer Widget Roadmap

Last updated: 2026-08-22

## Status

Deferred until Perkins Motors completes its planned website-provider change, expected in roughly 30-60 days. Do not begin a production Remora integration before the new provider, its vehicle-detail-page template, lead-form hooks, and CRM routing are confirmed.

## Product Opportunity

Package RAM Tow as a dealer-facing subscription product that places a towing and payload tool on RAM vehicle-detail pages. The customer stays on the dealer website, receives a VIN-specific chart result, and can ask the dealer to confirm the exact truck and trailer match.

The product should be useful to Perkins Motors first, then configurable for other RAM dealers without exposing dealer data or sending leads to the wrong store.

## Intended Customer Experience

1. A shopper views a supported 2023+ RAM 1500, 2500, or 3500 vehicle-detail page.
2. A prominent `Check Towing & Payload` button opens a dealer-branded modal.
3. The modal receives the vehicle VIN, stock number, title, and vehicle-detail-page URL from the dealer site.
4. RAM Tow returns chart-backed towing and payload guidance for that VIN.
5. The shopper can enter loaded trailer weight, tongue or pin weight, and hitch type.
6. If the truck fits, the shopper can request an exact confirmation from a dealership RAM expert.
7. If it does not fit, the shopper can open RAM Tow's trailer-fit page with the trailer inputs already populated.

## Lead Requirement

The confirmation lead must be permission-based and sent only to the dealer whose site hosts the widget. The final production lead should use that dealer's existing CRM or native website form whenever possible.

Required lead data:

- Customer name, email, phone, and explicit contact consent.
- Dealer identifier and source domain.
- VIN, stock number, vehicle title, and vehicle-detail-page URL.
- RAM Tow towing-capacity and payload result.
- Trailer weight, tongue or pin weight, and hitch type when supplied.
- A clear note: `Customer requests an exact towing capacity and trailer-capability confirmation from a RAM expert. Verify VIN, axle ratio, GVWR, payload label, hitch equipment, and applicable RAM tow chart.`

RAM Tow should not silently route leads based on IP location. For a public marketplace version, let a shopper select a ZIP code or participating dealer with clear disclosure. For an embedded dealer widget, always route to the host dealer.

## Technical Direction

Start with a hosted iframe modal because it is the easiest path across different dealer website providers and avoids CSS or JavaScript conflicts. The host vehicle-detail page renders a trigger with explicit data attributes, rather than RAM Tow scraping the page.

Example host markup:

```html
<button
  class="ram-tow-trigger"
  data-vin="1C6SRFJT8TN278010"
  data-stock="556706"
  data-title="2026 RAM 1500 Laramie"
  data-vdp-url="https://dealer.example/vehicle-page">
  Check Towing & Payload
</button>
```

The production service needs:

- A dealer/tenant configuration record with name, logo, colors, phone, domains, lead destination, and UTM defaults.
- Approved-origin checks for embedded pages.
- Dealer-specific signed embed configuration, with no private CRM credentials exposed in browser code.
- A server-side CRM/webhook connector or a handoff to the dealer's native form.
- Event tracking for widget open, VIN result, trailer check, confirmation request, inventory click, and completed lead.
- A noindex, password-protected demo route for every dealer prospect.

## Perkins Preview

Build later at a noindex route such as `/perkins-widget-preview`. Use a real Perkins RAM VIN and visually demonstrate the VDP button, modal, VIN result, trailer inputs, trailer-fit fallback, and a mock confirmation form.

The preview must not submit customer contact information to a live CRM until the provider confirms its supported lead-form or API integration. A test endpoint or confirmation-state mock is sufficient for the initial presentation.

## Provider Discovery Checklist

Before connecting to Perkins' replacement provider, obtain:

- Vehicle-detail-page template access or a supported custom-code placement method.
- VIN, stock number, title, and VDP URL template variables.
- Approved external-script and iframe domains.
- The supported way to open a native lead form from a custom button.
- Hidden-field or notes-field support for RAM Tow context.
- A test/sandbox lead destination and confirmation of the destination CRM.
- Content-security-policy, accessibility, and performance requirements.

## Commercial Model To Revisit

- Monthly dealer subscription based on number of locations or RAM VDP volume.
- Setup fee for branding, CRM connection, and provider-specific installation.
- Optional managed content/SEO landing pages for RAM towing questions.
- Dealer dashboard with attributed leads, widget conversion, VIN lookups, trailer-fit searches, and inventory clicks.
- Use Perkins as the reference implementation and case study only after consent and measurable results.

## Next Resume Point

When Perkins selects its new website provider, confirm the provider discovery checklist first. Then build the Perkins preview, validate lead payloads in a sandbox, and only then turn the embed into a reusable multi-dealer subscription product.
