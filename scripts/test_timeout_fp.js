const https = require('https');

const req = https.request('https://foodiq-2.onrender.com/api/auth/forgot-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 20000
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log("=== FORGOT PASSWORD SERVER RESPONSE ===");
    console.log("HTTP Status:", res.statusCode);
    console.log("Response Body:\n", body);
    console.log("=======================================");
  });
});

req.on('timeout', () => {
  console.error("HTTP Request timed out after 20 seconds!");
  req.destroy();
});

req.on('error', (e) => {
  console.error("HTTP Request Error:", e.message);
});

req.write(JSON.stringify({ email: "admin@foodiq.com" }));
req.end();
