import { anthropic, CLAUDE_MODEL } from '../lib/anthropic';
import * as fs from 'fs';

interface ExtractedTransaction {
  date: string;
  description: string;
  debit: number | null;
  credit: number | null;
  balance: number | null;
}

export async function extractTransactionsFromPDF(
  filePath: string
): Promise<ExtractedTransaction[]> {
  const fileBuffer = fs.readFileSync(filePath);
  const base64 = fileBuffer.toString('base64');

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 8000,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: base64,
          },
        },
        {
          type: 'text',
          text: `You are a financial data extraction assistant. Extract all transactions from this bank statement PDF.
Return ONLY a JSON array with no markdown, no explanation. Each object must have:
{ "date": "YYYY-MM-DD", "description": "string", "debit": number|null, "credit": number|null, "balance": number|null }
If a field is not present, use null. Amounts must be positive numbers.
Extract every single transaction row. Do not skip any.
If dates only show month/day, infer the year from the statement period.`,
        },
      ],
    }],
  });

  const text = (response.content[0] as any).text;

  // Parse JSON, handling potential markdown code blocks
  let cleanText = text.trim();
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const transactions: ExtractedTransaction[] = JSON.parse(cleanText);

  // Validate and clean
  return transactions.map(t => ({
    date: t.date,
    description: (t.description || '').trim(),
    debit: t.debit != null ? Math.abs(Number(t.debit)) : null,
    credit: t.credit != null ? Math.abs(Number(t.credit)) : null,
    balance: t.balance != null ? Number(t.balance) : null,
  }));
}
