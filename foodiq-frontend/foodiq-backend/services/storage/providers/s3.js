/**
 * AWS S3 (or S3-compatible) provider.
 * Compatible with AWS, Cloudflare R2, MinIO via endpoint override.
 */
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { PutObjectCommand: PutCmd } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

const isConfigured = () =>
  Boolean(
    process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY
  );

const getClient = () => {
  const region = process.env.S3_REGION || 'ap-south-1';
  const endpoint = process.env.S3_ENDPOINT || undefined;
  return new S3Client({
    region,
    endpoint,
    forcePathStyle: String(process.env.S3_FORCE_PATH_STYLE || 'false') === 'true',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });
};

const publicBase = () => {
  if (process.env.S3_CDN_URL) return process.env.S3_CDN_URL.replace(/\/$/, '');
  if (process.env.S3_PUBLIC_URL) return process.env.S3_PUBLIC_URL.replace(/\/$/, '');
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION || 'ap-south-1';
  if (process.env.S3_ENDPOINT) {
    return `${process.env.S3_ENDPOINT.replace(/\/$/, '')}/${bucket}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com`;
};

const uploadBuffer = async (buffer, { folder, publicId, mime, ext }) => {
  const key = `${folder}/${publicId}.${ext}`.replace(/\/+/g, '/');
  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mime,
      CacheControl: 'public, max-age=31536000, immutable',
      ACL: process.env.S3_ACL || undefined,
    })
  );
  const url = `${publicBase()}/${key}`;
  return {
    url,
    public_id: key,
    bytes: buffer.length,
    width: null,
    height: null,
    format: ext,
    provider: 's3',
  };
};

const destroy = async (publicId) => {
  if (!publicId) return { result: 'ok' };
  const client = getClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: publicId,
    })
  );
  return { result: 'ok' };
};

const getSignedUploadParams = async ({ folder, mime, ext }) => {
  const publicId = crypto.randomUUID();
  const key = `${folder}/${publicId}.${ext || 'bin'}`.replace(/\/+/g, '/');
  const client = getClient();
  const command = new PutCmd({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: mime || 'application/octet-stream',
  });
  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: Number(process.env.S3_SIGNED_URL_TTL || 300),
  });
  return {
    provider: 's3',
    upload_url: uploadUrl,
    public_id: key,
    url: `${publicBase()}/${key}`,
    expires_in: Number(process.env.S3_SIGNED_URL_TTL || 300),
  };
};

const variantUrl = (publicId) => {
  if (!publicId) return null;
  // Without an image CDN transform layer, return original.
  // Hook CloudFront / Imgix here in production if needed.
  return `${publicBase()}/${publicId}`;
};

module.exports = {
  name: 's3',
  isConfigured,
  uploadBuffer,
  destroy,
  getSignedUploadParams,
  variantUrl,
};
