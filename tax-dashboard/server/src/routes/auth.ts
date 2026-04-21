import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../lib/db';
import { signToken } from '../lib/jwt';
import { authMiddleware } from '../middleware/auth';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    const { rows } = await db.query(
      'SELECT id, email, name, role, password_hash, is_all_companies, company_access FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    const user = rows[0];
    if (!user || !user.password_hash) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_all_companies: user.is_all_companies,
        company_access: user.company_access,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register (admin only)
authRouter.post('/register', authMiddleware, async (req: Request, res: Response) => {
  if (req.userRole !== 'admin') {
    res.status(403).json({ error: 'Admin only' });
    return;
  }

  const { email, password, name, role = 'viewer' } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    const exists = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (exists.rows.length > 0) {
      res.status(409).json({ error: 'Email already in use' });
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      `INSERT INTO users (email, name, role, password_hash, is_all_companies)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role, is_all_companies`,
      [email.toLowerCase(), name || email.split('@')[0], role, hash, role === 'admin']
    );

    res.status(201).json({ user: rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/change-password
authRouter.post('/change-password', authMiddleware, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'currentPassword and newPassword are required' });
    return;
  }

  try {
    const { rows } = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.userId]);
    const user = rows[0];
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) { res.status(401).json({ error: 'Current password is incorrect' }); return; }

    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.userId]);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
authRouter.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query(
      'SELECT id, email, name, role, is_all_companies, company_access FROM users WHERE id = $1',
      [req.userId]
    );
    if (!rows[0]) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
