const express = require('express');
const router = express.Router();
const { protect, optionalProtect, authorize } = require('../middleware/authMiddleware');
const c = require('../controllers/helpCenterController');
const helpCenter = require('../models/helpCenterModel');

router.get('/overview', c.getOverview);
router.get('/agents/status', c.getAgentStatus);
router.post('/chat', optionalProtect, c.postChat);
router.get('/chat/:id', optionalProtect, c.getChatSession);

router.get('/tickets', protect, c.listTickets);
router.post('/tickets', protect, c.createTicket);
router.post('/tickets/:id/rate', protect, c.rateTicket);

router.post('/live-chat', protect, c.startLiveChat);
router.get('/live-chat/:id', protect, c.getLiveChat);
router.post('/live-chat/:id/messages', protect, c.postLiveMessage);
router.post('/live-chat/:id/close', protect, c.closeLiveChat);

module.exports = router;
