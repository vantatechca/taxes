import { anthropic, CLAUDE_MODEL } from '../lib/anthropic';

const CATEGORIES = [
  'income_ecommerce', 'income_agency', 'income_loan_received',
  'income_intercompany_transfer', 'income_other',
  'expense_advertising', 'expense_software_subscriptions', 'expense_platform_fees',
  'expense_wages_contractors', 'expense_web_hosting', 'expense_travel',
  'expense_meals_entertainment', 'expense_office_supplies', 'expense_banking_fees',
  'expense_intercompany_transfer', 'expense_loan_repayment', 'expense_gas_vehicle',
  'expense_shipping', 'expense_professional_services', 'expense_team_transfer',
  'expense_other', 'uncategorized',
];

interface CategorizationResult {
  category: string;
  confidence: number;
  reasoning: string;
}

export async function categorizeTransaction(
  description: string,
  amount: number,
  type: 'credit' | 'debit',
  companyType: string,
  jurisdiction: string
): Promise<CategorizationResult> {
  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Categorize this bank transaction for a ${companyType} company in ${jurisdiction}.

Transaction: "${description}"
Amount: $${Math.abs(amount).toFixed(2)}
Type: ${type} (${type === 'credit' ? 'money in' : 'money out'})

Available categories: ${CATEGORIES.join(', ')}

Return ONLY a JSON object (no markdown, no explanation outside JSON):
{"category": "one_of_the_categories", "confidence": 0.0_to_1.0, "reasoning": "brief explanation"}`,
      }],
    });

    const text = (response.content[0] as any).text;
    const parsed = JSON.parse(text);

    // Validate category
    if (!CATEGORIES.includes(parsed.category)) {
      parsed.category = 'uncategorized';
      parsed.confidence = 0;
    }

    return {
      category: parsed.category,
      confidence: Math.min(1, Math.max(0, parsed.confidence)),
      reasoning: parsed.reasoning || '',
    };
  } catch {
    return {
      category: 'uncategorized',
      confidence: 0,
      reasoning: 'AI categorization failed',
    };
  }
}
