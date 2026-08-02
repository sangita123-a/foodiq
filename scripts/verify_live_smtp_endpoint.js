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

async function main() {
  console.log("Checking 1: GET https://foodiq-2.onrender.com/api/test-smtp");
  const res1 = await getJSON('https://foodiq-2.onrender.com/api/test-smtp');
  console.log("Status:", res1.status);
  console.log("Body:", JSON.stringify(res1.data || res1.raw, null, 2));

  console.log("\nChecking 2: GET https://foodiq-2.onrender.com/api/auth/test-smtp");
  const res2 = await getJSON('https://foodiq-2.onrender.com/api/auth/test-smtp');
  console.log("Status:", res2.status);
  console.log("Body:", JSON.stringify(res2.data || res2.raw, null, 2));
}

main().catch(console.error);
