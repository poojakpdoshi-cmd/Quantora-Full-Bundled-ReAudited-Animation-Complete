import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

async function main(): Promise<void> {
  const root = process.cwd();
  const packager = await readFile(path.join(root, 'apps/mobile/src/features/WebToAppPackager.tsx'), 'utf8');
  const diagnostics = await readFile(path.join(root, 'apps/mobile/src/features/SyntropixShell.tsx'), 'utf8');
  const worker = await readFile(path.join(root, 'apps/build-worker/src/server.ts'), 'utf8');
  const concierge = await readFile(path.join(root, 'apps/mobile/src/features/AIConciergeStudio.tsx'), 'utf8');
  const agency = await readFile(path.join(root, 'apps/mobile/src/features/AgencyPitchStudio.tsx'), 'utf8');
  const admin = await readFile(path.join(root, 'apps/admin/src/main.tsx'), 'utf8');
  const mobileHtml = await readFile(path.join(root, 'apps/mobile/index.html'), 'utf8');
  const serviceWorker = await readFile(path.join(root, 'apps/mobile/public/sw.js'), 'utf8');

  assert.ok(packager.includes('projects/${encodeURIComponent(activeProject?.id'), 'APK requests must be project-scoped.');
  assert.ok(packager.includes('application/vnd.android.package-archive'), 'APK download must use APK MIME type.');
  assert.ok(packager.includes('Pre-build quality checks'));
  assert.ok(packager.includes('Build history'));
  assert.ok(packager.includes('android-build-manifest.json'));
  assert.doesNotMatch(packager, /a\.download = `\$\{packageName\}.*\.apk`/);
  assert.match(worker, /cleanupExpiredJobs/);
  assert.match(worker, /isAllowedWebsiteFile/);
  assert.match(worker, /APK_JOB_TTL_MS/);
  assert.match(diagnostics, /does not execute commands on a host/);
  assert.match(diagnostics, /diagnostics preview/);
  assert.doesNotMatch(diagnostics, /Deployed live to:/);
  assert.doesNotMatch(diagnostics, /WCAG AAA Score: 100\/100/);
  assert.doesNotMatch(concierge, /Syntropix AI Concierge|Activated on Active Website|Deploy AI Concierge/);
  assert.match(concierge, /local preview/);
  assert.doesNotMatch(agency, /syntropix\.ai|100\/100|3x more customers/);
  assert.match(agency, /no ranking guarantee/);
  assert.doesNotMatch(admin, /NEXORA\.AI|Nexora\.Ai/);
  assert.match(admin, /Quantora Admin|QUANTORA/);
  assert.match(mobileHtml, /rel="icon"/);
  assert.doesNotMatch(mobileHtml, /theme-color[^\n]*theme-color/);
  assert.match(serviceWorker, /quantora-v44-pwa-v1/);
  assert.match(serviceWorker, /pathname\.startsWith\('\/api\/'\)/);

  console.log('real-apk-ui-regression: passed');
}

void main();
