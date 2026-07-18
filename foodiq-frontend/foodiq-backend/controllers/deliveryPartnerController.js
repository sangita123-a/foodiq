const { pool } = require('../config/db');
const { fail, ok } = require('../utils/respond');

/** Admin-only listing */
const getAll = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT dp.*, u.full_name as name, u.phone_number as phone
      FROM delivery_partners dp
      JOIN users u ON dp.user_id = u.id
    `);
    return ok(res, 'Delivery partners retrieved', rows);
  } catch (error) {
    return fail(res, 500, 'Server Error', error);
  }
};

/**
 * Self-service create is disabled here — use /api/delivery/register.
 * Kept for admin provisioning only.
 */
const create = async (req, res) => {
  try {
    const { user_id, vehicle_details, vehicle_type, license_number } = req.body;
    const targetUserId = user_id || req.user.id;

    if (req.user.role !== 'admin' && targetUserId !== req.user.id) {
      return fail(res, 403, 'Not authorized');
    }
    // Non-admins must go through delivery register flow
    if (req.user.role !== 'admin') {
      return fail(
        res,
        403,
        'Use /api/delivery/register to become a delivery partner'
      );
    }

    const { rows } = await pool.query(
      `
      INSERT INTO delivery_partners (user_id, vehicle_details, vehicle_type, license_number)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) DO UPDATE SET
        vehicle_details = EXCLUDED.vehicle_details,
        vehicle_type = EXCLUDED.vehicle_type,
        license_number = EXCLUDED.license_number
      RETURNING *
    `,
      [targetUserId, vehicle_details, vehicle_type, license_number]
    );

    await pool.query("UPDATE users SET role = 'delivery_partner' WHERE id = $1", [
      targetUserId,
    ]);

    return ok(res, 'Delivery partner registered', rows[0], 201);
  } catch (error) {
    return fail(res, 500, 'Server Error', error);
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_available, current_lat, current_lng } = req.body;

    const existing = await pool.query(
      `SELECT * FROM delivery_partners WHERE id = $1`,
      [id]
    );
    if (!existing.rows[0]) return fail(res, 404, 'Delivery partner not found');

    if (
      req.user.role !== 'admin' &&
      existing.rows[0].user_id !== req.user.id
    ) {
      return fail(res, 403, 'Not authorized');
    }

    const { rows } = await pool.query(
      `
      UPDATE delivery_partners
      SET is_available = COALESCE($1, is_available),
          current_lat = COALESCE($2, current_lat),
          current_lng = COALESCE($3, current_lng),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `,
      [is_available, current_lat, current_lng, id]
    );

    return ok(res, 'Delivery partner updated', rows[0]);
  } catch (error) {
    return fail(res, 500, 'Server Error', error);
  }
};

const remove = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return fail(res, 403, 'Not authorized');
    }
    const { id } = req.params;
    const { rows } = await pool.query(
      'DELETE FROM delivery_partners WHERE id = $1 RETURNING *',
      [id]
    );
    if (!rows[0]) return fail(res, 404, 'Delivery partner not found');

    await pool.query("UPDATE users SET role = 'customer' WHERE id = $1", [
      rows[0].user_id,
    ]);

    return ok(res, 'Delivery partner removed', {});
  } catch (error) {
    return fail(res, 500, 'Server Error', error);
  }
};

module.exports = { getAll, create, update, remove };
