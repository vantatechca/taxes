const express = require('express');
const router = express.Router();
const { createSchedule, removeSchedule, pauseSchedule, resumeSchedule, getSchedules, estimateCost, runNow } = require('../utils/scheduler');
const { searchEtsy } = require('../scrapers/etsy');
const { getTrend, getRelatedQueries } = require('../scrapers/trends');
const { getCollection, updateCollection } = require('../db');
const crypto = require('crypto');

function buildTaskFn(type, config) {
  switch (type) {
    case 'etsy':
      return async () => {
        const queries = config.queries || [];
        const pages = config.pages || 1;
        for (const query of queries) {
          const results = await searchEtsy(query, { pages });
          const existing = await getCollection('etsyProducts');
          const existingIds = new Set(existing.map((p) => p.listingId));
          const newProducts = results.filter((p) => p.listingId && !existingIds.has(p.listingId));
          await updateCollection('etsyProducts', [...existing, ...newProducts]);
          console.log(`[schedule] Etsy "${query}": ${results.length} found, ${newProducts.length} new`);
        }
      };

    case 'trends':
      return async () => {
        const queries = config.queries || [];
        for (const keyword of queries) {
          const trendData = await getTrend(keyword, { geo: config.geo || '' });
          const related = await getRelatedQueries(keyword);
          const results = await getCollection('trendResults');
          results.push({ id: `trend-${crypto.randomBytes(4).toString('hex')}`, ...trendData, relatedQueries: related });
          if (results.length > 500) results.splice(0, results.length - 500);
          await updateCollection('trendResults', results);
        }
      };

    case 'plr':
      return async () => {
        const scanHistory = await getCollection('scanHistory');
        scanHistory.push({
          id: `scan-${crypto.randomBytes(4).toString('hex')}`,
          type: 'plr-check',
          message: 'Scheduled PLR source review reminder',
          sources: config.sources || [],
          timestamp: new Date().toISOString(),
        });
        await updateCollection('scanHistory', scanHistory);
      };

    default:
      return async () => { console.log(`[schedule] Unknown task type: ${type}`); };
  }
}

router.get('/', (req, res) => {
  try {
    const schedules = getSchedules();
    res.json({ success: true, total: schedules.length, schedules });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, type, config, cronExpression } = req.body;
    if (!name || !cronExpression) return res.status(400).json({ error: 'name and cronExpression are required' });
    const id = `sched-${crypto.randomBytes(4).toString('hex')}`;
    const taskFn = buildTaskFn(type || 'custom', config || {});
    const schedule = createSchedule(id, name, cronExpression, taskFn, { type, config });
    res.json({ success: true, schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { name, type, config, cronExpression } = req.body;
    removeSchedule(req.params.id);
    const taskFn = buildTaskFn(type || 'custom', config || {});
    const schedule = createSchedule(req.params.id, name || req.params.id, cronExpression || '0 0 * * *', taskFn, { type, config });
    res.json({ success: true, schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    removeSchedule(req.params.id);
    res.json({ success: true, message: 'Schedule deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/pause', (req, res) => {
  try {
    const paused = pauseSchedule(req.params.id);
    if (!paused) return res.status(404).json({ error: 'Schedule not found or not active' });
    res.json({ success: true, message: 'Schedule paused' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/resume', (req, res) => {
  try {
    const resumed = resumeSchedule(req.params.id);
    if (!resumed) return res.status(404).json({ error: 'Schedule not found or not paused' });
    res.json({ success: true, message: 'Schedule resumed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/run-now', async (req, res) => {
  try {
    await runNow(req.params.id);
    res.json({ success: true, message: 'Schedule triggered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/cost', (req, res) => {
  try {
    const schedules = getSchedules();
    const activeSchedules = schedules.filter((s) => s.status === 'active');
    let totalDailyRequests = 0;
    const breakdown = activeSchedules.map((s) => {
      const cost = estimateCost(s);
      totalDailyRequests += cost.runsPerDay * cost.requestsPerRun;
      return { id: s.id, name: s.name, ...cost };
    });
    res.json({ success: true, activeSchedules: activeSchedules.length, totalDailyRequests, totalDailyCost: `~$${(totalDailyRequests * 0.001).toFixed(3)}/day`, breakdown });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
