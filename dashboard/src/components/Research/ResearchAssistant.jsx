import { useState, useEffect, useRef, useCallback } from "react";

const API = "";

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function ResearchAssistant({ onClose }) {
  const [rules, setRules] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [newRule, setNewRule] = useState("");
  const [editingRuleIdx, setEditingRuleIdx] = useState(null);
  const [editingRuleText, setEditingRuleText] = useState("");
  const [rulesLoading, setRulesLoading] = useState(true);
  const [rulesSaving, setRulesSaving] = useState(false);
  const [rulesError, setRulesError] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Load rules and history on mount
  useEffect(() => {
    fetchRules();
    fetchHistory();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchRules() {
    setRulesLoading(true);
    try {
      const res = await fetch(`${API}/api/assistant/rules`);
      if (res.ok) {
        const data = await res.json();
        setRules(Array.isArray(data) ? data : data.rules || []);
      }
    } catch {
      // Silent fail
    } finally {
      setRulesLoading(false);
    }
  }

  async function fetchHistory() {
    try {
      const res = await fetch(`${API}/api/assistant/history`);
      if (res.ok) {
        const data = await res.json();
        const history = Array.isArray(data) ? data : data.messages || data.history || [];
        // Convert stored history format to Claude message format
        const converted = [];
        history.forEach((entry) => {
          if (entry.role && entry.content) {
            converted.push(entry);
          } else if (entry.userMessage) {
            converted.push({ role: "user", content: entry.userMessage });
            if (entry.assistantReply) converted.push({ role: "assistant", content: entry.assistantReply });
          }
        });
        setMessages(converted);
      }
    } catch {
      // Silent fail
    }
  }

  async function handleSaveRules() {
    setRulesSaving(true);
    setRulesError("");
    try {
      const res = await fetch(`${API}/api/assistant/rules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      });
      if (!res.ok) throw new Error("Failed to save rules");
    } catch (err) {
      setRulesError(err.message);
    } finally {
      setRulesSaving(false);
    }
  }

  async function handleClearHistory() {
    try {
      await fetch(`${API}/api/assistant/clear`, { method: "POST" });
      setMessages([]);
    } catch {
      // Silent fail
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    const userMsg = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setSending(true);
    try {
      const res = await fetch(`${API}/api/assistant/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated, rules }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages([...updated, { role: "assistant", content: data.reply }]);
      }
    } catch {
      // Silent fail
    } finally {
      setSending(false);
    }
  }

  function handleAddRule() {
    if (!newRule.trim()) return;
    setRules((prev) => [...prev, newRule.trim()]);
    setNewRule("");
  }

  function handleDeleteRule(idx) {
    setRules((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleStartEditRule(idx) {
    setEditingRuleIdx(idx);
    setEditingRuleText(rules[idx]);
  }

  function handleFinishEditRule() {
    if (editingRuleIdx !== null && editingRuleText.trim()) {
      setRules((prev) => {
        const next = [...prev];
        next[editingRuleIdx] = editingRuleText.trim();
        return next;
      });
    }
    setEditingRuleIdx(null);
    setEditingRuleText("");
  }

  return (
    <div className="fixed bottom-6 right-6 w-[400px] h-[540px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/40 bg-gray-950 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">{"🤖"}</span>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Research Assistant</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearHistory}
            className="text-xs text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Chat Messages */}
        <div className="px-4 py-3 space-y-3 min-h-[60px]">
          {messages.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-4">
              No conversation yet. Ask me about niches, products, or market research.
            </p>
          ) : (
            messages.map((msg, i) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={i}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                      isUser
                        ? "bg-indigo-600 text-gray-900 dark:text-white rounded-br-sm"
                        : "bg-slate-800 text-gray-600 dark:text-gray-300 rounded-bl-sm"
                    }`}
                  >
                    {(msg.content || msg.text || msg.message || "")
                      .replace(/#{1,6}\s*/g, "")
                      .replace(/\*\*(.*?)\*\*/g, "$1")
                      .replace(/\*(.*?)\*/g, "$1")
                      .replace(/`(.*?)`/g, "$1")
                      .trim()
                    }
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about products, niches, trends..."
              disabled={sending}
              className="flex-1 bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600/50 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors shrink-0"
            >
              {sending ? <Spinner /> : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Golden Rules Section */}
        <div className="px-4 pb-4">
          <div className="bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                <span>{"📜"}</span> Golden Rules
              </h4>
              <button
                onClick={handleSaveRules}
                disabled={rulesSaving}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-gray-900 dark:text-white px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
              >
                {rulesSaving && <Spinner />}
                Save Rules
              </button>
            </div>

            {rulesError && (
              <p className="text-xs text-red-400 mb-2">{rulesError}</p>
            )}

            {rulesLoading ? (
              <div className="flex items-center gap-2 py-2">
                <Spinner />
                <span className="text-xs text-slate-400">Loading rules...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {rules.length === 0 && (
                  <p className="text-xs text-slate-500">No rules defined yet.</p>
                )}

                {rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 group"
                  >
                    <span className="text-xs text-gray-400 dark:text-slate-500 mt-1 w-5 shrink-0">
                      {idx + 1}.
                    </span>
                    {editingRuleIdx === idx ? (
                      <div className="flex-1 flex items-center gap-1">
                        <input
                          type="text"
                          value={editingRuleText}
                          onChange={(e) => setEditingRuleText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleFinishEditRule()}
                          className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500"
                          autoFocus
                        />
                        <button
                          onClick={handleFinishEditRule}
                          className="text-xs text-green-400 hover:text-green-300 px-1"
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="flex-1 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                          {rule}
                        </p>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => handleStartEditRule(idx)}
                            className="text-xs text-gray-400 dark:text-slate-500 hover:text-indigo-400 transition-colors px-1"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRule(idx)}
                            className="text-xs text-gray-400 dark:text-slate-500 hover:text-red-400 transition-colors px-1"
                          >
                            Del
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {/* Add Rule */}
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700/50">
                  <input
                    type="text"
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddRule()}
                    placeholder="+ Add a new rule..."
                    className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleAddRule}
                    disabled={!newRule.trim()}
                    className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
