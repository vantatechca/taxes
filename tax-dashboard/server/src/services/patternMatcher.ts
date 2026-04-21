import { supabaseAdmin } from '../lib/supabase';

interface Pattern {
  id: string;
  match_type: 'contains' | 'starts_with' | 'exact' | 'regex';
  match_string: string;
  assigned_category: string;
  assigned_subcategory: string | null;
  auto_apply: boolean;
  company_id: string | null;
}

interface PatternMatch {
  pattern: Pattern;
  confidence: number;
}

export async function matchTransaction(
  description: string,
  companyId: string
): Promise<PatternMatch | null> {
  // Fetch patterns: company-specific + global (company_id IS NULL)
  const { data: patterns } = await supabaseAdmin
    .from('transaction_patterns')
    .select('*')
    .or(`company_id.eq.${companyId},company_id.is.null`)
    .order('company_id', { ascending: false, nullsFirst: false }); // Company-specific first

  if (!patterns) return null;

  const upperDesc = description.toUpperCase();

  for (const pattern of patterns as Pattern[]) {
    const matchStr = pattern.match_string.toUpperCase();
    let matched = false;

    switch (pattern.match_type) {
      case 'contains':
        matched = upperDesc.includes(matchStr);
        break;
      case 'starts_with':
        matched = upperDesc.startsWith(matchStr);
        break;
      case 'exact':
        matched = upperDesc === matchStr;
        break;
      case 'regex':
        try {
          matched = new RegExp(pattern.match_string, 'i').test(description);
        } catch {
          matched = false;
        }
        break;
    }

    if (matched) {
      // Increment times_applied
      await supabaseAdmin
        .from('transaction_patterns')
        .update({ times_applied: (pattern as any).times_applied + 1 })
        .eq('id', pattern.id);

      return {
        pattern,
        confidence: pattern.auto_apply ? 1.0 : 0.9,
      };
    }
  }

  return null;
}
