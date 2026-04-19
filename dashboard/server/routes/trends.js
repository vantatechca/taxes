const express = require('express');
const router = express.Router();
const { getTrend, getRelatedQueries, getRelatedTopics, compareKeywords, classifyLongevity } = require('../scrapers/trends');
const { getCollection, updateCollection } = require('../db');
const crypto = require('crypto');

router.post('/search', async (req, res) => {
  try {
    const { keyword, geo, timeframe } = req.body;
    if (!keyword) return res.status(400).json({ error: 'keyword is required' });

    const options = {};
    if (geo) options.geo = geo;
    if (timeframe) {
      const match = timeframe.match(/(\d+)([my])/i);
      if (match) {
        const num = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();
        const d = new Date();
        if (unit === 'm') d.setMonth(d.getMonth() - num);
        else if (unit === 'y') d.setFullYear(d.getFullYear() - num);
        options.startTime = d;
      }
    }

    const trendData = await getTrend(keyword, options);

    const results = await getCollection('trendResults');
    results.push({ id: `trend-${crypto.randomBytes(4).toString('hex')}`, ...trendData });
    if (results.length > 500) results.splice(0, results.length - 500);
    await updateCollection('trendResults', results);

    const queries = await getCollection('trendQueries');
    queries.push({ keyword, geo: geo || 'Worldwide', averageScore: trendData.averageScore, direction: trendData.direction, searchedAt: new Date().toISOString() });
    if (queries.length > 200) queries.splice(0, queries.length - 200);
    await updateCollection('trendQueries', queries);

    res.json({ success: true, trend: trendData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/related', async (req, res) => {
  try {
    const { keyword } = req.body;
    if (!keyword) return res.status(400).json({ error: 'keyword is required' });
    const [queries, topics] = await Promise.all([getRelatedQueries(keyword), getRelatedTopics(keyword)]);
    res.json({ success: true, keyword, relatedQueries: queries, relatedTopics: topics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/compare', async (req, res) => {
  try {
    const { keywords } = req.body;
    if (!keywords || !Array.isArray(keywords) || keywords.length < 2) return res.status(400).json({ error: 'keywords array with at least 2 items is required' });
    const comparison = await compareKeywords(keywords);
    res.json({ success: true, comparison });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/longevity', async (req, res) => {
  try {
    const { keyword } = req.body;
    if (!keyword) return res.status(400).json({ error: 'keyword is required' });
    const classification = await classifyLongevity(keyword);
    res.json({ success: true, classification });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/results', async (req, res) => {
  try {
    const results = await getCollection('trendResults');
    const queries = await getCollection('trendQueries');
    res.json({ success: true, totalResults: results.length, totalQueries: queries.length, results, recentQueries: queries.slice(-50) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
