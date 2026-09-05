import assert from 'node:assert/strict';
import { Hono } from 'hono';
import { registerApkBuildRoutes } from '../apps/api/src/apk-build-routes.ts';

type Env = { APK_BUILD_SERVICE_URL?: string; APK_BUILD_SERVICE_TOKEN?: string };
const projectId = 'project-1';
const email = 'owner@example.com';
const installationId = '11111111-1111-4111-8111-111111111111';
const token = 'session-token';

function createApp(env: Env = { APK_BUILD_SERVICE_URL: 'https://build.internal', APK_BUILD_SERVICE_TOKEN: 'service-secret' }, owned = true) {
  const app = new Hono<{ Bindings: Env }>();
  registerApkBuildRoutes(app, {
    requireUser: async (_context, requestedEmail) => requestedEmail === email ? { ok: true, role: 'subscriber', maxDevices: 2, activeDevices: 1, subscriptionExpiresAt: null } : null,
    requireSupabase: () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: owned ? { id: projectId } : null }) }),
            maybeSingle: async () => ({ data: owned ? { id: projectId } : null })
          })
        })
      })
    })
  });
  return { app, env };
}

const originalFetch = globalThis.fetch;
let lastUpstreamRequest: Request | null = null;

globalThis.fetch = async (input, init) => {
  lastUpstreamRequest = new Request(input, init);
  const url = String(input);
  if (url.endsWith('/v1/apk-builds')) return new Response(JSON.stringify({ id: 'job-1', status: 'queued', projectId }), { status: 202, headers: { 'content-type': 'application/json' } });
  if (url.endsWith('/job-1')) return new Response(JSON.stringify({ id: 'job-1', status: 'ready', projectId, artifactName: 'app-debug.apk', sha256: 'abc' }), { status: 200, headers: { 'content-type': 'application/json' } });
  if (url.endsWith('/job-2')) return new Response(JSON.stringify({ id: 'job-2', status: 'ready', projectId: 'other-project' }), { status: 200, headers: { 'content-type': 'application/json' } });
  if (url.endsWith('/job-1/download')) return new Response(new Uint8Array([80, 75, 3, 4]), { status: 200, headers: { 'content-type': 'application/vnd.android.package-archive' } });
  return new Response(JSON.stringify({ error: 'unexpected upstream URL' }), { status: 500 });
};

async function main(): Promise<void> {
  try {
  const missing = createApp({});
  let response = await missing.app.request(`/projects/${projectId}/build-apk`, { method: 'POST', body: '{}' }, missing.env);
  assert.equal(response.status, 503);

  const { app, env } = createApp();
  response = await app.request(`/projects/${projectId}/build-apk`, { method: 'POST', body: JSON.stringify({}) }, env);
  assert.equal(response.status, 400);

  response = await app.request(`/projects/${projectId}/build-apk`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ email: 'intruder@example.com', installationId, appName: 'Demo', packageName: 'com.example.demo', versionName: '1.0.0', versionCode: 1, previewHtml: '<h1>Demo</h1>' }) }, env);
  assert.equal(response.status, 401);

  response = await app.request(`/projects/${projectId}/build-apk`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ email, installationId, appName: 'Demo', packageName: 'com.example.demo', versionName: '1.0.0', versionCode: 1, previewHtml: '<h1>Demo</h1>' }) }, env);
  assert.equal(response.status, 202);
  assert.equal(lastUpstreamRequest?.headers.get('authorization'), 'Bearer service-secret');
  assert.equal((await lastUpstreamRequest?.json() as { projectId: string }).projectId, projectId);

  response = await app.request(`/projects/${projectId}/build-apk/job-2?email=${encodeURIComponent(email)}&installationId=${installationId}`, { headers: { authorization: `Bearer ${token}` } }, env);
  assert.equal(response.status, 404);

  response = await app.request(`/projects/${projectId}/build-apk/job-1/download?email=${encodeURIComponent(email)}&installationId=${installationId}`, { headers: { authorization: `Bearer ${token}` } }, env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/vnd.android.package-archive');
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), new Uint8Array([80, 75, 3, 4]));

  console.log('apk-build-proxy-regression: passed');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

void main();
