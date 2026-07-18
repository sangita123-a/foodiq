/**
 * Upload validation: MIME, extension, size, purpose rules.
 * Blocks executables and mismatched content types.
 */
const PURPOSE_RULES = {
  restaurant_logo: { kinds: ['image'], maxMb: 5, folder: 'foodiq/restaurants/logos' },
  restaurant_banner: { kinds: ['image'], maxMb: 5, folder: 'foodiq/restaurants/banners' },
  restaurant_cover: { kinds: ['image'], maxMb: 5, folder: 'foodiq/restaurants/covers' },
  food: { kinds: ['image'], maxMb: 5, folder: 'foodiq/food' },
  category: { kinds: ['image'], maxMb: 3, folder: 'foodiq/categories' },
  user_profile: { kinds: ['image'], maxMb: 3, folder: 'foodiq/users/profiles' },
  delivery_profile: { kinds: ['image'], maxMb: 3, folder: 'foodiq/delivery/profiles' },
  vehicle: { kinds: ['image'], maxMb: 5, folder: 'foodiq/delivery/vehicles' },
  license: { kinds: ['image', 'document'], maxMb: 8, folder: 'foodiq/delivery/licenses' },
  vehicle_rc: { kinds: ['image', 'document'], maxMb: 8, folder: 'foodiq/delivery/rc' },
  insurance: { kinds: ['image', 'document'], maxMb: 8, folder: 'foodiq/delivery/insurance' },
  document: { kinds: ['document'], maxMb: 10, folder: 'foodiq/documents' },
  other: { kinds: ['image', 'document'], maxMb: 8, folder: 'foodiq/other' },
};

const IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const DOCUMENT_MIMES = new Set(['application/pdf']);

const BLOCKED_MIMES = new Set([
  'application/x-msdownload',
  'application/x-executable',
  'application/x-dosexec',
  'application/javascript',
  'text/html',
  'application/x-sh',
  'application/x-bat',
]);

const EXT_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

const SAFE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf']);

const normalizeMime = (mime) => String(mime || '').toLowerCase().trim();

const extFromName = (filename = '') => {
  const parts = String(filename).split('.');
  if (parts.length < 2) return '';
  return parts.pop().toLowerCase().replace(/[^a-z0-9]/g, '');
};

const kindForMime = (mime) => {
  if (IMAGE_MIMES.has(mime)) return 'image';
  if (DOCUMENT_MIMES.has(mime)) return 'document';
  return null;
};

/**
 * @param {object} file multer file { mimetype, size, originalname, buffer? }
 * @param {string} purpose
 */
const validateUpload = (file, purpose = 'other') => {
  if (!file) {
    const err = new Error('No file provided');
    err.status = 400;
    throw err;
  }

  const rules = PURPOSE_RULES[purpose] || PURPOSE_RULES.other;
  const mime = normalizeMime(file.mimetype);
  const ext = extFromName(file.originalname);

  if (BLOCKED_MIMES.has(mime) || ['exe', 'bat', 'cmd', 'sh', 'js', 'html', 'php'].includes(ext)) {
    const err = new Error('Executable or unsafe file types are not allowed');
    err.status = 400;
    throw err;
  }

  const kind = kindForMime(mime);
  if (!kind) {
    const err = new Error('Only JPG, PNG, WEBP images and PDF documents are allowed');
    err.status = 400;
    throw err;
  }

  if (!rules.kinds.includes(kind)) {
    const err = new Error(
      `This upload slot accepts ${rules.kinds.join(' or ')} files only`
    );
    err.status = 400;
    throw err;
  }

  if (ext && !SAFE_EXTS.has(ext)) {
    const err = new Error('Invalid file extension');
    err.status = 400;
    throw err;
  }

  // Extension should match MIME when both present
  if (ext && EXT_BY_MIME[mime]) {
    const expected = EXT_BY_MIME[mime];
    if (ext !== expected && !(expected === 'jpg' && ext === 'jpeg')) {
      const err = new Error('File extension does not match MIME type');
      err.status = 400;
      throw err;
    }
  }

  const maxBytes = (rules.maxMb || 5) * 1024 * 1024;
  if (Number(file.size) > maxBytes) {
    const err = new Error(`File too large. Max ${rules.maxMb}MB for ${purpose}`);
    err.status = 400;
    throw err;
  }

  // Magic-byte sniff when buffer is available (blocks MIME spoofing)
  if (file.buffer && Buffer.isBuffer(file.buffer) && file.buffer.length >= 4) {
    const head = file.buffer.subarray(0, 12);
    const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
    const isPng =
      head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
    const isWebp =
      head.toString('ascii', 0, 4) === 'RIFF' &&
      head.toString('ascii', 8, 12) === 'WEBP';
    const isPdf = head.toString('ascii', 0, 5) === '%PDF-';
    const declared = String(mime || '').toLowerCase();
    let magicOk = false;
    if (declared.includes('jpeg') || declared.includes('jpg')) magicOk = isJpeg;
    else if (declared.includes('png')) magicOk = isPng;
    else if (declared.includes('webp')) magicOk = isWebp;
    else if (declared.includes('pdf')) magicOk = isPdf;
    else magicOk = isJpeg || isPng || isWebp || isPdf;
    if (!magicOk) {
      const err = new Error('File content does not match declared type');
      err.status = 400;
      throw err;
    }
  }

  return {
    purpose,
    kind,
    mime,
    ext: EXT_BY_MIME[mime] || ext || 'bin',
    folder: rules.folder,
    maxBytes,
  };
};

module.exports = {
  PURPOSE_RULES,
  IMAGE_MIMES,
  DOCUMENT_MIMES,
  validateUpload,
  normalizeMime,
  extFromName,
  kindForMime,
};
