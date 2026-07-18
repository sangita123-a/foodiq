const { pool } = require('../config/db');
const { encryptField, decryptField } = require('../utils/fieldCrypto');

const mapAddress = (row) => {
  if (!row) return row;
  return {
    ...row,
    phone_number: decryptField(row.phone_number),
    house_no: decryptField(row.house_no),
    street: decryptField(row.street),
    landmark: decryptField(row.landmark),
  };
};

const getAddresses = async (userId) => {
  const { rows } = await pool.query(
    'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
    [userId]
  );
  return rows.map(mapAddress);
};

const getAddressById = async (id, userId) => {
  const { rows } = await pool.query('SELECT * FROM addresses WHERE id = $1 AND user_id = $2', [
    id,
    userId,
  ]);
  return mapAddress(rows[0]);
};

const unsetOtherDefaults = async (userId, excludeId) => {
  await pool.query('UPDATE addresses SET is_default = false WHERE user_id = $1 AND id != $2', [
    userId,
    excludeId,
  ]);
};

const createAddress = async (userId, addressData) => {
  const {
    full_name,
    phone_number,
    house_no,
    street,
    landmark,
    city,
    state,
    zip_code,
    address_type,
    is_default,
  } = addressData;

  const query = `
    INSERT INTO addresses (user_id, full_name, phone_number, house_no, street, landmark, city, state, zip_code, address_type, is_default)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11, false))
    RETURNING *
  `;
  const values = [
    userId,
    full_name,
    encryptField(phone_number),
    encryptField(house_no),
    encryptField(street),
    encryptField(landmark),
    city,
    state,
    zip_code,
    address_type,
    is_default,
  ];

  const { rows } = await pool.query(query, values);

  if (rows[0].is_default) {
    await unsetOtherDefaults(userId, rows[0].id);
  }

  return mapAddress(rows[0]);
};

const updateAddress = async (id, userId, addressData) => {
  const {
    full_name,
    phone_number,
    house_no,
    street,
    landmark,
    city,
    state,
    zip_code,
    address_type,
    is_default,
  } = addressData;

  const query = `
    UPDATE addresses
    SET full_name = COALESCE($1, full_name),
        phone_number = COALESCE($2, phone_number),
        house_no = COALESCE($3, house_no),
        street = COALESCE($4, street),
        landmark = COALESCE($5, landmark),
        city = COALESCE($6, city),
        state = COALESCE($7, state),
        zip_code = COALESCE($8, zip_code),
        address_type = COALESCE($9, address_type),
        is_default = COALESCE($10, is_default)
    WHERE id = $11 AND user_id = $12
    RETURNING *
  `;
  const values = [
    full_name,
    phone_number != null ? encryptField(phone_number) : null,
    house_no != null ? encryptField(house_no) : null,
    street != null ? encryptField(street) : null,
    landmark != null ? encryptField(landmark) : null,
    city,
    state,
    zip_code,
    address_type,
    is_default,
    id,
    userId,
  ];
  const { rows } = await pool.query(query, values);

  if (rows[0] && rows[0].is_default) {
    await unsetOtherDefaults(userId, rows[0].id);
  }

  return mapAddress(rows[0]);
};

const deleteAddress = async (id, userId) => {
  const { rows } = await pool.query(
    'DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );
  return rows[0];
};

module.exports = {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
};
