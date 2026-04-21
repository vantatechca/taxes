-- =====================================================
-- MULTI-ENTITY TAX DASHBOARD — SUPABASE SCHEMA
-- Run this in Supabase SQL Editor or via supabase db push
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE company_type AS ENUM ('quebec_inc', 'federal_corp', 'us_llc', 'us_corp');
CREATE TYPE jurisdiction_type AS ENUM ('QC', 'US-WY', 'US-DE', 'US-NY');
CREATE TYPE currency_type AS ENUM ('CAD', 'USD');
CREATE TYPE account_type AS ENUM ('checking', 'savings', 'credit', 'loc');
CREATE TYPE statement_status AS ENUM ('pending', 'processing', 'review', 'complete');
CREATE TYPE transaction_type AS ENUM ('credit', 'debit');
CREATE TYPE pattern_match_type AS ENUM ('contains', 'starts_with', 'exact', 'regex');
CREATE TYPE period_type AS ENUM ('monthly', 'quarterly');
CREATE TYPE period_status AS ENUM ('draft', 'filed', 'paid');
CREATE TYPE filing_frequency AS ENUM ('monthly', 'quarterly', 'annual');
CREATE TYPE user_role AS ENUM ('admin', 'reviewer', 'viewer');

CREATE TYPE transaction_category AS ENUM (
  -- Income
  'income_ecommerce',
  'income_agency',
  'income_loan_received',
  'income_intercompany_transfer',
  'income_other',
  -- Expenses
  'expense_advertising',
  'expense_software_subscriptions',
  'expense_platform_fees',
  'expense_wages_contractors',
  'expense_web_hosting',
  'expense_travel',
  'expense_meals_entertainment',
  'expense_office_supplies',
  'expense_banking_fees',
  'expense_intercompany_transfer',
  'expense_loan_repayment',
  'expense_gas_vehicle',
  'expense_shipping',
  'expense_professional_services',
  'expense_team_transfer',
  'expense_other',
  -- Default
  'uncategorized'
);

-- =====================================================
-- TABLES
-- =====================================================

-- Companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT '',
  short_code TEXT NOT NULL,
  type company_type NOT NULL,
  jurisdiction jurisdiction_type NOT NULL,
  tax_id_canada TEXT,
  tax_id_us TEXT,
  tps_number TEXT,
  tvq_number TEXT,
  filing_frequency filing_frequency NOT NULL DEFAULT 'monthly',
  fiscal_year_end TEXT NOT NULL DEFAULT '12-31',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bank Accounts
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_number_last4 TEXT,
  currency currency_type NOT NULL DEFAULT 'CAD',
  account_type account_type NOT NULL DEFAULT 'checking',
  nickname TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Statements (uploaded PDF bank statements)
CREATE TABLE statements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  file_url TEXT,
  file_name TEXT,
  period_start DATE,
  period_end DATE,
  currency currency_type NOT NULL DEFAULT 'CAD',
  status statement_status NOT NULL DEFAULT 'pending',
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Transaction Patterns (for auto-categorization)
CREATE TABLE transaction_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL = global
  match_type pattern_match_type NOT NULL DEFAULT 'contains',
  match_string TEXT NOT NULL,
  assigned_category transaction_category NOT NULL,
  assigned_subcategory TEXT,
  is_income BOOLEAN NOT NULL DEFAULT FALSE,
  auto_apply BOOLEAN NOT NULL DEFAULT FALSE,
  times_applied INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  statement_id UUID NOT NULL REFERENCES statements(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description_raw TEXT NOT NULL,
  description_clean TEXT,
  amount NUMERIC(12,2) NOT NULL,
  type transaction_type NOT NULL,
  currency currency_type NOT NULL DEFAULT 'CAD',
  category transaction_category NOT NULL DEFAULT 'uncategorized',
  subcategory TEXT,
  notes TEXT,
  is_intercompany BOOLEAN NOT NULL DEFAULT FALSE,
  intercompany_company_id UUID REFERENCES companies(id),
  is_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  ai_category_suggestion transaction_category,
  ai_confidence NUMERIC(3,2) DEFAULT 0.0,
  pattern_id UUID REFERENCES transaction_patterns(id),
  -- Revenue split fields (for income transactions)
  quebec_sales_amount NUMERIC(12,2),
  ontario_sales_amount NUMERIC(12,2),
  us_sales_amount NUMERIC(12,2),
  other_canada_sales_amount NUMERIC(12,2),
  international_sales_amount NUMERIC(12,2),
  -- Tax fields
  tps_collectable NUMERIC(12,2),
  tvq_collectable NUMERIC(12,2),
  tps_reclaimable NUMERIC(12,2),
  tvq_reclaimable NUMERIC(12,2),
  includes_canadian_tax BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tax Periods
CREATE TABLE tax_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  period_type period_type NOT NULL DEFAULT 'monthly',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  jurisdiction jurisdiction_type NOT NULL,
  tps_collected NUMERIC(12,2) DEFAULT 0,
  tvq_collected NUMERIC(12,2) DEFAULT 0,
  tps_itc NUMERIC(12,2) DEFAULT 0,
  tvq_itr NUMERIC(12,2) DEFAULT 0,
  tps_net_owing NUMERIC(12,2) DEFAULT 0,
  tvq_net_owing NUMERIC(12,2) DEFAULT 0,
  status period_status NOT NULL DEFAULT 'draft',
  filed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, period_start, period_end)
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE, -- links to Supabase Auth
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  role user_role NOT NULL DEFAULT 'viewer',
  company_access UUID[] DEFAULT '{}', -- empty array = all companies
  is_all_companies BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Advisory Log
CREATE TABLE ai_advisory_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  company_id UUID REFERENCES companies(id),
  question TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_transactions_company ON transactions(company_id);
CREATE INDEX idx_transactions_statement ON transactions(statement_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_reviewed ON transactions(is_reviewed);
CREATE INDEX idx_statements_company ON statements(company_id);
CREATE INDEX idx_bank_accounts_company ON bank_accounts(company_id);
CREATE INDEX idx_tax_periods_company ON tax_periods(company_id);
CREATE INDEX idx_patterns_match ON transaction_patterns(match_string);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- =====================================================
-- SEED DATA — 7 Companies
-- =====================================================

INSERT INTO companies (short_code, name, type, jurisdiction, filing_frequency) VALUES
  ('QC1', '', 'quebec_inc', 'QC', 'monthly'),
  ('QC2', '', 'quebec_inc', 'QC', 'monthly'),
  ('QC3', '', 'federal_corp', 'QC', 'monthly'),
  ('QC4', '', 'federal_corp', 'QC', 'monthly'),
  ('WY1', '', 'us_llc', 'US-WY', 'quarterly'),
  ('DE1', '', 'us_corp', 'US-DE', 'quarterly'),
  ('NY1', '', 'us_corp', 'US-NY', 'quarterly');

-- =====================================================
-- SEED DATA — Global Transaction Patterns
-- =====================================================

INSERT INTO transaction_patterns (company_id, match_type, match_string, assigned_category, is_income, auto_apply) VALUES
  (NULL, 'contains', 'SHOPIFY', 'income_ecommerce', TRUE, TRUE),
  (NULL, 'contains', 'GOOGLE ADS', 'expense_advertising', FALSE, TRUE),
  (NULL, 'starts_with', 'GOOGLE*', 'expense_advertising', FALSE, FALSE),
  (NULL, 'contains', 'META PLATFORMS', 'expense_advertising', FALSE, TRUE),
  (NULL, 'contains', 'TIKTOK', 'expense_advertising', FALSE, TRUE),
  (NULL, 'contains', 'MERCURY', 'expense_banking_fees', FALSE, FALSE),
  (NULL, 'contains', 'STRIPE', 'income_ecommerce', TRUE, TRUE),
  (NULL, 'contains', 'PAYPAL', 'income_ecommerce', TRUE, FALSE),
  (NULL, 'contains', 'CLOUDFLARE', 'expense_web_hosting', FALSE, TRUE),
  (NULL, 'contains', 'RENDER', 'expense_web_hosting', FALSE, TRUE),
  (NULL, 'contains', 'OPENAI', 'expense_software_subscriptions', FALSE, TRUE),
  (NULL, 'contains', 'ANTHROPIC', 'expense_software_subscriptions', FALSE, TRUE),
  (NULL, 'contains', 'PETRO', 'expense_gas_vehicle', FALSE, TRUE),
  (NULL, 'contains', 'ESSO', 'expense_gas_vehicle', FALSE, TRUE),
  (NULL, 'contains', 'SHELL', 'expense_gas_vehicle', FALSE, TRUE),
  (NULL, 'contains', 'COUCHE-TARD', 'expense_gas_vehicle', FALSE, TRUE),
  (NULL, 'contains', 'AIRWALLEX', 'expense_banking_fees', FALSE, FALSE),
  (NULL, 'contains', 'WISE', 'expense_team_transfer', FALSE, FALSE),
  (NULL, 'contains', 'TRANSFERWISE', 'expense_team_transfer', FALSE, FALSE);

-- =====================================================
-- ROW LEVEL SECURITY (basic policies)
-- =====================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_advisory_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all data (fine-grained access in app layer)
CREATE POLICY "Authenticated users can read companies" ON companies FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can read bank_accounts" ON bank_accounts FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can read statements" ON statements FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can read transactions" ON transactions FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can read patterns" ON transaction_patterns FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can read tax_periods" ON tax_periods FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can read users" ON users FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can read advisory_log" ON ai_advisory_log FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can read audit_log" ON audit_log FOR SELECT TO authenticated USING (TRUE);

-- Allow service role full access (backend uses service role key)
CREATE POLICY "Service role full access companies" ON companies FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Service role full access bank_accounts" ON bank_accounts FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Service role full access statements" ON statements FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Service role full access transactions" ON transactions FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Service role full access patterns" ON transaction_patterns FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Service role full access tax_periods" ON tax_periods FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Service role full access users" ON users FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Service role full access advisory_log" ON ai_advisory_log FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Service role full access audit_log" ON audit_log FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- Storage bucket for PDF uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('statements', 'statements', FALSE)
ON CONFLICT DO NOTHING;
