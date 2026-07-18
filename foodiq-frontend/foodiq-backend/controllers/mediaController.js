/**
 * Media upload & library APIs.
 */
const media = require('../models/mediaModel');
const storage = require('../services/storage');
const { pool } = require('../config/db');

const ok = (res, message, data = {}) =>
  res.json({ success: true, message, data });
const fail = (res, status, message, error = {}) =>
  res.status(status).json({
    success: false,
    message,
    error: typeof error === 'string' ? { detail: error } : error,
  });

const autoApprove = (purpose, role) => {
  // Admin uploads auto-approved; profile photos auto-approved; docs pending review
  if (role === 'admin') return 'approved';
  if (['user_profile', 'delivery_profile', 'food', 'restaurant_logo', 'restaurant_banner', 'restaurant_cover', 'category'].includes(purpose)) {
    return 'approved';
  }
  if (['license', 'vehicle_rc', 'insurance', 'document'].includes(purpose)) {
    return 'pending';
  }
  return 'approved';
};

/** Apply uploaded URL onto related entity columns when requested */
const linkToEntity = async ({ user, purpose, url, entity_type, entity_id }) => {
  try {
    if (purpose === 'user_profile') {
      await pool.query(
        `UPDATE users SET profile_image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [url, user.id]
      );
      return { entity_type: 'user', entity_id: user.id };
    }

    if (purpose === 'restaurant_logo' || purpose === 'restaurant_banner' || purpose === 'restaurant_cover') {
      const rest = await pool.query(
        `SELECT id FROM restaurants WHERE owner_id = $1 ORDER BY created_at ASC LIMIT 1`,
        [user.id]
      );
      const rid = entity_id || rest.rows[0]?.id;
      if (!rid) return null;
      if (purpose === 'restaurant_logo') {
        await pool.query(
          `UPDATE restaurants SET logo_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [url, rid]
        );
      } else if (purpose === 'restaurant_banner' || purpose === 'restaurant_cover') {
        await pool.query(
          `UPDATE restaurants SET banner_url = $1, image_url = COALESCE(image_url, $1), updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [url, rid]
        );
      }
      return { entity_type: 'restaurant', entity_id: rid };
    }

    if (purpose === 'food' && entity_id) {
      await pool.query(
        `UPDATE menu_items SET image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [url, entity_id]
      );
      return { entity_type: 'menu_item', entity_id };
    }

    if (purpose === 'category' && entity_id) {
      await pool.query(
        `UPDATE restaurant_categories SET image_url = $1 WHERE id = $2`,
        [url, entity_id]
      );
      return { entity_type: 'category', entity_id };
    }

    if (
      ['delivery_profile', 'vehicle', 'license', 'vehicle_rc', 'insurance'].includes(purpose)
    ) {
      const col =
        purpose === 'delivery_profile'
          ? 'profile_photo_url'
          : purpose === 'vehicle'
            ? 'vehicle_photo_url'
            : purpose === 'license'
              ? 'license_photo_url'
              : purpose === 'vehicle_rc'
                ? 'vehicle_rc_url'
                : 'insurance_doc_url';
      await pool.query(
        `UPDATE delivery_partners SET ${col} = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
        [url, user.id]
      );
      const dp = await pool.query(
        `SELECT id FROM delivery_partners WHERE user_id = $1`,
        [user.id]
      );
      return { entity_type: 'delivery_partner', entity_id: dp.rows[0]?.id || null };
    }

    if (entity_type && entity_id) {
      return { entity_type, entity_id };
    }
  } catch (err) {
    console.warn('[media] linkToEntity skipped', err.message);
  }
  return null;
};

const uploadOne = async (req, res) => {
  try {
    if (!req.file) return fail(res, 400, 'file is required (multipart field: file)');
    const purpose = String(req.body.purpose || req.query.purpose || 'other');
    const entity_type = req.body.entity_type || null;
    const entity_id = req.body.entity_id || null;
    const link = String(req.body.link || 'true') !== 'false';

    const uploaded = await storage.uploadFile(req.file, purpose, {
      original_name: req.file.originalname,
    });

    const status = autoApprove(purpose, req.user.role);
    let linked = null;
    if (link) {
      linked = await linkToEntity({
        user: req.user,
        purpose,
        url: uploaded.url,
        entity_type,
        entity_id,
      });
    }

    const record = await media.insertMedia({
      user_id: req.user.id,
      purpose: uploaded.purpose,
      folder: uploaded.folder,
      url: uploaded.url,
      public_id: uploaded.public_id,
      provider: uploaded.provider,
      mime_type: uploaded.mime_type,
      file_type: uploaded.file_type,
      file_size: uploaded.file_size,
      width: uploaded.width,
      height: uploaded.height,
      format: uploaded.format,
      status,
      entity_type: linked?.entity_type || entity_type,
      entity_id: linked?.entity_id || entity_id,
      variants: uploaded.variants,
      meta: uploaded.meta,
    });

    try {
      require('../services/metricsService').bump('uploads');
      require('../services/auditService')
        .writeAudit({
          userId: req.user.id,
          role: req.user.role,
          action: 'upload',
          category: 'media',
          resourceType: purpose,
          resourceId: record.id,
          message: uploaded.public_id,
          req,
        })
        .catch(() => {});
    } catch {
      /* ignore */
    }

    console.log('[media/upload]', {
      id: record.id,
      purpose,
      provider: uploaded.provider,
      size: uploaded.file_size,
      user: req.user.id,
    });

    return ok(res, 'File uploaded', {
      ...record,
      variants: uploaded.variants,
    });
  } catch (error) {
    console.error('[media/upload]', error.message);
    return fail(res, error.status || 500, error.message || 'Upload failed');
  }
};

const uploadMany = async (req, res) => {
  try {
    const files = req.files || [];
    if (!files.length) return fail(res, 400, 'files are required');
    const purpose = String(req.body.purpose || 'other');
    const results = [];
    for (const file of files) {
      req.file = file;
      req.body.purpose = purpose;
      // Reuse single path logic inline
      const uploaded = await storage.uploadFile(file, purpose, {
        original_name: file.originalname,
      });
      const status = autoApprove(purpose, req.user.role);
      const record = await media.insertMedia({
        user_id: req.user.id,
        purpose: uploaded.purpose,
        folder: uploaded.folder,
        url: uploaded.url,
        public_id: uploaded.public_id,
        provider: uploaded.provider,
        mime_type: uploaded.mime_type,
        file_type: uploaded.file_type,
        file_size: uploaded.file_size,
        width: uploaded.width,
        height: uploaded.height,
        format: uploaded.format,
        status,
        variants: uploaded.variants,
        meta: uploaded.meta,
      });
      results.push({ ...record, variants: uploaded.variants });
    }
    return ok(res, `${results.length} files uploaded`, results);
  } catch (error) {
    return fail(res, error.status || 500, error.message || 'Bulk upload failed');
  }
};

const list = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const rows = await media.listMedia({
      userId: isAdmin && req.query.scope === 'all' ? null : req.user.id,
      purpose: req.query.purpose || '',
      status: req.query.status || '',
      q: req.query.q || '',
      fileType: req.query.file_type || '',
      provider: req.query.provider || '',
      limit: req.query.limit,
      offset: req.query.offset,
      admin: isAdmin && req.query.scope === 'all',
    });
    return ok(res, 'Media library', rows);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const getOne = async (req, res) => {
  try {
    const row = await media.getMediaById(req.params.id);
    if (!row) return fail(res, 404, 'Media not found');
    if (req.user.role !== 'admin' && row.user_id !== req.user.id) {
      return fail(res, 403, 'Not allowed');
    }
    return ok(res, 'Media retrieved', row);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const removeOne = async (req, res) => {
  try {
    const row = await media.getMediaById(req.params.id);
    if (!row) return fail(res, 404, 'Media not found');
    if (req.user.role !== 'admin' && row.user_id !== req.user.id) {
      return fail(res, 403, 'Not allowed');
    }
    await storage.deleteByPublicId(row.public_id, row.file_type, row.provider);
    const deleted = await media.hardDeleteMedia(row.id);
    return ok(res, 'Media deleted', deleted);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const bulkDelete = async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    if (!ids.length) return fail(res, 400, 'ids array is required');
    const isAdmin = req.user.role === 'admin';
    const removed = [];
    for (const id of ids) {
      const row = await media.getMediaById(id);
      if (!row) continue;
      if (!isAdmin && row.user_id !== req.user.id) continue;
      await storage.deleteByPublicId(row.public_id, row.file_type, row.provider);
      removed.push(await media.hardDeleteMedia(id));
    }
    return ok(res, `${removed.length} files deleted`, removed);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const approve = async (req, res) => {
  try {
    const row = await media.updateMediaStatus(req.params.id, 'approved', req.user.id);
    if (!row) return fail(res, 404, 'Media not found');
    return ok(res, 'Media approved', row);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const reject = async (req, res) => {
  try {
    const row = await media.updateMediaStatus(req.params.id, 'rejected', req.user.id);
    if (!row) return fail(res, 404, 'Media not found');
    return ok(res, 'Media rejected', row);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const signedParams = async (req, res) => {
  try {
    const purpose = req.body.purpose || req.query.purpose || 'other';
    const { PURPOSE_RULES } = require('../services/storage/validate');
    const rules = PURPOSE_RULES[purpose] || PURPOSE_RULES.other;
    const params = await storage.getSignedParams({
      folder: rules.folder,
      purpose,
      mime: req.body.mime,
      ext: req.body.ext,
    });
    return ok(res, 'Signed upload params', {
      ...params,
      ...storage.providerInfo(),
    });
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const info = async (_req, res) => {
  return ok(res, 'Storage info', storage.providerInfo());
};

module.exports = {
  uploadOne,
  uploadMany,
  list,
  getOne,
  removeOne,
  bulkDelete,
  approve,
  reject,
  signedParams,
  info,
};
