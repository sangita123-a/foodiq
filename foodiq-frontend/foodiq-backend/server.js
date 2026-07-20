const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Render injects RENDER_EXTERNAL_URL (https://….onrender.com)
if (!process.env.API_PUBLIC_URL && process.env.RENDER_EXTERNAL_URL) {
  process.env.API_PUBLIC_URL = process.env.RENDER_EXTERNAL_URL;
}

const { pool } = require('./config/db');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const ensureSchema = require('./utils/ensureSchema');
const { initSocket } = require('./socket');
const requestContext = require('./middleware/requestContext');
const securityHeaders = require('./middleware/securityHeaders');
const { apiLimiter } = require('./middleware/rateLimiters');
const { csrfProtection } = require('./middleware/csrf');
const { sanitizeBody, sanitizeQuery } = require('./middleware/sanitize');
const { log } = require('./utils/logger');

const app = express();
const server = http.createServer(app);

const isProduction = process.env.NODE_ENV === 'production';

const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  ...(isProduction
    ? []
    : ['http://localhost:3000', 'http://127.0.0.1:3000']),
].filter(Boolean);

const corsStrict =
  String(process.env.CORS_STRICT || (isProduction ? 'true' : 'false')).toLowerCase() ===
  'true';
// Production: only allow *.vercel.app when explicitly enabled
const allowVercelPreviews =
  String(process.env.CORS_ALLOW_VERCEL || 'false').toLowerCase() === 'true';

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (allowVercelPreviews && /\.vercel\.app$/i.test(origin)) return true;
  return false;
};

// Trust proxy for correct IP / rate-limit behind load balancers
if (String(process.env.TRUST_PROXY || 'true') === 'true') {
  app.set('trust proxy', 1);
}

app.use(requestContext);
app.use(require('./middleware/httpsEnforce'));
app.use(securityHeaders);
app.use(require('./middleware/requestTiming').requestTiming);

try {
  const compression = require('compression');
  app.use(
    compression({
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      },
    })
  );
} catch {
  /* optional */
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      if (corsStrict) {
        return callback(new Error('Not allowed by CORS'));
      }
      // Dev / local tooling: allow unknown origins unless CORS_STRICT
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
  })
);

app.use(cookieParser());

// Preserve raw body for Razorpay webhook HMAC verification.
app.use(
  express.json({
    limit: '5mb',
    verify: (req, _res, buf) => {
      if (req.originalUrl && req.originalUrl.startsWith('/api/payments/webhook')) {
        req.rawBody = buf.toString('utf8');
      }
    },
  })
);

app.use(sanitizeBody);
app.use(sanitizeQuery);
app.use(csrfProtection);
app.use('/api', apiLimiter);

if (!process.env.JWT_SECRET) {
  if (isProduction) {
    log.error('JWT_SECRET is required in production. Refusing to start.');
    process.exit(1);
  }
  log.error(
    'JWT_SECRET is not configured. Set a 32+ character secret in .env before starting.'
  );
  process.exit(1);
} else {
  try {
    require('./utils/generateToken').assertSecretStrength(
      process.env.JWT_SECRET,
      'JWT_SECRET'
    );
  } catch (err) {
    log.error(err.message);
    process.exit(1);
  }
}

// Refuse insecure payment mock in production unless explicitly allowed
try {
  const { isMockMode } = require('./utils/razorpayClient');
  if (
    isProduction &&
    isMockMode() &&
    String(process.env.ALLOW_PAYMENT_MOCK || '').toLowerCase() !== 'true'
  ) {
    log.error(
      'Razorpay is in mock mode in production without ALLOW_PAYMENT_MOCK=true. Payments will reject until keys or ALLOW_PAYMENT_MOCK are set — continuing boot for catalog APIs.'
    );
  }
} catch (err) {
  log.warn('Payment mode check skipped', { error: err.message });
}

const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const menuCategoryRoutes = require('./routes/menuCategoryRoutes');
const menuItemRoutes = require('./routes/menuItemRoutes');
const menuRoutes = require('./routes/menuRoutes');
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
const siteSettingsRoutes = require('./routes/siteSettingsRoutes');
const supportRoutes = require('./routes/supportRoutes');
const offerRoutes = require('./routes/offerRoutes');
const liveDealRoutes = require('./routes/liveDealRoutes');
const cuisineRoutes = require('./routes/cuisineRoutes');
const partnerRoutes = require('./routes/partnerRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/restaurant-categories', categoryRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu-categories', menuCategoryRoutes);
app.use('/api/menu-items', menuItemRoutes);
app.use('/api/menu', menuRoutes);
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
app.use('/api/loyalty', require('./routes/loyaltyRoutes'));
app.use('/api/wallet', require('./routes/walletRoutes'));
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/v3', require('./routes/v3AdminRoutes'));
app.use('/api/admin/v4', require('./routes/v4AdminRoutes'));
app.use('/api/v1', require('./routes/v1Routes'));
app.use('/api/v4', require('./routes/v4Routes'));
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', require('./routes/newsletterRoutes'));
app.use('/api/site-settings', siteSettingsRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/help-center', require('./routes/helpCenterRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/bugs', require('./routes/bugRoutes'));
app.use('/api/partner', partnerRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/driver', require('./routes/driverRoutes'));
app.use('/api/messaging', require('./routes/messagingRoutes'));
app.use('/api/media', require('./routes/mediaRoutes'));
app.use('/api/monitoring', require('./routes/monitoringRoutes'));
app.use('/api/features', require('./routes/featureRoutes'));
app.use('/api/analytics', require('./routes/analyticsBiRoutes'));

// ─── Static: catalog images ───────────────────────────────────────────────
// Path is resolved relative to __dirname so it works regardless of CWD.
// On Render the service rootDir is foodiq-frontend/foodiq-backend, so
// __dirname === /opt/render/project/src and the images sit under
// __dirname/public/images/catalog/{restaurants,dishes,cuisines,logos}.
const imagesPath = path.resolve(__dirname, 'public', 'images');

log.info('[static] imagesPath resolved', { imagesPath });
log.info('[static] imagesPath exists', { exists: fs.existsSync(imagesPath) });
try {
  log.info('[static] imagesPath contents', { entries: fs.readdirSync(imagesPath) });
} catch (err) {
  log.warn('[static] cannot read imagesPath', { error: err.message });
}

app.use(
  '/images',
  express.static(imagesPath, {
    maxAge: '30d',
    immutable: false,
    fallthrough: true,
    setHeaders(res) {
      res.setHeader('Cache-Control', 'public, max-age=2592000');
    },
  })
);

app.use('/images', (req, res, next) => {
  if (req.method !== 'GET' || res.headersSent) return next();
  const p = req.path.toLowerCase();
  const defName = /restaurant|logo/.test(p) ? 'default-restaurant.webp' : 'default-food.webp';
  const defPath = path.join(__dirname, 'public', defName);
  if (fs.existsSync(defPath)) {
    res.setHeader('Cache-Control', 'public, max-age=2592000');
    return res.sendFile(defPath);
  }
  return next();
});

app.use(
  '/media-files',
  express.static(path.join(__dirname, 'uploads'), {
    maxAge: '7d',
    fallthrough: true,
  })
);

// Back-compat health + deep health via monitoring
app.get('/api/health', require('./controllers/monitoringController').getPublicHealth);

app.use(notFound);
app.use(errorHandler);

initSocket(server, { allowedOrigins, isOriginAllowed, corsStrict });

const PORT = process.env.PORT || 4000;

const startListening = () => {
  server.listen(PORT, '0.0.0.0', () => {
    log.info(
      `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT} (HTTP + Socket.IO)`
    );
  });
};

pool
  .connect()
  .then(async (client) => {
    log.info('Connected to PostgreSQL Database');
    client.release();
    try {
      await require('./utils/applyBaseSchema')();
    } catch (err) {
      log.warn('Base schema apply skipped', { error: err.message });
    }
    await ensureSchema();
    try {
      await require('./utils/ensureProductionCatalog')();
    } catch (err) {
      log.warn('Production catalog seed skipped', { error: err.message });
    }
    try {
      await require('./services/cacheService').connectRedis();
    } catch (err) {
      log.warn('Redis connect skipped', { error: err.message });
    }
    // Warm hot catalog keys in background
    try {
      const cache = require('./services/cacheService');
      const { getCategories } = require('./models/restaurantCategoryModel');
      const { getAllOffers } = require('./models/offerModel');
      const { getAllLiveDeals } = require('./models/liveDealModel');
      const { getMenuItems } = require('./models/menuItemModel');
      cache
        .warm([
          {
            key: cache.cacheKey('categories:all', {}),
            ttl: Number(process.env.CACHE_TTL_CATEGORIES || 300),
            producer: getCategories,
          },
          {
            key: cache.cacheKey('offers:all', {}),
            ttl: Number(process.env.CACHE_TTL_OFFERS || 120),
            producer: getAllOffers,
          },
          {
            key: cache.cacheKey('live_deals:all', {}),
            ttl: Number(process.env.CACHE_TTL_OFFERS || 120),
            producer: getAllLiveDeals,
          },
          {
            key: cache.cacheKey('menu:list', { trending: 'true', limit: '8', search: '' }),
            ttl: Number(process.env.CACHE_TTL_MENU || 60),
            producer: () => getMenuItems({ trending: 'true', limit: '8', search: '' }),
          },
        ])
        .catch(() => {});
    } catch {
      /* ignore */
    }
    startListening();
    try {
      require('./services/scheduledPushService').startScheduledPushWorker();
    } catch (err) {
      log.warn('Scheduled push worker skipped', { error: err.message });
    }
  })
  .catch((err) => {
    log.error('Database connection failed', { error: err.message });
    if (isProduction) {
      log.error('Refusing to start without a database in production.');
      process.exit(1);
    }
    console.log('Starting server anyway (so it doesnt crash loop during setup)...');
    try {
      const { createAlert } = require('./services/alertService');
      createAlert({
        severity: 'critical',
        type: 'database_failure',
        title: 'Database connection failed on boot',
        message: err.message,
      }).catch(() => {});
    } catch {
      /* ignore */
    }
    startListening();
  });
