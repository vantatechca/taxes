import { Router, Request, Response } from 'express';
import { db } from '../lib/db';
import { requireRole } from '../middleware/auth';
import { validatePagination } from '../lib/validation';

export const transactionsRouter = Router();

transactionsRouter.get('/search', async (req: Request, res: Response) => {
  const { q, company_id, date_from, date_to, min_amount, max_amount, category } = req.query;
  const { page, limit } = validatePagination(req.query.page, req.query.limit);
  try {
    const conditions: string[] = [];
    const params: any[] = [];
    let i = 1;
    if (q) { conditions.push(`t.description_raw ILIKE $${i++}`); params.push(`%${q}%`); }
    if (company_id) { conditions.push(`t.company_id = $${i++}`); params.push(company_id); }
    if (date_from) { conditions.push(`t.date >= $${i++}`); params.push(date_from); }
    if (date_to) { conditions.push(`t.date <= $${i++}`); params.push(date_to); }
    if (min_amount) { conditions.push(`t.amount >= $${i++}`); params.push(Number(min_amount)); }
    if (max_amount) { conditions.push(`t.amount <= $${i++}`); params.push(Number(max_amount)); }
    if (category) { conditions.push(`t.category = $${i++}`); params.push(category); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countRes = await db.query(`SELECT COUNT(*) FROM transactions t ${where}`, params);
    const total = parseInt(countRes.rows[0].count);
    const offset = (page - 1) * limit;
    const { rows } = await db.query(
      `SELECT t.*, c.name as company_name, c.short_code as company_short_code
       FROM transactions t LEFT JOIN companies c ON t.company_id = c.id
       ${where} ORDER BY t.date DESC LIMIT $${i++} OFFSET $${i}`,
      [...params, limit, offset]
    );
    res.json({ data: rows, total, page, limit });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

transactionsRouter.get('/review-queue', async (req: Request, res: Response) => {
  const { company_id, statement_id, page = '1', limit = '20' } = req.query;
  try {
    const conditions: string[] = ['t.is_reviewed = false'];
    const params: any[] = [];
    let i = 1;
    if (company_id) { conditions.push(`t.company_id = $${i++}`); params.push(company_id); }
    if (statement_id) { conditions.push(`t.statement_id = $${i++}`); params.push(statement_id); }
    const where = `WHERE ${conditions.join(' AND ')}`;
    const countRes = await db.query(`SELECT COUNT(*) FROM transactions t ${where}`, params);
    const total = parseInt(countRes.rows[0].count);
    const pageNum = parseInt(page as string), limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;
    const { rows } = await db.query(
      `SELECT t.*, c.name as company_name, c.short_code as company_short_code, c.type as company_type, c.jurisdiction as company_jurisdiction,
              ba.bank_name, ba.currency as bank_currency
       FROM transactions t
       LEFT JOIN companies c ON t.company_id = c.id
       LEFT JOIN bank_accounts ba ON t.bank_account_id = ba.id
       ${where} ORDER BY t.date DESC LIMIT $${i++} OFFSET $${i}`,
      [...params, limitNum, offset]
    );
    res.json({ data: rows, total, page: pageNum, limit: limitNum });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

transactionsRouter.get('/intercompany', async (req: Request, res: Response) => {
  const year = req.query.year || new Date().getFullYear();
  try {
    const { rows } = await db.query(
      `SELECT t.*, c.name as company_name, c.short_code as company_short_code,
              ic.name as intercompany_company_name, ic.short_code as intercompany_short_code
       FROM transactions t
       LEFT JOIN companies c ON t.company_id = c.id
       LEFT JOIN companies ic ON t.intercompany_company_id = ic.id
       WHERE t.is_intercompany = true AND t.date >= $1 AND t.date <= $2
       ORDER BY t.date DESC`,
      [`${year}-01-01`, `${year}-12-31`]
    );
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

transactionsRouter.get('/', async (req: Request, res: Response) => {
  const { company_id, is_reviewed, category, statement_id, date_from, date_to, page = '1', limit = '50' } = req.query;
  try {
    const conditions: string[] = [];
    const params: any[] = [];
    let i = 1;
    if (company_id) { conditions.push(`t.company_id = $${i++}`); params.push(company_id); }
    if (is_reviewed !== undefined) { conditions.push(`t.is_reviewed = $${i++}`); params.push(is_reviewed === 'true'); }
    if (category) { conditions.push(`t.category = $${i++}`); params.push(category); }
    if (statement_id) { conditions.push(`t.statement_id = $${i++}`); params.push(statement_id); }
    if (date_from) { conditions.push(`t.date >= $${i++}`); params.push(date_from); }
    if (date_to) { conditions.push(`t.date <= $${i++}`); params.push(date_to); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countRes = await db.query(`SELECT COUNT(*) FROM transactions t ${where}`, params);
    const total = parseInt(countRes.rows[0].count);
    const pageNum = parseInt(page as string), limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;
    const { rows } = await db.query(
      `SELECT t.*, c.name as company_name, c.short_code as company_short_code, ba.bank_name, ba.currency as bank_currency
       FROM transactions t
       LEFT JOIN companies c ON t.company_id = c.id
       LEFT JOIN bank_accounts ba ON t.bank_account_id = ba.id
       ${where} ORDER BY t.date DESC LIMIT $${i++} OFFSET $${i}`,
      [...params, limitNum, offset]
    );
    res.json({ data: rows, total, page: pageNum, limit: limitNum });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

transactionsRouter.put('/bulk-review', requireRole('admin', 'reviewer'), async (req: Request, res: Response) => {
  const { transaction_ids } = req.body;
  if (!transaction_ids?.length) { res.status(400).json({ error: 'transaction_ids required' }); return; }
  try {
    await db.query(`UPDATE transactions SET is_reviewed = true WHERE id = ANY($1::uuid[])`, [transaction_ids]);
    res.json({ updated: transaction_ids.length });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

transactionsRouter.put('/:id', requireRole('admin', 'reviewer'), async (req: Request, res: Response) => {
  const { category, subcategory, notes, is_reviewed, is_intercompany, intercompany_company_id,
    quebec_sales_amount, ontario_sales_amount, us_sales_amount, other_canada_sales_amount,
    international_sales_amount, includes_canadian_tax, tps_collectable, tvq_collectable,
    tps_reclaimable, tvq_reclaimable } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE transactions SET category=$1, subcategory=$2, notes=$3, is_reviewed=$4, is_intercompany=$5,
       intercompany_company_id=$6, quebec_sales_amount=$7, ontario_sales_amount=$8, us_sales_amount=$9,
       other_canada_sales_amount=$10, international_sales_amount=$11, includes_canadian_tax=$12,
       tps_collectable=$13, tvq_collectable=$14, tps_reclaimable=$15, tvq_reclaimable=$16
       WHERE id=$17 RETURNING *`,
      [category, subcategory, notes, is_reviewed, is_intercompany, intercompany_company_id ?? null,
       quebec_sales_amount ?? null, ontario_sales_amount ?? null, us_sales_amount ?? null,
       other_canada_sales_amount ?? null, international_sales_amount ?? null, includes_canadian_tax || false,
       tps_collectable ?? null, tvq_collectable ?? null, tps_reclaimable ?? null, tvq_reclaimable ?? null, req.params.id]
    );
    res.json(rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
