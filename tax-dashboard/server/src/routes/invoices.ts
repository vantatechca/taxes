import { Router, Request, Response } from 'express';
import { db } from '../lib/db';
import { requireRole } from '../middleware/auth';

export const invoicesRouter = Router();

invoicesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const conditions: string[] = [];
    const params: any[] = [];
    let i = 1;
    if (req.query.company_id) { conditions.push(`inv.company_id = $${i++}`); params.push(req.query.company_id); }
    if (req.query.vendor_name) { conditions.push(`inv.vendor_name ILIKE $${i++}`); params.push(`%${req.query.vendor_name}%`); }
    if (req.query.status) { conditions.push(`inv.status = $${i++}`); params.push(req.query.status); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await db.query(
      `SELECT inv.*, c.name as company_name, c.short_code as company_short_code
       FROM invoices inv LEFT JOIN companies c ON inv.company_id = c.id ${where} ORDER BY inv.invoice_date DESC`,
      params
    );
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

invoicesRouter.get('/vendor-totals', async (req: Request, res: Response) => {
  const year = req.query.year || new Date().getFullYear();
  try {
    const { rows } = await db.query(
      `SELECT inv.company_id, inv.vendor_name, inv.amount, inv.currency, inv.invoice_date,
              c.name as company_name, c.short_code as company_short_code
       FROM invoices inv LEFT JOIN companies c ON inv.company_id = c.id
       WHERE inv.status = 'paid' AND inv.invoice_date >= $1 AND inv.invoice_date <= $2`,
      [`${year}-01-01`, `${year}-12-31`]
    );
    const totals: Record<string, any> = {};
    for (const inv of rows) {
      const key = `${inv.company_id}_${inv.vendor_name}`;
      if (!totals[key]) totals[key] = { vendor: inv.vendor_name, company_id: inv.company_id, company_name: inv.company_name || inv.company_short_code || '', total_cad: 0, total_usd: 0, count: 0, t4a_required: false };
      if (inv.currency === 'CAD') totals[key].total_cad += Number(inv.amount);
      else totals[key].total_usd += Number(inv.amount);
      totals[key].count++;
      if (totals[key].total_cad > 500) totals[key].t4a_required = true;
    }
    res.json(Object.values(totals));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

invoicesRouter.post('/', requireRole('admin', 'reviewer'), async (req: Request, res: Response) => {
  const { company_id, vendor_name, amount, currency, invoice_date, category, notes } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO invoices (company_id, vendor_name, amount, currency, invoice_date, category, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [company_id, vendor_name, amount, currency, invoice_date, category, notes]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

invoicesRouter.put('/:id', requireRole('admin', 'reviewer'), async (req: Request, res: Response) => {
  const { vendor_name, amount, currency, invoice_date, date_paid, category, status, notes } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE invoices SET vendor_name=$1, amount=$2, currency=$3, invoice_date=$4, date_paid=$5, category=$6, status=$7, notes=$8 WHERE id=$9 RETURNING *`,
      [vendor_name, amount, currency, invoice_date, date_paid, category, status, notes, req.params.id]
    );
    res.json(rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

invoicesRouter.delete('/:id', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    await db.query('DELETE FROM invoices WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
