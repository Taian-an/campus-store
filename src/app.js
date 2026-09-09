const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const peerRoutes = require('./routes/peer');
const userRoutes = require('./routes/users');

// Nginx proxies /campus-store/ straight through without stripping the
// prefix, so the Express app itself must be base-path aware: every route is
// mounted under BASE_PATH instead of assuming root (proposal §10.1).
function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const basePath = process.env.BASE_PATH || '/campus-store';
  const router = express.Router();

  router.get('/health', (req, res) => res.json({ status: 'ok' }));
  router.use('/auth', authRoutes);
  router.use('/api/categories', categoryRoutes);
  router.use('/api/products', productRoutes);
  router.use('/api/orders', orderRoutes);
  router.use('/api/peer', peerRoutes);
  router.use('/api/users', userRoutes);

  app.use(basePath, router);

  // Local dev convenience only: also serve at root so `npm run dev` works
  // against http://localhost:4002/ directly, without the Nginx-added prefix.
  if (process.env.NODE_ENV !== 'production') {
    app.use('/', router);
  }

  return app;
}

module.exports = createApp;
