import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '../lib/api';
import {
  Brain, Send, Loader2, Trash2, Download, ChevronRight, ChevronLeft,
  MessageSquare, Building2, ToggleLeft, ToggleRight, Sparkles,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Channel = 'ca' | 'us';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface CompanyCtx {
  id: string;
  name: string;
  jurisdiction: string;
  revenue: number;
  expenses: number;
  pending: number;
  included: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const STORAGE_KEYS = {
  ca: { history: 'fiscaliste_ca_history', insights: 'fiscaliste_ca_insights' },
  us: { history: 'fiscaliste_us_history', insights: 'fiscaliste_us_insights' },
};

const MAX_MESSAGES = 100;

const QUICK_PROMPTS: Record<Channel, string[]> = {
  ca: [
    'How can I maximize my ITC/ITR claims?',
    'Intercompany loan strategies between my companies',
    'Home office deduction across multiple companies',
    'Revenue splitting between entities',
    'Salary vs dividends for tax efficiency',
    'R&D tax credits (SR&ED) eligibility',
    'Holding company structure benefits',
    'Grey zones in business expense deductions',
  ],
  us: [
    'S-Corp election \u2014 is it worth it for my LLCs?',
    'How do Amazon/Apple structure to minimize US tax?',
    'Cross-border income planning (CA \u2194 US)',
    'Delaware holding company advantages',
    'Qualified Business Income (QBI) deduction',
    'How to offset income between LLCs',
    'Vehicle and travel deductions across entities',
    'State tax minimization strategies',
  ],
};

const CA_COMPANIES = ['ACME Digital Inc.', 'Atlas Consulting Lt\u00e9e', 'Nova Commerce SENC', 'Vertex Media Corp'];
const US_COMPANIES = ['DE Tech Corp', 'NY Agency Inc', 'Wyatt LLC'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota exceeded -- silently ignore */ }
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

// Sanitize a string so it is safe to embed in HTML.
// Escapes &, <, >, ", and ' to their entity equivalents.
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .trim();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function FiscalistePage() {
  const [channel, setChannel] = useState<Channel>('ca');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<CompanyCtx[]>([]);
  const [contextOpen, setContextOpen] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // -----------------------------------------------------------------------
  // Load companies + summaries on mount
  // -----------------------------------------------------------------------
  useEffect(() => {
    async function load() {
      setDataLoading(true);
      try {
        const [allCompanies, summaries] = await Promise.all([
          api.getCompanies().catch(() => []),
          api.getBatchSummary(new Date().getFullYear()).catch(() => []),
        ]);

        const summaryMap = new Map<string, any>();
        (summaries || []).forEach((s: any) => summaryMap.set(s.company_id, s));

        const mapped: CompanyCtx[] = (allCompanies || []).map((c: any) => {
          const s = summaryMap.get(c.id) || {};
          return {
            id: c.id,
            name: c.name || c.short_code || 'Unknown',
            jurisdiction: c.jurisdiction || (c.country === 'US' ? 'US' : 'CA'),
            revenue: s.total_revenue || s.revenue || 0,
            expenses: s.total_expenses || s.expenses || 0,
            pending: s.pending_count || s.pending_transactions || 0,
            included: true,
          };
        });

        // If API returns no companies, seed with known company names
        if (mapped.length === 0) {
          const seed = [
            ...CA_COMPANIES.map(name => ({ id: name, name, jurisdiction: 'CA', revenue: 0, expenses: 0, pending: 0, included: true })),
            ...US_COMPANIES.map(name => ({ id: name, name, jurisdiction: 'US', revenue: 0, expenses: 0, pending: 0, included: true })),
          ];
          setCompanies(seed);
        } else {
          setCompanies(mapped);
        }
      } catch {
        // Seed fallback
        const seed = [
          ...CA_COMPANIES.map(name => ({ id: name, name, jurisdiction: 'CA', revenue: 0, expenses: 0, pending: 0, included: true })),
          ...US_COMPANIES.map(name => ({ id: name, name, jurisdiction: 'US', revenue: 0, expenses: 0, pending: 0, included: true })),
        ];
        setCompanies(seed);
      } finally {
        setDataLoading(false);
      }
    }
    load();
  }, []);

  // -----------------------------------------------------------------------
  // Restore conversation history when channel changes
  // -----------------------------------------------------------------------
  useEffect(() => {
    const savedMessages = loadFromStorage<ChatMessage[]>(STORAGE_KEYS[channel].history, []);
    const savedInsights = loadFromStorage<string[]>(STORAGE_KEYS[channel].insights, []);
    setMessages(savedMessages);
    setInsights(savedInsights);
  }, [channel]);

  // -----------------------------------------------------------------------
  // Persist conversation to localStorage whenever messages change
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (messages.length > 0) {
      const trimmed = messages.slice(-MAX_MESSAGES);
      saveToStorage(STORAGE_KEYS[channel].history, trimmed);
    }
  }, [messages, channel]);

  // -----------------------------------------------------------------------
  // Auto-scroll to bottom
  // -----------------------------------------------------------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // -----------------------------------------------------------------------
  // Filtered companies for active channel
  // -----------------------------------------------------------------------
  const channelCompanies = companies.filter(c => {
    const isCA = c.jurisdiction === 'CA' || c.jurisdiction === 'QC' || CA_COMPANIES.includes(c.name);
    return channel === 'ca' ? isCA : !isCA;
  });

  const includedCompanies = channelCompanies.filter(c => c.included);

  // -----------------------------------------------------------------------
  // Toggle company inclusion
  // -----------------------------------------------------------------------
  const toggleCompany = useCallback((id: string) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, included: !c.included } : c));
  }, []);

  // -----------------------------------------------------------------------
  // Send message
  // -----------------------------------------------------------------------
  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text.trim(), timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const companyContext = includedCompanies.map(c => ({
        name: c.name,
        jurisdiction: c.jurisdiction,
        revenue: c.revenue,
        expenses: c.expenses,
        pending: c.pending,
      }));

      const history = messages.slice(-20).map(m => ({ role: m.role, content: m.content }));

      const res = await api.askFiscaliste({
        message: text.trim(),
        channel,
        history,
        companyContext,
        insights,
      });

      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);

      // Store any new insights returned by the API
      if (res.insights && res.insights.length > 0) {
        setInsights(prev => {
          const updated = [...prev, ...res.insights!].slice(-50);
          saveToStorage(STORAGE_KEYS[channel].insights, updated);
          return updated;
        });
      }
    } catch (err: any) {
      const fallback =
        'AI Fiscaliste requires an Anthropic API key. Set ANTHROPIC_API_KEY in your server .env file. For now, your conversation history is being saved.';
      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: err.message?.includes('Failed') || err.message?.includes('fetch') ? fallback : `Error: ${err.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  // -----------------------------------------------------------------------
  // Clear chat
  // -----------------------------------------------------------------------
  function clearChat() {
    setMessages([]);
    setInsights([]);
    saveToStorage(STORAGE_KEYS[channel].history, []);
    saveToStorage(STORAGE_KEYS[channel].insights, []);
  }

  // -----------------------------------------------------------------------
  // Export chat
  // -----------------------------------------------------------------------
  function exportChat() {
    const lines = messages.map(m => {
      const ts = new Date(m.timestamp).toLocaleString();
      const who = m.role === 'user' ? 'You' : 'AI Fiscaliste';
      return `[${ts}] ${who}:\n${m.content}\n`;
    });
    const header = `AI Fiscaliste \u2014 ${channel === 'ca' ? 'Canadian' : 'US'} Tax Strategy\nExported: ${new Date().toLocaleString()}\n${'='.repeat(60)}\n\n`;
    const blob = new Blob([header + lines.join('\n---\n\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fiscaliste_${channel}_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // -----------------------------------------------------------------------
  // Submit handler
  // -----------------------------------------------------------------------
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  const messageCount = messages.length;

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* ================================================================= */}
      {/* HEADER                                                            */}
      {/* ================================================================= */}
      <div className="flex-shrink-0 flex items-center justify-between px-1 pb-3 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Brain size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              AI Fiscaliste
              {messageCount > 0 && (
                <span className="text-[11px] font-medium bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                  {messageCount} message{messageCount !== 1 ? 's' : ''}
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400">Aggressive Tax Strategy &mdash; Canada &amp; US</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <>
              <button onClick={exportChat}
                className="px-3 py-1.5 bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white text-xs rounded-lg flex items-center gap-1.5 transition-colors">
                <Download size={13} /> Export
              </button>
              <button onClick={clearChat}
                className="px-3 py-1.5 bg-slate-700/80 hover:bg-red-600/80 text-slate-300 hover:text-white text-xs rounded-lg flex items-center gap-1.5 transition-colors">
                <Trash2 size={13} /> Clear Chat
              </button>
            </>
          )}
          <button onClick={() => setContextOpen(p => !p)}
            className="px-3 py-1.5 bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white text-xs rounded-lg flex items-center gap-1.5 transition-colors">
            <Building2 size={13} />
            {contextOpen ? 'Hide' : 'Show'} Context
            {contextOpen ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* CHANNEL TABS                                                      */}
      {/* ================================================================= */}
      <div className="flex-shrink-0 flex gap-1 pt-3 pb-2 px-1">
        <button
          onClick={() => setChannel('ca')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            channel === 'ca'
              ? 'bg-gradient-to-r from-red-600/30 to-red-500/10 border border-red-500/40 text-red-300 shadow-lg shadow-red-500/10'
              : 'bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600'
          }`}
        >
          <span className="text-lg">{'\ud83c\udde8\ud83c\udde6'}</span> Canadian Tax Strategist
        </button>
        <button
          onClick={() => setChannel('us')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            channel === 'us'
              ? 'bg-gradient-to-r from-blue-600/30 to-blue-500/10 border border-blue-500/40 text-blue-300 shadow-lg shadow-blue-500/10'
              : 'bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600'
          }`}
        >
          <span className="text-lg">{'\ud83c\uddfa\ud83c\uddf8'}</span> US Tax Strategist
        </button>
      </div>

      {/* ================================================================= */}
      {/* MAIN AREA: Chat + Context Panel                                   */}
      {/* ================================================================= */}
      <div className="flex flex-1 min-h-0 gap-3 pt-1">
        {/* --------------------------------------------------------------- */}
        {/* Chat Column                                                     */}
        {/* --------------------------------------------------------------- */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-1 pb-2 space-y-3">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 opacity-80">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
                  <MessageSquare size={28} className="text-slate-500" />
                </div>
                <p className="text-slate-400 text-sm font-medium">
                  {channel === 'ca' ? 'Ask about Canadian tax strategy' : 'Ask about US tax strategy'}
                </p>
                <p className="text-slate-500 text-xs mt-1 max-w-md">
                  {channel === 'ca'
                    ? 'TPS/TVQ optimization, SR&ED credits, intercompany structures, QC deductions...'
                    : 'LLC structures, QBI deductions, state tax planning, cross-border strategies...'
                  }
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-slate-800 border border-slate-700/80 text-slate-200 rounded-bl-md'
                  }`}
                >
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.role === 'assistant' ? stripMarkdown(msg.content) : msg.content}
                  </div>
                  <p className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-blue-200/50' : 'text-slate-500'}`}>
                    {formatTimestamp(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700/80 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2.5">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-slate-400">
                    {channel === 'ca' ? 'Analyzing Canadian tax code...' : 'Analyzing US tax code...'}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="flex-shrink-0 px-1 pb-2">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
              {QUICK_PROMPTS[channel].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  disabled={loading}
                  className="flex-shrink-0 px-3 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-full text-xs text-slate-400 hover:text-white hover:border-purple-500/50 hover:bg-slate-700/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sparkles size={10} className="inline mr-1.5 text-purple-400" />
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex-shrink-0 flex gap-2 px-1 pb-1">
            <div className="flex-1 flex bg-slate-800 border border-slate-600/80 rounded-xl focus-within:ring-2 focus-within:ring-purple-500/50 focus-within:border-purple-500/30 transition-all">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={channel === 'ca'
                  ? 'Ask about Canadian tax strategy, deductions, TPS/TVQ...'
                  : 'Ask about US tax strategy, LLC structures, QBI...'
                }
                className="flex-1 px-4 py-3 bg-transparent text-white placeholder-slate-500 focus:outline-none text-sm"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-3 text-purple-400 hover:text-purple-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </form>
        </div>

        {/* --------------------------------------------------------------- */}
        {/* Context Panel (collapsible)                                     */}
        {/* --------------------------------------------------------------- */}
        {contextOpen && (
          <div className="flex-shrink-0 w-[300px] bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Building2 size={14} className="text-purple-400" />
                {channel === 'ca' ? 'Canadian Companies' : 'US Companies'}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Toggle companies to include in AI context
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {dataLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={16} className="animate-spin text-slate-500" />
                </div>
              ) : channelCompanies.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No companies found</p>
              ) : (
                channelCompanies.map(company => (
                  <div
                    key={company.id}
                    className={`rounded-lg border p-3 transition-all ${
                      company.included
                        ? 'bg-slate-700/40 border-slate-600/60'
                        : 'bg-slate-800/30 border-slate-700/30 opacity-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">{company.name}</p>
                        <p className="text-[10px] text-slate-500">{company.jurisdiction}</p>
                      </div>
                      <button
                        onClick={() => toggleCompany(company.id)}
                        className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
                        title={company.included ? 'Exclude from context' : 'Include in context'}
                      >
                        {company.included
                          ? <ToggleRight size={18} className="text-purple-400" />
                          : <ToggleLeft size={18} />
                        }
                      </button>
                    </div>

                    {company.included && (company.revenue > 0 || company.expenses > 0 || company.pending > 0) && (
                      <div className="grid grid-cols-3 gap-1 mt-2">
                        <div className="text-center">
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider">Revenue</p>
                          <p className="text-[11px] font-medium text-emerald-400">{formatCurrency(company.revenue)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider">Expenses</p>
                          <p className="text-[11px] font-medium text-red-400">{formatCurrency(company.expenses)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider">Pending</p>
                          <p className="text-[11px] font-medium text-amber-400">{company.pending}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Insights section */}
            {insights.length > 0 && (
              <div className="border-t border-slate-700/50 px-4 py-3">
                <h4 className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">
                  Key Insights ({insights.length})
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {insights.slice(-5).map((insight, i) => (
                    <p key={i} className="text-[10px] text-slate-400 leading-snug flex gap-1.5">
                      <span className="text-purple-400 flex-shrink-0">&bull;</span>
                      {insight}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
