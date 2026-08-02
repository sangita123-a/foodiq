const https = require('https');

function fetchJson(urlStr) {
  return new Promise((resolve) => {
    const req = https.get(urlStr, { timeout: 15000 }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', (err) => resolve({ status: 0, error: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, error: 'TIMEOUT' });
    });
  });
}

async function poll() {
  const url = 'https://foodiq-2.onrender.com/api/test-smtp';
  console.log(`Starting polling for Render deploy at: ${url}`);
  const maxAttempts = 30; // 30 * 10s = 300s (5 mins max)

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`\n--- Attempt ${attempt}/${maxAttempts} (${new Date().toISOString()}) ---`);
    const res = await fetchJson(url);
    console.log(`Status Code: ${res.status}`);
    
    if (res.data) {
      console.log("Response Body:\n", JSON.stringify(res.data, null, 2));
      if (res.data.success === true) {
        console.log("\n==================================================");
        console.log("🎉 SMTP VERIFICATION SUCCESSFUL!");
        console.log("   Host/IP used:", res.data.data?.verification?.ipUsed || res.data.data?.verification?.host);
        console.log("   Port used   :", res.data.data?.verification?.port);
        console.log("   Secure      :", res.data.data?.verification?.secure);
        console.log("   RequireTLS  :", res.data.data?.verification?.requireTLS);
        console.log("==================================================");
        process.exit(0);
      }
    } else if (res.raw) {
      console.log("Raw Response:", res.raw.slice(0, 300));
    } else if (res.error) {
      console.log("Network Error:", res.error);
    }

    console.log("Waiting 10s for Render build / deploy to finish...");
    await new Promise(r => setTimeout(r, 10000));
  }

  console.error("❌ Polling timed out before SMTP verification succeeded.");
  process.exit(1);
}

poll().catch(console.error);
