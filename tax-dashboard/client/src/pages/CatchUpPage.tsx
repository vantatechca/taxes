import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/constants';
import {
  AlertTriangle, Clock, CheckCircle2, CheckCircle, Circle, ArrowUpRight,
  Flame, AlertOctagon, ChevronDown, ChevronUp
} from 'lucide-react';
import EmptyState from '../components/EmptyState';

const PRIORITY_CONFIG = {
  critical: { label: 'CRITICAL', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30', icon: Flame },
  high: { label: 'HIGH', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', icon: AlertOctagon },
  medium: { label: 'MEDIUM', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', icon: AlertTriangle },
  low: { label: 'LOW', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-600', icon: Clock },
};

export default function CatchUpPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCompany, setFilterCompany] = useState<string>('all');

  useEffect(() => {
    api.getCatchUpBoard().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  function toggleExpand(id: string) {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-slate-400">Loading catch-up board...</div></div>;
  if (!data) return <div className="text-center text-slate-400 py-12">Failed to load catch-up board.</div>;

  const { items, summary } = data;
  const companies = [...new Set(items.map((i: any) => i.company_name))].sort();

  const filteredItems = items.filter((item: any) => {
    if (filterPriority !== 'all' && item.priority !== filterPriority) return false;
    if (filterCompany !== 'all' && item.company_name !== filterCompany) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Catch-Up Sprint Board</h1>
          <p className="text-sm text-slate-400">All overdue periods, sorted oldest-first</p>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatBadge label="Total Overdue" value={summary.total_overdue} color="text-white" />
        <StatBadge label="Critical" value={summary.critical} color="text-red-400" />
        <StatBadge label="High" value={summary.high} color="text-orange-400" />
        <StatBadge label="Medium" value={summary.medium} color="text-yellow-400" />
        <StatBadge label="Low" value={summary.low} color="text-slate-400" />
        <StatBadge label="Companies" value={summary.companies_affected} color="text-blue-400" />
      </div>

      {summary.oldest_overdue_days > 0 && (
        <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <Flame className="text-red-400 shrink-0" size={20} />
          <span className="text-sm text-red-300">
            Oldest overdue item is <strong>{summary.oldest_overdue_days} days</strong> past due.
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)}
          className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
          <option value="all">All Companies</option>
          {companies.map((c: string) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Sprint Items */}
      {filteredItems.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <EmptyState
            icon={<CheckCircle size={48} className="text-green-400" />}
            title="All Caught Up!"
            description="No overdue periods. Great work!"
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item: any) => {
            const priorityCfg = PRIORITY_CONFIG[item.priority as keyof typeof PRIORITY_CONFIG];
            const PriorityIcon = priorityCfg.icon;
            const isExpanded = expandedItems.has(item.id);
            const stepsComplete = Object.values(item.steps).filter(Boolean).length;
            const stepsTotal = Object.keys(item.steps).filter(k => k !== 'review_progress').length;
            const progress = Math.round((stepsComplete / stepsTotal) * 100);

            return (
              <div key={item.id} className={`border rounded-xl overflow-hidden ${priorityCfg.bg}`}>
                {/* Header */}
                <button onClick={() => toggleExpand(item.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/5 transition-colors">
                  <PriorityIcon size={18} className={priorityCfg.color} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white">{item.company_name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{item.company_code}</span>
                      <span className={`text-xs font-bold ${priorityCfg.color}`}>{priorityCfg.label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-400 mt-0.5">
                      <span>{item.period_label}</span>
                      <span>|</span>
                      <span>{item.filing_type}</span>
                      <span>|</span>
                      <span className="text-red-400 font-medium">{item.days_overdue}d overdue</span>
                    </div>
                  </div>

                  {/* Mini progress */}
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-xs text-slate-400">{stepsComplete}/{stepsTotal}</span>
                  </div>

                  {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </button>

                {/* Expanded Steps */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-700/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-3">
                      <StepItem label="Statement Received" done={item.steps.statement_received} />
                      <StepItem label="Uploaded to App" done={item.steps.uploaded} />
                      <StepItem label="Transactions Reviewed" done={item.steps.transactions_reviewed}
                        extra={item.steps.review_progress > 0 && !item.steps.transactions_reviewed ? `${item.steps.review_progress}%` : undefined} />
                      <StepItem label="Tax Report Generated" done={item.steps.tax_report_generated} />
                      <StepItem label="Sent to Accountant" done={item.steps.sent_to_accountant} />
                    </div>

                    <div className="flex items-center gap-3 pt-2 flex-wrap">
                      {item.amount_owing && (
                        <span className="text-sm text-slate-300">Amount owing: <strong className="text-red-400">{formatCurrency(Number(item.amount_owing))}</strong></span>
                      )}
                      {item.notes && (
                        <span className="text-xs text-slate-400 italic">{item.notes}</span>
                      )}
                      <div className="ml-auto flex gap-2">
                        <Link to={`/upload`} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg flex items-center gap-1 no-underline">
                          Upload <ArrowUpRight size={12} />
                        </Link>
                        <Link to={`/review?company_id=${item.company_id}`} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg flex items-center gap-1 no-underline">
                          Review <ArrowUpRight size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

function StepItem({ label, done, extra }: { label: string; done: boolean; extra?: string }) {
  return (
    <div className={`flex items-center gap-2 text-sm p-2 rounded ${done ? 'bg-green-500/10' : 'bg-slate-700/30'}`}>
      {done ? <CheckCircle2 size={14} className="text-green-400 shrink-0" /> : <Circle size={14} className="text-slate-500 shrink-0" />}
      <span className={done ? 'text-green-300' : 'text-slate-400'}>{label}</span>
      {extra && <span className="ml-auto text-xs text-yellow-400">{extra}</span>}
    </div>
  );
}
