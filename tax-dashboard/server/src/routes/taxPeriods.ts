import { Router, Request, Response } from 'express';
import { db } from '../lib/db';
import { requireRole } from '../middleware/auth';
import { calculateNetTax } from '../services/taxCalculator';
import { validateYear } from '../lib/validation';

export const taxPeriodsRouter = Router();

taxPeriodsRouter.get('/unfiled', async (_req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { rows } = await db.query(
      `SELECT tp.*, c.name as company_name, c.short_code as company_short_code
       FROM tax_periods tp LEFT JOIN companies c ON tp.company_id = c.id
       WHERE tp.status = 'draft' AND tp.period_end < $1 ORDER BY tp.period_start`,
      [today]
    );
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

taxPeriodsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const conditions: string[] = [];
    const params: any[] = [];
    let i = 1;
    if (req.query.company_id) { conditions.push(`tp.company_id = $${i++}`); params.push(req.query.company_id); }
    if (req.query.status) { conditions.push(`tp.status = $${i++}`); params.push(req.query.status); }
    if (req.query.year) {
      const validYear = validateYear(req.query.year);
      if (!validYear) { res.status(400).json({ error: 'Invalid year' }); return; }
      conditions.push(`tp.period_start >= $${i++} AND tp.period_end <= $${i++}`);
      params.push(`${validYear}-01-01`, `${validYear}-12-31`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await db.query(
      `SELECT tp.*, c.name as company_name, c.short_code as company_short_code, c.jurisdiction as company_jurisdiction
       FROM tax_periods tp LEFT JOIN companies c ON tp.company_id = c.id ${where} ORDER BY tp.period_start DESC`,
      params
    );
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

taxPeriodsRouter.post('/generate', requireRole('admin', 'reviewer'), async (req: Request, res: Response) => {
  const { company_id, period_start, period_end } = req.body;
  try {
    const { rows: companyRows } = await db.query('SELECT jurisdiction FROM companies WHERE id = $1', [company_id]);
    const company = companyRows[0];
    if (!company || company.jurisdiction !== 'QC') { res.status(400).json({ error: 'TPS/TVQ periods only apply to Quebec companies' }); return; }
    const { rows: txns } = await db.query(
      `SELECT type, amount, category, tps_collectable, tvq_collectable, tps_reclaimable, tvq_reclaimable
       FROM transactions WHERE company_id = $1 AND is_reviewed = true AND date >= $2 AND date <= $3`,
      [company_id, period_start, period_end]
    );
    let tpsCollected = 0, tvqCollected = 0, tpsITC = 0, tvqITR = 0;
    for (const t of txns) {
      tpsCollected += Number(t.tps_collectable || 0); tvqCollected += Number(t.tvq_collectable || 0);
      tpsITC += Number(t.tps_reclaimable || 0); tvqITR += Number(t.tvq_reclaimable || 0);
    }
    const { tpsNetOwing, tvqNetOwing } = calculateNetTax(tpsCollected, tvqCollected, tpsITC, tvqITR);
    const { rows } = await db.query(
      `INSERT INTO tax_periods (company_id, period_type, period_start, period_end, jurisdiction, tps_collected, tvq_collected, tps_itc, tvq_itr, tps_net_owing, tvq_net_owing, status)
       VALUES ($1,'monthly',$2,$3,'QC',$4,$5,$6,$7,$8,$9,'draft')
       ON CONFLICT (company_id, period_start, period_end) DO UPDATE SET
       tps_collected=$4, tvq_collected=$5, tps_itc=$6, tvq_itr=$7, tps_net_owing=$8, tvq_net_owing=$9
       RETURNING *`,
      [company_id, period_start, period_end, Math.round(tpsCollected * 100) / 100, Math.round(tvqCollected * 100) / 100, Math.round(tpsITC * 100) / 100, Math.round(tvqITR * 100) / 100, tpsNetOwing, tvqNetOwing]
    );
    res.json(rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

taxPeriodsRouter.put('/:id/file', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query(
      `UPDATE tax_periods SET status='filed', filed_at=$1 WHERE id=$2 RETURNING *`,
      [new Date().toISOString(), req.params.id]
    );
    await db.query(`INSERT INTO audit_log (user_id, action, entity_type, entity_id) VALUES ($1,$2,$3,$4)`,
      [req.userId, 'file_tax_period', 'tax_period', req.params.id]);
    res.json(rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

taxPeriodsRouter.put('/:id/paid', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query(`UPDATE tax_periods SET status='paid' WHERE id=$1 RETURNING *`, [req.params.id]);
    res.json(rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
