import { useEffect, useState, useRef } from 'react';
import { api } from '../lib/api';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Plus } from 'lucide-react';

export default function UploadPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [statements, setStatements] = useState<any[]>([]);
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({ bank_name: '', account_number_last4: '', currency: 'CAD', account_type: 'checking', nickname: '' });
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getCompanies().then(setCompanies).catch(console.error);
    api.getStatements().then(setStatements).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      api.getBankAccounts(selectedCompany).then(setBankAccounts).catch(console.error);
    } else {
      setBankAccounts([]);
    }
    setSelectedAccount('');
  }, [selectedCompany]);

  const handleUpload = async () => {
    if (!file || !selectedCompany || !selectedAccount) return;
    setUploading(true);
    setResult(null);
    try {
      const res = await api.uploadStatement(file, selectedCompany, selectedAccount, periodStart, periodEnd);
      setResult({ success: true, message: `Extracted ${res.transactionsExtracted} transactions. Ready for review.` });
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      api.getStatements().then(setStatements);
    } catch (err: any) {
      setResult({ success: false, message: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!selectedCompany || !newAccount.bank_name) return;
    try {
      const created = await api.createBankAccount({ ...newAccount, company_id: selectedCompany });
      setBankAccounts(prev => [...prev, created]);
      setSelectedAccount(created.id);
      setShowNewAccount(false);
      setNewAccount({ bank_name: '', account_number_last4: '', currency: 'CAD', account_type: 'checking', nickname: '' });
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-white">Upload Bank Statement</h1>

      {/* Upload Form */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
        {/* Company */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Company</label>
          <select value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select company...</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name || c.short_code} ({c.jurisdiction})</option>)}
          </select>
        </div>

        {/* Bank Account */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-slate-300">Bank Account</label>
            {selectedCompany && (
              <button onClick={() => setShowNewAccount(!showNewAccount)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                <Plus size={12} /> New Account
              </button>
            )}
          </div>
          <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} disabled={!selectedCompany}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select bank account...</option>
            {bankAccounts.map((a: any) => (
              <option key={a.id} value={a.id}>{a.nickname || a.bank_name} — {a.currency} ({a.account_type})</option>
            ))}
          </select>
        </div>

        {/* Inline New Account */}
        {showNewAccount && (
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-medium text-white">Add New Bank Account</h3>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Bank name (e.g. Mercury)" value={newAccount.bank_name} onChange={e => setNewAccount(p => ({ ...p, bank_name: e.target.value }))}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm" />
              <input placeholder="Last 4 digits" value={newAccount.account_number_last4} onChange={e => setNewAccount(p => ({ ...p, account_number_last4: e.target.value }))}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm" maxLength={4} />
              <select value={newAccount.currency} onChange={e => setNewAccount(p => ({ ...p, currency: e.target.value }))}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
                <option value="CAD">CAD</option><option value="USD">USD</option>
              </select>
              <select value={newAccount.account_type} onChange={e => setNewAccount(p => ({ ...p, account_type: e.target.value }))}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
                <option value="checking">Checking</option><option value="savings">Savings</option><option value="credit">Credit</option><option value="loc">Line of Credit</option>
              </select>
            </div>
            <input placeholder="Nickname (optional)" value={newAccount.nickname} onChange={e => setNewAccount(p => ({ ...p, nickname: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm" />
            <div className="flex gap-2">
              <button onClick={handleCreateAccount} className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Create</button>
              <button onClick={() => setShowNewAccount(false)} className="px-4 py-1.5 bg-slate-600 text-white text-sm rounded-lg hover:bg-slate-500">Cancel</button>
            </div>
          </div>
        )}

        {/* Period */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Period Start</label>
            <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Period End</label>
            <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* File */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">PDF Statement</label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              dragOver
                ? 'border-blue-400 bg-blue-500/10'
                : 'border-slate-600 hover:border-blue-500/50'
            }`}
            onClick={() => fileRef.current?.click()}
            onDragEnter={e => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
            onDragLeave={e => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }}
            onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
            onDrop={e => {
              e.preventDefault();
              e.stopPropagation();
              setDragOver(false);
              const droppedFile = e.dataTransfer.files?.[0];
              if (droppedFile) {
                if (droppedFile.size > 10 * 1024 * 1024) {
                  alert('File is too large. Maximum file size is 10 MB.');
                  return;
                }
                setFile(droppedFile);
              }
            }}
          >
            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => {
              const selected = e.target.files?.[0] || null;
              if (selected && selected.size > 10 * 1024 * 1024) {
                alert('File is too large. Maximum file size is 10 MB.');
                return;
              }
              setFile(selected);
            }} />
            {dragOver ? (
              <div className="text-blue-400">
                <Upload size={24} className="mx-auto mb-2" />
                <p className="text-sm font-medium">Drop your file here!</p>
              </div>
            ) : file ? (
              <div className="flex items-center justify-center gap-2 text-blue-400">
                <FileText size={20} />
                <span className="text-sm">{file.name} ({(file.size / 1024).toFixed(0)} KB)</span>
              </div>
            ) : (
              <div className="text-slate-400">
                <Upload size={24} className="mx-auto mb-2" />
                <p className="text-sm">Click to select or drag & drop a PDF bank statement</p>
              </div>
            )}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${result.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {result.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {result.message}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleUpload}
          disabled={!file || !selectedCompany || !selectedAccount || uploading}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {uploading ? <><Loader2 size={16} className="animate-spin" /> Processing with AI...</> : <><Upload size={16} /> Upload & Extract</>}
        </button>
      </div>

      {/* Recent Statements */}
      {statements.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <h2 className="text-lg font-semibold text-white mb-3">Recent Uploads</h2>
          <div className="space-y-2">
            {statements.slice(0, 10).map((s: any) => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg text-sm">
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-slate-400" />
                  <div>
                    <p className="text-white">{s.file_name}</p>
                    <p className="text-xs text-slate-400">{s.companies?.name || s.companies?.short_code}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  s.status === 'complete' ? 'bg-green-500/20 text-green-400' :
                  s.status === 'review' ? 'bg-yellow-500/20 text-yellow-400' :
                  s.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-slate-600 text-slate-300'
                }`}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
