import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { CATEGORIES, formatCurrency, confidenceBg } from '../lib/constants';
import type { CategoryKey } from '../lib/constants';
import { Check, ChevronLeft, ChevronRight, AlertTriangle, ToggleLeft, ToggleRight, Sparkles, FileText, Loader2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

interface StatementProgress {
  id: string;
  file_name: string;
  company_name: string;
  total_transactions: number;
  reviewed_transactions: number;
  percentage: number;
}

export default function ReviewPage() {
  const [searchParams] = useSearchParams();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterCompany, setFilterCompany] = useState(searchParams.get('company_id') || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [statementProgress, setStatementProgress] = useState<StatementProgress[]>([]);

  // Edit state for current transaction
  const [editState, setEditState] = useState<Record<string, any>>({});

  // Bulk review state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState(false);

  // Track which transaction is actively being edited (expanded)
  const [editingId, setEditingId] = useState<string | null>(null);

  // Pending pattern creation (replaces window.confirm)
  const [pendingPattern, setPendingPattern] = useState<{ keyword: string; category: string; label: string; isIncome: boolean } | null>(null);

  // Pending approval confirmation
  const [pendingApproval, setPendingApproval] = useState<any | null>(null);

  useEffect(() => { api.getCompanies().then(setCompanies); }, []);

  // Load statement-level progress
  useEffect(() => {
    async function loadStatementProgress() {
      try {
        const stmts = await api.getStatements({ status: 'processed' });
        if (!Array.isArray(stmts)) return;

        // For each statement, get transaction counts
        const progressItems: StatementProgress[] = [];
        for (const stmt of stmts.slice(0, 20)) { // Cap at 20 most recent
          try {
            const allTxns = await api.getTransactions({
              statement_id: stmt.id,
              limit: '1000',
            });
            const txnList = allTxns?.data || [];
            const reviewed = txnList.filter((t: any) => t.is_reviewed).length;
            const totalTxns = txnList.length;
            if (totalTxns > 0 && reviewed < totalTxns) {
              progressItems.push({
                id: stmt.id,
                file_name: stmt.file_name || 'Unknown',
                company_name: stmt.companies?.name || stmt.companies?.short_code || '',
                total_transactions: totalTxns,
                reviewed_transactions: reviewed,
                percentage: Math.round((reviewed / totalTxns) * 100),
              });
            }
          } catch { /* skip */ }
        }
        setStatementProgress(progressItems);
      } catch { /* silent */ }
    }
    loadStatementProgress();
  }, [transactions.length]); // Refresh when transactions change

  useEffect(() => {
    loadQueue();
  }, [page, filterCompany]);

  async function loadQueue() {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (filterCompany) params.company_id = filterCompany;
      const res = await api.getReviewQueue(params);
      setTransactions(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function getEdit(txId: string) {
    return editState[txId] || {};
  }

  function setEdit(txId: string, updates: any) {
    setEditState(prev => ({ ...prev, [txId]: { ...prev[txId], ...updates } }));
  }

  async function handleSave(tx: any) {
    setSaving(tx.id);
    const edit = getEdit(tx.id);
    try {
      await api.updateTransaction(tx.id, {
        category: edit.category || tx.ai_category_suggestion || tx.category,
        subcategory: edit.subcategory,
        notes: edit.notes || '',
        is_intercompany: edit.is_intercompany || false,
        intercompany_company_id: edit.intercompany_company_id,
        quebec_sales_amount: edit.quebec_sales_amount ? Number(edit.quebec_sales_amount) : null,
        ontario_sales_amount: edit.ontario_sales_amount ? Number(edit.ontario_sales_amount) : null,
        us_sales_amount: edit.us_sales_amount ? Number(edit.us_sales_amount) : null,
        other_canada_sales_amount: edit.other_canada_sales_amount ? Number(edit.other_canada_sales_amount) : null,
        international_sales_amount: edit.international_sales_amount ? Number(edit.international_sales_amount) : null,
        includes_canadian_tax: edit.includes_canadian_tax || false,
        is_reviewed: true,
      });

      // Offer pattern creation
      const cat = edit.category || tx.ai_category_suggestion;
      if (cat && cat !== 'uncategorized' && !tx.pattern_id) {
        const keyword = tx.description_raw.split(/\s+/).slice(0, 3).join(' ').toUpperCase();
        setPendingPattern({
          keyword,
          category: cat,
          label: CATEGORIES[cat as CategoryKey]?.label || cat,
          isIncome: tx.type === 'credit',
        });
      }

      // Remove from list
      setTransactions(prev => prev.filter(t => t.id !== tx.id));
      setTotal(prev => prev - 1);
      // Clear selection for this transaction
      setSelected(prev => {
        const next = new Set(prev);
        next.delete(tx.id);
        return next;
      });
      // Clear editing state if this was the active edit
      if (editingId === tx.id) setEditingId(null);
    } catch (err: any) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(null);
    }
  }

  // Bulk approve handler
  async function handleBulkApprove() {
    if (selected.size === 0) return;
    setBulkAction(true);
    try {
      await api.bulkReview(Array.from(selected));
      setSelected(new Set());
      await loadQueue();
    } catch (err: any) {
      alert('Bulk approve failed: ' + err.message);
    } finally {
      setBulkAction(false);
    }
  }

  // Toggle selection for a single transaction
  function toggleSelect(txId: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(txId)) {
        next.delete(txId);
      } else {
        next.add(txId);
      }
      return next;
    });
  }

  // Select all / deselect all
  function toggleSelectAll() {
    if (selected.size === transactions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(transactions.map(t => t.id)));
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && editingId) {
        setEditingId(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && editingId) {
        e.preventDefault();
        // trigger save
        const form = document.querySelector('[data-save-btn]') as HTMLButtonElement;
        form?.click();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editingId]);

  // Compute revenue split sum for a given transaction
  function getSplitSum(txId: string): number {
    const edit = getEdit(txId);
    const fields = ['quebec_sales_amount', 'ontario_sales_amount', 'other_canada_sales_amount', 'us_sales_amount', 'international_sales_amount'];
    return fields.reduce((sum, key) => sum + (Number(edit[key]) || 0), 0);
  }

  const totalPages = Math.ceil(total / 20);
  const categoryOptions = Object.entries(CATEGORIES);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Review Queue</h1>
          <p className="text-sm text-slate-400">{total} transactions pending review</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Select All checkbox */}
          {transactions.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={transactions.length > 0 && selected.size === transactions.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
              />
              Select All
            </label>
          )}
          <select value={filterCompany} onChange={e => { setFilterCompany(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
            <option value="">All Companies</option>
            {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name || c.short_code}</option>)}
          </select>
        </div>
      </div>

      {/* Statement-Level Progress Bars */}
      {statementProgress.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <FileText size={14} /> Statement Review Progress
          </h3>
          <div className="space-y-2">
            {statementProgress.map(sp => (
              <div key={sp.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 truncate max-w-[60%]">{sp.company_name} — {sp.file_name}</span>
                  <span className="text-slate-300 shrink-0">{sp.reviewed_transactions}/{sp.total_transactions} ({sp.percentage}%)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${sp.percentage >= 80 ? 'bg-green-500' : sp.percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${sp.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Page progress bar */}
      {total > 0 && (
        <div className="bg-slate-800 rounded-full h-2 overflow-hidden">
          <div className="bg-blue-500 h-full transition-all" style={{ width: `${Math.max(2, ((20 - transactions.length) / 20) * 100)}%` }} />
        </div>
      )}

      {loading ? (
        <div className="text-center text-slate-400 py-12">Loading...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-16 bg-slate-800 rounded-xl border border-slate-700">
          <Check size={48} className="mx-auto text-green-400 mb-3" />
          <p className="text-lg text-white font-medium">All caught up!</p>
          <p className="text-sm text-slate-400">No transactions pending review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map(tx => {
            const edit = getEdit(tx.id);
            const selectedCat = edit.category || tx.ai_category_suggestion || tx.category;
            const catInfo = CATEGORIES[selectedCat as CategoryKey];
            const isCredit = tx.type === 'credit';
            const currency = tx.currency || tx.bank_accounts?.currency || 'CAD';
            const isEditing = editingId === tx.id;
            const splitSum = isCredit ? getSplitSum(tx.id) : 0;
            const splitDiff = Math.abs(splitSum - tx.amount);

            return (
              <div key={tx.id} className={`bg-slate-800 border rounded-xl p-4 space-y-3 ${
                isCredit ? 'border-green-500/30' : 'border-slate-700'
              }`}>
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Checkbox for bulk selection */}
                    <input
                      type="checkbox"
                      checked={selected.has(tx.id)}
                      onChange={() => toggleSelect(tx.id)}
                      className="w-4 h-4 mt-1 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 shrink-0 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-400">{tx.date}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${currency === 'CAD' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>{currency}</span>
                        <span className="text-xs text-slate-500">{tx.companies?.short_code}</span>
                      </div>
                      <p className="text-white font-medium mt-1 truncate">{tx.description_raw}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-lg font-bold ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                      {isCredit ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                    </p>
                    <span className="text-xs text-slate-500">{isCredit ? 'CREDIT' : 'DEBIT'}</span>
                  </div>
                </div>

                {/* AI Suggestion */}
                {tx.ai_category_suggestion && (
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-purple-400" />
                    <span className="text-xs text-slate-400">AI suggests:</span>
                    <span className="text-xs font-medium text-purple-300">{CATEGORIES[tx.ai_category_suggestion as CategoryKey]?.label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${confidenceBg(tx.ai_confidence)}`}>
                      {Math.round(tx.ai_confidence * 100)}%
                    </span>
                  </div>
                )}

                {/* Category Select */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Category</label>
                  <select value={selectedCat} onChange={e => { setEdit(tx.id, { category: e.target.value }); setEditingId(tx.id); }}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
                    <optgroup label="Income">
                      {categoryOptions.filter(([_, v]) => v.group === 'income').map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                    </optgroup>
                    <optgroup label="Expenses">
                      {categoryOptions.filter(([_, v]) => v.group === 'expense').map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                    </optgroup>
                    <option value="uncategorized">Uncategorized</option>
                  </select>
                </div>

                {/* Warnings */}
                {catInfo?.warning && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <AlertTriangle size={14} className="text-yellow-400 shrink-0" />
                    <span className="text-xs text-yellow-300">{catInfo.warning}</span>
                  </div>
                )}

                {/* Revenue Split Panel — for credits */}
                {isCredit && (
                  <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium text-slate-300">Revenue Split (must equal {formatCurrency(tx.amount, currency)})</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {[
                        ['quebec_sales_amount', 'Quebec ($)'],
                        ['ontario_sales_amount', 'Ontario ($)'],
                        ['other_canada_sales_amount', 'Other CA ($)'],
                        ['us_sales_amount', 'USA ($)'],
                        ['international_sales_amount', 'Intl ($)'],
                      ].map(([key, label]) => (
                        <div key={key}>
                          <label className="block text-[10px] text-slate-400">{label}</label>
                          <input type="number" step="0.01" value={edit[key] || ''} onChange={e => { setEdit(tx.id, { [key]: e.target.value }); setEditingId(tx.id); }}
                            className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm" placeholder="0.00" />
                        </div>
                      ))}
                    </div>
                    {edit.quebec_sales_amount > 0 && (
                      <p className="text-[10px] text-blue-300">TPS: {formatCurrency(Number(edit.quebec_sales_amount) * 0.05)} | TVQ: {formatCurrency(Number(edit.quebec_sales_amount) * 0.09975)}</p>
                    )}
                    {/* Revenue Split Validation */}
                    {splitSum > 0 && splitDiff > 0.01 && (
                      <p className="text-xs text-yellow-400 mt-1">
                        ⚠ Split total ({formatCurrency(splitSum)}) ≠ amount ({formatCurrency(tx.amount)}). Difference: {formatCurrency(Math.abs(splitSum - tx.amount))}
                      </p>
                    )}
                  </div>
                )}

                {/* Expense — includes tax? */}
                {!isCredit && tx.companies?.jurisdiction === 'QC' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Includes TPS/TVQ?</span>
                    <button onClick={() => { setEdit(tx.id, { includes_canadian_tax: !edit.includes_canadian_tax }); setEditingId(tx.id); }} className="text-slate-400 hover:text-white">
                      {edit.includes_canadian_tax ? <ToggleRight size={20} className="text-blue-400" /> : <ToggleLeft size={20} />}
                    </button>
                    {edit.includes_canadian_tax && (
                      <span className="text-[10px] text-blue-300">ITC: {formatCurrency(tx.amount / 1.05 * 0.05)} | ITR: {formatCurrency(tx.amount / 1.09975 * 0.09975)}</span>
                    )}
                  </div>
                )}

                {/* Intercompany */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-slate-400">Intercompany?</span>
                  <button onClick={() => { setEdit(tx.id, { is_intercompany: !edit.is_intercompany }); setEditingId(tx.id); }} className="text-slate-400 hover:text-white">
                    {edit.is_intercompany ? <ToggleRight size={20} className="text-purple-400" /> : <ToggleLeft size={20} />}
                  </button>
                  {edit.is_intercompany && (
                    <select value={edit.intercompany_company_id || ''} onChange={e => { setEdit(tx.id, { intercompany_company_id: e.target.value }); setEditingId(tx.id); }}
                      className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs">
                      <option value="">Select company...</option>
                      {companies.filter((c: any) => c.id !== tx.company_id).map((c: any) => <option key={c.id} value={c.id}>{c.name || c.short_code}</option>)}
                    </select>
                  )}
                </div>

                {/* Notes + Save */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-400 mb-1">Notes</label>
                    <input value={edit.notes || ''} onChange={e => { setEdit(tx.id, { notes: e.target.value }); setEditingId(tx.id); }}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm" placeholder="Optional notes..." />
                  </div>
                  <div>
                    <button
                      data-save-btn={isEditing ? '' : undefined}
                      onClick={() => setPendingApproval(tx)}
                      disabled={saving === tx.id}
                      className="w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-1.5"
                    >
                      {saving === tx.id ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                      {saving === tx.id ? 'Saving...' : 'Approve'}
                    </button>
                    {isEditing && (
                      <p className="text-xs text-slate-500 mt-1">Ctrl+Enter to save · Escape to cancel</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4 flex-wrap">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 bg-slate-700 rounded-lg text-white disabled:opacity-30"><ChevronLeft size={16} /></button>
          <span className="text-sm text-slate-400">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-2 bg-slate-700 rounded-lg text-white disabled:opacity-30"><ChevronRight size={16} /></button>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white rounded-xl px-6 py-3 shadow-2xl flex items-center gap-4 z-50 mb-safe">
          <span className="font-medium">{selected.size} selected</span>
          <button onClick={handleBulkApprove} disabled={bulkAction} className="px-3 py-1 bg-green-500 hover:bg-green-600 rounded-lg text-sm flex items-center gap-1.5">
            {bulkAction ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />} Approve All
          </button>
          <button onClick={() => setSelected(new Set())} className="px-3 py-1 bg-slate-500 hover:bg-slate-400 rounded-lg text-sm">Clear</button>
        </div>
      )}

      <ConfirmModal
        open={pendingApproval !== null}
        title="Approve Transaction?"
        message={pendingApproval ? `Approve this transaction as "${pendingApproval.category || pendingApproval.ai_category_suggestion || 'uncategorized'}"? This will mark it as reviewed and cannot be undone.` : ''}
        confirmLabel="Yes, Approve"
        cancelLabel="Cancel"
        variant="info"
        onConfirm={() => {
          const tx = pendingApproval;
          setPendingApproval(null);
          handleSave(tx);
        }}
        onCancel={() => setPendingApproval(null)}
      />

      <ConfirmModal
        open={pendingPattern !== null}
        title="Transaction Approved ✓"
        message={pendingPattern ? `Transaction has been approved. Would you also like to create an auto-categorization rule for transactions containing "${pendingPattern.keyword}" → ${pendingPattern.label}? You can skip this and it won't affect the approval.` : ''}
        confirmLabel="Yes, Create Rule"
        cancelLabel="Skip"
        variant="info"
        onConfirm={async () => {
          if (pendingPattern) {
            try {
              await api.createPattern({
                match_type: 'contains',
                match_string: pendingPattern.keyword,
                assigned_category: pendingPattern.category,
                is_income: pendingPattern.isIncome,
                auto_apply: true,
              });
            } catch {
              // silently fail
            }
          }
          setPendingPattern(null);
        }}
        onCancel={() => setPendingPattern(null)}
      />
    </div>
  );
}
