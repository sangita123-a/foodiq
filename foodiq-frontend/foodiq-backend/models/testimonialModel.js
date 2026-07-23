const { pool } = require('../config/db');

const mapRow = (row, images = []) => {
  if (!row) return null;
  const orderDate = row.order_date || row.created_at;
  let dateLabel = '';
  try {
    dateLabel = new Date(orderDate).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    dateLabel = '';
  }
  return {
    id: row.id,
    user_id: row.user_id,
    order_id: row.order_id,
    restaurant_id: row.restaurant_id,
    name: row.user_name || row.full_name || 'Foodiq Guest',
    city: row.city || 'India',
    image: row.profile_image_url || null,
    rating: Number(row.rating) || 5,
    review: row.review_text,
    restaurant: row.restaurant_name || row.restaurant_join_name || 'Foodiq Partner',
    dish: row.dish_name || 'Order',
    date: dateLabel,
    order_date: orderDate,
    helpful_count: Number(row.helpful_count) || 0,
    is_featured: Boolean(row.is_featured),
    status: row.status,
    images: images.map((img) => (typeof img === 'string' ? img : img.image_url)).filter(Boolean),
    has_voted: Boolean(row.has_voted),
    created_at: row.created_at,
  };
};

const fetchImages = async (testimonialIds) => {
  if (!testimonialIds.length) return new Map();
  const { rows } = await pool.query(
    `SELECT testimonial_id, image_url, sort_order
     FROM review_images
     WHERE testimonial_id = ANY($1::uuid[])
     ORDER BY sort_order ASC, created_at ASC`,
    [testimonialIds]
  );
  const map = new Map();
  for (const row of rows) {
    const list = map.get(row.testimonial_id) || [];
    list.push(row.image_url);
    map.set(row.testimonial_id, list);
  }
  return map;
};

const listTestimonials = async ({
  status = 'approved',
  search = '',
  restaurant = '',
  rating = null,
  sort = 'latest',
  featuredOnly = false,
  limit = 50,
  offset = 0,
  userId = null,
} = {}) => {
  const where = [];
  const params = [];
  let i = 1;

  if (status) {
    where.push(`t.status = $${i++}`);
    params.push(status);
  }
  if (featuredOnly) {
    where.push(`t.is_featured = TRUE`);
  }
  if (search) {
    where.push(
      `(t.review_text ILIKE $${i} OR t.user_name ILIKE $${i} OR t.restaurant_name ILIKE $${i} OR t.dish_name ILIKE $${i} OR t.city ILIKE $${i})`
    );
    params.push(`%${search}%`);
    i += 1;
  }
  if (restaurant) {
    where.push(`(t.restaurant_name ILIKE $${i} OR r.name ILIKE $${i})`);
    params.push(`%${restaurant}%`);
    i += 1;
  }
  if (rating) {
    where.push(`t.rating = $${i++}`);
    params.push(Number(rating));
  }

  const orderBy =
    sort === 'oldest'
      ? 't.created_at ASC'
      : sort === 'rating'
        ? 't.rating DESC, t.created_at DESC'
        : 't.created_at DESC';

  const votedSelect = userId
    ? `, EXISTS(SELECT 1 FROM helpful_votes hv WHERE hv.testimonial_id = t.id AND hv.user_id = $${i}) AS has_voted`
    : ', FALSE AS has_voted';
  if (userId) {
    params.push(userId);
    i += 1;
  }

  params.push(Math.min(Number(limit) || 50, 100));
  const limitIdx = i++;
  params.push(Math.max(Number(offset) || 0, 0));
  const offsetIdx = i++;

  const sql = `
    SELECT t.*, r.name AS restaurant_join_name, u.full_name, u.profile_image_url AS user_profile_image
    ${votedSelect}
    FROM testimonials t
    LEFT JOIN restaurants r ON r.id = t.restaurant_id
    LEFT JOIN users u ON u.id = t.user_id
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY ${orderBy}
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const { rows } = await pool.query(sql, params);
  const ids = rows.map((r) => r.id);
  const images = await fetchImages(ids);
  return rows.map((row) =>
    mapRow(
      {
        ...row,
        profile_image_url: row.profile_image_url || row.user_profile_image,
        user_name: row.user_name || row.full_name,
      },
      images.get(row.id) || []
    )
  );
};

const getTestimonialById = async (id, userId = null) => {
  const params = [id];
  const votedSelect = userId
    ? `, EXISTS(SELECT 1 FROM helpful_votes hv WHERE hv.testimonial_id = t.id AND hv.user_id = $2) AS has_voted`
    : ', FALSE AS has_voted';
  if (userId) params.push(userId);

  const { rows } = await pool.query(
    `SELECT t.*, r.name AS restaurant_join_name, u.full_name, u.profile_image_url AS user_profile_image
     ${votedSelect}
     FROM testimonials t
     LEFT JOIN restaurants r ON r.id = t.restaurant_id
     LEFT JOIN users u ON u.id = t.user_id
     WHERE t.id = $1`,
    params
  );
  if (!rows[0]) return null;
  const images = await fetchImages([id]);
  const row = rows[0];
  return mapRow(
    {
      ...row,
      profile_image_url: row.profile_image_url || row.user_profile_image,
      user_name: row.user_name || row.full_name,
    },
    images.get(id) || []
  );
};

const createTestimonial = async ({
  userId,
  orderId,
  restaurantId,
  restaurantName,
  dishName,
  city,
  rating,
  reviewText,
  userName,
  profileImageUrl,
  imageUrls = [],
  status = 'pending',
  isFeatured = false,
  orderDate = null,
}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO testimonials (
         user_id, order_id, restaurant_id, restaurant_name, dish_name, city,
         rating, review_text, user_name, profile_image_url, status, is_featured, order_date
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        userId,
        orderId || null,
        restaurantId || null,
        restaurantName || null,
        dishName || null,
        city || null,
        rating,
        reviewText,
        userName || null,
        profileImageUrl || null,
        status,
        Boolean(isFeatured),
        orderDate,
      ]
    );
    const created = rows[0];
    const urls = (Array.isArray(imageUrls) ? imageUrls : []).filter(Boolean).slice(0, 3);
    for (let idx = 0; idx < urls.length; idx += 1) {
      await client.query(
        `INSERT INTO review_images (testimonial_id, image_url, sort_order) VALUES ($1,$2,$3)`,
        [created.id, urls[idx], idx]
      );
    }
    await client.query('COMMIT');
    return getTestimonialById(created.id, userId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const markHelpful = async (testimonialId, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query(
      `SELECT id FROM helpful_votes WHERE testimonial_id = $1 AND user_id = $2`,
      [testimonialId, userId]
    );
    if (existing.rows[0]) {
      await client.query('ROLLBACK');
      const err = new Error('You already marked this review as helpful');
      err.status = 409;
      throw err;
    }
    await client.query(
      `INSERT INTO helpful_votes (testimonial_id, user_id) VALUES ($1, $2)`,
      [testimonialId, userId]
    );
    const { rows } = await client.query(
      `UPDATE testimonials
       SET helpful_count = helpful_count + 1, updated_at = NOW()
       WHERE id = $1
       RETURNING helpful_count`,
      [testimonialId]
    );
    await client.query('COMMIT');
    return { helpful_count: Number(rows[0]?.helpful_count) || 0, has_voted: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const reportTestimonial = async ({ testimonialId, reporterId, reason }) => {
  const { rows } = await pool.query(
    `INSERT INTO reported_reviews (testimonial_id, reporter_id, reason)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [testimonialId, reporterId || null, reason]
  );
  return rows[0];
};

const countApproved = async () => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS c FROM testimonials WHERE status = 'approved'`
  );
  return rows[0]?.c || 0;
};

const seedFeaturedIfEmpty = async (seedItems = []) => {
  const count = await countApproved();
  if (count > 0 || !seedItems.length) return false;
  for (const item of seedItems) {
    await createTestimonial({
      userId: null,
      orderId: null,
      restaurantId: null,
      restaurantName: item.restaurant,
      dishName: item.dish,
      city: item.city,
      rating: item.rating || 5,
      reviewText: item.review,
      userName: item.name,
      profileImageUrl: item.image,
      imageUrls: [],
      status: 'approved',
      isFeatured: true,
      orderDate: item.order_date ? new Date(item.order_date) : new Date(),
    });
  }
  return true;
};

module.exports = {
  listTestimonials,
  getTestimonialById,
  createTestimonial,
  markHelpful,
  reportTestimonial,
  countApproved,
  seedFeaturedIfEmpty,
  mapRow,
};
