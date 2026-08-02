const express = require('express');
const router = express.Router();
const c = require('../controllers/deliverySupportController');
const { protectDelivery } = require('../middleware/deliveryAuth');
const { supportLimiter } = require('../middleware/rateLimiters');

router.use(protectDelivery);

// POST /api/delivery/support/ticket & POST /api/delivery/support
router.post('/ticket', supportLimiter, c.createTicket);
router.post('/', supportLimiter, c.createTicket);

// GET /api/delivery/support/tickets & GET /api/delivery/support
router.get('/tickets', c.getMyTickets);
router.get('/', c.getMyTickets);

// GET /api/delivery/support/ticket/:id & GET /api/delivery/support/:id
router.get('/ticket/:id', c.getTicketById);
router.get('/:id', c.getTicketById);

// POST /api/delivery/support/message
router.post('/message', supportLimiter, c.sendPartnerMessage);

// PATCH /api/delivery/support/read
router.patch('/read', c.markReadPartner);

module.exports = router;
