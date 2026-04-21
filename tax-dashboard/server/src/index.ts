import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDB } from './lib/db';
import { authRouter } from './routes/auth';
import { companiesRouter } from './routes/companies';
import { bankAccountsRouter } from './routes/bankAccounts';
import { statementsRouter } from './routes/statements';
import { transactionsRouter } from './routes/transactions';
import { patternsRouter } from './routes/patterns';
import { taxPeriodsRouter } from './routes/taxPeriods';
import { reportsRouter } from './routes/reports';
import { advisorRouter } from './routes/advisor';
import { usersRouter } from './routes/users';
import { categoriesRouter } from './routes/categories';
import { deadlinesRouter } from './routes/deadlines';
import { invoicesRouter } from './routes/invoices';
import { checklistsRouter } from './routes/checklists';
import { nexusRouter } from './routes/nexus';
import { trackerRouter } from './routes/tracker';
import { pdfExportsRouter } from './routes/pdfExports';
import { emailTemplatesRouter } from './routes/emailTemplates';
import { sopRouter } from './routes/sop';
import { catchUpRouter } from './routes/catchUp';
import { insightsRouter } from './routes/insights';
import { fiscalisteRouter } from './routes/fiscaliste';
import { accountantRouter } from './routes/accountant';
import { authMiddleware } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5174',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));

// Serve uploaded statement PDFs
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
}

// Health check (no auth)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes (no auth middleware)
app.use('/api/auth', authRouter);

// All other API routes require auth
app.use('/api', authMiddleware);

app.use('/api/companies', companiesRouter);
app.use('/api/bank-accounts', bankAccountsRouter);
app.use('/api/statements', statementsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/patterns', patternsRouter);
app.use('/api/tax-periods', taxPeriodsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/advisor', advisorRouter);
app.use('/api/users', usersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/deadlines', deadlinesRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/checklists', checklistsRouter);
app.use('/api/nexus', nexusRouter);
app.use('/api/tracker', trackerRouter);
app.use('/api/pdf-exports', pdfExportsRouter);
app.use('/api/email-templates', emailTemplatesRouter);
app.use('/api/sop', sopRouter);
app.use('/api/catch-up', catchUpRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/fiscaliste', fiscalisteRouter);
app.use('/api/accountant', accountantRouter);

// Catch-all for React in production
if (process.env.NODE_ENV === 'production') {
  app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

// Initialize DB then start server
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Tax Dashboard API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err.message);
    process.exit(1);
  });
