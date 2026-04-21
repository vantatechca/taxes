import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { CATEGORIES } from '../lib/constants';
import type { CategoryKey } from '../lib/constants';
import { Zap, Plus, Trash2, Edit2, Check, X, Search } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

export default function PatternsPage() {
  const [patterns, setPatterns] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    match_string: '', match_type: 'contains', assigned_category: 'uncategorized', auto_apply: false,
  });

  const [form, setForm] = useState({
    company_id: '', match_type: 'contains', match_string: '',
    assigned_category: 'uncategorized', is_income: false, auto_apply: false,
  });

  useEffect(() => {
    Promise.all([api.getPatterns(), api.getCompanies()]).then(([p, c]) => {
      setPatterns(p);
      setCompanies(c);
      setLoading(false);
    });
  }, []);

  async function handleCreate() {
    try {
      const created = await api.createPattern({
        ...form,
        company_id: form.company_id || null,
      });
      setPatterns(prev => [created, ...prev]);
      setShowAdd(false);
      resetForm();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deletePattern(id);
      setPatterns(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setConfirmDelete(null);
    }
  }

  function startEditing(p: any) {
    setEditingId(p.id);
    setEditForm({
      match_string: p.match_string,
      match_type: p.match_type,
      assigned_category: p.assigned_category,
      auto_apply: p.auto_apply,
    });
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    try {
      const updated = await api.updatePattern(editingId, {
        match_string: editForm.match_string,
        match_type: editForm.match_type,
        assigned_category: editForm.assigned_category,
        auto_apply: editForm.auto_apply,
        is_income: editForm.assigned_category.startsWith('income'),
      });
      setPatterns(prev => prev.map(p => p.id === editingId ? { ...p, ...updated } : p));
      setEditingId(null);
    } catch (err: any) {
      alert(err.message);
    }
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function resetForm() {
    setForm({ company_id: '', match_type: 'contains', match_string: '', assigned_category: 'uncategorized', is_income: false, auto_apply: false });
  }

  const categoryOptions = Object.entries(CATEGORIES);

  const filteredPatterns = patterns.filter(p =>
    p.match_string.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Transaction Patterns</h1>
          <p className="text-sm text-slate-400">Auto-categorization rules for recurring transactions</p>
        </div>
        <button onClick={() => { setShowAdd(!showAdd); resetForm(); }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg flex items-center gap-2">
          <Plus size={16} /> New Pattern
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="bg-slate-800 border border-blue-500/30 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-white">Create New Pattern</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Match String</label>
              <input value={form.match_string} onChange={e => setForm(p => ({ ...p, match_string: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm" placeholder="e.g. SHOPIFY, GOOGLE ADS" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Match Type</label>
              <select value={form.match_type} onChange={e => setForm(p => ({ ...p, match_type: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
                <option value="contains">Contains</option>
                <option value="starts_with">Starts With</option>
                <option value="exact">Exact Match</option>
                <option value="regex">Regex</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Category</label>
              <select value={form.assigned_category} onChange={e => setForm(p => ({ ...p, assigned_category: e.target.value, is_income: e.target.value.startsWith('income') }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
                <optgroup label="Income">
                  {categoryOptions.filter(([_, v]) => v.group === 'income').map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </optgroup>
                <optgroup label="Expenses">
                  {categoryOptions.filter(([_, v]) => v.group === 'expense').map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Company (optional)</label>
              <select value={form.company_id} onChange={e => setForm(p => ({ ...p, company_id: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
                <option value="">Global (all companies)</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name || c.short_code}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={form.auto_apply} onChange={e => setForm(p => ({ ...p, auto_apply: e.target.checked }))}
                  className="rounded bg-slate-700 border-slate-600" />
                Auto-apply
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={!form.match_string}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg flex items-center gap-1">
              <Check size={14} /> Create
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-slate-600 text-white text-sm rounded-lg flex items-center gap-1">
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search patterns..."
          className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Patterns List */}
      {loading ? (
        <div className="text-center text-slate-400 py-12">Loading...</div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="text-left px-4 py-3 text-slate-300">Match</th>
                <th className="text-left px-4 py-3 text-slate-300">Type</th>
                <th className="text-left px-4 py-3 text-slate-300">Category</th>
                <th className="text-left px-4 py-3 text-slate-300">Scope</th>
                <th className="text-center px-4 py-3 text-slate-300">Auto</th>
                <th className="text-right px-4 py-3 text-slate-300">Used</th>
                <th className="text-right px-4 py-3 text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatterns.map(p => (
                <tr key={p.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                  {editingId === p.id ? (
                    <>
                      <td className="px-4 py-3">
                        <input value={editForm.match_string} onChange={e => setEditForm(prev => ({ ...prev, match_string: e.target.value }))}
                          className="w-full px-2 py-1 bg-slate-700 border border-slate-500 rounded text-white text-xs" />
                      </td>
                      <td className="px-4 py-3">
                        <select value={editForm.match_type} onChange={e => setEditForm(prev => ({ ...prev, match_type: e.target.value }))}
                          className="w-full px-2 py-1 bg-slate-700 border border-slate-500 rounded text-white text-xs">
                          <option value="contains">Contains</option>
                          <option value="starts_with">Starts With</option>
                          <option value="exact">Exact Match</option>
                          <option value="regex">Regex</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select value={editForm.assigned_category} onChange={e => setEditForm(prev => ({ ...prev, assigned_category: e.target.value }))}
                          className="w-full px-2 py-1 bg-slate-700 border border-slate-500 rounded text-white text-xs">
                          <optgroup label="Income">
                            {categoryOptions.filter(([_, v]) => v.group === 'income').map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                          </optgroup>
                          <optgroup label="Expenses">
                            {categoryOptions.filter(([_, v]) => v.group === 'expense').map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                          </optgroup>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{p.companies?.short_code || 'Global'}</td>
                      <td className="px-4 py-3 text-center">
                        <input type="checkbox" checked={editForm.auto_apply} onChange={e => setEditForm(prev => ({ ...prev, auto_apply: e.target.checked }))}
                          className="rounded bg-slate-700 border-slate-600" />
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300">{p.times_applied}x</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={handleSaveEdit} className="text-green-400 hover:text-green-300" title="Save">
                            <Check size={14} />
                          </button>
                          <button onClick={cancelEdit} className="text-slate-500 hover:text-white" title="Cancel">
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3">
                        <code className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-xs">{p.match_string}</code>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{p.match_type}</td>
                      <td className="px-4 py-3">
                        <span className="text-white text-xs">{CATEGORIES[p.assigned_category as CategoryKey]?.icon} {CATEGORIES[p.assigned_category as CategoryKey]?.label || p.assigned_category}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{p.companies?.short_code || 'Global'}</td>
                      <td className="px-4 py-3 text-center">
                        {p.auto_apply ? <Zap size={14} className="text-yellow-400 mx-auto" /> : <span className="text-slate-600">-</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300">{p.times_applied}x</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => startEditing(p)} className="text-slate-500 hover:text-blue-400" title="Edit">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => setConfirmDelete(p.id)} className="text-slate-500 hover:text-red-400" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPatterns.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              {searchQuery ? 'No patterns match your search.' : 'No patterns yet. Create one above or approve transactions in the Review Queue.'}
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={confirmDelete !== null}
        title="Delete Pattern"
        message="Are you sure you want to delete this pattern? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
