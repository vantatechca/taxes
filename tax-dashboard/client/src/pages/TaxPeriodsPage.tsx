import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/constants';
import { Calendar, Check, AlertTriangle, RefreshCw, FileDown } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function TaxPeriodsPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [year, setYear] = useState(2024);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [confirmFile, setConfirmFile] = useState<string | null>(null);

  useEffect(() => {
    api.getCompanies().then(comps => {
      const canadian = comps.filter((c: any) => c.jurisdiction === 'QC');
      setCompanies(canadian);
      if (canadian.length > 0) setSelectedCompany(canadian[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedCompany) loadPeriods();
  }, [selectedCompany, year]);

  async function loadPeriods() {
    setLoading(true);
    try {
      const data = await api.getTaxPeriods({ company_id: selectedCompany, year: String(year) });
      setPeriods(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function generatePeriod(month: number) {
    const key = `${year}-${month}`;
    setGenerating(key);
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().slice(0, 10);
      await api.generateTaxPeriod({ company_id: selectedCompany, period_start: startDate, period_end: endDate });
      await loadPeriods();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGenerating(null);
    }
  }

  async function markFiled(periodId: string) {
    try {
      await api.fileTaxPeriod(periodId);
      await loadPeriods();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setConfirmFile(null);
    }
  }

  function getPeriodForMonth(month: number) {
    const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
    return periods.find(p => p.period_start === startStr);
  }

  // Due date: last day of month following the period
  function getDueDate(month: number): string {
    const due = new Date(year, month, 0); // last day of month after period month (0-indexed trick)
    return due.toISOString().slice(0, 10);
  }

  function isOverdue(month: number, period: any): boolean {
    if (period?.status === 'filed' || period?.status === 'paid') return false;
    const due = getDueDate(month);
    return new Date(due) < new Date();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">TPS/TVQ Tax Periods</h1>
          <p className="text-sm text-slate-400">Quebec sales tax filing management</p>
        </div>
        <div className="flex gap-2">
          <select value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
            {companies.map(c => <option key={c.id} value={c.id}>{c.name || c.short_code}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
            {Array.from({ length: new Date().getFullYear() - 2024 + 2 }, (_, i) => 2024 + i).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Tax Rules Reference */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-300">
        <strong>Quebec Tax Rules:</strong> TPS (GST) = 5% | TVQ (QST) = 9.975% | Net owing = Collected - Input Tax Credits/Refunds.
        Negative = Revenu Quebec owes you a refund.
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
            const period = getPeriodForMonth(month);
            const overdue = isOverdue(month, period);
            const dueDate = getDueDate(month);

            return (
              <div key={month} className={`bg-slate-800 border rounded-xl p-4 ${
                overdue ? 'border-red-500/50' :
                period?.status === 'filed' || period?.status === 'paid' ? 'border-green-500/30' :
                'border-slate-700'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    <span className="font-semibold text-white">{MONTHS[month - 1]} {year}</span>
                  </div>
                  {period?.status === 'filed' && <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">Filed</span>}
                  {period?.status === 'paid' && <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">Paid</span>}
                  {overdue && <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded flex items-center gap-1"><AlertTriangle size={10} /> Overdue</span>}
                </div>

                {period ? (
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-slate-400">TPS Collected</span><span className="text-white">{formatCurrency(period.tps_collected)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">TVQ Collected</span><span className="text-white">{formatCurrency(period.tvq_collected)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">TPS ITC</span><span className="text-green-400">-{formatCurrency(period.tps_itc)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">TVQ ITR</span><span className="text-green-400">-{formatCurrency(period.tvq_itr)}</span></div>
                    <div className="border-t border-slate-700 pt-1.5">
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-300">TPS Net</span>
                        <span className={period.tps_net_owing >= 0 ? 'text-red-400' : 'text-green-400'}>{formatCurrency(period.tps_net_owing)}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-300">TVQ Net</span>
                        <span className={period.tvq_net_owing >= 0 ? 'text-red-400' : 'text-green-400'}>{formatCurrency(period.tvq_net_owing)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button onClick={() => generatePeriod(month)} className="flex-1 px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg flex items-center justify-center gap-1">
                        <RefreshCw size={12} /> Recalculate
                      </button>
                      {period.status === 'draft' && (
                        <button onClick={() => setConfirmFile(period.id)} className="flex-1 px-2 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg flex items-center justify-center gap-1">
                          <Check size={12} /> Mark Filed
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-xs text-slate-500 mb-2">No data yet</p>
                    <button onClick={() => generatePeriod(month)} disabled={generating === `${year}-${month}`}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs rounded-lg">
                      {generating === `${year}-${month}` ? 'Generating...' : 'Generate Report'}
                    </button>
                  </div>
                )}

                <p className="text-[10px] text-slate-500 mt-2">Due: {dueDate}</p>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={confirmFile !== null}
        title="Mark as Filed"
        message="Mark this period as filed with Revenu Quebec? This indicates the return has been submitted."
        confirmLabel="Mark Filed"
        variant="info"
        onConfirm={() => confirmFile && markFiled(confirmFile)}
        onCancel={() => setConfirmFile(null)}
      />
    </div>
  );
}
