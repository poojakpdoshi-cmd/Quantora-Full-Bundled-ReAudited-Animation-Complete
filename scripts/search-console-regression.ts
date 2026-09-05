import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

async function main(): Promise<void> {
  const root = process.cwd();
  const routes = await readFile(path.join(root, 'apps/api/src/search-console-routes.ts'), 'utf8');
  const migration = await readFile(path.join(root, 'supabase/migrations/016_google_search_console.sql'), 'utf8');
  const dashboard = await readFile(path.join(root, 'apps/mobile/src/features/SeoMonitoringDashboard.tsx'), 'utf8');
  const vars = await readFile(path.join(root, 'apps/api/.dev.vars.example'), 'utf8');
  const wrangler = await readFile(path.join(root, 'apps/api/wrangler.toml'), 'utf8');

  assert.match(routes, /webmasters\.readonly/);
  assert.match(routes, /search_console_oauth_states/);
  assert.match(routes, /consumed_at/);
  assert.match(routes, /eq\('installation_id', installationId\)/);
  assert.match(routes, /eq\('project_id', projectId\)/);
  assert.match(routes, /\.update\(\{ consumed_at: now \}/);
  assert.match(routes, /\.select\('id'\)\.maybeSingle\(\)/);
  assert.match(routes, /typeof payload\.installationId !== 'string'/);
  assert.match(routes, /typeof payload\.projectId !== 'string'/);
  assert.match(routes, /eq\('id', projectId\)/);
  assert.match(routes, /eq\('email', email\.toLowerCase\(\)\)/);
  assert.match(routes, /verified property/);
  assert.match(routes, /siteContainsUrl/);
  assert.match(routes, /encodeURIComponent\(siteUrl\)/);
  assert.match(routes, /encrypted_refresh_token/);
  assert.doesNotMatch(routes, /console\.log\([^)]*token/i);
  assert.match(migration, /state_hash text not null unique/);
  assert.match(migration, /project_id uuid/);
  assert.match(migration, /expires_at timestamptz not null/);
  assert.match(dashboard, /Connect Google/);
  assert.match(dashboard, /Load verified properties/);
  assert.match(dashboard, /Load analytics/);
  assert.match(dashboard, /Inspect URL/);
  assert.match(dashboard, /Refresh sitemaps/);
  assert.match(dashboard, /window\.open\('about:blank'/);
  assert.match(dashboard, /setInspectionUrl\(productionUrl\)/);
  assert.match(vars, /GOOGLE_SEARCH_CONSOLE_CLIENT_ID=/);
  assert.match(vars, /GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET=/);
  assert.match(vars, /GOOGLE_SEARCH_CONSOLE_REDIRECT_URI=/);
  assert.match(wrangler, /GOOGLE_SEARCH_CONSOLE_REDIRECT_URI/);
  assert.doesNotMatch(vars, /GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET=[^\n]+/);

  console.log('search-console-regression: passed');
}

void main();
