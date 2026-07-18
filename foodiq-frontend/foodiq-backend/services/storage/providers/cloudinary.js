/**
 * Cloudinary provider — CDN delivery + automatic transforms.
 */
const { v2: cloudinary } = require('cloudinary');
const { Readable } = require('stream');

const isConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

const configure = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
};

const uploadBuffer = (buffer, { folder, publicId, resourceType = 'image', mime }) =>
  new Promise((resolve, reject) => {
    configure();
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: resourceType === 'document' ? 'raw' : 'image',
        overwrite: true,
        unique_filename: true,
        transformation:
          resourceType === 'image'
            ? [{ quality: 'auto:good', fetch_format: 'auto' }]
            : undefined,
        format: mime === 'application/pdf' ? 'pdf' : undefined,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve({
          url: result.secure_url || result.url,
          public_id: result.public_id,
          bytes: result.bytes,
          width: result.width || null,
          height: result.height || null,
          format: result.format,
          provider: 'cloudinary',
          raw: result,
        });
      }
    );
    Readable.from(buffer).pipe(stream);
  });

const destroy = async (publicId, resourceType = 'image') => {
  if (!publicId) return { result: 'ok' };
  configure();
  return cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType === 'document' || resourceType === 'raw' ? 'raw' : 'image',
  });
};

/** Client-side signed upload params */
const getSignedUploadParams = ({ folder, purpose }) => {
  configure();
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = {
    timestamp,
    folder,
  };
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET
  );
  return {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    timestamp,
    folder,
    signature,
    purpose,
  };
};

/** Responsive / thumbnail URLs via Cloudinary transforms */
const variantUrl = (publicId, variant = 'card') => {
  if (!publicId || !isConfigured()) return null;
  configure();
  const transforms = {
    thumb: { width: 200, height: 200, crop: 'fill', quality: 'auto', fetch_format: 'auto' },
    card: { width: 600, crop: 'fill', quality: 'auto', fetch_format: 'auto' },
    banner: { width: 1200, crop: 'fill', quality: 'auto', fetch_format: 'auto' },
    original: { quality: 'auto', fetch_format: 'auto' },
  };
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [transforms[variant] || transforms.card],
  });
};

module.exports = {
  name: 'cloudinary',
  isConfigured,
  uploadBuffer,
  destroy,
  getSignedUploadParams,
  variantUrl,
};
