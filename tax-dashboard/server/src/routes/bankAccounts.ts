import { Router, Request, Response } from 'express';
import { db } from '../lib/db';
import { requireRole } from '../middleware/auth';

export const bankAccountsRouter = Router();

bankAccountsRouter.get('/', async (req: Request, res: Response) => {
  try {
    let query = `SELECT ba.*, c.name as company_name, c.short_code as company_short_code
                 FROM bank_accounts ba LEFT JOIN companies c ON ba.company_id = c.id`;
    const params: any[] = [];
    if (req.query.company_id) { query += ' WHERE ba.company_id = $1'; params.push(req.query.company_id); }
    query += ' ORDER BY ba.bank_name';
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

bankAccountsRouter.post('/', requireRole('admin', 'reviewer'), async (req: Request, res: Response) => {
  const { company_id, bank_name, account_number_last4, currency, account_type, nickname } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO bank_accounts (company_id, bank_name, account_number_last4, currency, account_type, nickname)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [company_id, bank_name, account_number_last4, currency, account_type, nickname]
    );
    await db.query(`INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)`,
      [req.userId, 'create_bank_account', 'bank_account', rows[0].id, JSON.stringify(req.body)]);
    res.status(201).json(rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

bankAccountsRouter.put('/:id', requireRole('admin'), async (req: Request, res: Response) => {
  const { bank_name, account_number_last4, currency, account_type, nickname, is_active } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE bank_accounts SET bank_name=$1, account_number_last4=$2, currency=$3, account_type=$4, nickname=$5, is_active=$6 WHERE id=$7 RETURNING *`,
      [bank_name, account_number_last4, currency, account_type, nickname, is_active, req.params.id]
    );
    res.json(rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

bankAccountsRouter.delete('/:id', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    await db.query('UPDATE bank_accounts SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
