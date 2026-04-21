export const CATEGORIES = {
  // Income
  income_ecommerce: { label: 'E-Commerce / Shopify', group: 'income', icon: '🛒' },
  income_agency: { label: 'Agency Services', group: 'income', icon: '💼' },
  income_loan_received: { label: 'Loan Received', group: 'income', icon: '🏦', warning: 'Loans received are NOT taxable income' },
  income_intercompany_transfer: { label: 'Intercompany Transfer In', group: 'income', icon: '🔄' },
  income_other: { label: 'Other Income', group: 'income', icon: '💰' },
  // Expenses
  expense_advertising: { label: 'Advertising', group: 'expense', icon: '📢' },
  expense_software_subscriptions: { label: 'Software & Subscriptions', group: 'expense', icon: '💻' },
  expense_platform_fees: { label: 'Platform Fees', group: 'expense', icon: '🏪' },
  expense_wages_contractors: { label: 'Contractors / Wages', group: 'expense', icon: '👷' },
  expense_web_hosting: { label: 'Web Hosting', group: 'expense', icon: '🌐' },
  expense_travel: { label: 'Travel', group: 'expense', icon: '✈️' },
  expense_meals_entertainment: { label: 'Meals & Entertainment', group: 'expense', icon: '🍽️', warning: 'Only 50% deductible (CRA/Revenu Quebec rule)' },
  expense_office_supplies: { label: 'Office Supplies', group: 'expense', icon: '📎' },
  expense_banking_fees: { label: 'Banking Fees', group: 'expense', icon: '🏧' },
  expense_intercompany_transfer: { label: 'Intercompany Transfer Out', group: 'expense', icon: '🔄' },
  expense_loan_repayment: { label: 'Loan Repayment', group: 'expense', icon: '💳', warning: 'This is NOT a tax-deductible expense — it reduces a liability' },
  expense_gas_vehicle: { label: 'Gas & Vehicle', group: 'expense', icon: '⛽' },
  expense_shipping: { label: 'Shipping', group: 'expense', icon: '📦' },
  expense_professional_services: { label: 'Professional Services', group: 'expense', icon: '⚖️' },
  expense_team_transfer: { label: 'Team Transfer', group: 'expense', icon: '💸' },
  expense_other: { label: 'Other Expense', group: 'expense', icon: '📋' },
  // Default
  uncategorized: { label: 'Uncategorized', group: 'none', icon: '❓' },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;

export const JURISDICTIONS = {
  QC: { label: 'Quebec, Canada', country: 'CA', currency: 'CAD' },
  'US-WY': { label: 'Wyoming, USA', country: 'US', currency: 'USD' },
  'US-DE': { label: 'Delaware, USA', country: 'US', currency: 'USD' },
  'US-NY': { label: 'New York, USA', country: 'US', currency: 'USD' },
} as const;

export const COMPANY_TYPES = {
  quebec_inc: 'Quebec Inc.',
  federal_corp: 'Federal Corp (Canada)',
  us_llc: 'US LLC',
  us_corp: 'US Corp',
} as const;

export function formatCurrency(amount: number, currency: 'CAD' | 'USD' = 'CAD'): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function confidenceColor(confidence: number): string {
  if (confidence >= 0.85) return 'text-green-400';
  if (confidence >= 0.6) return 'text-yellow-400';
  return 'text-red-400';
}

export function confidenceBg(confidence: number): string {
  if (confidence >= 0.85) return 'bg-green-500/20 text-green-400';
  if (confidence >= 0.6) return 'bg-yellow-500/20 text-yellow-400';
  return 'bg-red-500/20 text-red-400';
}
