const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { pool } = require('./config/db');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const ensureSchema = require('./utils/ensureSchema');

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '5mb' }));

if (!process.env.JWT_SECRET) {
  console.warn('[AUTH] JWT_SECRET is not configured in .env — tokens will use an insecure fallback.');
}

const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const menuCategoryRoutes = require('./routes/menuCategoryRoutes');
const menuItemRoutes = require('./routes/menuItemRoutes');
const searchRoutes = require('./routes/searchRoutes');
const cartRoutes = require('./routes/cartRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const addressRoutes = require('./routes/addressRoutes');
const couponRoutes = require('./routes/couponRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const paymentMethodRoutes = require('./routes/paymentMethodRoutes');
const orderRoutes = require('./routes/orderRoutes');
const deliveryPartnerRoutes = require('./routes/deliveryPartnerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const profileRoutes = require('./routes/profileRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const contactRoutes = require('./routes/contactRoutes');
const supportRoutes = require('./routes/supportRoutes');
const offerRoutes = require('./routes/offerRoutes');
const liveDealRoutes = require('./routes/liveDealRoutes');
const cuisineRoutes = require('./routes/cuisineRoutes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurant-categories', categoryRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu-categories', menuCategoryRoutes);
app.use('/api/menu-items', menuItemRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/live-deals', liveDealRoutes);
app.use('/api/cuisines', cuisineRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/delivery-partners', deliveryPartnerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/support', supportRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API is running' });
});

// 404 and Error Handler Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

// Test DB Connection, ensure schema, then start server
pool.connect()
  .then(async (client) => {
    console.log('Connected to PostgreSQL Database');
    client.release();
    await ensureSchema();
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection failed:', err.message);
    console.log('Starting server anyway (so it doesnt crash loop during setup)...');
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  });
