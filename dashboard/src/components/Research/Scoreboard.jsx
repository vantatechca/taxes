import { useState, useEffect, useCallback, useMemo } from "react";

const API = "";

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

function ScoreBar({ score }) {
  const color =
    score > 70 ? "bg-green-500" : score > 40 ? "bg-yellow-500" : "bg-red-500";
  const textColor =
    score > 70 ? "text-green-400" : score > 40 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 bg-slate-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
      <span className={`text-sm font-bold ${textColor} w-8`}>{score}</span>
    </div>
  );
}

function ScoreTooltip({ breakdown }) {
  if (!breakdown) return null;
  const items = [
    { label: "Trends", value: breakdown.trends },
    { label: "Etsy", value: breakdown.etsy },
    { label: "Evergreen", value: breakdown.evergreen },
    { label: "Price", value: breakdown.price },
    { label: "Resale", value: breakdown.resale },
  ].filter((item) => item.value != null);

  if (items.length === 0) return null;

  return (
    <div className="absolute z-10 bottom-full left-0 mb-2 bg-slate-800/80 border border-slate-600/50 rounded-lg p-3 shadow-xl min-w-48 pointer-events-none">
      <p className="text-xs font-semibold text-gray-300 mb-2">Score Breakdown</p>
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between py-0.5">
          <span className="text-xs text-slate-400">{item.label}</span>
          <span className="text-xs font-medium text-white">{item.value}%</span>
        </div>
      ))}
    </div>
  );
}

const SOURCE_BADGES = {
  Etsy: "bg-orange-900/50 text-orange-400 border-orange-700",
  PLR: "bg-purple-900/50 text-purple-400 border-purple-700",
  Trend: "bg-blue-900/50 text-blue-400 border-blue-700",
};

export default function Scoreboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rescoring, setRescoring] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [minScore, setMinScore] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("score");
  const [hoveredRow, setHoveredRow] = useState(null);

  const clearError = useCallback(() => setError(""), []);

  useEffect(() => {
    fetchScoreboard();
  }, []);

  async function fetchScoreboard() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/scoreboard/top`);
      if (!res.ok) throw new Error("Failed to load scoreboard");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : data.items || data.products || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRescore() {
    setRescoring(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/scoreboard/rescore`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Rescore failed");
      await fetchScoreboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setRescoring(false);
    }
  }

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set();
    items.forEach((item) => {
      if (item.category || item.niche) cats.add(item.category || item.niche);
    });
    return [...cats].sort();
  }, [items]);

  // Filter and sort
  const displayItems = useMemo(() => {
    let filtered = items.filter((item) => {
      const score = item.score || 0;
      if (score < minScore) return false;
      if (categoryFilter !== "all" && (item.category || item.niche) !== categoryFilter) return false;
      if (sourceFilter !== "all" && item.source !== sourceFilter) return false;
      return true;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "score":
          return (b.score || 0) - (a.score || 0);
        case "price":
          return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
        case "reviews":
          return (b.reviews || 0) - (a.reviews || 0);
        case "trend":
          return (b.trend_score || 0) - (a.trend_score || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [items, minScore, categoryFilter, sourceFilter, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
        <span className="ml-2 text-slate-400">Loading scoreboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ErrorMsg message={error} onDismiss={clearError} />

      {/* Header with rescore */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">{"🏆"} Product Leaderboard</h2>
            <p className="text-sm text-slate-500 mt-1">
              Top products ranked by composite score
            </p>
          </div>
          <button
            onClick={handleRescore}
            disabled={rescoring}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            {rescoring ? (
              <>
                <Spinner />
                Rescoring...
              </>
            ) : (
              "Rescore All"
            )}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-700/40">
          {/* Min score slider */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 whitespace-nowrap">Min Score:</label>
            <input
              type="range"
              min={0}
              max={100}
              value={minScore}
              onChange={(e) => setMinScore(parseInt(e.target.value))}
              className="w-24 accent-indigo-500"
            />
            <span className="text-xs text-gray-300 w-6">{minScore}</span>
          </div>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Source filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Sources</option>
            <option value="Etsy">Etsy</option>
            <option value="PLR">PLR</option>
            <option value="Trend">Trend</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="score">Score</option>
            <option value="price">Price</option>
            <option value="reviews">Reviews</option>
            <option value="trend">Trend</option>
          </select>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
        {displayItems.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">
            No products match your filters. Try lowering the minimum score.
          </p>
        ) : (
          <div className="space-y-2">
            {displayItems.map((item, idx) => {
              const rank = idx + 1;
              const score = item.score || 0;
              const source = item.source || "Etsy";
              const sourceCls = SOURCE_BADGES[source] || SOURCE_BADGES.Etsy;
              const category = item.category || item.niche || "";

              // Medal for top 3
              const medal =
                rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

              return (
                <div
                  key={item.id || item._id || idx}
                  className="relative flex items-center gap-4 bg-slate-800/80 border border-slate-600/50 rounded-xl px-4 py-3 hover:border-slate-600 transition-colors"
                  onMouseEnter={() => setHoveredRow(idx)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {/* Rank */}
                  <div className="w-10 text-center shrink-0">
                    {medal ? (
                      <span className="text-xl">{medal}</span>
                    ) : (
                      <span className="text-sm font-bold text-slate-500">#{rank}</span>
                    )}
                  </div>

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {item.name || item.title || "Untitled"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {category && (
                        <span className="text-xs bg-slate-700 text-gray-300 px-2 py-0.5 rounded">
                          {category}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${sourceCls}`}>
                        {source}
                      </span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="relative shrink-0">
                    <ScoreBar score={score} />
                    {hoveredRow === idx && item.breakdown && (
                      <ScoreTooltip breakdown={item.breakdown} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
