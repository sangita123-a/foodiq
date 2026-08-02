const https = require('https');

function postJSON(urlStr, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const body = JSON.stringify(data);
    const req = https.request({
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 20000
    }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseBody) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: responseBody });
        }
      });
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out after 20s'));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  const timestamp = Date.now();
  const email = `fresh_test_${timestamp}@example.com`;
  const phone = `98${String(timestamp).slice(-8)}`;

  console.log("1. Registering fresh user:", email);
  const regRes = await postJSON('https://foodiq-2.onrender.com/api/auth/register', {
    full_name: "Fresh Test User",
    email,
    phone,
    password: "Password123!"
  });
  console.log("Register Status:", regRes.status, regRes.data || regRes.raw);

  console.log("\n2. Requesting Forgot Password for registered email:", email);
  const fpRes = await postJSON('https://foodiq-2.onrender.com/api/auth/forgot-password', { email });
  console.log("=== FORGOT PASSWORD RESPONSE ===");
  console.log("HTTP Status:", fpRes.status);
  console.log("Body:", JSON.stringify(fpRes.data || fpRes.raw, null, 2));
  console.log("=================================");
}

run().catch(console.error);
