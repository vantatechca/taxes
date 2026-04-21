// Demo data for running without Supabase
import { randomUUID } from 'crypto';

const companyIds = {
  acme: randomUUID(),
  vertex: randomUUID(),
  nova: randomUUID(),
  atlas: randomUUID(),
  wyoming: randomUUID(),
  delaware: randomUUID(),
  newyork: randomUUID(),
};

export const DEMO_COMPANIES = [
  { id: companyIds.acme, name: 'ACME Digital Inc.', short_code: 'ACME', type: 'quebec_inc', jurisdiction: 'QC', tps_number: 'RT0001', tvq_number: 'TQ0001', filing_frequency: 'monthly', fiscal_year_end: '12-31', created_at: '2025-01-01' },
  { id: companyIds.vertex, name: 'Vertex Media Corp.', short_code: 'VERTEX', type: 'quebec_inc', jurisdiction: 'QC', tps_number: 'RT0002', tvq_number: 'TQ0002', filing_frequency: 'monthly', fiscal_year_end: '12-31', created_at: '2025-01-01' },
  { id: companyIds.nova, name: 'Nova Commerce SENC', short_code: 'NOVA', type: 'quebec_inc', jurisdiction: 'QC', tps_number: 'RT0003', tvq_number: 'TQ0003', filing_frequency: 'quarterly', fiscal_year_end: '12-31', created_at: '2025-01-01' },
  { id: companyIds.atlas, name: 'Atlas Consulting Ltée', short_code: 'ATLAS', type: 'federal_corp', jurisdiction: 'QC', tps_number: 'RT0004', tvq_number: 'TQ0004', filing_frequency: 'monthly', fiscal_year_end: '03-31', created_at: '2025-01-01' },
  { id: companyIds.wyoming, name: 'WY Holdings LLC', short_code: 'WYLLC', type: 'us_llc', jurisdiction: 'US-WY', tps_number: null, tvq_number: null, filing_frequency: 'quarterly', fiscal_year_end: '12-31', created_at: '2025-01-01' },
  { id: companyIds.delaware, name: 'DE Tech Corp.', short_code: 'DETEC', type: 'us_corp', jurisdiction: 'US-DE', tps_number: null, tvq_number: null, filing_frequency: 'quarterly', fiscal_year_end: '12-31', created_at: '2025-01-01' },
  { id: companyIds.newyork, name: 'NY Agency Inc.', short_code: 'NYAGC', type: 'us_corp', jurisdiction: 'US-NY', tps_number: null, tvq_number: null, filing_frequency: 'monthly', fiscal_year_end: '12-31', created_at: '2025-01-01' },
];

const bankAccountIds: Record<string, string> = {};
export const DEMO_BANK_ACCOUNTS = DEMO_COMPANIES.map(c => {
  const id = randomUUID();
  bankAccountIds[c.id] = id;
  return {
    id,
    company_id: c.id,
    bank_name: c.jurisdiction === 'QC' ? 'Desjardins' : 'Chase',
    account_type: 'checking',
    currency: c.jurisdiction === 'QC' ? 'CAD' : 'USD',
    nickname: `${c.short_code} Main`,
    account_number_last4: String(1000 + Math.floor(Math.random() * 9000)),
    is_active: true,
    companies: { name: c.name, short_code: c.short_code },
  };
});

function makeTransactions(companyId: string, companyName: string, shortCode: string, jurisdiction: string, count: number) {
  const txns: any[] = [];
  const isCA = jurisdiction === 'QC';
  const currency = isCA ? 'CAD' : 'USD';
  const incomeDescs = ['Shopify payout', 'Client invoice payment', 'Stripe transfer', 'PayPal deposit', 'Etsy payout'];
  const expenseDescs = ['Google Ads', 'Shopify subscription', 'Adobe Creative Cloud', 'AWS hosting', 'Fiverr contractor', 'Uber Eats team lunch', 'WestJet flight', 'Office supplies Amazon', 'Bank monthly fee', 'Interac e-Transfer'];
  const incomeCategories = ['income_ecommerce', 'income_agency', 'income_other'];
  const expenseCategories = ['expense_advertising', 'expense_software_subscriptions', 'expense_platform_fees', 'expense_wages_contractors', 'expense_web_hosting', 'expense_meals_entertainment', 'expense_travel', 'expense_office_supplies', 'expense_banking_fees'];

  for (let i = 0; i < count; i++) {
    const isCredit = Math.random() > 0.55;
    const amount = isCredit
      ? Math.round((500 + Math.random() * 15000) * 100) / 100
      : Math.round((20 + Math.random() * 3000) * 100) / 100;
    const month = Math.floor(Math.random() * 3) + 1; // Jan-Mar 2026
    const day = Math.floor(Math.random() * 28) + 1;
    const date = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const reviewed = Math.random() > 0.3;
    const cat = isCredit
      ? incomeCategories[Math.floor(Math.random() * incomeCategories.length)]
      : expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
    const desc = isCredit
      ? incomeDescs[Math.floor(Math.random() * incomeDescs.length)]
      : expenseDescs[Math.floor(Math.random() * expenseDescs.length)];

    const quebecSales = isCredit && isCA ? amount * 0.7 : 0;
    const tpsCollectable = isCredit ? quebecSales * 0.05 : 0;
    const tvqCollectable = isCredit ? quebecSales * 0.09975 : 0;
    const includesTax = !isCredit && isCA && Math.random() > 0.3;
    const tpsReclaimable = includesTax ? amount / 1.14975 * 0.05 : 0;
    const tvqReclaimable = includesTax ? amount / 1.14975 * 0.09975 : 0;

    txns.push({
      id: randomUUID(),
      company_id: companyId,
      bank_account_id: bankAccountIds[companyId],
      statement_id: null,
      date,
      description_raw: desc,
      amount,
      type: isCredit ? 'credit' : 'debit',
      currency,
      category: reviewed ? cat : 'uncategorized',
      ai_category_suggestion: cat,
      ai_confidence: 0.6 + Math.random() * 0.35,
      is_reviewed: reviewed,
      is_intercompany: false,
      quebec_sales_amount: quebecSales,
      ontario_sales_amount: isCredit && isCA ? amount * 0.1 : 0,
      us_sales_amount: isCredit && !isCA ? amount : (isCredit ? amount * 0.15 : 0),
      other_canada_sales_amount: 0,
      international_sales_amount: isCredit ? amount * 0.05 : 0,
      tps_collectable: tpsCollectable,
      tvq_collectable: tvqCollectable,
      tps_reclaimable: tpsReclaimable,
      tvq_reclaimable: tvqReclaimable,
      includes_canadian_tax: includesTax,
      notes: '',
      companies: { name: companyName, short_code: shortCode, jurisdiction },
      bank_accounts: { currency },
    });
  }
  return txns;
}

export const DEMO_TRANSACTIONS: any[] = [
  ...makeTransactions(companyIds.acme, 'ACME Digital Inc.', 'ACME', 'QC', 45),
  ...makeTransactions(companyIds.vertex, 'Vertex Media Corp.', 'VERTEX', 'QC', 30),
  ...makeTransactions(companyIds.nova, 'Nova Commerce SENC', 'NOVA', 'QC', 25),
  ...makeTransactions(companyIds.atlas, 'Atlas Consulting Ltée', 'ATLAS', 'QC', 20),
  ...makeTransactions(companyIds.wyoming, 'WY Holdings LLC', 'WYLLC', 'US-WY', 15),
  ...makeTransactions(companyIds.delaware, 'DE Tech Corp.', 'DETEC', 'US-DE', 12),
  ...makeTransactions(companyIds.newyork, 'NY Agency Inc.', 'NYAGC', 'US-NY', 18),
];

export const DEMO_STATEMENTS = DEMO_COMPANIES.slice(0, 4).flatMap(c => [1, 2, 3].map(month => ({
  id: randomUUID(),
  company_id: c.id,
  bank_account_id: bankAccountIds[c.id],
  file_name: `${c.short_code}_Desjardins_2026-${String(month).padStart(2, '0')}.pdf`,
  file_path: '',
  period_start: `2026-${String(month).padStart(2, '0')}-01`,
  period_end: `2026-${String(month).padStart(2, '0')}-${month === 2 ? 28 : 30}`,
  status: 'processed',
  uploaded_at: `2026-${String(month + 1).padStart(2, '0')}-03`,
  currency: 'CAD',
  companies: { name: c.name, short_code: c.short_code },
  bank_accounts: { bank_name: 'Desjardins', currency: 'CAD', account_type: 'checking' },
})));

export const DEMO_INVOICES = [
  { id: randomUUID(), company_id: companyIds.acme, vendor_name: 'Jean-Pierre Tremblay', amount: 2500, currency: 'CAD', invoice_date: '2026-01-15', date_paid: '2026-01-20', file_name: 'JP_Tremblay_Jan2026.pdf', category: 'expense_wages_contractors', status: 'paid', notes: '', companies: { name: 'ACME Digital Inc.', short_code: 'ACME' } },
  { id: randomUUID(), company_id: companyIds.acme, vendor_name: 'Jean-Pierre Tremblay', amount: 2500, currency: 'CAD', invoice_date: '2026-02-15', date_paid: '2026-02-20', file_name: 'JP_Tremblay_Feb2026.pdf', category: 'expense_wages_contractors', status: 'paid', notes: '', companies: { name: 'ACME Digital Inc.', short_code: 'ACME' } },
  { id: randomUUID(), company_id: companyIds.acme, vendor_name: 'Marie Lafleur Design', amount: 1800, currency: 'CAD', invoice_date: '2026-01-22', date_paid: '2026-02-01', file_name: 'MLafleur_Jan.pdf', category: 'expense_wages_contractors', status: 'paid', notes: '', companies: { name: 'ACME Digital Inc.', short_code: 'ACME' } },
  { id: randomUUID(), company_id: companyIds.vertex, vendor_name: 'Pixel Perfect Agency', amount: 3200, currency: 'CAD', invoice_date: '2026-02-01', date_paid: null, file_name: 'PixelPerfect_Feb.pdf', category: 'expense_advertising', status: 'pending', notes: '', companies: { name: 'Vertex Media Corp.', short_code: 'VERTEX' } },
  { id: randomUUID(), company_id: companyIds.wyoming, vendor_name: 'John Smith Consulting', amount: 4500, currency: 'USD', invoice_date: '2026-01-10', date_paid: '2026-01-18', file_name: 'JSmith_Jan.pdf', category: 'expense_wages_contractors', status: 'paid', notes: '', companies: { name: 'WY Holdings LLC', short_code: 'WYLLC' } },
  { id: randomUUID(), company_id: companyIds.newyork, vendor_name: 'Creative Dev Studio', amount: 6800, currency: 'USD', invoice_date: '2026-03-01', date_paid: null, file_name: 'CreativeDev_Mar.pdf', category: 'expense_wages_contractors', status: 'pending', notes: '', companies: { name: 'NY Agency Inc.', short_code: 'NYAGC' } },
];

const today = new Date().toISOString().slice(0, 10);
export const DEMO_DEADLINES = DEMO_COMPANIES.filter(c => c.jurisdiction === 'QC').flatMap(c =>
  [1, 2, 3].map(month => {
    const dueDate = `2026-${String(month + 1).padStart(2, '0')}-${month + 1 === 2 ? '28' : '30'}`;
    const isPast = dueDate < today;
    return {
      id: randomUUID(),
      company_id: c.id,
      filing_type: 'TPS/TVQ Monthly',
      period_label: new Date(2026, month - 1).toLocaleString('en', { month: 'long', year: 'numeric' }),
      due_date: dueDate,
      status: isPast ? (Math.random() > 0.5 ? 'filed' : 'overdue') : 'pending',
      filed_date: isPast && Math.random() > 0.5 ? dueDate : null,
      amount_owing: Math.round(Math.random() * 3000 * 100) / 100,
      amount_paid: 0,
      notes: '',
      companies: { name: c.name, short_code: c.short_code, jurisdiction: c.jurisdiction },
    };
  })
);

export const DEMO_USER = {
  id: 'demo-user-id',
  auth_id: 'demo-auth-id',
  email: 'admin@taxdashboard.local',
  name: 'Admin',
  role: 'admin',
  is_all_companies: true,
  company_access: [],
  created_at: '2025-01-01',
};

export const DEMO_PATTERNS = [
  { id: randomUUID(), match_type: 'contains', match_string: 'SHOPIFY', assigned_category: 'income_ecommerce', is_income: true, auto_apply: true, company_id: null, times_applied: 34, created_at: '2025-06-01' },
  { id: randomUUID(), match_type: 'contains', match_string: 'GOOGLE ADS', assigned_category: 'expense_advertising', is_income: false, auto_apply: true, company_id: null, times_applied: 22, created_at: '2025-06-01' },
  { id: randomUUID(), match_type: 'contains', match_string: 'STRIPE', assigned_category: 'income_ecommerce', is_income: true, auto_apply: true, company_id: null, times_applied: 41, created_at: '2025-06-01' },
  { id: randomUUID(), match_type: 'contains', match_string: 'AWS', assigned_category: 'expense_web_hosting', is_income: false, auto_apply: true, company_id: null, times_applied: 12, created_at: '2025-06-01' },
  { id: randomUUID(), match_type: 'contains', match_string: 'UBER EATS', assigned_category: 'expense_meals_entertainment', is_income: false, auto_apply: true, company_id: null, times_applied: 8, created_at: '2025-06-01' },
];

export const DEMO_CHECKLISTS = DEMO_COMPANIES.slice(0, 4).map(c => ({
  id: randomUUID(),
  company_id: c.id,
  year: 2026,
  month: 3,
  items: {
    statements_collected: Math.random() > 0.3,
    statements_uploaded: Math.random() > 0.4,
    transactions_reviewed: Math.random() > 0.5,
    revenue_split_done: Math.random() > 0.5,
    tax_report_generated: Math.random() > 0.6,
    accountant_package_sent: Math.random() > 0.7,
    filing_confirmed: Math.random() > 0.8,
    checklist_complete: false,
  },
  companies: { name: c.name, short_code: c.short_code, jurisdiction: c.jurisdiction },
}));

export { companyIds };
