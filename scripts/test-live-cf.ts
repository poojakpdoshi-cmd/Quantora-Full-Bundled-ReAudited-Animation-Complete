async function testLiveCloudflare() {
  console.log('Testing live Cloudflare Worker: https://website-maker-ai-api.poojakpdoshi.workers.dev/auth/otp/send');
  const res = await fetch('https://website-maker-ai-api.poojakpdoshi.workers.dev/auth/otp/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: 'poojakpdoshi@gmail.com',
      installationId: 'test-install-live'
    })
  });
  console.log('Response Status:', res.status);
  const data = await res.json();
  console.log('Response Payload:', JSON.stringify(data, null, 2));
}

testLiveCloudflare().catch(console.error);
