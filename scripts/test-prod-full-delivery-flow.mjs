import fetch from 'node-fetch';

async function testFullFlow() {
  const testEmail = `prod.rider.${Date.now()}@foodiq.com`;
  const testPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const testPassword = 'RiderPass123!';
  const testDl = `DL-${Date.now()}`;

  console.log('1. Registering test partner on production backend...');
  const regRes = await fetch('https://foodiq-2.onrender.com/api/delivery/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: 'Production Test Rider',
      email: testEmail,
      phone_number: testPhone,
      password: testPassword,
      confirm_password: testPassword,
      vehicle_type: 'Bike',
      vehicle_number: 'KA-01-PROD-100',
      driving_license_number: testDl,
      aadhaar_number: '123456789012',
      city: 'Bangalore',
      state: 'Karnataka',
      address: '123 Tech Park',
    }),
  });

  const regData = await regRes.json();
  console.log('Register Status:', regRes.status);
  console.log('Register Response:', JSON.stringify(regData, null, 2));

  console.log('\n2. Logging in with newly registered test partner on production backend...');
  const loginRes = await fetch('https://foodiq-2.onrender.com/api/delivery/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });

  const loginData = await loginRes.json();
  console.log('Login Status:', loginRes.status);
  console.log('Login Response:', JSON.stringify(loginData, null, 2));

  if (loginData.success && loginData.data?.token) {
    console.log('\n3. Testing protected me endpoint (/api/delivery/me) on production...');
    const meRes = await fetch('https://foodiq-2.onrender.com/api/delivery/me', {
      headers: {
        'Authorization': `Bearer ${loginData.data.token}`,
      },
    });
    const meData = await meRes.json();
    console.log('Me Status:', meRes.status);
    console.log('Me Response:', JSON.stringify(meData, null, 2));
  }
}

testFullFlow().catch(console.error);
