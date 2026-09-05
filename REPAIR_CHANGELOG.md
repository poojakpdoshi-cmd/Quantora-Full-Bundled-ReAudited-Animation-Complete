# Quantora Repair Changelog

## Scope

This release repairs the confirmed defects documented in the Quantora full audit. The work preserves the existing Gmail OAuth2 OTP design, does not embed production secrets, and does not promise Google indexing or rankings.

## Backend repairs

The OTP pipeline now fails closed when durable rate limiting, OTP verification, OTP persistence, or subscriber provisioning is unavailable. In test mode only, the regression harness may use its explicit in-memory fallback. OTP delivery remains Gmail REST API OAuth2 through the configured official Quantora sender.

The CMS API now exposes a real `/cms/projects/:projectId/blueprint` proposal-and-approval flow. The proposal is generated from project data, and approval persists draft CMS documents and revisions while preserving existing matching documents. The CMS Content Assistant now calls configured server-side Gemini, Groq, or Cloudflare AI providers, validates structured JSON output, rejects fabricated unsupported claims, and returns 503 when no provider is configured instead of silently using template copy.

Lead CRM routes now persist project-owned lead records and form configuration. Public form submissions continue to be stored in `form_submissions` and now also create a lead record when recognizable contact fields are present. Lead status updates and form configuration writes enforce authenticated project ownership.

The SEO API now includes a live crawl route that returns observed HTTP status, final URL, title, meta description, canonical URL, `robots.txt`, and `sitemap.xml` status. The crawl validates public URLs and rejects local/private targets.

## Mobile repairs

The SEO dashboard no longer displays fabricated SEO scores, indexing counts, impressions, rankings, Core Web Vitals, sample keywords, or fake crawl results. It loads the project audit from the API, displays loading/error/unavailable states, runs the real live crawl, exports actual findings, and labels Google Search Console data as unavailable until a real connection exists.

The Lead CRM no longer seeds sample leads. It loads project leads from the backend, persists status changes, loads saved form configuration, and saves form-builder edits through the authenticated API. Empty and loading states are displayed when no records are available.

The CMS AI Blueprint button now requests a proposal, displays the proposed collections/documents for review, and only creates drafts after explicit approval. The CMS reloads after approval.

## Packaging and dependencies

The clean distribution packager now uses cross-platform Node.js ZIP creation with archive-content verification. Legacy Windows-only wrapper scripts now delegate to the verified packager. The output excludes dependencies, builds, generated runtime directories, environment files, and the archive itself.

Hono was upgraded to the patched `^4.12.34` range in both API consumers. The production-only dependency audit reports zero vulnerabilities.

## Validation completed

| Check | Result |
|---|---|
| Workspace TypeScript checks | Passed |
| API TypeScript check | Passed |
| Nine regression suites | Passed |
| Mobile production build | Passed |
| Admin production build | Passed |
| Cloudflare Worker dry-run build | Passed |
| `npm audit --omit=dev` | Passed — 0 vulnerabilities |
| Clean archive content verification | Passed — 333 files verified |

## Offline-payment correction

The implementation now follows the owner's offline-payment model. Razorpay, Stripe, UPI, card forms, QR-payment prompts, payment links, and payment webhooks are excluded. The admin panel retains **Manual Offline Tokens**: an authorized administrator can assign a package or add a token amount after collecting money offline. Grants require a reason or offline reference, use idempotency protection, and are written to the token and audit ledgers.

## Feature implementation additions

The API now includes authenticated AI vision layout extraction, voice-edit proposal parsing, public brand evidence inspection, payment-free WhatsApp catalog and order enquiries, booking configuration and requests, geo/currency display context, published-CMS chatbot responses, social campaign proposals, draft A/B experiments, PWA manifest generation, localization proposals with RTL direction metadata, and deterministic CRO evidence analysis. Provider-dependent actions return truthful unavailable responses until their server-side credentials are configured.

## 3D / 4D / 5D Spatial Studio

Quantora now includes a Spatial Studio with 3D, 4D, and 5D dimension selection, server-side blueprint proposals, explicit approval, up to three research/feedback rounds, and a builder handoff. The generated website runtime uses a lightweight procedural canvas atmosphere, optional 5D device-orientation response, reduced-motion handling, an offscreen `IntersectionObserver` pause, and an accessible non-spatial content path. It does not claim guaranteed 60/120 FPS on every phone; adaptive tiers and a CSS/content fallback are used instead.

Approved plans are persisted under the `spatial` project feature configuration. The generated runtime is activated for prompts or plans containing spatial/3D/4D/5D signals. No online-payment behavior was added.
