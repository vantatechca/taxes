const express = require('express');
const router = express.Router();
const { getCollection, updateCollection } = require('../db');

router.get('/rules', async (req, res) => {
  try {
    const rules = await getCollection('goldenRules');
    res.json({ success: true, rules });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/rules', async (req, res) => {
  try {
    const { rules } = req.body;
    if (!rules || !Array.isArray(rules)) return res.status(400).json({ error: 'rules must be an array of strings' });
    const cleanRules = rules.filter((r) => typeof r === 'string' && r.trim().length > 0).map((r) => r.trim());
    if (cleanRules.length === 0) return res.status(400).json({ error: 'At least one valid rule is required' });
    await updateCollection('goldenRules', cleanRules);
    res.json({ success: true, rules: cleanRules });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const history = await getCollection('assistantHistory');
    res.json({ success: true, total: history.length, history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/clear', async (req, res) => {
  try {
    await updateCollection('assistantHistory', []);
    res.json({ success: true, message: 'Conversation history cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
