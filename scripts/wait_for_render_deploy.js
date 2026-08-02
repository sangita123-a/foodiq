const https = require('https');

function fetchTestSmtp() {
  return new Promise((resolve) => {
    https.get('https://foodiq-2.onrender.com/api/test-smtp', (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    }).on('error', (err) => {
      resolve({ status: 0, error: err.message });
    });
  });
}

async function main() {
  const start = Date.now();
  console.log("Polling https://foodiq-2.onrender.com/api/test-smtp for Render deployment...");

  for (let i = 1; i <= 20; i++) {
    const res = await fetchTestSmtp();
    const elapsed = Math.round((Date.now() - start) / 1000);
    console.log(`[Attempt ${i} | ${elapsed}s] Status: ${res.status}`);
    
    if (res.status !== 404 && res.status !== 0 && res.status !== 502) {
      console.log("\n=== RENDER DEPLOYMENT ACTIVE & ENDPOINT VERIFIED ===");
      console.log(JSON.stringify(res.data || res.raw, null, 2));
      return res;
    }
    
    await new Promise(r => setTimeout(r, 10000));
  }
  console.log("Timeout waiting for deployment.");
}

main().catch(console.error);
