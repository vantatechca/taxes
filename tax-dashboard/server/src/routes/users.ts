import { Router, Request, Response } from 'express';
import { db } from '../lib/db';
import { requireRole } from '../middleware/auth';

export const usersRouter = Router();

usersRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query(
      'SELECT id, email, name, role, is_all_companies, company_access FROM users WHERE id = $1', [req.userId]
    );
    if (!rows[0]) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

usersRouter.get('/audit-log', requireRole('admin'), async (_req: Request, res: Response) => {
  try {
    const { rows } = await db.query(
      `SELECT al.*, u.name as user_name, u.email as user_email FROM audit_log al
       LEFT JOIN users u ON al.user_id = u.id ORDER BY al.created_at DESC LIMIT 100`
    );
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

usersRouter.get('/', requireRole('admin'), async (_req: Request, res: Response) => {
  try {
    const { rows } = await db.query('SELECT id, email, name, role, is_all_companies, company_access, created_at FROM users ORDER BY created_at');
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

usersRouter.put('/:id', requireRole('admin'), async (req: Request, res: Response) => {
  const { role, company_access, is_all_companies, name } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE users SET role=$1, company_access=$2, is_all_companies=$3, name=$4 WHERE id=$5
       RETURNING id, email, name, role, is_all_companies, company_access`,
      [role, company_access, is_all_companies, name, req.params.id]
    );
    await db.query(`INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)`,
      [req.userId, 'update_user', 'user', req.params.id, JSON.stringify({ role, is_all_companies })]);
    res.json(rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

usersRouter.delete('/:id', requireRole('admin'), async (req: Request, res: Response) => {
  if (req.params.id === req.userId) { res.status(400).json({ error: 'Cannot delete yourself' }); return; }
  try {
    await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
