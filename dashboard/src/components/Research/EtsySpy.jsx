import { useState, useEffect, useCallback, useRef, useMemo } from "react";

const API = "";

/* ──────────────────────────── Constants ──────────────────────────── */

const NICHES = [
  {
    name: "Wedding Planning",
    emoji: "💍",
    queries: [
      "wedding budget spreadsheet",
      "wedding planner template",
      "wedding checklist printable",
      "bridal shower games",
      "wedding timeline template",
      "seating chart template",
    ],
  },
  {
    name: "Startup Kits",
    emoji: "🚀",
    queries: [
      "business plan template",
      "startup budget spreadsheet",
      "pitch deck template",
      "business tracker spreadsheet",
      "invoice template digital",
      "startup checklist",
    ],
  },
  {
    name: "Resume & Career",
    emoji: "📄",
    queries: [
      "resume template",
      "cover letter template",
      "CV template modern",
      "job tracker spreadsheet",
      "interview prep guide",
      "LinkedIn optimization guide",
    ],
  },
  {
    name: "Personal Finance",
    emoji: "💰",
    queries: [
      "budget spreadsheet",
      "expense tracker template",
      "debt payoff planner",
      "savings tracker",
      "investment tracker spreadsheet",
      "net worth calculator",
    ],
  },
  {
    name: "Meal Planning",
    emoji: "🥗",
    queries: [
      "meal planner template",
      "grocery list template",
      "recipe book template",
      "meal prep guide",
      "calorie tracker spreadsheet",
      "weekly meal plan printable",
    ],
  },
  {
    name: "Fitness & Workout",
    emoji: "💪",
    queries: [
      "workout planner template",
      "fitness tracker spreadsheet",
      "exercise log printable",
      "gym workout plan",
      "30 day challenge template",
      "body measurement tracker",
    ],
  },
  {
    name: "Home Organization",
    emoji: "🏡",
    queries: [
      "cleaning schedule template",
      "home inventory spreadsheet",
      "declutter checklist",
      "moving checklist template",
      "home maintenance planner",
      "pantry organization labels",
    ],
  },
  {
    name: "Parenting & Baby",
    emoji: "👶",
    queries: [
      "baby tracker template",
      "pregnancy planner",
      "baby milestone tracker",
      "chore chart printable",
      "homeschool planner template",
      "baby budget spreadsheet",
    ],
  },
  {
    name: "Event Planning",
    emoji: "🎉",
    queries: [
      "event planning template",
      "party checklist printable",
      "event budget spreadsheet",
      "guest list template",
      "birthday party planner",
      "event timeline template",
    ],
  },
  {
    name: "Social Media",
    emoji: "📱",
    queries: [
      "social media planner",
      "content calendar template",
      "instagram post template",
      "social media tracker",
      "hashtag guide",
      "social media audit template",
    ],
  },
  {
    name: "Pet Care",
    emoji: "🐾",
    queries: [
      "pet health tracker",
      "dog training log",
      "pet budget spreadsheet",
      "vet visit tracker",
      "pet feeding schedule",
      "pet emergency card printable",
    ],
  },
  {
    name: "Real Estate",
    emoji: "🏠",
    queries: [
      "property analysis spreadsheet",
      "rental income tracker",
      "house hunting checklist",
      "real estate budget template",
      "mortgage calculator spreadsheet",
      "home inspection checklist",
    ],
  },
];

const ALL_QUERIES = NICHES.flatMap((n) =>
  n.queries.map((q) => ({ query: q, niche: n.name }))
);

const PRODUCT_TYPES = [
  { label: "Spreadsheet", color: "bg-blue-600/80 text-blue-100", keywords: ["spreadsheet", "excel", "google sheets", "xlsx", "calculator"] },
  { label: "Template", color: "bg-purple-600/80 text-purple-100", keywords: ["template"] },
  { label: "Planner", color: "bg-green-600/80 text-green-100", keywords: ["planner", "planning"] },
  { label: "Printable", color: "bg-pink-600/80 text-pink-100", keywords: ["printable", "print"] },
  { label: "Guide/Ebook", color: "bg-orange-600/80 text-orange-100", keywords: ["guide", "ebook", "e-book", "book", "handbook"] },
  { label: "Checklist", color: "bg-teal-600/80 text-teal-100", keywords: ["checklist", "check list"] },
  { label: "Tracker", color: "bg-cyan-600/80 text-cyan-100", keywords: ["tracker", "tracking", "log"] },
  { label: "Bundle", color: "bg-amber-600/80 text-amber-100", keywords: ["bundle", "pack", "kit", "set of"] },
];

function classifyProduct(title) {
  const t = (title || "").toLowerCase();
  for (const pt of PRODUCT_TYPES) {
    if (pt.keywords.some((kw) => t.includes(kw))) return pt;
  }
  return { label: "Other", color: "bg-slate-600/80 text-gray-100" };
}

function competitionLevel(totalResults) {
  if (totalResults <= 20) return { label: "Low", color: "text-green-400", bg: "bg-green-500/20" };
  if (totalResults <= 60) return { label: "Medium", color: "text-yellow-400", bg: "bg-yellow-500/20" };
  return { label: "High", color: "text-red-400", bg: "bg-red-500/20" };
}

function renderStars(rating) {
  const r = parseFloat(rating) || 0;
  const full = Math.floor(r);
  const half = r - full >= 0.5;
  const stars = [];
  for (let i = 0; i < full; i++) stars.push("⭐");
  if (half) stars.push("⭐");
  return stars.join("");
}

function formatCurrency(n) {
  if (n >= 1000000) return "$" + (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return "$" + (n / 1000).toFixed(1) + "K";
  return "$" + n.toFixed(2);
}

/* ──────────────── Preferences helpers (localStorage) ──────────────── */

const PREF_KEY = "de_product_preferences";

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { liked: [], passed: [], searchHistory: [] };
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  } catch {}
}

function addSearchHistory(query, niche) {
  const prefs = loadPrefs();
  prefs.searchHistory = [
    { query, niche: niche || null, timestamp: Date.now() },
    ...prefs.searchHistory.filter((s) => s.query !== query),
  ].slice(0, 30);
  savePrefs(prefs);
}

function getRecentSearches() {
  return loadPrefs().searchHistory.slice(0, 10);
}

/* ──────────────────────── Sub-components ──────────────────────── */

function Spinner({ className = "h-4 w-4" }) {
  return (
    <svg className={`animate-spin ${className} text-white`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function ErrorMsg({ message, onDismiss }) {
  useEffect(() => {
    if (message) {
      const t = setTimeout(onDismiss, 6000);
      return () => clearTimeout(t);
    }
  }, [message, onDismiss]);
  if (!message) return null;
  return (
    <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-400 flex items-center justify-between">
      <span>{message}</span>
      <button onClick={onDismiss} className="text-red-400 hover:text-red-300 ml-3 text-lg">&times;</button>
    </div>
  );
}

function SectionHeader({ children, count, extra }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        {children}
        {count != null && (
          <span className="text-xs font-normal bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </h2>
      {extra}
    </div>
  );
}

/* ═══════════════════════════ MAIN COMPONENT ═══════════════════════════ */

export default function EtsySpy() {
  /* ──── Search state ──── */
  const [query, setQuery] = useState("");
  const [pages, setPages] = useState(3);
  const [searching, setSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState({ page: 0, total: 0 });
  const [results, setResults] = useState([]);
  const [resultsMeta, setResultsMeta] = useState({ query: "", timestamp: null });
  const [sortBy, setSortBy] = useState("reviews");
  const [filterText, setFilterText] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [minReviews, setMinReviews] = useState(0);
  const [error, setError] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [recentSearches, setRecentSearches] = useState(getRecentSearches());
  const [activeNiche, setActiveNiche] = useState(null);
  const searchRef = useRef(null);

  /* ──── Niche research state ──── */
  const [researchedNiches, setResearchedNiches] = useState(() => {
    try {
      const raw = localStorage.getItem("de_researched_niches");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [bulkResearching, setBulkResearching] = useState(null);

  /* ──── Shop spy state ──── */
  const [shopUrl, setShopUrl] = useState("");
  const [spying, setSpying] = useState(false);
  const [shopData, setShopData] = useState(null);
  const [shopTab, setShopTab] = useState("bestsellers");
  const [shopNotes, setShopNotes] = useState("");

  /* ──── Bookmarks state ──── */
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState("");
  const [expandedBookmark, setExpandedBookmark] = useState(null);
  const [editingNotes, setEditingNotes] = useState({});

  /* ──── Preferences state ──── */
  const [preferences, setPreferences] = useState(loadPrefs());

  /* ──── Niche grid state ──── */
  const [nicheGridCollapsed, setNicheGridCollapsed] = useState(false);

  /* ──── Load data on mount ──── */
  useEffect(() => {
    fetchBookmarks();
    fetchResults();
  }, []);

  /* ──── Click outside autocomplete ──── */
  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowAutocomplete(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ──── Save researched niches ──── */
  useEffect(() => {
    try {
      localStorage.setItem("de_researched_niches", JSON.stringify(researchedNiches));
    } catch {}
  }, [researchedNiches]);

  /* ──── API calls ──── */

  async function fetchBookmarks() {
    try {
      const res = await fetch(`${API}/api/etsy/bookmarks`);
      if (res.ok) {
        const data = await res.json();
        setBookmarks(Array.isArray(data) ? data : data.bookmarks || []);
      }
    } catch {}
  }

  async function fetchResults() {
    try {
      const res = await fetch(`${API}/api/etsy/results`);
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.results || [];
        if (items.length > 0) setResults(items);
      }
    } catch {}
  }

  async function handleSearch(searchQuery, niche) {
    const q = (searchQuery || query).trim();
    if (!q) return;
    setQuery(q);
    setActiveNiche(niche || null);
    setSearching(true);
    setError("");
    setSearchProgress({ page: 1, total: pages });

    addSearchHistory(q, niche);
    setRecentSearches(getRecentSearches());

    /* Simulate page-by-page progress */
    const progressInterval = setInterval(() => {
      setSearchProgress((prev) => {
        if (prev.page < pages) return { ...prev, page: prev.page + 1 };
        return prev;
      });
    }, 8000);

    try {
      const res = await fetch(`${API}/api/etsy/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, pages }),
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.results || data.products || [];
      setResults(items);
      setResultsMeta({ query: q, timestamp: Date.now() });

      /* Mark niche as researched */
      if (niche) {
        setResearchedNiches((prev) => ({
          ...prev,
          [niche]: { ...prev[niche], [q]: true },
        }));
      }
    } catch (err) {
      setError(err.message || "Search failed. Is the backend running?");
    } finally {
      clearInterval(progressInterval);
      setSearching(false);
      setSearchProgress({ page: 0, total: 0 });
    }
  }

  async function handleResearchAll(niche) {
    setBulkResearching(niche.name);
    setError("");
    for (const q of niche.queries) {
      try {
        setQuery(q);
        setSearchProgress({ page: 1, total: pages });
        const res = await fetch(`${API}/api/etsy/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q, pages: 1 }),
        });
        if (res.ok) {
          addSearchHistory(q, niche.name);
          setResearchedNiches((prev) => ({
            ...prev,
            [niche.name]: { ...prev[niche.name], [q]: true },
          }));
        }
      } catch {}
    }
    setRecentSearches(getRecentSearches());
    setBulkResearching(null);
    setSearchProgress({ page: 0, total: 0 });
    /* Load the final results */
    await fetchResults();
    setResultsMeta({ query: `${niche.name} (all queries)`, timestamp: Date.now() });
  }

  async function handleSpyShop() {
    if (!shopUrl.trim()) return;
    setSpying(true);
    setError("");
    setShopTab("bestsellers");
    try {
      const res = await fetch(`${API}/api/etsy/shop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: shopUrl.trim() }),
      });
      if (!res.ok) throw new Error("Shop spy failed");
      const data = await res.json();
      setShopData(data);
      setShopNotes("");
    } catch (err) {
      setError(err.message || "Failed to spy on shop");
    } finally {
      setSpying(false);
    }
  }

  async function handleBookmarkShop() {
    if (!shopData) return;
    setBookmarkLoading("add");
    try {
      const payload = {
        shopId: shopData.id || shopData.shop_id || shopData.name || Date.now().toString(),
        shopName: shopData.name || shopData.shop_name || "Unknown",
        shopUrl: shopUrl.trim(),
        totalSales: shopData.total_sales || 0,
        notes: shopNotes,
      };
      const res = await fetch(`${API}/api/etsy/bookmark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Bookmark failed");
      await fetchBookmarks();
    } catch (err) {
      setError(err.message);
    } finally {
      setBookmarkLoading("");
    }
  }

  async function handleRemoveBookmark(id) {
    setBookmarkLoading(id);
    try {
      await fetch(`${API}/api/etsy/bookmark/${id}`, { method: "DELETE" });
      await fetchBookmarks();
    } catch (err) {
      setError(err.message);
    } finally {
      setBookmarkLoading("");
    }
  }

  async function handleRescanBookmark(bookmark) {
    const bmId = bookmark.id || bookmark._id || bookmark.shopId;
    setBookmarkLoading(bmId);
    try {
      const res = await fetch(`${API}/api/etsy/shop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: bookmark.url || bookmark.shop_url || bookmark.shopUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        setShopData(data);
      }
      await fetchBookmarks();
    } catch (err) {
      setError(err.message);
    } finally {
      setBookmarkLoading("");
    }
  }

  async function handleUpdateBookmarkNotes(bmId, notes) {
    try {
      await fetch(`${API}/api/etsy/bookmark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: bmId, notes }),
      });
      await fetchBookmarks();
    } catch {}
  }

  const clearError = useCallback(() => setError(""), []);

  /* ──── Preference actions ──── */

  function handleLike(product, niche) {
    const prefs = loadPrefs();
    const id = product.id || product.listing_id || `${product.title}-${product.price}`;
    prefs.passed = prefs.passed.filter((p) => p.id !== id);
    const existing = prefs.liked.find((p) => p.id === id);
    if (!existing) {
      prefs.liked.unshift({
        id,
        title: product.title,
        price: parseFloat(product.price) || 0,
        type: classifyProduct(product.title).label,
        niche: niche || activeNiche || null,
        timestamp: Date.now(),
      });
    }
    savePrefs(prefs);
    setPreferences({ ...prefs });
  }

  function handlePass(product, niche) {
    const prefs = loadPrefs();
    const id = product.id || product.listing_id || `${product.title}-${product.price}`;
    prefs.liked = prefs.liked.filter((p) => p.id !== id);
    const existing = prefs.passed.find((p) => p.id === id);
    if (!existing) {
      prefs.passed.unshift({
        id,
        title: product.title,
        price: parseFloat(product.price) || 0,
        type: classifyProduct(product.title).label,
        niche: niche || activeNiche || null,
        timestamp: Date.now(),
      });
    }
    savePrefs(prefs);
    setPreferences({ ...prefs });
  }

  function getProductPref(product) {
    const id = product.id || product.listing_id || `${product.title}-${product.price}`;
    if (preferences.liked.some((p) => p.id === id)) return "liked";
    if (preferences.passed.some((p) => p.id === id)) return "passed";
    return null;
  }

  /* ──── Autocomplete ──── */

  const autocompleteSuggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return ALL_QUERIES.filter((item) => item.query.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  /* ──── Display results with sorting & filtering ──── */

  const displayResults = useMemo(() => {
    return results
      .filter((r) => {
        const title = (r.title || "").toLowerCase();
        const shop = (r.shop_name || r.shopName || "").toLowerCase();
        const price = parseFloat(r.price) || 0;
        const reviews = r.reviews || r.num_reviews || 0;

        if (filterText && !title.includes(filterText.toLowerCase()) && !shop.includes(filterText.toLowerCase())) {
          return false;
        }
        if (filterType !== "All" && classifyProduct(r.title).label !== filterType) return false;
        if (price < priceRange[0] || price > priceRange[1]) return false;
        if (reviews < minReviews) return false;
        return true;
      })
      .sort((a, b) => {
        const priceA = parseFloat(a.price) || 0;
        const priceB = parseFloat(b.price) || 0;
        const revA = a.reviews || a.num_reviews || 0;
        const revB = b.reviews || b.num_reviews || 0;
        switch (sortBy) {
          case "reviews":
            return revB - revA;
          case "revenue":
            return revB * 5 * priceB - revA * 5 * priceA;
          case "price_high":
            return priceB - priceA;
          case "price_low":
            return priceA - priceB;
          default:
            return 0;
        }
      });
  }, [results, filterText, filterType, priceRange, minReviews, sortBy]);

  /* ──── Shop analysis ──── */

  const shopAnalysis = useMemo(() => {
    if (!shopData?.products?.length) return null;
    const types = {};
    let totalPrice = 0;
    shopData.products.forEach((p) => {
      const t = classifyProduct(p.title).label;
      types[t] = (types[t] || 0) + 1;
      totalPrice += parseFloat(p.price) || 0;
    });
    const avgPrice = totalPrice / shopData.products.length;
    const bestsellers = [...shopData.products].sort((a, b) => (b.reviews || 0) - (a.reviews || 0)).slice(0, 10);
    const newArrivals = [...shopData.products].slice(-10).reverse();
    const estRevenue = (shopData.total_sales || 0) * avgPrice;
    return { types, avgPrice, bestsellers, newArrivals, estRevenue, totalProducts: shopData.products.length };
  }, [shopData]);

  /* ──── Niche research status ──── */

  function nicheResearchCount(nicheName) {
    const data = researchedNiches[nicheName];
    if (!data) return 0;
    return Object.keys(data).length;
  }

  /* ═══════════════════════════ RENDER ═══════════════════════════ */

  return (
    <div className="space-y-6">
      <ErrorMsg message={error} onDismiss={clearError} />

      {/* ════════════ SECTION 1: Niche Quick Research ════════════ */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader>
            <span className="text-xl">🔍</span> Niche Quick Research
          </SectionHeader>
          <button
            onClick={() => setNicheGridCollapsed(!nicheGridCollapsed)}
            className="text-xs text-slate-500 hover:text-slate-200 transition-colors"
          >
            {nicheGridCollapsed ? "Show niches" : "Hide niches"}
          </button>
        </div>

        {!nicheGridCollapsed && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {NICHES.map((niche) => {
              const researched = nicheResearchCount(niche.name);
              const total = niche.queries.length;
              const isFullyResearched = researched >= total;
              const isBulkRunning = bulkResearching === niche.name;

              return (
                <div
                  key={niche.name}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/50 transition-all"
                >
                  {/* Niche header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isFullyResearched
                            ? "bg-green-400"
                            : researched > 0
                            ? "bg-yellow-400"
                            : "bg-slate-600"
                        }`}
                      />
                      <span className="text-base">{niche.emoji}</span>
                      <span className="text-sm font-semibold text-gray-200">{niche.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {researched}/{total}
                    </span>
                  </div>

                  {/* Query chips */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {niche.queries.map((q) => {
                      const isResearched = researchedNiches[niche.name]?.[q];
                      return (
                        <button
                          key={q}
                          onClick={() => handleSearch(q, niche.name)}
                          disabled={searching || isBulkRunning}
                          className={`px-3 py-1 rounded-full text-xs cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                            isResearched
                              ? "bg-green-900/40 text-green-300 border border-green-700/50 hover:bg-green-800/60"
                              : "bg-slate-700/60 hover:bg-indigo-600 text-gray-300 hover:text-white"
                          }`}
                          title={q}
                        >
                          {q.length > 28 ? q.slice(0, 26) + "..." : q}
                        </button>
                      );
                    })}
                  </div>

                  {/* Research All button */}
                  <button
                    onClick={() => handleResearchAll(niche)}
                    disabled={searching || isBulkRunning}
                    className="w-full text-center bg-slate-700/50 hover:bg-indigo-600/60 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 hover:text-white text-xs py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    {isBulkRunning ? (
                      <>
                        <Spinner className="h-3 w-3" /> Researching...
                      </>
                    ) : (
                      <>
                        <span>📊</span> Research All
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ════════════ SECTION 2: Search Etsy ════════════ */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
        <SectionHeader>
          <span className="text-xl">🔎</span> Search Etsy
        </SectionHeader>

        <div className="relative" ref={searchRef}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowAutocomplete(true);
                }}
                onFocus={() => setShowAutocomplete(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setShowAutocomplete(false);
                    handleSearch();
                  }
                  if (e.key === "Escape") setShowAutocomplete(false);
                }}
                placeholder="Search Etsy for digital products..."
                className="w-full bg-slate-800/80 border border-slate-600/50 rounded-lg px-4 py-3 text-gray-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-base"
              />

              {/* Autocomplete dropdown */}
              {showAutocomplete && (autocompleteSuggestions.length > 0 || (!query.trim() && recentSearches.length > 0)) && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-slate-800/80 border border-slate-600/50 rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
                  {!query.trim() && recentSearches.length > 0 && (
                    <>
                      <div className="px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-700/50">
                        Recent Searches
                      </div>
                      {recentSearches.map((s, i) => (
                        <button
                          key={`recent-${i}`}
                          onClick={() => {
                            setShowAutocomplete(false);
                            handleSearch(s.query, s.niche);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-slate-700/70 hover:text-white flex items-center justify-between transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-slate-600">🕒</span>
                            {s.query}
                          </span>
                          {s.niche && (
                            <span className="text-[10px] text-slate-600">{s.niche}</span>
                          )}
                        </button>
                      ))}
                    </>
                  )}
                  {query.trim() && autocompleteSuggestions.length > 0 && (
                    <>
                      <div className="px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-700/50">
                        Suggestions
                      </div>
                      {autocompleteSuggestions.map((s, i) => (
                        <button
                          key={`auto-${i}`}
                          onClick={() => {
                            setShowAutocomplete(false);
                            handleSearch(s.query, s.niche);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-slate-700/70 hover:text-white flex items-center justify-between transition-colors"
                        >
                          <span>{s.query}</span>
                          <span className="text-[10px] text-slate-600">{s.niche}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 whitespace-nowrap">Pages:</label>
              <select
                value={pages}
                onChange={(e) => setPages(parseInt(e.target.value))}
                className="bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-3 text-gray-100 focus:border-indigo-500 focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setShowAutocomplete(false);
                handleSearch();
              }}
              disabled={searching || !query.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              {searching ? <Spinner /> : <span>🔍</span>}
              {searching ? "Searching..." : "Search Etsy"}
            </button>
          </div>

          {/* Search progress */}
          {searching && (
            <div className="mt-3 bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-2">
                  <Spinner className="h-3 w-3" />
                  Scraping page {searchProgress.page} of {searchProgress.total}...
                </span>
                <span>~{(searchProgress.total - searchProgress.page) * 8 + 5}s remaining</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div
                  className="bg-indigo-500 h-1.5 rounded-full transition-all duration-700"
                  style={{
                    width: `${searchProgress.total > 0 ? (searchProgress.page / searchProgress.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Recent searches chips */}
        {!searching && recentSearches.length > 0 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-slate-600 uppercase tracking-wider">Recent:</span>
            {recentSearches.slice(0, 6).map((s, i) => (
              <button
                key={i}
                onClick={() => handleSearch(s.query, s.niche)}
                className="bg-slate-800/50 hover:bg-slate-700/70 text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-full text-[11px] transition-colors"
              >
                {s.query}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ════════════ SECTION 3: Results ════════════ */}
      {results.length > 0 && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
          {/* Results header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>📦</span> Results
                <span className="text-xs font-normal bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full">
                  {displayResults.length} of {results.length}
                </span>
              </h2>
              {resultsMeta.timestamp && (
                <p className="text-[11px] text-slate-600 mt-1">
                  "{resultsMeta.query}" &mdash; scraped {new Date(resultsMeta.timestamp).toLocaleString()}
                </p>
              )}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="reviews">Best Sellers (Reviews)</option>
                <option value="revenue">Highest Revenue</option>
                <option value="price_high">Highest Price</option>
                <option value="price_low">Best Price</option>
              </select>
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex flex-col md:flex-row gap-3 mb-5 p-4 bg-slate-800/40 rounded-xl border border-slate-700/40">
            <div className="flex-1">
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter by title or shop..."
                className="w-full bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Types</option>
              {PRODUCT_TYPES.map((pt) => (
                <option key={pt.label} value={pt.label}>
                  {pt.label}
                </option>
              ))}
              <option value="Other">Other</option>
            </select>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 whitespace-nowrap">Min reviews:</label>
              <input
                type="number"
                min={0}
                value={minReviews}
                onChange={(e) => setMinReviews(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-20 bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-gray-100 text-center focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 whitespace-nowrap">Price:</label>
              <input
                type="number"
                min={0}
                value={priceRange[0]}
                onChange={(e) => setPriceRange([Math.max(0, parseInt(e.target.value) || 0), priceRange[1]])}
                className="w-16 bg-slate-800/80 border border-slate-600/50 rounded-lg px-2 py-2 text-sm text-gray-100 text-center focus:border-indigo-500 focus:outline-none"
                placeholder="Min"
              />
              <span className="text-slate-600">-</span>
              <input
                type="number"
                min={0}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Math.max(0, parseInt(e.target.value) || 0)])}
                className="w-16 bg-slate-800/80 border border-slate-600/50 rounded-lg px-2 py-2 text-sm text-gray-100 text-center focus:border-indigo-500 focus:outline-none"
                placeholder="Max"
              />
            </div>
          </div>

          {/* Product grid */}
          {displayResults.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              No results match the current filters. Try adjusting your filters above.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayResults.map((product, idx) => {
                const price = parseFloat(product.price) || 0;
                const reviews = product.reviews || product.num_reviews || 0;
                const title = product.title || "Untitled";
                const shop = product.shop_name || product.shopName || "Unknown Shop";
                const url = product.url || product.listing_url || "#";
                const shopLink = product.shop_url || product.shopUrl || null;
                const rating = product.rating || product.star_rating || 5;
                const productType = classifyProduct(title);
                const estMonthlySales = reviews * 5;
                const estMonthlyRevenue = estMonthlySales * price;
                const competition = competitionLevel(results.length);
                const pref = getProductPref(product);

                return (
                  <div
                    key={product.id || product.listing_id || idx}
                    className={`bg-slate-800 border rounded-xl p-5 transition-all hover:shadow-lg hover:shadow-black/20 ${
                      pref === "liked"
                        ? "border-green-700/60 bg-green-900/10"
                        : pref === "passed"
                        ? "border-red-700/30 bg-red-900/5 opacity-60"
                        : "border-slate-700/50 hover:border-slate-600/50"
                    }`}
                  >
                    {/* Product type tag + competition */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`${productType.color} px-2.5 py-0.5 rounded-full text-[10px] font-semibold`}>
                        {productType.label}
                      </span>
                      <span
                        className={`${competition.bg} ${competition.color} px-2 py-0.5 rounded-full text-[10px] font-medium`}
                      >
                        {competition.label} competition
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-medium text-gray-200 mb-3 leading-snug" title={title}>
                      {title}
                    </h3>

                    {/* Price + Reviews */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-green-400">${price.toFixed(2)}</span>
                      <div className="text-right">
                        <div className="text-xs text-yellow-400">{renderStars(rating)}</div>
                        <span className="text-xs text-slate-400">{reviews.toLocaleString()} reviews</span>
                      </div>
                    </div>

                    {/* Shop name */}
                    <div className="mb-3">
                      {shopLink ? (
                        <button
                          onClick={() => {
                            setShopUrl(shopLink);
                            handleSpyShop();
                          }}
                          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          by {shop} →
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">by {shop}</span>
                      )}
                    </div>

                    {/* Revenue estimates */}
                    <div className="bg-gray-900/60 rounded-lg p-3 mb-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">Est. monthly sales</span>
                        <span className="text-xs font-semibold text-gray-300">
                          {estMonthlySales.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">Est. monthly revenue</span>
                        <span className="text-xs font-semibold text-green-400">
                          {formatCurrency(estMonthlyRevenue)}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-600 pt-0.5">Based on reviews x 5 estimate</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center bg-slate-700/60 hover:bg-slate-700/70 text-gray-300 hover:text-white py-2 rounded-lg text-xs font-medium transition-colors"
                      >
                        View on Etsy
                      </a>
                      <button
                        onClick={() => handleLike(product)}
                        className={`px-3 py-2 rounded-lg text-xs transition-colors ${
                          pref === "liked"
                            ? "bg-green-600 text-white"
                            : "bg-slate-700/60 hover:bg-green-600/60 text-slate-400 hover:text-white"
                        }`}
                        title="Like (save to Brain)"
                      >
                        👍
                      </button>
                      <button
                        onClick={() => handlePass(product)}
                        className={`px-3 py-2 rounded-lg text-xs transition-colors ${
                          pref === "passed"
                            ? "bg-red-600 text-white"
                            : "bg-slate-700/60 hover:bg-red-600/60 text-slate-400 hover:text-white"
                        }`}
                        title="Pass (not interested)"
                      >
                        👎
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════ SECTION 4: Shop Spy ════════════ */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
        <SectionHeader>
          <span className="text-xl">🕵️</span> Shop Spy
        </SectionHeader>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            value={shopUrl}
            onChange={(e) => setShopUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSpyShop()}
            placeholder="Enter Etsy shop URL (e.g. https://www.etsy.com/shop/ShopName)..."
            className="flex-1 bg-slate-800/80 border border-slate-600/50 rounded-lg px-4 py-3 text-gray-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
          <button
            onClick={handleSpyShop}
            disabled={spying || !shopUrl.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            {spying ? <Spinner /> : <span>🕵️</span>}
            {spying ? "Analyzing Shop..." : "Spy on Shop"}
          </button>
        </div>

        {/* Shop data display */}
        {shopData && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
            {/* Shop header */}
            <div className="p-6 border-b border-slate-700/40">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {shopData.name || shopData.shop_name || "Shop"}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    {shopData.total_sales != null && (
                      <span className="flex items-center gap-1.5 text-sm text-gray-300">
                        <span className="text-indigo-400 font-semibold">
                          {shopData.total_sales.toLocaleString()}
                        </span>{" "}
                        total sales
                      </span>
                    )}
                    {shopData.member_since && (
                      <span className="text-sm text-slate-500">
                        Member since {shopData.member_since}
                      </span>
                    )}
                    {shopData.rating != null && (
                      <span className="text-sm text-yellow-400">
                        {renderStars(shopData.rating)} {shopData.rating}
                      </span>
                    )}
                    {shopAnalysis && (
                      <span className="text-sm text-slate-400">
                        {shopAnalysis.totalProducts} listings
                      </span>
                    )}
                  </div>

                  {/* Revenue estimate */}
                  {shopAnalysis && (
                    <div className="mt-3 flex items-center gap-4">
                      <div className="bg-green-900/30 border border-green-700/30 rounded-lg px-3 py-1.5">
                        <span className="text-[10px] text-green-500 block">Est. Lifetime Revenue</span>
                        <span className="text-lg font-bold text-green-400">
                          {formatCurrency(shopAnalysis.estRevenue)}
                        </span>
                      </div>
                      <div className="bg-slate-700/40 rounded-lg px-3 py-1.5">
                        <span className="text-[10px] text-slate-500 block">Avg. Price</span>
                        <span className="text-lg font-semibold text-gray-300">
                          ${shopAnalysis.avgPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bookmark shop */}
                <div className="flex flex-col gap-2">
                  <textarea
                    value={shopNotes}
                    onChange={(e) => setShopNotes(e.target.value)}
                    placeholder="Notes about this shop..."
                    rows={2}
                    className="bg-gray-900 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-gray-300 placeholder-slate-600 focus:border-indigo-500 focus:outline-none resize-none w-56"
                  />
                  <button
                    onClick={handleBookmarkShop}
                    disabled={bookmarkLoading === "add"}
                    className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {bookmarkLoading === "add" ? <Spinner /> : <span>⭐</span>}
                    Bookmark Shop
                  </button>
                </div>
              </div>
            </div>

            {/* Shop tabs */}
            {shopAnalysis && (
              <>
                <div className="flex border-b border-slate-700/40">
                  {[
                    { id: "bestsellers", label: "Bestsellers", icon: "🏆" },
                    { id: "new", label: "New Arrivals", icon: "✨" },
                    { id: "analyze", label: "Analyze", icon: "📊" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setShopTab(tab.id)}
                      className={`px-5 py-3 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        shopTab === tab.id
                          ? "text-indigo-400 border-b-2 border-indigo-400 bg-slate-800/40"
                          : "text-slate-500 hover:text-slate-200"
                      }`}
                    >
                      <span>{tab.icon}</span> {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-5 max-h-96 overflow-y-auto">
                  {/* Bestsellers tab */}
                  {shopTab === "bestsellers" && (
                    <div className="space-y-2">
                      {shopAnalysis.bestsellers.map((p, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-700/70/30 transition-colors border-b border-slate-700/50/30 last:border-0"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-xs font-bold text-slate-600 w-6">#{i + 1}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-gray-300 truncate">{p.title || "Untitled"}</p>
                              <span
                                className={`${classifyProduct(p.title).color} px-1.5 py-0 rounded text-[9px] font-medium`}
                              >
                                {classifyProduct(p.title).label}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <span className="text-green-400 text-sm font-semibold">
                              ${parseFloat(p.price || 0).toFixed(2)}
                            </span>
                            <span className="text-xs text-slate-500 w-24 text-right">
                              {(p.reviews || 0).toLocaleString()} reviews
                            </span>
                            <span className="text-xs text-slate-600">
                              ~{((p.reviews || 0) * 5).toLocaleString()} sales/mo
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New Arrivals tab */}
                  {shopTab === "new" && (
                    <div className="space-y-2">
                      {shopAnalysis.newArrivals.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">No product data available</p>
                      ) : (
                        shopAnalysis.newArrivals.map((p, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-700/70/30 transition-colors border-b border-slate-700/50/30 last:border-0"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-gray-300 truncate">{p.title || "Untitled"}</p>
                                <span
                                  className={`${classifyProduct(p.title).color} px-1.5 py-0 rounded text-[9px] font-medium`}
                                >
                                  {classifyProduct(p.title).label}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                              <span className="text-green-400 text-sm font-semibold">
                                ${parseFloat(p.price || 0).toFixed(2)}
                              </span>
                              <span className="text-xs text-slate-500">
                                {(p.reviews || 0).toLocaleString()} reviews
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Analyze tab */}
                  {shopTab === "analyze" && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-300">Product Type Breakdown</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(shopAnalysis.types)
                          .sort(([, a], [, b]) => b - a)
                          .map(([type, count]) => {
                            const pt = PRODUCT_TYPES.find((p) => p.label === type) || {
                              color: "bg-slate-600/80 text-gray-100",
                            };
                            const pct = ((count / shopAnalysis.totalProducts) * 100).toFixed(0);
                            return (
                              <div
                                key={type}
                                className="bg-gray-900/60 border border-slate-700/40 rounded-lg p-3 text-center"
                              >
                                <span className={`${pt.color} px-2 py-0.5 rounded text-[10px] font-semibold`}>
                                  {type}
                                </span>
                                <p className="text-2xl font-bold text-gray-200 mt-2">{count}</p>
                                <p className="text-[10px] text-slate-500">{pct}% of listings</p>
                              </div>
                            );
                          })}
                      </div>

                      <div className="bg-gray-900/40 rounded-lg p-4 mt-4">
                        <h4 className="text-sm font-semibold text-gray-300 mb-3">Distribution</h4>
                        <div className="flex h-6 rounded-full overflow-hidden">
                          {Object.entries(shopAnalysis.types)
                            .sort(([, a], [, b]) => b - a)
                            .map(([type, count]) => {
                              const pct = (count / shopAnalysis.totalProducts) * 100;
                              const colors = {
                                Spreadsheet: "bg-blue-500",
                                Template: "bg-purple-500",
                                Planner: "bg-green-500",
                                Printable: "bg-pink-500",
                                "Guide/Ebook": "bg-orange-500",
                                Checklist: "bg-teal-500",
                                Tracker: "bg-cyan-500",
                                Bundle: "bg-amber-500",
                                Other: "bg-slate-500",
                              };
                              return (
                                <div
                                  key={type}
                                  className={`${colors[type] || "bg-slate-500"} relative group`}
                                  style={{ width: `${pct}%` }}
                                  title={`${type}: ${count} (${pct.toFixed(0)}%)`}
                                >
                                  <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-900 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10">
                                    {type}: {count}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-3">
                          {Object.entries(shopAnalysis.types)
                            .sort(([, a], [, b]) => b - a)
                            .map(([type]) => {
                              const colors = {
                                Spreadsheet: "bg-blue-500",
                                Template: "bg-purple-500",
                                Planner: "bg-green-500",
                                Printable: "bg-pink-500",
                                "Guide/Ebook": "bg-orange-500",
                                Checklist: "bg-teal-500",
                                Tracker: "bg-cyan-500",
                                Bundle: "bg-amber-500",
                                Other: "bg-slate-500",
                              };
                              return (
                                <div key={type} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                  <div className={`w-2.5 h-2.5 rounded-sm ${colors[type] || "bg-slate-500"}`} />
                                  {type}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ════════════ SECTION 5: Bookmarked Shops ════════════ */}
      <div className="bg-gray-900 rounded-2xl border border-slate-700/40 overflow-hidden">
        <button
          onClick={() => setBookmarksOpen(!bookmarksOpen)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
        >
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>⭐</span> Bookmarked Shops
            <span className="text-xs font-normal bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
              {bookmarks.length}
            </span>
          </h2>
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform ${bookmarksOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {bookmarksOpen && (
          <div className="px-6 pb-5 space-y-3">
            {bookmarks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-600 text-sm">No bookmarked shops yet.</p>
                <p className="text-slate-700 text-xs mt-1">Use the Shop Spy above to find and bookmark shops.</p>
              </div>
            ) : (
              bookmarks.map((bm) => {
                const bmId = bm.id || bm._id || bm.shopId;
                const isExpanded = expandedBookmark === bmId;
                const shopName = bm.name || bm.shop_name || bm.shopName || "Shop";
                const totalSales = bm.total_sales || bm.totalSales || 0;
                const notes = editingNotes[bmId] !== undefined ? editingNotes[bmId] : bm.notes || "";

                return (
                  <div
                    key={bmId}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden"
                  >
                    {/* Bookmark header */}
                    <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold text-white">{shopName}</p>
                          <span className="text-xs bg-slate-700/60 text-slate-400 px-2 py-0.5 rounded-full">
                            {totalSales.toLocaleString()} sales
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          {bm.rating != null && (
                            <span className="text-yellow-400">{renderStars(bm.rating)}</span>
                          )}
                          {bm.last_scanned && (
                            <span>Scanned {new Date(bm.last_scanned).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedBookmark(isExpanded ? null : bmId)}
                          className="bg-slate-700/60 hover:bg-slate-700/70 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        >
                          {isExpanded ? "Collapse" : "View Details"}
                        </button>
                        <button
                          onClick={() => handleRescanBookmark(bm)}
                          disabled={bookmarkLoading === bmId}
                          className="bg-indigo-600/60 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                        >
                          {bookmarkLoading === bmId ? <Spinner className="h-3 w-3" /> : null}
                          Re-scan
                        </button>
                        <button
                          onClick={() => handleRemoveBookmark(bmId)}
                          disabled={bookmarkLoading === bmId}
                          className="bg-red-600/40 hover:bg-red-500 disabled:opacity-50 text-red-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="border-t border-slate-700/40 p-4 space-y-3">
                        {/* Notes editor */}
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                            Notes
                          </label>
                          <div className="flex gap-2">
                            <textarea
                              value={notes}
                              onChange={(e) =>
                                setEditingNotes({ ...editingNotes, [bmId]: e.target.value })
                              }
                              placeholder="Add notes about this shop..."
                              rows={2}
                              className="flex-1 bg-gray-900 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-gray-300 placeholder-slate-600 focus:border-indigo-500 focus:outline-none resize-none"
                            />
                            {editingNotes[bmId] !== undefined && editingNotes[bmId] !== (bm.notes || "") && (
                              <button
                                onClick={() => {
                                  handleUpdateBookmarkNotes(bmId, editingNotes[bmId]);
                                  setEditingNotes((prev) => {
                                    const n = { ...prev };
                                    delete n[bmId];
                                    return n;
                                  });
                                }}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 rounded-lg text-xs self-end transition-colors"
                              >
                                Save
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Shop URL */}
                        <div className="text-xs text-slate-600">
                          <span className="text-slate-500">URL: </span>
                          <a
                            href={bm.url || bm.shop_url || bm.shopUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300"
                          >
                            {bm.url || bm.shop_url || bm.shopUrl || "N/A"}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ════════════ Preferences summary (bottom) ════════════ */}
      {(preferences.liked.length > 0 || preferences.passed.length > 0) && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
          <SectionHeader
            extra={
              <button
                onClick={() => {
                  savePrefs({ liked: [], passed: [], searchHistory: preferences.searchHistory });
                  setPreferences(loadPrefs());
                }}
                className="text-xs text-slate-600 hover:text-red-400 transition-colors"
              >
                Clear preferences
              </button>
            }
          >
            <span className="text-xl">🧠</span> Brain Preferences
          </SectionHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Liked */}
            <div className="bg-green-900/10 border border-green-800/30 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-1.5">
                👍 Liked ({preferences.liked.length})
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {preferences.liked.slice(0, 20).map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 truncate flex-1 mr-2">{p.title}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-green-400">${p.price?.toFixed(2)}</span>
                      <span className="text-slate-600">{p.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Passed */}
            <div className="bg-red-900/10 border border-red-800/30 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-1.5">
                👎 Passed ({preferences.passed.length})
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {preferences.passed.slice(0, 20).map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 truncate flex-1 mr-2">{p.title}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-slate-500">${p.price?.toFixed(2)}</span>
                      <span className="text-slate-600">{p.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
