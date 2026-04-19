import { useState, useEffect, useCallback, useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const API = "";

/* ──────────────────────────── Helpers ──────────────────────────── */

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function ErrorMsg({ message, onDismiss }) {
  useEffect(() => {
    if (message) {
      const t = setTimeout(onDismiss, 5000);
      return () => clearTimeout(t);
    }
  }, [message, onDismiss]);
  if (!message) return null;
  return (
    <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-2 text-sm text-red-400 flex items-center justify-between">
      <span>{message}</span>
      <button onClick={onDismiss} className="text-red-400 hover:text-red-300 ml-3">&times;</button>
    </div>
  );
}

const PIE_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
  "#a855f7", "#ef4444",
];

const NICHE_LIST = [
  "Wedding Planning", "Startup Kits", "Resume & Career", "Personal Finance",
  "Meal Planning", "Fitness & Workout", "Home Organization", "Parenting & Baby",
  "Event Planning", "Social Media", "Pet Care", "Real Estate",
];

const PRODUCT_TYPES = [
  "Spreadsheet", "Template", "Planner", "Printable", "Guide/Ebook",
  "Checklist", "Tracker", "Bundle", "Other",
];

const PRESET_RULES = [
  "Only consider products with 100+ Etsy reviews",
  "Minimum Google Trends score of 40",
  "No products under $5",
  "Prefer evergreen over seasonal",
  "Focus on spreadsheets and templates over printables",
  "Prioritize US+Canada trending products",
];

/* ──────── localStorage helpers ──────── */

const PREF_KEY = "de_product_preferences";
const JOURNAL_KEY = "de_research_journal";
const BRAIN_NOTES_KEY = "de_brain_notes";
const NICHE_TRENDS_KEY = "de_niche_trends";
const RESEARCHED_KEY = "de_researched_niches";

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { liked: [], passed: [], searchHistory: [] };
}

function savePrefs(prefs) {
  try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch {}
}

function loadJournal() {
  try {
    const raw = localStorage.getItem(JOURNAL_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveJournal(entries) {
  try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries)); } catch {}
}

function loadBrainNotes() {
  try {
    const raw = localStorage.getItem(BRAIN_NOTES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveBrainNotes(notes) {
  try { localStorage.setItem(BRAIN_NOTES_KEY, JSON.stringify(notes)); } catch {}
}

function loadTrends() {
  try {
    const raw = localStorage.getItem(NICHE_TRENDS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function loadResearched() {
  try {
    const raw = localStorage.getItem(RESEARCHED_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

/* ──────────────────────────── Main Component ──────────────────────────── */

export default function Brain() {
  const [activeSection, setActiveSection] = useState("dna");
  const [error, setError] = useState("");
  const clearError = useCallback(() => setError(""), []);

  // Preferences
  const [preferences, setPreferences] = useState(loadPrefs);

  // Rules
  const [rules, setRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [rulesSaving, setRulesSaving] = useState(false);
  const [newRule, setNewRule] = useState("");
  const [editingRuleIdx, setEditingRuleIdx] = useState(null);
  const [editingRuleText, setEditingRuleText] = useState("");

  // Journal
  const [journal, setJournal] = useState(loadJournal);
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [journalForm, setJournalForm] = useState({ title: "", body: "", tags: [], linkedProduct: "" });
  const [journalFilter, setJournalFilter] = useState("");
  const [journalSearch, setJournalSearch] = useState("");

  // Teach Me
  const [teachIdx, setTeachIdx] = useState(0);
  const [brainNotes, setBrainNotes] = useState(loadBrainNotes);
  const [lookingForInput, setLookingForInput] = useState("");

  // Load rules on mount
  useEffect(() => {
    loadRules();
  }, []);

  async function loadRules() {
    setRulesLoading(true);
    try {
      const res = await fetch(`${API}/api/assistant/rules`);
      if (res.ok) {
        const data = await res.json();
        setRules(Array.isArray(data) ? data : data.rules || []);
      }
    } catch (err) {
      setError("Failed to load rules");
    } finally {
      setRulesLoading(false);
    }
  }

  async function handleSaveRules(updatedRules) {
    setRulesSaving(true);
    try {
      const res = await fetch(`${API}/api/assistant/rules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: updatedRules || rules }),
      });
      if (!res.ok) throw new Error("Save failed");
      const data = await res.json();
      setRules(Array.isArray(data) ? data : data.rules || updatedRules || rules);
    } catch (err) {
      setError(err.message);
    } finally {
      setRulesSaving(false);
    }
  }

  /* ──── DNA Analysis ──── */

  const dna = useMemo(() => {
    const { liked, passed } = preferences;

    // Price analysis
    const likedPrices = liked.map((p) => p.price).filter((p) => p > 0);
    const avgPrice = likedPrices.length > 0 ? likedPrices.reduce((a, b) => a + b, 0) / likedPrices.length : 0;
    const minPrice = likedPrices.length > 0 ? Math.min(...likedPrices) : 0;
    const maxPrice = likedPrices.length > 0 ? Math.max(...likedPrices) : 0;

    // Type distribution (liked)
    const likedTypes = {};
    liked.forEach((p) => {
      const t = p.type || "Other";
      likedTypes[t] = (likedTypes[t] || 0) + 1;
    });
    const typeData = Object.entries(likedTypes)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    // Niche distribution (liked)
    const likedNiches = {};
    liked.forEach((p) => {
      const n = p.niche || "Unknown";
      likedNiches[n] = (likedNiches[n] || 0) + 1;
    });
    const nicheData = Object.entries(likedNiches)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    // Avoided patterns
    const passedTypes = {};
    passed.forEach((p) => {
      const t = p.type || "Other";
      passedTypes[t] = (passedTypes[t] || 0) + 1;
    });
    const avoidedTypes = Object.entries(passedTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    const passedNiches = {};
    passed.forEach((p) => {
      const n = p.niche || "Unknown";
      passedNiches[n] = (passedNiches[n] || 0) + 1;
    });
    const avoidedNiches = Object.entries(passedNiches)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    // Top preferences
    const topType = typeData.length > 0 ? typeData[0].name : "N/A";
    const topNiche = nicheData.length > 0 ? nicheData[0].name : "N/A";

    return {
      liked: liked.length, passed: passed.length,
      avgPrice, minPrice, maxPrice,
      typeData, nicheData,
      avoidedTypes, avoidedNiches,
      topType, topNiche,
    };
  }, [preferences]);

  /* ──── Insights ──── */

  const insights = useMemo(() => {
    const { liked, passed } = preferences;
    const trends = loadTrends();
    const researched = loadResearched();

    // Products You'd Probably Like: find liked patterns and score
    const recommendations = [];
    if (liked.length >= 3) {
      const topTypes = {};
      const topNiches = {};
      liked.forEach((p) => {
        topTypes[p.type || "Other"] = (topTypes[p.type || "Other"] || 0) + 1;
        topNiches[p.niche || "Unknown"] = (topNiches[p.niche || "Unknown"] || 0) + 1;
      });
      const bestType = Object.entries(topTypes).sort((a, b) => b[1] - a[1])[0]?.[0];
      const bestNiche = Object.entries(topNiches).sort((a, b) => b[1] - a[1])[0]?.[0];

      if (bestType && bestNiche) {
        recommendations.push(
          `Look for ${bestType} products in ${bestNiche} - this matches your top preference pattern`,
          `Consider ${bestType}s priced between $${dna.minPrice.toFixed(0)}-$${dna.maxPrice.toFixed(0)} based on your likes`
        );
      }
    }

    // Untapped Niches
    const researchedNicheNames = new Set(Object.keys(researched));
    const untappedNiches = NICHE_LIST.filter((n) => !researchedNicheNames.has(n));

    // Price Sweet Spot
    let priceInsight = "Not enough data yet";
    if (liked.length >= 5) {
      const prices = liked.map((p) => p.price).filter((p) => p > 0).sort((a, b) => a - b);
      if (prices.length > 2) {
        const q1 = prices[Math.floor(prices.length * 0.25)];
        const q3 = prices[Math.floor(prices.length * 0.75)];
        priceInsight = `Your sweet spot is $${q1.toFixed(0)} - $${q3.toFixed(0)} (middle 50% of liked products)`;
      }
    }

    // Trend Alignment
    const trendingNiches = Object.entries(trends)
      .filter(([_, data]) => data && data.score > 50)
      .map(([name]) => name);
    const likedNiches = [...new Set(liked.map((p) => p.niche).filter(Boolean))];
    const alignedNiches = likedNiches.filter((n) => trendingNiches.some((t) => t.toLowerCase().includes(n.toLowerCase()) || n.toLowerCase().includes(t.toLowerCase())));

    return { recommendations, untappedNiches, priceInsight, alignedNiches, trendingNiches };
  }, [preferences, dna]);

  /* ──── Teach Me: product pool ──── */

  const teachPool = useMemo(() => {
    const { liked, passed } = preferences;
    const seenIds = new Set([...liked.map((p) => p.id), ...passed.map((p) => p.id)]);
    // Try to get etsy results from all cached search results
    const pool = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("de_etsy_")) {
          const data = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(data)) {
            data.forEach((p) => {
              const id = p.id || p.listing_id || `${p.title}-${p.price}`;
              if (!seenIds.has(id)) {
                pool.push({ ...p, id });
                seenIds.add(id);
              }
            });
          }
        }
      }
    } catch {}
    // Also include liked/passed items that haven't been reviewed in Teach Me
    return pool;
  }, [preferences]);

  /* ──── Journal helpers ──── */

  function addJournalEntry() {
    if (!journalForm.body.trim()) {
      setError("Entry body is required");
      return;
    }
    const entry = {
      id: Date.now(),
      title: journalForm.title.trim() || null,
      body: journalForm.body.trim(),
      tags: journalForm.tags,
      linkedProduct: journalForm.linkedProduct.trim() || null,
      timestamp: new Date().toISOString(),
    };
    const updated = [entry, ...journal];
    setJournal(updated);
    saveJournal(updated);
    setJournalForm({ title: "", body: "", tags: [], linkedProduct: "" });
    setShowJournalForm(false);
  }

  function deleteJournalEntry(id) {
    const updated = journal.filter((e) => e.id !== id);
    setJournal(updated);
    saveJournal(updated);
  }

  const filteredJournal = useMemo(() => {
    let entries = [...journal];
    if (journalFilter) {
      entries = entries.filter((e) => e.tags && e.tags.includes(journalFilter));
    }
    if (journalSearch.trim()) {
      const s = journalSearch.toLowerCase();
      entries = entries.filter((e) =>
        (e.title || "").toLowerCase().includes(s) ||
        e.body.toLowerCase().includes(s) ||
        (e.tags || []).some((t) => t.toLowerCase().includes(s))
      );
    }
    return entries;
  }, [journal, journalFilter, journalSearch]);

  const allJournalTags = useMemo(() => {
    const tags = new Set();
    journal.forEach((e) => (e.tags || []).forEach((t) => tags.add(t)));
    return [...tags].sort();
  }, [journal]);

  /* ──── Teach Me handlers ──── */

  function handleTeachLike(product) {
    const prefs = loadPrefs();
    const id = product.id || product.listing_id || `${product.title}-${product.price}`;
    prefs.passed = prefs.passed.filter((p) => p.id !== id);
    const existing = prefs.liked.find((p) => p.id === id);
    if (!existing) {
      prefs.liked.unshift({
        id,
        title: product.title,
        price: parseFloat(product.price) || 0,
        type: classifyProduct(product.title),
        niche: product.niche || null,
        timestamp: Date.now(),
      });
    }
    savePrefs(prefs);
    setPreferences({ ...prefs });
    setTeachIdx((prev) => prev + 1);
  }

  function handleTeachPass(product) {
    const prefs = loadPrefs();
    const id = product.id || product.listing_id || `${product.title}-${product.price}`;
    prefs.liked = prefs.liked.filter((p) => p.id !== id);
    const existing = prefs.passed.find((p) => p.id === id);
    if (!existing) {
      prefs.passed.unshift({
        id,
        title: product.title,
        price: parseFloat(product.price) || 0,
        type: classifyProduct(product.title),
        niche: product.niche || null,
        timestamp: Date.now(),
      });
    }
    savePrefs(prefs);
    setPreferences({ ...prefs });
    setTeachIdx((prev) => prev + 1);
  }

  function handleAddCriteria() {
    if (!lookingForInput.trim()) return;
    const newNote = {
      id: Date.now(),
      text: lookingForInput.trim(),
      timestamp: new Date().toISOString(),
    };
    const updated = [newNote, ...brainNotes];
    setBrainNotes(updated);
    saveBrainNotes(updated);
    setLookingForInput("");
  }

  function deleteCriteria(id) {
    const updated = brainNotes.filter((n) => n.id !== id);
    setBrainNotes(updated);
    saveBrainNotes(updated);
  }

  /* ──── Classify product (simplified) ──── */

  function classifyProduct(title) {
    const t = (title || "").toLowerCase();
    const types = [
      { label: "Spreadsheet", keywords: ["spreadsheet", "excel", "google sheets", "xlsx", "calculator"] },
      { label: "Template", keywords: ["template"] },
      { label: "Planner", keywords: ["planner", "planning"] },
      { label: "Printable", keywords: ["printable", "print"] },
      { label: "Guide/Ebook", keywords: ["guide", "ebook", "e-book", "book", "handbook"] },
      { label: "Checklist", keywords: ["checklist", "check list"] },
      { label: "Tracker", keywords: ["tracker", "tracking", "log"] },
      { label: "Bundle", keywords: ["bundle", "pack", "kit", "set of"] },
    ];
    for (const pt of types) {
      if (pt.keywords.some((kw) => t.includes(kw))) return pt.label;
    }
    return "Other";
  }

  /* ──── Render ──── */

  const SECTIONS = [
    { id: "dna", label: "Product DNA", icon: "🧬" },
    { id: "rules", label: "Golden Rules", icon: "📜" },
    { id: "journal", label: "Research Journal", icon: "📓" },
    { id: "insights", label: "Insights", icon: "💡" },
    { id: "teach", label: "Teach Me", icon: "🎓" },
  ];

  return (
    <div className="space-y-6">
      <ErrorMsg message={error} onDismiss={clearError} />

      {/* Section tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeSection === s.id
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700/70"
            }`}
          >
            <span>{s.icon}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* ════════════════ Section 1: Product DNA ════════════════ */}
      {activeSection === "dna" && (
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span>🧬</span> Product DNA
                </h2>
                <p className="text-xs text-slate-500 mt-1">Your preference profile built from {dna.liked} likes and {dna.passed} passes</p>
              </div>
              <button
                onClick={() => {
                  savePrefs({ liked: [], passed: [], searchHistory: preferences.searchHistory || [] });
                  setPreferences(loadPrefs());
                }}
                className="text-xs text-slate-600 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800"
              >
                Reset Profile
              </button>
            </div>

            {dna.liked === 0 && dna.passed === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 text-sm mb-2">No preference data yet</p>
                <p className="text-slate-600 text-xs">Like or pass on products in Etsy Spy to build your Product DNA, or use the &quot;Teach Me&quot; tab.</p>
              </div>
            ) : (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-2">You tend to like</p>
                    <p className="text-sm text-white">
                      <span className="text-indigo-400 font-semibold">{dna.topType}</span> products in{" "}
                      <span className="text-indigo-400 font-semibold">{dna.topNiche}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      priced ${dna.minPrice.toFixed(0)} - ${dna.maxPrice.toFixed(0)} (avg ${dna.avgPrice.toFixed(2)})
                    </p>
                  </div>
                  <div className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-2">You tend to avoid</p>
                    {dna.avoidedTypes.length > 0 ? (
                      <div className="space-y-1">
                        {dna.avoidedTypes.map((t) => (
                          <p key={t.name} className="text-sm text-red-400">
                            {t.name} <span className="text-slate-600 text-xs">({t.count}x passed)</span>
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No clear avoidance patterns</p>
                    )}
                  </div>
                  <div className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-2">Preferred Price Range</p>
                    <p className="text-2xl font-bold text-white">
                      ${dna.minPrice.toFixed(0)} - ${dna.maxPrice.toFixed(0)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Average: ${dna.avgPrice.toFixed(2)}</p>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Type distribution donut */}
                  {dna.typeData.length > 0 && (
                    <div className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-300 mb-3">Type Distribution (Liked)</h3>
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={dna.typeData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={75}
                              dataKey="value"
                              label={({ name, value }) => `${name} (${value})`}
                            >
                              {dna.typeData.map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                              itemStyle={{ color: "#e5e7eb" }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Niche distribution donut */}
                  {dna.nicheData.length > 0 && (
                    <div className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-300 mb-3">Niche Distribution (Liked)</h3>
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={dna.nicheData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={75}
                              dataKey="value"
                              label={({ name, value }) => `${name} (${value})`}
                            >
                              {dna.nicheData.map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                              itemStyle={{ color: "#e5e7eb" }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ════════════════ Section 2: Golden Rules ════════════════ */}
      {activeSection === "rules" && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>📜</span> Golden Rules
              </h2>
              <p className="text-xs text-slate-500 mt-1">Rules that guide your research decisions</p>
            </div>
            <button
              onClick={() => handleSaveRules()}
              disabled={rulesSaving}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              {rulesSaving && <Spinner />}
              Save Rules
            </button>
          </div>

          {rulesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
              <span className="ml-2 text-slate-400">Loading rules...</span>
            </div>
          ) : (
            <>
              {/* Current rules */}
              <div className="space-y-2 mb-6">
                {rules.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4">No rules set. Add your first research rule below.</p>
                ) : (
                  rules.map((rule, idx) => (
                    <div key={idx} className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-3 flex items-center gap-3 group">
                      <span className="text-xs text-slate-600 font-mono w-6 shrink-0 text-center">{idx + 1}</span>
                      {editingRuleIdx === idx ? (
                        <input
                          type="text"
                          value={editingRuleText}
                          onChange={(e) => setEditingRuleText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const updated = [...rules];
                              updated[idx] = editingRuleText;
                              setRules(updated);
                              setEditingRuleIdx(null);
                            }
                            if (e.key === "Escape") setEditingRuleIdx(null);
                          }}
                          className="flex-1 bg-gray-900 border border-indigo-500 rounded px-3 py-1 text-sm text-gray-100 focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <p
                          className="flex-1 text-sm text-gray-300 cursor-pointer hover:text-white transition-colors"
                          onClick={() => {
                            setEditingRuleIdx(idx);
                            setEditingRuleText(typeof rule === "string" ? rule : rule.text || rule.rule || "");
                          }}
                        >
                          {typeof rule === "string" ? rule : rule.text || rule.rule || JSON.stringify(rule)}
                        </p>
                      )}
                      <button
                        onClick={() => {
                          const updated = rules.filter((_, i) => i !== idx);
                          setRules(updated);
                        }}
                        className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs px-2"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add new rule */}
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newRule.trim()) {
                      setRules([...rules, newRule.trim()]);
                      setNewRule("");
                    }
                  }}
                  placeholder="Add a new research rule..."
                  className="flex-1 bg-slate-800/80 border border-slate-600/50 rounded-lg px-4 py-2 text-gray-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (newRule.trim()) {
                      setRules([...rules, newRule.trim()]);
                      setNewRule("");
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Preset suggestions */}
              <div>
                <h3 className="text-xs text-slate-500 uppercase tracking-wide mb-3">Suggested Rules</h3>
                <div className="flex flex-wrap gap-2">
                  {PRESET_RULES.filter((pr) => !rules.some((r) => (typeof r === "string" ? r : r.text || "") === pr)).map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => setRules([...rules, preset])}
                      className="bg-slate-800 hover:bg-slate-700/70 border border-slate-700/50 hover:border-indigo-500 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg text-xs transition-all"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════ Section 3: Research Journal ════════════════ */}
      {activeSection === "journal" && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>📓</span> Research Journal
              </h2>
              <p className="text-xs text-slate-500 mt-1">{journal.length} entr{journal.length === 1 ? "y" : "ies"}</p>
            </div>
            <button
              onClick={() => setShowJournalForm(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Add Entry
            </button>
          </div>

          {/* Add Entry Form */}
          {showJournalForm && (
            <div className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-5 mb-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Title (optional)</label>
                <input
                  type="text"
                  value={journalForm.title}
                  onChange={(e) => setJournalForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Found a great PLR source for finance..."
                  className="w-full bg-gray-900 border border-slate-700/50 rounded-lg px-4 py-2 text-gray-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Body *</label>
                <textarea
                  value={journalForm.body}
                  onChange={(e) => setJournalForm((p) => ({ ...p, body: e.target.value }))}
                  placeholder="Write your research notes here..."
                  rows={5}
                  className="w-full bg-gray-900 border border-slate-700/50 rounded-lg px-4 py-2 text-gray-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {journalForm.tags.map((tag, i) => (
                    <span key={i} className="bg-indigo-900/50 text-indigo-400 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                      {tag}
                      <button
                        onClick={() => setJournalForm((p) => ({ ...p, tags: p.tags.filter((_, j) => j !== i) }))}
                        className="text-indigo-500 hover:text-indigo-300"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {[...NICHE_LIST, ...PRODUCT_TYPES].filter((t) => !journalForm.tags.includes(t)).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setJournalForm((p) => ({ ...p, tags: [...p.tags, tag] }))}
                      className="bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white px-2 py-0.5 rounded text-[10px] transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Linked Product (optional)</label>
                <input
                  type="text"
                  value={journalForm.linkedProduct}
                  onChange={(e) => setJournalForm((p) => ({ ...p, linkedProduct: e.target.value }))}
                  placeholder="Product name to reference..."
                  className="w-full bg-gray-900 border border-slate-700/50 rounded-lg px-4 py-2 text-gray-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={addJournalEntry}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Save Entry
                </button>
                <button
                  onClick={() => setShowJournalForm(false)}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <input
              type="text"
              value={journalSearch}
              onChange={(e) => setJournalSearch(e.target.value)}
              placeholder="Search entries..."
              className="bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-gray-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none w-64"
            />
            <select
              value={journalFilter}
              onChange={(e) => setJournalFilter(e.target.value)}
              className="bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All tags</option>
              {allJournalTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            {(journalFilter || journalSearch) && (
              <button
                onClick={() => { setJournalFilter(""); setJournalSearch(""); }}
                className="text-xs text-slate-500 hover:text-gray-300 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Journal entries */}
          {filteredJournal.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">
              {journal.length === 0 ? "No journal entries yet. Start documenting your research!" : "No entries match your filters."}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredJournal.map((entry) => (
                <div key={entry.id} className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-4 space-y-2 group">
                  <div className="flex items-start justify-between">
                    <div>
                      {entry.title && (
                        <h3 className="text-sm font-semibold text-white">{entry.title}</h3>
                      )}
                      <p className="text-xs text-slate-500">
                        {new Date(entry.timestamp).toLocaleDateString()} at {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteJournalEntry(entry.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{entry.body}</p>
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.map((tag, i) => (
                        <span key={i} className="bg-slate-700 text-slate-400 px-2 py-0.5 rounded text-[10px]">{tag}</span>
                      ))}
                    </div>
                  )}
                  {entry.linkedProduct && (
                    <p className="text-xs text-indigo-400">Linked: {entry.linkedProduct}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════ Section 4: Insights Dashboard ════════════════ */}
      {activeSection === "insights" && (
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <span>💡</span> Insights Dashboard
            </h2>

            {dna.liked < 3 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 text-sm mb-2">Need more data for insights</p>
                <p className="text-slate-600 text-xs">Like at least 3 products in Etsy Spy or the Teach Me tab to generate insights.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Products You'd Probably Like */}
                <div className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                    <span>&#10024;</span> Products You&apos;d Probably Like
                  </h3>
                  {insights.recommendations.length > 0 ? (
                    <div className="space-y-2">
                      {insights.recommendations.map((rec, i) => (
                        <div key={i} className="bg-gray-900 rounded-lg p-3 text-sm text-gray-300">
                          {rec}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Keep liking products to improve recommendations.</p>
                  )}
                </div>

                {/* Untapped Niches */}
                <div className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                    <span>&#128269;</span> Untapped Niches
                  </h3>
                  {insights.untappedNiches.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {insights.untappedNiches.map((niche) => (
                        <span key={niche} className="bg-yellow-900/20 border border-yellow-800/30 text-yellow-400 px-3 py-1.5 rounded-lg text-xs">
                          {niche}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">You&apos;ve researched all niches!</p>
                  )}
                </div>

                {/* Price Sweet Spot */}
                <div className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                    <span>&#128176;</span> Price Sweet Spot
                  </h3>
                  <p className="text-sm text-gray-300">{insights.priceInsight}</p>
                </div>

                {/* Trend Alignment */}
                <div className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
                    <span>&#128200;</span> Trend Alignment
                  </h3>
                  {insights.alignedNiches.length > 0 ? (
                    <div>
                      <p className="text-sm text-gray-300 mb-2">Your liked products align with these trending niches:</p>
                      <div className="flex flex-wrap gap-2">
                        {insights.alignedNiches.map((n) => (
                          <span key={n} className="bg-purple-900/20 border border-purple-800/30 text-purple-400 px-3 py-1.5 rounded-lg text-xs">
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      {insights.trendingNiches.length === 0
                        ? "Run Trend Radar scans to see trend alignment."
                        : "No alignment found between your likes and current trends."}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════ Section 5: Teach Me ════════════════ */}
      {activeSection === "teach" && (
        <div className="space-y-6">
          {/* Swipe Interface */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <span>🎓</span> Teach Me Your Preferences
            </h2>

            {teachPool.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 text-sm mb-2">No unreviewed products available</p>
                <p className="text-slate-600 text-xs">Run searches in Etsy Spy to populate products for training, or all products have been reviewed.</p>
              </div>
            ) : teachIdx >= teachPool.length ? (
              <div className="text-center py-12">
                <p className="text-green-400 text-sm mb-2">All done! You&apos;ve reviewed all available products.</p>
                <button
                  onClick={() => setTeachIdx(0)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium mt-2 transition-colors"
                >
                  Start Over
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-slate-500">Product {teachIdx + 1} of {teachPool.length}</p>
                  <div className="w-48 bg-slate-800 rounded-full h-1.5">
                    <div
                      className="bg-indigo-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${((teachIdx + 1) / teachPool.length) * 100}%` }}
                    />
                  </div>
                </div>

                {(() => {
                  const product = teachPool[teachIdx];
                  const price = parseFloat(product.price) || 0;
                  const reviews = product.reviews || product.num_favorers || 0;
                  const type = classifyProduct(product.title);

                  return (
                    <div className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-6 max-w-lg mx-auto">
                      <h3 className="text-base font-semibold text-white mb-3 leading-snug">{product.title || "Untitled Product"}</h3>
                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="bg-gray-900 rounded-lg p-3 text-center">
                          <p className="text-xs text-slate-500">Price</p>
                          <p className="text-lg font-bold text-green-400">${price.toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-900 rounded-lg p-3 text-center">
                          <p className="text-xs text-slate-500">Reviews</p>
                          <p className="text-lg font-bold text-white">{reviews}</p>
                        </div>
                        <div className="bg-gray-900 rounded-lg p-3 text-center">
                          <p className="text-xs text-slate-500">Type</p>
                          <p className="text-sm font-semibold text-indigo-400">{type}</p>
                        </div>
                        <div className="bg-gray-900 rounded-lg p-3 text-center">
                          <p className="text-xs text-slate-500">Niche</p>
                          <p className="text-sm font-semibold text-gray-300">{product.niche || "Unknown"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 justify-center">
                        <button
                          onClick={() => handleTeachPass(product)}
                          className="bg-red-900/30 hover:bg-red-600 text-red-400 hover:text-white px-8 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                        >
                          <span className="text-lg">👎</span> Pass
                        </button>
                        <button
                          onClick={() => handleTeachLike(product)}
                          className="bg-green-900/30 hover:bg-green-600 text-green-400 hover:text-white px-8 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                        >
                          <span className="text-lg">👍</span> Like
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Live DNA stats */}
                <div className="grid grid-cols-3 gap-3 mt-6 max-w-lg mx-auto">
                  <div className="bg-slate-800/80 border border-slate-600/50 rounded-lg p-2 text-center">
                    <p className="text-xs text-slate-500">Liked</p>
                    <p className="text-sm font-bold text-green-400">{dna.liked}</p>
                  </div>
                  <div className="bg-slate-800/80 border border-slate-600/50 rounded-lg p-2 text-center">
                    <p className="text-xs text-slate-500">Passed</p>
                    <p className="text-sm font-bold text-red-400">{dna.passed}</p>
                  </div>
                  <div className="bg-slate-800/80 border border-slate-600/50 rounded-lg p-2 text-center">
                    <p className="text-xs text-slate-500">Top Type</p>
                    <p className="text-sm font-bold text-indigo-400">{dna.topType}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* "I'm looking for..." */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <span>&#128172;</span> I&apos;m looking for...
            </h3>
            <p className="text-xs text-slate-500 mb-3">Describe what products you want to find. These become structured criteria for your research.</p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={lookingForInput}
                onChange={(e) => setLookingForInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCriteria();
                }}
                placeholder='e.g. "High-margin spreadsheets in the finance niche under $30"'
                className="flex-1 bg-slate-800/80 border border-slate-600/50 rounded-lg px-4 py-2 text-gray-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
              />
              <button
                onClick={handleAddCriteria}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Add
              </button>
            </div>

            {brainNotes.length > 0 && (
              <div className="space-y-2">
                {brainNotes.map((note) => (
                  <div key={note.id} className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-3 flex items-center justify-between group">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-300">{note.text}</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">
                        {new Date(note.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteCriteria(note.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs px-2 shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
