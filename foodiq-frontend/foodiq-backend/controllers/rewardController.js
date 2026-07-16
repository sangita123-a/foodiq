const { pool } = require('../config/db');

const getRewards = async (req, res) => {
  try {
    const { rows: rewardRows } = await pool.query('SELECT * FROM rewards WHERE user_id = $1', [req.user.id]);
    
    let reward = rewardRows[0];
    if (!reward) {
      const newReward = await pool.query('INSERT INTO rewards (user_id) VALUES ($1) RETURNING *', [req.user.id]);
      reward = newReward.rows[0];
    }
    
    const { rows: history } = await pool.query('SELECT * FROM reward_history WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    
    res.json({ success: true, message: 'Rewards retrieved', data: { ...reward, history } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const claimReward = async (req, res) => {
  const client = await pool.connect();
  try {
    const { points_to_claim } = req.body;
    
    if (!points_to_claim || points_to_claim < 100) {
      return res.status(400).json({ success: false, message: 'Minimum 100 points required to claim', error: {} });
    }
    
    await client.query('BEGIN');
    
    const { rows } = await client.query('SELECT points_balance FROM rewards WHERE user_id = $1 FOR UPDATE', [req.user.id]);
    const balance = rows[0]?.points_balance || 0;
    
    if (balance < points_to_claim) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Insufficient points', error: {} });
    }
    
    await client.query(`
      UPDATE rewards 
      SET points_balance = points_balance - $1, total_redeemed = total_redeemed + $1
      WHERE user_id = $2
    `, [points_to_claim, req.user.id]);
    
    await client.query(`
      INSERT INTO reward_history (user_id, points, transaction_type)
      VALUES ($1, $2, 'redeemed')
    `, [req.user.id, points_to_claim]);
    
    const couponCode = `REWARD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const discountAmount = points_to_claim / 10;
    
    const newCoupon = await client.query(`
      INSERT INTO coupons (code, discount_amount, discount_type, usage_limit)
      VALUES ($1, $2, 'fixed', 1)
      RETURNING *
    `, [couponCode, discountAmount]);
    
    await client.query('COMMIT');
    
    res.json({ 
      success: true, 
      message: 'Points claimed successfully', 
      data: { coupon: newCoupon.rows[0] } 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  } finally {
    client.release();
  }
};

module.exports = { getRewards, claimReward };
