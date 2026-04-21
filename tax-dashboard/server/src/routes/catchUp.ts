import { Router, Request, Response } from 'express';
import { db } from '../lib/db';
import { validateYear } from '../lib/validation';

export const catchUpRouter = Router();

catchUpRouter.get('/', async (req: Request, res: Response) => {
  const year = validateYear(req.query.year) || new Date().getFullYear();
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { rows: companies } = await db.query('SELECT id, name, short_code, jurisdiction, type FROM companies ORDER BY short_code');
    const { rows: deadlines } = await db.query(
      `SELECT fd.*, c.name as company_name, c.short_code as company_short_code, c.jurisdiction as company_jurisdiction
       FROM filing_deadlines fd LEFT JOIN companies c ON fd.company_id = c.id
       WHERE fd.status IN ('pending','overdue') AND fd.due_date <= $1 ORDER BY fd.due_date`,
      [today]
    );
    const { rows: statements } = await db.query('SELECT company_id, period_start, period_end, status FROM statements ORDER BY period_start');
    const { rows: transactions } = await db.query(
      `SELECT company_id, date, is_reviewed FROM transactions WHERE date >= $1`,
      [`${year - 1}-01-01`]
    );
    const sprintItems: any[] = [];
    for (const d of deadlines) {
      const daysOverdue = Math.ceil((Date.now() - new Date(d.due_date).getTime()) / 86400000);
      const hasStatement = statements.some((s: any) => s.company_id === d.company_id && s.status !== 'deleted');
      const companyTxns = transactions.filter((t: any) => t.company_id === d.company_id);
      const reviewedCount = companyTxns.filter((t: any) => t.is_reviewed).length;
      const totalTxns = companyTxns.length;
      sprintItems.push({ id: d.id, company_id: d.company_id, company_name: d.company_name || d.company_short_code || '', company_code: d.company_short_code || '', jurisdiction: d.company_jurisdiction || '', filing_type: d.filing_type, period_label: d.period_label, due_date: d.due_date, days_overdue: daysOverdue, priority: daysOverdue > 90 ? 'critical' : daysOverdue > 30 ? 'high' : 'medium', steps: { statement_received: hasStatement, uploaded: hasStatement, transactions_reviewed: totalTxns > 0 && reviewedCount === totalTxns, review_progress: totalTxns > 0 ? Math.round((reviewedCount / totalTxns) * 100) : 0, tax_report_generated: false, sent_to_accountant: false }, notes: d.notes || '', amount_owing: d.amount_owing });
    }
    const now = new Date();
    for (const company of companies) {
      for (let i = 1; i <= 12; i++) {
        const checkDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = checkDate.toISOString().slice(0, 7);
        const monthLabel = checkDate.toLocaleString('en', { month: 'long', year: 'numeric' });
        if (sprintItems.some(s => s.company_id === company.id && s.period_label === monthLabel)) continue;
        const hasStmt = statements.some((s: any) => s.company_id === company.id && s.period_start?.startsWith(monthStr));
        if (!hasStmt) {
          sprintItems.push({ id: `missing-${company.id}-${monthStr}`, company_id: company.id, company_name: company.name || company.short_code, company_code: company.short_code, jurisdiction: company.jurisdiction, filing_type: 'Statement Missing', period_label: monthLabel, due_date: new Date(checkDate.getFullYear(), checkDate.getMonth() + 2, 0).toISOString().slice(0, 10), days_overdue: Math.ceil((Date.now() - new Date(checkDate.getFullYear(), checkDate.getMonth() + 2, 0).getTime()) / 86400000), priority: 'low', steps: { statement_received: false, uploaded: false, transactions_reviewed: false, review_progress: 0, tax_report_generated: false, sent_to_accountant: false }, notes: 'No bank statement uploaded for this period', amount_owing: null });
        }
      }
    }
    sprintItems.sort((a, b) => b.days_overdue - a.days_overdue || a.company_name.localeCompare(b.company_name));
    const summary = { total_overdue: sprintItems.length, critical: sprintItems.filter(s => s.priority === 'critical').length, high: sprintItems.filter(s => s.priority === 'high').length, medium: sprintItems.filter(s => s.priority === 'medium').length, low: sprintItems.filter(s => s.priority === 'low').length, companies_affected: [...new Set(sprintItems.map(s => s.company_id))].length, oldest_overdue_days: sprintItems[0]?.days_overdue || 0 };
    res.json({ items: sprintItems, summary });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
