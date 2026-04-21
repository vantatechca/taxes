// TPS/TVQ Tax Calculator — Quebec Tax Rules
// TPS (GST) = 5% federal
// TVQ (QST) = 9.975% provincial
// Total = 14.975%

export const TPS_RATE = 0.05;
export const TVQ_RATE = 0.09975;

/**
 * Calculate TPS/TVQ collectable on Quebec sales income.
 * Even if taxes weren't charged at checkout, the business owes TPS/TVQ
 * on Quebec sales for registered businesses.
 */
export function calculateCollectableTax(quebecSalesAmount: number) {
  return {
    tps: roundCurrency(quebecSalesAmount * TPS_RATE),
    tvq: roundCurrency(quebecSalesAmount * TVQ_RATE),
  };
}

/**
 * Calculate Input Tax Credits (ITC) and Input Tax Refunds (ITR)
 * for business expenses that included Canadian taxes.
 * TPS ITC = amount / 1.05 × 0.05
 * TVQ ITR = amount / 1.09975 × 0.09975
 * These assume the amount already includes tax.
 */
export function calculateReclaimableTax(amountWithTax: number) {
  const tpsITC = roundCurrency((amountWithTax / (1 + TPS_RATE)) * TPS_RATE);
  const tvqITR = roundCurrency((amountWithTax / (1 + TVQ_RATE)) * TVQ_RATE);
  return { tps: tpsITC, tvq: tvqITR };
}

/**
 * Net TPS/TVQ owing = collected - reclaimable
 * Negative = government owes the business a refund
 */
export function calculateNetTax(
  tpsCollected: number,
  tvqCollected: number,
  tpsITC: number,
  tvqITR: number
) {
  return {
    tpsNetOwing: roundCurrency(tpsCollected - tpsITC),
    tvqNetOwing: roundCurrency(tvqCollected - tvqITR),
  };
}

/**
 * Check if a category should be excluded from revenue/expense totals
 */
export function isNonTaxableCategory(category: string): boolean {
  return ['income_loan_received', 'expense_loan_repayment'].includes(category);
}

/**
 * Get deductibility multiplier for expense categories
 * Meals & entertainment = 50% deductible
 */
export function getDeductibilityRate(category: string): number {
  if (category === 'expense_meals_entertainment') return 0.5;
  if (category === 'expense_loan_repayment') return 0; // Not deductible
  return 1.0;
}

// US Sales Tax Nexus Thresholds
export const US_NEXUS_THRESHOLDS: Record<string, { amount: number; transactions?: number; both?: boolean }> = {
  'WY': { amount: 100000, transactions: 200 },
  'DE': { amount: Infinity }, // No sales tax in Delaware
  'NY': { amount: 500000, transactions: 100, both: true }, // Must meet BOTH
  // Common multi-state thresholds for monitoring
  'CA': { amount: 500000 },
  'TX': { amount: 500000 },
  'FL': { amount: 100000 },
  'IL': { amount: 100000 },
};

export function checkNexusThreshold(
  state: string,
  annualSales: number,
  transactionCount: number
): { atRisk: boolean; percentOfThreshold: number; message: string } {
  const threshold = US_NEXUS_THRESHOLDS[state];
  if (!threshold) {
    return { atRisk: false, percentOfThreshold: 0, message: 'No threshold data for this state' };
  }
  if (threshold.amount === Infinity) {
    return { atRisk: false, percentOfThreshold: 0, message: 'No sales tax in this state' };
  }

  const pctAmount = (annualSales / threshold.amount) * 100;
  const pctTransactions = threshold.transactions
    ? (transactionCount / threshold.transactions) * 100
    : 0;

  // For states requiring both conditions (like NY)
  if (threshold.both) {
    const atRisk = pctAmount >= 80 && pctTransactions >= 80;
    return {
      atRisk,
      percentOfThreshold: Math.min(pctAmount, pctTransactions),
      message: atRisk
        ? `Approaching nexus: ${pctAmount.toFixed(0)}% of $${threshold.amount} AND ${pctTransactions.toFixed(0)}% of ${threshold.transactions} transactions`
        : `Sales: ${pctAmount.toFixed(0)}% of threshold, Transactions: ${pctTransactions.toFixed(0)}% of threshold`,
    };
  }

  // For states requiring either condition (like WY)
  const atRisk = pctAmount >= 80 || pctTransactions >= 80;
  return {
    atRisk,
    percentOfThreshold: Math.max(pctAmount, pctTransactions),
    message: atRisk
      ? `Approaching nexus: ${pctAmount.toFixed(0)}% of $${threshold.amount} threshold`
      : `${pctAmount.toFixed(0)}% of sales threshold`,
  };
}

function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}
