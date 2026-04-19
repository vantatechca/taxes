const express = require('express');
const router = express.Router();
const { loadProxies, addProxies, removeProxy, testProxy } = require('../utils/proxy');

router.get('/', async (req, res) => {
  try {
    const proxies = await loadProxies();
    const total = proxies.length;
    const working = proxies.filter((p) => p.working === true).length;
    const failed = proxies.filter((p) => p.fail_count > 5).length;
    const untested = proxies.filter((p) => p.working === null).length;
    res.json({ success: true, total, working, failed, untested, proxies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { proxies } = req.body;
    if (!proxies) return res.status(400).json({ error: 'proxies string is required (newline-separated)' });

    const list = proxies.split(/[\n\r]+/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (list.length === 0) return res.status(400).json({ error: 'No valid proxy lines found' });

    const result = await addProxies(list);
    res.json({ success: true, message: `Added ${result.added} new proxies (${result.total} total)`, added: result.added, total: result.total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const removed = await removeProxy(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Proxy not found' });
    res.json({ success: true, message: 'Proxy removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/test/:id', async (req, res) => {
  try {
    const proxies = await loadProxies();
    const proxy = proxies.find((p) => p.id === req.params.id);
    if (!proxy) return res.status(404).json({ error: 'Proxy not found' });
    const result = await testProxy(proxy.url);
    res.json({ success: true, proxyId: req.params.id, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/test-all', async (req, res) => {
  try {
    const proxies = await loadProxies();
    if (proxies.length === 0) return res.json({ success: true, message: 'No proxies to test', results: [] });

    const batchSize = 10;
    const results = [];

    for (let i = 0; i < proxies.length; i += batchSize) {
      const batch = proxies.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(async (p) => ({ proxyId: p.id, url: p.url, ...await testProxy(p.url) }))
      );
      for (const r of batchResults) {
        results.push(r.status === 'fulfilled' ? r.value : { working: false, error: r.reason?.message || 'Unknown error' });
      }
    }

    const working = results.filter((r) => r.working).length;
    res.json({ success: true, total: results.length, working, failed: results.length - working, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
