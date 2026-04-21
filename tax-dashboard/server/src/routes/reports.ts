import { Router, Request, Response } from 'express';
import { db } from '../lib/db';
import ExcelJS from 'exceljs';
import { getDeductibilityRate, isNonTaxableCategory } from '../services/taxCalculator';
import { validateYear, validateMonth } from '../lib/validation';

export const reportsRouter = Router();

reportsRouter.get('/monthly/:companyId', async (req: Request, res: Response) => {
  const { companyId } = req.params;
  const validYear = validateYear(req.query.year);
  const validMonth = validateMonth(req.query.month);
  if (!validYear || !validMonth) { res.status(400).json({ error: 'Invalid year/month parameter' }); return; }
  const startDate = `${validYear}-${String(validMonth).padStart(2, '0')}-01`;
  const endDate = new Date(validYear, validMonth, 0).toISOString().slice(0, 10);
  try {
    const { rows: transactions } = await db.query(
      'SELECT * FROM transactions WHERE company_id = $1 AND date >= $2 AND date <= $3 ORDER BY date',
      [companyId, startDate, endDate]
    );
    const income: Record<string, number> = {}, expenses: Record<string, number> = {};
    let tpsCollected = 0, tvqCollected = 0, tpsITC = 0, tvqITR = 0;
    const intercompany: any[] = [], unreviewed: any[] = [];
    for (const t of transactions) {
      if (!t.is_reviewed) unreviewed.push(t);
      if (t.is_intercompany) intercompany.push(t);
      const cat = t.category;
      if (isNonTaxableCategory(cat)) continue;
      if (t.type === 'credit') income[cat] = (income[cat] || 0) + Number(t.amount);
      else expenses[cat] = (expenses[cat] || 0) + Number(t.amount) * getDeductibilityRate(cat);
      tpsCollected += Number(t.tps_collectable || 0); tvqCollected += Number(t.tvq_collectable || 0);
      tpsITC += Number(t.tps_reclaimable || 0); tvqITR += Number(t.tvq_reclaimable || 0);
    }
    res.json({ period: { year: validYear, month: validMonth, startDate, endDate }, income, expenses, totalIncome: Object.values(income).reduce((a, b) => a + b, 0), totalExpenses: Object.values(expenses).reduce((a, b) => a + b, 0), tax: { tpsCollected, tvqCollected, tpsITC, tvqITR, tpsNet: tpsCollected - tpsITC, tvqNet: tvqCollected - tvqITR }, intercompanyCount: intercompany.length, unreviewedCount: unreviewed.length });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

reportsRouter.get('/export/monthly/:companyId', async (req: Request, res: Response) => {
  const { companyId } = req.params;
  const validYear = validateYear(req.query.year);
  const validMonth = validateMonth(req.query.month);
  if (!validYear || !validMonth) { res.status(400).json({ error: 'Invalid year/month parameter' }); return; }
  try {
    const { rows: companyRows } = await db.query('SELECT * FROM companies WHERE id = $1', [companyId]);
    const company = companyRows[0];
    const startDate = `${validYear}-${String(validMonth).padStart(2, '0')}-01`;
    const endDate = new Date(validYear, validMonth, 0).toISOString().slice(0, 10);
    const { rows: transactions } = await db.query('SELECT * FROM transactions WHERE company_id = $1 AND date >= $2 AND date <= $3 ORDER BY date', [companyId, startDate, endDate]);
    const workbook = new ExcelJS.Workbook();
    const cols = [{ header: 'Date', key: 'date', width: 12 }, { header: 'Description', key: 'description', width: 40 }, { header: 'Category', key: 'category', width: 25 }, { header: 'Amount', key: 'amount', width: 15 }, { header: 'Currency', key: 'currency', width: 8 }];
    const incomeSheet = workbook.addWorksheet('Income'); incomeSheet.columns = cols;
    const expenseSheet = workbook.addWorksheet('Expenses'); expenseSheet.columns = cols;
    for (const t of transactions) {
      const row = { date: t.date, description: t.description_clean || t.description_raw, category: t.category, amount: Number(t.amount), currency: t.currency };
      if (t.type === 'credit') incomeSheet.addRow(row); else expenseSheet.addRow(row);
    }
    if (company?.jurisdiction === 'QC') {
      const taxSheet = workbook.addWorksheet('TPS-TVQ Summary');
      taxSheet.columns = [{ header: 'Item', key: 'item', width: 35 }, { header: 'Amount', key: 'amount', width: 15 }];
      let tpsC = 0, tvqC = 0, tpsI = 0, tvqI = 0;
      for (const t of transactions) { tpsC += Number(t.tps_collectable || 0); tvqC += Number(t.tvq_collectable || 0); tpsI += Number(t.tps_reclaimable || 0); tvqI += Number(t.tvq_reclaimable || 0); }
      taxSheet.addRows([{ item: 'TPS Collected (5%)', amount: tpsC }, { item: 'TVQ Collected (9.975%)', amount: tvqC }, { item: 'TPS Input Tax Credits (ITC)', amount: tpsI }, { item: 'TVQ Input Tax Refunds (ITR)', amount: tvqI }, { item: 'NET TPS OWING', amount: tpsC - tpsI }, { item: 'NET TVQ OWING', amount: tvqC - tvqI }]);
    }
    const icSheet = workbook.addWorksheet('Intercompany');
    icSheet.columns = [{ header: 'Date', key: 'date', width: 12 }, { header: 'Description', key: 'description', width: 40 }, { header: 'Amount', key: 'amount', width: 15 }, { header: 'Type', key: 'type', width: 8 }];
    for (const t of transactions.filter((t: any) => t.is_intercompany)) icSheet.addRow({ date: t.date, description: t.description_clean || t.description_raw, amount: Number(t.amount), type: t.type });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${company?.short_code || 'report'}_${validYear}-${validMonth}.xlsx`);
    await workbook.xlsx.write(res); res.end();
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

reportsRouter.get('/annual/:companyId', async (req: Request, res: Response) => {
  const year = validateYear(req.query.year) || new Date().getFullYear();
  try {
    const { rows: transactions } = await db.query('SELECT * FROM transactions WHERE company_id = $1 AND date >= $2 AND date <= $3 ORDER BY date', [req.params.companyId, `${year}-01-01`, `${year}-12-31`]);
    const vendorTotals: Record<string, number> = {};
    for (const t of transactions.filter((t: any) => t.category === 'expense_wages_contractors' && t.currency === 'CAD')) {
      const vendor = (t.description_clean || t.description_raw).substring(0, 50);
      vendorTotals[vendor] = (vendorTotals[vendor] || 0) + Number(t.amount);
    }
    const t4aFlags = Object.entries(vendorTotals).filter(([_, total]) => total > 500).map(([vendor, total]) => ({ vendor, total, t4aRequired: true }));
    res.json({ year, transactionCount: transactions.length, t4aFlags });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

reportsRouter.get('/export/accountant-package', async (req: Request, res: Response) => {
  const year = validateYear(req.query.year) || new Date().getFullYear();
  try {
    const { rows: companies } = await db.query('SELECT * FROM companies ORDER BY short_code');
    const workbook = new ExcelJS.Workbook();
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [{ header: 'Company', key: 'company', width: 25 }, { header: 'Jurisdiction', key: 'jurisdiction', width: 12 }, { header: 'Total Income', key: 'income', width: 15 }, { header: 'Total Expenses', key: 'expenses', width: 15 }, { header: 'Net', key: 'net', width: 15 }, { header: 'TPS Net Owing', key: 'tps', width: 15 }, { header: 'TVQ Net Owing', key: 'tvq', width: 15 }];
    for (const company of companies) {
      const { rows: txns } = await db.query('SELECT * FROM transactions WHERE company_id = $1 AND date >= $2 AND date <= $3', [company.id, `${year}-01-01`, `${year}-12-31`]);
      let income = 0, expenses = 0, tpsC = 0, tvqC = 0, tpsI = 0, tvqI = 0;
      for (const t of txns) {
        if (isNonTaxableCategory(t.category)) continue;
        if (t.type === 'credit') income += Number(t.amount); else expenses += Number(t.amount);
        tpsC += Number(t.tps_collectable || 0); tvqC += Number(t.tvq_collectable || 0);
        tpsI += Number(t.tps_reclaimable || 0); tvqI += Number(t.tvq_reclaimable || 0);
      }
      summarySheet.addRow({ company: company.name || company.short_code, jurisdiction: company.jurisdiction, income, expenses, net: income - expenses, tps: tpsC - tpsI, tvq: tvqC - tvqI });
      const sheet = workbook.addWorksheet(company.short_code);
      sheet.columns = [{ header: 'Date', key: 'date', width: 12 }, { header: 'Description', key: 'desc', width: 40 }, { header: 'Category', key: 'cat', width: 25 }, { header: 'Debit', key: 'debit', width: 12 }, { header: 'Credit', key: 'credit', width: 12 }, { header: 'Currency', key: 'curr', width: 8 }];
      for (const t of txns) sheet.addRow({ date: t.date, desc: t.description_clean || t.description_raw, cat: t.category, debit: t.type === 'debit' ? Number(t.amount) : null, credit: t.type === 'credit' ? Number(t.amount) : null, curr: t.currency });
    }
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=AccountantPackage_${year}.xlsx`);
    await workbook.xlsx.write(res); res.end();
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
