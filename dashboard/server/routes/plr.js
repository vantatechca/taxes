const express = require('express');
const router = express.Router();
const { getCollection, updateCollection } = require('../db');
const crypto = require('crypto');

router.get('/sources', async (req, res) => {
  try {
    const sources = await getCollection('plrSources');
    res.json({ success: true, total: sources.length, sources });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sources', async (req, res) => {
  try {
    const { name, url, type, categories, notes } = req.body;
    if (!name || !url) return res.status(400).json({ error: 'name and url are required' });

    const sources = await getCollection('plrSources');
    const newSource = {
      id: `plr-${crypto.randomBytes(4).toString('hex')}`,
      name, url,
      type: type || 'marketplace',
      categories: categories || [],
      notes: notes || '',
      addedAt: new Date().toISOString(),
    };
    sources.push(newSource);
    await updateCollection('plrSources', sources);
    res.json({ success: true, source: newSource });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/sources/:id', async (req, res) => {
  try {
    const sources = await getCollection('plrSources');
    const idx = sources.findIndex((s) => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Source not found' });

    const { name, url, type, categories, notes } = req.body;
    if (name !== undefined) sources[idx].name = name;
    if (url !== undefined) sources[idx].url = url;
    if (type !== undefined) sources[idx].type = type;
    if (categories !== undefined) sources[idx].categories = categories;
    if (notes !== undefined) sources[idx].notes = notes;
    sources[idx].updatedAt = new Date().toISOString();
    await updateCollection('plrSources', sources);
    res.json({ success: true, source: sources[idx] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/sources/:id', async (req, res) => {
  try {
    const sources = await getCollection('plrSources');
    const filtered = sources.filter((s) => s.id !== req.params.id);
    if (filtered.length === sources.length) return res.status(404).json({ error: 'Source not found' });
    await updateCollection('plrSources', filtered);
    res.json({ success: true, message: 'Source deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/products', async (req, res) => {
  try {
    const products = await getCollection('plrProducts');
    res.json({ success: true, total: products.length, products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products', async (req, res) => {
  try {
    const { name, source, price, category, url, notes, purchasedAt, resalePrice } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const products = await getCollection('plrProducts');
    const newProduct = {
      id: `plr-prod-${crypto.randomBytes(4).toString('hex')}`,
      name, source: source || '', price: parseFloat(price) || 0,
      category: category || '', url: url || '', notes: notes || '',
      purchasedAt: purchasedAt || null,
      resalePrice: parseFloat(resalePrice) || 0,
      profit: (parseFloat(resalePrice) || 0) - (parseFloat(price) || 0),
      addedAt: new Date().toISOString(),
    };
    products.push(newProduct);
    await updateCollection('plrProducts', products);
    res.json({ success: true, product: newProduct });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const products = await getCollection('plrProducts');
    const idx = products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });

    const { name, source, price, category, url, notes, purchasedAt, resalePrice } = req.body;
    if (name !== undefined) products[idx].name = name;
    if (source !== undefined) products[idx].source = source;
    if (price !== undefined) products[idx].price = parseFloat(price) || 0;
    if (category !== undefined) products[idx].category = category;
    if (url !== undefined) products[idx].url = url;
    if (notes !== undefined) products[idx].notes = notes;
    if (purchasedAt !== undefined) products[idx].purchasedAt = purchasedAt;
    if (resalePrice !== undefined) products[idx].resalePrice = parseFloat(resalePrice) || 0;
    products[idx].profit = (products[idx].resalePrice || 0) - (products[idx].price || 0);
    products[idx].updatedAt = new Date().toISOString();
    await updateCollection('plrProducts', products);
    res.json({ success: true, product: products[idx] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const products = await getCollection('plrProducts');
    const filtered = products.filter((p) => p.id !== req.params.id);
    if (filtered.length === products.length) return res.status(404).json({ error: 'Product not found' });
    await updateCollection('plrProducts', filtered);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
