const https = require('https');

function postJSON(urlStr, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const url = new URL(urlStr);
    const req = https.request({
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log("Testing POST https://foodiq-2.onrender.com/api/auth/forgot-password...");
  const emailsToTest = ['admin@foodiq.com', 'ssangitasahoo48@gmail.com'];
  
  for (const email of emailsToTest) {
    console.log(`\nCalling POST /api/auth/forgot-password for: ${email}`);
    const res = await postJSON('https://foodiq-2.onrender.com/api/auth/forgot-password', { email });
    console.log("Status:", res.status);
    console.log("Body:", JSON.stringify(res.data || res.raw, null, 2));
  }
}

main().catch(console.error);
