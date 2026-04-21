const express = require('express');
const router = express.Router();
const { getCollection, updateCollection } = require('../db');
const crypto = require('crypto');

const DEFAULT_FINANCIAL_CONFIG = {
  shopify_per_store: 39,
  domain_per_store_monthly: 1.5,
  apps_total: 1200,
  team_salaries: 85000,
  misc: 500,
  ad_spend: 0,
  payment_processing_rate: 0.029,
  payment_processing_fixed: 0.30,
  team_size: 42,
};

// ─── STORES ───────────────────────────────────────────────

router.get('/stores', async (req, res) => {
  try {
    const stores = await getCollection('stores');
    res.json({ success: true, stores });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/stores', async (req, res) => {
  try {
    const store = req.body;
    if (!store.store_id) return res.status(400).json({ error: 'store_id is required' });
    const stores = await getCollection('stores');
    stores.push(store);
    await updateCollection('stores', stores);
    res.json({ success: true, store });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/stores/seed', async (req, res) => {
  try {
    const { stores } = req.body;
    if (!stores || !Array.isArray(stores)) return res.status(400).json({ error: 'stores array is required' });
    const existing = await getCollection('stores');
    if (existing.length > 0) return res.json({ success: true, message: 'Already seeded', count: existing.length });
    await updateCollection('stores', stores);
    res.json({ success: true, message: `Seeded ${stores.length} stores` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/stores/:id', async (req, res) => {
  try {
    const stores = await getCollection('stores');
    const idx = stores.findIndex((s) => s.store_id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Store not found' });
    stores[idx] = { ...stores[idx], ...req.body };
    await updateCollection('stores', stores);
    res.json({ success: true, store: stores[idx] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/stores/bulk-update', async (req, res) => {
  try {
    const { ids, changes } = req.body;
    if (!ids || !changes) return res.status(400).json({ error: 'ids and changes are required' });
    const stores = await getCollection('stores');
    const idSet = new Set(ids);
    stores.forEach((s, i) => { if (idSet.has(s.store_id)) stores[i] = { ...s, ...changes }; });
    await updateCollection('stores', stores);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/stores/:id', async (req, res) => {
  try {
    const stores = await getCollection('stores');
    const filtered = stores.filter((s) => s.store_id !== req.params.id);
    await updateCollection('stores', filtered);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CONTENT LOGS ─────────────────────────────────────────

router.get('/content', async (req, res) => {
  try {
    const logs = await getCollection('content_logs');
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/content', async (req, res) => {
  try {
    const entry = { ...req.body, id: Date.now(), logged_at: new Date().toISOString() };
    const logs = await getCollection('content_logs');
    logs.unshift(entry);
    await updateCollection('content_logs', logs);
    res.json({ success: true, entry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/content/:id', async (req, res) => {
  try {
    const logs = await getCollection('content_logs');
    await updateCollection('content_logs', logs.filter((l) => String(l.id) !== req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CS TICKETS ───────────────────────────────────────────

router.get('/tickets', async (req, res) => {
  try {
    const tickets = await getCollection('cs_tickets');
    res.json({ success: true, tickets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tickets', async (req, res) => {
  try {
    const ticket = { ...req.body, id: Date.now(), created_at: new Date().toISOString(), status: 'open' };
    const tickets = await getCollection('cs_tickets');
    tickets.unshift(ticket);
    await updateCollection('cs_tickets', tickets);
    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/tickets/:id', async (req, res) => {
  try {
    const tickets = await getCollection('cs_tickets');
    const idx = tickets.findIndex((t) => String(t.id) === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Ticket not found' });
    tickets[idx] = { ...tickets[idx], ...req.body };
    await updateCollection('cs_tickets', tickets);
    res.json({ success: true, ticket: tickets[idx] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── FINANCIAL CONFIG ─────────────────────────────────────

router.get('/financial', async (req, res) => {
  try {
    const config = await getCollection('financial_config');
    res.json({ success: true, config: Array.isArray(config) && config.length === 0 ? DEFAULT_FINANCIAL_CONFIG : config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/financial', async (req, res) => {
  try {
    await updateCollection('financial_config', req.body);
    res.json({ success: true, config: req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── STORE CHECKLISTS ─────────────────────────────────────

router.get('/checklists', async (req, res) => {
  try {
    const checklists = await getCollection('store_checklists');
    res.json({ success: true, checklists: Array.isArray(checklists) ? {} : checklists });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/checklists/:storeId', async (req, res) => {
  try {
    let checklists = await getCollection('store_checklists');
    if (Array.isArray(checklists)) checklists = {};
    checklists[req.params.storeId] = { ...(checklists[req.params.storeId] || {}), ...req.body };
    await updateCollection('store_checklists', checklists);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── STORE NOTES ──────────────────────────────────────────

router.get('/notes', async (req, res) => {
  try {
    const notes = await getCollection('store_notes');
    res.json({ success: true, notes: Array.isArray(notes) ? {} : notes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/notes/:storeId', async (req, res) => {
  try {
    let notes = await getCollection('store_notes');
    if (Array.isArray(notes)) notes = {};
    if (!notes[req.params.storeId]) notes[req.params.storeId] = [];
    notes[req.params.storeId].push({ text: req.body.text, date: new Date().toISOString() });
    await updateCollection('store_notes', notes);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
