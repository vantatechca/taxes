import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { COMPANY_TYPES, JURISDICTIONS } from '../lib/constants';
import { ChevronRight, ChevronLeft, Check, Building2, CreditCard, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

interface Step { key: string; label: string; }

const STEPS: Step[] = [
  { key: 'welcome', label: 'Welcome' },
  { key: 'companies', label: 'Companies' },
  { key: 'accounts', label: 'Bank Accounts' },
  { key: 'catch_up', label: 'Catch-Up' },
  { key: 'complete', label: 'Done' },
];

export default function OnboardingPage({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [companies, setCompanies] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // New company form
  const [newCompany, setNewCompany] = useState({ name: '', short_code: '', type: 'quebec_inc', jurisdiction: 'QC' });
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  useEffect(() => {
    api.getCompanies().then(setCompanies);
    api.getBankAccounts().then(setBankAccounts);
  }, []);

  async function saveCompanyName(id: string, name: string) {
    await api.updateCompany(id, { name });
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, name } : c));
  }

  async function addCompany() {
    if (!newCompany.name || !newCompany.short_code) return;
    setSaving(true);
    try {
      const created = await api.createCompany(newCompany);
      setCompanies(prev => [...prev, created]);
      setNewCompany({ name: '', short_code: '', type: 'quebec_inc', jurisdiction: 'QC' });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeCompany(id: string) {
    try {
      await api.deleteCompany(id);
      setCompanies(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setConfirmRemove(null);
    }
  }

  async function addBankAccount(companyId: string, data: any) {
    const created = await api.createBankAccount({ ...data, company_id: companyId });
    setBankAccounts(prev => [...prev, created]);
    return created;
  }

  const unnamedCompanies = companies.filter(c => !c.name);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                i < step ? 'bg-green-600 text-white' : i === step ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'
              }`}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`w-8 h-0.5 ${i < step ? 'bg-green-600' : 'bg-slate-700'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto">T</div>
              <h1 className="text-2xl font-bold text-white">Welcome to Tax Dashboard</h1>
              <p className="text-slate-400">Let's set up your multi-entity tax management system. This wizard will help you configure your companies, bank accounts, and identify any overdue filings.</p>
              <p className="text-sm text-slate-500">You can always change everything later in Settings.</p>
            </div>
          )}

          {/* Step 1: Companies */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><Building2 size={20} /> Your Companies</h2>
              <p className="text-sm text-slate-400">Name your companies and add or remove as needed. Everything is editable.</p>

              {companies.map(c => (
                <div key={c.id} className={`flex items-center gap-3 p-3 rounded-lg ${c.jurisdiction === 'QC' ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-green-500/10 border border-green-500/20'}`}>
                  <span className="text-xs px-2 py-0.5 bg-slate-700 rounded text-slate-300 shrink-0">{c.short_code}</span>
                  <input
                    value={c.name}
                    onChange={e => setCompanies(prev => prev.map(co => co.id === c.id ? { ...co, name: e.target.value } : co))}
                    onBlur={e => saveCompanyName(c.id, e.target.value)}
                    placeholder="Enter company name..."
                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                  />
                  <span className="text-xs text-slate-500 shrink-0">{JURISDICTIONS[c.jurisdiction as keyof typeof JURISDICTIONS]?.label}</span>
                  <button onClick={() => setConfirmRemove(c.id)} className="text-slate-500 hover:text-red-400" title="Remove"><Trash2 size={14} /></button>
                </div>
              ))}

              {/* Add new company */}
              <div className="border border-dashed border-slate-600 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-slate-300">Add another company</p>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Company name" value={newCompany.name} onChange={e => setNewCompany(p => ({ ...p, name: e.target.value }))}
                    className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm" />
                  <input placeholder="Short code (e.g. QC5)" value={newCompany.short_code} onChange={e => setNewCompany(p => ({ ...p, short_code: e.target.value.toUpperCase() }))}
                    className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm" maxLength={5} />
                  <select value={newCompany.type} onChange={e => setNewCompany(p => ({ ...p, type: e.target.value }))}
                    className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
                    {Object.entries(COMPANY_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <select value={newCompany.jurisdiction} onChange={e => setNewCompany(p => ({ ...p, jurisdiction: e.target.value }))}
                    className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
                    {Object.entries(JURISDICTIONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <button onClick={addCompany} disabled={!newCompany.name || !newCompany.short_code || saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg flex items-center gap-1">
                  <Plus size={14} /> Add Company
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Bank Accounts */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><CreditCard size={20} /> Bank Accounts</h2>
              <p className="text-sm text-slate-400">Add at least one bank account per company. You can add more later.</p>

              {companies.map(c => (
                <CompanyAccountSetup key={c.id} company={c} accounts={bankAccounts.filter((a: any) => a.company_id === c.id)} onAdd={(data: any) => addBankAccount(c.id, data)} />
              ))}
            </div>
          )}

          {/* Step 3: Catch-Up */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><AlertTriangle size={20} className="text-yellow-400" /> Catch-Up Assessment</h2>
              <p className="text-sm text-slate-400">Your TPS/TVQ filings may be overdue. Here's what needs attention:</p>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-sm text-yellow-300 font-medium mb-2">For each Canadian company, you'll need to:</p>
                <ol className="text-sm text-yellow-200/80 space-y-1 list-decimal list-inside">
                  <li>Download all missing bank statements going back to the last filed date</li>
                  <li>Upload each statement to the dashboard</li>
                  <li>Review and categorize all transactions</li>
                  <li>Generate TPS/TVQ reports for each overdue month</li>
                  <li>Send reports to your accountant / fiscaliste</li>
                </ol>
              </div>

              <p className="text-xs text-slate-500">After setup, go to <strong>Tax Periods</strong> to generate your first catch-up reports. Go to <strong>Settings &gt; Deadlines</strong> to auto-generate all filing deadlines.</p>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 4 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                <Check size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">You're all set!</h2>
              <p className="text-slate-400">Your dashboard is ready. Start by uploading your first bank statement.</p>
              <div className="text-sm text-slate-500 space-y-1">
                <p>Remember: everything is editable from Settings at any time.</p>
                <p>Add more companies, bank accounts, custom categories — whatever you need.</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-4 border-t border-slate-700">
            {step > 0 ? (
              <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg flex items-center gap-1">
                <ChevronLeft size={14} /> Back
              </button>
            ) : <div />}
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg flex items-center gap-1">
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button onClick={onComplete} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg">
                Go to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmRemove !== null}
        title="Remove Company"
        message="Remove this company? This cannot be undone if there are no transactions."
        confirmLabel="Remove"
        variant="danger"
        onConfirm={() => confirmRemove && removeCompany(confirmRemove)}
        onCancel={() => setConfirmRemove(null)}
      />
    </div>
  );
}

function CompanyAccountSetup({ company, accounts, onAdd }: { company: any; accounts: any[]; onAdd: (data: any) => Promise<any> }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ bank_name: '', account_number_last4: '', currency: company.jurisdiction === 'QC' ? 'CAD' : 'USD', account_type: 'checking', nickname: '' });
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    setSaving(true);
    try {
      await onAdd(form);
      setForm({ bank_name: '', account_number_last4: '', currency: company.jurisdiction === 'QC' ? 'CAD' : 'USD', account_type: 'checking', nickname: '' });
      setShowForm(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-slate-700/30 border border-slate-700 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">{company.name || company.short_code}</span>
        <span className="text-xs text-slate-400">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</span>
      </div>

      {accounts.map((a: any) => (
        <div key={a.id} className="text-xs text-slate-400 ml-2">- {a.nickname || a.bank_name} ({a.currency}, {a.account_type})</div>
      ))}

      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
          <Plus size={12} /> Add account
        </button>
      ) : (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input placeholder="Bank name" value={form.bank_name} onChange={e => setForm(p => ({ ...p, bank_name: e.target.value }))}
            className="px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs" />
          <input placeholder="Last 4" value={form.account_number_last4} onChange={e => setForm(p => ({ ...p, account_number_last4: e.target.value }))}
            className="px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs" maxLength={4} />
          <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
            className="px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs">
            <option value="CAD">CAD</option><option value="USD">USD</option>
          </select>
          <select value={form.account_type} onChange={e => setForm(p => ({ ...p, account_type: e.target.value }))}
            className="px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs">
            <option value="checking">Checking</option><option value="savings">Savings</option><option value="credit">Credit</option><option value="loc">LOC</option>
          </select>
          <div className="col-span-2 flex gap-2">
            <button onClick={handleAdd} disabled={!form.bank_name || saving}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded disabled:opacity-50">Add</button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1 bg-slate-600 text-white text-xs rounded">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
