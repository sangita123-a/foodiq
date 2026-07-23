const {
  listTestimonials,
  getTestimonialById,
  createTestimonial,
  markHelpful,
  reportTestimonial,
  seedFeaturedIfEmpty,
} = require('../models/testimonialModel');
const { getOrderById } = require('../models/orderModel');
const { ok, fail } = require('../utils/respond');

const FALLBACK_SEED = [
  {
    name: 'Priya Sharma',
    city: 'Hyderabad',
    image: '/images/catalog/dishes/pizza/classic-margherita.webp',
    rating: 5,
    review:
      'The delivery was super fast and the food was still hot. Foodiq has become my favorite food ordering platform. Highly recommended!',
    restaurant: 'Paradise Biryani',
    dish: 'Chicken Dum Biryani',
    order_date: '2026-10-12',
  },
  {
    name: 'Rahul Verma',
    city: 'Mumbai',
    image: '/images/catalog/dishes/biryani/hyderabadi-biryani.webp',
    rating: 5,
    review:
      'Absolutely seamless experience. The tracking is incredibly accurate and the food packaging was premium and tamper-proof.',
    restaurant: "Domino's Pizza",
    dish: 'Cheese Burst Pizza',
    order_date: '2026-10-10',
  },
  {
    name: 'Ananya Gupta',
    city: 'Delhi',
    image: '/images/catalog/dishes/chinese/hakka-noodles.webp',
    rating: 5,
    review:
      'I love the exclusive discounts! I saved so much on my favorite sushi place today. Customer support is also super responsive.',
    restaurant: 'Tokyo Sushi',
    dish: 'Spicy Tuna Roll',
    order_date: '2026-10-08',
  },
  {
    name: 'Arjun Reddy',
    city: 'Bangalore',
    image: '/images/catalog/dishes/burger/cheese-burger.webp',
    rating: 5,
    review: 'Best late-night delivery app out there. Finding great food at 2 AM is so easy now. Five stars all the way!',
    restaurant: 'Midnight Bites',
    dish: 'Peri Peri Burger',
    order_date: '2026-10-05',
  },
  {
    name: 'Sneha Patil',
    city: 'Pune',
    image: '/images/catalog/dishes/desserts/chocolate-cake.webp',
    rating: 5,
    review:
      'The user interface is gorgeous. It feels like a premium app every time I open it. The curated collections are brilliant.',
    restaurant: 'Green Leaf Cafe',
    dish: 'Avocado Salad Bowl',
    order_date: '2026-10-01',
  },
];

const list = async (req, res) => {
  try {
    await seedFeaturedIfEmpty(FALLBACK_SEED).catch(() => false);
    const items = await listTestimonials({
      status: 'approved',
      search: String(req.query.search || '').trim(),
      restaurant: String(req.query.restaurant || '').trim(),
      rating: req.query.rating ? Number(req.query.rating) : null,
      sort: String(req.query.sort || 'latest'),
      featuredOnly: String(req.query.featured || '') === 'true',
      limit: Number(req.query.limit) || 50,
      offset: Number(req.query.offset) || 0,
      userId: req.user?.id || null,
    });
    return ok(res, 'Testimonials retrieved', items);
  } catch (error) {
    return fail(res, 500, 'Failed to load testimonials', error);
  }
};

const featured = async (req, res) => {
  try {
    await seedFeaturedIfEmpty(FALLBACK_SEED).catch(() => false);
    let items = await listTestimonials({
      status: 'approved',
      featuredOnly: true,
      sort: 'latest',
      limit: Number(req.query.limit) || 12,
      userId: req.user?.id || null,
    });
    if (!items.length) {
      items = await listTestimonials({
        status: 'approved',
        sort: 'latest',
        limit: Number(req.query.limit) || 12,
        userId: req.user?.id || null,
      });
    }
    return ok(res, 'Featured testimonials', items);
  } catch (error) {
    return fail(res, 500, 'Failed to load featured testimonials', error);
  }
};

const create = async (req, res) => {
  try {
    const userId = req.user.id;
    const rating = Number(req.body.rating);
    const reviewText = String(req.body.review || req.body.review_text || '').trim();
    const orderId = req.body.order_id;
    const restaurantId = req.body.restaurant_id || null;
    const city = String(req.body.city || '').trim() || null;
    const imageUrls = Array.isArray(req.body.image_urls) ? req.body.image_urls : [];

    if (!rating || rating < 1 || rating > 5) {
      return fail(res, 400, 'A rating between 1 and 5 is required');
    }
    if (reviewText.length < 10) {
      return fail(res, 400, 'Review must be at least 10 characters');
    }
    if (!orderId) {
      return fail(res, 400, 'order_id is required — only completed orders can be reviewed');
    }

    const order = await getOrderById(orderId);
    if (!order) return fail(res, 404, 'Order not found');
    if (order.user_id !== userId) return fail(res, 403, 'Not authorized for this order');
    if (String(order.status || '').toLowerCase() !== 'delivered') {
      return fail(res, 400, 'Order must be delivered before reviewing');
    }
    if (restaurantId && String(order.restaurant_id) !== String(restaurantId)) {
      return fail(res, 400, 'Order does not belong to the selected restaurant');
    }

    // Resolve dish / restaurant from order
    let dishName = String(req.body.dish || req.body.dish_name || '').trim();
    let restaurantName = String(req.body.restaurant || req.body.restaurant_name || '').trim();
    if (!dishName && Array.isArray(order.items) && order.items[0]?.name) {
      dishName = order.items[0].name;
    }
    if (!restaurantName) {
      restaurantName = order.restaurant_name || 'Foodiq Partner';
    }
    dishName = dishName || 'Order';

    const created = await createTestimonial({
      userId,
      orderId,
      restaurantId: order.restaurant_id,
      restaurantName,
      dishName,
      city,
      rating,
      reviewText,
      userName: req.user.full_name,
      profileImageUrl: req.user.profile_image_url || null,
      imageUrls,
      status: 'approved',
      isFeatured: false,
      orderDate: order.created_at || new Date(),
    });

    return ok(res, 'Testimonial submitted', created, 201);
  } catch (error) {
    if (error.code === '23505') {
      return fail(res, 409, 'You already reviewed this order');
    }
    return fail(res, error.status || 500, error.message || 'Failed to submit testimonial', error);
  }
};

const helpful = async (req, res) => {
  try {
    const id = req.params.id;
    const existing = await getTestimonialById(id);
    if (!existing || existing.status !== 'approved') {
      return fail(res, 404, 'Testimonial not found');
    }
    const result = await markHelpful(id, req.user.id);
    return ok(res, 'Marked as helpful', result);
  } catch (error) {
    return fail(res, error.status || 500, error.message || 'Failed to mark helpful', error);
  }
};

const report = async (req, res) => {
  try {
    const id = req.params.id;
    const reason = String(req.body.reason || '').trim();
    if (reason.length < 5) {
      return fail(res, 400, 'Please provide a reason (min 5 characters)');
    }
    const existing = await getTestimonialById(id);
    if (!existing) return fail(res, 404, 'Testimonial not found');

    const row = await reportTestimonial({
      testimonialId: id,
      reporterId: req.user?.id || null,
      reason,
    });
    return ok(res, 'Report submitted', row, 201);
  } catch (error) {
    return fail(res, 500, 'Failed to report review', error);
  }
};

const getOne = async (req, res) => {
  try {
    const item = await getTestimonialById(req.params.id, req.user?.id || null);
    if (!item || (item.status !== 'approved' && req.user?.role !== 'admin')) {
      return fail(res, 404, 'Testimonial not found');
    }
    return ok(res, 'Testimonial', item);
  } catch (error) {
    return fail(res, 500, 'Failed to load testimonial', error);
  }
};

module.exports = {
  list,
  featured,
  create,
  helpful,
  report,
  getOne,
};
