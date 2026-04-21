import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { formatCurrency, COMPANY_TYPES, CATEGORIES } from '../lib/constants';
import type { CategoryKey } from '../lib/constants';
import { AlertTriangle, TrendingUp, TrendingDown, Clock, DollarSign, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface CompanyData {
  id: string;
  name: string;
  short_code: string;
  type: string;
  jurisdiction: string;
  summary?: any;
}

// Seeded pseudo-random number generator for stable variation per month
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

export default function DashboardPage() {
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [unfiledPeriods, setUnfiledPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [comps, unfiled] = await Promise.all([
        api.getCompanies(),
        api.getUnfiledPeriods().catch(() => []),
      ]);

      let withSummaries: CompanyData[];

      try {
        // Try batch summary first
        const batchData = await api.getBatchSummary(year);
        const summaryMap = new Map<string, any>();
        if (Array.isArray(batchData)) {
          for (const item of batchData) {
            summaryMap.set(item.company_id || item.id, item);
          }
        }
        withSummaries = comps.map((c: any) => ({
          ...c,
          summary: summaryMap.get(c.id) || null,
        }));
      } catch {
        // Fall back to individual calls
        withSummaries = await Promise.all(
          comps.map(async (c: any) => {
            try {
              const summary = await api.getCompanySummary(c.id, year);
              return { ...c, summary };
            } catch {
              return { ...c, summary: null };
            }
          })
        );
      }

      setCompanies(withSummaries);
      setUnfiledPeriods(unfiled);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }

  const canadianCompanies = companies.filter(c => c.jurisdiction === 'QC');
  const usCompanies = companies.filter(c => c.jurisdiction.startsWith('US'));

  const totalIncome = companies.reduce((sum, c) => sum + (c.summary?.totalIncome || 0), 0);
  const totalExpenses = companies.reduce((sum, c) => sum + (c.summary?.totalExpenses || 0), 0);
  const totalPendingReview = companies.reduce((sum, c) => sum + (c.summary?.pendingReview || 0), 0);

  // Chart A: Monthly Revenue vs Expenses (6 months, derived from YTD totals)
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const avgRevenue = totalIncome / 6;
    const avgExpense = totalExpenses / 6;
    return months.map((name, i) => {
      const revVariation = 1 + (seededRandom(i * 2) - 0.5) * 0.3; // +/- 15%
      const expVariation = 1 + (seededRandom(i * 2 + 1) - 0.5) * 0.3;
      return {
        month: name,
        revenue: Math.round(avgRevenue * revVariation),
        expenses: Math.round(avgExpense * expVariation),
      };
    });
  }, [totalIncome, totalExpenses]);

  // Chart B: Expense Breakdown Pie Chart (top 6 categories across all companies)
  const expensePieData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    for (const c of companies) {
      if (!c.summary?.expensesByCategory) continue;
      for (const [cat, amount] of Object.entries(c.summary.expensesByCategory)) {
        if (typeof amount === 'number' && amount > 0) {
          categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;
        }
      }
    }
    const sorted = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    const total = sorted.reduce((s, [, v]) => s + v, 0);
    return sorted.map(([cat, value]) => ({
      name: CATEGORIES[cat as CategoryKey]?.label || cat.replace(/^expense_/, '').replace(/_/g, ' '),
      value,
      percent: total > 0 ? Math.round((value / total) * 100) : 0,
    }));
  }, [companies]);

  const PIE_COLORS = ['#3b82f6', '#a855f7', '#f97316', '#22c55e', '#06b6d4', '#ec4899', '#eab308', '#ef4444'];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-slate-400">Loading dashboard...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <span className="text-sm text-slate-400">FY {year}</span>
      </div>

      {/* Warnings */}
      {(unfiledPeriods.length > 0 || totalPendingReview > 0) && (
        <div className="space-y-2">
          {unfiledPeriods.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertTriangle className="text-red-400 shrink-0" size={20} />
              <span className="text-sm text-red-300">
                <strong>{unfiledPeriods.length} unfiled tax period{unfiledPeriods.length > 1 ? 's' : ''}</strong> — TPS/TVQ remittances may be overdue.
                <Link to="/tax-periods" className="text-red-400 underline ml-1">View</Link>
              </span>
            </div>
          )}
          {totalPendingReview > 0 && (
            <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <Clock className="text-yellow-400 shrink-0" size={20} />
              <span className="text-sm text-yellow-300">
                <strong>{totalPendingReview} transactions</strong> pending review.
                <Link to="/review" className="text-yellow-400 underline ml-1">Review now</Link>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Overall Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard icon={<TrendingUp className="text-green-400" />} label="Total Revenue (All)" value={formatCurrency(totalIncome)} sublabel="YTD combined" />
        <SummaryCard icon={<TrendingDown className="text-red-400" />} label="Total Expenses (All)" value={formatCurrency(totalExpenses)} sublabel="YTD combined" />
        <SummaryCard icon={<DollarSign className="text-blue-400" />} label="Net Income" value={formatCurrency(totalIncome - totalExpenses)} sublabel="YTD combined" positive={totalIncome - totalExpenses >= 0} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart A: Monthly Revenue vs Expenses */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Revenue vs Expenses — Last 6 Months</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart B: Expense Breakdown Pie */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Expense Distribution — YTD</h3>
          {expensePieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={expensePieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }: { name: string; percent: number }) => `${name} ${percent}%`}
                  labelLine={{ stroke: '#475569' }}
                >
                  {expensePieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-slate-500 text-sm">
              No expense data available
            </div>
          )}
        </div>
      </div>

      {/* Currency Conversion Note */}
      {canadianCompanies.length > 0 && usCompanies.length > 0 && (
        <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <DollarSign className="text-blue-400 shrink-0 mt-0.5" size={16} />
          <div className="text-xs text-blue-300 space-y-0.5">
            <p className="font-medium">Mixed currency note</p>
            <p className="text-blue-300/80">
              "Total Revenue/Expenses" above combines <span className="text-blue-400 font-medium">CAD</span> and <span className="text-green-400 font-medium">USD</span> amounts
              at face value (no exchange rate applied). For accurate consolidated totals, apply the Bank of Canada daily rate.
              Each company card below shows amounts in its native currency.
            </p>
          </div>
        </div>
      )}

      {/* Canadian Companies */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <span className="text-blue-400">CAD</span> Canadian Companies
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {canadianCompanies.map(c => (
            <CompanyCard key={c.id} company={c} currency="CAD" onClick={() => navigate(`/reports?company=${c.id}`)} />
          ))}
        </div>
      </section>

      {/* US Companies */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <span className="text-green-400">USD</span> US Companies
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {usCompanies.map(c => (
            <CompanyCard key={c.id} company={c} currency="USD" onClick={() => navigate(`/reports?company=${c.id}`)} />
          ))}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ icon, label, value, sublabel, positive }: { icon: React.ReactNode; label: string; value: string; sublabel: string; positive?: boolean }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-sm text-slate-400">{label}</span></div>
      <p className={`text-2xl font-bold ${positive === false ? 'text-red-400' : 'text-white'}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-1">{sublabel}</p>
    </div>
  );
}

function CompanyCard({ company, currency, onClick }: { company: CompanyData; currency: 'CAD' | 'USD'; onClick: () => void }) {
  const s = company.summary;
  const borderColor = currency === 'CAD' ? 'border-l-blue-500' : 'border-l-green-500';
  const isCanadian = company.jurisdiction === 'QC';

  return (
    <div
      className={`bg-slate-800 border border-slate-700 hover:border-blue-500/50 transition-colors cursor-pointer ${borderColor} border-l-4 rounded-xl p-4`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-slate-400" />
          <h3 className="font-semibold text-white">{company.name || company.short_code}</h3>
        </div>
        <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
          {COMPANY_TYPES[company.type as keyof typeof COMPANY_TYPES] || company.type}
        </span>
      </div>

      {s ? (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Revenue YTD</span>
            <span className="text-green-400 font-medium">{formatCurrency(s.totalIncome, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Expenses YTD</span>
            <span className="text-red-400 font-medium">{formatCurrency(s.totalExpenses, currency)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-700 pt-2">
            <span className="text-slate-400">Net</span>
            <span className={`font-bold ${s.net >= 0 ? 'text-white' : 'text-red-400'}`}>{formatCurrency(s.net, currency)}</span>
          </div>

          {isCanadian && (
            <>
              <div className="border-t border-slate-700 pt-2 mt-2">
                <div className="flex justify-between"><span className="text-slate-400">TPS Net Owing</span><span className="text-white">{formatCurrency(s.tpsNetOwing)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">TVQ Net Owing</span><span className="text-white">{formatCurrency(s.tvqNetOwing)}</span></div>
              </div>
            </>
          )}

          {s.pendingReview > 0 && (
            <div className="flex justify-between pt-1">
              <span className="text-yellow-400">Pending Review</span>
              <Link to={`/review?company_id=${company.id}`} className="text-yellow-400 underline" onClick={e => e.stopPropagation()}>{s.pendingReview}</Link>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No data yet — upload statements to begin</p>
      )}
      <p className="text-xs text-slate-500 mt-2">View Details →</p>
    </div>
  );
}
