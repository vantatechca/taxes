import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function initDB() {
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)
  `);

  const { rows } = await pool.query('SELECT COUNT(*) FROM users');
  if (parseInt(rows[0].count) === 0) {
    const email = process.env.ADMIN_EMAIL || 'admin@taxdashboard.com';
    const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(16).toString('hex');
    const hash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users (email, name, role, password_hash, is_all_companies) VALUES ($1,$2,$3,$4,$5)`,
      [email, 'Admin', 'admin', hash, true]
    );

    if (process.env.ADMIN_PASSWORD) {
      console.log(`[db] Admin user created: ${email}`);
    } else {
      console.log(`[db] Admin user created: ${email} / ${password} — SAVE THIS PASSWORD, it will not be shown again.`);
    }
  }
}

export const db = pool;
