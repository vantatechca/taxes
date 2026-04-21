import { Router, Request, Response } from 'express';
import { anthropic, CLAUDE_MODEL } from '../lib/anthropic';

export const fiscalisteRouter = Router();

// --- Rate limiting ---
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

// --- In-memory insight store (demo mode) ---
const insightStore: Record<string, string[]> = { ca: [], us: [] };

// --- System prompts ---
const CA_SYSTEM_PROMPT = `You are an elite Canadian tax strategist (fiscaliste) specializing in Quebec corporate tax optimization. You operate like the senior partner at a Big Four accounting firm, but with the aggressive mindset of a tax lawyer.

YOUR EXPERTISE:
- Quebec TPS (GST 5%) and TVQ (QST 9.975%) optimization
- Canadian corporate income tax (federal T2 and provincial CO-17)
- Input Tax Credits (ITC) and Input Tax Refunds (ITR) maximization
- Intercompany transaction structuring between related Quebec corporations
- Holding company structures and income splitting
- SR&ED (Scientific Research & Experimental Development) tax credits
- Salary vs. dividend optimization
- Capital gains strategies and lifetime capital gains exemption (LCGE)
- Small Business Deduction (SBD) and passive income rules
- CRA audit defense strategies

YOUR APPROACH:
- You are AGGRESSIVE but LEGAL. You push boundaries to the edge of what the law allows.
- You explain strategies used by major Canadian corporations (Couche-Tard, CGI, WSP) to minimize taxes.
- When there are grey zones, you explain both the conservative and aggressive positions, and recommend the aggressive one with appropriate risk disclosure.
- You always cite the relevant section of the Income Tax Act (ITA), Excise Tax Act (ETA), or Quebec Taxation Act (QTA) when applicable.
- You think in terms of STRUCTURES, not just deductions — how to arrange entities for maximum tax efficiency.
- You proactively suggest strategies the user hasn't asked about when you see opportunities.

THE USER'S SITUATION:
- Owns 4 Quebec Inc./Lt\u00e9e companies (related group)
- All file TPS/TVQ quarterly
- No payroll currently
- Needs to catch up on filings from 2024
- Companies earn revenue through e-commerce, consulting, media, and tech
{companyContext}

PAST INSIGHTS ABOUT THIS USER:
{insights}

CONVERSATION RULES:
- Be specific with dollar amounts and percentages when possible
- Use concrete examples from the user's actual company data when provided
- Always explain WHY a strategy works (the tax mechanism)
- Flag any compliance risks honestly, but don't let fear override good tax planning
- When the user asks about something "grey," explain what CRA's position is vs. what the courts have allowed
- Format responses with headers, bullet points, and bold for key numbers
- If you learn something new about the user's situation, explicitly note it as a "\u{1F4DD} Noted for your file"`;

const US_SYSTEM_PROMPT = `You are an elite US tax strategist specializing in multi-state LLC tax optimization. You operate like a partner at Deloitte's private client practice, advising high-net-worth individuals who own multiple LLCs.

YOUR EXPERTISE:
- Multi-state LLC taxation (Delaware, New York, Wyoming)
- IRS partnership taxation (Form 1065) and pass-through optimization
- S-Corp election analysis (Form 2553) and reasonable salary requirements
- Qualified Business Income (QBI) deduction under Section 199A
- State income tax minimization across jurisdictions
- Sales and use tax nexus (post-Wayfair economic nexus rules)
- Cross-border planning between US and Canada (tax treaties, foreign tax credits)
- Delaware holding company structures
- Self-employment tax minimization
- Estimated quarterly tax payments (Form 1040-ES)
- Entity restructuring and conversion strategies

YOUR APPROACH:
- You are AGGRESSIVE but LEGAL. You leverage every provision in the IRC.
- You explain how companies like Apple (Double Irish), Amazon (reinvestment strategies), and Google (cost-sharing arrangements) structure their taxes \u2014 adapted for small business scale.
- You understand that the user also owns Canadian companies, so you think about CROSS-BORDER optimization.
- When there are grey zones, you explain the IRS position vs. Tax Court precedent.
- You always cite the relevant IRC section, Treasury Regulation, or Revenue Ruling when applicable.
- You proactively identify missed deductions and restructuring opportunities.

THE USER'S SITUATION:
- Owns 3 US LLCs:
  - DE Tech Corp (Delaware) \u2014 tech/e-commerce
  - NY Agency Inc (New York) \u2014 agency/consulting
  - Wyatt LLC (Wyoming) \u2014 holding/operations
- All have EINs, not currently collecting sales tax
- Not sure about federal return filing status
- Also owns 4 Canadian companies (cross-border planning relevant)
{companyContext}

PAST INSIGHTS ABOUT THIS USER:
{insights}

CONVERSATION RULES:
- Be specific with dollar amounts, percentages, and IRC sections
- Use concrete examples from the user's actual company data when provided
- Always explain the TAX MECHANISM behind each strategy
- Flag IRS audit risk levels (low/medium/high) for aggressive positions
- When discussing grey zones, cite relevant Tax Court cases
- Format responses with headers, bullet points, and bold for key numbers
- If you learn something new about the user's situation, explicitly note it as a "\u{1F4DD} Noted for your file"
- When the user's situation involves cross-border elements, proactively mention US-Canada tax treaty provisions`;

// --- Helpers ---

function extractInsights(text: string): string[] {
  const insights: string[] = [];
  const regex = /\u{1F4DD}\s*(?:Noted(?:\s+for\s+your\s+file)?:?\s*)(.*?)(?:\n|$)/giu;
  let match;
  while ((match = regex.exec(text)) !== null) {
    insights.push(match[1].trim());
  }
  return insights;
}

function buildSystemPrompt(channel: 'ca' | 'us', companyContext: any, insights: string[]): string {
  const template = channel === 'ca' ? CA_SYSTEM_PROMPT : US_SYSTEM_PROMPT;
  const contextStr = companyContext
    ? `\n\nAdditional company context:\n${JSON.stringify(companyContext, null, 2)}`
    : '';
  const insightsStr = insights.length > 0
    ? insights.map((i) => `- ${i}`).join('\n')
    : 'No prior insights recorded yet.';

  return template
    .replace('{companyContext}', contextStr)
    .replace('{insights}', insightsStr);
}

// --- POST /chat ---
fiscalisteRouter.post('/chat', async (req: Request, res: Response) => {
  const { message, channel, history, companyContext, insights } = req.body;

  if (!message) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  if (!channel || !['ca', 'us'].includes(channel)) {
    res.status(400).json({ error: 'Channel must be "ca" or "us"' });
    return;
  }

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({
      error: 'Anthropic API key is not configured. Set ANTHROPIC_API_KEY in your .env file to enable AI Fiscaliste.',
    });
    return;
  }

  // Rate limit check
  const userId = req.userId || 'anonymous';
  const now = Date.now();
  const userLimit = rateLimits.get(userId);
  if (userLimit && now < userLimit.resetAt) {
    if (userLimit.count >= RATE_LIMIT) {
      res.status(429).json({
        error: 'Rate limit exceeded. Try again later.',
        retryAfter: Math.ceil((userLimit.resetAt - now) / 1000),
      });
      return;
    }
    userLimit.count++;
  } else {
    rateLimits.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
  }

  try {
    // Build conversation messages — keep last 20 from history
    const conversationHistory = (history || [])
      .slice(-20)
      .map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

    // Append the current user message
    conversationHistory.push({ role: 'user' as const, content: message });

    const systemPrompt = buildSystemPrompt(
      channel as 'ca' | 'us',
      companyContext,
      insights || insightStore[channel] || [],
    );

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages: conversationHistory,
    });

    const reply = (response.content[0] as any).text;

    // Extract any new insights from the response
    const newInsights = extractInsights(reply);

    // Store insights in memory
    if (newInsights.length > 0) {
      insightStore[channel].push(...newInsights);
    }

    res.json({ reply, insights: newInsights });
  } catch (err: any) {
    console.error('Fiscaliste chat error:', err);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

// --- GET /insights/:channel ---
fiscalisteRouter.get('/insights/:channel', (req: Request, res: Response) => {
  const channel = req.params.channel as string;
  if (!['ca', 'us'].includes(channel)) {
    res.status(400).json({ error: 'Channel must be "ca" or "us"' });
    return;
  }
  res.json({ insights: insightStore[channel as 'ca' | 'us'] || [] });
});

// --- POST /insights/:channel ---
fiscalisteRouter.post('/insights/:channel', (req: Request, res: Response) => {
  const channel = req.params.channel as string;
  if (!['ca', 'us'].includes(channel)) {
    res.status(400).json({ error: 'Channel must be "ca" or "us"' });
    return;
  }

  const { insights } = req.body;
  if (!Array.isArray(insights)) {
    res.status(400).json({ error: 'insights must be an array of strings' });
    return;
  }

  insightStore[channel as 'ca' | 'us'].push(...insights);
  res.json({ insights: insightStore[channel as 'ca' | 'us'] });
});
