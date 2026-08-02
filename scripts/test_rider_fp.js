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
      timeout: 15000
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
      reject(new Error('Request timed out after 15s'));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  const email = 'rider@foodiq.com';
  console.log("Calling POST /api/auth/forgot-password for registered email:", email);
  const fpRes = await postJSON('https://foodiq-2.onrender.com/api/auth/forgot-password', { email });
  console.log("=========================================");
  console.log("Forgot Password HTTP Status:", fpRes.status);
  console.log("Response Body:\n", JSON.stringify(fpRes.data || fpRes.raw, null, 2));
  console.log("=========================================");
}

run().catch(console.error);
