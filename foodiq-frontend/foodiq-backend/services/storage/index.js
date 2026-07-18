/**
 * Storage facade — Cloudinary | S3 | mock
 * Select via STORAGE_PROVIDER env (auto-detects credentials).
 */
const crypto = require('crypto');
const cloudinary = require('./providers/cloudinary');
const s3 = require('./providers/s3');
const mock = require('./providers/mock');
const { validateUpload } = require('./validate');

const resolveProviderName = () => {
  const forced = String(process.env.STORAGE_PROVIDER || 'auto').toLowerCase();
  if (forced === 'cloudinary') return 'cloudinary';
  if (forced === 's3' || forced === 'aws') return 's3';
  if (forced === 'mock' || forced === 'local') return 'mock';
  // auto
  if (cloudinary.isConfigured()) return 'cloudinary';
  if (s3.isConfigured()) return 's3';
  return 'mock';
};

const getProvider = () => {
  const name = resolveProviderName();
  if (name === 'cloudinary') {
    if (!cloudinary.isConfigured()) {
      console.warn('[storage] Cloudinary selected but not configured — falling back to mock');
      return mock;
    }
    return cloudinary;
  }
  if (name === 's3') {
    if (!s3.isConfigured()) {
      console.warn('[storage] S3 selected but not configured — falling back to mock');
      return mock;
    }
    return s3;
  }
  return mock;
};

const buildVariants = (provider, publicId, url, kind) => {
  if (kind !== 'image' || !publicId) {
    return { original: url, thumb: url, card: url, banner: url };
  }
  if (provider.name === 'cloudinary' && provider.variantUrl) {
    return {
      original: url,
      thumb: provider.variantUrl(publicId, 'thumb') || url,
      card: provider.variantUrl(publicId, 'card') || url,
      banner: provider.variantUrl(publicId, 'banner') || url,
    };
  }
  return { original: url, thumb: url, card: url, banner: url };
};

/**
 * Upload a multer memory file.
 * @returns media-shaped object (not yet persisted)
 */
const uploadFile = async (file, purpose = 'other', meta = {}) => {
  const validated = validateUpload(file, purpose);
  const provider = getProvider();
  const publicId = crypto.randomUUID();

  const result = await provider.uploadBuffer(file.buffer, {
    folder: validated.folder,
    publicId,
    resourceType: validated.kind,
    mime: validated.mime,
    ext: validated.ext,
  });

  const variants = buildVariants(provider, result.public_id, result.url, validated.kind);

  return {
    url: result.url,
    public_id: result.public_id,
    provider: result.provider || provider.name,
    mime_type: validated.mime,
    file_type: validated.kind,
    file_size: result.bytes || file.size,
    width: result.width,
    height: result.height,
    format: result.format || validated.ext,
    purpose,
    folder: validated.folder,
    variants,
    meta,
  };
};

const deleteByPublicId = async (publicId, fileType = 'image', providerName = null) => {
  if (!publicId) return;
  let provider = getProvider();
  if (providerName === 'cloudinary') provider = cloudinary;
  else if (providerName === 's3') provider = s3;
  else if (providerName === 'mock') provider = mock;
  try {
    await provider.destroy(publicId, fileType);
  } catch (err) {
    console.warn('[storage] destroy failed', err.message);
  }
};

const getSignedParams = async (opts) => {
  const provider = getProvider();
  return provider.getSignedUploadParams(opts);
};

const providerInfo = () => {
  const name = resolveProviderName();
  return {
    provider: name,
    cloudinary_ready: cloudinary.isConfigured(),
    s3_ready: s3.isConfigured(),
  };
};

module.exports = {
  uploadFile,
  deleteByPublicId,
  getSignedParams,
  getProvider,
  resolveProviderName,
  providerInfo,
  buildVariants,
};
