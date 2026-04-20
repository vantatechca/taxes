const express = require('express');
const router = express.Router();
const { getCollection, updateCollection } = require('../db');
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

router.post('/chat', async (req, res) => {
  try {
    const { messages, rules } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const rulesContext = rules && rules.length > 0
      ? `You are a product research assistant for a digital products empire. Follow these golden rules:\n${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\nHelp the user research digital products, niches, and market opportunities. Write in plain text only — no markdown, no headers, no bold, no bullet symbols like ##, **, or *. Use plain sentences and numbered lists when needed.`
      : 'You are a product research assistant for a digital products empire. Help the user research digital products, niches, and market opportunities. Write in plain text only — no markdown, no headers, no bold, no bullet symbols like ##, **, or *. Use plain sentences and numbered lists when needed.';

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: rulesContext,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const reply = response.content[0].text;

    const history = await getCollection('assistantHistory');
    history.push({
      userMessage: messages[messages.length - 1].content,
      assistantReply: reply,
      timestamp: new Date().toISOString(),
    });
    if (history.length > 100) history.splice(0, history.length - 100);
    await updateCollection('assistantHistory', history);

    res.json({ success: true, reply });
  } catch (err) {
    console.error('[assistant] Chat error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
