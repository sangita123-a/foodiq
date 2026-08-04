import fetch from 'node-fetch';

const email = 'ssangitasahoo48@gmail.com';
const password = 'FoodiqRider@2026!';
const phone = `9${Math.floor(100000000 + Math.random() * 800000000)}`;
const dl = `DL-REAL-${Date.now()}`;

async function run() {
  console.log('Registering delivery partner with email:', email);
  const res = await fetch('https://foodiq-2.onrender.com/api/delivery/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: 'Sangita Sahoo',
      email,
      phone_number: phone,
      password,
      confirm_password: password,
      vehicle_type: 'Bike',
      vehicle_number: 'KA-01-REAL-100',
      driving_license_number: dl,
      aadhaar_number: '123456789012',
      city: 'Bangalore',
      state: 'Karnataka',
      address: '123 Real Test Street',
    }),
  });
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(data, null, 2));
  console.log('\nCredentials for later steps:');
  console.log(JSON.stringify({ email, password, phone, dl }, null, 2));
}
run().catch(console.error);
