import { Router, Request, Response } from 'express';
import { db } from '../lib/db';
import { anthropic, CLAUDE_MODEL } from '../lib/anthropic';

export const advisorRouter = Router();

const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW = 60 * 60 * 1000;

const SYSTEM_PROMPT = `You are an expert tax advisor with deep knowledge of:
- Canadian federal tax law (Income Tax Act)
- Quebec provincial tax law (Revenu Québec, TPS/TVQ)
- US federal tax law (IRS)
- US state tax law for Wyoming, Delaware, and New York
- E-commerce tax obligations
- Subcontractor vs employee distinctions under CRA rules
- Input tax credits (ITC) and input tax refunds (ITR) optimization

The user operates 7 companies: 4 in Quebec (Canada), 1 in Wyoming, 1 in Delaware, 1 in New York.
All companies run e-commerce (Shopify stores). All workers are subcontractors. Fiscal year ends December 31.

Provide specific, actionable advice. Flag risks and obligations.
End responses with: "⚠️ This is AI-generated tax information. Always confirm with your fiscaliste or CPA before acting."`;

advisorRouter.post('/ask', async (req: Request, res: Response) => {
  const { question, company_id, context } = req.body;
  if (!question) { res.status(400).json({ error: 'Question is required' }); return; }
  const userId = req.userId || 'anonymous';
  const now = Date.now();
  const userLimit = rateLimits.get(userId);
  if (userLimit && now < userLimit.resetAt) {
    if (userLimit.count >= RATE_LIMIT) { res.status(429).json({ error: 'Rate limit exceeded.' }); return; }
    userLimit.count++;
  } else { rateLimits.set(userId, { count: 1, resetAt: now + RATE_WINDOW }); }
  try {
    let userMessage = question;
    if (context) userMessage = `Context: ${JSON.stringify(context)}\n\nQuestion: ${question}`;
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL, max_tokens: 2000, system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });
    const answer = (response.content[0] as any).text;
    await db.query(
      `INSERT INTO ai_advisory_log (user_id, company_id, question, response) VALUES ($1,$2,$3,$4)`,
      [req.userId, company_id || null, question, answer]
    );
    res.json({ answer });
  } catch (err: any) { res.status(500).json({ error: 'Failed to get AI response' }); }
});

advisorRouter.get('/history', async (req: Request, res: Response) => {
  try {
    const conditions = req.query.company_id ? 'WHERE al.company_id = $1' : '';
    const params = req.query.company_id ? [req.query.company_id] : [];
    const { rows } = await db.query(
      `SELECT al.*, c.name as company_name, c.short_code as company_short_code
       FROM ai_advisory_log al LEFT JOIN companies c ON al.company_id = c.id
       ${conditions} ORDER BY al.created_at DESC LIMIT 50`,
      params
    );
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

advisorRouter.get('/quick-prompts', (_req: Request, res: Response) => {
  res.json([
    { label: 'Revenue allocation strategy', prompt: 'Should I move more revenue to my Wyoming company to reduce tax burden?' },
    { label: 'Deductions this month', prompt: 'What can I deduct as a business expense this month?' },
    { label: 'TPS/TVQ refund eligibility', prompt: 'Am I eligible for a TPS/TVQ refund this quarter?' },
    { label: 'Intercompany transfer risks', prompt: 'What are the risks of my intercompany transfers?' },
    { label: 'Delaware franchise tax', prompt: 'Explain the Delaware franchise tax for my situation' },
    { label: 'T4A obligations', prompt: 'When do I need to issue T4A slips for subcontractors?' },
    { label: 'US nexus status', prompt: 'Am I approaching economic nexus in any US states?' },
    { label: 'Year-end planning', prompt: 'What year-end tax planning strategies should I consider?' },
  ]);
});
