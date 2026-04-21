import { Router, Request, Response } from 'express';
import { db } from '../lib/db';
import { requireRole } from '../middleware/auth';
import { checkNexusThreshold, US_NEXUS_THRESHOLDS } from '../services/taxCalculator';

export const nexusRouter = Router();

nexusRouter.get('/reference/thresholds', (_req: Request, res: Response) => {
  const states = Object.entries(US_NEXUS_THRESHOLDS).map(([code, t]: [string, any]) => ({
    state_code: code,
    threshold_amount: t.amount === Infinity ? null : t.amount,
    threshold_transactions: t.transactions || null,
    requires_both: t.both || false,
    note: t.amount === Infinity ? 'No sales tax in this state' : null,
  }));
  res.json(states);
});

nexusRouter.get('/', async (req: Request, res: Response) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  try {
    const { rows } = await db.query(
      `SELECT uss.*, c.name as company_name, c.short_code as company_short_code, c.jurisdiction as company_jurisdiction
       FROM us_state_sales uss LEFT JOIN companies c ON uss.company_id = c.id
       WHERE uss.year = $1 ORDER BY uss.percent_of_threshold DESC`,
      [year]
    );
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

nexusRouter.get('/:companyId', async (req: Request, res: Response) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  try {
    const { rows } = await db.query(
      'SELECT * FROM us_state_sales WHERE company_id = $1 AND year = $2',
      [req.params.companyId, year]
    );
    const enriched = rows.map((s: any) => ({
      ...s,
      threshold: US_NEXUS_THRESHOLDS[s.state_code],
      check: checkNexusThreshold(s.state_code, Number(s.total_sales), s.transaction_count),
    }));
    res.json(enriched);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

nexusRouter.post('/', requireRole('admin', 'reviewer'), async (req: Request, res: Response) => {
  const { company_id, state_code, year, total_sales, transaction_count } = req.body;
  const threshold = US_NEXUS_THRESHOLDS[state_code] as any;
  const check = checkNexusThreshold(state_code, total_sales, transaction_count);
  try {
    const { rows } = await db.query(
      `INSERT INTO us_state_sales (company_id, state_code, year, total_sales, transaction_count, nexus_threshold_amount, nexus_threshold_transactions, percent_of_threshold, at_risk, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (company_id, state_code, year) DO UPDATE SET total_sales=$4, transaction_count=$5, percent_of_threshold=$8, at_risk=$9, updated_at=$10
       RETURNING *`,
      [company_id, state_code, year, total_sales, transaction_count,
       threshold?.amount === Infinity ? null : threshold?.amount,
       threshold?.transactions || null, check.percentOfThreshold, check.atRisk, new Date().toISOString()]
    );
    res.json(rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
