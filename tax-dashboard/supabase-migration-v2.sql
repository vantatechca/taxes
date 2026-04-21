-- =====================================================
-- V2 MIGRATION — Dynamic categories, CRUD companies, deadlines, checklists
-- Run AFTER the initial migration
-- =====================================================

-- Custom categories table (replaces hardcoded enum for user-facing categories)
CREATE TABLE custom_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE, -- e.g. 'income_consulting'
  label TEXT NOT NULL,
  icon TEXT DEFAULT '📋',
  "group" TEXT NOT NULL CHECK ("group" IN ('income', 'expense', 'none')),
  warning TEXT, -- optional warning message
  deductibility_rate NUMERIC(3,2) DEFAULT 1.0, -- 0.5 for meals, 0 for loan repayment
  is_non_taxable BOOLEAN DEFAULT FALSE, -- loans received, loan repayment
  is_system BOOLEAN DEFAULT FALSE, -- TRUE for built-in categories, user cannot delete
  sort_order INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed all built-in categories into the editable table
INSERT INTO custom_categories (key, label, icon, "group", warning, deductibility_rate, is_non_taxable, is_system, sort_order) VALUES
  ('income_ecommerce', 'E-Commerce / Shopify', '🛒', 'income', NULL, 1.0, FALSE, TRUE, 1),
  ('income_agency', 'Agency Services', '💼', 'income', NULL, 1.0, FALSE, TRUE, 2),
  ('income_loan_received', 'Loan Received', '🏦', 'income', 'Loans received are NOT taxable income', 1.0, TRUE, TRUE, 3),
  ('income_intercompany_transfer', 'Intercompany Transfer In', '🔄', 'income', NULL, 1.0, FALSE, TRUE, 4),
  ('income_other', 'Other Income', '💰', 'income', NULL, 1.0, FALSE, TRUE, 5),
  ('expense_advertising', 'Advertising', '📢', 'expense', NULL, 1.0, FALSE, TRUE, 10),
  ('expense_software_subscriptions', 'Software & Subscriptions', '💻', 'expense', NULL, 1.0, FALSE, TRUE, 11),
  ('expense_platform_fees', 'Platform Fees', '🏪', 'expense', NULL, 1.0, FALSE, TRUE, 12),
  ('expense_wages_contractors', 'Contractors / Wages', '👷', 'expense', NULL, 1.0, FALSE, TRUE, 13),
  ('expense_web_hosting', 'Web Hosting', '🌐', 'expense', NULL, 1.0, FALSE, TRUE, 14),
  ('expense_travel', 'Travel', '✈️', 'expense', NULL, 1.0, FALSE, TRUE, 15),
  ('expense_meals_entertainment', 'Meals & Entertainment', '🍽️', 'expense', 'Only 50% deductible (CRA/Revenu Quebec rule)', 0.5, FALSE, TRUE, 16),
  ('expense_office_supplies', 'Office Supplies', '📎', 'expense', NULL, 1.0, FALSE, TRUE, 17),
  ('expense_banking_fees', 'Banking Fees', '🏧', 'expense', NULL, 1.0, FALSE, TRUE, 18),
  ('expense_intercompany_transfer', 'Intercompany Transfer Out', '🔄', 'expense', NULL, 1.0, FALSE, TRUE, 19),
  ('expense_loan_repayment', 'Loan Repayment', '💳', 'expense', 'This is NOT a tax-deductible expense — it reduces a liability', 0.0, TRUE, TRUE, 20),
  ('expense_gas_vehicle', 'Gas & Vehicle', '⛽', 'expense', NULL, 1.0, FALSE, TRUE, 21),
  ('expense_shipping', 'Shipping', '📦', 'expense', NULL, 1.0, FALSE, TRUE, 22),
  ('expense_professional_services', 'Professional Services', '⚖️', 'expense', NULL, 1.0, FALSE, TRUE, 23),
  ('expense_team_transfer', 'Team Transfer', '💸', 'expense', NULL, 1.0, FALSE, TRUE, 24),
  ('expense_other', 'Other Expense', '📋', 'expense', NULL, 1.0, FALSE, TRUE, 25),
  ('uncategorized', 'Uncategorized', '❓', 'none', NULL, 1.0, FALSE, TRUE, 99);

-- Filing deadlines table
CREATE TABLE filing_deadlines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  filing_type TEXT NOT NULL, -- 'TPS/TVQ', 'Delaware Franchise Tax', 'Wyoming Annual Report', etc.
  period_label TEXT NOT NULL, -- 'March 2025', 'Annual 2025', etc.
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'filed', 'paid', 'overdue')),
  amount_owing NUMERIC(12,2),
  amount_paid NUMERIC(12,2),
  filed_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_filing_deadlines_company ON filing_deadlines(company_id);
CREATE INDEX idx_filing_deadlines_due ON filing_deadlines(due_date);

-- Monthly close checklists
CREATE TABLE monthly_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  statements_downloaded BOOLEAN DEFAULT FALSE,
  statements_uploaded BOOLEAN DEFAULT FALSE,
  transactions_reviewed BOOLEAN DEFAULT FALSE,
  tax_report_generated BOOLEAN DEFAULT FALSE,
  tax_report_sent BOOLEAN DEFAULT FALSE,
  invoices_logged BOOLEAN DEFAULT FALSE,
  intercompany_documented BOOLEAN DEFAULT FALSE,
  us_sales_logged BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, year, month)
);

-- Subcontractor invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency currency_type NOT NULL DEFAULT 'CAD',
  invoice_date DATE NOT NULL,
  date_paid DATE,
  file_url TEXT,
  file_name TEXT,
  category TEXT DEFAULT 'expense_wages_contractors',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'disputed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_vendor ON invoices(vendor_name);

-- Vendor annual totals (materialized view for T4A tracking)
CREATE OR REPLACE VIEW vendor_annual_totals AS
SELECT
  company_id,
  vendor_name,
  currency,
  EXTRACT(YEAR FROM invoice_date) AS year,
  SUM(amount) AS total_paid,
  COUNT(*) AS invoice_count,
  CASE WHEN SUM(amount) > 500 AND currency = 'CAD' THEN TRUE ELSE FALSE END AS t4a_required
FROM invoices
WHERE status = 'paid'
GROUP BY company_id, vendor_name, currency, EXTRACT(YEAR FROM invoice_date);

-- US state sales tracking
CREATE TABLE us_state_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  state_code TEXT NOT NULL, -- 'NY', 'CA', 'TX', etc.
  year INTEGER NOT NULL,
  total_sales NUMERIC(12,2) DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  nexus_threshold_amount NUMERIC(12,2), -- cached threshold
  nexus_threshold_transactions INTEGER,
  percent_of_threshold NUMERIC(5,2) DEFAULT 0,
  at_risk BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, state_code, year)
);

-- Onboarding state tracker
CREATE TABLE onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  step TEXT NOT NULL DEFAULT 'welcome', -- welcome, companies, accounts, catch_up, complete
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for new tables
ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE filing_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE us_state_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read custom_categories" ON custom_categories FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated read filing_deadlines" ON filing_deadlines FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated read monthly_checklists" ON monthly_checklists FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated read invoices" ON invoices FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated read us_state_sales" ON us_state_sales FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated read onboarding" ON onboarding FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Service full custom_categories" ON custom_categories FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Service full filing_deadlines" ON filing_deadlines FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Service full monthly_checklists" ON monthly_checklists FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Service full invoices" ON invoices FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Service full us_state_sales" ON us_state_sales FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Service full onboarding" ON onboarding FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
