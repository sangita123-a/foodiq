const { pool } = require('../config/db');

const listVehicles = async ({ organizationId = null } = {}) => {
  const { rows } = await pool.query(
    `SELECT * FROM fleet_vehicles
     WHERE ($1::uuid IS NULL OR organization_id = $1)
     ORDER BY created_at DESC LIMIT 100`,
    [organizationId]
  );
  return rows;
};

const createVehicle = async ({ organization_id, market_id, label, vehicle_type, capacity }) => {
  const { rows } = await pool.query(
    `INSERT INTO fleet_vehicles (organization_id, market_id, label, vehicle_type, capacity)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [organization_id || null, market_id || null, label, vehicle_type || 'bike', capacity || 4]
  );
  return rows[0];
};

module.exports = { listVehicles, createVehicle };
