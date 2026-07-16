const express = require('express');
const router = express.Router();
const {
  registerSession,
  getSessions,
  removeSession,
  logoutAll,
  getLoginHistory,
} = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/register', registerSession);
router.get('/', getSessions);
router.delete('/others', logoutAll);
router.delete('/:id', removeSession);
router.get('/history/logins', getLoginHistory);

module.exports = router;
