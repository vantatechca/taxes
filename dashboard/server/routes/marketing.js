const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getCollection, updateCollection } = require('../db');
const { getAutocompleteSuggestions, getPeopleAlsoAsk, getRelatedSearches, getKeywordData, generateBlogTopics, suggestGMBCategories } = require('../utils/keywords');
const { CITIES, CITY_NAMES, generateDomainSuggestions, checkDomainAvailability, batchCheckDomains } = require('../utils/domains');

router.get('/keywords/autocomplete', async (req, res) => {
  try {
    const { q, country } = req.query;
    if (!q) return res.status(400).json({ error: 'q (query) parameter is required' });
    const suggestions = await getAutocompleteSuggestions(q, country || 'ca');
    res.json({ success: true, query: q, country: country || 'ca', count: suggestions.length, suggestions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch autocomplete suggestions', message: err.message });
  }
});

router.get('/keywords/paa', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'q (query) parameter is required' });
    const questions = await getPeopleAlsoAsk(q);
    res.json({ success: true, query: q, count: questions.length, questions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch People Also Ask data', message: err.message });
  }
});

router.get('/keywords/related', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'q (query) parameter is required' });
    const searches = await getRelatedSearches(q);
    res.json({ success: true, query: q, count: searches.length, searches });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch related searches', message: err.message });
  }
});

router.post('/keywords/volume', async (req, res) => {
  try {
    const { keywords, apiKey, location } = req.body;
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) return res.status(400).json({ error: 'keywords array is required' });
    const data = await getKeywordData(keywords, apiKey || null, location || 'Canada');
    res.json({ success: true, count: data.length, hasApiKey: !!apiKey, isEstimated: !apiKey, data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch keyword data', message: err.message });
  }
});

router.post('/keywords/blog-topics', async (req, res) => {
  try {
    const { keyword, niche } = req.body;
    if (!keyword) return res.status(400).json({ error: 'keyword is required' });
    const topics = await generateBlogTopics(keyword, niche || keyword);
    res.json({ success: true, keyword, niche: niche || keyword, count: topics.length, topics });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate blog topics', message: err.message });
  }
});

router.get('/gmb/categories', (req, res) => {
  try {
    const { niche } = req.query;
    if (!niche) return res.status(400).json({ error: 'niche parameter is required' });
    const categories = suggestGMBCategories(niche);
    res.json({ success: true, niche, count: categories.length, categories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to suggest GMB categories', message: err.message });
  }
});

router.post('/domains/suggest', (req, res) => {
  try {
    const { keyword, cities, tlds } = req.body;
    if (!keyword) return res.status(400).json({ error: 'keyword is required' });
    const targetCities = cities && Array.isArray(cities) && cities.length > 0 ? cities : CITIES;
    let suggestions = generateDomainSuggestions(keyword, targetCities);
    if (tlds && Array.isArray(tlds) && tlds.length > 0) suggestions = suggestions.filter((s) => tlds.includes(s.tld));
    res.json({ success: true, keyword, citiesCount: targetCities.length, count: suggestions.length, suggestions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate domain suggestions', message: err.message });
  }
});

router.post('/domains/check', async (req, res) => {
  try {
    const { domains } = req.body;
    if (!domains || !Array.isArray(domains) || domains.length === 0) return res.status(400).json({ error: 'domains array is required' });
    const toCheck = domains.slice(0, 100);
    const results = [];
    for (let i = 0; i < toCheck.length; i += 5) {
      const batch = toCheck.slice(i, i + 5);
      results.push(...await Promise.all(batch.map((d) => checkDomainAvailability(d))));
      if (i + 5 < toCheck.length) await new Promise((r) => setTimeout(r, 100));
    }
    const available = results.filter((r) => r.available === true).length;
    const taken = results.filter((r) => r.available === false).length;
    res.json({ success: true, count: results.length, summary: { available, taken, unknown: results.length - available - taken }, results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check domain availability', message: err.message });
  }
});

router.post('/domains/scan', async (req, res) => {
  try {
    const { keyword, cities, tlds, concurrency } = req.body;
    if (!keyword) return res.status(400).json({ error: 'keyword is required' });
    const targetCities = cities && Array.isArray(cities) && cities.length > 0 ? cities : CITIES;
    const targetTlds = tlds && Array.isArray(tlds) && tlds.length > 0 ? tlds : ['.com', '.ca'];
    const scanResult = await batchCheckDomains(keyword, targetCities, targetTlds, Math.min(concurrency || 5, 10));
    const byCity = {};
    for (const result of scanResult.results) {
      if (!byCity[result.city]) byCity[result.city] = { city: result.city, cityName: result.cityName, domains: [] };
      byCity[result.city].domains.push({ domain: result.domain, tld: result.tld, format: result.format, priority: result.priority, available: result.available });
    }
    res.json({ success: true, keyword: scanResult.keyword, summary: scanResult.summary, byCity: Object.values(byCity), results: scanResult.results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to complete domain scan', message: err.message });
  }
});

router.post('/score', (req, res) => {
  try {
    const { keyword, niche, domainAvailability, keywordVolume, cpc, trendScore, etsyValidation, blogOpportunity, nicheScalability } = req.body;
    if (!keyword) return res.status(400).json({ error: 'keyword is required' });
    const result = calculateMarketingScore({ domainAvailability: domainAvailability || 0, keywordVolume: keywordVolume || 0, cpc: cpc || 0, trendScore: trendScore || 0, etsyValidation: etsyValidation || 0, blogOpportunity: blogOpportunity || 0, nicheScalability: nicheScalability || 0 });
    res.json({ success: true, keyword, niche: niche || keyword, ...result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate marketing score', message: err.message });
  }
});

router.get('/reports', async (req, res) => {
  try {
    let reports = await getCollection('marketingReports');
    const { niche, keyword, minScore } = req.query;
    if (niche) reports = reports.filter((r) => r.niche?.toLowerCase().includes(niche.toLowerCase()));
    if (keyword) reports = reports.filter((r) => r.keyword?.toLowerCase().includes(keyword.toLowerCase()));
    if (minScore) reports = reports.filter((r) => r.data?.score >= parseInt(minScore, 10));
    reports.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.json({ success: true, count: reports.length, reports });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch marketing reports', message: err.message });
  }
});

router.post('/reports', async (req, res) => {
  try {
    const { niche, keyword, data } = req.body;
    if (!keyword) return res.status(400).json({ error: 'keyword is required' });
    const report = { id: `mkt-${crypto.randomBytes(6).toString('hex')}`, niche: niche || keyword, keyword, data: data || {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const reports = await getCollection('marketingReports');
    reports.push(report);
    await updateCollection('marketingReports', reports);
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save marketing report', message: err.message });
  }
});

router.delete('/reports/:id', async (req, res) => {
  try {
    const reports = await getCollection('marketingReports');
    const index = reports.findIndex((r) => r.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Report not found', id: req.params.id });
    const deleted = reports.splice(index, 1)[0];
    await updateCollection('marketingReports', reports);
    res.json({ success: true, deleted });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete marketing report', message: err.message });
  }
});

router.get('/cities', (req, res) => {
  const cityList = CITIES.map((slug) => ({ slug, name: CITY_NAMES[slug] || slug }));
  res.json({ success: true, count: cityList.length, cities: cityList });
});

function calculateMarketingScore({ domainAvailability = 0, keywordVolume = 0, cpc = 0, trendScore = 0, etsyValidation = 0, blogOpportunity = 0, nicheScalability = 0 }) {
  const domainScore = Math.min(100, Math.max(0, domainAvailability));
  let volumeScore = keywordVolume >= 10000 ? 100 : keywordVolume >= 5000 ? 90 : keywordVolume >= 2000 ? 75 : keywordVolume >= 1000 ? 60 : keywordVolume >= 500 ? 45 : keywordVolume >= 200 ? 30 : keywordVolume >= 50 ? 15 : 5;
  let adsScore = 0;
  if (cpc >= 1.00 && cpc <= 2.00) adsScore = 100;
  else if (cpc >= 0.50 && cpc < 1.00) adsScore = 70;
  else if (cpc > 2.00 && cpc <= 3.00) adsScore = 75;
  else if (cpc > 3.00 && cpc <= 5.00) adsScore = 50;
  else if (cpc > 5.00 && cpc <= 8.00) adsScore = 25;
  else if (cpc > 8.00) adsScore = 10;
  else if (cpc >= 0.30 && cpc < 0.50) adsScore = 45;
  else if (cpc > 0 && cpc < 0.30) adsScore = 20;
  const trendNormalized = Math.min(100, Math.max(0, trendScore));
  const etsyScore = Math.min(100, Math.max(0, etsyValidation));
  let blogScore = blogOpportunity >= 30 ? 100 : blogOpportunity >= 20 ? 85 : blogOpportunity >= 10 ? 65 : blogOpportunity >= 5 ? 40 : blogOpportunity >= 1 ? 20 : 0;
  const scalabilityScore = Math.min(100, Math.max(0, nicheScalability));
  const score = Math.min(100, Math.max(0, Math.round((domainScore * 0.20) + (volumeScore * 0.20) + (adsScore * 0.15) + (trendNormalized * 0.15) + (etsyScore * 0.10) + (blogScore * 0.10) + (scalabilityScore * 0.10))));
  const verdict = score >= 85 ? 'LAUNCH' : score >= 70 ? 'TEST' : score >= 50 ? 'RISKY' : 'SKIP';
  const verdictMessages = { LAUNCH: 'Strong across all channels', TEST: 'Worth a single-city test', RISKY: 'Weak in key areas, proceed with caution', SKIP: 'Not viable for this model' };
  return { score, verdict, verdictMessage: verdictMessages[verdict], breakdown: { domainAvailability: { score: domainScore, weight: 0.20 }, keywordVolume: { score: volumeScore, weight: 0.20 }, googleAdsViability: { score: adsScore, weight: 0.15 }, trendStrength: { score: Math.round(trendNormalized), weight: 0.15 }, etsyValidation: { score: etsyScore, weight: 0.10 }, blogOpportunity: { score: blogScore, weight: 0.10 }, nicheScalability: { score: scalabilityScore, weight: 0.10 } } };
}

module.exports = router;
