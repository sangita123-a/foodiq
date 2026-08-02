const express = require('express');
const router = express.Router();
const c = require('../controllers/deliveryBankAccountController');
const v = require('../validators/deliveryBankAccountValidator');
const { protectDelivery } = require('../middleware/deliveryAuth');

// Mounted at /api/delivery/bank-account (see routes/deliveryRoutes.js).
// JWT-protected: a partner can only ever see/act on their own bank account
// (partner id is derived from the verified token, never from the request body).
router.use(protectDelivery);

router.get('/', c.getBankAccount);
router.post('/', v.validateAddBankAccount, c.addBankAccount);
router.patch('/:id', v.validateUpdateBankAccount, c.updateBankAccount);
router.delete('/:id', c.deleteBankAccount);

module.exports = router;
