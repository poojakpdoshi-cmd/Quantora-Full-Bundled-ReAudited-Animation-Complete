import assert from 'node:assert';

function assertTrue(condition: boolean, msg: string) {
  assert.ok(condition, msg);
}

async function testDualRoleLogins() {
  console.log('================================================================');
  console.log('   TESTING OWNER 2FA ADMIN PANEL & SUBSCRIBER DIRECT LOGINS     ');
  console.log('================================================================\n');

  // [TEST 1] STANDARD SUBSCRIBER (DIRECT EMAIL OTP -> 200 CREDITS -> NO PASSWORD)
  console.log('>>> [1/2] TESTING STANDARD SUBSCRIBER LOGIN FLOW (NO PASSWORD NEEDED)...');
  const subscriberEmail = `client_${Date.now()}@gmail.com`;
  const subInstallId = crypto.randomUUID();

  const subSendRes = await fetch('http://127.0.0.1:8787/auth/otp/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: subscriberEmail, installationId: subInstallId })
  });
  assertTrue(subSendRes.status === 200, 'Subscriber OTP send must succeed');
  const subSendData = await subSendRes.json() as any;

  const subVerifyRes = await fetch('http://127.0.0.1:8787/auth/otp/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: subscriberEmail, otp: subSendData.debugOtp || '123456', installationId: subInstallId })
  });
  assertTrue(subVerifyRes.status === 200, 'Subscriber OTP verify must succeed');
  const subSession = await subVerifyRes.json() as any;
  assertTrue(subSession.credits === 200, 'Subscriber must receive 200 credits');
  assertTrue(subSession.role === 'subscriber', 'Subscriber role must be subscriber');
  console.log(`  ✓ Standard User ${subscriberEmail} logged in directly without password!`);
  console.log(`    • Role: ${subSession.role}`);
  console.log(`    • Credits: ${subSession.credits} Free Tier Credits`);

  // [TEST 2] OWNER EMAIL (OTP -> 2FA ADMIN CREDENTIALS -> ADMIN DASHBOARD ACCESS)
  console.log('\n>>> [2/2] TESTING OWNER 2FA ADMIN PANEL LOGIN (POOJAKPDOSHI@GMAIL.COM)...');
  const ownerEmail = 'poojakpdoshi@gmail.com';
  const ownerInstallId = crypto.randomUUID();

  const ownerSendRes = await fetch('http://127.0.0.1:8787/auth/otp/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: ownerEmail, installationId: ownerInstallId })
  });
  assertTrue(ownerSendRes.status === 200, 'Owner OTP send must succeed');
  const ownerSendData = await ownerSendRes.json() as any;

  const ownerVerifyRes = await fetch('http://127.0.0.1:8787/auth/otp/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: ownerEmail, otp: ownerSendData.debugOtp || '123456', installationId: ownerInstallId })
  });
  assertTrue(ownerVerifyRes.status === 200, 'Owner OTP verify must succeed');
  const ownerSession = await ownerVerifyRes.json() as any;
  assertTrue(ownerSession.role === 'admin', 'Owner role must be admin');
  console.log(`  ✓ Step 1: Owner Email ${ownerEmail} verified via OTP (Role: ${ownerSession.role})`);

  // Step 2: 2FA Master Admin Login Challenge
  console.log('  ✓ Step 2: 2FA Master Admin Challenge Activated for Owner...');
  const adminAuthRes = await fetch('http://127.0.0.1:8787/admin/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      username: 'poojak@king',
      password: 'admin123'
    })
  });
  assertTrue(adminAuthRes.status === 200, 'Admin 2FA credentials must authenticate');
  const adminSession = await adminAuthRes.json() as any;
  assertTrue(Boolean(adminSession.token), 'Admin master token must be issued');
  console.log(`  ✓ Step 3: Master Admin Token issued: ${adminSession.token.slice(0, 14)}...`);
  console.log(`  ✓ Step 4: Admin Panel Master Control Room unlocked successfully!`);

  console.log('\n================================================================');
  console.log('   🎉 DUAL LOGIN SYSTEM 100% OPERATIONAL & VERIFIED!           ');
  console.log('================================================================\n');
}

testDualRoleLogins().catch(console.error);
