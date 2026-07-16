const { pool } = require('../config/db');

const getDashboard = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { rows: userCount } = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'customer'");
    const { rows: resCount } = await pool.query('SELECT COUNT(*) FROM restaurants');
    const { rows: orderCount } = await pool.query('SELECT COUNT(*) FROM orders');
    const { rows: activeOrderCount } = await pool.query("SELECT COUNT(*) FROM orders WHERE status NOT IN ('Delivered', 'Cancelled')");
    const { rows: deliveredOrderCount } = await pool.query("SELECT COUNT(*) FROM orders WHERE status = 'Delivered'");
    const { rows: cancelledOrderCount } = await pool.query("SELECT COUNT(*) FROM orders WHERE status = 'Cancelled'");
    const { rows: totalRevenue } = await pool.query("SELECT SUM(total_amount) FROM orders WHERE status = 'Delivered'");
    const { rows: monthlyRevenue } = await pool.query(`
      SELECT SUM(total_amount) FROM orders 
      WHERE status = 'Delivered' 
      AND created_at >= date_trunc('month', CURRENT_DATE)
    `);
    const { rows: partnerCount } = await pool.query("SELECT COUNT(*) FROM delivery_partners WHERE is_available = true");

    res.json({
      success: true,
      message: 'Dashboard stats retrieved',
      data: {
        total_users: parseInt(userCount[0].count),
        total_restaurants: parseInt(resCount[0].count),
        total_orders: parseInt(orderCount[0].count),
        active_orders: parseInt(activeOrderCount[0].count),
        delivered_orders: parseInt(deliveredOrderCount[0].count),
        cancelled_orders: parseInt(cancelledOrderCount[0].count),
        total_revenue: parseFloat(totalRevenue[0].sum || 0),
        monthly_revenue: parseFloat(monthlyRevenue[0].sum || 0),
        active_delivery_partners: parseInt(partnerCount[0].count)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getReportTemplate = async (req, res, queryField, table, dateCol) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
    
    const { range = 'monthly', start_date, end_date } = req.query;
    
    let dateTrunc = 'day';
    if (range === 'monthly') dateTrunc = 'month';
    else if (range === 'weekly') dateTrunc = 'week';
    
    let query = `
      SELECT date_trunc($1, ${dateCol}) as period, ${queryField} as total
      FROM ${table}
    `;
    const values = [dateTrunc];
    let conditions = [];
    
    if (table === 'orders' && queryField.includes('SUM')) {
      conditions.push("status = 'Delivered'");
    }

    if (start_date && end_date) {
      conditions.push(`CAST(${dateCol} AS DATE) >= $2`);
      conditions.push(`CAST(${dateCol} AS DATE) <= $3`);
      values.push(start_date, end_date);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ` GROUP BY period ORDER BY period DESC LIMIT 30`;
    
    const { rows } = await pool.query(query, values);
    res.json({ success: true, message: 'Report retrieved', data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getSalesReports = (req, res) => getReportTemplate(req, res, 'SUM(total_amount)', 'orders', 'created_at');
const getOrderReports = (req, res) => getReportTemplate(req, res, 'COUNT(*)', 'orders', 'created_at');
const getUserReports = (req, res) => getReportTemplate(req, res, 'COUNT(*)', 'users', 'created_at');
const getRestaurantReports = (req, res) => getReportTemplate(req, res, 'COUNT(*)', 'restaurants', 'created_at');

module.exports = { getDashboard, getSalesReports, getOrderReports, getUserReports, getRestaurantReports };
