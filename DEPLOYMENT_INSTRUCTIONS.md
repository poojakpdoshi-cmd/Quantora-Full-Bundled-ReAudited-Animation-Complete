# Quantora Deployment Instructions

## 1. Apply database migrations

Apply every SQL file in `supabase/migrations/` in numeric order to the production Supabase project, including `016_google_search_console.sql`. Do not use the old `apps/api/migrations/` paths.

The migrations create the durable OTP tables and atomic functions, persistent project and lead records, CMS and growth features, encrypted provider credentials, and the one-time Search Console OAuth state table. Review the migration output and confirm that the service-role connection can access the new tables and functions.

## 2. Configure Gmail OAuth2

Create or use a Google Cloud OAuth2 client authorized for the Gmail send scope:

```text
https://www.googleapis.com/auth/gmail.send
```

Set these values only in the server-side secret store. Do not place them in mobile source, public Vite variables, the archive, or `wrangler.toml`:

```text
GMAIL_CLIENT_ID
GMAIL_CLIENT_SECRET
GMAIL_REFRESH_TOKEN
GMAIL_USER_EMAIL=quantoraby.quantacy@gmail.com
EMAIL_PROVIDER=gmail
ENVIRONMENT=production
```

The configured Gmail account must be the authorized Quantora sender. The mobile app only calls the OTP endpoints and never receives Gmail credentials.

## 3. Configure Google Search Console OAuth

Create a separate Google Cloud **Web application** OAuth client for Search Console, enable the Search Console API, and add the exact callback URI for the deployed API:

```text
https://website-maker-ai-api.poojakpdoshi.workers.dev/auth/google/search-console/callback
```

For local testing, use the matching local callback URI:

```text
http://localhost:8787/auth/google/search-console/callback
```

Store these values only as server-side Worker secrets or private Node environment variables. Never put them in mobile source, public Vite variables, the archive, or `wrangler.toml`:

```text
GOOGLE_SEARCH_CONSOLE_CLIENT_ID
GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET
TOKEN_ENCRYPTION_KEY
GOOGLE_SEARCH_CONSOLE_REDIRECT_URI
```

Quantora requests the read-only scope `https://www.googleapis.com/auth/webmasters.readonly`. The user must authorize the Google account that owns or has access to the website property. After authorization, the user selects one verified property per Quantora project. Quantora can then read finalized performance rows, inspect URLs inside that property, and read sitemap status. It does not submit content, change rankings, or guarantee indexing.

## 4. Offline-payment and token policy

Quantora intentionally has no online payment integration. Do not configure Razorpay, Stripe, UPI, card, QR-payment, payment-link, or payment-webhook credentials. Collect money outside Quantora and then use the admin panel's **Manual Offline Tokens** control to assign a package or add tokens. Enter an offline reference or clear administrative reason for every grant. Confirm the grant appears in the token transaction ledger and audit log. Never grant tokens by editing client-side storage.


## 5. Configure the API worker

Set the required non-secret Cloudflare Worker variables and secrets, including the Supabase URL, Supabase service-role key, public API URL, AI provider configuration, and Gmail secrets. Use the documented bindings in `apps/api/wrangler.toml` and `.dev.vars.example` as names only. Do not commit `.dev.vars`, `.env`, refresh tokens, service-role keys, or OAuth client secrets.

Build and deploy the API from the repository root:

```bash
npm install --ignore-scripts
npm run typecheck:api
npm run build:api
npm --prefix apps/api run deploy
```

The dry-run build is not a deployment. Perform the real deploy only after the migrations and server-side secrets are in place.

## 6. Build the mobile and admin clients

```bash
npm run typecheck
npm run build
```

Point the runtime configuration at the deployed API URL. For a Capacitor Android release, sync the generated web assets into the Android project using the existing project workflow, then build/sign the APK with the Android toolchain used by the project.

## 7. Verify the repaired flows

Test the following with a real staging account and a non-production test website before release:

| Flow | Expected evidence |
|---|---|
| Email OTP | Gmail receives the code; the API never returns plaintext OTP; an unavailable database returns an error rather than sending an email |
| CMS Blueprint | A proposal is displayed first; approval creates draft documents and revisions; cancel creates nothing |
| Lead CRM | A real public form submission appears in the authenticated project inbox; status changes survive reload |
| Form builder | GET loads the saved configuration; PUT persists edits and returns the public form key |
| SEO dashboard | Audit values come from the API; live crawl shows observed evidence; the user can authorize Search Console, select a verified property, and load real analytics/index-inspection/sitemap data |
| Manual offline tokens | An admin assigns a package or custom amount with a reason; the token ledger and audit log update; no payment form appears |
| WhatsApp enquiries | A catalogue enquiry is stored and the WhatsApp message contains no payment link or payment instruction |
| AI and growth tools | Provider-dependent actions show a truthful unavailable state when credentials are missing; proposals are reviewable before publishing |

## 8. SEO expectations

Quantora can generate and audit technical SEO assets, inspect the published site, and display connected Search Console data. It cannot guarantee Google indexing, ranking position, impressions, or traffic. Google controls crawling, indexing, eligibility, and ranking decisions.

## 9. Release archive

The clean packager is cross-platform and excludes `node_modules`, build output, generated runtime directories, environment files, and the archive itself:

```bash
node scripts/package-clean-distribution.js
```

By default it creates `Quantora.zip` in the repository root. A different destination can be selected without editing source code:

```bash
OUTPUT_ZIP=/absolute/path/Quantora.zip node scripts/package-clean-distribution.js
```

The script verifies that expected staged files are present and forbidden files are absent before reporting success.

## 10. 3D / 4D / 5D Spatial Studio

The spatial feature uses migration `0003_product_growth_features.sql` and stores approved blueprints in the `project_feature_configs` table under `feature_key = spatial`. A user selects 3D, 4D, or 5D, enters a design brief, requests a proposal, and may reject it with feedback for up to three rounds. Approval persists the blueprint. The user can then send the approved blueprint to the website builder and review the prompt before generation.

Spatial blueprint research requires a configured server-side AI provider. If no provider is available, the UI displays an unavailable error instead of claiming that research completed. The generated runtime is procedural and lightweight; it includes reduced-motion behavior, offscreen render pausing, and a non-spatial content path. Device orientation and haptics are optional and should be permission-tested on real mobile hardware.

Do not promise a fixed 60 FPS or 120 FPS on every smartphone. Validate at least one flagship, one mid-range, and one budget Android/iOS device, including reduced-motion mode, denied sensor permission, offline mode, and a device without WebGL.
