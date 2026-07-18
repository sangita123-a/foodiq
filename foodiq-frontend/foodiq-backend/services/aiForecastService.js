const { pool } = require('../config/db');

/**
 * Heuristic sales / demand forecast (foundation stub — not a trained ML model).
 * Uses simple moving average of daily order volume / GMV.
 */
const runForecast = async ({
  forecastType = 'sales',
  marketId = null,
  organizationId = null,
  horizonDays = 7,
} = {}) => {
  const horizon = Math.min(Math.max(Number(horizonDays) || 7, 1), 30);
  const lookback = 28;

  const params = [lookback];
  let filter = '';
  if (marketId) {
    params.push(marketId);
    filter += ` AND market_id = $${params.length}`;
  }

  const metric =
    forecastType === 'demand'
      ? 'COUNT(*)::float'
      : 'COALESCE(SUM(total_amount), 0)::float';

  const { rows } = await pool.query(
    `SELECT DATE(created_at) AS day, ${metric} AS value
     FROM orders
     WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')
       AND status NOT IN ('Cancelled')
       ${filter}
     GROUP BY DATE(created_at)
     ORDER BY day ASC`,
    params
  );

  const values = rows.map((r) => Number(r.value) || 0);
  const avg =
    values.length > 0
      ? values.reduce((s, v) => s + v, 0) / values.length
      : 0;

  // Light weekend uplift placeholder
  const series = [];
  const start = new Date();
  for (let i = 1; i <= horizon; i += 1) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dow = d.getDay();
    const weekendBoost = dow === 0 || dow === 6 ? 1.15 : 1;
    series.push({
      date: d.toISOString().slice(0, 10),
      predicted: Math.round(avg * weekendBoost * 100) / 100,
    });
  }

  const payload = {
    method: 'moving_average_v1',
    lookback_days: lookback,
    historical_points: rows.length,
    baseline: Math.round(avg * 100) / 100,
    series,
  };

  const { rows: saved } = await pool.query(
    `INSERT INTO ai_forecast_runs (
       organization_id, market_id, forecast_type, horizon_days, payload
     ) VALUES ($1, $2, $3, $4, $5::jsonb)
     RETURNING *`,
    [
      organizationId || null,
      marketId || null,
      forecastType === 'demand' ? 'demand' : 'sales',
      horizon,
      JSON.stringify(payload),
    ]
  );

  return saved[0];
};

module.exports = { runForecast };
