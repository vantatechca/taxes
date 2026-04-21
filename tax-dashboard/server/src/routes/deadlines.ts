import { Router, Request, Response } from 'express';
import { db } from '../lib/db';
import { requireRole } from '../middleware/auth';
import { validateYear } from '../lib/validation';

export const deadlinesRouter = Router();

deadlinesRouter.get('/upcoming', async (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 30;
  const today = new Date().toISOString().slice(0, 10);
  const futureDate = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
  try {
    const { rows } = await db.query(
      `SELECT fd.*, c.name as company_name, c.short_code as company_short_code
       FROM filing_deadlines fd LEFT JOIN companies c ON fd.company_id = c.id
       WHERE fd.due_date >= $1 AND fd.due_date <= $2 AND fd.status != 'paid' ORDER BY fd.due_date`,
      [today, futureDate]
    );
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

deadlinesRouter.get('/overdue', async (_req: Request, res: Response) => {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const { rows } = await db.query(
      `SELECT fd.*, c.name as company_name, c.short_code as company_short_code,
              EXTRACT(DAY FROM NOW() - fd.due_date::timestamptz)::int as days_overdue
       FROM filing_deadlines fd LEFT JOIN companies c ON fd.company_id = c.id
       WHERE fd.due_date < $1 AND fd.status IN ('pending','overdue') ORDER BY fd.due_date`,
      [today]
    );
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

deadlinesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const conditions: string[] = [];
    const params: any[] = [];
    let i = 1;
    if (req.query.company_id) { conditions.push(`fd.company_id = $${i++}`); params.push(req.query.company_id); }
    if (req.query.status) { conditions.push(`fd.status = $${i++}`); params.push(req.query.status); }
    if (req.query.year) {
      const validYear = validateYear(req.query.year);
      if (!validYear) { res.status(400).json({ error: 'Invalid year' }); return; }
      conditions.push(`fd.due_date >= $${i++} AND fd.due_date <= $${i++}`);
      params.push(`${validYear}-01-01`, `${validYear}-12-31`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await db.query(
      `SELECT fd.*, c.name as company_name, c.short_code as company_short_code, c.jurisdiction as company_jurisdiction
       FROM filing_deadlines fd LEFT JOIN companies c ON fd.company_id = c.id ${where} ORDER BY fd.due_date`,
      params
    );
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

deadlinesRouter.post('/', requireRole('admin', 'reviewer'), async (req: Request, res: Response) => {
  const { company_id, filing_type, period_label, due_date, amount_owing, notes } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO filing_deadlines (company_id, filing_type, period_label, due_date, amount_owing, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [company_id, filing_type, period_label, due_date, amount_owing, notes]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

deadlinesRouter.post('/generate-tps-tvq', requireRole('admin'), async (req: Request, res: Response) => {
  const { year } = req.body;
  try {
    const { rows: companies } = await db.query(`SELECT id, name, short_code FROM companies WHERE jurisdiction = 'QC'`);
    if (!companies.length) { res.status(400).json({ error: 'No Quebec companies found' }); return; }
    let generated = 0;
    for (const company of companies) {
      for (let month = 1; month <= 12; month++) {
        const dueMonth = month === 12 ? 1 : month + 1;
        const dueYear = month === 12 ? year + 1 : year;
        const dueDate = new Date(dueYear, dueMonth, 0).toISOString().slice(0, 10);
        const monthName = new Date(year, month - 1).toLocaleString('en', { month: 'long' });
        const status = new Date(dueDate) < new Date() ? 'overdue' : 'pending';
        await db.query(
          `INSERT INTO filing_deadlines (company_id, filing_type, period_label, due_date, status)
           VALUES ($1,$2,$3,$4,$5) ON CONFLICT (company_id, filing_type, period_label) DO NOTHING`,
          [company.id, 'TPS/TVQ', `${monthName} ${year}`, dueDate, status]
        );
        generated++;
      }
    }
    res.json({ generated });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

deadlinesRouter.put('/:id', requireRole('admin', 'reviewer'), async (req: Request, res: Response) => {
  const { status, amount_owing, amount_paid, filed_date, notes } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE filing_deadlines SET status=$1, amount_owing=$2, amount_paid=$3, filed_date=$4, notes=$5 WHERE id=$6 RETURNING *`,
      [status, amount_owing, amount_paid, filed_date, notes, req.params.id]
    );
    res.json(rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

deadlinesRouter.delete('/:id', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    await db.query('DELETE FROM filing_deadlines WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
