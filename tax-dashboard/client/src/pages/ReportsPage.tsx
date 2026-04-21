import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '../lib/api';
import { formatCurrency, CATEGORIES } from '../lib/constants';
import type { CategoryKey } from '../lib/constants';
import {
  FileDown, BarChart3, AlertTriangle, FileText, Mail,
  Copy, Check, X, FileSpreadsheet, BookOpen
} from 'lucide-react';

interface ExportHistoryEntry {
  type: string;
  filename: string;
  date: string;
  company: string;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function loadExportHistory(): ExportHistoryEntry[] {
  try {
    const raw = localStorage.getItem('tax_dashboard_export_history');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveExportHistoryEntry(entry: ExportHistoryEntry) {
  const history = loadExportHistory();
  history.unshift(entry);
  localStorage.setItem('tax_dashboard_export_history', JSON.stringify(history.slice(0, 50)));
}

export default function ReportsPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [report, setReport] = useState<any>(null);
  const [annualReport, setAnnualReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [emailModal, setEmailModal] = useState<null | { subject: string; body: string; type: string }>(null);
  const [copied, setCopied] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportHistoryEntry[]>(loadExportHistory());

  const copyBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    api.getCompanies().then(comps => {
      setCompanies(comps);
      if (comps.length > 0) setSelectedCompany(comps[0].id);
    });
  }, []);

  const selectedComp = companies.find(c => c.id === selectedCompany);

  function addToHistory(type: string, filename: string) {
    const entry: ExportHistoryEntry = {
      type,
      filename,
      date: new Date().toISOString(),
      company: selectedComp?.name || 'All',
    };
    saveExportHistoryEntry(entry);
    setExportHistory(loadExportHistory());
  }

  async function loadReport() {
    if (!selectedCompany) return;
    setLoading(true);
    try {
      const [monthly, annual] = await Promise.all([
        api.getMonthlyReport(selectedCompany, year, month),
        api.getAnnualReport(selectedCompany, year).catch(() => null),
      ]);
      setReport(monthly);
      setAnnualReport(annual);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (selectedCompany) loadReport(); }, [selectedCompany, year, month]);

  async function downloadMonthly() {
    try {
      const filename = `report_${year}-${String(month).padStart(2, '0')}.xlsx`;
      const blob = await api.exportMonthlyReport(selectedCompany, year, month);
      downloadBlob(blob, filename);
      addToHistory('Monthly Report', filename);
    } catch (err: any) { alert('Export failed: ' + err.message); }
  }

  async function downloadAccountantPackage() {
    try {
      const filename = `AccountantPackage_${year}.xlsx`;
      const blob = await api.exportAccountantPackage(year);
      downloadBlob(blob, filename);
      addToHistory('Accountant Package', filename);
    } catch (err: any) { alert('Export failed: ' + err.message); }
  }

  async function downloadTracker() {
    try {
      const filename = `MasterTaxTracker_${year}.xlsx`;
      const blob = await api.downloadTracker(year);
      downloadBlob(blob, filename);
      addToHistory('Master Tax Tracker', filename);
    } catch (err: any) { alert('Export failed: ' + err.message); }
  }

  async function downloadTpsTvqPdf() {
    try {
      const filename = `TPS-TVQ_${year}-${String(month).padStart(2, '0')}.pdf`;
      const blob = await api.downloadTpsTvqPdf(selectedCompany, year, month);
      downloadBlob(blob, filename);
      addToHistory('TPS/TVQ PDF', filename);
    } catch (err: any) { alert('Export failed: ' + err.message); }
  }

  async function downloadCoverNote() {
    try {
      const comp = companies.find(c => c.id === selectedCompany);
      const filename = `CoverNote_${comp?.short_code || ''}_${year}-${String(month).padStart(2, '0')}.pdf`;
      const blob = await api.downloadCoverNoteDocx(selectedCompany, year, month);
      downloadBlob(blob, filename);
      addToHistory('Cover Note', filename);
    } catch (err: any) { alert('Export failed: ' + err.message); }
  }

  async function downloadSOP() {
    try {
      const filename = 'SOP_Tax_Management.pdf';
      const blob = await api.downloadSOP();
      downloadBlob(blob, filename);
      addToHistory('SOP Document', filename);
    } catch (err: any) { alert('Export failed: ' + err.message); }
  }

  async function openEmailTemplate(type: 'accountant-package' | 'escalation' | 'missing-statement') {
    try {
      let data: any;
      if (type === 'accountant-package') {
        data = await api.getAccountantEmailTemplate(selectedCompany, year, month);
      } else if (type === 'escalation') {
        data = await api.getEscalationTemplate(selectedCompany);
      } else {
        data = await api.getMissingStatementTemplate(selectedCompany, year, month);
      }
      setEmailModal(data);
    } catch (err: any) { alert('Failed: ' + err.message); }
  }

  function copyEmail() {
    if (!emailModal) return;
    navigator.clipboard.writeText(`Subject: ${emailModal.subject}\n\n${emailModal.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function closeEmailModal() {
    setEmailModal(null);
    setCopied(false);
  }

  // Escape key handler for email modal
  const handleEscapeKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && emailModal) {
      closeEmailModal();
    }
  }, [emailModal]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [handleEscapeKey]);

  // Auto-focus Copy All button when modal opens
  useEffect(() => {
    if (emailModal && copyBtnRef.current) {
      copyBtnRef.current.focus();
    }
  }, [emailModal]);

  function clearHistory() {
    localStorage.removeItem('tax_dashboard_export_history');
    setExportHistory([]);
  }

  const isQuebec = selectedComp?.jurisdiction === 'QC';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white dark:text-white">Reports & Exports</h1>
        <div className="flex gap-2">
          <select value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)}
            className="px-3 py-2 bg-slate-700 dark:bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
            {companies.map(c => <option key={c.id} value={c.id}>{c.name || c.short_code}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="px-3 py-2 bg-slate-700 dark:bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
            {Array.from({ length: new Date().getFullYear() - 2024 + 2 }, (_, i) => 2024 + i).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="px-3 py-2 bg-slate-700 dark:bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{new Date(year, m - 1).toLocaleString('en', { month: 'long' })}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ===== EXPORT BUTTONS ===== */}
      <div className="bg-slate-800 dark:bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-4">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Excel Exports</h2>
        <div className="flex gap-3 flex-wrap">
          <button onClick={downloadMonthly} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg flex items-center gap-2">
            <FileDown size={16} /> Monthly Report
          </button>
          <button onClick={downloadAccountantPackage} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg flex items-center gap-2">
            <FileDown size={16} /> Accountant Package
          </button>
          <button onClick={downloadTracker} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg flex items-center gap-2">
            <FileSpreadsheet size={16} /> Master Tax Tracker
          </button>
        </div>

        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider pt-2">PDF Exports</h2>
        <div className="flex gap-3 flex-wrap">
          {isQuebec && (
            <button onClick={downloadTpsTvqPdf} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg flex items-center gap-2">
              <FileText size={16} /> TPS/TVQ Remittance PDF
            </button>
          )}
          <button onClick={downloadCoverNote} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg flex items-center gap-2">
            <FileText size={16} /> Accountant Cover Note
          </button>
          <button onClick={downloadSOP} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded-lg flex items-center gap-2">
            <BookOpen size={16} /> SOP Document
          </button>
        </div>

        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider pt-2">Email Templates</h2>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => openEmailTemplate('accountant-package')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg flex items-center gap-2">
            <Mail size={16} /> Accountant Send
          </button>
          <button onClick={() => openEmailTemplate('escalation')} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg flex items-center gap-2">
            <Mail size={16} /> Escalation
          </button>
          <button onClick={() => openEmailTemplate('missing-statement')} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-lg flex items-center gap-2">
            <Mail size={16} /> Missing Statement
          </button>
        </div>
      </div>

      {/* ===== EMAIL MODAL ===== */}
      {emailModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={closeEmailModal}>
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-white font-semibold">Email Template</h3>
              <div className="flex items-center gap-2">
                <button ref={copyBtnRef} onClick={copyEmail} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg flex items-center gap-1.5">
                  {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy All</>}
                </button>
                <button onClick={closeEmailModal} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              <div>
                <label className="text-xs text-slate-400">Subject</label>
                <div className="p-2 bg-slate-700 rounded text-sm text-white mt-1">{emailModal.subject}</div>
              </div>
              <div>
                <label className="text-xs text-slate-400">Body</label>
                <pre className="p-3 bg-slate-700 rounded text-sm text-slate-200 mt-1 whitespace-pre-wrap font-sans leading-relaxed">{emailModal.body}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== REPORT DATA ===== */}
      {loading ? (
        <div className="text-center text-slate-400 py-12">Loading report...</div>
      ) : report ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><BarChart3 size={18} className="text-green-400" /> Income</h2>
            <div className="space-y-2">
              {Object.entries(report.income || {}).map(([cat, amount]) => (
                <div key={cat} className="flex justify-between text-sm">
                  <span className="text-slate-400">{CATEGORIES[cat as CategoryKey]?.label || cat}</span>
                  <span className="text-green-400">{formatCurrency(amount as number)}</span>
                </div>
              ))}
              <div className="border-t border-slate-700 pt-2 flex justify-between font-bold">
                <span className="text-white">Total Income</span>
                <span className="text-green-400">{formatCurrency(report.totalIncome)}</span>
              </div>
            </div>
          </div>

          {/* Expenses */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><BarChart3 size={18} className="text-red-400" /> Expenses</h2>
            <div className="space-y-2">
              {Object.entries(report.expenses || {}).map(([cat, amount]) => (
                <div key={cat} className="flex justify-between text-sm">
                  <span className="text-slate-400">{CATEGORIES[cat as CategoryKey]?.label || cat}</span>
                  <span className="text-red-400">{formatCurrency(amount as number)}</span>
                </div>
              ))}
              <div className="border-t border-slate-700 pt-2 flex justify-between font-bold">
                <span className="text-white">Total Expenses</span>
                <span className="text-red-400">{formatCurrency(report.totalExpenses)}</span>
              </div>
            </div>
          </div>

          {/* Tax Summary */}
          {report.tax && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <h2 className="text-lg font-semibold text-white mb-3">TPS/TVQ Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">TPS Collected</span><span>{formatCurrency(report.tax.tpsCollected)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">TVQ Collected</span><span>{formatCurrency(report.tax.tvqCollected)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">TPS ITC</span><span className="text-green-400">-{formatCurrency(report.tax.tpsITC)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">TVQ ITR</span><span className="text-green-400">-{formatCurrency(report.tax.tvqITR)}</span></div>
                <div className="border-t border-slate-700 pt-2">
                  <div className="flex justify-between font-bold"><span>TPS Net Owing</span><span className={report.tax.tpsNet >= 0 ? 'text-red-400' : 'text-green-400'}>{formatCurrency(report.tax.tpsNet)}</span></div>
                  <div className="flex justify-between font-bold"><span>TVQ Net Owing</span><span className={report.tax.tvqNet >= 0 ? 'text-red-400' : 'text-green-400'}>{formatCurrency(report.tax.tvqNet)}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* T4A Flags */}
          {annualReport?.t4aFlags?.length > 0 && (
            <div className="bg-slate-800 border border-yellow-500/30 rounded-xl p-4">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <AlertTriangle size={18} className="text-yellow-400" /> T4A Flags
              </h2>
              <p className="text-xs text-yellow-300 mb-3">Vendors paid over $500 CAD this year -- T4A may be required</p>
              <div className="space-y-2">
                {annualReport.t4aFlags.map((f: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm p-2 bg-yellow-500/10 rounded">
                    <span className="text-white">{f.vendor}</span>
                    <span className="text-yellow-400 font-medium">{formatCurrency(f.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary stats */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h2 className="text-lg font-semibold text-white mb-3">Period Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Intercompany Txns</span><span>{report.intercompanyCount}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Unreviewed Txns</span><span className={report.unreviewedCount > 0 ? 'text-yellow-400' : 'text-green-400'}>{report.unreviewedCount}</span></div>
              <div className="flex justify-between font-bold border-t border-slate-700 pt-2">
                <span className="text-white">Net Profit</span>
                <span className={report.totalIncome - report.totalExpenses >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {formatCurrency(report.totalIncome - report.totalExpenses)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ===== EXPORT HISTORY ===== */}
      <details className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <summary className="text-sm font-semibold text-slate-300 cursor-pointer">Export History ({exportHistory.length})</summary>
        {exportHistory.length > 0 ? (
          <>
            <table className="w-full text-sm mt-3">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="text-left px-3 py-2 text-slate-400">Type</th>
                  <th className="text-left px-3 py-2 text-slate-400">Filename</th>
                  <th className="text-left px-3 py-2 text-slate-400">Company</th>
                  <th className="text-left px-3 py-2 text-slate-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {exportHistory.slice(0, 10).map((entry, i) => (
                  <tr key={i} className="border-t border-slate-700">
                    <td className="px-3 py-2 text-white">{entry.type}</td>
                    <td className="px-3 py-2 text-slate-300 text-xs">{entry.filename}</td>
                    <td className="px-3 py-2 text-slate-400 text-xs">{entry.company}</td>
                    <td className="px-3 py-2 text-slate-500 text-xs">{new Date(entry.date).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={clearHistory} className="mt-3 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg">
              Clear
            </button>
          </>
        ) : (
          <p className="text-xs text-slate-500 mt-2">No exports yet.</p>
        )}
      </details>
    </div>
  );
}
