const path = require('path');
const backendDir = path.join(__dirname, '../foodiq-frontend/foodiq-backend');
require(path.join(backendDir, 'node_modules/dotenv')).config({ path: path.join(backendDir, '.env') });
if (!process.env.DB_PASSWORD && process.env.NODE_ENV !== 'production') {
  process.env.DB_PASSWORD = 'postgres';
}
const http = require('http');
const express = require(path.join(backendDir, 'node_modules/express'));
const cookieParser = require(path.join(backendDir, 'node_modules/cookie-parser'));
const ensureSchema = require(path.join(backendDir, 'utils/ensureSchema'));
const deliveryRoutes = require(path.join(backendDir, 'routes/deliveryRoutes'));
const { pool } = require(path.join(backendDir, 'config/db'));
const bcrypt = require(path.join(backendDir, 'node_modules/bcrypt'));

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/delivery', deliveryRoutes);

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const req = http.request({
      hostname: '127.0.0.1',
      port: 4099,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers
      }
    }, res => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resBody), headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, raw: resBody, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log("=== STARTING HTTP API INTEGRATION TESTS FOR DELIVERY AUTH ===");
  await ensureSchema();

  const server = app.listen(4099, '127.0.0.1');

  try {
    const email = 'http.rider@foodiq.com';
    const initialPass = 'InitialPass123!';
    const initialHash = await bcrypt.hash(initialPass, 10);

    // Clean & insert user & delivery partner
    await pool.query('DELETE FROM delivery_partners WHERE LOWER(email) = $1', [email]);
    await pool.query('DELETE FROM users WHERE LOWER(email) = $1', [email]);

    const uRes = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone_number, role)
       VALUES ($1, $2, 'HTTP Rider', '9888877777', 'delivery_partner') RETURNING id`,
      [email, initialHash]
    );
    const userId = uRes.rows[0].id;

    await pool.query(
      `INSERT INTO delivery_partners (
         user_id, full_name, email, phone_number, password_hash,
         vehicle_type, vehicle_number, driving_license_number, license_number,
         is_verified, is_online, is_available, status, approval_status
       ) VALUES ($1, 'HTTP Rider', $2, '9888877777', $3, 'Bike', 'KA-01-HTTP', 'DL-HTTP', 'DL-HTTP', TRUE, TRUE, TRUE, 'approved', 'approved')`,
      [userId, email, initialHash]
    );

    // 1. POST /api/delivery/login
    console.log('\n1. Testing POST /api/delivery/login...');
    const loginRes = await request('POST', '/api/delivery/login', { email, password: initialPass, rememberMe: true });
    console.log('Status:', loginRes.status, 'Success:', loginRes.data?.success);
    if (loginRes.status !== 200 || !loginRes.data?.data?.token) {
      throw new Error('Login failed: ' + JSON.stringify(loginRes.data));
    }
    const token = loginRes.data.data.token;
    const refreshToken = loginRes.data.data.refreshToken;
    console.log('✔ Login successful. Received token and refreshToken.');

    // 2. POST /api/delivery/refresh
    console.log('\n2. Testing POST /api/delivery/refresh...');
    const refreshRes = await request('POST', '/api/delivery/refresh', { refreshToken });
    console.log('Status:', refreshRes.status, 'Success:', refreshRes.data?.success);
    if (refreshRes.status !== 200 || !refreshRes.data?.data?.token) {
      throw new Error('Refresh failed: ' + JSON.stringify(refreshRes.data));
    }
    console.log('✔ Token refreshed successfully.');

    // 3. POST /api/delivery/forgot-password
    console.log('\n3. Testing POST /api/delivery/forgot-password...');
    const fpRes = await request('POST', '/api/delivery/forgot-password', { email });
    console.log('Status:', fpRes.status, 'Message:', fpRes.data?.message);
    if (fpRes.status !== 200) {
      throw new Error('Forgot password failed: ' + JSON.stringify(fpRes.data));
    }
    console.log('✔ Forgot password OTP generated and stored in DB.');

    // Inject known OTP '112233'
    const crypto = require('crypto');
    const testOtp = '112233';
    const testHash = crypto.createHash('sha256').update(testOtp).digest('hex');
    await pool.query('UPDATE delivery_partners SET reset_otp_hash = $1, reset_otp_expiry = NOW() + INTERVAL \'15 min\', reset_otp_attempts = 0 WHERE LOWER(email) = $2', [testHash, email]);

    // 4. POST /api/delivery/verify-reset-otp
    console.log('\n4. Testing POST /api/delivery/verify-reset-otp...');
    const vRes = await request('POST', '/api/delivery/verify-reset-otp', { email, otp: testOtp });
    console.log('Status:', vRes.status, 'Message:', vRes.data?.message);
    if (vRes.status !== 200) {
      throw new Error('Verify reset OTP failed: ' + JSON.stringify(vRes.data));
    }
    console.log('✔ Verify reset OTP successful.');

    // 5. POST /api/delivery/reset-password
    console.log('\n5. Testing POST /api/delivery/reset-password...');
    const newPass = 'NewHttpPass123!';
    const rpRes = await request('POST', '/api/delivery/reset-password', { email, otp: testOtp, new_password: newPass });
    console.log('Status:', rpRes.status, 'Message:', rpRes.data?.message);
    if (rpRes.status !== 200) {
      throw new Error('Reset password failed: ' + JSON.stringify(rpRes.data));
    }
    console.log('✔ Reset password successful.');

    // Verify login with new password
    const newLoginRes = await request('POST', '/api/delivery/login', { email, password: newPass });
    if (newLoginRes.status !== 200) {
      throw new Error('Login with new password failed');
    }
    console.log('✔ Login with NEW password successful.');

    // 6. POST /api/delivery/logout
    console.log('\n6. Testing POST /api/delivery/logout...');
    const logoutRes = await request('POST', '/api/delivery/logout', { refreshToken: newLoginRes.data.data.refreshToken }, { Authorization: `Bearer ${newLoginRes.data.data.token}` });
    console.log('Status:', logoutRes.status, 'Message:', logoutRes.data?.message);
    if (logoutRes.status !== 200) {
      throw new Error('Logout failed: ' + JSON.stringify(logoutRes.data));
    }
    console.log('✔ Logout successful.');

    console.log('\n==================================================');
    console.log('ALL 6 DELIVERY AUTH API ENDPOINTS TESTED AND PASSED!');
    console.log('==================================================');

  } finally {
    server.close();
    await pool.end();
  }
}

main().catch(err => {
  console.error('❌ HTTP API Test Failed:', err);
  process.exit(1);
});
