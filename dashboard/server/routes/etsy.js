const express = require('express');
const router = express.Router();
const { searchEtsy, scrapeShop, scrapeProduct } = require('../scrapers/etsy');
const { getCollection, updateCollection } = require('../db');
const crypto = require('crypto');

router.post('/search', async (req, res) => {
  try {
    const { query, pages } = req.body;
    if (!query) return res.status(400).json({ error: 'query is required' });

    const results = await searchEtsy(query, { pages: pages || 1 });
    const existing = await getCollection('etsyProducts');
    const existingIds = new Set(existing.map((p) => p.listingId));
    const newProducts = results.filter((p) => p.listingId && !existingIds.has(p.listingId));
    await updateCollection('etsyProducts', [...existing, ...newProducts]);

    res.json({ success: true, found: results.length, newProducts: newProducts.length, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/shop', async (req, res) => {
  try {
    const { shopName } = req.body;
    if (!shopName) return res.status(400).json({ error: 'shopName is required' });

    const shop = await scrapeShop(shopName);
    const shops = await getCollection('etsyShops');
    const idx = shops.findIndex((s) => s.shopName === shopName);
    if (idx !== -1) shops[idx] = shop; else shops.push(shop);
    await updateCollection('etsyShops', shops);

    res.json({ success: true, shop });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/product', async (req, res) => {
  try {
    const { listingUrl } = req.body;
    if (!listingUrl) return res.status(400).json({ error: 'listingUrl is required' });

    const product = await scrapeProduct(listingUrl);
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/results', async (req, res) => {
  try {
    const results = await getCollection('etsyProducts');
    res.json({ success: true, total: results.length, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/bookmark', async (req, res) => {
  try {
    const { shopName, shopUrl, notes } = req.body;
    if (!shopName) return res.status(400).json({ error: 'shopName is required' });

    const bookmarks = await getCollection('bookmarkedShops');
    const exists = bookmarks.find((b) => b.shopName === shopName);
    if (exists) return res.json({ success: true, message: 'Already bookmarked', bookmark: exists });

    const bookmark = {
      id: `bm-${crypto.randomBytes(4).toString('hex')}`,
      shopName,
      shopUrl: shopUrl || `https://www.etsy.com/shop/${shopName}`,
      notes: notes || '',
      bookmarkedAt: new Date().toISOString(),
    };
    bookmarks.push(bookmark);
    await updateCollection('bookmarkedShops', bookmarks);

    res.json({ success: true, bookmark });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/bookmarks', async (req, res) => {
  try {
    const bookmarks = await getCollection('bookmarkedShops');
    res.json({ success: true, total: bookmarks.length, bookmarks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/bookmarks/:id', async (req, res) => {
  try {
    const bookmarks = await getCollection('bookmarkedShops');
    const filtered = bookmarks.filter((b) => b.id !== req.params.id);
    await updateCollection('bookmarkedShops', filtered);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
