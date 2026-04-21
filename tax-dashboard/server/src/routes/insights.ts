import { Router, Request, Response } from 'express';
import { db } from '../lib/db';
import { validateYear } from '../lib/validation';

export const insightsRouter = Router();

insightsRouter.get('/recurring', async (req: Request, res: Response) => {
  const year = validateYear(req.query.year) || new Date().getFullYear();
  try {
    const { rows } = await db.query(
      `SELECT t.id, t.company_id, t.description_clean, t.description_raw, t.amount, t.type, t.date, t.category,
              c.name as company_name, c.short_code as company_short_code
       FROM transactions t LEFT JOIN companies c ON t.company_id = c.id
       WHERE t.date >= $1 AND t.date <= $2 ORDER BY t.date`,
      [`${year}-01-01`, `${year}-12-31`]
    );
    const groups: Record<string, any> = {};
    for (const t of rows) {
      const normalized = ((t.description_clean || t.description_raw || '') as string).toLowerCase().trim();
      const key = `${normalized}__${t.company_id}`;
      if (!groups[key]) groups[key] = { normalized, company_id: t.company_id, company_name: t.company_name || t.company_short_code || '', count: 0, total_amount: 0, type: t.type, category: t.category, transactions: [] };
      groups[key].count++;
      groups[key].total_amount += Number(t.amount);
      groups[key].transactions.push({ id: t.id, date: t.date, amount: Number(t.amount) });
    }
    const recurring = Object.values(groups).filter((g: any) => g.count >= 3)
      .map((g: any) => ({ ...g, avg_amount: Math.round((g.total_amount / g.count) * 100) / 100, total_amount: Math.round(g.total_amount * 100) / 100 }))
      .sort((a: any, b: any) => b.count - a.count);
    res.json({ year, recurring, total_groups: recurring.length });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

insightsRouter.get('/duplicates', async (req: Request, res: Response) => {
  const days = Math.min(90, Math.max(1, parseInt(req.query.days as string) || 7));
  try {
    const { rows: txns } = await db.query(
      `SELECT t.id, t.company_id, t.description_clean, t.description_raw, t.amount, t.type, t.date, t.category,
              c.name as company_name, c.short_code as company_short_code
       FROM transactions t LEFT JOIN companies c ON t.company_id = c.id
       ORDER BY t.date DESC LIMIT 5000`
    );
    const duplicates: any[] = [];
    for (let i = 0; i < txns.length; i++) {
      for (let j = i + 1; j < txns.length; j++) {
        const a = txns[i], b = txns[j];
        if (a.company_id !== b.company_id) continue;
        if (Math.abs(Number(a.amount) - Number(b.amount)) > 0.01) continue;
        const dayGap = Math.abs(new Date(a.date).getTime() - new Date(b.date).getTime()) / 86400000;
        if (dayGap > days) continue;
        const descA = ((a.description_clean || a.description_raw || '') as string).toLowerCase().trim();
        const descB = ((b.description_clean || b.description_raw || '') as string).toLowerCase().trim();
        let similarity = 'different';
        if (descA === descB) similarity = 'exact';
        else if (descA.includes(descB) || descB.includes(descA)) similarity = 'partial';
        else continue;
        duplicates.push({ transaction_a: { id: a.id, date: a.date, description: descA, amount: Number(a.amount) }, transaction_b: { id: b.id, date: b.date, description: descB, amount: Number(b.amount) }, company_id: a.company_id, company_name: a.company_name || a.company_short_code || '', amount: Number(a.amount), day_gap: Math.round(dayGap), similarity });
      }
    }
    duplicates.sort((a, b) => a.day_gap - b.day_gap);
    res.json({ days, duplicates, total_pairs: duplicates.length });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
