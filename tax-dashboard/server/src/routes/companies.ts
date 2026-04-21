import { Router, Request, Response } from 'express';
import { db } from '../lib/db';
import { requireRole } from '../middleware/auth';
import { validateYear } from '../lib/validation';

export const companiesRouter = Router();

companiesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const { rows } = await db.query('SELECT * FROM companies ORDER BY short_code');
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

companiesRouter.get('/batch-summary', async (req: Request, res: Response) => {
  const year = validateYear(req.query.year) || new Date().getFullYear();
  try {
    const { rows: companies } = await db.query('SELECT * FROM companies ORDER BY short_code');
    const results = [];
    for (const company of companies) {
      const { rows: txns } = await db.query(
        `SELECT amount, type, category, tps_collectable, tvq_collectable, tps_reclaimable, tvq_reclaimable, is_reviewed
         FROM transactions WHERE company_id = $1 AND date >= $2 AND date <= $3`,
        [company.id, `${year}-01-01`, `${year}-12-31`]
      );
      let totalIncome = 0, totalExpenses = 0, tpsCollected = 0, tvqCollected = 0, tpsITC = 0, tvqITR = 0, pendingReview = 0;
      for (const t of txns) {
        if (!t.is_reviewed) pendingReview++;
        if (t.category === 'income_loan_received' || t.category === 'expense_loan_repayment') continue;
        if (t.type === 'credit') totalIncome += Number(t.amount);
        else totalExpenses += Number(t.amount);
        tpsCollected += Number(t.tps_collectable || 0);
        tvqCollected += Number(t.tvq_collectable || 0);
        tpsITC += Number(t.tps_reclaimable || 0);
        tvqITR += Number(t.tvq_reclaimable || 0);
      }
      results.push({
        company_id: company.id, short_code: company.short_code, name: company.name || company.short_code,
        jurisdiction: company.jurisdiction, year,
        totalIncome: Math.round(totalIncome * 100) / 100, totalExpenses: Math.round(totalExpenses * 100) / 100,
        net: Math.round((totalIncome - totalExpenses) * 100) / 100,
        tpsCollected: Math.round(tpsCollected * 100) / 100, tvqCollected: Math.round(tvqCollected * 100) / 100,
        tpsITC: Math.round(tpsITC * 100) / 100, tvqITR: Math.round(tvqITR * 100) / 100,
        tpsNetOwing: Math.round((tpsCollected - tpsITC) * 100) / 100,
        tvqNetOwing: Math.round((tvqCollected - tvqITR) * 100) / 100, pendingReview,
      });
    }
    res.json(results);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

companiesRouter.get('/:id/summary', async (req: Request, res: Response) => {
  const year = validateYear(req.query.year) || new Date().getFullYear();
  try {
    const { rows: txns } = await db.query(
      `SELECT amount, type, category, tps_collectable, tvq_collectable, tps_reclaimable, tvq_reclaimable, is_reviewed
       FROM transactions WHERE company_id = $1 AND date >= $2 AND date <= $3`,
      [req.params.id, `${year}-01-01`, `${year}-12-31`]
    );
    let totalIncome = 0, totalExpenses = 0, tpsCollected = 0, tvqCollected = 0, tpsITC = 0, tvqITR = 0, pendingReview = 0;
    for (const t of txns) {
      if (!t.is_reviewed) pendingReview++;
      if (t.category === 'income_loan_received' || t.category === 'expense_loan_repayment') continue;
      if (t.type === 'credit') totalIncome += Number(t.amount); else totalExpenses += Number(t.amount);
      tpsCollected += Number(t.tps_collectable || 0); tvqCollected += Number(t.tvq_collectable || 0);
      tpsITC += Number(t.tps_reclaimable || 0); tvqITR += Number(t.tvq_reclaimable || 0);
    }
    res.json({ year, totalIncome: Math.round(totalIncome * 100) / 100, totalExpenses: Math.round(totalExpenses * 100) / 100, net: Math.round((totalIncome - totalExpenses) * 100) / 100, tpsCollected: Math.round(tpsCollected * 100) / 100, tvqCollected: Math.round(tvqCollected * 100) / 100, tpsITC: Math.round(tpsITC * 100) / 100, tvqITR: Math.round(tvqITR * 100) / 100, tpsNetOwing: Math.round((tpsCollected - tpsITC) * 100) / 100, tvqNetOwing: Math.round((tvqCollected - tvqITR) * 100) / 100, pendingReview });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

companiesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query('SELECT * FROM companies WHERE id = $1', [req.params.id]);
    if (!rows[0]) { res.status(404).json({ error: 'Company not found' }); return; }
    res.json(rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

companiesRouter.post('/', requireRole('admin'), async (req: Request, res: Response) => {
  const { name, short_code, type, jurisdiction, tax_id_canada, tax_id_us, tps_number, tvq_number, filing_frequency } = req.body;
  if (!short_code || !type || !jurisdiction) { res.status(400).json({ error: 'short_code, type, and jurisdiction are required' }); return; }
  try {
    const { rows } = await db.query(
      `INSERT INTO companies (name, short_code, type, jurisdiction, tax_id_canada, tax_id_us, tps_number, tvq_number, filing_frequency)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name || '', short_code, type, jurisdiction, tax_id_canada, tax_id_us, tps_number, tvq_number, filing_frequency || 'monthly']
    );
    await db.query(`INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)`,
      [req.userId, 'create_company', 'company', rows[0].id, JSON.stringify(req.body)]);
    res.status(201).json(rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

companiesRouter.put('/:id', requireRole('admin'), async (req: Request, res: Response) => {
  const { name, tax_id_canada, tax_id_us, tps_number, tvq_number, filing_frequency } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE companies SET name=$1, tax_id_canada=$2, tax_id_us=$3, tps_number=$4, tvq_number=$5, filing_frequency=$6 WHERE id=$7 RETURNING *`,
      [name, tax_id_canada, tax_id_us, tps_number, tvq_number, filing_frequency, req.params.id]
    );
    await db.query(`INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)`,
      [req.userId, 'update_company', 'company', req.params.id, JSON.stringify(req.body)]);
    res.json(rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

companiesRouter.delete('/:id', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query('SELECT COUNT(*) FROM transactions WHERE company_id = $1', [req.params.id]);
    if (parseInt(rows[0].count) > 0) { res.status(400).json({ error: `Cannot delete: ${rows[0].count} transactions exist.` }); return; }
    await db.query('DELETE FROM companies WHERE id = $1', [req.params.id]);
    await db.query(`INSERT INTO audit_log (user_id, action, entity_type, entity_id) VALUES ($1,$2,$3,$4)`,
      [req.userId, 'delete_company', 'company', req.params.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
