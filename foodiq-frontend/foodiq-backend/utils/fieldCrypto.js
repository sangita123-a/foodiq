/**
 * Lightweight field encryption for optional PII at rest (AES-256-GCM).
 * Uses DATA_ENCRYPTION_KEY (32-byte hex or base64). When unset, stores plaintext
 * with a clear prefix so decrypt remains backward compatible.
 */
const crypto = require('crypto');

const PREFIX = 'enc:v1:';

const getKey = () => {
  const raw = process.env.DATA_ENCRYPTION_KEY;
  if (!raw) return null;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex');
  const buf = Buffer.from(raw, 'base64');
  if (buf.length === 32) return buf;
  // Derive 32 bytes from passphrase
  return crypto.createHash('sha256').update(raw).digest();
};

const encryptField = (plaintext) => {
  if (plaintext == null || plaintext === '') return plaintext;
  const key = getKey();
  if (!key) return String(plaintext);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([
    cipher.update(String(plaintext), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return (
    PREFIX +
    Buffer.concat([iv, tag, enc]).toString('base64url')
  );
};

const decryptField = (value) => {
  if (value == null || value === '') return value;
  const s = String(value);
  if (!s.startsWith(PREFIX)) return s;
  const key = getKey();
  if (!key) return s; // cannot decrypt without key
  try {
    const buf = Buffer.from(s.slice(PREFIX.length), 'base64url');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const data = buf.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString(
      'utf8'
    );
  } catch {
    return s;
  }
};

module.exports = { encryptField, decryptField, getKey };
