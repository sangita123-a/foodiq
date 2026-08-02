const https = require('https');

const req = https.request('https://foodiq-2.onrender.com/api/auth/test-smtp', {
  method: 'GET',
  timeout: 10000
}, (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log("=== SMTP DIAGNOSTIC RESPONSE ===");
    console.log("HTTP Status:", res.statusCode);
    console.log("Body:\n", body);
    console.log("================================");
  });
});

req.on('timeout', () => {
  console.error("HTTP Request timed out after 10s");
  req.destroy();
});

req.on('error', (e) => {
  console.error("HTTP Request error:", e.message);
});

req.end();
