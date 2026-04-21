# Tax Dashboard

A full-stack multi-company tax management platform for e-commerce businesses operating across Canada (Quebec, Federal) and the United States (Wyoming, Delaware, New York). Handles bank statement processing, AI-powered transaction categorization, TPS/TVQ filings, multi-jurisdiction compliance, and strategic tax advisory.

---

## Features

### Dashboard
- 6-month rolling revenue and expense charts per company
- Company summaries — income, expenses, TPS/TVQ, pending reviews
- Unfiled periods alert banner
- Quick navigation to all modules

### Upload
- Upload bank statements as PDF per company and bank account
- Create new bank accounts inline
- Auto-processes PDF and extracts transactions on upload
- AI suggests categories for each transaction automatically

### Review & Categorize
- Review queue for unreviewed transactions
- Bulk review multiple transactions at once
- Edit category, notes, and reviewed status per transaction
- Statement progress tracking (how many transactions reviewed)
- Create auto-categorization patterns from reviewed transactions

### Search
- Full-text search across all transactions
- Filter by date range, amount, category, company, reviewed status
- Paginated results

### Tax Periods
- Auto-generate monthly or quarterly tax periods
- TPS (5%) and TVQ (9.975%) calculations
- Mark periods as filed and paid
- Unfiled period tracking and alerts

### Reports
- Monthly tax reports per company (income, expenses by category, TPS/TVQ)
- Annual summary reports
- Export to Excel — monthly reports and full accountant packages
- Master Tax Tracker — 5-sheet Excel workbook (statements, invoices, deadlines, bank accounts, transactions summary)

### Catch-Up Board
- Kanban-style board for overdue and critical tasks
- Anomaly detection — unusual transactions flagged
- Categorization gaps — transactions missing categories
- Priority filtering

### Patterns
- Create transaction auto-categorization rules (contains, starts with, exact match, regex)
- Global or per-company patterns
- Auto-apply toggle — patterns run automatically on new transactions
- Track how many times each pattern has been applied

### Nexus (US)
- Track economic nexus by US state
- Monitor sales tax thresholds (state-by-state)
- Add and update state sales data per company per year

### Intercompany
- Matrix view of all transfers between companies
- CAD and USD tracking
- Flow visualization

### Checklist
- Monthly close checklist per company
- Items: statements downloaded, transactions reviewed, tax report generated, invoices logged, intercompany documented, US sales logged
- Completion percentage tracking

### AI Advisor
- Chat with Claude AI tax advisor
- Company context selector — advisor knows your company's situation
- Conversation history
- Quick prompts for common questions

### Fiscaliste
- Elite Canadian tax strategist chatbot
- Dual Canada/US mode
- Aggressive tax optimization strategies (ITC/ITR, holding companies, salary vs dividend)
- Saves insights for future reference

### Accountant
- AI-powered scan of all companies at once
- Health scores per company
- Detects missing filings, anomalies, reconciliation issues
- Actionable recommendations

### Filing Guide
- Comprehensive Canada and US tax filing checklists
- Direct links to official portals (ClicSEQUR, IRS, Revenue Québec, etc.)
- Province and state-by-state guidance

### Settings
- Company settings — tax IDs, TPS/TVQ numbers, filing frequency
- User management and role assignment
- Audit log of all user actions

### Onboarding
- Multi-step setup wizard for first-time admin
- Configure companies, bank accounts, and catch-up tasks
- Shown only once per admin

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19.2, Vite 8, TypeScript 6, Tailwind CSS 4.2 |
| Routing | React Router DOM 7.14 |
| Charts | Recharts 3.8 |
| Icons | Lucide React |
| Backend | Express.js 5.2, TypeScript 6, Node.js |
| Database | Supabase (PostgreSQL) with RLS |
| Auth | Supabase Auth (email/password, JWT) |
| Storage | Supabase Storage (PDF statements) |
| AI | Anthropic Claude API |
| PDF | PDFKit (server-side generation) |
| Excel | ExcelJS (client + server exports) |
| File Upload | Multer (multipart PDF uploads) |

---

## Getting Started (Local)

### 1. Install dependencies

```bash
# Frontend
cd client
npm install

# Backend
cd ../server
npm install
```

### 2. Set up environment variables

**Frontend** (`client/.env`):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Backend** (`server/.env`):
```
ANTHROPIC_API_KEY=your-claude-api-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5174
```

### 3. Set up the database

Run the migration files in your Supabase SQL editor in order:

```
supabase-migration.sql      ← V1 schema (core tables)
supabase-migration-v2.sql   ← V2 additions (categories, deadlines, checklists, invoices)
```

### 4. Run the app

```bash
# Backend (terminal 1)
cd server
npm run dev     # runs on port 3001

# Frontend (terminal 2)
cd client
npm run dev     # runs on port 5174
```

| URL | Purpose |
|---|---|
| `http://localhost:5174` | React frontend |
| `http://localhost:3001/api/health` | Backend health check |

---

## Project Structure

```
tax-dashboard/
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/             # 17 page components
│   │   ├── components/        # Layout, LoginPage, modals
│   │   ├── context/           # AuthContext, ThemeContext
│   │   ├── lib/               # API client, Supabase init, constants
│   │   └── App.tsx            # Router definition
│   ├── package.json
│   └── vite.config.ts
│
├── server/                    # Express backend
│   ├── src/
│   │   ├── routes/            # 21 route modules
│   │   ├── services/          # AI categorizer, PDF extractor, tax calculator, pattern matcher
│   │   ├── lib/               # Anthropic client, Supabase admin client
│   │   ├── middleware/        # Supabase JWT auth + role checks
│   │   └── index.ts           # Express app entry point
│   └── package.json
│
├── supabase-migration.sql     # V1 schema
├── supabase-migration-v2.sql  # V2 additions
├── .env.example               # Env template
└── README.md
```

---

## Roles & Access

| Role | Access |
|---|---|
| **Admin** | Full access — all companies, settings, user management |
| **Reviewer** | Can upload, review, and categorize transactions |
| **Viewer** | Read-only access |

---

## Companies Supported

| Entity | Type | Jurisdiction |
|---|---|---|
| Quebec Corp 1–4 | Quebec Inc | QC |
| Federal Corp | Federal Corp | Canada |
| Wyoming LLC | US LLC | US-WY |
| Delaware Corp | US Corp | US-DE |
| New York Corp | US Corp | US-NY |

---

## Environment Variables

### Frontend
| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (public) |

### Backend
| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key for AI features |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS for bulk ops) |
| `PORT` | Backend server port (default 3001) |
| `NODE_ENV` | `development` or `production` |
| `CLIENT_URL` | Frontend URL for CORS |

---

## AI Features

All AI features are powered by **Anthropic Claude**:

| Feature | What it does |
|---|---|
| **Auto-categorization** | Suggests transaction categories on upload |
| **Advisor** | General tax Q&A with company context |
| **Fiscaliste** | Aggressive Canadian tax optimization strategies |
| **Accountant Scan** | Full company health audit with recommendations |
| **Pattern learning** | Learns from reviewed transactions to improve future suggestions |
