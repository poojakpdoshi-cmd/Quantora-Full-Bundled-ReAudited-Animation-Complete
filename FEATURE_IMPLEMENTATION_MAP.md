# Quantora Twelve-Feature Implementation Map

## Scope

The attachment requests twelve features across AI creation, commerce, growth, and platform capabilities. The implementation will use the existing React mobile/admin clients, Hono API workers, Supabase persistence, Cloudflare AI binding, and server-side provider secrets. No production credential will be embedded in source code.

| # | Requested feature | Existing surface | Implementation path | Required production setup |
|---:|---|---|---|---|
| 1 | Sketch/photo-to-website | `VisionUploadStudio.tsx` | Authenticated image upload plus multimodal model extraction into a reviewed website brief and generated plan | A vision-capable server-side model and object storage |
| 2 | Voice-command live editing | `VoicePromptMic.tsx` | Browser speech capture with authenticated command parsing and an explicit preview/apply workflow | Browser microphone permission; optional server speech provider for unsupported browsers |
| 3 | Brand clone/style inspector | Brand/project tools | Server-side URL inspection for public pages, color/font/layout evidence, and optional uploaded brand asset analysis | Public target URL; optional vision model for uploaded references |
| 4 | Payment-free WhatsApp store enquiries | `WhatsAppCommerceEngine.tsx` | Persistent catalog, order enquiry draft, WhatsApp message creation, and manual order-state updates; no payment collection | Meta WhatsApp Cloud API credentials are optional; no payment-provider credentials are used |
| 5 | Appointment/table booking | Lead/form builder | Persistent availability, booking requests, conflict checks, reminders, and optional Calendar event creation | Google Calendar OAuth with the narrowest required event scope |
| 6 | Multi-currency and geo-targeting | Commerce configuration | Server-observed country/currency suggestion, explicit user override, and exchange-rate snapshot storage | A trusted exchange-rate provider if live rates are enabled |
| 7 | Embedded AI support chatbot | `AIConciergeStudio.tsx` | CMS/FAQ-backed retrieval context, public chat endpoint, rate limits, transcript controls, and widget configuration | Server-side AI provider and optional custom domain configuration |
| 8 | Social campaign generator | CMS publishing flow | Generate reviewable Instagram, LinkedIn, and X copy plus image prompts/assets after publication | Social platform OAuth is required for direct publishing; generation works without it |
| 9 | Autonomous A/B testing | Analytics/publishing | Explicit experiment variants, deterministic assignment, conversion events, minimum sample threshold, and manual winner approval | Real traffic and consent-aware analytics |
| 10 | One-click PWA | `WebToAppPackager.tsx` | Generate manifest, service worker, icons, install metadata, and offline-safe route rules | Published site with HTTPS and suitable icon assets |
| 11 | Multilingual RTL localization | `QuantoraMultilingualStudio.tsx` | Persist locale bundles, translate reviewed CMS content, set `dir="rtl"` for Arabic, and provide fallback language behavior | Translation provider credentials or configured server-side model |
| 12 | Predictive heatmaps and CRO score | Analytics/SEO surfaces | Evidence-based layout/accessibility/content heuristics, observed interaction data when available, and clearly labeled estimates | Real page/interaction data for behavioral heatmaps; no fabricated visitor metrics |

## Integration facts used for the design

Meta documents that WhatsApp Cloud API supports programmatic messaging, interactive messages, order confirmations, appointment reminders, and webhooks for delivery status and incoming messages.[1] Quantora will use WhatsApp only for payment-free order enquiries and manual follow-up. Google Calendar documents narrowly scoped OAuth access, including `https://www.googleapis.com/auth/calendar.events.owned` for events on calendars owned by the user.[2]

The feature implementations will therefore separate **code-complete behavior** from **credential-gated production connections**. A missing provider will produce a visible unavailable state, not a fake success message.

## Build sequence

The project will be built in four release groups. First, the shared data model, authenticated feature routes, review/approval patterns, and security controls will be added. Second, the AI creation and content tools will be connected. Third, commerce, booking, growth, and experimentation will be added. Fourth, PWA, localization, CRO evidence, full regression testing, Android asset synchronization, and release packaging will be completed.

A production build can be run after the code and migrations validate. A production deployment should occur only after Supabase migrations are applied and the required provider secrets are configured. Features whose providers are not configured will remain safely disabled rather than pretending to be active.

## References

[1]: https://developers.facebook.com/documentation/business-messaging/whatsapp/about-the-platform "About the WhatsApp Business Platform — Meta for Developers"

[2]: https://developers.google.com/workspace/calendar/api/auth "Choose Google Calendar API scopes — Google for Developers"
