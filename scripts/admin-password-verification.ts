import assert from 'node:assert/strict';
import api from '../apps/api/src/index';

console.log('================================================================');
console.log('  NEXORA.AI — END-TO-END AUTHENTICATION VERIFICATION AUDIT       ');
console.log('================================================================\n');

// Mock Supabase store for in-memory session and rate-limiting validation
const tables: Record<string, any[]> = {
  admin_login_attempts: [],
  admin_sessions: [],
  audit_logs: [],
  approved_users: [],
  user_accounts: [],
  user_sessions: [],
  payment_requests: [],
  projects: [],
  generation_jobs: [],
  devices: []
};

function matches(row: Record<string, any>, url: URL): boolean {
  for (const [key, value] of url.searchParams.entries()) {
    if (key.startsWith('select') || key.startsWith('order') || key.startsWith('limit')) continue;
    const match = value.match(/^eq\.(.+)$/);
    if (match && String(row[key]) !== match[1]) return false;
  }
  return true;
}

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const request = input instanceof Request ? input : new Request(input, init);
  const url = new URL(request.url);

  if (!url.hostname.includes('supabase.co')) {
    return originalFetch(input, init);
  }

  const tableName = url.pathname.replace('/rest/v1/', '').split('?')[0];
  const table = tables[tableName] || (tables[tableName] = []);
  const headers = { 'content-type': 'application/json' };

  if (request.method === 'GET') {
    const results = table.filter((row) => matches(row, url));
    return new Response(JSON.stringify(results), { status: 200, headers });
  }

  if (request.method === 'POST') {
    const body = await request.json();
    const rows = Array.isArray(body) ? body : [body];
    const created = rows.map((row) => ({ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...row }));
    table.push(...created);
    return new Response(JSON.stringify(created), { status: 201, headers });
  }

  if (request.method === 'PATCH') {
    const update = await request.json();
    const rows = table.filter((row) => matches(row, url));
    rows.forEach((row) => Object.assign(row, update));
    return new Response(JSON.stringify(rows), { status: 200, headers });
  }

  if (request.method === 'DELETE') {
    const removed = table.filter((row) => matches(row, url));
    tables[tableName] = table.filter((row) => !matches(row, url));
    return new Response(JSON.stringify(removed), { status: 200, headers });
  }

  return new Response(JSON.stringify({ message: 'Unsupported fake request.' }), { status: 500, headers });
};

const executionContext = {
  waitUntil() {},
  passThroughOnException() {}
};

async function apiRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const env = {
    APP_NAME: 'Nexora test',
    SUPABASE_URL: 'https://auth-test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    OWNER_EMAIL: 'poojakpdoshi@gmail.com'
  };
  return api.fetch(new Request(`https://api.test${path}`, init), env, executionContext);
}

async function runAuthVerification() {
  const newPassword = process.argv[2] || 'Poojak@101';
  const oldPassword = process.argv[3] || 'Poojak@123';
  const adminUser = 'Poojak@King';
  const installationId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

  console.log(`>>> 1. Testing /auth/login (Mobile App Universal Login) with OLD password...`);
  const mobileOldRes = await apiRequest('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: adminUser,
      password: oldPassword,
      installationId
    })
  });
  console.log(`- Old password status: ${mobileOldRes.status}`);
  assert.equal(mobileOldRes.status, 401, 'Old password on /auth/login must be rejected with 401');
  console.log('✓ Old password rejected on /auth/login.\n');

  console.log(`>>> 2. Testing /auth/login with NEW admin credentials (Poojak@King)...`);
  const mobileNewRes = await apiRequest('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: adminUser,
      password: newPassword,
      installationId,
      deviceName: 'Pixel 9 Pro Android'
    })
  });
  console.log(`- New admin login status: ${mobileNewRes.status}`);
  assert.equal(mobileNewRes.status, 200, 'New admin credentials on /auth/login must succeed with 200');
  const userSessionData = await mobileNewRes.json() as any;
  assert.equal(userSessionData.role, 'admin', 'Role is admin');
  assert.equal(userSessionData.approved, true, 'Approved is true');
  assert.ok(userSessionData.token, 'Token is issued');
  console.log(`✓ Mobile Universal Login authenticated admin: username=${userSessionData.username}, role=${userSessionData.role}\n`);

  console.log(`>>> 3. Testing /auth/me with the issued mobile session token...`);
  const meRes = await apiRequest('/auth/me', {
    headers: { Authorization: `Bearer ${userSessionData.token}` }
  });
  assert.equal(meRes.status, 200, '/auth/me must return 200');
  const meData = await meRes.json() as any;
  assert.equal(meData.role, 'admin', 'Active session maintains admin role');
  console.log(`✓ /auth/me verified: active role=${meData.role}\n`);

  console.log(`>>> 4. Testing /admin/auth/login (Admin Portal) with lowercase username (poojak@king)...`);
  const adminPortalRes = await apiRequest('/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'poojak@king',
      password: newPassword
    })
  });
  assert.equal(adminPortalRes.status, 200, 'Admin portal login must succeed with 200');
  const adminSessionData = await adminPortalRes.json() as any;
  assert.ok(adminSessionData.token, 'Admin session token issued');
  console.log(`✓ Admin Portal Login succeeded: token=${adminSessionData.token.slice(0, 8)}...\n`);

  console.log(`>>> 5. Testing /admin/summary using admin session token...`);
  const summaryRes = await apiRequest('/admin/summary', {
    headers: { Authorization: `Bearer ${adminSessionData.token}` }
  });
  assert.equal(summaryRes.status, 200, 'Admin summary accessible');
  console.log('✓ /admin/summary returned 200.\n');

  console.log(`>>> 6. Testing /admin/accounts using admin session token...`);
  const accountsRes = await apiRequest('/admin/accounts', {
    headers: { Authorization: `Bearer ${adminSessionData.token}` }
  });
  assert.equal(accountsRes.status, 200, 'Admin accounts accessible');
  console.log('✓ /admin/accounts returned 200.\n');

  console.log('================================================================');
  console.log('  ALL AUTHENTICATION ENDPOINTS PASSED WITH 100% SUCCESS         ');
  console.log('================================================================');
}

runAuthVerification().catch((err) => {
  console.error('Authentication Audit Failed:', err);
  process.exit(1);
});
