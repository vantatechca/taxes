import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { db } from '../lib/db';
import { extractTransactionsFromPDF } from '../services/pdfExtractor';
import { matchTransaction } from '../services/patternMatcher';
import { categorizeTransaction } from '../services/aiCategorizer';

const UPLOADS_DIR = path.join(__dirname, '../../uploads/statements');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({ dest: path.join(__dirname, '../../uploads/tmp/') });

export const statementsRouter = Router();

statementsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const conditions: string[] = [];
    const params: any[] = [];
    let i = 1;
    if (req.query.company_id) { conditions.push(`s.company_id = $${i++}`); params.push(req.query.company_id); }
    if (req.query.status) { conditions.push(`s.status = $${i++}`); params.push(req.query.status); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await db.query(
      `SELECT s.*, c.name as company_name, c.short_code as company_short_code,
              ba.bank_name, ba.nickname as bank_nickname, ba.currency as bank_currency
       FROM statements s LEFT JOIN companies c ON s.company_id = c.id
       LEFT JOIN bank_accounts ba ON s.bank_account_id = ba.id
       ${where} ORDER BY s.uploaded_at DESC`,
      params
    );
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

statementsRouter.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
  const { company_id, bank_account_id, period_start, period_end } = req.body;
  if (!company_id || !bank_account_id) { res.status(400).json({ error: 'company_id and bank_account_id are required' }); return; }

  try {
    // Save PDF to local disk
    const fileName = `${company_id}_${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const destPath = path.join(UPLOADS_DIR, fileName);
    fs.copyFileSync(req.file.path, destPath);
    const fileUrl = `/uploads/statements/${fileName}`;

    // Create statement record
    const { rows: stmtRows } = await db.query(
      `INSERT INTO statements (company_id, bank_account_id, file_url, file_name, period_start, period_end, status, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,'processing',$7) RETURNING *`,
      [company_id, bank_account_id, fileUrl, req.file.originalname, period_start || null, period_end || null, req.userId]
    );
    const statement = stmtRows[0];

    // Get company + bank account info
    const { rows: compRows } = await db.query('SELECT type, jurisdiction FROM companies WHERE id = $1', [company_id]);
    const company = compRows[0];
    const { rows: baRows } = await db.query('SELECT currency FROM bank_accounts WHERE id = $1', [bank_account_id]);
    const bankAccount = baRows[0];

    // Extract transactions from PDF
    const extracted = await extractTransactionsFromPDF(req.file.path);

    // Process each transaction
    const transactionRecords = [];
    for (const t of extracted) {
      const amount = t.debit || t.credit || 0;
      const type = t.credit ? 'credit' : 'debit';
      const patternMatch = await matchTransaction(t.description, company_id);
      let category = 'uncategorized', aiConfidence = 0, aiSuggestion = null, patternId = null;
      if (patternMatch) {
        category = patternMatch.pattern.assigned_category;
        aiConfidence = patternMatch.confidence;
        patternId = patternMatch.pattern.id;
        aiSuggestion = category;
      } else if (process.env.ANTHROPIC_API_KEY) {
        const aiResult = await categorizeTransaction(t.description, amount, type as 'credit' | 'debit', company?.type || 'unknown', company?.jurisdiction || 'unknown');
        category = aiResult.category; aiConfidence = aiResult.confidence; aiSuggestion = aiResult.category;
      }
      transactionRecords.push({ statement_id: statement.id, company_id, bank_account_id, date: t.date, description_raw: t.description, description_clean: t.description.replace(/\s+/g, ' ').trim(), amount, type, currency: bankAccount?.currency || 'CAD', category: patternMatch?.pattern.auto_apply ? category : 'uncategorized', ai_category_suggestion: aiSuggestion, ai_confidence: aiConfidence, pattern_id: patternId, is_reviewed: false });
    }

    // Bulk insert transactions
    if (transactionRecords.length > 0) {
      for (const t of transactionRecords) {
        await db.query(
          `INSERT INTO transactions (statement_id, company_id, bank_account_id, date, description_raw, description_clean, amount, type, currency, category, ai_category_suggestion, ai_confidence, pattern_id, is_reviewed)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
          [t.statement_id, t.company_id, t.bank_account_id, t.date, t.description_raw, t.description_clean, t.amount, t.type, t.currency, t.category, t.ai_category_suggestion, t.ai_confidence, t.pattern_id, t.is_reviewed]
        );
      }
    }

    // Update statement status
    await db.query(`UPDATE statements SET status='review', processed_at=$1 WHERE id=$2`, [new Date().toISOString(), statement.id]);

    // Cleanup temp file
    try { fs.unlinkSync(req.file.path); } catch {}

    await db.query(`INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)`,
      [req.userId, 'upload_statement', 'statement', statement.id, JSON.stringify({ transactions_extracted: transactionRecords.length })]);

    res.status(201).json({ statement: { ...statement, status: 'review' }, transactionsExtracted: transactionRecords.length });
  } catch (err: any) {
    try { if (req.file?.path) fs.unlinkSync(req.file.path); } catch {}
    res.status(500).json({ error: err.message || 'Failed to process statement' });
  }
});

statementsRouter.get('/reconciliation/:statementId', async (req: Request, res: Response) => {
  try {
    const { rows: stmtRows } = await db.query(
      `SELECT s.*, c.name as company_name, c.short_code as company_short_code, ba.bank_name, ba.currency as bank_currency
       FROM statements s LEFT JOIN companies c ON s.company_id = c.id
       LEFT JOIN bank_accounts ba ON s.bank_account_id = ba.id WHERE s.id = $1`,
      [req.params.statementId]
    );
    const statement = stmtRows[0];
    if (!statement) { res.status(404).json({ error: 'Statement not found' }); return; }
    const { rows: txns } = await db.query(
      `SELECT id, date, amount, type, description_clean, description_raw, category, is_reviewed
       FROM transactions WHERE statement_id = $1 ORDER BY date`,
      [req.params.statementId]
    );
    let totalDebits = 0, totalCredits = 0;
    const dateMismatches: any[] = [];
    for (const t of txns) {
      if (t.type === 'debit') totalDebits += Number(t.amount); else totalCredits += Number(t.amount);
      if (statement.period_start && statement.period_end && (t.date < statement.period_start || t.date > statement.period_end))
        dateMismatches.push({ id: t.id, date: t.date, description: t.description_clean || t.description_raw || '', issue: `Date outside statement period` });
    }
    const transactionNet = Math.round((totalCredits - totalDebits) * 100) / 100;
    const unreviewedCount = txns.filter((t: any) => !t.is_reviewed).length;
    res.json({ statement_id: req.params.statementId, company: statement.company_name || statement.company_short_code || '', bank: statement.bank_name || '', period: { start: statement.period_start, end: statement.period_end }, transaction_count: txns.length, total_debits: Math.round(totalDebits * 100) / 100, total_credits: Math.round(totalCredits * 100) / 100, transaction_net: transactionNet, date_mismatches: dateMismatches, unreviewed_count: unreviewedCount });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

statementsRouter.get('/:id/transactions', async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query('SELECT * FROM transactions WHERE statement_id = $1 ORDER BY date', [req.params.id]);
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
