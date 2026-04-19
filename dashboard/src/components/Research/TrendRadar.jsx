import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, CartesianGrid, BarChart, Bar,
  ReferenceLine,
} from "recharts";

const API = "";

/* ─── Niche Definitions ─── */
const NICHES = [
  { id: "wedding", name: "Wedding Planning", emoji: "💒", keyword: "wedding planner template" },
  { id: "startup", name: "Startup Kits", emoji: "🚀", keyword: "business plan template" },
  { id: "resume", name: "Resume & Career", emoji: "📄", keyword: "resume template" },
  { id: "finance", name: "Personal Finance", emoji: "💰", keyword: "budget spreadsheet template" },
  { id: "meal", name: "Meal Planning", emoji: "🍽️", keyword: "meal planner template" },
  { id: "fitness", name: "Fitness & Workout", emoji: "💪", keyword: "workout planner" },
  { id: "home", name: "Home Organization", emoji: "🏠", keyword: "home organization printable" },
  { id: "parenting", name: "Parenting & Baby", emoji: "👶", keyword: "baby tracker template" },
  { id: "events", name: "Event Planning", emoji: "🎉", keyword: "event planning template" },
  { id: "social", name: "Social Media", emoji: "📱", keyword: "social media planner" },
  { id: "pet", name: "Pet Care", emoji: "🐾", keyword: "pet tracker template" },
  { id: "realestate", name: "Real Estate", emoji: "🏡", keyword: "real estate spreadsheet" },
];

const PRODUCT_TYPES = [
  "Spreadsheet", "Template", "Printable", "Guide", "Planner", "Checklist", "Tracker",
];

const COMPARE_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6"];

const LONGEVITY_CONFIG = {
  EVERGREEN: { icon: "✅", cls: "bg-green-900/60 text-green-300 border-green-600", label: "Evergreen", rec: "Strong long-term product. Build premium versions with recurring updates." },
  RISING: { icon: "🚀", cls: "bg-blue-900/60 text-blue-300 border-blue-600", label: "Rising", rec: "Get in early. Create products now before the market saturates." },
  SEASONAL: { icon: "📅", cls: "bg-yellow-900/60 text-yellow-300 border-yellow-600", label: "Seasonal", rec: "Time your launches. Prepare products 4-6 weeks before peak season." },
  FADING: { icon: "⚠️", cls: "bg-orange-900/60 text-orange-300 border-orange-600", label: "Fading", rec: "Proceed with caution. Consider pivoting or combining with trending niches." },
  FLASH: { icon: "❌", cls: "bg-red-900/60 text-red-300 border-red-600", label: "Flash Trend", rec: "Avoid investing heavily. These trends burn out quickly." },
};

const LS_NICHE_KEY = "de_niche_trends";
const LS_MATRIX_KEY = "de_opportunity_matrix";

/* ─── Helper Components ─── */

function Spinner({ size = "h-4 w-4" }) {
  return (
    <svg className={`animate-spin ${size} text-white`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function ErrorMsg({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-2 text-sm text-red-400 flex items-center justify-between">
      <span>{message}</span>
      <button onClick={onDismiss} className="text-red-400 hover:text-red-300 ml-3">&times;</button>
    </div>
  );
}

function ShimmerCard() {
  return (
    <div className="bg-gray-900 rounded-2xl p-5 border border-slate-700/40 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-slate-700" />
        <div className="h-4 w-24 rounded bg-slate-700" />
      </div>
      <div className="h-8 w-16 rounded bg-slate-700 mb-3" />
      <div className="h-[30px] w-full rounded bg-slate-800" />
      <div className="flex gap-2 mt-3">
        <div className="h-5 w-16 rounded-full bg-slate-700" />
        <div className="h-5 w-20 rounded-full bg-slate-700" />
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, right }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <span>{icon}</span> {title}
      </h2>
      {right}
    </div>
  );
}

function TrendScoreBadge({ score }) {
  if (score == null) return <span className="text-2xl font-bold text-slate-600">--</span>;
  const color = score > 60 ? "text-green-400" : score > 30 ? "text-yellow-400" : "text-red-400";
  return <span className={`text-2xl font-bold ${color}`}>{score}</span>;
}

function DirectionArrow({ direction }) {
  if (!direction) return null;
  const map = {
    rising: { arrow: "↗️", label: "Rising" },
    stable: { arrow: "→", label: "Stable" },
    fading: { arrow: "↘️", label: "Falling" },
  };
  const d = map[direction] || map.stable;
  return <span className="text-xs text-slate-400" title={d.label}>{d.arrow}</span>;
}

function TrendDirectionBadge({ direction }) {
  const config = {
    rising: { label: "Rising", cls: "bg-green-900/50 text-green-400 border-green-700", dot: "bg-green-400" },
    stable: { label: "Stable", cls: "bg-yellow-900/50 text-yellow-400 border-yellow-700", dot: "bg-yellow-400" },
    fading: { label: "Falling", cls: "bg-red-900/50 text-red-400 border-red-700", dot: "bg-red-400" },
  };
  const c = config[direction] || config.stable;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${c.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function MiniSparkline({ data, color = "#6366f1" }) {
  if (!data || data.length === 0) return <div className="w-[100px] h-[30px] bg-slate-800 rounded" />;
  return (
    <ResponsiveContainer width={100} height={30}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ─── API Helpers ─── */

async function fetchTrend(keyword, geo = "US") {
  const res = await fetch(`${API}/api/trends/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword, geo }),
  });
  if (!res.ok) throw new Error(`Trend search failed for "${keyword}"`);
  const json = await res.json();
  return json.data || json;
}

async function fetchRelated(keyword) {
  const res = await fetch(`${API}/api/trends/related`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword }),
  });
  if (!res.ok) throw new Error(`Related queries failed for "${keyword}"`);
  const json = await res.json();
  return json.data || json;
}

async function fetchCompare(keywords) {
  const res = await fetch(`${API}/api/trends/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keywords }),
  });
  if (!res.ok) throw new Error("Comparison failed");
  const json = await res.json();
  return json.data || json;
}

async function fetchLongevity(keyword) {
  const res = await fetch(`${API}/api/trends/longevity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword }),
  });
  if (!res.ok) throw new Error("Longevity analysis failed");
  const json = await res.json();
  return json.data || json;
}

function parseTimeline(data) {
  const raw = data.timeline || data.data || [];
  if (!Array.isArray(raw)) return [];
  return raw.map((p, i) => ({
    name: p.date || p.month || p.formattedTime || `M${i + 1}`,
    value: p.value ?? p.interest ?? 0,
  }));
}

function computeDirection(data) {
  if (data.direction) return data.direction;
  const points = parseTimeline(data);
  if (points.length < 4) return "stable";
  const half = Math.floor(points.length / 2);
  const avgFirst = points.slice(0, half).reduce((s, p) => s + p.value, 0) / half;
  const avgSecond = points.slice(half).reduce((s, p) => s + p.value, 0) / (points.length - half);
  if (avgSecond > avgFirst * 1.1) return "rising";
  if (avgSecond < avgFirst * 0.9) return "fading";
  return "stable";
}

function computeAvg(points) {
  if (!points.length) return 0;
  return Math.round(points.reduce((s, p) => s + p.value, 0) / points.length);
}

function computePeakMonth(data) {
  if (data.peakMonth) return data.peakMonth;
  const points = parseTimeline(data);
  if (!points.length) return "N/A";
  const peak = points.reduce((best, p) => (p.value > best.value ? p : best), points[0]);
  return peak.name;
}

/* ─── MAIN COMPONENT ─── */

export default function TrendRadar() {
  const [error, setError] = useState("");
  const clearError = useCallback(() => setError(""), []);

  /* ── Section state tracking ── */
  const [activeSection, setActiveSection] = useState("pulse");

  /* ── Niche Pulse state ── */
  const [nicheData, setNicheData] = useState(() => {
    try {
      const cached = localStorage.getItem(LS_NICHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch { return {}; }
  });
  const [nicheScanning, setNicheScanning] = useState({});
  const [scanAllLoading, setScanAllLoading] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState(null);

  /* ── Deep Dive state ── */
  const [ddKeyword, setDdKeyword] = useState("");
  const [ddRegion, setDdRegion] = useState("US");
  const [ddLoading, setDdLoading] = useState(false);
  const [ddData, setDdData] = useState(null);
  const [ddLongevity, setDdLongevity] = useState(null);
  const [ddLongevityLoading, setDdLongevityLoading] = useState(false);

  /* ── Related state ── */
  const [relatedData, setRelatedData] = useState(null);
  const [relatedLoading, setRelatedLoading] = useState(false);

  /* ── Compare state ── */
  const [compareKeywords, setCompareKeywords] = useState(["", "", "", "", ""]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareData, setCompareData] = useState(null);
  const [compareMeta, setCompareMeta] = useState([]);

  /* ── Opportunity Matrix state ── */
  const [matrixData, setMatrixData] = useState(() => {
    try {
      const cached = localStorage.getItem(LS_MATRIX_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch { return {}; }
  });
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [matrixProgress, setMatrixProgress] = useState({ done: 0, total: 0 });

  /* ── Autocomplete ── */
  const [showSuggestions, setShowSuggestions] = useState(false);
  const allKeywords = useMemo(() => NICHES.map(n => n.keyword), []);
  const filteredSuggestions = useMemo(() => {
    if (!ddKeyword.trim()) return allKeywords;
    const lower = ddKeyword.toLowerCase();
    return allKeywords.filter(k => k.toLowerCase().includes(lower));
  }, [ddKeyword, allKeywords]);

  const deepDiveRef = useRef(null);

  /* ── Persist niche data ── */
  useEffect(() => {
    if (Object.keys(nicheData).length > 0) {
      localStorage.setItem(LS_NICHE_KEY, JSON.stringify(nicheData));
    }
  }, [nicheData]);

  useEffect(() => {
    if (Object.keys(matrixData).length > 0) {
      localStorage.setItem(LS_MATRIX_KEY, JSON.stringify(matrixData));
    }
  }, [matrixData]);

  /* ── Niche scanning ── */
  const scanNiche = useCallback(async (niche) => {
    setNicheScanning(prev => ({ ...prev, [niche.id]: true }));
    try {
      const data = await fetchTrend(niche.keyword);
      const timeline = parseTimeline(data);
      const direction = computeDirection(data);
      const avg = data.average ?? computeAvg(timeline);
      const peakMonth = computePeakMonth(data);

      let hotKeywords = [];
      try {
        const related = await fetchRelated(niche.keyword);
        const rising = related.risingQueries || related.rising || [];
        hotKeywords = rising.slice(0, 3).map(q => q.query || q.keyword || q);
      } catch {}

      const result = {
        timeline,
        direction,
        average: avg,
        peakMonth,
        hotKeywords,
        fetchedAt: new Date().toISOString(),
      };

      setNicheData(prev => ({ ...prev, [niche.id]: result }));
    } catch (err) {
      setError(`Failed to scan ${niche.name}: ${err.message}`);
    } finally {
      setNicheScanning(prev => ({ ...prev, [niche.id]: false }));
    }
  }, []);

  const scanAllNiches = useCallback(async () => {
    setScanAllLoading(true);
    for (const niche of NICHES) {
      await scanNiche(niche);
      // small delay to avoid hammering the API
      await new Promise(r => setTimeout(r, 800));
    }
    setScanAllLoading(false);
  }, [scanNiche]);

  /* ── Deep Dive ── */
  const handleDeepDive = useCallback(async (kw) => {
    const keyword = kw || ddKeyword.trim();
    if (!keyword) return;
    setDdKeyword(keyword);
    setDdLoading(true);
    setDdData(null);
    setDdLongevity(null);
    setError("");
    try {
      const data = await fetchTrend(keyword, ddRegion);
      setDdData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setDdLoading(false);
    }
  }, [ddKeyword, ddRegion]);

  const handleRelated = useCallback(async (kw) => {
    const keyword = kw || ddKeyword.trim();
    if (!keyword) return;
    setRelatedLoading(true);
    setError("");
    try {
      const data = await fetchRelated(keyword);
      setRelatedData(data);
      setActiveSection("related");
    } catch (err) {
      setError(err.message);
    } finally {
      setRelatedLoading(false);
    }
  }, [ddKeyword]);

  const handleLongevity = useCallback(async () => {
    if (!ddKeyword.trim()) return;
    setDdLongevityLoading(true);
    try {
      const data = await fetchLongevity(ddKeyword.trim());
      setDdLongevity(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setDdLongevityLoading(false);
    }
  }, [ddKeyword]);

  /* ── Compare ── */
  const handleCompare = useCallback(async () => {
    const keywords = compareKeywords.filter(k => k.trim());
    if (keywords.length < 2) {
      setError("Enter at least 2 keywords to compare");
      return;
    }
    setCompareLoading(true);
    setError("");
    setCompareData(null);
    setCompareMeta([]);
    try {
      const data = await fetchCompare(keywords);
      setCompareData(data);

      // Fetch individual meta for each keyword
      const meta = [];
      for (const kw of keywords) {
        try {
          const t = await fetchTrend(kw);
          const tl = parseTimeline(t);
          const dir = computeDirection(t);
          const avg = t.average ?? computeAvg(tl);
          const peak = computePeakMonth(t);
          let classification = null;
          try {
            const lon = await fetchLongevity(kw);
            classification = lon.type || lon.classification || null;
          } catch {}
          meta.push({ keyword: kw, average: avg, direction: dir, peakMonth: peak, classification });
        } catch {
          meta.push({ keyword: kw, average: 0, direction: "stable", peakMonth: "N/A", classification: null });
        }
      }
      setCompareMeta(meta);
    } catch (err) {
      setError(err.message);
    } finally {
      setCompareLoading(false);
    }
  }, [compareKeywords]);

  /* ── Opportunity Matrix ── */
  const generateMatrix = useCallback(async () => {
    setMatrixLoading(true);
    const total = NICHES.length * PRODUCT_TYPES.length;
    setMatrixProgress({ done: 0, total });
    const newMatrix = { ...matrixData };
    let done = 0;

    for (const niche of NICHES) {
      for (const ptype of PRODUCT_TYPES) {
        const cellKey = `${niche.id}__${ptype.toLowerCase()}`;
        // Skip if already cached
        if (newMatrix[cellKey] && newMatrix[cellKey].fetchedAt) {
          done++;
          setMatrixProgress({ done, total });
          continue;
        }
        const searchTerm = `${niche.keyword.replace(/template|printable|planner|spreadsheet/gi, "").trim()} ${ptype.toLowerCase()}`;
        try {
          const data = await fetchTrend(searchTerm);
          const tl = parseTimeline(data);
          const avg = data.average ?? computeAvg(tl);
          const dir = computeDirection(data);
          newMatrix[cellKey] = { score: avg, direction: dir, keyword: searchTerm, fetchedAt: new Date().toISOString() };
        } catch {
          newMatrix[cellKey] = { score: null, direction: null, keyword: searchTerm, fetchedAt: new Date().toISOString() };
        }
        done++;
        setMatrixProgress({ done, total });
        setMatrixData({ ...newMatrix });
        await new Promise(r => setTimeout(r, 600));
      }
    }
    setMatrixData(newMatrix);
    localStorage.setItem(LS_MATRIX_KEY, JSON.stringify(newMatrix));
    setMatrixLoading(false);
  }, [matrixData]);

  /* ── Niche card click ── */
  const handleNicheClick = useCallback((niche) => {
    setSelectedNiche(niche.id);
    setDdKeyword(niche.keyword);
    setActiveSection("deepdive");
    handleDeepDive(niche.keyword);
    setTimeout(() => deepDiveRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [handleDeepDive]);

  /* ── Load related keyword into Deep Dive ── */
  const loadKeywordIntoDeepDive = useCallback((kw) => {
    setDdKeyword(kw);
    setActiveSection("deepdive");
    handleDeepDive(kw);
    setTimeout(() => deepDiveRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [handleDeepDive]);

  /* ── Trending Now computed data ── */
  const trendingNow = useMemo(() => {
    const allResults = [];
    // Gather from niche data
    for (const niche of NICHES) {
      const d = nicheData[niche.id];
      if (!d) continue;
      allResults.push({
        keyword: niche.keyword,
        niche: niche.name,
        emoji: niche.emoji,
        score: d.average,
        direction: d.direction,
        hotKeywords: d.hotKeywords || [],
      });
    }

    const hot = allResults
      .filter(r => r.direction === "rising" && r.score > 40)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const steady = allResults
      .filter(r => r.score > 50)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const watchList = allResults
      .filter(r => r.direction === "fading" || r.score < 25)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5);

    // Opportunities from matrix
    const opportunities = [];
    for (const [key, val] of Object.entries(matrixData)) {
      if (val.score > 40 && val.direction === "rising") {
        const [nicheId, ptype] = key.split("__");
        const niche = NICHES.find(n => n.id === nicheId);
        if (niche) {
          opportunities.push({
            keyword: val.keyword,
            niche: niche.name,
            emoji: niche.emoji,
            productType: ptype,
            score: val.score,
          });
        }
      }
    }
    opportunities.sort((a, b) => b.score - a.score);

    return { hot, steady, watchList, opportunities: opportunities.slice(0, 6) };
  }, [nicheData, matrixData]);

  /* ── Deep Dive computed ── */
  const ddTimeline = ddData ? parseTimeline(ddData) : [];
  const ddAvg = ddData ? (ddData.average ?? computeAvg(ddTimeline)) : 0;
  const ddDirection = ddData ? computeDirection(ddData) : null;
  const ddPeak = ddData ? computePeakMonth(ddData) : null;
  const ddYoY = useMemo(() => {
    if (ddTimeline.length < 12) return null;
    const recent6 = ddTimeline.slice(-6);
    const prior6 = ddTimeline.slice(-12, -6);
    const avgRecent = computeAvg(recent6);
    const avgPrior = computeAvg(prior6);
    if (avgPrior === 0) return null;
    return Math.round(((avgRecent - avgPrior) / avgPrior) * 100);
  }, [ddTimeline]);

  /* ── Compare chart data ── */
  const compareChartPoints = useMemo(() => {
    if (!compareData) return [];
    const raw = compareData.timeline || compareData.data || [];
    if (!Array.isArray(raw)) return [];
    const kws = compareData.keywords || compareKeywords.filter(k => k.trim());
    return raw.map((p, i) => ({
      name: p.date || p.month || `M${i + 1}`,
      ...Object.fromEntries(
        kws.map((kw, ki) => [kw, p.values?.[ki] ?? p[kw] ?? 0])
      ),
    }));
  }, [compareData, compareKeywords]);

  const activeCompareKeywords = compareKeywords.filter(k => k.trim());

  /* ── Last scanned ── */
  const lastScanned = useMemo(() => {
    const dates = Object.values(nicheData).map(d => d.fetchedAt).filter(Boolean);
    if (!dates.length) return null;
    return new Date(Math.max(...dates.map(d => new Date(d).getTime())));
  }, [nicheData]);

  /* ─────────────────── RENDER ─────────────────── */

  const NAV_ITEMS = [
    { id: "pulse", label: "Niche Pulse", icon: "📊" },
    { id: "deepdive", label: "Deep Dive", icon: "🔬" },
    { id: "related", label: "Related", icon: "🔗" },
    { id: "compare", label: "Compare", icon: "⚖️" },
    { id: "matrix", label: "Opportunity Matrix", icon: "🎯" },
    { id: "trending", label: "Trending Now", icon: "🔥" },
  ];

  return (
    <div className="space-y-6">
      <ErrorMsg message={error} onDismiss={clearError} />

      {/* Section Navigation */}
      <div className="flex flex-wrap gap-2">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeSection === item.id
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700/70 hover:text-slate-200"
            }`}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </div>

      {/* ════════════ SECTION 1: NICHE PULSE ════════════ */}
      {activeSection === "pulse" && (
        <div className="space-y-5">
          <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
            <SectionHeader
              icon="📊"
              title="Niche Pulse"
              right={
                <div className="flex items-center gap-4">
                  {lastScanned && (
                    <span className="text-xs text-slate-500">
                      Last scanned: {lastScanned.toLocaleDateString()} {lastScanned.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                  {!lastScanned && <span className="text-xs text-slate-500">Not scanned yet</span>}
                  <button
                    onClick={scanAllNiches}
                    disabled={scanAllLoading}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    {scanAllLoading ? <Spinner /> : null}
                    {scanAllLoading ? "Scanning..." : "Scan All Niches"}
                  </button>
                </div>
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {NICHES.map(niche => {
                const data = nicheData[niche.id];
                const isLoading = nicheScanning[niche.id];
                const isSelected = selectedNiche === niche.id;

                if (isLoading && !data) return <ShimmerCard key={niche.id} />;

                return (
                  <button
                    key={niche.id}
                    onClick={() => handleNicheClick(niche)}
                    className={`bg-gray-900 rounded-2xl p-5 border text-left transition-all hover:border-indigo-600/50 hover:shadow-lg hover:shadow-indigo-600/5 ${
                      isSelected ? "border-indigo-500 ring-1 ring-indigo-500/30" : "border-slate-700/40"
                    } ${isLoading ? "opacity-70" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{niche.emoji}</span>
                        <span className="text-sm font-medium text-gray-200">{niche.name}</span>
                      </div>
                      {isLoading && <Spinner size="h-3 w-3" />}
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <TrendScoreBadge score={data?.average} />
                      <DirectionArrow direction={data?.direction} />
                    </div>

                    <div className="mb-3">
                      <MiniSparkline
                        data={data?.timeline}
                        color={
                          data?.average > 60 ? "#22c55e" :
                          data?.average > 30 ? "#eab308" : "#ef4444"
                        }
                      />
                    </div>

                    {data?.hotKeywords?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {data.hotKeywords.map((kw, i) => (
                          <span key={i} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}

                    {!data && !isLoading && (
                      <p className="text-xs text-slate-600 mt-2">Click "Scan All" or click here to scan</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════════════ SECTION 2: DEEP DIVE ════════════ */}
      {activeSection === "deepdive" && (
        <div className="space-y-5" ref={deepDiveRef}>
          {/* Search Controls */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
            <SectionHeader icon="🔬" title="Deep Dive" />

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={ddKeyword}
                  onChange={e => { setDdKeyword(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onKeyDown={e => e.key === "Enter" && (setShowSuggestions(false), handleDeepDive())}
                  placeholder="Enter a keyword or select a niche..."
                  className="w-full bg-slate-800/80 border border-slate-600/50 rounded-lg px-4 py-2.5 text-gray-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-slate-800/80 border border-slate-600/50 rounded-lg max-h-48 overflow-y-auto shadow-xl">
                    {filteredSuggestions.map(kw => (
                      <button
                        key={kw}
                        onMouseDown={() => { setDdKeyword(kw); setShowSuggestions(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700/70 hover:text-white transition-colors"
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <select
                value={ddRegion}
                onChange={e => setDdRegion(e.target.value)}
                className="bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="both">Both (US + CA)</option>
              </select>

              <button
                onClick={() => handleDeepDive()}
                disabled={ddLoading || !ddKeyword.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                {ddLoading ? <Spinner /> : <span>📈</span>}
                Check Trend
              </button>

              <button
                onClick={() => handleRelated()}
                disabled={relatedLoading || !ddKeyword.trim()}
                className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                {relatedLoading ? <Spinner /> : <span>🔗</span>}
                Related Queries
              </button>
            </div>
          </div>

          {/* Trend Chart */}
          {ddLoading && (
            <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40 animate-pulse">
              <div className="h-4 w-48 bg-slate-700 rounded mb-6" />
              <div className="h-72 bg-slate-800 rounded-xl" />
            </div>
          )}

          {ddTimeline.length > 0 && !ddLoading && (
            <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-white">
                  Interest Over Time: "{ddKeyword}"
                </h3>
                {ddDirection && <TrendDirectionBadge direction={ddDirection} />}
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ddTimeline}>
                    <defs>
                      <linearGradient id="ddGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#9ca3af", fontSize: 11 }}
                      axisLine={{ stroke: "#374151" }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: "#9ca3af", fontSize: 11 }}
                      axisLine={{ stroke: "#374151" }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#f3f4f6",
                      }}
                      formatter={(value) => [value, "Interest"]}
                    />
                    <ReferenceLine
                      y={ddAvg}
                      stroke="#6366f1"
                      strokeDasharray="6 4"
                      strokeOpacity={0.5}
                      label={{ value: `Avg: ${ddAvg}`, fill: "#818cf8", fontSize: 11, position: "insideTopRight" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fill="url(#ddGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Trend Summary Card */}
          {ddData && !ddLoading && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-900 rounded-2xl p-5 border border-slate-700/40 text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Average Interest</p>
                <p className="text-3xl font-bold text-white">{ddAvg}</p>
                <p className="text-xs text-slate-500 mt-1">out of 100</p>
              </div>
              <div className="bg-gray-900 rounded-2xl p-5 border border-slate-700/40 text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Peak Month</p>
                <p className="text-lg font-semibold text-white mt-2">{ddPeak}</p>
              </div>
              <div className="bg-gray-900 rounded-2xl p-5 border border-slate-700/40 text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Trend Direction</p>
                <div className="mt-2">{ddDirection && <TrendDirectionBadge direction={ddDirection} />}</div>
              </div>
              <div className="bg-gray-900 rounded-2xl p-5 border border-slate-700/40 text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">6-Month Change</p>
                {ddYoY != null ? (
                  <p className={`text-2xl font-bold ${ddYoY > 0 ? "text-green-400" : ddYoY < 0 ? "text-red-400" : "text-slate-400"}`}>
                    {ddYoY > 0 ? "+" : ""}{ddYoY}%
                  </p>
                ) : (
                  <p className="text-lg text-slate-600 mt-2">N/A</p>
                )}
              </div>
            </div>
          )}

          {/* Longevity Analysis */}
          {ddData && !ddLoading && (
            <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <span>🧬</span> Longevity Classification
                </h3>
                <button
                  onClick={handleLongevity}
                  disabled={ddLongevityLoading || !ddKeyword.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors text-sm"
                >
                  {ddLongevityLoading ? <Spinner /> : <span>📊</span>}
                  Analyze Longevity
                </button>
              </div>

              {ddLongevityLoading && (
                <div className="animate-pulse space-y-3">
                  <div className="h-12 w-48 bg-slate-700 rounded-xl" />
                  <div className="h-3 w-full bg-slate-700 rounded max-w-md" />
                  <div className="h-3 w-3/4 bg-slate-700 rounded" />
                </div>
              )}

              {ddLongevity && !ddLongevityLoading && (() => {
                const classification = ddLongevity.type || ddLongevity.classification || "UNKNOWN";
                const config = LONGEVITY_CONFIG[classification] || LONGEVITY_CONFIG.FADING;
                const confidence = ddLongevity.confidence ?? 0;
                return (
                  <div className="space-y-4">
                    <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl border text-lg font-bold ${config.cls}`}>
                      {config.icon} {classification}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-400 w-20">Confidence</span>
                      <div className="flex-1 bg-slate-800 rounded-full h-3 max-w-sm overflow-hidden">
                        <div
                          className="bg-indigo-500 h-3 rounded-full transition-all duration-700"
                          style={{ width: `${confidence}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-white w-12 text-right">{confidence}%</span>
                    </div>

                    {ddLongevity.reasoning && (
                      <div className="bg-slate-800 rounded-xl p-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Reasoning</p>
                        <p className="text-sm text-gray-300 leading-relaxed">{ddLongevity.reasoning}</p>
                      </div>
                    )}

                    <div className="bg-slate-800 rounded-xl p-4">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Recommendation</p>
                      <p className="text-sm text-gray-300 leading-relaxed">{config.rec}</p>
                    </div>
                  </div>
                );
              })()}

              {!ddLongevity && !ddLongevityLoading && (
                <p className="text-sm text-slate-500">
                  Click "Analyze Longevity" to classify this trend as Evergreen, Rising, Seasonal, Fading, or Flash.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════ SECTION 3: RELATED QUERIES & TOPICS ════════════ */}
      {activeSection === "related" && (
        <div className="space-y-5">
          <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
            <SectionHeader icon="🔗" title={`Related Queries & Topics${ddKeyword ? `: "${ddKeyword}"` : ""}`} />

            {!relatedData && !relatedLoading && (
              <div className="text-center py-12">
                <p className="text-slate-500 mb-4">Search for a keyword first, then click "Related Queries" to see related data.</p>
                <button
                  onClick={() => setActiveSection("deepdive")}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Go to Deep Dive
                </button>
              </div>
            )}

            {relatedLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="animate-pulse space-y-3">
                    <div className="h-4 w-24 bg-slate-700 rounded" />
                    {[1, 2, 3, 4, 5].map(j => (
                      <div key={j} className="h-9 bg-slate-800 rounded-lg" />
                    ))}
                  </div>
                ))}
              </div>
            )}

            {relatedData && !relatedLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Top Queries */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Top Queries</h3>
                  <div className="space-y-2">
                    {(relatedData.topQueries || relatedData.top || []).map((q, i) => {
                      const text = q.query || q.keyword || q;
                      const val = q.value || q.score || "";
                      return (
                        <div key={i} className="bg-slate-800 rounded-lg px-3 py-2 flex items-center justify-between group">
                          <span className="text-sm text-gray-300 truncate flex-1 mr-2">{text}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-slate-500">{val}</span>
                            <div className="hidden group-hover:flex gap-1">
                              <button
                                onClick={() => loadKeywordIntoDeepDive(text)}
                                className="text-[10px] text-indigo-400 hover:text-indigo-300 bg-indigo-900/30 px-2 py-0.5 rounded"
                                title="Check Trend"
                              >
                                Trend
                              </button>
                              <button
                                onClick={() => { navigator.clipboard.writeText(text); }}
                                className="text-[10px] text-green-400 hover:text-green-300 bg-green-900/30 px-2 py-0.5 rounded"
                                title="Copy to search on Etsy"
                              >
                                Etsy
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {(relatedData.topQueries || relatedData.top || []).length === 0 && (
                      <p className="text-xs text-slate-600">No top queries found</p>
                    )}
                  </div>
                </div>

                {/* Rising Queries */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Rising Queries</h3>
                  <div className="space-y-2">
                    {(relatedData.risingQueries || relatedData.rising || []).map((q, i) => {
                      const text = q.query || q.keyword || q;
                      const val = q.value || q.percentage || "";
                      const isBreakout = val === "Breakout" || val === "breakout";
                      return (
                        <div key={i} className="bg-slate-800 rounded-lg px-3 py-2 flex items-center justify-between group">
                          <span className="text-sm text-gray-300 truncate flex-1 mr-2">{text}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-xs font-medium ${isBreakout ? "text-green-300 bg-green-900/40 px-1.5 py-0.5 rounded" : "text-green-400"}`}>
                              {isBreakout ? "Breakout" : `${val}${typeof val === "number" ? "%" : ""}`}
                            </span>
                            <div className="hidden group-hover:flex gap-1">
                              <button
                                onClick={() => loadKeywordIntoDeepDive(text)}
                                className="text-[10px] text-indigo-400 hover:text-indigo-300 bg-indigo-900/30 px-2 py-0.5 rounded"
                              >
                                Trend
                              </button>
                              <button
                                onClick={() => { navigator.clipboard.writeText(text); }}
                                className="text-[10px] text-green-400 hover:text-green-300 bg-green-900/30 px-2 py-0.5 rounded"
                              >
                                Etsy
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {(relatedData.risingQueries || relatedData.rising || []).length === 0 && (
                      <p className="text-xs text-slate-600">No rising queries found</p>
                    )}
                  </div>
                </div>

                {/* Top Topics */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Top Topics</h3>
                  <div className="space-y-2">
                    {(relatedData.topTopics || []).map((t, i) => {
                      const text = t.topic || t.title || t;
                      const val = t.value || t.score || "";
                      return (
                        <div key={i} className="bg-slate-800 rounded-lg px-3 py-2 flex items-center justify-between group">
                          <span className="text-sm text-gray-300 truncate flex-1 mr-2">{text}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-slate-500">{val}</span>
                            <button
                              onClick={() => loadKeywordIntoDeepDive(text)}
                              className="hidden group-hover:block text-[10px] text-indigo-400 hover:text-indigo-300 bg-indigo-900/30 px-2 py-0.5 rounded"
                            >
                              Trend
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {(relatedData.topTopics || []).length === 0 && (
                      <p className="text-xs text-slate-600">No top topics found</p>
                    )}
                  </div>
                </div>

                {/* Rising Topics */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Rising Topics</h3>
                  <div className="space-y-2">
                    {(relatedData.risingTopics || []).map((t, i) => {
                      const text = t.topic || t.title || t;
                      const val = t.value || t.percentage || "";
                      const isBreakout = val === "Breakout" || val === "breakout";
                      return (
                        <div key={i} className="bg-slate-800 rounded-lg px-3 py-2 flex items-center justify-between group">
                          <span className="text-sm text-gray-300 truncate flex-1 mr-2">{text}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-xs font-medium ${isBreakout ? "text-green-300 bg-green-900/40 px-1.5 py-0.5 rounded" : "text-green-400"}`}>
                              {isBreakout ? "Breakout" : `${val}${typeof val === "number" ? "%" : ""}`}
                            </span>
                            <button
                              onClick={() => loadKeywordIntoDeepDive(text)}
                              className="hidden group-hover:block text-[10px] text-indigo-400 hover:text-indigo-300 bg-indigo-900/30 px-2 py-0.5 rounded"
                            >
                              Trend
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {(relatedData.risingTopics || []).length === 0 && (
                      <p className="text-xs text-slate-600">No rising topics found</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════ SECTION 4: COMPARE KEYWORDS ════════════ */}
      {activeSection === "compare" && (
        <div className="space-y-5">
          <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
            <SectionHeader icon="⚖️" title="Compare Keywords" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
              {compareKeywords.map((kw, i) => (
                <div key={i} className="relative">
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                    style={{ backgroundColor: kw.trim() ? COMPARE_COLORS[i] : "transparent" }}
                  />
                  <input
                    type="text"
                    value={kw}
                    onChange={e => {
                      const next = [...compareKeywords];
                      next[i] = e.target.value;
                      setCompareKeywords(next);
                    }}
                    placeholder={`Keyword ${i + 1}`}
                    className="w-full bg-slate-800/80 border border-slate-600/50 rounded-lg pl-4 pr-3 py-2.5 text-sm text-gray-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleCompare}
              disabled={compareLoading || activeCompareKeywords.length < 2}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors text-sm"
            >
              {compareLoading ? <Spinner /> : <span>📊</span>}
              {compareLoading ? "Comparing..." : "Compare"}
            </button>
          </div>

          {/* Compare Chart */}
          {compareLoading && (
            <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40 animate-pulse">
              <div className="h-72 bg-slate-800 rounded-xl" />
            </div>
          )}

          {compareChartPoints.length > 0 && !compareLoading && (
            <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
              <h3 className="text-base font-semibold text-white mb-4">Keyword Comparison</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={compareChartPoints}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#9ca3af", fontSize: 11 }}
                      axisLine={{ stroke: "#374151" }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: "#9ca3af", fontSize: 11 }}
                      axisLine={{ stroke: "#374151" }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#f3f4f6",
                      }}
                    />
                    <Legend wrapperStyle={{ color: "#d1d5db", fontSize: 12 }} />
                    {activeCompareKeywords.map((kw, i) => (
                      <Line
                        key={kw}
                        type="monotone"
                        dataKey={kw}
                        stroke={COMPARE_COLORS[i]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Winner badge */}
              {compareMeta.length > 0 && (() => {
                const winner = compareMeta.reduce((best, m) => (m.average > best.average ? m : best), compareMeta[0]);
                return (
                  <div className="mt-4 flex items-center gap-2 justify-center">
                    <span className="text-yellow-400">🏆</span>
                    <span className="text-sm text-gray-300">
                      Winner: <span className="text-white font-semibold">{winner.keyword}</span> with average score of <span className="text-indigo-400 font-bold">{winner.average}</span>
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Comparison Table */}
          {compareMeta.length > 0 && !compareLoading && (
            <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40 overflow-x-auto">
              <h3 className="text-base font-semibold text-white mb-4">Comparison Details</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-700/40">
                    <th className="text-left pb-3 pr-4">Keyword</th>
                    <th className="text-center pb-3 px-3">Average</th>
                    <th className="text-center pb-3 px-3">Direction</th>
                    <th className="text-center pb-3 px-3">Peak Month</th>
                    <th className="text-center pb-3 px-3">Classification</th>
                  </tr>
                </thead>
                <tbody>
                  {compareMeta.map((m, i) => {
                    const best = compareMeta.reduce((b, x) => (x.average > b.average ? x : b), compareMeta[0]);
                    const isBest = m.keyword === best.keyword;
                    return (
                      <tr key={i} className={`border-b border-slate-700/40/50 ${isBest ? "bg-indigo-900/10" : ""}`}>
                        <td className="py-3 pr-4 text-gray-200 font-medium flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COMPARE_COLORS[i] }} />
                          {m.keyword}
                          {isBest && <span className="text-yellow-400 text-xs">🏆</span>}
                        </td>
                        <td className="text-center py-3 px-3">
                          <span className={`font-bold ${m.average > 60 ? "text-green-400" : m.average > 30 ? "text-yellow-400" : "text-red-400"}`}>
                            {m.average}
                          </span>
                        </td>
                        <td className="text-center py-3 px-3">
                          <TrendDirectionBadge direction={m.direction} />
                        </td>
                        <td className="text-center py-3 px-3 text-slate-400">{m.peakMonth}</td>
                        <td className="text-center py-3 px-3">
                          {m.classification ? (
                            <span className={`text-xs px-2 py-1 rounded ${(LONGEVITY_CONFIG[m.classification] || {}).cls || "bg-slate-700 text-slate-400"}`}>
                              {(LONGEVITY_CONFIG[m.classification] || {}).icon || ""} {m.classification}
                            </span>
                          ) : (
                            <span className="text-slate-600 text-xs">--</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════════════ SECTION 5: OPPORTUNITY MATRIX ════════════ */}
      {activeSection === "matrix" && (
        <div className="space-y-5">
          <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
            <SectionHeader
              icon="🎯"
              title="Opportunity Matrix"
              right={
                <div className="flex items-center gap-3">
                  {matrixLoading && (
                    <span className="text-xs text-slate-500">
                      {matrixProgress.done}/{matrixProgress.total} cells scanned
                    </span>
                  )}
                  <button
                    onClick={generateMatrix}
                    disabled={matrixLoading}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    {matrixLoading ? <Spinner /> : <span>🎯</span>}
                    {matrixLoading ? "Generating..." : Object.keys(matrixData).length > 0 ? "Refresh Matrix" : "Generate Opportunity Matrix"}
                  </button>
                </div>
              }
            />

            {/* Progress bar */}
            {matrixLoading && (
              <div className="mb-4">
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${matrixProgress.total > 0 ? (matrixProgress.done / matrixProgress.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}

            {Object.keys(matrixData).length === 0 && !matrixLoading && (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">🎯</p>
                <p className="text-slate-400 mb-2">Cross-reference all 12 niches with 7 product types</p>
                <p className="text-sm text-slate-600">Click "Generate Opportunity Matrix" to build a {NICHES.length * PRODUCT_TYPES.length}-cell heatmap of trend scores.</p>
                <p className="text-xs text-slate-600 mt-1">This will make ~{NICHES.length * PRODUCT_TYPES.length} API calls and may take a few minutes.</p>
              </div>
            )}

            {Object.keys(matrixData).length > 0 && (
              <div className="overflow-x-auto">
                <div className="flex gap-4 mb-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-600/50" /> High (60+)</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-600/50" /> Medium (30-60)</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-600/50" /> Low (&lt;30)</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-800" /> No data</span>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left pb-2 pr-3 text-slate-500 uppercase tracking-wider font-medium sticky left-0 bg-gray-900 z-10">Niche</th>
                      {PRODUCT_TYPES.map(pt => (
                        <th key={pt} className="text-center pb-2 px-2 text-slate-500 uppercase tracking-wider font-medium whitespace-nowrap">{pt}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {NICHES.map(niche => (
                      <tr key={niche.id} className="border-t border-slate-700/40/30">
                        <td className="py-1.5 pr-3 text-gray-300 font-medium whitespace-nowrap sticky left-0 bg-gray-900 z-10">
                          {niche.emoji} {niche.name}
                        </td>
                        {PRODUCT_TYPES.map(pt => {
                          const key = `${niche.id}__${pt.toLowerCase()}`;
                          const cell = matrixData[key];
                          const score = cell?.score;
                          let bgClass = "bg-slate-800";
                          if (score != null) {
                            if (score > 60) bgClass = "bg-green-600/50";
                            else if (score > 30) bgClass = "bg-yellow-600/50";
                            else bgClass = "bg-red-600/50";
                          }
                          return (
                            <td key={pt} className="py-1.5 px-1">
                              <button
                                onClick={() => cell?.keyword && loadKeywordIntoDeepDive(cell.keyword)}
                                className={`w-full h-10 rounded-lg ${bgClass} flex items-center justify-center transition-all hover:ring-1 hover:ring-indigo-500/50`}
                                title={cell?.keyword || `${niche.name} + ${pt}`}
                              >
                                {score != null ? (
                                  <div className="text-center">
                                    <span className="text-white font-bold text-xs">{score}</span>
                                    {cell?.direction && (
                                      <span className="block text-[8px] text-gray-300 -mt-0.5">
                                        {cell.direction === "rising" ? "↗" : cell.direction === "fading" ? "↘" : "→"}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-600">--</span>
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════ SECTION 6: TRENDING NOW ════════════ */}
      {activeSection === "trending" && (
        <div className="space-y-5">
          {/* No data state */}
          {trendingNow.hot.length === 0 && trendingNow.steady.length === 0 && trendingNow.watchList.length === 0 && trendingNow.opportunities.length === 0 && (
            <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40 text-center py-16">
              <p className="text-4xl mb-3">🔥</p>
              <p className="text-slate-400 mb-2">No trend data yet</p>
              <p className="text-sm text-slate-600 mb-4">
                Scan niches and generate the opportunity matrix first to populate this section.
              </p>
              <button
                onClick={() => setActiveSection("pulse")}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Go to Niche Pulse
              </button>
            </div>
          )}

          {(trendingNow.hot.length > 0 || trendingNow.steady.length > 0 || trendingNow.watchList.length > 0 || trendingNow.opportunities.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Hot Right Now */}
              <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="text-lg">🔥</span> Hot Right Now
                </h3>
                {trendingNow.hot.length === 0 && <p className="text-xs text-slate-600">No hot niches detected yet</p>}
                <div className="space-y-2">
                  {trendingNow.hot.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => loadKeywordIntoDeepDive(item.keyword)}
                      className="w-full text-left bg-slate-800 hover:bg-slate-700/80 rounded-lg px-4 py-3 flex items-center justify-between transition-colors hover:ring-1 hover:ring-indigo-500/30"
                    >
                      <div className="flex items-center gap-3">
                        <span>{item.emoji}</span>
                        <div>
                          <p className="text-sm text-gray-200 font-medium">{item.niche}</p>
                          <p className="text-xs text-slate-500">{item.keyword}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-green-400 font-bold">{item.score}</span>
                        <span className="block text-xs text-green-500">↗ Rising</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Steady Winners */}
              <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="text-lg">📈</span> Steady Winners
                </h3>
                {trendingNow.steady.length === 0 && <p className="text-xs text-slate-600">No steady winners detected yet</p>}
                <div className="space-y-2">
                  {trendingNow.steady.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => loadKeywordIntoDeepDive(item.keyword)}
                      className="w-full text-left bg-slate-800 hover:bg-slate-700/80 rounded-lg px-4 py-3 flex items-center justify-between transition-colors hover:ring-1 hover:ring-indigo-500/30"
                    >
                      <div className="flex items-center gap-3">
                        <span>{item.emoji}</span>
                        <div>
                          <p className="text-sm text-gray-200 font-medium">{item.niche}</p>
                          <p className="text-xs text-slate-500">{item.keyword}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-indigo-400 font-bold">{item.score}</span>
                        <span className="block text-xs text-slate-500">{item.direction === "rising" ? "↗" : item.direction === "fading" ? "↘" : "→"} {item.direction}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Watch List */}
              <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="text-lg">⚠️</span> Watch List
                </h3>
                {trendingNow.watchList.length === 0 && <p className="text-xs text-slate-600">No declining niches detected</p>}
                <div className="space-y-2">
                  {trendingNow.watchList.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => loadKeywordIntoDeepDive(item.keyword)}
                      className="w-full text-left bg-slate-800 hover:bg-slate-700/80 rounded-lg px-4 py-3 flex items-center justify-between transition-colors hover:ring-1 hover:ring-red-500/30"
                    >
                      <div className="flex items-center gap-3">
                        <span>{item.emoji}</span>
                        <div>
                          <p className="text-sm text-gray-200 font-medium">{item.niche}</p>
                          <p className="text-xs text-slate-500">{item.keyword}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-red-400 font-bold">{item.score}</span>
                        <span className="block text-xs text-red-500">↘ {item.direction}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Opportunities */}
              <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="text-lg">💡</span> Opportunities
                </h3>
                {trendingNow.opportunities.length === 0 && (
                  <div>
                    <p className="text-xs text-slate-600 mb-2">No opportunities detected yet</p>
                    <p className="text-xs text-slate-600">Generate the Opportunity Matrix to find niche + product type combos that are trending up.</p>
                  </div>
                )}
                <div className="space-y-2">
                  {trendingNow.opportunities.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => loadKeywordIntoDeepDive(item.keyword)}
                      className="w-full text-left bg-slate-800 hover:bg-slate-700/80 rounded-lg px-4 py-3 flex items-center justify-between transition-colors hover:ring-1 hover:ring-yellow-500/30"
                    >
                      <div className="flex items-center gap-3">
                        <span>{item.emoji}</span>
                        <div>
                          <p className="text-sm text-gray-200 font-medium">{item.niche}</p>
                          <p className="text-xs text-slate-500">
                            {item.productType.charAt(0).toUpperCase() + item.productType.slice(1)} -- {item.keyword}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-yellow-400 font-bold">{item.score}</span>
                        <span className="block text-xs text-green-500">↗ Rising</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
