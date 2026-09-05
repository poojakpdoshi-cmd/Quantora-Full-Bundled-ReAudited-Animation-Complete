# Quantora Release Status — Offline Payment Model

## Final payment decision

Quantora has **no online payment system**. Razorpay, Stripe, UPI, cards, QR payments, payment links, and payment webhooks are excluded from the source, dependencies, runtime configuration, and final archive.

The owner collects money offline and then uses the admin panel's **Manual Offline Tokens** control. The administrator can assign a token package or add a custom token amount. Every grant requires a reason or offline reference, uses idempotency protection, and is recorded in the token transaction and audit ledgers.

WhatsApp is available only for payment-free product/service enquiries and manual follow-up. A customer can send a pre-filled enquiry, but Quantora does not request or collect payment details.

## Implemented feature groups

| Group | Status | Important limitation |
|---|---|---|
| Sketch/photo layout extraction | Implemented | Requires a server-side Gemini vision configuration |
| Voice-command editing | Implemented as reviewable proposals | Browser speech support and an AI provider are required |
| Public brand evidence inspection | Implemented | Only public HTTP/HTTPS pages are inspected; private Instagram scraping is not enabled |
| WhatsApp catalogue and order enquiries | Implemented | Payment-free; manual merchant follow-up only |
| Booking requests | Implemented | Calendar event creation remains disabled until Google Calendar OAuth is connected |
| Geo/currency context | Implemented | Currency is display context only; live exchange rates are not collected for payment |
| CMS-backed chatbot | Implemented | Requires a configured server-side AI provider and published CMS content |
| Social campaign generation | Implemented as reviewable drafts | Direct publishing requires platform OAuth and is not automatic |
| Controlled A/B experiments | Implemented as draft experiments and event routes | No automatic winner publishing |
| PWA manifest and service worker | Implemented | Published site must use HTTPS and valid icons |
| Multilingual and RTL proposals | Implemented | Translations must be reviewed before publishing |
| CRO evidence analysis | Implemented | Heuristic evidence only; no fabricated visitor metrics or guaranteed conversion score |

## Validation

The final source passed workspace and API TypeScript checks, all nine regression suites, mobile and admin production builds, Cloudflare Worker dry-run build, root and API production dependency audits, and ZIP integrity verification. The archive contains 18,466 verified files and is approximately 195.43 MB.

The final archive SHA-256 is:

```text
0c0df1bffe42c3bec7372a3c805473f81c366872b157557f66b5d9f5e8964abc
```

The final source scan found no Razorpay, Stripe, payment-link, payment-webhook, card-credential, or CVV code/dependency markers.

## Build and release sequence

First install dependencies and apply the Supabase migrations in order, including `0003_product_growth_features.sql`. Then configure only server-side Gmail, Supabase, and selected AI/provider secrets. Do not add payment-provider credentials.

Run the validation build from the repository root:

```bash
npm install --ignore-scripts
npm run typecheck
npm run typecheck:api
npm test
npm run build
npm run build:api
npm audit --omit=dev
npm --prefix apps/api audit --omit=dev
```

For the full source bundle, run:

```bash
node scripts/package-full-bundle.js
```

For the Android application, synchronize the freshly built mobile web assets into the Capacitor Android project, then build and sign the APK with the project's Android toolchain. The build can be performed now in a configured development environment. Production release should occur only after migrations, Gmail OAuth2, selected AI providers, and staging verification are complete.

## Production verification checklist

Confirm that an administrator can manually grant tokens and that the ledger and audit log update. Confirm that no user-facing route displays a payment form. Confirm that a WhatsApp enquiry contains no payment link or payment instruction. Confirm that provider-dependent features show an unavailable state when credentials are absent. Confirm that CMS proposals, translations, social copy, experiments, and CRO reports require review and do not claim to have published or measured results that were not observed.
