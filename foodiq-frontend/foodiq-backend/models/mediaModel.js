const { pool } = require('../config/db');

const insertMedia = async (row) => {
  const { rows } = await pool.query(
    `INSERT INTO media_assets (
       user_id, purpose, folder, url, public_id, provider, mime_type, file_type,
       file_size, width, height, format, status, entity_type, entity_id, variants, meta
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,$17::jsonb
     ) RETURNING *`,
    [
      row.user_id,
      row.purpose,
      row.folder || null,
      row.url,
      row.public_id,
      row.provider,
      row.mime_type,
      row.file_type,
      row.file_size || 0,
      row.width || null,
      row.height || null,
      row.format || null,
      row.status || 'approved',
      row.entity_type || null,
      row.entity_id || null,
      JSON.stringify(row.variants || {}),
      JSON.stringify(row.meta || {}),
    ]
  );
  return rows[0];
};

const getMediaById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM media_assets WHERE id = $1', [id]);
  return rows[0] || null;
};

const listMedia = async ({
  userId = null,
  purpose = '',
  status = '',
  q = '',
  fileType = '',
  provider = '',
  limit = 50,
  offset = 0,
  admin = false,
} = {}) => {
  const { rows } = await pool.query(
    `SELECT m.*, u.full_name AS uploader_name, u.email AS uploader_email
     FROM media_assets m
     LEFT JOIN users u ON u.id = m.user_id
     WHERE ($1::uuid IS NULL OR m.user_id = $1 OR $2::boolean = TRUE)
       AND ($3 = '' OR m.purpose = $3)
       AND ($4 = '' OR m.status = $4)
       AND ($5 = '' OR m.file_type = $5)
       AND ($6 = '' OR m.provider = $6)
       AND (
         $7 = '' OR m.url ILIKE '%' || $7 || '%' OR m.public_id ILIKE '%' || $7 || '%'
         OR m.purpose ILIKE '%' || $7 || '%' OR u.full_name ILIKE '%' || $7 || '%'
       )
     ORDER BY m.created_at DESC
     LIMIT $8 OFFSET $9`,
    [
      userId,
      admin,
      purpose || '',
      status || '',
      fileType || '',
      provider || '',
      q.trim(),
      Math.min(Number(limit) || 50, 200),
      Number(offset) || 0,
    ]
  );
  return rows;
};

const updateMediaStatus = async (id, status, reviewedBy = null) => {
  const { rows } = await pool.query(
    `UPDATE media_assets SET
       status = $1,
       reviewed_by = COALESCE($2, reviewed_by),
       reviewed_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [status, reviewedBy, id]
  );
  return rows[0] || null;
};

const softDeleteMedia = async (id) => {
  const { rows } = await pool.query(
    `UPDATE media_assets SET
       status = 'deleted',
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return rows[0] || null;
};

const hardDeleteMedia = async (id) => {
  const { rows } = await pool.query(
    `DELETE FROM media_assets WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0] || null;
};

const bulkSoftDelete = async (ids = []) => {
  if (!ids.length) return [];
  const { rows } = await pool.query(
    `UPDATE media_assets SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
     WHERE id = ANY($1::uuid[])
     RETURNING *`,
    [ids]
  );
  return rows;
};

const attachEntity = async (id, entityType, entityId) => {
  const { rows } = await pool.query(
    `UPDATE media_assets SET
       entity_type = $1,
       entity_id = $2,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [entityType, entityId, id]
  );
  return rows[0] || null;
};

module.exports = {
  insertMedia,
  getMediaById,
  listMedia,
  updateMediaStatus,
  softDeleteMedia,
  hardDeleteMedia,
  bulkSoftDelete,
  attachEntity,
};
