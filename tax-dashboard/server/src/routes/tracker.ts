import { Router, Request, Response } from 'express';
import { db } from '../lib/db';
import ExcelJS from 'exceljs';
import { validateYear } from '../lib/validation';

export const trackerRouter = Router();

function styleHeader(sheet: ExcelJS.Worksheet, row: number) {
  const headerRow = sheet.getRow(row);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  headerRow.height = 22;
}

trackerRouter.get('/generate', async (req: Request, res: Response) => {
  const year = validateYear(req.query.year) || new Date().getFullYear();
  try {
    const [{ rows: companies }, { rows: statements }, { rows: invoices }, { rows: deadlines }, { rows: bankAccounts }] = await Promise.all([
      db.query('SELECT * FROM companies ORDER BY short_code'),
      db.query(`SELECT s.*, c.name as company_name, c.short_code as company_short_code, ba.bank_name, ba.currency as bank_currency, ba.account_type as bank_account_type FROM statements s LEFT JOIN companies c ON s.company_id = c.id LEFT JOIN bank_accounts ba ON s.bank_account_id = ba.id ORDER BY s.uploaded_at DESC`),
      db.query(`SELECT inv.*, c.name as company_name, c.short_code as company_short_code FROM invoices inv LEFT JOIN companies c ON inv.company_id = c.id ORDER BY inv.invoice_date DESC`),
      db.query(`SELECT fd.*, c.name as company_name, c.short_code as company_short_code FROM filing_deadlines fd LEFT JOIN companies c ON fd.company_id = c.id WHERE fd.due_date >= $1 AND fd.due_date <= $2 ORDER BY fd.due_date`, [`${year}-01-01`, `${year}-12-31`]),
      db.query(`SELECT ba.*, c.name as company_name, c.short_code as company_short_code FROM bank_accounts ba LEFT JOIN companies c ON ba.company_id = c.id WHERE ba.is_active = true ORDER BY ba.bank_name`),
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Tax Dashboard';
    workbook.created = new Date();

    // Sheet 1: Statement Log
    const stmtSheet = workbook.addWorksheet('Statement Log');
    stmtSheet.columns = [{ header: 'Company', key: 'company', width: 20 }, { header: 'Bank', key: 'bank', width: 15 }, { header: 'Account Type', key: 'account_type', width: 14 }, { header: 'Period', key: 'period', width: 18 }, { header: 'Currency', key: 'currency', width: 10 }, { header: 'File Name', key: 'file_name', width: 35 }, { header: 'Date Received', key: 'date_received', width: 14 }, { header: 'Uploaded to App', key: 'uploaded', width: 16 }, { header: 'Status', key: 'status', width: 12 }];
    styleHeader(stmtSheet, 1);
    for (const s of statements) {
      const periodStart = s.period_start ? new Date(s.period_start).toLocaleDateString('en-CA', { year: 'numeric', month: 'long' }) : '';
      stmtSheet.addRow({ company: s.company_name || s.company_short_code || '', bank: s.bank_name || '', account_type: s.bank_account_type || '', period: periodStart, currency: s.bank_currency || '', file_name: s.file_name || '', date_received: s.uploaded_at ? new Date(s.uploaded_at).toLocaleDateString('en-CA') : '', uploaded: 'YES', status: s.status });
    }

    // Sheet 2: Invoices
    const invSheet = workbook.addWorksheet('Invoices');
    invSheet.columns = [{ header: 'Company', key: 'company', width: 20 }, { header: 'Vendor', key: 'vendor', width: 30 }, { header: 'Invoice Date', key: 'date', width: 14 }, { header: 'Amount', key: 'amount', width: 12 }, { header: 'Currency', key: 'currency', width: 10 }, { header: 'Category', key: 'category', width: 25 }, { header: 'Status', key: 'status', width: 12 }, { header: 'T4A Flag', key: 't4a', width: 10 }];
    styleHeader(invSheet, 1);
    const vendorTotals: Record<string, number> = {};
    for (const inv of invoices) { const key = `${inv.company_id}_${inv.vendor_name}`; vendorTotals[key] = (vendorTotals[key] || 0) + Number(inv.amount); }
    for (const inv of invoices) {
      const key = `${inv.company_id}_${inv.vendor_name}`;
      invSheet.addRow({ company: inv.company_name || inv.company_short_code || '', vendor: inv.vendor_name, date: inv.invoice_date, amount: Number(inv.amount), currency: inv.currency, category: inv.category, status: inv.status, t4a: vendorTotals[key] > 500 ? 'T4A REQUIRED' : '' });
    }

    // Sheet 3: Filing Deadlines
    const dlSheet = workbook.addWorksheet('Filing Deadlines');
    dlSheet.columns = [{ header: 'Company', key: 'company', width: 20 }, { header: 'Filing Type', key: 'type', width: 15 }, { header: 'Period', key: 'period', width: 20 }, { header: 'Due Date', key: 'due', width: 14 }, { header: 'Status', key: 'status', width: 12 }, { header: 'Amount Owing', key: 'amount', width: 14 }, { header: 'Amount Paid', key: 'paid', width: 14 }];
    styleHeader(dlSheet, 1);
    for (const d of deadlines) dlSheet.addRow({ company: d.company_name || d.company_short_code || '', type: d.filing_type, period: d.period_label, due: d.due_date, status: d.status, amount: d.amount_owing ? Number(d.amount_owing) : null, paid: d.amount_paid ? Number(d.amount_paid) : null });

    // Sheet 4: Bank Accounts
    const baSheet = workbook.addWorksheet('Bank Accounts');
    baSheet.columns = [{ header: 'Company', key: 'company', width: 20 }, { header: 'Bank', key: 'bank', width: 20 }, { header: 'Account Type', key: 'type', width: 14 }, { header: 'Last 4 Digits', key: 'last4', width: 14 }, { header: 'Currency', key: 'currency', width: 10 }, { header: 'Nickname', key: 'nickname', width: 20 }, { header: 'Active', key: 'active', width: 8 }];
    styleHeader(baSheet, 1);
    for (const ba of bankAccounts) baSheet.addRow({ company: ba.company_name || ba.company_short_code || '', bank: ba.bank_name, type: ba.account_type, last4: ba.account_number_last4, currency: ba.currency, nickname: ba.nickname || '', active: ba.is_active ? 'YES' : 'NO' });

    // Sheet 5: Company Summary
    const summarySheet = workbook.addWorksheet('Company Summary');
    summarySheet.columns = [{ header: 'Company', key: 'company', width: 20 }, { header: 'Short Code', key: 'code', width: 12 }, { header: 'Type', key: 'type', width: 15 }, { header: 'Jurisdiction', key: 'jurisdiction', width: 14 }, { header: 'TPS Number', key: 'tps', width: 16 }, { header: 'TVQ Number', key: 'tvq', width: 16 }, { header: 'Filing Frequency', key: 'frequency', width: 16 }];
    styleHeader(summarySheet, 1);
    for (const c of companies) summarySheet.addRow({ company: c.name || c.short_code, code: c.short_code, type: c.type, jurisdiction: c.jurisdiction, tps: c.tps_number || '', tvq: c.tvq_number || '', frequency: c.filing_frequency });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=MasterTaxTracker_${year}.xlsx`);
    await workbook.xlsx.write(res); res.end();
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
