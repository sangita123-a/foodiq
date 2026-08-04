import fetch from 'node-fetch';

async function testProdLogin() {
  console.log('Testing production Delivery Partner Login endpoint...');
  const res = await fetch('https://foodiq-2.onrender.com/api/delivery/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'active.rider@foodiq.com',
      password: 'TestPassword123!',
    }),
  });

  const data = await res.json();
  console.log('Production Login Response Status:', res.status);
  console.log('Production Login Response Data:', JSON.stringify(data, null, 2));
}

testProdLogin().catch(console.error);
