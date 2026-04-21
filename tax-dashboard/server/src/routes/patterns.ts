import { Router, Request, Response } from 'express';
import { db } from '../lib/db';
import { requireRole } from '../middleware/auth';

export const patternsRouter = Router();

patternsRouter.get('/', async (req: Request, res: Response) => {
  try {
    let query = `SELECT tp.*, c.name as company_name, c.short_code as company_short_code
                 FROM transaction_patterns tp LEFT JOIN companies c ON tp.company_id = c.id`;
    const params: any[] = [];
    if (req.query.company_id) {
      query += ' WHERE (tp.company_id = $1 OR tp.company_id IS NULL)';
      params.push(req.query.company_id);
    }
    query += ' ORDER BY times_applied DESC';
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

patternsRouter.post('/', requireRole('admin', 'reviewer'), async (req: Request, res: Response) => {
  const { company_id, match_type, match_string, assigned_category, assigned_subcategory, is_income, auto_apply } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO transaction_patterns (company_id, match_type, match_string, assigned_category, assigned_subcategory, is_income, auto_apply, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [company_id || null, match_type || 'contains', match_string, assigned_category, assigned_subcategory, is_income || false, auto_apply || false, req.userId]
    );
    await db.query(`INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)`,
      [req.userId, 'create_pattern', 'pattern', rows[0].id, JSON.stringify({ match_string, assigned_category })]);
    res.status(201).json(rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

patternsRouter.put('/:id', requireRole('admin'), async (req: Request, res: Response) => {
  const { match_type, match_string, assigned_category, assigned_subcategory, auto_apply } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE transaction_patterns SET match_type=$1, match_string=$2, assigned_category=$3, assigned_subcategory=$4, auto_apply=$5 WHERE id=$6 RETURNING *`,
      [match_type, match_string, assigned_category, assigned_subcategory, auto_apply, req.params.id]
    );
    res.json(rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

patternsRouter.delete('/:id', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    await db.query('DELETE FROM transaction_patterns WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
