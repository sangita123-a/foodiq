const { pool } = require('../config/db');
const {
  prepareCheckout,
  commitCheckoutOrder,
  notifyRestaurantOwner,
  formatCheckoutResponse,
  isOnlineMethod,
} = require('../services/checkoutService');

const checkout = async (req, res) => {
  const client = await pool.connect();
  try {
    const prepared = await prepareCheckout(req.user.id, req.body);

    // Online methods must go through Razorpay create → verify → order.
    if (isOnlineMethod(prepared.payment_method)) {
      return res.status(400).json({
        success: false,
        message:
          'Online payments require Razorpay. Call /api/payments/razorpay/order then verify.',
        error: { code: 'RAZORPAY_REQUIRED' },
      });
    }

    await client.query('BEGIN');
    const { order } = await commitCheckoutOrder(
      req.user.id,
      prepared,
      { status: 'pending' },
      client
    );
    await client.query('COMMIT');

    await notifyRestaurantOwner(prepared.restaurantId, order.id, prepared.totalAmount);

    try {
      const { deductInventoryForOrder } = require('../services/inventoryService');
      await deductInventoryForOrder(order.id, prepared.restaurantId);
    } catch {
      /* non-blocking */
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully (Cash on Delivery)',
      data: formatCheckoutResponse(order, prepared.payment_method, prepared),
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[checkout]', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Server Error during checkout',
      error: error.code ? { code: error.code } : error.message,
    });
  } finally {
    client.release();
  }
};

module.exports = { checkout };
