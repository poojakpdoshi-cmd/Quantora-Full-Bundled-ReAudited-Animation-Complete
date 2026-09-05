# Quantora Gradle APK Build Worker

This service is the execution boundary for **real user-project Android APK builds**. It runs Node.js, a full Android SDK, a JDK, and the Capacitor Android Gradle template. Cloudflare Workers cannot execute Gradle, so this process must run on a persistent/container-capable host behind the authenticated API proxy.

## What it builds

The initial supported artifact is a debug-signed Android APK containing the user's generated website in a Capacitor WebView wrapper. The request can set the launcher name, Android application ID, semantic version, version code, preview HTML, and safe web assets. Camera, push notifications, biometrics, release signing, arbitrary native plugins, and arbitrary shell commands are **not** enabled by this service until their native implementations and security policies exist.

## Local development

1. Ensure Java, the Android SDK, and the template's Gradle wrapper are available.
2. Copy `.env.example` to a private environment file and set the values out of source control.
3. Start the worker with `npm --prefix apps/build-worker run start`.
4. Keep the worker private; only the API Worker or trusted API adapter should reach it.

The `/health` endpoint is intentionally unauthenticated but reveals only readiness booleans. Every `/v1/apk-builds` endpoint requires `Authorization: Bearer <APK_BUILD_SERVICE_TOKEN>`.

## Production requirements

The current implementation keeps job metadata in memory and artifacts on local disk. Completed jobs and artifacts are removed after `APK_JOB_TTL_MS` (24 hours by default), which prevents unbounded growth but does not make the service durable. This is suitable for controlled development and a single-host pilot only. A production rollout still needs durable job metadata, object storage for APKs, artifact expiry cleanup, concurrency and disk quotas, request timeouts, a private network or mTLS, and a release-signing policy. Debug APKs must not be presented as store-ready releases.

| Approach | Tradeoffs | Cost | Setup complexity |
|---|---|---:|---:|
| Managed container service with persistent object storage | Easier TLS, scaling, logs, and secret management; needs a container image and storage integration; cold starts can delay builds | Provider-dependent usage and storage fees | Medium |
| Persistent Linux VM with Docker/systemd | Full control over Android SDK, Gradle cache, firewall, queue, and cleanup; operator owns patching, monitoring, backups, and capacity | VM and storage cost; a local machine can be zero additional cost if kept online | Medium–high |
| Local developer machine for pilot | Fastest validation and no hosting bill; the machine must stay online and reachable, and is not suitable for public multi-user traffic | Usually no additional service cost | Low for pilot, high for public exposure |

The recommended production sequence is a private managed container or hardened VM, with the API proxy as the only public entry point. Do not expose this worker directly to end users.

## Deployment checklist

- Configure the same randomly generated `APK_BUILD_SERVICE_TOKEN` in the API Worker secret store and this service's environment.
- Set `APK_BUILD_SERVICE_URL` in the API Worker to the private HTTPS worker endpoint.
- Configure `APK_ANDROID_SDK`, `APK_TEMPLATE_DIR`, `APK_NODE_MODULES_DIR`, `APK_BUILD_ROOT`, `APK_MAX_ACTIVE_BUILDS`, and `APK_JOB_TTL_MS` on the build host. `APK_NODE_MODULES_DIR` must point to the installed dependencies containing the Capacitor Android and Browser plugin projects.
- Use a non-root service account, a writable build directory with quotas, a firewall allowlist, and automatic restart.
- Add durable storage and a cleanup job before accepting production volume.
- Verify each produced APK with `aapt dump badging` and `apksigner verify`; retain the SHA-256 in the job record.
- Never place Gmail OAuth values, API tokens, `.env` files, keystores, or `local.properties` in source archives.

The mobile builder also performs deterministic pre-build checks for project ownership context, source availability, app identity, semantic version metadata, HTML size, document structure, viewport metadata, and title metadata. It keeps the last ten build results locally in the browser as metadata only; APK bytes are never stored in browser storage.
