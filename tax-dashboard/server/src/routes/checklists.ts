import { Router, Request, Response } from 'express';
import { db } from '../lib/db';
import { requireRole } from '../middleware/auth';
import { validateYear, validateMonth } from '../lib/validation';

export const checklistsRouter = Router();

checklistsRouter.get('/', async (req: Request, res: Response) => {
  const validYear = validateYear(req.query.year);
  const validMonth = validateMonth(req.query.month);
  if (!validYear || !validMonth) { res.status(400).json({ error: 'Invalid year/month parameter' }); return; }
  try {
    const { rows } = await db.query(
      `SELECT mc.*, c.name as company_name, c.short_code as company_short_code, c.jurisdiction as company_jurisdiction
       FROM monthly_checklists mc LEFT JOIN companies c ON mc.company_id = c.id
       WHERE mc.year = $1 AND mc.month = $2 ORDER BY c.short_code`,
      [validYear, validMonth]
    );
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

checklistsRouter.post('/generate', requireRole('admin', 'reviewer'), async (req: Request, res: Response) => {
  const { year, month } = req.body;
  try {
    const { rows: companies } = await db.query('SELECT id FROM companies');
    if (!companies.length) { res.status(400).json({ error: 'No companies found' }); return; }
    for (const c of companies) {
      await db.query(
        `INSERT INTO monthly_checklists (company_id, year, month) VALUES ($1,$2,$3) ON CONFLICT (company_id, year, month) DO NOTHING`,
        [c.id, year, month]
      );
    }
    const { rows } = await db.query(
      `SELECT mc.*, c.name as company_name, c.short_code as company_short_code, c.jurisdiction as company_jurisdiction
       FROM monthly_checklists mc LEFT JOIN companies c ON mc.company_id = c.id
       WHERE mc.year = $1 AND mc.month = $2`,
      [year, month]
    );
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

checklistsRouter.put('/:id', requireRole('admin', 'reviewer'), async (req: Request, res: Response) => {
  const updates = req.body;
  const allItems = ['statements_downloaded','statements_uploaded','transactions_reviewed','tax_report_generated','tax_report_sent','invoices_logged','intercompany_documented','us_sales_logged'];
  const allComplete = allItems.every(key => updates[key] === true || updates[key] === undefined);
  if (allComplete && !updates.completed_at) { updates.completed_at = new Date().toISOString(); updates.completed_by = req.userId; }
  try {
    const setClause = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
    const values = [...Object.values(updates), req.params.id];
    const { rows } = await db.query(
      `UPDATE monthly_checklists SET ${setClause} WHERE id = $${values.length} RETURNING *`,
      values
    );
    res.json(rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
