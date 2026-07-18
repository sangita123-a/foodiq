/**
 * GDPR account erasure / anonymization.
 */
const { pool } = require('../config/db');
const { revokeAllForUser } = require('../utils/generateToken');
const { writeAudit } = require('./auditService');

const eraseUserData = async (userId, { actorId = null, req = null } = {}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Anonymize user
    await client.query(
      `UPDATE users SET
         is_deleted = TRUE,
         email = 'deleted+' || id::text || '@privacy.foodiq.invalid',
         phone_number = NULL,
         full_name = 'Deleted User',
         password_hash = '$disabled$',
         updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    // Clear payment methods
    await client.query(
      `UPDATE payment_methods SET is_active = FALSE,
         upi_id = NULL, card_holder_name = NULL, card_last4 = NULL,
         label = 'removed'
       WHERE user_id = $1`,
      [userId]
    ).catch(() => {});

    // Soft-clear addresses
    await client.query(
      `UPDATE addresses SET
         full_name = 'Removed',
         phone_number = NULL,
         house_no = NULL,
         street = 'Removed',
         landmark = NULL,
         zip_code = NULL
       WHERE user_id = $1`,
      [userId]
    ).catch(() => {});

    // Clear wishlist / favorites / cart
    await client.query(`DELETE FROM wishlists WHERE user_id = $1`, [userId]).catch(() => {});
    await client.query(`DELETE FROM favorites WHERE user_id = $1`, [userId]).catch(() => {});
    await client.query(
      `DELETE FROM restaurant_favorites WHERE user_id = $1`,
      [userId]
    ).catch(() => {});
    await client.query(
      `DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM cart WHERE user_id = $1)`,
      [userId]
    ).catch(() => {});
    await client.query(`DELETE FROM cart WHERE user_id = $1`, [userId]).catch(() => {});

    // Sessions table if present
    await client.query(`DELETE FROM user_sessions WHERE user_id = $1`, [userId]).catch(() => {});

    await client.query(
      `UPDATE privacy_requests SET status = 'completed', completed_at = NOW()
       WHERE user_id = $1 AND request_type IN ('delete', 'erase') AND status = 'queued'`,
      [userId]
    ).catch(() => {});

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  await revokeAllForUser(userId).catch(() => {});

  await writeAudit({
    userId: actorId || userId,
    role: 'system',
    action: 'privacy_erase',
    category: 'privacy',
    resourceId: userId,
    message: 'User data anonymized / erased',
    req,
  }).catch(() => {});

  return { erased: true, user_id: userId };
};

module.exports = { eraseUserData };
