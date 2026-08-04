import fetch from 'node-fetch';
const email = 'ssangitasahoo48@gmail.com';

async function run() {
  console.log('1. Checking forgot-password for', email, '(tells us if account exists)');
  const res = await fetch('https://foodiq-2.onrender.com/api/delivery/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(data, null, 2));
}
run().catch(console.error);
