# Quantora 3D / 4D / 5D Feature Report

## Overview

The attached spatial implementation plan is now integrated into Quantora. The mobile app includes a **3D / 4D / 5D Studio** tab. Users choose a dimension, describe the desired website experience, request a server-side blueprint proposal, reject and refine it for up to three rounds, approve it explicitly, and send the approved blueprint to the existing website builder for final review before generation.

The offline-payment model remains unchanged. Quantora does not contain Razorpay, Stripe, UPI, card, QR-payment, payment-link, or payment-webhook functionality. Token packages and custom token amounts continue to be granted manually by an authorized administrator after offline payment is confirmed.

## Implemented layers

| Layer | Implemented behavior | Limitation stated honestly |
|---|---|---|
| 3D spatial | Lightweight procedural WebGL preview with material modes for glass, gold, and hologram; adaptive quality tier detection | This is a procedural spatial atmosphere and not a full 3D asset/model editor |
| 4D temporal | Scroll progress is exposed to the preview and generated runtime; blueprint supports scroll scenes and temporal layer configuration | Full GSAP/Lenis cinematic authoring is not bundled; the current runtime uses browser-native scroll behavior |
| 5D sensory | Optional device-orientation tilt, haptic taps, optional short Web Audio interaction, local reduced-motion handling | Sensor permission, browser support, user preference, and device hardware vary |
| Performance | WebGL detection, flagship/mid/budget/fallback tiering, offscreen pause with `IntersectionObserver`, reduced-motion handling, and procedural rendering | No implementation can guarantee 60 or 120 FPS on every smartphone |
| Generated websites | Spatial plans activate a lightweight procedural canvas runtime in generated React sites and static previews | The spatial runtime is enabled when the generated plan contains spatial/3D/4D/5D signals |
| Safety | Blueprint proposals are not persisted until approval; generated plans retain a normal accessible content path | Real-device and published-site validation remain necessary |

## API routes and storage

The API provides:

| Route | Purpose |
|---|---|
| `POST /projects/:projectId/spatial/blueprint` | Generates a reviewable proposal or persists an explicitly approved blueprint |
| `GET /projects/:projectId/spatial/blueprint` | Loads the saved spatial blueprint |
| `PUT /projects/:projectId/features/spatial` | Supports authenticated spatial feature configuration access through the generic feature route |

Approved blueprints are stored in `project_feature_configs` under `feature_key = spatial`. The migration is `apps/api/migrations/0003_product_growth_features.sql`.

## Build sequence

From the repository root, install dependencies, apply migrations in order, configure server-side AI/Gmail/Supabase secrets, and then run:

```bash
npm run typecheck
npm run typecheck:api
npx tsx scripts/spatial-regression.ts
npm test
npm run build
npm run build:api
npm audit --omit=dev
npm --prefix apps/api audit --omit=dev
node scripts/package-full-bundle.js
```

The focused spatial regression confirms that a 5D plan generates the `SpatialRuntime`, reduced-motion handling, device-orientation support, offscreen observation, spatial styles, and a static preview section.

## Required testing before public release

Test the mobile app on at least one flagship device, one mid-range device, and one budget device. Test WebGL unavailable fallback, reduced-motion preference, denied device-orientation permission, denied microphone/audio permission, background-tab pause/resume, portrait/landscape rotation, offline loading, and long scroll sessions. Measure actual frame time and battery/thermal behavior; do not present target FPS as a guarantee.
