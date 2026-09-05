import assert from 'node:assert/strict';
import {
  createHash,
  pbkdf2Sync,
  randomBytes,
  randomUUID
} from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import api from '../apps/api/src/index';
import { ApiRequestError, requestJson } from '../apps/mobile/src/api-errors';
import {
  resolveRuntimeConfig,
  type RuntimeConfig
} from '../apps/mobile/src/runtime-config';

import {
  setTestMailSink,
  type EmailOtpPayload
} from '../apps/api/src/email-otp-service';

type Row = Record<string, any>;
type Tables = Record<string, Row[]>;

let capturedOtps: EmailOtpPayload[] = [];
setTestMailSink((payload) => {
  capturedOtps.push(payload);
});

const tables: Tables = {
  admin_sessions: [],
  user_accounts: [],
  user_sessions: [],
  approved_users: [],
  devices: [],
  audit_logs: [],
  email_otps: [],
  otp_rate_limits: [],
  token_wallets: []
};

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

const adminToken = 'test-admin-session-token';
tables.admin_sessions.push({
  id: randomUUID(),
  token_hash: sha256(adminToken),
  username: 'Poojak@King',
  expires_at: new Date(Date.now() + 60_000).toISOString(),
  revoked_at: null
});

function matches(row: Row, url: URL): boolean {
  for (const [name, raw] of url.searchParams) {
    if (['select', 'order', 'limit', 'on_conflict'].includes(name)) continue;
    const separator = raw.indexOf('.');
    if (separator < 0) continue;
    const operator = raw.slice(0, separator);
    const value = raw.slice(separator + 1);
    const actual = row[name];

    if (operator === 'eq' && String(actual) !== value) return false;
    if (operator === 'neq' && String(actual) === value) return false;
    if (operator === 'is' && value === 'null' && actual != null) return false;
    if (operator === 'gt' && !(new Date(actual).getTime() > new Date(value).getTime())) return false;
  }

  return true;
}

function responseBody(request: Request, rows: Row[]): BodyInit | null {
  if (request.method === 'HEAD') return null;
  const acceptsObject =
    request.headers.get('accept')?.includes('application/vnd.pgrst.object+json');
  return JSON.stringify(acceptsObject ? rows[0] ?? null : rows);
}

async function fakeSupabaseFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const request = input instanceof Request ? input : new Request(input, init);
  const url = new URL(request.url);

  if (url.pathname.startsWith('/rest/v1/rpc/')) {
    return new Response(JSON.stringify({
      message: 'Function is not present in the schema cache.'
    }), { status: 404, headers: { 'content-type': 'application/json' } });
  }

  const tableName = decodeURIComponent(url.pathname.split('/').at(-1) || '');
  const table = tables[tableName] ||= [];
  const headers = new Headers({ 'content-type': 'application/json' });

  if (request.method === 'GET' || request.method === 'HEAD') {
    let rows = table.filter((row) => matches(row, url));
    const orderParam = url.searchParams.get('order');
    if (orderParam && rows.length > 1) {
      const [col, dir] = orderParam.split('.');
      rows = [...rows].sort((a, b) => {
        const valA = a[col] ?? '';
        const valB = b[col] ?? '';
        return dir === 'desc' ? (valA < valB ? 1 : -1) : (valA > valB ? 1 : -1);
      });
    }
    const limitParam = url.searchParams.get('limit');
    if (limitParam) {
      rows = rows.slice(0, Number(limitParam));
    }
    headers.set('content-range', `0-${Math.max(0, rows.length - 1)}/${rows.length}`);
    return new Response(responseBody(request, rows), { status: 200, headers });
  }

  if (request.method === 'POST') {
    const incoming = await request.json() as Row | Row[];
    const inputRows = Array.isArray(incoming) ? incoming : [incoming];
    const output: Row[] = [];
    const conflictKey = url.searchParams.get('on_conflict');

    for (const item of inputRows) {
      const now = new Date().toISOString();
      const row = {
        id: item.id || randomUUID(),
        created_at: item.created_at || now,
        updated_at: item.updated_at || now,
        ...item
      };
      const existing = conflictKey
        ? table.find((candidate) => candidate[conflictKey] === row[conflictKey])
        : undefined;

      if (existing) {
        Object.assign(existing, row, { id: existing.id });
        output.push(existing);
      } else {
        table.push(row);
        output.push(row);
      }
    }

    const returnsRows = request.headers.get('prefer')?.includes('return=representation');
    const result = returnsRows
      ? inputRows.length === 1 && url.searchParams.has('select')
        ? output[0]
        : output
      : [];
    return new Response(JSON.stringify(result), {
      status: 201,
      headers
    });
  }

  if (request.method === 'PATCH') {
    const update = await request.json() as Row;
    const rows = table.filter((row) => matches(row, url));
    rows.forEach((row) => Object.assign(row, update));
    return new Response(JSON.stringify([]), { status: 200, headers });
  }

  if (request.method === 'DELETE') {
    const removed = table.filter((row) => matches(row, url));
    tables[tableName] = table.filter((row) => !matches(row, url));
    return new Response(JSON.stringify(removed), { status: 200, headers });
  }

  return new Response(JSON.stringify({ message: 'Unsupported fake request.' }), {
    status: 500,
    headers
  });
}

const testAdminPassword = `${randomUUID()}Aa1`;
const testAdminSalt = randomBytes(16).toString('hex');
const testAdminIterations = 1000;

const env = {
  ENVIRONMENT: 'test',
  APP_NAME: 'Nexora test',
  SUPABASE_URL: 'https://auth-test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  ADMIN_USERNAME: 'Poojak@King',
  ADMIN_PASSWORD_SALT: testAdminSalt,
  ADMIN_PASSWORD_HASH: pbkdf2Sync(
    testAdminPassword,
    Buffer.from(testAdminSalt, 'hex'),
    testAdminIterations,
    32,
    'sha256'
  ).toString('hex'),
  ADMIN_PASSWORD_ITERATIONS: String(testAdminIterations)
};
const executionContext = {
  waitUntil() {},
  passThroughOnException() {}
};

async function apiRequest(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  return api.fetch(
    new Request(`https://api.test${path}`, init),
    env,
    executionContext
  );
}

async function jsonRequest(
  path: string,
  body: Row,
  token?: string,
  method = 'POST'
) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await apiRequest(path, {
    method,
    headers,
    body: JSON.stringify(body)
  });
  const data = await response.json() as Row;
  return { response, data };
}

async function runAdminAuthenticationRegression() {
  const normalRoute = await jsonRequest('/auth/login', {
    username: env.ADMIN_USERNAME,
    password: testAdminPassword,
    installationId: randomUUID()
  });
  assert.equal(normalRoute.response.status, 410);
  assert.match(normalRoute.data.error, /6-digit code/);

  const rejected = await jsonRequest('/admin/auth/login', {
    username: env.ADMIN_USERNAME,
    password: `${testAdminPassword}x`
  });
  assert.equal(rejected.response.status, 401);
  assert.equal(
    rejected.data.error,
    'Invalid admin username or password.'
  );

  const accepted = await jsonRequest('/admin/auth/login', {
    username: env.ADMIN_USERNAME,
    password: testAdminPassword
  });
  assert.equal(accepted.response.status, 200, JSON.stringify(accepted.data));
  assert.equal(accepted.data.username, env.ADMIN_USERNAME);
  assert.ok(accepted.data.token);
  assert.ok(accepted.data.expiresAt);
  assert.ok(
    tables.admin_sessions.some(
      (session) => session.token_hash === sha256(accepted.data.token)
    ),
    'accepted admin credentials create a persisted session'
  );

  const dashboard = await apiRequest('/admin/summary', {
    headers: { Authorization: `Bearer ${accepted.data.token}` }
  });
  assert.equal(dashboard.status, 200, 'new admin session authorizes the dashboard');

  const appSource = readFileSync(
    resolve(import.meta.dirname, '../apps/mobile/src/App.tsx'),
    'utf8'
  );
  assert.match(
    appSource,
    /mode === ['"]admin-login['"] \|\| mode === ['"]admin-dashboard['"]/,
    'admin-login mode renders the dedicated AdminPanelV5 login flow'
  );
  assert.match(appSource, /sendEmailOtp\(config\.apiBase/);
  assert.match(appSource, /verifyEmailOtp\(config\.apiBase/);
  assert.doesNotMatch(appSource, /signInWithOtp|emailRedirectTo|supabase\.auth\.(getSession|onAuthStateChange|signOut)/);
  assert.doesNotMatch(appSource, /handleUsernameLogin|loginNormalUser|Sign in with username/);

  const emailServiceSource = readFileSync(
    resolve(import.meta.dirname, '../apps/api/src/email-otp-service.ts'),
    'utf8'
  );
  assert.match(emailServiceSource, /OFFICIAL_GMAIL_SENDER = ['"]quantoraby\.quantacy@gmail\.com['"]/);
  assert.doesNotMatch(emailServiceSource, /api\.resend\.com|api\.brevo\.com|mailchannels/);
}

async function runOtpAuthenticationRegression() {
  const testEmail = 'subscriber.verified@example.com';
  const installationId = randomUUID();

  // 1. Invalid email format
  const badEmail = await jsonRequest('/auth/otp/send', { email: 'not-an-email' });
  assert.equal(badEmail.response.status, 400);

  // 2. Unconfigured database test
  const noDbResponse = await api.fetch(
    new Request('https://api.test/auth/otp/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: testEmail, installationId })
    }),
    { APP_NAME: 'Nexora' } as any,
    executionContext
  );
  assert.equal(noDbResponse.status, 503);

  // 3. Send valid OTP
  capturedOtps = [];
  const sendRes = await jsonRequest('/auth/otp/send', {
    email: testEmail,
    installationId
  });
  assert.equal(sendRes.response.status, 200, JSON.stringify(sendRes.data));
  assert.equal(sendRes.data.ok, true);
  assert.equal(sendRes.data.expiresInMinutes, 10);
  assert.equal(sendRes.data.otp, undefined, 'Plaintext OTP must NEVER be exposed in response');
  assert.equal(sendRes.data.debugOtp, undefined, 'debugOtp must NEVER be exposed in response');

  // Verify that mock sink received exactly one code
  assert.equal(capturedOtps.length, 1);
  const sentPayload = capturedOtps[0];
  assert.equal(sentPayload.toEmail, testEmail);
  assert.match(sentPayload.otpCode, /^\d{6}$/);

  // 4. Rate limit check (immediate repeat send within 30s)
  const rateLimitRes = await jsonRequest('/auth/otp/send', {
    email: testEmail,
    installationId
  });
  assert.equal(rateLimitRes.response.status, 429);

  // 5. Verification tests
  // 5a. Invalid OTP format
  const badFormat = await jsonRequest('/auth/otp/verify', {
    email: testEmail,
    otp: '123',
    installationId
  });
  assert.equal(badFormat.response.status, 400);

  // 5b. Incorrect 6-digit OTP code (attempt 1)
  const wrongCode = await jsonRequest('/auth/otp/verify', {
    email: testEmail,
    otp: '000000',
    installationId
  });
  assert.equal(wrongCode.response.status, 401);

  // Verify attempt counter incremented in DB
  const storedOtp = tables.email_otps.find((row) => row.email === testEmail);
  assert.ok(storedOtp);
  assert.equal(storedOtp.attempts, 1);

  // 5c. Correct OTP verification
  const validVerify = await jsonRequest('/auth/otp/verify', {
    email: testEmail,
    otp: sentPayload.otpCode,
    installationId
  });
  assert.equal(validVerify.response.status, 200, JSON.stringify(validVerify.data));
  assert.equal(validVerify.data.approved, true);
  assert.equal(validVerify.data.role, 'subscriber');
  assert.equal(validVerify.data.internalEmail, testEmail);
  assert.equal(validVerify.data.starterTokens, 200, 'Subscriber receives 200 starter tokens');
  assert.ok(validVerify.data.token);
  assert.ok(validVerify.data.expiresAt);

  // Verify OTP was marked consumed & revoked
  assert.ok(storedOtp.consumed_at);
  assert.ok(storedOtp.revoked_at);

  // Verify session created in DB
  const session = tables.user_sessions.find((s) => s.token_hash === sha256(validVerify.data.token));
  assert.ok(session, 'Valid OTP verification provisions a durable user session');

  // Verify user_accounts & approved_users were created
  assert.ok(tables.user_accounts.some((a) => a.internal_email === testEmail));
  assert.ok(tables.approved_users.some((u) => u.email === testEmail));
  assert.ok(tables.token_wallets.some((w) => w.topup_balance === 200), 'Starter balance of 200 tokens is recorded in token_wallets');

  // 5d. Replay attack rejection (attempting to reuse consumed code)
  const replayVerify = await jsonRequest('/auth/otp/verify', {
    email: testEmail,
    otp: sentPayload.otpCode,
    installationId
  });
  assert.equal(replayVerify.response.status, 401);
}

async function main() {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fakeSupabaseFetch as typeof fetch;

  try {
  await runAdminAuthenticationRegression();
  await runOtpAuthenticationRegression();

  if (process.argv.includes('--admin-only')) {
    console.log('Admin authentication regression tests passed.');
    return;
  }

  const preflight = await apiRequest('/admin/accounts/account-id/password', {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://localhost',
      'Access-Control-Request-Method': 'PATCH',
      'Access-Control-Request-Headers': 'authorization,content-type'
    }
  });
  assert.equal(preflight.status, 204);
  assert.match(preflight.headers.get('access-control-allow-methods') || '', /PATCH/);

  const unauthorizedReset = await jsonRequest(
    '/admin/accounts/missing/password',
    { password: 'ResetPassword2' },
    undefined,
    'PATCH'
  );
  assert.equal(unauthorizedReset.response.status, 401);

  const created = await jsonRequest(
    '/admin/accounts/create',
    { username: '  Case   User  ', password: 'OldPassword1' },
    adminToken
  );
  assert.equal(created.response.status, 200);
  assert.equal(
    created.data.account?.username,
    'case.user',
    JSON.stringify(created.data)
  );

  const passwordRoute = await jsonRequest(
    '/auth/password',
    {},
    undefined,
    'PATCH'
  );
  assert.equal(passwordRoute.response.status, 410);
  assert.match(passwordRoute.data.error, /6-digit code/);

  const bundled: RuntimeConfig = {
    apiBase: 'https://api.production.test'
  };
  const staleStored = JSON.stringify({
    apiBase: 'https://stale-api.test'
  });
  assert.deepEqual(
    resolveRuntimeConfig(bundled, staleStored, false),
    bundled,
    'production ignores stale installation-specific backend overrides'
  );
  assert.equal(
    resolveRuntimeConfig(bundled, staleStored, true).apiBase,
    'https://stale-api.test',
    'development can still use an explicit local backend'
  );

  const productionEnvPath = resolve(import.meta.dirname, '../apps/mobile/.env.production');
  const workerConfig = readFileSync(
    resolve(import.meta.dirname, '../apps/api/wrangler.toml'),
    'utf8'
  );
  if (existsSync(productionEnvPath)) {
    const productionEnv = readFileSync(productionEnvPath, 'utf8');
    const apiUrl = productionEnv.match(/^VITE_API_BASE_URL=(.+)$/m)?.[1];
    const workerName = workerConfig.match(/^name\s*=\s*"([^"]+)"$/m)?.[1];
    assert.ok(apiUrl && workerName);
    assert.equal(new URL(apiUrl).hostname.split('.')[0], workerName);
    assert.doesNotMatch(productionEnv, /YOUR-|localhost|127\.0\.0\.1/);
  }

  globalThis.fetch = (async () => {
    throw new TypeError('Failed to fetch');
  }) as typeof fetch;
  await assert.rejects(
    () => requestJson('https://unavailable.test/auth/otp/send'),
    (error: unknown) =>
      error instanceof ApiRequestError && error.kind === 'network'
  );

  globalThis.fetch = (async () => new Response(
    JSON.stringify({ error: 'Too many requests.' }),
    { status: 429, headers: { 'content-type': 'application/json' } }
  )) as typeof fetch;
  await assert.rejects(
    () => requestJson('https://rate-limit.test/auth/otp/send'),
    (error: unknown) =>
      error instanceof ApiRequestError && error.kind === 'rate-limit'
  );

  for (const [status, kind] of [
    [401, 'unauthorized'],
    [400, 'validation'],
    [500, 'server']
  ] as const) {
    globalThis.fetch = (async () => new Response(
      JSON.stringify({ error: `Server response ${status}` }),
      { status, headers: { 'content-type': 'application/json' } }
    )) as typeof fetch;
    await assert.rejects(
      () => requestJson('https://classification.test/auth/otp/send'),
      (error: unknown) =>
        error instanceof ApiRequestError && error.kind === kind
    );
  }

    console.log('Authentication regression tests passed.');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
