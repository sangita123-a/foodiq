const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const c = require('../controllers/ticketController');

router.use(protect);

router.get('/', c.listMyTickets);
router.post('/', c.createTicket);
router.get('/:id', c.getTicketDetail);
router.post('/:id/messages', c.replyToTicket);
router.put('/:id/close', c.closeMyTicket);

module.exports = router;
