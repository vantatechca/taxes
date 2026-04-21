import { Router, Request, Response } from 'express';
import { db } from '../lib/db';

export const accountantRouter = Router();

accountantRouter.get('/scan', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const currentYear = now.getFullYear();

    const { rows: companies } = await db.query('SELECT * FROM companies ORDER BY short_code');
    if (!companies.length) { res.json({ overallScore: 100, totalIssues: 0, totalWarnings: 0, totalClear: 0, companies: [], missingFilings: [], anomalies: [], reconciliation: [], thresholds: [], recommendations: [], scannedAt: now.toISOString() }); return; }

    const missingFilings: any[] = [], anomalies: any[] = [], reconciliation: any[] = [], thresholds: any[] = [], recommendations: string[] = [], companyResults: any[] = [];

    for (const company of companies) {
      const companyName = company.name || company.short_code;
      const issues: any[] = [];
      let healthScore = 100;

      const { rows: deadlines } = await db.query(
        `SELECT * FROM filing_deadlines WHERE company_id = $1 AND status IN ('pending','overdue') AND due_date < $2 ORDER BY due_date`,
        [company.id, today]
      );
      for (const dl of deadlines) {
        const daysOverdue = Math.floor((now.getTime() - new Date(dl.due_date).getTime()) / 86400000);
        const period = dl.period_label || dl.filing_type || 'Unknown period';
        missingFilings.push({ company: companyName, period, dueDate: dl.due_date, daysOverdue });
        issues.push({ severity: 'critical', category: 'missing_filing', message: `${period}: NOT FILED (${daysOverdue} days overdue)` });
        healthScore -= 10;
      }

      const { rows: txns } = await db.query(
        `SELECT id, amount, type, category, date, is_reviewed FROM transactions WHERE company_id = $1 AND date >= $2 AND date <= $3`,
        [company.id, `${currentYear}-01-01`, `${currentYear}-12-31`]
      );
      const totalTransactions = txns.length;
      const uncategorized = txns.filter((t: any) => !t.category || t.category === 'uncategorized');
      const categorizedCount = totalTransactions - uncategorized.length;
      const percentCategorized = totalTransactions > 0 ? Math.round((categorizedCount / totalTransactions) * 100) : 100;
      if (uncategorized.length > 0) {
        const totalUncatAmount = uncategorized.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
        anomalies.push({ company: companyName, type: 'uncategorized', message: `${uncategorized.length} uncategorized transactions totaling $${totalUncatAmount.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`, severity: uncategorized.length > 20 ? 'high' : 'medium' });
        issues.push({ severity: 'warning', category: 'uncategorized', message: `${uncategorized.length} uncategorized transactions` });
        healthScore -= Math.floor(((uncategorized.length / Math.max(totalTransactions, 1)) * 100) / 10) * 3;
      }

      const revenueByMonth: Record<number, number> = {};
      let annualRevenue = 0;
      for (const t of txns) {
        if (t.category === 'income_loan_received' || t.category === 'expense_loan_repayment') continue;
        if (t.type === 'credit') { const month = new Date(t.date).getMonth() + 1; revenueByMonth[month] = (revenueByMonth[month] || 0) + Number(t.amount); annualRevenue += Number(t.amount); }
      }
      const months = Object.keys(revenueByMonth).map(Number).sort((a, b) => a - b);
      const monthNames = ['','January','February','March','April','May','June','July','August','September','October','November','December'];
      for (let i = 1; i < months.length; i++) {
        const prev = revenueByMonth[months[i - 1]], curr = revenueByMonth[months[i]];
        if (prev > 0) {
          const changePercent = ((curr - prev) / prev) * 100;
          if (Math.abs(changePercent) > 30) {
            const direction = changePercent > 0 ? 'increased' : 'dropped';
            const absPercent = Math.abs(Math.round(changePercent));
            anomalies.push({ company: companyName, type: 'revenue_anomaly', message: `${monthNames[months[i]]} revenue ${direction} ${absPercent}% vs ${monthNames[months[i - 1]]}`, severity: absPercent > 50 ? 'high' : 'medium' });
            issues.push({ severity: 'warning', category: 'anomaly', message: `Revenue ${direction} ${absPercent}% in ${monthNames[months[i]]}` });
            healthScore -= 5;
          }
        }
      }

      const { rows: statements } = await db.query(`SELECT id FROM statements WHERE company_id = $1 AND created_at >= $2`, [company.id, `${currentYear}-01-01`]);
      const statementsUploaded = statements.length;
      reconciliation.push({ company: companyName, statementsUploaded, transactionsCategorized: categorizedCount, totalTransactions, percentCategorized });
      if (statementsUploaded === 0 && totalTransactions === 0) { issues.push({ severity: 'info', category: 'reconciliation', message: 'No statements uploaded this year' }); healthScore -= 5; }

      const limit = company.jurisdiction === 'QC' ? 30000 : 100000;
      const type = company.jurisdiction === 'QC' ? 'Small Supplier ($30K CAD)' : 'US Nexus ($100K USD)';
      const percentUsed = Math.min(Math.round((annualRevenue / limit) * 100), 100);
      thresholds.push({ company: companyName, type, current: Math.round(annualRevenue), limit, percentUsed });
      if (percentUsed >= 85) { issues.push({ severity: 'warning', category: 'threshold', message: `$${Math.round(annualRevenue).toLocaleString()} YTD — ${percentUsed}% of threshold` }); healthScore -= 5; }

      healthScore = Math.max(0, Math.min(100, healthScore));
      companyResults.push({ id: company.id, name: companyName, shortCode: company.short_code, jurisdiction: company.jurisdiction, healthScore, issues });
    }

    if (missingFilings.length > 0) recommendations.push(`Consider filing catch-up returns for ${[...new Set(missingFilings.map(f => f.company))].join(', ')}`);
    if (anomalies.filter(a => a.type === 'uncategorized').length > 0) recommendations.push('Review and categorize uncategorized transactions for accurate reporting');
    if (companyResults.length > 1) recommendations.push('Intercompany transfers should be documented for CRA/IRS compliance');
    const reconLow = reconciliation.filter(r => r.percentCategorized < 80 && r.totalTransactions > 0);
    if (reconLow.length > 0) recommendations.push(`${reconLow.length} companies have less than 80% categorized transactions`);

    const overallScore = companyResults.length > 0 ? Math.round(companyResults.reduce((sum, c) => sum + c.healthScore, 0) / companyResults.length) : 100;
    res.json({ overallScore, totalIssues: companyResults.reduce((sum, c) => sum + c.issues.filter((i: any) => i.severity === 'critical').length, 0), totalWarnings: companyResults.reduce((sum, c) => sum + c.issues.filter((i: any) => i.severity === 'warning').length, 0), totalClear: companyResults.filter(c => c.issues.length === 0).length, companies: companyResults, missingFilings, anomalies, reconciliation, thresholds, recommendations, scannedAt: now.toISOString() });
  } catch (err: any) { res.status(500).json({ error: err.message || 'Scan failed' }); }
});
