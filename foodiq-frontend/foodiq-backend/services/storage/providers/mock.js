/**
 * Local/mock storage for development without cloud credentials.
 * Files saved under uploads/ and served at /media-files/*
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..', '..', '..', 'uploads');

const ensureDir = (dir) => {
  fs.mkdirSync(dir, { recursive: true });
};

const isConfigured = () => true;

const apiBase = () =>
  (process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}`).replace(
    /\/$/,
    ''
  );

const uploadBuffer = async (buffer, { folder, publicId, mime, ext }) => {
  const relFolder = folder.replace(/^foodiq\//, '');
  const dir = path.join(ROOT, relFolder);
  ensureDir(dir);
  const filename = `${publicId}.${ext}`;
  const full = path.join(dir, filename);
  fs.writeFileSync(full, buffer);
  const publicPath = `media-files/${relFolder}/${filename}`.replace(/\\/g, '/');
  const url = `${apiBase()}/${publicPath}`;
  return {
    url,
    public_id: publicPath,
    bytes: buffer.length,
    width: null,
    height: null,
    format: ext,
    provider: 'mock',
    mime,
  };
};

const destroy = async (publicId) => {
  if (!publicId) return { result: 'ok' };
  const full = path.join(ROOT, '..', publicId.replace(/^media-files\//, 'uploads/'));
  // public_id is like media-files/food/...
  const alt = path.join(__dirname, '..', '..', '..', publicId.replace(/^media-files\//, 'uploads/'));
  const target = fs.existsSync(alt) ? alt : full;
  try {
    if (fs.existsSync(target)) fs.unlinkSync(target);
  } catch {
    /* ignore */
  }
  return { result: 'ok' };
};

const getSignedUploadParams = ({ folder, purpose }) => ({
  provider: 'mock',
  message: 'Use POST /api/media/upload with multipart in mock mode',
  folder,
  purpose,
});

const variantUrl = (publicId) => {
  if (!publicId) return null;
  if (publicId.startsWith('http')) return publicId;
  return `${apiBase()}/${publicId}`;
};

/** Dev helper — create a unique id */
const newPublicId = () => crypto.randomUUID();

module.exports = {
  name: 'mock',
  isConfigured,
  uploadBuffer,
  destroy,
  getSignedUploadParams,
  variantUrl,
  newPublicId,
  ROOT,
};
