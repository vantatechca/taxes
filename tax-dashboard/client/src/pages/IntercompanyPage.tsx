import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/constants';
import { ArrowRight, AlertTriangle, ArrowLeftRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';

export default function IntercompanyPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCompanies().then(setCompanies);
  }, []);

  useEffect(() => {
    loadData();
  }, [year]);

  async function loadData() {
    setLoading(true);
    try {
      const data = await api.getIntercompany(year);
      setTransfers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Build matrix: from company -> to company -> { amount, count, currency }
  const matrix: Record<string, Record<string, { cad: number; usd: number; count: number }>> = {};
  for (const t of transfers) {
    const from = t.company_id;
    const to = t.intercompany_company_id;
    if (!from || !to) continue;

    if (!matrix[from]) matrix[from] = {};
    if (!matrix[from][to]) matrix[from][to] = { cad: 0, usd: 0, count: 0 };
    if (t.currency === 'CAD') matrix[from][to].cad += Number(t.amount);
    else matrix[from][to].usd += Number(t.amount);
    matrix[from][to].count++;
  }

  const companyMap = Object.fromEntries(companies.map(c => [c.id, c]));

  // Detect unmatched transfers (A->B exists but B->A doesn't)
  const warnings: string[] = [];
  for (const from of Object.keys(matrix)) {
    for (const to of Object.keys(matrix[from])) {
      if (!matrix[to]?.[from]) {
        const fromName = companyMap[from]?.short_code || from.slice(0, 8);
        const toName = companyMap[to]?.short_code || to.slice(0, 8);
        warnings.push(`${fromName} sent to ${toName} but no matching return transfer found`);
      }
    }
  }

  // Flatten into list for display
  const flows: { from: any; to: any; cad: number; usd: number; count: number }[] = [];
  for (const from of Object.keys(matrix)) {
    for (const to of Object.keys(matrix[from])) {
      flows.push({ from: companyMap[from], to: companyMap[to], ...matrix[from][to] });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Intercompany Transfers</h1>
          <p className="text-sm text-slate-400">Track money flows between your companies</p>
        </div>
        <select value={year} onChange={e => setYear(Number(e.target.value))}
          className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
          {Array.from({ length: new Date().getFullYear() - 2024 + 2 }, (_, i) => 2024 + i).map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* CRA Warning */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-xs text-yellow-300">
        <strong>CRA Reminder:</strong> Intercompany loans may require formal documentation and arm's-length interest rates under CRA rules. Ensure all transfers are properly documented.
      </div>

      {/* Unmatched Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertTriangle size={14} className="text-red-400 shrink-0" />
              <span className="text-sm text-red-300">{w}</span>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center text-slate-400 py-12">Loading...</div>
      ) : flows.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <EmptyState
            icon={<ArrowLeftRight size={36} />}
            title="No Intercompany Transfers"
            description="Flag transactions as intercompany in the Review Queue to see them here"
            action={{ label: 'Go to Review Queue', onClick: () => navigate('/review') }}
          />
        </div>
      ) : (
        <>
          {/* Flow Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flows.map((f, i) => (
              <div key={i} className="bg-slate-800 border border-purple-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2 py-1 bg-slate-700 rounded text-sm font-medium text-white">{f.from?.name || f.from?.short_code || '?'}</span>
                  <ArrowRight size={16} className="text-purple-400" />
                  <span className="px-2 py-1 bg-slate-700 rounded text-sm font-medium text-white">{f.to?.name || f.to?.short_code || '?'}</span>
                </div>
                <div className="space-y-1 text-sm">
                  {f.cad > 0 && <div className="flex justify-between"><span className="text-slate-400">CAD</span><span className="text-blue-400 font-medium">{formatCurrency(f.cad, 'CAD')}</span></div>}
                  {f.usd > 0 && <div className="flex justify-between"><span className="text-slate-400">USD</span><span className="text-green-400 font-medium">{formatCurrency(f.usd, 'USD')}</span></div>}
                  <div className="flex justify-between"><span className="text-slate-400">Transactions</span><span className="text-white">{f.count}</span></div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary table */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h2 className="text-lg font-semibold text-white mb-3">Transfer Matrix</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="text-left px-3 py-2 text-slate-300">From</th>
                    <th className="text-left px-3 py-2 text-slate-300">To</th>
                    <th className="text-right px-3 py-2 text-slate-300">CAD</th>
                    <th className="text-right px-3 py-2 text-slate-300">USD</th>
                    <th className="text-right px-3 py-2 text-slate-300"># Txns</th>
                  </tr>
                </thead>
                <tbody>
                  {flows.map((f, i) => (
                    <tr key={i} className="border-t border-slate-700">
                      <td className="px-3 py-2 text-white">{f.from?.name || f.from?.short_code}</td>
                      <td className="px-3 py-2 text-white">{f.to?.name || f.to?.short_code}</td>
                      <td className="px-3 py-2 text-right text-blue-400">{f.cad > 0 ? formatCurrency(f.cad) : '-'}</td>
                      <td className="px-3 py-2 text-right text-green-400">{f.usd > 0 ? formatCurrency(f.usd, 'USD') : '-'}</td>
                      <td className="px-3 py-2 text-right text-slate-300">{f.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
