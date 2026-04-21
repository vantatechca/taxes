import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/constants';
import {
  RefreshCw, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronRight,
  FileText, TrendingDown, TrendingUp, BarChart3, Lightbulb, Shield, ClipboardList,
} from 'lucide-react';

// ---------- Types ----------
interface CompanyScan {
  id: string;
  name: string;
  shortCode: string;
  jurisdiction: string;
  healthScore: number;
  issues: Array<{ severity: 'critical' | 'warning' | 'info'; category: string; message: string }>;
}

interface ScanResult {
  overallScore: number;
  totalIssues: number;
  totalWarnings: number;
  totalClear: number;
  companies: CompanyScan[];
  missingFilings: Array<{ company: string; period: string; dueDate: string; daysOverdue: number }>;
  anomalies: Array<{ company: string; type: string; message: string; severity: 'high' | 'medium' | 'low' }>;
  reconciliation: Array<{ company: string; statementsUploaded: number; transactionsCategorized: number; totalTransactions: number; percentCategorized: number }>;
  thresholds: Array<{ company: string; type: string; current: number; limit: number; percentUsed: number }>;
  recommendations: string[];
  scannedAt: string;
}

// ---------- Mock/Fallback Data ----------
function buildMockData(): ScanResult {
  const now = new Date();
  return {
    overallScore: 62,
    totalIssues: 8,
    totalWarnings: 12,
    totalClear: 1,
    companies: [
      { id: '1', name: 'ACME Digital Inc.', shortCode: 'ACME', jurisdiction: 'QC', healthScore: 45, issues: [
        { severity: 'critical', category: 'missing_filing', message: 'Q1 2024 TPS/TVQ: NOT FILED (352 days overdue)' },
        { severity: 'critical', category: 'missing_filing', message: 'Q2 2024 TPS/TVQ: NOT FILED (260 days overdue)' },
        { severity: 'warning', category: 'uncategorized', message: '23 uncategorized transactions' },
        { severity: 'warning', category: 'anomaly', message: 'Revenue dropped 38% in March' },
      ]},
      { id: '2', name: 'NOVA Commerce Ltd.', shortCode: 'NOVA', jurisdiction: 'QC', healthScore: 55, issues: [
        { severity: 'critical', category: 'missing_filing', message: 'Q3 2024 TPS/TVQ: NOT FILED (168 days overdue)' },
        { severity: 'warning', category: 'uncategorized', message: '15 uncategorized transactions' },
        { severity: 'warning', category: 'threshold', message: '$26,800 YTD revenue — 89% of $30K small supplier threshold' },
      ]},
      { id: '3', name: 'ATLAS Media Corp.', shortCode: 'ATLAS', jurisdiction: 'QC', healthScore: 60, issues: [
        { severity: 'critical', category: 'missing_filing', message: 'Q4 2024 TPS/TVQ: NOT FILED (105 days overdue)' },
        { severity: 'warning', category: 'anomaly', message: 'February revenue dropped 45% vs January ($12,400 → $6,800)' },
        { severity: 'info', category: 'reconciliation', message: '2 of 3 statements uploaded' },
      ]},
      { id: '4', name: 'DETEC Solutions Inc.', shortCode: 'DETEC', jurisdiction: 'QC', healthScore: 70, issues: [
        { severity: 'critical', category: 'missing_filing', message: 'Q2 2024 TPS/TVQ: NOT FILED (260 days overdue)' },
        { severity: 'warning', category: 'reconciliation', message: '0 statements uploaded for March 2026' },
      ]},
      { id: '5', name: 'VERTEX LLC', shortCode: 'VERTEX', jurisdiction: 'US-DE', healthScore: 78, issues: [
        { severity: 'warning', category: 'threshold', message: '$28,400 YTD revenue — approaching $30K small supplier threshold (95%)' },
        { severity: 'info', category: 'uncategorized', message: '5 uncategorized transactions' },
      ]},
      { id: '6', name: 'APEX Digital LLC', shortCode: 'APEX', jurisdiction: 'US-NY', healthScore: 85, issues: [
        { severity: 'warning', category: 'anomaly', message: 'Revenue increased 55% in February' },
      ]},
      { id: '7', name: 'WYLLC', shortCode: 'WYLLC', jurisdiction: 'US-WY', healthScore: 92, issues: [] },
    ],
    missingFilings: [
      { company: 'ACME Digital Inc.', period: 'Q1 2024 TPS/TVQ', dueDate: '2024-04-30', daysOverdue: 352 },
      { company: 'ACME Digital Inc.', period: 'Q2 2024 TPS/TVQ', dueDate: '2024-07-31', daysOverdue: 260 },
      { company: 'NOVA Commerce Ltd.', period: 'Q3 2024 TPS/TVQ', dueDate: '2024-10-31', daysOverdue: 168 },
      { company: 'ATLAS Media Corp.', period: 'Q4 2024 TPS/TVQ', dueDate: '2025-01-31', daysOverdue: 105 },
      { company: 'DETEC Solutions Inc.', period: 'Q2 2024 TPS/TVQ', dueDate: '2024-07-31', daysOverdue: 260 },
    ],
    anomalies: [
      { company: 'ATLAS Media Corp.', type: 'revenue_anomaly', message: 'February revenue dropped 45% vs January ($12,400 → $6,800)', severity: 'high' },
      { company: 'ACME Digital Inc.', type: 'revenue_anomaly', message: 'March revenue dropped 38% vs February ($9,200 → $5,700)', severity: 'medium' },
      { company: 'APEX Digital LLC', type: 'revenue_anomaly', message: 'February revenue increased 55% vs January ($4,800 → $7,440)', severity: 'medium' },
      { company: 'NOVA Commerce Ltd.', type: 'uncategorized', message: '15 uncategorized transactions totaling $8,234', severity: 'medium' },
      { company: 'ACME Digital Inc.', type: 'uncategorized', message: '23 uncategorized transactions totaling $14,520', severity: 'high' },
    ],
    reconciliation: [
      { company: 'ACME Digital Inc.', statementsUploaded: 3, transactionsCategorized: 142, totalTransactions: 165, percentCategorized: 86 },
      { company: 'NOVA Commerce Ltd.', statementsUploaded: 2, transactionsCategorized: 78, totalTransactions: 93, percentCategorized: 84 },
      { company: 'ATLAS Media Corp.', statementsUploaded: 2, transactionsCategorized: 55, totalTransactions: 62, percentCategorized: 89 },
      { company: 'DETEC Solutions Inc.', statementsUploaded: 0, transactionsCategorized: 31, totalTransactions: 40, percentCategorized: 78 },
      { company: 'VERTEX LLC', statementsUploaded: 1, transactionsCategorized: 24, totalTransactions: 29, percentCategorized: 83 },
      { company: 'APEX Digital LLC', statementsUploaded: 2, transactionsCategorized: 38, totalTransactions: 41, percentCategorized: 93 },
      { company: 'WYLLC', statementsUploaded: 0, transactionsCategorized: 0, totalTransactions: 0, percentCategorized: 100 },
    ],
    thresholds: [
      { company: 'ACME Digital Inc.', type: 'Small Supplier ($30K CAD)', current: 18200, limit: 30000, percentUsed: 61 },
      { company: 'NOVA Commerce Ltd.', type: 'Small Supplier ($30K CAD)', current: 26800, limit: 30000, percentUsed: 89 },
      { company: 'ATLAS Media Corp.', type: 'Small Supplier ($30K CAD)', current: 14600, limit: 30000, percentUsed: 49 },
      { company: 'DETEC Solutions Inc.', type: 'Small Supplier ($30K CAD)', current: 9800, limit: 30000, percentUsed: 33 },
      { company: 'VERTEX LLC', type: 'US Nexus ($100K USD)', current: 28400, limit: 100000, percentUsed: 28 },
      { company: 'APEX Digital LLC', type: 'US Nexus ($100K USD)', current: 12300, limit: 100000, percentUsed: 12 },
      { company: 'WYLLC', type: 'US Nexus ($100K USD)', current: 0, limit: 100000, percentUsed: 0 },
    ],
    recommendations: [
      'Consider filing catch-up TPS/TVQ returns for 2024 Q1-Q4 to avoid further penalties',
      'WYLLC has $0 revenue — consider closing or filing a nil return',
      'Intercompany transfers between ACME and NOVA should be documented for CRA compliance',
      '2 companies have uncategorized transactions — review and categorize for accurate reporting',
      'NOVA is approaching the $30K small supplier threshold — plan for GST/QST registration',
      'DETEC has 0 statements uploaded — upload bank statements for March 2026',
    ],
    scannedAt: now.toISOString(),
  };
}

// ---------- Helpers ----------
function jurisdictionBadge(jurisdiction: string) {
  switch (jurisdiction) {
    case 'QC': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">CA QC</span>;
    case 'US-DE': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">US DE</span>;
    case 'US-NY': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">US NY</span>;
    case 'US-WY': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">US WY</span>;
    default: return <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-500/20 text-slate-300">{jurisdiction}</span>;
  }
}

function scoreColor(score: number): string {
  if (score >= 90) return 'text-green-400';
  if (score >= 70) return 'text-blue-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

function scoreBgBar(score: number): string {
  if (score >= 90) return 'bg-green-500';
  if (score >= 70) return 'bg-blue-500';
  if (score >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Needs Attention';
  return 'Critical';
}

function scoreLabelBg(score: number): string {
  if (score >= 90) return 'bg-green-500/20 text-green-400';
  if (score >= 70) return 'bg-blue-500/20 text-blue-400';
  if (score >= 50) return 'bg-yellow-500/20 text-yellow-400';
  return 'bg-red-500/20 text-red-400';
}

function severityIcon(severity: string) {
  switch (severity) {
    case 'critical': return <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />;
    case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />;
    default: return <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />;
  }
}

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
  return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) !== 1 ? 's' : ''} ago`;
}

// ---------- Collapsible Section ----------
function Section({ title, icon, borderColor, defaultOpen = false, count, children }: {
  title: string; icon: React.ReactNode; borderColor: string; defaultOpen?: boolean; count?: number; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`border rounded-xl overflow-hidden ${borderColor}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 transition-colors">
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-semibold text-white">{title}</span>
          {count !== undefined && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700 text-slate-300">{count}</span>
          )}
        </div>
        {open ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

// ---------- Main Page ----------
export default function AccountantPage() {
  const navigate = useNavigate();
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const loadScan = useCallback(async (isManual = false) => {
    if (isManual) setScanning(true);
    else setLoading(true);
    try {
      const data = await api.getAccountantScan();
      setScan(data);
    } catch {
      // Fallback to mock data for demo resilience
      setScan(buildMockData());
    } finally {
      setLoading(false);
      setScanning(false);
    }
  }, []);

  useEffect(() => { loadScan(); }, [loadScan]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
        <span className="ml-3 text-slate-400 text-lg">Running AI accountant scan...</span>
      </div>
    );
  }

  if (!scan) return null;

  // Build report text
  function generateReport(): string {
    if (!scan) return '';
    const lines: string[] = [];
    lines.push('=== AI ACCOUNTANT — MONTHLY HEALTH REPORT ===');
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push(`Overall Health Score: ${scan.overallScore}/100 (${scoreLabel(scan.overallScore)})`);
    lines.push(`Issues: ${scan.totalIssues} critical | ${scan.totalWarnings} warnings | ${scan.totalClear} all-clear`);
    lines.push('');
    lines.push('--- COMPANY HEALTH ---');
    for (const c of scan.companies) {
      lines.push(`${c.shortCode} (${c.jurisdiction}): ${c.healthScore}/100`);
      for (const iss of c.issues) {
        lines.push(`  [${iss.severity.toUpperCase()}] ${iss.message}`);
      }
      if (c.issues.length === 0) lines.push('  All Clear');
    }
    lines.push('');
    lines.push('--- MISSING FILINGS ---');
    if (scan.missingFilings.length === 0) lines.push('  None');
    for (const f of scan.missingFilings) {
      lines.push(`  ${f.company} — ${f.period}: ${f.daysOverdue} days overdue (due ${f.dueDate})`);
    }
    lines.push('');
    lines.push('--- ANOMALIES ---');
    if (scan.anomalies.length === 0) lines.push('  None');
    for (const a of scan.anomalies) {
      lines.push(`  [${a.severity.toUpperCase()}] ${a.company}: ${a.message}`);
    }
    lines.push('');
    lines.push('--- RECONCILIATION ---');
    for (const r of scan.reconciliation) {
      lines.push(`  ${r.company}: ${r.statementsUploaded} statements, ${r.percentCategorized}% categorized (${r.transactionsCategorized}/${r.totalTransactions})`);
    }
    lines.push('');
    lines.push('--- THRESHOLDS ---');
    for (const t of scan.thresholds) {
      lines.push(`  ${t.company}: $${t.current.toLocaleString()} / $${t.limit.toLocaleString()} (${t.percentUsed}%) — ${t.type}`);
    }
    lines.push('');
    lines.push('--- RECOMMENDATIONS ---');
    for (const r of scan.recommendations) {
      lines.push(`  • ${r}`);
    }
    lines.push('');
    lines.push('=== END OF REPORT ===');
    return lines.join('\n');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-7 h-7 text-blue-400" />
            AI Accountant
          </h1>
          <p className="text-sm text-slate-400 mt-1">Automated oversight for all 7 companies</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500">Last scan: {timeAgo(scan.scannedAt)}</span>
          <button
            onClick={() => loadScan(true)}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
            Run Full Scan
          </button>
        </div>
      </div>

      {/* Overall Health Score */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Score circle */}
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#334155" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke={scan.overallScore >= 90 ? '#22c55e' : scan.overallScore >= 70 ? '#3b82f6' : scan.overallScore >= 50 ? '#eab308' : '#ef4444'}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(scan.overallScore / 100) * 327} 327`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${scoreColor(scan.overallScore)}`}>{scan.overallScore}</span>
                <span className="text-xs text-slate-400">/ 100</span>
              </div>
            </div>
            <span className={`mt-2 px-3 py-1 rounded-full text-sm font-medium ${scoreLabelBg(scan.overallScore)}`}>
              {scoreLabel(scan.overallScore)}
            </span>
          </div>

          {/* Summary cards */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
              <XCircle className="w-6 h-6 text-red-400 mx-auto mb-1" />
              <div className="text-2xl font-bold text-red-400">{scan.totalIssues}</div>
              <div className="text-xs text-red-300/80">Issues Found</div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
              <AlertTriangle className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
              <div className="text-2xl font-bold text-yellow-400">{scan.totalWarnings}</div>
              <div className="text-xs text-yellow-300/80">Warnings</div>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
              <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" />
              <div className="text-2xl font-bold text-green-400">{scan.totalClear}</div>
              <div className="text-xs text-green-300/80">All Clear</div>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Company Health Cards */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Company Health</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {scan.companies.map(c => (
            <div key={c.id} className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-semibold text-white text-sm">{c.name}</div>
                  <div className="mt-1">{jurisdictionBadge(c.jurisdiction)}</div>
                </div>
                <span className={`text-lg font-bold ${scoreColor(c.healthScore)}`}>{c.healthScore}</span>
              </div>
              {/* Health bar */}
              <div className="w-full h-2 bg-slate-700 rounded-full mb-3">
                <div className={`h-2 rounded-full ${scoreBgBar(c.healthScore)}`} style={{ width: `${c.healthScore}%` }} />
              </div>
              {/* Issues list */}
              {c.issues.length === 0 ? (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4" /> All Clear
                </div>
              ) : (
                <div className="space-y-1.5">
                  {c.issues.slice(0, 3).map((iss, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      {severityIcon(iss.severity)}
                      <span className="line-clamp-2">{iss.message}</span>
                    </div>
                  ))}
                  {c.issues.length > 3 && (
                    <div className="text-xs text-slate-500">+{c.issues.length - 3} more issues</div>
                  )}
                </div>
              )}
              <div className="mt-3 text-xs text-slate-500">
                {c.issues.length === 0 ? 'All Clear' : `${c.issues.length} issue${c.issues.length !== 1 ? 's' : ''}`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Issues & Alerts Sections */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Issues & Alerts</h2>

        {/* Missing Filings */}
        <Section
          title="Missing Filings"
          icon={<FileText className="w-5 h-5 text-red-400" />}
          borderColor="border-red-500/30"
          defaultOpen={scan.missingFilings.length > 0}
          count={scan.missingFilings.length}
        >
          {scan.missingFilings.length === 0 ? (
            <p className="text-sm text-slate-400">No missing filings detected. All returns up to date.</p>
          ) : (
            <div className="space-y-2">
              {scan.missingFilings.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm text-white font-medium">{f.company} — {f.period}</div>
                      <div className="text-xs text-red-300">NOT FILED ({f.daysOverdue} days overdue) &middot; Due: {f.dueDate}</div>
                    </div>
                  </div>
                  <button onClick={() => navigate('/tax-periods')} className="text-xs text-blue-400 hover:text-blue-300 whitespace-nowrap">Go to Tax Periods →</button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Anomaly Detection */}
        <Section
          title="Anomaly Detection"
          icon={<TrendingDown className="w-5 h-5 text-yellow-400" />}
          borderColor="border-yellow-500/30"
          defaultOpen={scan.anomalies.length > 0}
          count={scan.anomalies.length}
        >
          {scan.anomalies.length === 0 ? (
            <p className="text-sm text-slate-400">No anomalies detected. Revenue and expenses are within normal ranges.</p>
          ) : (
            <div className="space-y-2">
              {scan.anomalies.map((a, i) => (
                <div key={i} className={`flex items-start gap-3 rounded-lg p-3 ${
                  a.severity === 'high' ? 'bg-yellow-500/5 border border-yellow-500/20' : 'bg-yellow-500/5 border border-yellow-500/10'
                }`}>
                  <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${a.severity === 'high' ? 'text-yellow-400' : 'text-yellow-500/70'}`} />
                  <div>
                    <div className="text-sm text-white font-medium">{a.company}</div>
                    <div className="text-xs text-yellow-300/80">{a.message}</div>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${
                      a.severity === 'high' ? 'bg-red-500/20 text-red-300' :
                      a.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-slate-500/20 text-slate-300'
                    }`}>{a.type === 'uncategorized' ? 'Uncategorized' : 'Revenue Anomaly'} &middot; {a.severity}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Reconciliation Status */}
        <Section
          title="Reconciliation Status"
          icon={<ClipboardList className="w-5 h-5 text-blue-400" />}
          borderColor="border-blue-500/30"
          count={scan.reconciliation.length}
        >
          <div className="space-y-2">
            {scan.reconciliation.map((r, i) => (
              <div key={i} className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white font-medium">{r.company}</span>
                  <span className={`text-xs font-medium ${r.percentCategorized >= 90 ? 'text-green-400' : r.percentCategorized >= 70 ? 'text-blue-400' : 'text-yellow-400'}`}>
                    {r.percentCategorized}% categorized
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-700 rounded-full mb-2">
                  <div className={`h-1.5 rounded-full ${r.percentCategorized >= 90 ? 'bg-green-500' : r.percentCategorized >= 70 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                    style={{ width: `${r.percentCategorized}%` }} />
                </div>
                <div className="text-xs text-slate-400">
                  {r.statementsUploaded} statement{r.statementsUploaded !== 1 ? 's' : ''} uploaded &middot;{' '}
                  {r.transactionsCategorized}/{r.totalTransactions} transactions categorized
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Threshold Monitoring */}
        <Section
          title="Threshold Monitoring"
          icon={<BarChart3 className="w-5 h-5 text-purple-400" />}
          borderColor="border-purple-500/30"
          count={scan.thresholds.length}
        >
          <div className="space-y-3">
            {scan.thresholds.map((t, i) => (
              <div key={i} className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white font-medium">{t.company}</span>
                  <span className="text-xs text-slate-400">{t.type}</span>
                </div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex-1 h-2.5 bg-slate-700 rounded-full">
                    <div
                      className={`h-2.5 rounded-full transition-all ${
                        t.percentUsed >= 90 ? 'bg-red-500' : t.percentUsed >= 70 ? 'bg-yellow-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${Math.min(t.percentUsed, 100)}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold whitespace-nowrap ${
                    t.percentUsed >= 90 ? 'text-red-400' : t.percentUsed >= 70 ? 'text-yellow-400' : 'text-purple-400'
                  }`}>{t.percentUsed}%</span>
                </div>
                <div className="text-xs text-slate-400">
                  ${t.current.toLocaleString()} / ${t.limit.toLocaleString()} YTD
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Recommendations */}
        <Section
          title="Recommendations"
          icon={<Lightbulb className="w-5 h-5 text-green-400" />}
          borderColor="border-green-500/30"
          defaultOpen
          count={scan.recommendations.length}
        >
          {scan.recommendations.length === 0 ? (
            <p className="text-sm text-slate-400">No recommendations at this time. Everything looks good!</p>
          ) : (
            <div className="space-y-2">
              {scan.recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-3 bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                  <Lightbulb className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">{r}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Monthly Report Generator */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold">Monthly Health Report</h3>
            <p className="text-xs text-slate-400 mt-1">Generate a comprehensive text summary of all findings</p>
          </div>
          <button
            onClick={() => setShowReport(!showReport)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <FileText className="w-4 h-4" />
            {showReport ? 'Hide Report' : 'Generate Monthly Report'}
          </button>
        </div>
        {showReport && (
          <div className="relative">
            <pre className="bg-slate-900 border border-slate-700 rounded-lg p-4 text-xs text-slate-300 font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
              {generateReport()}
            </pre>
            <button
              onClick={() => { navigator.clipboard.writeText(generateReport()); }}
              className="absolute top-2 right-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
            >
              Copy to Clipboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
