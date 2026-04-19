require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { initDB, seedDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL, 'http://localhost:5173']
  : ['http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

const etsyRoutes = require('./routes/etsy');
const trendsRoutes = require('./routes/trends');
const plrRoutes = require('./routes/plr');
const proxyRoutes = require('./routes/proxy');
const scheduleRoutes = require('./routes/schedule');
const scoreboardRoutes = require('./routes/scoreboard');
const assistantRoutes = require('./routes/assistant');
const brandRoutes = require('./routes/brand');
const marketingRoutes = require('./routes/marketing');

app.use('/uploads', express.static(path.join(__dirname, 'data', 'uploads')));
app.use('/api/etsy', etsyRoutes);
app.use('/api/trends', trendsRoutes);
app.use('/api/plr', plrRoutes);
app.use('/api/proxies', proxyRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/scoreboard', scoreboardRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/marketing', marketingRoutes);

app.get('/api/health', async (req, res) => {
  try {
    const { readDB } = require('./db');
    const db = await readDB();
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      collections: {
        etsyProducts: db.etsyProducts?.length || 0,
        etsyShops: db.etsyShops?.length || 0,
        plrSources: db.plrSources?.length || 0,
        proxies: db.proxies?.length || 0,
        brands: db.brands?.length || 0,
        marketingReports: db.marketingReports?.length || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  });
}

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: `${req.method} ${req.originalUrl} does not exist` });
});

app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

app.listen(PORT, async () => {
  try {
    await initDB();
    console.log('[db] Database initialized');
    if (process.env.SEED_DATA === 'true') {
      await seedDB();
    }
  } catch (err) {
    console.error('[db] Failed to initialize database:', err.message);
    process.exit(1);
  }

  console.log('');
  console.log('=========================================');
  console.log('  Digital Products Research Engine');
  console.log('=========================================');
  console.log(`  Server running on port ${PORT}`);
  console.log(`  API base: http://localhost:${PORT}/api`);
  console.log(`  Health:   http://localhost:${PORT}/api/health`);
  console.log('=========================================');
  console.log('');
});

module.exports = app;
