import { Router, Request, Response } from 'express';
import PDFDocument from 'pdfkit';

export const sopRouter = Router();

// GET — Generate the full SOP document as PDF
sopRouter.get('/generate', async (_req: Request, res: Response) => {
  try {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 50, bottom: 50, left: 60, right: 60 },
      info: {
        Title: 'Multi-Entity Tax Management — Standard Operating Procedures',
        Author: 'Tax Dashboard',
      },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=SOP_Tax_Management.pdf');
    doc.pipe(res);

    const blue = '#1e40af';
    const darkGray = '#1f2937';
    const gray = '#4b5563';
    const lightBg = '#f1f5f9';

    // ===== COVER PAGE =====
    doc.moveDown(6);
    doc.fontSize(28).font('Helvetica-Bold').fillColor(blue).text('STANDARD OPERATING PROCEDURES', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(18).font('Helvetica').fillColor(darkGray).text('Multi-Entity Tax Management', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor(gray).text('Digital Empire Group', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(10).text(`Version 1.0 — ${new Date().toLocaleDateString('en-CA')}`, { align: 'center' });
    doc.text('CONFIDENTIAL — Internal Use Only', { align: 'center' });
    doc.moveDown(4);

    // Classification box
    doc.rect(doc.x, doc.y, 492, 40).fillAndStroke(lightBg, '#cbd5e1');
    doc.fillColor(darkGray).fontSize(9).font('Helvetica');
    doc.text('Document Classification: INTERNAL | Review Cycle: Quarterly | Owner: Finance/Operations Lead', doc.x + 10, doc.y - 30, { width: 472, align: 'center' });

    doc.addPage();

    // ===== TABLE OF CONTENTS =====
    sectionTitle(doc, 'TABLE OF CONTENTS', blue);
    doc.moveDown(0.5);
    const tocItems = [
      '1. Purpose & Scope',
      '2. Entity Overview',
      '3. Monthly Close Workflow',
      '4. Bank Statement Processing',
      '5. Transaction Review & Categorization',
      '6. TPS/TVQ Remittance (Quebec Entities)',
      '7. US Sales Tax & Nexus Monitoring',
      '8. Intercompany Transactions',
      '9. Accountant Package Preparation',
      '10. Filing Deadlines & Calendar',
      '11. T4A / 1099 Annual Obligations',
      '12. Roles & Responsibilities',
      '13. Escalation Procedures',
      '14. Tool Reference — Tax Dashboard',
      '15. Document Retention Policy',
    ];
    doc.fontSize(11).font('Helvetica').fillColor(darkGray);
    for (const item of tocItems) {
      doc.text(item, { indent: 20 });
      doc.moveDown(0.3);
    }

    doc.addPage();

    // ===== SECTION 1 — PURPOSE & SCOPE =====
    sectionTitle(doc, '1. PURPOSE & SCOPE', blue);
    body(doc, `This document defines the standard operating procedures for managing tax obligations across all entities in the Digital Empire Group. It covers monthly bookkeeping close, sales tax remittance, annual compliance obligations, and the use of the Tax Dashboard application.`);
    body(doc, `Scope: 7 entities (4 Canadian/Quebec, 3 US — Wyoming, Delaware, New York). All team members involved in financial operations must follow these procedures.`);
    doc.moveDown(0.5);

    // ===== SECTION 2 — ENTITY OVERVIEW =====
    sectionTitle(doc, '2. ENTITY OVERVIEW', blue);
    subSection(doc, 'Canadian Entities (Quebec)');
    body(doc, `All Canadian entities are registered in Quebec and are required to collect and remit TPS (5%) and TVQ (9.975%) on Quebec sales. Each entity has its own TPS and TVQ registration numbers entered in the Tax Dashboard.`);
    bullet(doc, 'Filing frequency: Monthly (default) or Quarterly');
    bullet(doc, 'Currency: CAD');
    bullet(doc, 'Tax obligations: TPS/TVQ remittance, T4A slips for subcontractors >$500/year');
    doc.moveDown(0.3);

    subSection(doc, 'US Entities');
    body(doc, `US entities are incorporated in Wyoming, Delaware, and New York. Each state has different sales tax rules and economic nexus thresholds.`);
    bullet(doc, 'Wyoming: $100K revenue OR 200 transactions — sales tax required');
    bullet(doc, 'Delaware: No state sales tax');
    bullet(doc, 'New York: $500K revenue AND 100 transactions — marketplace facilitator rules apply');
    bullet(doc, 'Currency: USD');
    bullet(doc, 'Tax obligations: State sales tax (if nexus met), 1099 for contractors >$600/year');
    doc.moveDown(0.5);

    // ===== SECTION 3 — MONTHLY CLOSE WORKFLOW =====
    doc.addPage();
    sectionTitle(doc, '3. MONTHLY CLOSE WORKFLOW', blue);
    body(doc, `Each month, every entity must complete the following steps. The Monthly Close Checklist in the Tax Dashboard tracks progress automatically.`);
    doc.moveDown(0.3);
    const steps = [
      ['Day 1-3', 'Collect all bank statements for the previous month from each financial institution'],
      ['Day 1-3', 'Collect all subcontractor invoices and receipts'],
      ['Day 3-5', 'Upload bank statement PDFs to Tax Dashboard (Upload Statement page)'],
      ['Day 3-5', 'AI extraction processes transactions automatically'],
      ['Day 5-8', 'Review AI-categorized transactions in Review Queue — approve, re-categorize, or flag'],
      ['Day 5-8', 'Split revenue by jurisdiction (Quebec/Ontario/US/Other/International) for each income transaction'],
      ['Day 5-8', 'Mark expense transactions that include TPS/TVQ for ITC/ITR calculation'],
      ['Day 8-10', 'Generate TPS/TVQ report in Tax Periods page (Quebec entities only)'],
      ['Day 8-10', 'Review intercompany transactions and ensure matching entries exist'],
      ['Day 10-12', 'Export accountant package (Excel + PDF + cover note)'],
      ['Day 10-12', 'Send package to accountant using the email template'],
      ['Day 12-15', 'Address any accountant feedback, make corrections'],
      ['By filing deadline', 'Confirm TPS/TVQ remittance is filed and paid'],
      ['End of month', 'Mark Monthly Close checklist as complete'],
    ];
    for (const [timeline, step] of steps) {
      doc.fontSize(9).font('Helvetica-Bold').fillColor(blue).text(timeline, { continued: true, width: 120 });
      doc.font('Helvetica').fillColor(darkGray).text(`  ${step}`);
      doc.moveDown(0.2);
    }
    doc.moveDown(0.5);

    // ===== SECTION 4 — BANK STATEMENT PROCESSING =====
    doc.addPage();
    sectionTitle(doc, '4. BANK STATEMENT PROCESSING', blue);
    subSection(doc, 'Statement Collection');
    body(doc, `Download PDF statements from each bank\'s online portal by the 3rd business day of the month. Ensure the statement covers the full calendar month (1st to last day).`);
    body(doc, `File naming convention: [ShortCode]_[Bank]_[YYYY-MM].pdf — e.g., ACME_TD_2026-03.pdf`);
    doc.moveDown(0.3);

    subSection(doc, 'Upload Process');
    bullet(doc, 'Navigate to Upload Statement in the Tax Dashboard');
    bullet(doc, 'Select the correct company and bank account');
    bullet(doc, 'Upload the PDF — Claude AI will automatically extract transactions');
    bullet(doc, 'Verify the extraction results: check transaction count, total amounts, date range');
    bullet(doc, 'If extraction looks wrong, delete and re-upload with a cleaner PDF');
    doc.moveDown(0.3);

    subSection(doc, 'Missing Statements');
    body(doc, `If a statement is not received by Day 5, send the Missing Statement email template to the responsible person. Escalate to the operations lead if still missing by Day 10.`);
    doc.moveDown(0.5);

    // ===== SECTION 5 — TRANSACTION REVIEW =====
    sectionTitle(doc, '5. TRANSACTION REVIEW & CATEGORIZATION', blue);
    body(doc, `Every transaction extracted from bank statements must be reviewed and categorized before it is included in tax calculations.`);
    doc.moveDown(0.3);
    subSection(doc, 'Review Queue Process');
    bullet(doc, 'AI pre-categorizes each transaction with a confidence score');
    bullet(doc, 'High confidence (>80%): Quick-verify and approve');
    bullet(doc, 'Medium confidence (50-80%): Review description, select correct category');
    bullet(doc, 'Low confidence (<50%): Investigate — check bank records, receipts, ask team');
    doc.moveDown(0.3);

    subSection(doc, 'Revenue Split (Income Transactions)');
    body(doc, `For every income transaction, you MUST split the revenue by jurisdiction. The split must equal the total transaction amount. This determines TPS/TVQ collectability.`);
    bullet(doc, 'Quebec sales: Subject to TPS (5%) + TVQ (9.975%)');
    bullet(doc, 'Ontario / Other Canada: Not subject to TVQ, may be subject to TPS');
    bullet(doc, 'US sales: Not subject to Canadian tax; track for nexus purposes');
    bullet(doc, 'International: Not subject to Canadian sales tax');
    doc.moveDown(0.3);

    subSection(doc, 'Pattern Rules');
    body(doc, `When you categorize a recurring transaction, the system will offer to create a Pattern Rule. Accept this to auto-categorize future transactions with the same vendor/description. Manage rules in the Patterns page.`);
    doc.moveDown(0.5);

    // ===== SECTION 6 — TPS/TVQ =====
    doc.addPage();
    sectionTitle(doc, '6. TPS/TVQ REMITTANCE (QUEBEC ENTITIES)', blue);
    body(doc, `Quebec-registered entities must collect and remit TPS (GST) at 5% and TVQ (QST) at 9.975% on sales made to Quebec customers.`);
    doc.moveDown(0.3);

    subSection(doc, 'Calculation');
    bullet(doc, 'TPS Collected = Quebec Sales Amount x 5%');
    bullet(doc, 'TVQ Collected = Quebec Sales Amount x 9.975%');
    bullet(doc, 'Input Tax Credits (ITC) = TPS paid on business expenses');
    bullet(doc, 'Input Tax Refunds (ITR) = TVQ paid on business expenses');
    bullet(doc, 'Net TPS Owing = TPS Collected - ITC');
    bullet(doc, 'Net TVQ Owing = TVQ Collected - ITR');
    bullet(doc, 'If net is negative, you are owed a refund from Revenu Quebec');
    doc.moveDown(0.3);

    subSection(doc, 'Special Rules');
    bullet(doc, 'Meals & Entertainment: Only 50% of the expense is deductible — ITC/ITR calculated on 50%');
    bullet(doc, 'Loans received and loan repayments are excluded from revenue/expense totals');
    bullet(doc, 'Intercompany transfers are excluded from tax calculations');
    doc.moveDown(0.3);

    subSection(doc, 'Filing');
    body(doc, `Generate the TPS/TVQ report from Tax Periods page. Export the TPS/TVQ Remittance Summary PDF from Reports. File through Revenu Quebec\'s online portal (Mon dossier pour les entreprises). Payment is due by the last day of the month following the reporting period.`);
    doc.moveDown(0.5);

    // ===== SECTION 7 — US SALES TAX =====
    sectionTitle(doc, '7. US SALES TAX & NEXUS MONITORING', blue);
    body(doc, `US entities must monitor economic nexus thresholds in each state where they have sales. The Tax Dashboard tracks cumulative revenue and transaction counts per state.`);
    doc.moveDown(0.3);
    bullet(doc, 'Check the US Sales Tax (Nexus) page monthly');
    bullet(doc, 'If any state shows >75% of threshold: ALERT the operations lead');
    bullet(doc, 'If threshold is exceeded: register for sales tax in that state immediately');
    bullet(doc, 'Delaware has no state sales tax — no nexus tracking needed');
    doc.moveDown(0.5);

    // ===== SECTION 8 — INTERCOMPANY =====
    doc.addPage();
    sectionTitle(doc, '8. INTERCOMPANY TRANSACTIONS', blue);
    body(doc, `Transfers between entities must be flagged as intercompany during review. This is critical for CRA/IRS audit documentation.`);
    doc.moveDown(0.3);
    bullet(doc, 'Toggle "Intercompany" on the transaction and select the counterparty entity');
    bullet(doc, 'Every intercompany debit in Entity A must have a matching credit in Entity B');
    bullet(doc, 'Check the Intercompany page monthly for unmatched transfers');
    bullet(doc, 'Document the business purpose of every intercompany transfer');
    bullet(doc, 'Arm\'s length pricing must be maintained for cross-border transfers (Canada ↔ US)');
    doc.moveDown(0.5);

    // ===== SECTION 9 — ACCOUNTANT PACKAGE =====
    sectionTitle(doc, '9. ACCOUNTANT PACKAGE PREPARATION', blue);
    body(doc, `By Day 10 of each month, prepare and send the accountant package for each entity.`);
    doc.moveDown(0.3);
    subSection(doc, 'Package Contents');
    bullet(doc, 'Monthly P&L report (Excel) — exported from Reports page');
    bullet(doc, 'TPS/TVQ Remittance Summary PDF (Quebec entities only)');
    bullet(doc, 'Original bank statement PDFs');
    bullet(doc, 'Subcontractor invoices');
    bullet(doc, 'Accountant cover note (PDF) — auto-generated with contents listing');
    doc.moveDown(0.3);

    subSection(doc, 'Sending');
    bullet(doc, 'Use the "Accountant Package Send" email template from the Tax Dashboard');
    bullet(doc, 'Fill in the highlighted dollar amounts from the report');
    bullet(doc, 'Attach all files and send to accountant');
    bullet(doc, 'Log the send date in the Filing Deadlines tracker');
    doc.moveDown(0.5);

    // ===== SECTION 10 — FILING DEADLINES =====
    sectionTitle(doc, '10. FILING DEADLINES & CALENDAR', blue);
    body(doc, `All filing deadlines are tracked in the Tax Dashboard and in the Master Tax Tracker Excel. Auto-generated deadlines are created for TPS/TVQ monthly filings.`);
    doc.moveDown(0.3);

    subSection(doc, 'Key Deadlines');
    bullet(doc, 'TPS/TVQ Monthly: Last day of the month following the reporting period');
    bullet(doc, 'T4A Slips: Last day of February for the previous calendar year');
    bullet(doc, 'Corporate Tax Returns (Canada): 6 months after fiscal year-end');
    bullet(doc, 'US Federal/State Returns: Varies by entity type and state');
    doc.moveDown(0.3);
    body(doc, `The Dashboard highlights overdue deadlines in red and upcoming (within 14 days) in yellow. Sidebar badges show the count of upcoming + overdue items.`);
    doc.moveDown(0.5);

    // ===== SECTION 11 — T4A / 1099 =====
    doc.addPage();
    sectionTitle(doc, '11. T4A / 1099 ANNUAL OBLIGATIONS', blue);
    subSection(doc, 'Canada — T4A');
    body(doc, `Any subcontractor paid more than $500 CAD in a calendar year must receive a T4A slip. The Vendor Annual Totals sheet in the Master Tax Tracker highlights these automatically in red.`);
    bullet(doc, 'Review vendor totals in December and January');
    bullet(doc, 'Confirm contractor details (name, SIN/BN, address)');
    bullet(doc, 'File T4A slips by end of February');
    doc.moveDown(0.3);

    subSection(doc, 'USA — 1099-NEC');
    body(doc, `Any US contractor paid more than $600 USD must receive a 1099-NEC form.`);
    bullet(doc, 'Collect W-9 forms from all US contractors before first payment');
    bullet(doc, 'File 1099-NEC by January 31 of the following year');
    doc.moveDown(0.5);

    // ===== SECTION 12 — ROLES =====
    sectionTitle(doc, '12. ROLES & RESPONSIBILITIES', blue);
    doc.moveDown(0.3);
    const roles = [
      ['Admin', 'Full access. Manages companies, users, settings. Responsible for filing deadlines and escalations.'],
      ['Reviewer', 'Reviews and categorizes transactions. Prepares accountant packages. Cannot modify company settings or user roles.'],
      ['Viewer', 'Read-only access to dashboards and reports. Cannot modify any data.'],
    ];
    for (const [role, desc] of roles) {
      doc.fontSize(10).font('Helvetica-Bold').fillColor(blue).text(role);
      doc.fontSize(9).font('Helvetica').fillColor(darkGray).text(desc);
      doc.moveDown(0.3);
    }
    doc.moveDown(0.5);

    // ===== SECTION 13 — ESCALATION =====
    sectionTitle(doc, '13. ESCALATION PROCEDURES', blue);
    body(doc, `Use the Internal Escalation email template in the Tax Dashboard for flagging issues.`);
    doc.moveDown(0.3);
    const escalations = [
      ['Low (FYI)', 'Minor discrepancies, questions for accountant. No deadline impact.'],
      ['Medium', 'Missing statements past Day 10, unmatched intercompany transfers, transaction categorization disputes. Resolve within 5 business days.'],
      ['High (URGENT)', 'Missed filing deadline, CRA/IRS notice, nexus threshold exceeded, suspected fraud. Escalate to operations lead immediately.'],
    ];
    for (const [level, desc] of escalations) {
      doc.fontSize(10).font('Helvetica-Bold').fillColor(level.includes('URGENT') ? '#dc2626' : level === 'Medium' ? '#d97706' : blue).text(level);
      doc.fontSize(9).font('Helvetica').fillColor(darkGray).text(desc);
      doc.moveDown(0.3);
    }
    doc.moveDown(0.5);

    // ===== SECTION 14 — TOOL REFERENCE =====
    doc.addPage();
    sectionTitle(doc, '14. TOOL REFERENCE — TAX DASHBOARD', blue);
    body(doc, `The Tax Dashboard is the central tool for all tax management operations. Below is a reference for each module.`);
    doc.moveDown(0.3);
    const modules = [
      ['Dashboard', 'Overview of all entities — income, expenses, net, TPS/TVQ status, warning badges'],
      ['Upload Statement', 'Upload bank statement PDFs for AI extraction'],
      ['Review Queue', 'Review and categorize AI-extracted transactions'],
      ['Tax Periods', 'Generate and manage TPS/TVQ reports, mark as filed'],
      ['US Sales Tax', 'Monitor economic nexus thresholds per state'],
      ['Intercompany', 'View and audit intercompany transactions'],
      ['Reports', 'Monthly/annual reports, Excel exports, PDF summaries, accountant packages'],
      ['Monthly Close', 'Checklist for each entity\'s monthly close process'],
      ['Patterns', 'Manage auto-categorization rules'],
      ['AI Advisor', 'Ask tax questions with full context awareness'],
      ['Settings', 'Company CRUD, user management, audit log'],
      ['Catch-Up Board', 'Prioritized view of all overdue periods, sorted oldest-first'],
    ];
    for (const [module, desc] of modules) {
      doc.fontSize(10).font('Helvetica-Bold').fillColor(blue).text(module, { continued: true });
      doc.font('Helvetica').fillColor(darkGray).text(` — ${desc}`);
      doc.moveDown(0.2);
    }
    doc.moveDown(0.5);

    // ===== SECTION 15 — DOCUMENT RETENTION =====
    sectionTitle(doc, '15. DOCUMENT RETENTION POLICY', blue);
    body(doc, `All financial records must be retained for the following minimum periods:`);
    doc.moveDown(0.3);
    bullet(doc, 'Canada (CRA): 6 years from end of the tax year');
    bullet(doc, 'US (IRS): 7 years from filing date');
    bullet(doc, 'Bank statements, invoices, receipts: Stored in Tax Dashboard + local backup');
    bullet(doc, 'Tax filings and confirmation numbers: Stored in Filing Deadlines tracker');
    bullet(doc, 'Intercompany documentation: Retain indefinitely');
    doc.moveDown(1);

    body(doc, `The folder structure in "Tax Documents/" mirrors this policy with per-company, per-year, per-month organization. Never delete original bank statement PDFs.`);

    doc.moveDown(2);
    doc.fontSize(8).fillColor('#9ca3af').text('End of Document — Generated by Tax Dashboard', { align: 'center' });
    doc.text(`Version 1.0 — ${new Date().toLocaleDateString('en-CA')}`, { align: 'center' });

    doc.end();
  } catch (err: any) {
    console.error('SOP generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate SOP' });
  }
});

function sectionTitle(doc: PDFKit.PDFDocument, text: string, color: string) {
  doc.moveDown(0.5);
  doc.fontSize(14).font('Helvetica-Bold').fillColor(color).text(text);
  doc.moveDown(0.3);
  // Underline
  const y = doc.y;
  doc.moveTo(doc.x, y).lineTo(doc.x + 492, y).strokeColor(color).lineWidth(1).stroke();
  doc.moveDown(0.5);
}

function subSection(doc: PDFKit.PDFDocument, text: string) {
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#374151').text(text);
  doc.moveDown(0.3);
}

function body(doc: PDFKit.PDFDocument, text: string) {
  doc.fontSize(9.5).font('Helvetica').fillColor('#1f2937').text(text, { lineGap: 2 });
  doc.moveDown(0.3);
}

function bullet(doc: PDFKit.PDFDocument, text: string) {
  doc.fontSize(9.5).font('Helvetica').fillColor('#1f2937').text(`•  ${text}`, { indent: 15, lineGap: 1 });
  doc.moveDown(0.15);
}
