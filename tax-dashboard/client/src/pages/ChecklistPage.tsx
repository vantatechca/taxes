import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { ClipboardCheck, RefreshCw, Check } from 'lucide-react';

const CHECKLIST_ITEMS = [
  { key: 'statements_downloaded', label: 'All bank statements downloaded' },
  { key: 'statements_uploaded', label: 'All statements uploaded to dashboard' },
  { key: 'transactions_reviewed', label: 'All transactions reviewed & categorized' },
  { key: 'tax_report_generated', label: 'TPS/TVQ report generated (CA only)' },
  { key: 'tax_report_sent', label: 'TPS/TVQ report sent to accountant' },
  { key: 'invoices_logged', label: 'Subcontractor invoices logged' },
  { key: 'intercompany_documented', label: 'Intercompany transfers documented' },
  { key: 'us_sales_logged', label: 'US sales by state logged (US only)' },
];

export default function ChecklistPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() || 12); // previous month
  const [checklists, setChecklists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadChecklists(); }, [year, month]);

  async function loadChecklists() {
    setLoading(true);
    try {
      const data = await api.getChecklists(year, month);
      setChecklists(data);
    } catch {
      setChecklists([]);
    } finally {
      setLoading(false);
    }
  }

  async function generateChecklists() {
    try {
      const data = await api.generateChecklists(year, month);
      setChecklists(data);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function toggleItem(checklistId: string, key: string, currentValue: boolean) {
    try {
      const updated = await api.updateChecklist(checklistId, { [key]: !currentValue });
      setChecklists(prev => prev.map(c => c.id === checklistId ? updated : c));
    } catch (err: any) {
      alert(err.message);
    }
  }

  const monthName = new Date(year, month - 1).toLocaleString('en', { month: 'long' });
  const totalItems = checklists.length * CHECKLIST_ITEMS.length;
  const completedItems = checklists.reduce((sum, cl) =>
    sum + CHECKLIST_ITEMS.filter(item => cl[item.key]).length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Monthly Close Checklist</h1>
          <p className="text-sm text-slate-400">{monthName} {year} — {completedItems}/{totalItems} items complete</p>
        </div>
        <div className="flex gap-2">
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{new Date(year, m - 1).toLocaleString('en', { month: 'long' })}</option>
            ))}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
            {Array.from({ length: new Date().getFullYear() - 2024 + 2 }, (_, i) => 2024 + i).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Progress bar */}
      {totalItems > 0 && (
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Close progress</span>
            <span>{Math.round((completedItems / totalItems) * 100)}%</span>
          </div>
          <div className="bg-slate-800 rounded-full h-3 overflow-hidden">
            <div className="bg-green-500 h-full transition-all rounded-full" style={{ width: `${(completedItems / totalItems) * 100}%` }} />
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-slate-400 py-12">Loading...</div>
      ) : checklists.length === 0 ? (
        <div className="text-center py-12 bg-slate-800 rounded-xl border border-slate-700">
          <ClipboardCheck size={36} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400">No checklists for {monthName} {year}</p>
          <button onClick={generateChecklists} className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg flex items-center gap-2 mx-auto">
            <RefreshCw size={14} /> Generate Checklists
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {checklists.map(cl => {
            const company = cl.companies;
            const completedCount = CHECKLIST_ITEMS.filter(item => cl[item.key]).length;
            const isCanadian = company?.jurisdiction === 'QC';
            const isComplete = completedCount === CHECKLIST_ITEMS.length;

            return (
              <div key={cl.id} className={`bg-slate-800 border rounded-xl p-4 ${
                isComplete ? 'border-green-500/30' : 'border-slate-700'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${isCanadian ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                      {company?.short_code}
                    </span>
                    <span className="font-medium text-white">{company?.name || company?.short_code}</span>
                  </div>
                  <span className={`text-xs ${isComplete ? 'text-green-400' : 'text-slate-400'}`}>
                    {completedCount}/{CHECKLIST_ITEMS.length}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {CHECKLIST_ITEMS.map(item => {
                    // Skip Canada-only items for US companies
                    if (item.key === 'tax_report_generated' && !isCanadian) return null;
                    if (item.key === 'tax_report_sent' && !isCanadian) return null;
                    if (item.key === 'us_sales_logged' && isCanadian) return null;

                    const checked = cl[item.key];
                    return (
                      <button key={item.key} onClick={() => toggleItem(cl.id, item.key, checked)}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg text-sm text-left transition-colors ${
                          checked ? 'bg-green-500/10 text-green-300' : 'bg-slate-700/30 text-slate-400 hover:bg-slate-700'
                        }`}>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                          checked ? 'bg-green-600 border-green-600' : 'border-slate-500'
                        }`}>
                          {checked && <Check size={12} className="text-white" />}
                        </div>
                        <span className={checked ? 'line-through opacity-60' : ''}>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {cl.completed_at && (
                  <p className="text-xs text-green-400 mt-2">Completed {new Date(cl.completed_at).toLocaleDateString()}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
