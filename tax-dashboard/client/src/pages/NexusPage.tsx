import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/constants';
import { AlertTriangle, MapPin, TrendingUp, Plus, Save } from 'lucide-react';
import EmptyState from '../components/EmptyState';

const STATE_NAMES: Record<string, string> = {
  WY: 'Wyoming', DE: 'Delaware', NY: 'New York', CA: 'California',
  TX: 'Texas', FL: 'Florida', IL: 'Illinois', PA: 'Pennsylvania',
  OH: 'Ohio', GA: 'Georgia', NC: 'North Carolina', MI: 'Michigan',
  NJ: 'New Jersey', VA: 'Virginia', WA: 'Washington', MA: 'Massachusetts',
};

export default function NexusPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [nexusData, setNexusData] = useState<any[]>([]);
  const [thresholds, setThresholds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form for adding state data
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ state_code: 'NY', total_sales: '', transaction_count: '' });

  useEffect(() => {
    api.getCompanies().then(comps => {
      const us = comps.filter((c: any) => c.jurisdiction.startsWith('US'));
      setCompanies(us);
      if (us.length > 0) setSelectedCompany(us[0].id);
    });
    api.getNexusThresholds().then(setThresholds).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedCompany) loadData();
  }, [selectedCompany, year]);

  async function loadData() {
    setLoading(true);
    try {
      const data = await api.getNexusStatus(selectedCompany, year);
      setNexusData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    try {
      await api.updateNexus({
        company_id: selectedCompany,
        state_code: addForm.state_code,
        year,
        total_sales: Number(addForm.total_sales) || 0,
        transaction_count: Number(addForm.transaction_count) || 0,
      });
      await loadData();
      setShowAdd(false);
      setAddForm({ state_code: 'NY', total_sales: '', transaction_count: '' });
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">US Sales Tax Nexus</h1>
          <p className="text-sm text-slate-400">Track economic nexus thresholds by state</p>
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
          <button onClick={() => setShowAdd(!showAdd)} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg flex items-center gap-1">
            <Plus size={14} /> Add State
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-xs text-yellow-300">
        This is informational only — consult a US tax professional for nexus determinations. Economic nexus rules change frequently.
      </div>

      {/* Add State Form */}
      {showAdd && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-white">Add / Update State Sales Data</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">State</label>
              <select value={addForm.state_code} onChange={e => setAddForm(p => ({ ...p, state_code: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
                {Object.entries(STATE_NAMES).map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Total Sales (USD)</label>
              <input type="number" value={addForm.total_sales} onChange={e => setAddForm(p => ({ ...p, total_sales: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Transaction Count</label>
              <input type="number" value={addForm.transaction_count} onChange={e => setAddForm(p => ({ ...p, transaction_count: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm" placeholder="0" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg flex items-center gap-1"><Save size={14} /> Save</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-slate-600 text-white text-sm rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {/* Nexus Cards */}
      {loading ? (
        <div className="text-center text-slate-400 py-12">Loading...</div>
      ) : nexusData.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <EmptyState
            icon={<MapPin size={36} />}
            title="No State Sales Data"
            description="Add state-by-state sales figures to track nexus thresholds"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nexusData.map((s: any) => (
            <div key={s.id} className={`bg-slate-800 border rounded-xl p-4 ${
              s.check?.atRisk ? 'border-red-500/50' : s.check?.percentOfThreshold >= 50 ? 'border-yellow-500/30' : 'border-slate-700'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-green-400" />
                  <span className="font-semibold text-white">{STATE_NAMES[s.state_code] || s.state_code}</span>
                </div>
                {s.check?.atRisk && (
                  <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded flex items-center gap-1">
                    <AlertTriangle size={10} /> At Risk
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Sales</span>
                  <span className="text-white">{formatCurrency(Number(s.total_sales), 'USD')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Transactions</span>
                  <span className="text-white">{s.transaction_count}</span>
                </div>
                {s.threshold && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Threshold</span>
                    <span className="text-slate-300">{s.threshold.amount === null ? 'No sales tax' : formatCurrency(s.threshold.amount, 'USD')}</span>
                  </div>
                )}

                {/* Progress bar */}
                {s.check?.percentOfThreshold > 0 && s.threshold?.amount !== null && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Nexus progress</span>
                      <span className={s.check.atRisk ? 'text-red-400' : 'text-slate-400'}>{Math.round(s.check.percentOfThreshold)}%</span>
                    </div>
                    <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${
                        s.check.percentOfThreshold >= 80 ? 'bg-red-500' : s.check.percentOfThreshold >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                      }`} style={{ width: `${Math.min(100, s.check.percentOfThreshold)}%` }} />
                    </div>
                  </div>
                )}

                {s.check?.message && (
                  <p className="text-xs text-slate-500 mt-1">{s.check.message}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reference Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <h2 className="text-lg font-semibold text-white mb-3">State Nexus Thresholds Reference</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="text-left px-3 py-2 text-slate-300">State</th>
                <th className="text-left px-3 py-2 text-slate-300">Sales Threshold</th>
                <th className="text-left px-3 py-2 text-slate-300">Transaction Threshold</th>
                <th className="text-left px-3 py-2 text-slate-300">Condition</th>
              </tr>
            </thead>
            <tbody>
              {thresholds.map((t: any) => (
                <tr key={t.state_code} className="border-t border-slate-700">
                  <td className="px-3 py-2 text-white">{STATE_NAMES[t.state_code] || t.state_code}</td>
                  <td className="px-3 py-2 text-slate-300">{t.threshold_amount ? formatCurrency(t.threshold_amount, 'USD') : t.note || 'N/A'}</td>
                  <td className="px-3 py-2 text-slate-300">{t.threshold_transactions || 'N/A'}</td>
                  <td className="px-3 py-2 text-slate-400 text-xs">{t.requires_both ? 'Must meet BOTH' : 'Either condition'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
