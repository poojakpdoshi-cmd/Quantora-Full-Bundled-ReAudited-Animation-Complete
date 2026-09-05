# Quantora Feature Roadmap

The following ideas are recommendations only. They are not included in the repaired build until explicitly approved.

## Priority 1: Google Search Console connection

Allow the user to connect a verified Google Search Console property through OAuth2. Store refresh tokens encrypted on the server, fetch clicks, impressions, average position, queries, pages, coverage signals, and inspection results, and label every metric with its source and retrieval date.

This would make the SEO dashboard more useful, but it still would not guarantee indexing or ranking. Google remains the decision-maker for crawling and ranking.

## Priority 2: Scheduled SEO monitoring

Add a server-side schedule that runs the project audit and live crawl daily or weekly. Persist crawl history, compare changes over time, and show regressions such as a new 404, missing canonical, broken sitemap, title change, or increased response latency.

## Priority 3: Lead deduplication and assignment

Detect duplicate submissions by normalized email, phone, and time window. Add lead ownership assignment, internal notes, reminders, follow-up dates, and a complete status-history timeline. This would turn the current inbox into a lightweight but reliable team CRM.

## Priority 4: Notifications and webhooks

Notify the project owner when a new lead arrives, a form fails, a live crawl detects a critical issue, or a scheduled publication completes. Email notifications, configurable webhooks, and optional WhatsApp integration should be opt-in and rate-limited.

## Priority 5: AI approval and audit center

Record every AI proposal, reviewer, approval decision, rejected proposal, model/provider, timestamp, and resulting revision. Add side-by-side visual diff, rollback, and “restore previous version” controls. This is especially important for AI-generated public content.

## Priority 6: Privacy-friendly analytics

Add first-party analytics for page views, referrers, device categories, form conversion rate, and publishing events without exposing personal data unnecessarily. Provide retention controls, export, and deletion tools.

## Priority 7: Team roles and project collaboration

Add owner, editor, reviewer, analyst, and support roles with project-scoped permissions. Require reviewer approval before publishing AI-generated content or changing SEO metadata.

## Priority 8: Backup and restore

Provide scheduled project snapshots covering CMS documents, media references, form configuration, leads, SEO settings, and revisions. Allow a user to download an encrypted export and restore a selected snapshot.

## Priority 9: Publishing reliability controls

Add deployment health checks, domain verification, SSL status, rollback to the previous published version, maintenance mode, and a visible publishing activity log.

## Priority 10: Performance and accessibility assistant

Add real Lighthouse-style checks or equivalent server-side evidence for accessibility, performance, responsive behavior, image optimization, and broken links. Every recommendation should show the measured source and a before/after comparison rather than an invented score.

## Recommended order

The most valuable sequence is **Search Console connection**, **scheduled SEO monitoring**, **lead deduplication and assignment**, **notifications**, and **AI approval auditing**. These additions create measurable user value without promising outcomes that Quantora cannot control.
