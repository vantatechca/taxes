import { useEffect, useState, useRef } from 'react';
import { api } from '../lib/api';
import { Bot, Send, Loader2, MessageSquare, Trash2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}

export default function AdvisorPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [historyMessages, setHistoryMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [quickPrompts, setQuickPrompts] = useState<any[]>([]);
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getCompanies().then(setCompanies);
    api.getQuickPrompts().then(setQuickPrompts).catch(() => {});
  }, []);

  // Load history when company changes
  useEffect(() => {
    loadHistory();
  }, [selectedCompany]);

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const history = await api.getAdvisorHistory(selectedCompany || undefined);
      const mapped: Message[] = (history || []).map((h: any) => ({
        role: h.role || (h.question ? 'user' : 'assistant'),
        content: h.content || h.question || h.answer || '',
        timestamp: h.timestamp || h.created_at || new Date().toISOString(),
      }));
      setHistoryMessages(mapped);
    } catch {
      setHistoryMessages([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, historyMessages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.askAdvisor(text, selectedCompany || undefined);
      const aiMsg: Message = { role: 'assistant', content: res.answer, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}`, timestamp: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
    setHistoryMessages([]);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const hasHistory = historyMessages.length > 0;
  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bot size={24} className="text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">AI Tax Advisor</h1>
            <p className="text-xs text-slate-400">Fiscaliste Mode -- Canada & US Tax Expert</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(hasHistory || hasMessages) && (
            <button onClick={clearChat}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-sm rounded-lg flex items-center gap-1.5">
              <Trash2 size={14} /> Clear Chat
            </button>
          )}
          <select value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
            <option value="">All Companies</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name || c.short_code}</option>)}
          </select>
        </div>
      </div>

      {/* Quick Prompts */}
      {!hasMessages && !hasHistory && (
        <div className="mb-4">
          <p className="text-sm text-slate-400 mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((qp, i) => (
              <button key={i} onClick={() => sendMessage(qp.prompt)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-300 hover:text-white hover:border-purple-500/50 transition-colors">
                {qp.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {!hasMessages && !hasHistory && !historyLoading && (
          <div className="text-center py-16">
            <MessageSquare size={48} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400">Ask any tax question about your 7 companies</p>
            <p className="text-xs text-slate-500 mt-1">Canadian TPS/TVQ, US sales tax, deductions, intercompany transfers...</p>
          </div>
        )}

        {historyLoading && (
          <div className="text-center py-4">
            <Loader2 size={16} className="animate-spin text-slate-400 mx-auto" />
            <p className="text-xs text-slate-500 mt-1">Loading history...</p>
          </div>
        )}

        {/* History Messages */}
        {historyMessages.map((msg, i) => (
          <div key={`h-${i}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-blue-600/60 text-white/80'
                : 'bg-slate-800/60 border border-slate-700/50 text-slate-300'
            }`}>
              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              <p className="text-[10px] opacity-50 mt-1">{timeAgo(msg.timestamp)}</p>
            </div>
          </div>
        ))}

        {/* Separator between history and new messages */}
        {hasHistory && hasMessages && (
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 border-t border-slate-700" />
            <span className="text-xs text-slate-500">New conversation</span>
            <div className="flex-1 border-t border-slate-700" />
          </div>
        )}

        {/* Current Messages */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 border border-slate-700 text-slate-200'
            }`}>
              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              <p className="text-[10px] opacity-50 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-purple-400" />
              <span className="text-sm text-slate-400">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEnd} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 pt-3 border-t border-slate-700">
        <input
          value={input} onChange={e => setInput(e.target.value)}
          placeholder="Ask about taxes, deductions, filings..."
          className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg flex items-center gap-2">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
