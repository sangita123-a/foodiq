const https = require('https');

function postJson(urlStr, data) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const postData = JSON.stringify(data);
    const req = https.request({
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 15000,
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    req.write(postData);
    req.end();
  });
}

async function main() {
  const url = 'https://foodiq-2.onrender.com/api/auth/forgot-password';
  console.log(`Testing POST ${url}...`);
  try {
    const res = await postJson(url, { email: 'studentlanceer@gmail.com' });
    console.log("HTTP Status:", res.status);
    console.log("Response Body:\n", JSON.stringify(res.data || res.raw, null, 2));
  } catch (err) {
    console.error("Request Error:", err.message);
  }
}

main();
