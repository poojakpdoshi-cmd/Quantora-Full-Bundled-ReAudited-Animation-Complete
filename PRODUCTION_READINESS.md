# QUANTORA — PRODUCTION READINESS CONFIGURATION MATRIX

**Author & Creator**: Poojak Doshi  
**Application**: Quantora  
**Release Target**: Production Release Candidate 1.0  
**Last Audited**: August 15, 2026

---

## 1. Environment Variable Classification Matrix

All environment variables used across the frontend clients, backend API workers, database, AI providers, and deployment integrations are classified below with strict scope isolation.

| Environment Variable | Component | Classification | Scope | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Frontend (`@wmai/mobile`, `@wmai/admin`) | **REQUIRED** | `CLIENT-SAFE` | Production API endpoint URL for generation, chat, and project synchronization. |
| `APP_NAME` | Backend (`apps/api`) | **REQUIRED** | `SERVER-ONLY` | Platform name branding header (`Quantora`). |
| `PUBLIC_API_BASE_URL` | Backend (`apps/api`) | **REQUIRED** | `SERVER-ONLY` | Canonical public API base URL used for webhook callbacks and form submission endpoints. |
| `SUPABASE_URL` | Backend (`apps/api`, Node API) | **REQUIRED** | `SERVER-ONLY` | Supabase endpoint URL for server-side queries. |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend (`apps/api`, Node API) | **REQUIRED** | `SERVER-ONLY` | Elevated backend service-role key for server-side database access and custom session storage; not used for subscriber email delivery. |
| `GMAIL_CLIENT_ID` | Backend (`apps/api`, Node API) | **REQUIRED** | `SERVER-ONLY` | Google OAuth2 client ID for the official Gmail REST sender. |
| `GMAIL_CLIENT_SECRET` | Backend (`apps/api`, Node API) | **REQUIRED** | `SERVER-ONLY` | Google OAuth2 client secret for the official Gmail REST sender. |
| `GMAIL_REFRESH_TOKEN` | Backend (`apps/api`, Node API) | **REQUIRED** | `SERVER-ONLY` | Server-only refresh token with the `gmail.send` scope. |
| `GMAIL_USER_EMAIL` | Backend (`apps/api`, Node API) | **REQUIRED** | `SERVER-ONLY` | Fixed official sender address `quantoraby.quantacy@gmail.com`. |
| `ENVIRONMENT` | Backend (`apps/api`, Node API) | **REQUIRED** | `SERVER-ONLY` | Production mode; non-test OTP delivery fails closed to Gmail only. |
| `ADMIN_USERNAME` | Backend (`apps/api`) | **REQUIRED** | `SERVER-ONLY` | Administrative operator username for back-office portal access. |
| `ADMIN_PASSWORD_SALT` | Backend (`apps/api`) | **REQUIRED** | `SERVER-ONLY` | Cryptographic salt for PBKDF2 administrative authentication. |
| `ADMIN_PASSWORD_HASH` | Backend (`apps/api`) | **REQUIRED** | `SERVER-ONLY` | SHA-512 derived hash for administrative credentials. |
| `ADMIN_PASSWORD_ITERATIONS` | Backend (`apps/api`) | **REQUIRED** | `SERVER-ONLY` | Work factor iterations for administrative password verification ($\ge 100,000$). |
| `TOKEN_ENCRYPTION_KEY` | Backend (`apps/api`) | **REQUIRED** | `SERVER-ONLY` | AES-GCM-256 master key for encrypting user OAuth provider tokens in database storage. |
| `GEMINI_API_KEY` | AI Providers | **OPTIONAL** | `SERVER-ONLY` | Google Gemini API key for multimodal reasoning and code generation fallback. |
| `GEMINI_MODEL` | AI Providers | **OPTIONAL** | `SERVER-ONLY` | Model identifier for Gemini (`gemini-2.0-flash` or `gemini-1.5-pro`). |
| `ARCEE_API_KEY` | AI Providers | **OPTIONAL** | `SERVER-ONLY` | Arcee AI API key for autonomous visual QA and code review agents. |
| `ARCEE_QA_MODEL` | AI Providers | **OPTIONAL** | `SERVER-ONLY` | Model identifier for Arcee QA pipeline (`trinity-mini`). |
| `QA_PROVIDER` | AI Providers | **OPTIONAL** | `SERVER-ONLY` | Designated QA provider selector (`arcee` or `internal`). |
| `GROQ_API_KEY` | AI Providers | **OPTIONAL** | `SERVER-ONLY` | Groq LPU API key for ultra-fast code generation and agent repair. |
| `GROQ_CODER_MODEL` | AI Providers | **OPTIONAL** | `SERVER-ONLY` | Coder model designation (`openai/gpt-oss-120b`). |
| `GROQ_REVIEWER_MODEL` | AI Providers | **OPTIONAL** | `SERVER-ONLY` | Reviewer model designation (`qwen/qwen3-32b`). |
| `CLOUDFLARE_REPAIR_MODEL` | AI Providers | **OPTIONAL** | `SERVER-ONLY` | Cloudflare Workers AI repair model (`@cf/qwen/qwen3-30b-a3b-fp8`). |
| `GITHUB_CLIENT_ID` | OAuth / Deployment | **OPTIONAL** | `SERVER-ONLY` | GitHub OAuth App client ID for repository publishing and sync. |
| `GITHUB_CLIENT_SECRET` | OAuth / Deployment | **OPTIONAL** | `SERVER-ONLY` | GitHub OAuth App client secret. |
| `GITHUB_REDIRECT_URI` | OAuth / Deployment | **OPTIONAL** | `SERVER-ONLY` | GitHub OAuth callback URI (`/oauth/github/callback`). |
| `VERCEL_CLIENT_ID` | OAuth / Deployment | **OPTIONAL** | `SERVER-ONLY` | Vercel Integration OAuth client ID for one-click web deployment. |
| `VERCEL_CLIENT_SECRET` | OAuth / Deployment | **OPTIONAL** | `SERVER-ONLY` | Vercel Integration client secret. |
| `VERCEL_REDIRECT_URI` | OAuth / Deployment | **OPTIONAL** | `SERVER-ONLY` | Vercel OAuth callback URI (`/oauth/vercel/callback`). |
| `VERCEL_INTEGRATION_SLUG` | OAuth / Deployment | **OPTIONAL** | `SERVER-ONLY` | Vercel marketplace integration slug. |
| `OAUTH_ALLOWED_ORIGINS` | OAuth / Deployment | **OPTIONAL** | `SERVER-ONLY` | Comma-separated allowlist of origins permitted for postMessage OAuth handshakes. |

---

## 2. Component Configuration Checklist

### Frontend Web & Android Client (`apps/mobile`)
- [x] `VITE_API_BASE_URL` pointing to production API gateway (`https://website-maker-ai-api.poojakpdoshi.workers.dev`).
- [x] No Supabase public auth configuration is required by the mobile client.
- [x] Subscriber login calls only the custom `/auth/otp/send` and `/auth/otp/verify` API routes.
- [x] Zero Gmail, database, or other server secret keys are embedded in the client bundle.

### Admin Dashboard Client (`apps/admin`)
- [x] `VITE_API_BASE_URL` pointing to production API gateway.
- [x] Multi-device token ledger and session expiration handlers active.

### API Gateway (`apps/api` - Cloudflare Workers / Node)
- [x] All server-only secrets provisioned via Cloudflare Secrets / environment.
- [x] CORS security headers active with allowed origin validation.
- [x] Gmail REST API OAuth2 is the only non-test subscriber OTP delivery path.
- [x] PBKDF2 credential hashing remains configured for owner/admin authentication.
- [x] AES-GCM-256 token encryption for third-party OAuth access tokens.

### Database Engine (PostgreSQL / Supabase)
- [x] Schema initialized with `pgcrypto` for UUID primary keys.
- [x] Row Level Security (RLS) active on all relational tables.
- [x] Cascading foreign key cleanup active.
