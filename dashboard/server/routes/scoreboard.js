const express = require('express');
const router = express.Router();
const { getCollection, updateCollection } = require('../db');
const { scoreProduct } = require('../utils/scoring');

router.get('/', async (req, res) => {
  try {
    const scoreboard = await getCollection('scoreboard');
    scoreboard.sort((a, b) => (b.score || 0) - (a.score || 0));
    res.json({ success: true, total: scoreboard.length, products: scoreboard });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/rescore', async (req, res) => {
  try {
    const etsyProducts = await getCollection('etsyProducts');
    const trendResults = await getCollection('trendResults');

    const trendMap = {};
    for (const trend of trendResults) {
      const kw = (trend.keyword || '').toLowerCase();
      if (kw && (!trendMap[kw] || new Date(trend.fetchedAt) > new Date(trendMap[kw].fetchedAt))) {
        trendMap[kw] = trend;
      }
    }

    const scoreboard = etsyProducts.map((product) => {
      const trendData = trendMap[(product.query || '').toLowerCase()] || {};
      const result = scoreProduct(product, trendData);
      return {
        id: product.id, listingId: product.listingId, title: product.title,
        price: product.price, currency: product.currency, reviews: product.reviews,
        shopName: product.shopName, listingUrl: product.listingUrl, imageUrl: product.imageUrl,
        query: product.query, score: result.score, breakdown: result.breakdown,
        classification: result.classification, scoredAt: new Date().toISOString(),
      };
    }).sort((a, b) => b.score - a.score);

    await updateCollection('scoreboard', scoreboard);
    res.json({ success: true, message: `Rescored ${scoreboard.length} products`, total: scoreboard.length, top10: scoreboard.slice(0, 10) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/top', async (req, res) => {
  try {
    const scoreboard = await getCollection('scoreboard');
    scoreboard.sort((a, b) => (b.score || 0) - (a.score || 0));
    res.json({ success: true, total: scoreboard.length, showing: Math.min(20, scoreboard.length), products: scoreboard.slice(0, 20) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
