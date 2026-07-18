/**
 * Multer memory storage + purpose-aware limits.
 */
const multer = require('multer');
const { PURPOSE_RULES } = require('../services/storage/validate');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // hard ceiling; purpose rules tighten further
    files: 10,
  },
  fileFilter: (_req, file, cb) => {
    const mime = String(file.mimetype || '').toLowerCase();
    const ok =
      mime === 'image/jpeg' ||
      mime === 'image/jpg' ||
      mime === 'image/png' ||
      mime === 'image/webp' ||
      mime === 'application/pdf';
    if (!ok) {
      return cb(new Error('Only JPG, PNG, WEBP, and PDF files are allowed'));
    }
    cb(null, true);
  },
});

/** Single file field "file" */
const singleUpload = upload.single('file');

/** Multiple files field "files" */
const multiUpload = upload.array('files', 10);

const runMulter = (middleware) => (req, res, next) => {
  middleware(req, res, (err) => {
    if (err) {
      const status = err.code === 'LIMIT_FILE_SIZE' ? 400 : 400;
      return res.status(status).json({
        success: false,
        message: err.message || 'Upload failed',
        error: { code: err.code || 'UPLOAD_ERROR' },
      });
    }
    next();
  });
};

module.exports = {
  singleUpload: runMulter(singleUpload),
  multiUpload: runMulter(multiUpload),
  PURPOSE_RULES,
};
