const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { singleUpload, multiUpload } = require('../middleware/uploadMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiters');
const c = require('../controllers/mediaController');

router.use(protect);

router.get('/info', c.info);
router.get('/signed', c.signedParams);
router.post('/signed', c.signedParams);

router.post('/upload', uploadLimiter, singleUpload, c.uploadOne);
router.post('/upload/bulk', uploadLimiter, multiUpload, c.uploadMany);

router.get('/', c.list);
router.get('/:id', c.getOne);
router.delete('/:id', c.removeOne);
router.post('/bulk-delete', c.bulkDelete);

router.put('/:id/approve', authorize('admin'), c.approve);
router.put('/:id/reject', authorize('admin'), c.reject);

module.exports = router;
