require('dotenv').config();
const { pool } = require('../config/db');

(async () => {
  const cr = await pool.query('SELECT COUNT(*)::int AS c FROM collection_restaurants');
  console.log('collection_restaurants:', cr.rows[0].c);
  const cols = await pool.query('SELECT slug, title FROM restaurant_collections ORDER BY sort_order');
  console.log('collections:', cols.rows);
  const rest = await pool.query('SELECT COUNT(*)::int AS c FROM restaurants WHERE is_active = true');
  console.log('active restaurants:', rest.rows[0].c);
  const sample = await pool.query(
    'SELECT name, image_url, offer_text, rating FROM restaurants WHERE is_active = true LIMIT 5'
  );
  console.log('sample restaurants:', sample.rows);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
