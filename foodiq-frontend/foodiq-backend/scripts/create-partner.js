require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

async function main() {
  try {
    const email = 'ssangitasahoo48@gmail.com';
    const password = 'Sangita@5043';
    const hash = await bcrypt.hash(password, 10);

    // 1. Update users table password & role
    const userRes = await pool.query(
      `UPDATE users
       SET password_hash = $1, role = 'delivery_partner', updated_at = CURRENT_TIMESTAMP
       WHERE LOWER(email) = $2
       RETURNING id, email, full_name`,
      [hash, email.toLowerCase()]
    );

    let userId;
    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
      console.log('UPDATED USER:', userRes.rows[0]);
    } else {
      const newUser = await pool.query(
        `INSERT INTO users (full_name, email, phone_number, password_hash, role)
         VALUES ($1, $2, $3, $4, 'delivery_partner')
         RETURNING id, email, full_name`,
        ['Sangita Sahoo', email.toLowerCase(), '9876543210', hash]
      );
      userId = newUser.rows[0].id;
      console.log('CREATED USER:', newUser.rows[0]);
    }

    // 2. Check delivery_partners table
    const existing = await pool.query('SELECT * FROM delivery_partners WHERE LOWER(email) = $1', [email.toLowerCase()]);

    if (existing.rows.length > 0) {
      const res = await pool.query(
        `UPDATE delivery_partners
         SET user_id = $1, password_hash = $2, is_verified = TRUE, status = 'approved', approval_status = 'approved', is_online = TRUE, updated_at = CURRENT_TIMESTAMP
         WHERE LOWER(email) = $3
         RETURNING id, full_name, email, status, is_verified`,
        [userId, hash, email.toLowerCase()]
      );
      console.log('UPDATED PARTNER:', res.rows[0]);
    } else {
      const res = await pool.query(
        `INSERT INTO delivery_partners (
          user_id, full_name, email, phone_number, password_hash,
          vehicle_type, vehicle_number, driving_license_number, aadhaar_number,
          state, city, address, is_verified, status, approval_status, is_online
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11, $12, TRUE, 'approved', 'approved', TRUE
        ) RETURNING id, full_name, email, status, is_verified`,
        [
          userId,
          'Sangita Sahoo',
          email.toLowerCase(),
          '9876543210',
          hash,
          'Scooter',
          'TS-09-EX-9999',
          'TS0920210012345',
          '123456789012',
          'Telangana',
          'Hyderabad',
          '123, Jubilee Hills, Hyderabad'
        ]
      );
      console.log('CREATED PARTNER:', res.rows[0]);
    }

    console.log('SUCCESSFULLY CONFIGURED RIDER ACCOUNT FOR:', email);
  } catch (err) {
    console.error('Error creating/updating partner:', err);
  } finally {
    process.exit(0);
  }
}

main();
