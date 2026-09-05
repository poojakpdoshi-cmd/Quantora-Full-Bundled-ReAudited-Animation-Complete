async function testFullLiveAuthFlow() {
  console.log('1. Sending OTP to poojakpdoshi@gmail.com...');
  const sendRes = await fetch('https://website-maker-ai-api.poojakpdoshi.workers.dev/auth/otp/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'poojakpdoshi@gmail.com', installationId: 'e2e-live-test' })
  });
  const sendData = await sendRes.json();
  console.log('Send OTP Status:', sendRes.status, sendData);

  console.log('\n2. Testing wrong OTP rejection...');
  const wrongRes = await fetch('https://website-maker-ai-api.poojakpdoshi.workers.dev/auth/otp/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: 'poojakpdoshi@gmail.com',
      otp: '000000',
      installationId: 'e2e-live-test'
    })
  });
  console.log('Wrong OTP Status:', wrongRes.status, await wrongRes.json());
}

testFullLiveAuthFlow().catch(console.error);
