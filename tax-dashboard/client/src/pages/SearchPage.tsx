import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { CATEGORIES, formatCurrency } from '../lib/constants';
import type { CategoryKey } from '../lib/constants';
import { Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export default function SearchPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [reviewedFilter, setReviewedFilter] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 25;

  useEffect(() => {
    api.getCompanies().then(setCompanies);
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (debouncedQuery) params.q = debouncedQuery;
      if (companyFilter) params.company_id = companyFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (minAmount) params.min_amount = minAmount;
      if (maxAmount) params.max_amount = maxAmount;
      if (categoryFilter) params.category = categoryFilter;
      if (reviewedFilter) params.reviewed = reviewedFilter;
      params.page = String(page);
      params.limit = String(pageSize);

      const res = await api.searchTransactions(params);
      if (Array.isArray(res)) {
        setResults(res);
        setTotalCount(res.length);
      } else {
        setResults(res.transactions || res.data || []);
        setTotalCount(res.total || res.count || (res.transactions || res.data || []).length);
      }
    } catch {
      setResults([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, companyFilter, dateFrom, dateTo, minAmount, maxAmount, categoryFilter, reviewedFilter, page]);

  useEffect(() => {
    doSearch();
  }, [doSearch]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, companyFilter, dateFrom, dateTo, minAmount, maxAmount, categoryFilter, reviewedFilter]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const categoryOptions = Object.entries(CATEGORIES);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Search Transactions</h1>
        <p className="text-sm text-slate-400">Search and filter across all companies and periods</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by description, vendor, reference..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-300">Filters</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
            <option value="">All Companies</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name || c.short_code}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="From"
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="To"
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm" />
          <input type="number" value={minAmount} onChange={e => setMinAmount(e.target.value)} placeholder="Min $"
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm" />
          <input type="number" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} placeholder="Max $"
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm" />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
            <option value="">All Categories</option>
            <optgroup label="Income">
              {categoryOptions.filter(([, v]) => v.group === 'income').map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </optgroup>
            <optgroup label="Expenses">
              {categoryOptions.filter(([, v]) => v.group === 'expense').map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </optgroup>
          </select>
        </div>
        <div className="mt-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <select value={reviewedFilter} onChange={e => setReviewedFilter(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
              <option value="">All Status</option>
              <option value="true">Reviewed</option>
              <option value="false">Unreviewed</option>
            </select>
          </label>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-x-auto">
        {loading ? (
          <div className="text-center text-slate-400 py-12">Searching...</div>
        ) : results.length === 0 ? (
          <div className="text-center text-slate-400 py-12">No transactions found. Try adjusting your filters.</div>
        ) : (
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="text-left px-4 py-3 text-slate-300">Date</th>
                <th className="text-left px-4 py-3 text-slate-300">Description</th>
                <th className="text-right px-4 py-3 text-slate-300">Amount</th>
                <th className="text-left px-4 py-3 text-slate-300">Category</th>
                <th className="text-left px-4 py-3 text-slate-300">Company</th>
                <th className="text-center px-4 py-3 text-slate-300">Reviewed</th>
              </tr>
            </thead>
            <tbody>
              {results.map((t: any) => (
                <tr key={t.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                  <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{t.date ? new Date(t.date).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3 text-white truncate max-w-[250px]">{t.description_clean || t.description_raw || t.description || '-'}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <span className={t.type === 'credit' ? 'text-green-400' : 'text-red-400'}>
                      {t.type === 'credit' ? '+' : '-'}{formatCurrency(Number(t.amount), t.currency || 'CAD')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {CATEGORIES[t.category as CategoryKey]?.icon} {CATEGORIES[t.category as CategoryKey]?.label || t.category || '-'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{t.companies?.short_code || t.company_name || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    {t.is_reviewed ? (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">Yes</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-600 text-slate-300 rounded text-xs">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalCount > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
            <span className="text-xs text-slate-400">
              Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, totalCount)} of {totalCount}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-1.5 bg-slate-700 rounded text-slate-300 hover:text-white disabled:opacity-50">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-slate-300">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="p-1.5 bg-slate-700 rounded text-slate-300 hover:text-white disabled:opacity-50">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
