const https = require('https');

function getJSON(urlStr) {
  return new Promise((resolve, reject) => {
    https.get(urlStr, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    }).on('error', reject);
  });
}

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
      }
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
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  console.log("==================================================");
  console.log("1. Testing GET /api/auth/test-smtp (transporter.verify())...");
  console.log("==================================================");
  
  try {
    const smtpRes = await getJSON('https://foodiq-2.onrender.com/api/auth/test-smtp');
    console.log("HTTP Status:", smtpRes.status);
    console.log("Response Body:\n", JSON.stringify(smtpRes.data || smtpRes.raw, null, 2));
  } catch (err) {
    console.error("Test SMTP Error:", err.message);
  }

  console.log("\n==================================================");
  console.log("2. Testing POST /api/auth/forgot-password (admin@foodiq.com)...");
  console.log("==================================================");
  
  try {
    const fpRes = await postJSON('https://foodiq-2.onrender.com/api/auth/forgot-password', { email: 'admin@foodiq.com' });
    console.log("HTTP Status:", fpRes.status);
    console.log("Response Body:\n", JSON.stringify(fpRes.data || fpRes.raw, null, 2));
  } catch (err) {
    console.error("Forgot Password Error:", err.message);
  }
}

run();
