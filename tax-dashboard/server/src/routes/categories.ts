import { Router, Request, Response } from 'express';
import { db } from '../lib/db';
import { requireRole } from '../middleware/auth';

export const categoriesRouter = Router();

categoriesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const { rows } = await db.query('SELECT * FROM custom_categories ORDER BY sort_order');
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

categoriesRouter.post('/', requireRole('admin'), async (req: Request, res: Response) => {
  const { key, label, icon, group, warning, deductibility_rate, is_non_taxable } = req.body;
  if (!key || !label || !group) { res.status(400).json({ error: 'key, label, and group are required' }); return; }
  try {
    const { rows } = await db.query(
      `INSERT INTO custom_categories (key, label, icon, "group", warning, deductibility_rate, is_non_taxable, is_system)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [key, label, icon || '📋', group, warning || null, deductibility_rate ?? 1.0, is_non_taxable || false, false]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

categoriesRouter.put('/:id', requireRole('admin'), async (req: Request, res: Response) => {
  const { label, icon, warning, deductibility_rate, is_non_taxable, sort_order } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE custom_categories SET label=$1, icon=$2, warning=$3, deductibility_rate=$4, is_non_taxable=$5, sort_order=$6 WHERE id=$7 RETURNING *`,
      [label, icon, warning, deductibility_rate, is_non_taxable, sort_order, req.params.id]
    );
    res.json(rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

categoriesRouter.delete('/:id', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query('SELECT is_system FROM custom_categories WHERE id = $1', [req.params.id]);
    if (rows[0]?.is_system) { res.status(400).json({ error: 'Cannot delete built-in categories.' }); return; }
    await db.query('DELETE FROM custom_categories WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
