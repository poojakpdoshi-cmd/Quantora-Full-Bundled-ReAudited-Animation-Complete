# Quantora Archive Comparison Report

## Compared artifacts

This comparison used the uploaded archive at `/home/ubuntu/upload/Quantora.zip`, the repaired source workspace, and the newly generated full-bundled repaired archive.

| Artifact | Size | Entries/files | Meaning |
|---|---:|---:|---|
| Uploaded `Quantora.zip` | 164,834,524 bytes | 16,577 ZIP entries | User archive with `node_modules` and generated/mobile assets |
| Earlier repaired clean `Quantora.zip` | 15,010,879 bytes | 436 ZIP entries | Sanitized source distribution; dependencies and generated build output intentionally excluded |
| Final `Quantora-Full-Bundled.zip` | approximately 195.40 MB | 18,457 files verified | Full repaired bundle with dependencies, build output, Android web assets, changelog, and deployment instructions; environment files and generated runtime secrets excluded |

The source comparison found **256 common authored files** and **19 differing common files**. The repaired workspace also added the persistent lead/form migration, lead routes, deployment documentation, and repair changelog.

## Bugs still present in the uploaded archive

### 1. Lead CRM remains a local demo rather than a project backend

`apps/mobile/src/features/SyntropixLeadCRM.tsx` initializes sample records such as **Rohan Mehta** and **Priya Sundaram** when local storage is empty. It stores lead changes and form fields in `localStorage` only. There is no authenticated loading or saving through `/projects/:projectId/leads` or `/projects/:projectId/forms/config`, and the uploaded archive does not contain `apps/api/src/lead-routes.ts` or `apps/api/migrations/0002_leads_and_form_config.sql`.

This means leads are device-local, can disappear when local storage is cleared, do not synchronize between devices, and do not reliably represent public website submissions.

### 2. SEO dashboard still fabricates data in several states

The uploaded `SeoMonitoringDashboard.tsx` has improved naming and accepts API credentials, but it still seeds fallback issues when no project or email is connected. Its live crawl uses a browser `fetch` with `mode: 'no-cors'`, cannot read the real HTTP status or response body, and then synthesizes a success message such as “HTTP reachable” and “SSL active.” Its fallback `healthScore` is derived from local issue counts, and the indexing, rankings, technical, opportunities, and report sections still contain template/static values rather than backend or Search Console evidence.

Consequently, the uploaded dashboard is not yet a truthful live SEO monitoring system. It also does not implement Google Search Console indexing, query, impression, or ranking retrieval.

### 3. CMS Blueprint persists immediately without a server-side approval contract

The uploaded mobile CMS button uses `window.confirm`, then calls `/cms/projects/:projectId/blueprint`. The uploaded backend route invokes `applyCmsBlueprint` immediately and returns an “applied successfully” message. There is no proposal response, no `approve: true` requirement, and no reviewable collection/page list before persistence. A single confirmation therefore performs a write without the proposal-and-approval workflow expected for AI-assisted CMS changes.

### 4. OTP rate limiting still has a production fail-open path

In the uploaded `apps/api/src/index.ts`, `checkOtpRateLimit` tries the atomic RPC and then falls back to direct table reads and writes in every environment. The fallback is not restricted to test mode. More seriously, the fallback insert and update errors are not consistently checked; for example, the first-time insert path can return `{ allowed: true }` even when the database insert fails. A database or RPC failure can therefore allow an OTP send instead of failing closed.

The uploaded archive has several other OTP hardening improvements: it stores the OTP before dispatch, returns 503 on OTP insert failure, revokes the OTP after Gmail dispatch failure, and fails closed for verification/provisioning RPC errors. The remaining rate-limit fallback is still a security defect.

### 5. Dependency declarations are not aligned with the patched version

Both `apps/api/package.json` and `apps/api-node/package.json` declare `hono: ^4.8.5`. The repaired version upgrades both consumers to `^4.12.34`. The uploaded lockfiles happen to resolve different newer versions in different locations, but relying on a broad old declaration creates an avoidable dependency-drift risk and does not document the patched minimum.

### 6. Packaging is Windows-only and not self-verifying

The uploaded `scripts/package-clean-distribution.js`, `scripts/create-clean-zip.js`, and `scripts/package-full-bundle.js` call PowerShell `Compress-Archive` and use hardcoded `C:\Users\Poojak Doshi\Downloads\...` paths. They do not verify that required files were included or forbidden environment files were omitted. The scripts therefore fail on Linux/macOS and are difficult to use on another Windows account.

### 7. The uploaded “full bundle” is not portable across operating systems

The uploaded archive contains copied `node_modules` from a Windows environment. Its included `esbuild` package contains `@esbuild/win32-x64`, and the full test command fails in this Linux environment before executing the suites:

```text
You installed esbuild for another platform than the one you're currently using.
The "@esbuild/win32-x64" package is present but this platform needs the "@esbuild/linux-x64" package instead.
```

The uploaded source itself passed TypeScript checks after executable bits were restored, but its copied dependency tree is platform-specific. A full bundle should either be explicitly labeled platform-specific or include a clear instruction to remove and reinstall dependencies on the target OS.

## Bugs found in the first repaired package

The first repaired clean archive was intentionally a source distribution, but two release defects were found during this comparison.

### 1. Generated Android web assets were stale

Before this comparison, the repaired workspace’s `apps/mobile/android/app/src/main/assets/public/assets/index-f8pBbilC.js` still contained the old sample lead names even though the TypeScript source no longer did. This would have caused a packaged Android build to display the old demo CRM/SEO behavior. The Android assets were rebuilt and synchronized with Capacitor. The final full bundle contains the refreshed assets and no longer contains those sample strings.

### 2. Public form lead routing initially logged failures and returned success

The first repaired public form route inserted the audit submission, attempted to create a `lead_records` row, logged a lead insert error, and still returned `{ received: true }`. That could silently lose a lead from the CRM. This was corrected in the final workspace so recognizable submissions return 503 when ownership lookup or lead persistence fails instead of claiming successful CRM routing.

### 3. The full-bundle entry point initially delegated to the clean packager

The first repaired `scripts/package-full-bundle.js` was temporarily changed to invoke the clean packager, which contradicted its name and would have omitted `node_modules`. It now invokes `package-full-bundle.full.js`, which includes dependencies and generated/mobile assets while excluding environment files and other sensitive/generated runtime directories.

### 4. Test-only OTP fallback is intentional, not a production bypass

The repaired source still contains the identifier `allowTestFallback` and test references to `debugOtp`. Those are restricted to the explicit `ENVIRONMENT === 'test'` harness path. In production, RPC/database failure returns 503. The presence of the identifier alone is not evidence of a production fail-open path.

## Why the archive size was reduced

The earlier repaired archive was created by a **clean distribution** packager. It deliberately excluded `node_modules`, `dist`, build output, `.gradle`, `.wrangler`, `.env` files, `.dev.vars`, and other generated/runtime material. The uploaded archive contained 16,577 entries and approximately 243 MB of extracted `node_modules`, along with Android and generated assets. A source archive containing only 436 verified entries is therefore expected to be much smaller; the reduction did not mean the authored source was deleted.

The final full-bundled archive restores the requested dependencies and build/mobile assets. It is approximately 195.40 MB and contains 18,457 verified files. Because native packages are OS-specific, it is validated in the Linux sandbox; on another OS, dependency reinstall may still be necessary for native binaries.

## Final validation status

| Check | Final repaired workspace |
|---|---|
| Workspace TypeScript checks | Passed |
| API TypeScript check | Passed |
| Nine regression suites | Passed |
| Mobile build | Passed |
| Capacitor Android asset synchronization | Passed |
| Full archive verification | Passed — 18,457 files |
| Environment-file exclusion in full archive | Passed by packager verification |

The final implementation still does **not** guarantee Google indexing, ranking, impressions, or traffic. Those outcomes remain controlled by Google and require real Search Console data if they are to be displayed.
