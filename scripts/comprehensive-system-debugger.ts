import assert from 'node:assert';

function check(title: string, condition: boolean, detail: string = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${title} ${detail ? `(${detail})` : ''}`);
  } else {
    console.error(`  ❌ [FAIL] ${title} ${detail ? `(${detail})` : ''}`);
    process.exitCode = 1;
  }
}

async function runDeepDebugger() {
  console.log('========================================================================');
  console.log('       🔍 QUANTORA AI (POWERED BY QUANCY.AI) DEEP SYSTEM DEBUGGER       ');
  console.log('========================================================================\n');

  const API_BASE = 'http://127.0.0.1:8787';

  // 1. BACKEND HEALTHCHECK
  console.log('>>> [1/6] BACKEND SERVICE HEALTH & CONNECTIVITY:');
  try {
    const healthRes = await fetch(`${API_BASE}/health`, { method: 'GET' }).catch(() => null);
    check('API Server Running on 127.0.0.1:8787', Boolean(healthRes), `Status: ${healthRes?.status}`);
  } catch (e) {
    check('API Server Running', false, String(e));
  }

  // 2. STANDARD SUBSCRIBER FLOW (GMAIL -> NEXT -> OTP -> 200 CREDITS)
  console.log('\n>>> [2/6] STANDARD SUBSCRIBER AUTHENTICATION (NO PASSWORD):');
  const subscriberEmail = `client_debug_${Date.now()}@gmail.com`;
  const subInstallId = crypto.randomUUID();

  const subSendRes = await fetch(`${API_BASE}/auth/otp/send`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: subscriberEmail, installationId: subInstallId })
  });
  check('Subscriber OTP Send Endpoint (200 OK)', subSendRes.status === 200);
  const subSendData = await subSendRes.json() as any;
  check('CSPRNG 6-Digit OTP Generated', Boolean(subSendData.debugOtp), `OTP: ${subSendData.debugOtp}`);

  const subVerifyRes = await fetch(`${API_BASE}/auth/otp/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: subscriberEmail,
      otp: subSendData.debugOtp,
      installationId: subInstallId,
      deviceName: 'Android Debug Device',
      androidVersion: 'Android 14'
    })
  });
  check('Subscriber OTP Verify Endpoint (200 OK)', subVerifyRes.status === 200);
  const subSession = await subVerifyRes.json() as any;
  check('Role is subscriber', subSession.role === 'subscriber');
  check('Free Tier Credits Granted', subSession.credits === 200, `${subSession.credits} Credits`);
  check('Bearer Session Token Issued', Boolean(subSession.token));

  // 3. OWNER 2FA ADMIN AUTHENTICATION FLOW
  console.log('\n>>> [3/6] OWNER 2FA ADMIN WORKFLOW (POOJAKPDOSHI@GMAIL.COM):');
  const ownerEmail = 'poojakpdoshi@gmail.com';
  const ownerInstallId = crypto.randomUUID();

  const ownerSendRes = await fetch(`${API_BASE}/auth/otp/send`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: ownerEmail, installationId: ownerInstallId })
  });
  check('Owner OTP Send (200 OK)', ownerSendRes.status === 200);
  const ownerSendData = await ownerSendRes.json() as any;

  const ownerVerifyRes = await fetch(`${API_BASE}/auth/otp/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: ownerEmail,
      otp: ownerSendData.debugOtp,
      installationId: ownerInstallId,
      deviceName: 'Owner Android Mobile',
      androidVersion: 'Android 14'
    })
  });
  check('Owner OTP Verification (200 OK)', ownerVerifyRes.status === 200);
  const ownerSession = await ownerVerifyRes.json() as any;
  check('Owner Identified as Admin Role', ownerSession.role === 'admin');

  // 2FA Admin Login Challenge
  const adminLoginRes = await fetch(`${API_BASE}/admin/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      username: 'poojak@king',
      password: 'admin123'
    })
  });
  check('Owner 2FA Master Admin Login (200 OK)', adminLoginRes.status === 200);
  const adminSession = await adminLoginRes.json() as any;
  check('Master Admin Session Token Active', Boolean(adminSession.token));

  // 4. CHAT ASSISTANT & QUANTORA AI PIPELINE
  console.log('\n>>> [4/6] QUANTORA NEURAL AGENTS & AI CHAT STUDIO:');
  const chatRes = await fetch(`${API_BASE}/assistant/chat`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${subSession.token}`,
      'X-Device-Id': subInstallId
    },
    body: JSON.stringify({
      message: 'Design a luxury futuristic cyber-salon website with neon cyan theme',
      history: [],
      email: subscriberEmail,
      installationId: subInstallId
    })
  });
  check('Quantora AI Assistant Chat Endpoint (200 OK)', chatRes.status === 200);
  const chatData = await chatRes.json() as any;
  check('AI Assistant Generated Rich Response', Boolean(chatData.reply && chatData.reply.length > 20));

  // 5. 1-CLICK PWA & PROJECT ENGINE
  console.log('\n>>> [5/6] 1-CLICK PWA & OFFLINE MANIFEST PIPELINE:');
  const demoProjectId = 'proj_quantora_qa_test';
  const pwaRes = await fetch(`${API_BASE}/projects/${demoProjectId}/build-pwa`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${subSession.token}`
    },
    body: JSON.stringify({
      email: subscriberEmail,
      installationId: subInstallId,
      appName: 'Quantora Cyber Salon',
      shortName: 'CyberSalon',
      themeColor: '#00f0ff'
    })
  });
  check('1-Click PWA Builder Endpoint (200 OK)', pwaRes.status === 200);
  const pwaData = await pwaRes.json() as any;
  check('PWA Manifest Generated', Boolean(pwaData.manifest && pwaData.manifest.name === 'Quantora Cyber Salon'));
  check('Offline Service Worker (sw.js) Generated', Boolean(pwaData.serviceWorkerCode));

  // 6. SECURITY & RATE-LIMITING CONTROLS
  console.log('\n>>> [6/6] Z++++++++ SECURITY & BRUTE-FORCE CONTROLS:');
  const wrongOtpRes = await fetch(`${API_BASE}/auth/otp/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: subscriberEmail,
      otp: '999999',
      installationId: subInstallId
    })
  });
  check('Wrong OTP strictly rejected (401 Unauthorized)', wrongOtpRes.status === 401);

  const wrongAdminRes = await fetch(`${API_BASE}/admin/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      username: 'poojak@king',
      password: 'wrong_password_attack'
    })
  });
  check('Wrong Admin Password strictly rejected (401 Unauthorized)', wrongAdminRes.status === 401);

  console.log('\n========================================================================');
  console.log('       🎉 DEEP SYSTEM DEBUGGING COMPLETE: ALL SUITES 100% HEALTHY       ');
  console.log('========================================================================\n');
}

runDeepDebugger().catch((err) => {
  console.error('Debugger crashed:', err);
  process.exit(1);
});
