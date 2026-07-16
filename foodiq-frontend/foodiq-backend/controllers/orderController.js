const { getOrders, getOrderById, updateOrderStatus } = require('../models/orderModel');
const { checkout } = require('./checkoutController');
const { pool } = require('../config/db');

const placeOrder = checkout; // Alias existing checkout logic

const getAllOrders = async (req, res) => {
  try {
    const orders = await getOrders(req.user.id, req.user.role);
    res.json({ success: true, message: 'Orders retrieved', data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getSingleOrder = async (req, res) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found', error: {} });
    
    if (req.user.role === 'customer' && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized', error: {} });
    }
    
    res.json({ success: true, message: 'Order retrieved', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found', error: {} });
    
    if (order.status !== 'Pending' && order.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage', error: {} });
    }
    
    const updated = await updateOrderStatus(req.params.id, 'Cancelled');
    res.json({ success: true, message: 'Order cancelled', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Accepted', 'Preparing', 'Ready for Pickup', 'Picked Up', 'On The Way', 'Delivered', 'Cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status', error: {} });
    }
    
    const updated = await updateOrderStatus(req.params.id, status);
    
    // Auto-calculate rewards if delivered
    if (status === 'Delivered') {
      const points = Math.floor(updated.total_amount / 100);
      if (points > 0) {
        await pool.query('INSERT INTO reward_history (user_id, order_id, points, transaction_type) VALUES ($1, $2, $3, $4)', [updated.user_id, updated.id, points, 'earned']);
        await pool.query(`
          INSERT INTO rewards (user_id, points_balance, total_earned) 
          VALUES ($1, $2, $2)
          ON CONFLICT (user_id) DO UPDATE SET 
            points_balance = rewards.points_balance + $2,
            total_earned = rewards.total_earned + $2
        `, [updated.user_id, points]);
      }
    }
    
    res.json({ success: true, message: 'Order status updated', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { placeOrder, getAllOrders, getSingleOrder, cancelOrder, updateStatus };
