import { useState, useEffect, useCallback, useRef, useMemo } from "react";

const API = "";

/* ─── Constants ─── */

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

const CITIES = [
  "Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa", "Winnipeg",
  "Quebec City", "Hamilton", "Kitchener", "London", "Victoria", "Halifax", "Oshawa",
  "Windsor", "Saskatoon", "Regina", "Barrie", "St. John's", "Kelowna",
  "Abbotsford", "Sherbrooke", "Kingston", "Trois-Rivieres", "Guelph",
  "Moncton", "Brantford", "Thunder Bay", "Saint John", "Peterborough",
  "Nanaimo", "Lethbridge", "Kamloops", "Red Deer", "Prince George",
  "Medicine Hat", "Drummondville", "Granby", "Fredericton", "North Bay",
  "Cornwall", "Chilliwack", "Chatham-Kent", "Brandon", "Belleville",
  "Sarnia", "Fort McMurray", "Sault Ste. Marie", "Courtenay", "Timmins",
];

const TABS = [
  { id: "validator", label: "Niche Validator", icon: "🎯" },
  { id: "domains", label: "Domain Scanner", icon: "🌐" },
  { id: "keywords", label: "Keyword Lab", icon: "🔍" },
  { id: "blog", label: "Blog Planner", icon: "📝" },
  { id: "gmb", label: "GMB Advisor", icon: "🏪" },
  { id: "reports", label: "Saved Reports", icon: "📊" },
];

const SCORE_COMPONENTS = [
  { key: "domainAvailability", label: "Domain Availability", weight: 20 },
  { key: "keywordVolume", label: "Keyword Volume", weight: 20 },
  { key: "googleAdsViability", label: "Google Ads Viability", weight: 15 },
  { key: "trendStrength", label: "Trend Strength", weight: 15 },
  { key: "etsyValidation", label: "Etsy Validation", weight: 10 },
  { key: "blogOpportunity", label: "Blog Opportunity", weight: 10 },
  { key: "nicheScalability", label: "Niche Scalability", weight: 10 },
];

const LAUNCH_STEPS = [
  { step: 1, label: "Buy exact-match domain", icon: "🌐", days: "Day 1", budget: "$10-15" },
  { step: 2, label: "Set up Google Merchant Center", icon: "🛒", days: "Day 1-2", budget: "Free" },
  { step: 3, label: "Launch Google Ads ($10-15/day)", icon: "📢", days: "Day 2-22", budget: "$210-315" },
  { step: 4, label: "Publish 2 AI blog posts/week", icon: "📝", days: "Ongoing", budget: "$0-20/mo" },
  { step: 5, label: "Set up GMB + get 15-20 reviews", icon: "🏪", days: "Week 1-3", budget: "Free" },
];

const CONTENT_TYPES = ["how-to", "listicle", "comparison", "guide"];

const GMB_DATA = {
  wedding: {
    categories: [
      { name: "Wedding Planner", relevance: "Primary", why: "Direct match for wedding planning templates and digital downloads." },
      { name: "Gift Shop", relevance: "Secondary", why: "Wedding printables and planners sell as gifts for brides." },
      { name: "Event Planner", relevance: "Secondary", why: "Captures broader event planning search traffic." },
    ],
    reviewTips: [
      "Offer a free wedding checklist printable in exchange for honest reviews",
      "Follow up with buyers 7 days after purchase with a personalized review request",
      "Create a simple QR code linking to your GMB review page for wedding fairs",
    ],
  },
  startup: {
    categories: [
      { name: "Business Consultant", relevance: "Primary", why: "Ideal for business plan templates and startup kits." },
      { name: "Office Supply Store", relevance: "Secondary", why: "Business templates are office productivity tools." },
      { name: "Financial Planner", relevance: "Secondary", why: "Budget and financial templates attract finance-adjacent traffic." },
    ],
    reviewTips: [
      "Include a startup success checklist bonus for reviewers",
      "Reach out to local entrepreneur meetup groups for initial reviews",
      "Add a review request card inside the digital product delivery email",
    ],
  },
  resume: {
    categories: [
      { name: "Career Counselor", relevance: "Primary", why: "Resume templates align perfectly with career counseling intent." },
      { name: "Employment Agency", relevance: "Secondary", why: "Job seekers searching for employment help find resume tools." },
      { name: "Printing Service", relevance: "Secondary", why: "Many job seekers look for places to print their resumes." },
    ],
    reviewTips: [
      "Offer a free cover letter template as a review incentive",
      "Partner with local job fairs to collect early reviews",
      "Follow up after 30 days when users have had interview results",
    ],
  },
  finance: {
    categories: [
      { name: "Financial Planner", relevance: "Primary", why: "Budget spreadsheets match financial planning searches." },
      { name: "Accountant", relevance: "Secondary", why: "Tax and expense trackers attract accountant-adjacent searches." },
      { name: "Bookkeeper", relevance: "Secondary", why: "Small business financial templates overlap with bookkeeping." },
    ],
    reviewTips: [
      "Offer a free debt payoff calculator as a review bonus",
      "Target New Year resolution seekers for financial product reviews",
      "Include a savings milestone tracker that prompts reviews at goals",
    ],
  },
  meal: {
    categories: [
      { name: "Nutritionist", relevance: "Primary", why: "Meal planning templates align with nutrition search intent." },
      { name: "Health Food Store", relevance: "Secondary", why: "Grocery and meal prep tools complement health food searches." },
      { name: "Personal Chef", relevance: "Secondary", why: "Meal planning overlaps with personal cooking service searches." },
    ],
    reviewTips: [
      "Include a free grocery list template for reviewers",
      "Ask for reviews after users complete their first week of meal planning",
      "Partner with local fitness influencers for initial review seeding",
    ],
  },
  fitness: {
    categories: [
      { name: "Personal Trainer", relevance: "Primary", why: "Workout planners match personal training search intent." },
      { name: "Gym", relevance: "Secondary", why: "Fitness trackers and planners attract gym-goer traffic." },
      { name: "Sports Club", relevance: "Secondary", why: "Broader fitness and athletic audience coverage." },
    ],
    reviewTips: [
      "Offer a 30-day challenge printable as a review incentive",
      "Time review requests for after users hit their first fitness milestone",
      "Cross-promote with local gym bulletin boards for initial reviews",
    ],
  },
  home: {
    categories: [
      { name: "Home Organizer", relevance: "Primary", why: "Perfect match for home organization printables and checklists." },
      { name: "Interior Designer", relevance: "Secondary", why: "Organization templates complement interior design searches." },
      { name: "Cleaning Service", relevance: "Secondary", why: "Cleaning checklists and schedules attract cleaning service traffic." },
    ],
    reviewTips: [
      "Offer a free decluttering checklist for honest reviews",
      "Target spring cleaning season for maximum review collection",
      "Create a before/after challenge that naturally leads to review requests",
    ],
  },
  parenting: {
    categories: [
      { name: "Baby Store", relevance: "Primary", why: "Baby trackers and parenting templates match baby store searches." },
      { name: "Child Care Service", relevance: "Secondary", why: "Parenting resources overlap with child care search intent." },
      { name: "Family Counselor", relevance: "Secondary", why: "Family planning templates attract counseling-adjacent traffic." },
    ],
    reviewTips: [
      "Include a free milestone tracker printable for baby's first year",
      "Ask for reviews after parents have used the tracker for 2 weeks",
      "Partner with local mommy groups and parenting forums for initial reviews",
    ],
  },
  events: {
    categories: [
      { name: "Event Planner", relevance: "Primary", why: "Direct match for event planning templates and checklists." },
      { name: "Party Supply Store", relevance: "Secondary", why: "Event printables complement party supply shopping." },
      { name: "Venue", relevance: "Secondary", why: "Event planners searching for venues also need planning tools." },
    ],
    reviewTips: [
      "Offer a free party checklist for event hosts who leave reviews",
      "Follow up after the event date for experience-based reviews",
      "Target holiday party season for maximum review collection",
    ],
  },
  social: {
    categories: [
      { name: "Marketing Consultant", relevance: "Primary", why: "Social media planners align with marketing consultant searches." },
      { name: "Advertising Agency", relevance: "Secondary", why: "Content calendars attract advertising professionals." },
      { name: "Graphic Designer", relevance: "Secondary", why: "Social media templates overlap with design service searches." },
    ],
    reviewTips: [
      "Offer a free hashtag guide as a review incentive",
      "Ask for reviews after users see their first month of analytics improvement",
      "Cross-promote in local business networking groups for initial reviews",
    ],
  },
  pet: {
    categories: [
      { name: "Pet Store", relevance: "Primary", why: "Pet trackers and care guides match pet store search intent." },
      { name: "Veterinarian", relevance: "Secondary", why: "Pet health trackers attract vet-adjacent searches." },
      { name: "Dog Trainer", relevance: "Secondary", why: "Pet care printables complement training service searches." },
    ],
    reviewTips: [
      "Include a free pet health log template for reviewers",
      "Time review requests for after pet owners complete their first month of tracking",
      "Partner with local pet shelters for adoption kit reviews",
    ],
  },
  realestate: {
    categories: [
      { name: "Real Estate Agent", relevance: "Primary", why: "Real estate spreadsheets match agent and buyer search intent." },
      { name: "Mortgage Broker", relevance: "Secondary", why: "Property comparison tools attract mortgage-related traffic." },
      { name: "Property Management", relevance: "Secondary", why: "Rental trackers overlap with property management searches." },
    ],
    reviewTips: [
      "Offer a free home inspection checklist for reviewers",
      "Target spring home buying season for maximum review volume",
      "Partner with local real estate networking events for initial reviews",
    ],
  },
};

const LS_CACHE_KEY = "de_marketing_cache";
const LS_DATAFORSEO_KEY = "de_dataforseo_key";

/* ─── Helper Components ─── */

function Spinner({ size = "h-4 w-4" }) {
  return (
    <svg className={`animate-spin ${size} text-white`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function ErrorMsg({ message, onRetry, onDismiss }) {
  if (!message) return null;
  return (
    <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-400 flex items-center justify-between">
      <span>{message}</span>
      <div className="flex items-center gap-2 ml-3">
        {onRetry && (
          <button onClick={onRetry} className="bg-red-800/50 hover:bg-red-700/50 text-red-300 px-3 py-1 rounded text-xs">
            Retry
          </button>
        )}
        {onDismiss && (
          <button onClick={onDismiss} className="text-red-400 hover:text-red-300">&times;</button>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ value, max = 100, color = "bg-indigo-500", height = "h-2" }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={`w-full bg-gray-100 dark:bg-slate-700/50 rounded-full ${height} overflow-hidden`}>
      <div className={`${color} ${height} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function VerdictBadge({ score }) {
  if (score >= 85) return <span className="px-3 py-1 rounded-full text-sm font-bold bg-green-900/60 text-green-300 border border-green-600">🟢 LAUNCH</span>;
  if (score >= 70) return <span className="px-3 py-1 rounded-full text-sm font-bold bg-yellow-900/60 text-yellow-300 border border-yellow-600">🟡 TEST</span>;
  if (score >= 50) return <span className="px-3 py-1 rounded-full text-sm font-bold bg-orange-900/60 text-orange-300 border border-orange-600">🟠 RISKY</span>;
  return <span className="px-3 py-1 rounded-full text-sm font-bold bg-red-900/60 text-red-300 border border-red-600">🔴 SKIP</span>;
}

function scoreColor(score) {
  if (score >= 85) return "bg-green-500";
  if (score >= 70) return "bg-yellow-500";
  if (score >= 50) return "bg-orange-500";
  return "bg-red-500";
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function getCache(key) {
  try {
    const raw = localStorage.getItem(LS_CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    const entry = cache[key];
    if (!entry) return null;
    if (Date.now() - entry.ts > 3600000) { // 1 hour TTL
      delete cache[key];
      localStorage.setItem(LS_CACHE_KEY, JSON.stringify(cache));
      return null;
    }
    return entry.data;
  } catch { return null; }
}

function setCache(key, data) {
  try {
    const raw = localStorage.getItem(LS_CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    cache[key] = { data, ts: Date.now() };
    localStorage.setItem(LS_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

async function apiFetch(path, options = {}) {
  const resp = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!resp.ok) {
    const errBody = await resp.text().catch(() => "");
    throw new Error(errBody || `API error ${resp.status}`);
  }
  return resp.json();
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
}


/* ═══════════════════════════════════════════════════════════════════
   TAB 1 — NICHE VALIDATOR
   ═══════════════════════════════════════════════════════════════════ */

function NicheValidator({ sharedKeyword, setSharedKeyword, sharedNiche, setSharedNiche, setActiveTab }) {
  const [keyword, setKeyword] = useState(sharedKeyword || "");
  const [niche, setNiche] = useState(sharedNiche || "wedding");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (sharedKeyword && sharedKeyword !== keyword) setKeyword(sharedKeyword);
  }, [sharedKeyword]);

  const validate = useCallback(async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setSaved(false);

    const cacheKey = `validate_${keyword.trim()}_${niche}`;
    const cached = getCache(cacheKey);
    if (cached) {
      setResult(cached);
      setSharedKeyword(keyword.trim());
      setSharedNiche(niche);
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch("/api/marketing/score", {
        method: "POST",
        body: JSON.stringify({ keyword: keyword.trim(), niche }),
      });
      setResult(data);
      setCache(cacheKey, data);
      setSharedKeyword(keyword.trim());
      setSharedNiche(niche);
    } catch (err) {
      setError(err.message || "Failed to validate niche");
    } finally {
      setLoading(false);
    }
  }, [keyword, niche, setSharedKeyword, setSharedNiche]);

  const saveReport = useCallback(async () => {
    if (!result) return;
    setSaving(true);
    try {
      await apiFetch("/api/marketing/reports", {
        method: "POST",
        body: JSON.stringify({ niche, keyword: keyword.trim(), data: result }),
      });
      setSaved(true);
    } catch (err) {
      setError("Failed to save report: " + err.message);
    } finally {
      setSaving(false);
    }
  }, [result, niche, keyword]);

  const goToDomains = () => {
    setSharedKeyword(keyword.trim());
    setActiveTab("domains");
  };

  const goToBlog = () => {
    setSharedKeyword(keyword.trim());
    setSharedNiche(niche);
    setActiveTab("blog");
  };

  const overallScore = result?.score ?? 0;
  const components = result?.components || {};
  const summary = result?.summary || {};

  return (
    <div className="space-y-6">
      {/* Input Bar */}
      <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <span>🎯</span> Niche Validator
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Enter a product keyword and select a niche to get a comprehensive marketing viability score.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && validate()}
            placeholder="e.g. wedding budget spreadsheet"
            className="flex-1 bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600/50 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500 placeholder-gray-400 dark:placeholder-slate-500"
          />
          <select
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            className="bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600/50 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500"
          >
            {NICHES.map((n) => (
              <option key={n.id} value={n.id}>{n.emoji} {n.name}</option>
            ))}
          </select>
          <button
            onClick={validate}
            disabled={loading || !keyword.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-gray-900 dark:text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 whitespace-nowrap"
          >
            {loading ? <><Spinner /> Validating...</> : "Validate"}
          </button>
        </div>
      </div>

      <ErrorMsg message={error} onRetry={validate} onDismiss={() => setError("")} />

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Score Header */}
          <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-5xl font-black text-white">{overallScore}</div>
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">Marketing Score</div>
                  <VerdictBadge score={overallScore} />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={saveReport} disabled={saving || saved} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-gray-900 dark:text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  {saving ? <><Spinner /> Saving...</> : saved ? "✅ Saved" : "💾 Save Report"}
                </button>
                <button onClick={goToDomains} className="bg-slate-700 hover:bg-slate-600 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg text-sm">
                  🌐 Domain Scan
                </button>
                <button onClick={goToBlog} className="bg-slate-700 hover:bg-slate-600 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg text-sm">
                  📝 Blog Plan
                </button>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">Score Breakdown</h3>
            <div className="space-y-3">
              {SCORE_COMPONENTS.map((comp) => {
                const val = components[comp.key] ?? 0;
                return (
                  <div key={comp.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-300">{comp.label} ({comp.weight}%)</span>
                      <span className="text-sm font-medium text-white">{val}/100</span>
                    </div>
                    <ProgressBar value={val} color={scoreColor(val)} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-indigo-400">{summary.availableCities ?? "—"}/50</div>
              <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">Cities with .com available</div>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-400">${summary.estCPC ?? "—"}</div>
              <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">Estimated CPC</div>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{summary.monthlySearches ? summary.monthlySearches.toLocaleString() : "—"}</div>
              <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">Monthly Searches</div>
            </div>
          </div>

          {/* Launch Sequence */}
          <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              🚀 Launch Sequence
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              If profitable in test city, clone to all 50 cities. Estimated 3-week test budget: $220-$350.
            </p>
            <div className="space-y-3">
              {LAUNCH_STEPS.map((step) => (
                <div key={step.step} className="flex items-center gap-4 bg-slate-900/40 border border-slate-700/20 rounded-lg p-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-sm font-bold text-indigo-300">
                    {step.step}
                  </div>
                  <div className="text-lg">{step.icon}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{step.label}</div>
                    <div className="text-xs text-slate-500">{step.days}</div>
                  </div>
                  <div className="text-sm text-indigo-400 font-medium">{step.budget}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   TAB 2 — DOMAIN SCANNER
   ═══════════════════════════════════════════════════════════════════ */

function DomainScanner({ sharedKeyword, setSharedKeyword }) {
  const [keyword, setKeyword] = useState(sharedKeyword || "");
  const [tlds, setTlds] = useState({ com: true, ca: true, net: false, org: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState(0);
  const [sortBy, setSortBy] = useState("city");
  const [sortDir, setSortDir] = useState("asc");
  const abortRef = useRef(null);

  useEffect(() => {
    if (sharedKeyword && sharedKeyword !== keyword) setKeyword(sharedKeyword);
  }, [sharedKeyword]);

  const toggleTld = (tld) => setTlds((prev) => ({ ...prev, [tld]: !prev[tld] }));

  const selectedTlds = useMemo(() => Object.entries(tlds).filter(([, v]) => v).map(([k]) => `.${k}`), [tlds]);

  const scan = useCallback(async () => {
    if (!keyword.trim()) return;
    const slug = slugify(keyword.trim());
    if (!slug) return;
    setLoading(true);
    setError("");
    setResults(null);
    setProgress(0);

    const cacheKey = `domains_${slug}_${selectedTlds.join(",")}`;
    const cached = getCache(cacheKey);
    if (cached) {
      setResults(cached);
      setSharedKeyword(keyword.trim());
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch("/api/marketing/domains/scan", {
        method: "POST",
        body: JSON.stringify({ keyword: slug, tlds: selectedTlds }),
      });
      setResults(data);
      setCache(cacheKey, data);
      setSharedKeyword(keyword.trim());
      setProgress(100);
    } catch (err) {
      setError(err.message || "Domain scan failed");
    } finally {
      setLoading(false);
    }
  }, [keyword, selectedTlds, setSharedKeyword]);

  // Simulate progress while loading
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 2, 90));
    }, 200);
    return () => clearInterval(interval);
  }, [loading]);

  const sortedResults = useMemo(() => {
    if (!results?.domains) return [];
    const arr = [...results.domains];
    arr.sort((a, b) => {
      if (sortBy === "city") {
        const cmp = a.city.localeCompare(b.city);
        return sortDir === "asc" ? cmp : -cmp;
      }
      if (sortBy === "available") {
        const aCount = Object.values(a.tlds || {}).filter((v) => v === "available").length;
        const bCount = Object.values(b.tlds || {}).filter((v) => v === "available").length;
        return sortDir === "asc" ? aCount - bCount : bCount - aCount;
      }
      return 0;
    });
    return arr;
  }, [results, sortBy, sortDir]);

  const stats = useMemo(() => {
    if (!results?.domains) return { com: 0, ca: 0, total: 0 };
    let com = 0, ca = 0, total = 0;
    results.domains.forEach((d) => {
      const t = d.tlds || {};
      if (t[".com"] === "available") { com++; total++; }
      if (t[".ca"] === "available") { ca++; total++; }
      if (t[".net"] === "available") total++;
      if (t[".org"] === "available") total++;
    });
    return { com, ca, total };
  }, [results]);

  const exportCsv = () => {
    if (!sortedResults.length) return;
    const slug = slugify(keyword.trim());
    const header = ["City", ...selectedTlds.map((t) => `${slug}+city${t}`), "Status"];
    const rows = sortedResults.map((d) => {
      const citySlug = slugify(d.city);
      const tldVals = selectedTlds.map((t) => {
        const status = d.tlds?.[t];
        return `${slug}${citySlug}${t} (${status === "available" ? "Available" : "Taken"})`;
      });
      const anyAvail = selectedTlds.some((t) => d.tlds?.[t] === "available");
      return [d.city, ...tldVals, anyAvail ? "Available" : "Taken"];
    });
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    copyToClipboard(csv);
  };

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("asc"); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <span>🌐</span> Domain Scanner
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Check domain availability for your keyword across all 50 Canadian cities.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && scan()}
            placeholder="e.g. wedding budget"
            className="flex-1 bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600/50 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500 placeholder-gray-400 dark:placeholder-slate-500"
          />
          <button
            onClick={scan}
            disabled={loading || !keyword.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-gray-900 dark:text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 whitespace-nowrap"
          >
            {loading ? <><Spinner /> Scanning...</> : "Scan All 50 Cities"}
          </button>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm text-slate-400">TLDs:</span>
          {["com", "ca", "net", "org"].map((tld) => (
            <label key={tld} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={tlds[tld]}
                onChange={() => toggleTld(tld)}
                className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-300">.{tld}</span>
            </label>
          ))}
        </div>
      </div>

      <ErrorMsg message={error} onRetry={scan} onDismiss={() => setError("")} />

      {/* Progress */}
      {loading && (
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-300">Scanning domains...</span>
            <span className="text-sm text-indigo-400">{Math.round(progress)}%</span>
          </div>
          <ProgressBar value={progress} />
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-4">
          {/* Summary Bar */}
          <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <span className="text-green-400 font-medium">{stats.com} available .com</span>
                <span className="text-slate-600">|</span>
                <span className="text-green-400 font-medium">{stats.ca} available .ca</span>
                <span className="text-slate-600">|</span>
                <span className="text-indigo-400 font-medium">{stats.total} total available</span>
              </div>
              <button onClick={exportCsv} className="bg-slate-700 hover:bg-slate-600 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5">
                📋 Export CSV
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th
                      onClick={() => toggleSort("city")}
                      className="text-left px-4 py-3 text-gray-500 dark:text-slate-400 font-medium cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                    >
                      City {sortBy === "city" && (sortDir === "asc" ? "↑" : "↓")}
                    </th>
                    {selectedTlds.map((tld) => (
                      <th key={tld} className="text-center px-4 py-3 text-gray-500 dark:text-slate-400 font-medium">
                        {slugify(keyword.trim())}+city{tld}
                      </th>
                    ))}
                    <th
                      onClick={() => toggleSort("available")}
                      className="text-center px-4 py-3 text-gray-500 dark:text-slate-400 font-medium cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                    >
                      Status {sortBy === "available" && (sortDir === "asc" ? "↑" : "↓")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map((d) => {
                    const anyAvail = selectedTlds.some((t) => d.tlds?.[t] === "available");
                    return (
                      <tr key={d.city} className="border-b border-slate-800/50 hover:bg-gray-200 dark:hover:bg-slate-700/20">
                        <td className="px-4 py-2.5 text-gray-900 dark:text-white font-medium">{d.city}</td>
                        {selectedTlds.map((tld) => {
                          const status = d.tlds?.[tld];
                          const avail = status === "available";
                          return (
                            <td key={tld} className="px-4 py-2.5 text-center">
                              <span className={avail ? "text-green-400" : "text-red-400"}>
                                {avail ? "✅ Available" : "❌ Taken"}
                              </span>
                            </td>
                          );
                        })}
                        <td className="px-4 py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${anyAvail ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>
                            {anyAvail ? "Available" : "Taken"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   TAB 3 — KEYWORD LAB
   ═══════════════════════════════════════════════════════════════════ */

function KeywordLab({ sharedKeyword, setSharedKeyword, setActiveTab }) {
  const [keyword, setKeyword] = useState(sharedKeyword || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [autocomplete, setAutocomplete] = useState([]);
  const [paa, setPaa] = useState([]);
  const [related, setRelated] = useState([]);
  const [expandedPaa, setExpandedPaa] = useState({});

  const [acOpen, setAcOpen] = useState(true);
  const [paaOpen, setPaaOpen] = useState(true);
  const [relOpen, setRelOpen] = useState(true);

  // DataForSEO
  const [dfOpen, setDfOpen] = useState(false);
  const [dfKey, setDfKey] = useState(() => localStorage.getItem(LS_DATAFORSEO_KEY) || "");
  const [dfKeywords, setDfKeywords] = useState("");
  const [dfResults, setDfResults] = useState([]);
  const [dfLoading, setDfLoading] = useState(false);
  const [dfError, setDfError] = useState("");

  useEffect(() => {
    if (sharedKeyword && sharedKeyword !== keyword) setKeyword(sharedKeyword);
  }, [sharedKeyword]);

  const saveDfKey = (val) => {
    setDfKey(val);
    if (val) localStorage.setItem(LS_DATAFORSEO_KEY, val);
    else localStorage.removeItem(LS_DATAFORSEO_KEY);
  };

  const research = useCallback(async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setError("");
    setAutocomplete([]);
    setPaa([]);
    setRelated([]);

    const q = encodeURIComponent(keyword.trim());
    const cacheKey = `kw_${keyword.trim()}`;
    const cached = getCache(cacheKey);
    if (cached) {
      setAutocomplete(cached.autocomplete || []);
      setPaa(cached.paa || []);
      setRelated(cached.related || []);
      setSharedKeyword(keyword.trim());
      setLoading(false);
      return;
    }

    try {
      const [acRes, paaRes, relRes] = await Promise.allSettled([
        apiFetch(`/api/marketing/keywords/autocomplete?q=${q}&country=ca`),
        apiFetch(`/api/marketing/keywords/paa?q=${q}`),
        apiFetch(`/api/marketing/keywords/related?q=${q}`),
      ]);

      const ac = acRes.status === "fulfilled" ? (acRes.value.suggestions || []) : [];
      const pa = paaRes.status === "fulfilled" ? (paaRes.value.questions || []) : [];
      const rel = relRes.status === "fulfilled" ? (relRes.value.keywords || []) : [];

      setAutocomplete(ac);
      setPaa(pa);
      setRelated(rel);
      setSharedKeyword(keyword.trim());
      setCache(cacheKey, { autocomplete: ac, paa: pa, related: rel });
    } catch (err) {
      setError(err.message || "Keyword research failed");
    } finally {
      setLoading(false);
    }
  }, [keyword, setSharedKeyword]);

  const bulkResearch = useCallback(async () => {
    if (!dfKey || !dfKeywords.trim()) return;
    setDfLoading(true);
    setDfError("");
    try {
      const kws = dfKeywords.split("\n").map((k) => k.trim()).filter(Boolean);
      const data = await apiFetch("/api/marketing/keywords/volume", {
        method: "POST",
        body: JSON.stringify({ keywords: kws, apiKey: dfKey }),
      });
      setDfResults(data.results || []);
    } catch (err) {
      setDfError(err.message || "Bulk research failed");
    } finally {
      setDfLoading(false);
    }
  }, [dfKey, dfKeywords]);

  const deepDive = (kw) => {
    setKeyword(kw);
    setSharedKeyword(kw);
  };

  const goToDomains = (kw) => {
    setSharedKeyword(kw);
    setActiveTab("domains");
  };

  const volumeIndicator = (idx) => {
    if (idx < 3) return { label: "High", cls: "bg-green-900/40 text-green-400" };
    if (idx < 6) return { label: "Medium", cls: "bg-yellow-900/40 text-yellow-400" };
    return { label: "Low", cls: "bg-slate-700/40 text-slate-400" };
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <span>🔍</span> Keyword Lab
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Deep keyword research: autocomplete, People Also Ask, and related searches.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && research()}
            placeholder="e.g. budget planner template"
            className="flex-1 bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600/50 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500 placeholder-gray-400 dark:placeholder-slate-500"
          />
          <button
            onClick={research}
            disabled={loading || !keyword.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-gray-900 dark:text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            {loading ? <><Spinner /> Researching...</> : "Research"}
          </button>
        </div>
      </div>

      <ErrorMsg message={error} onRetry={research} onDismiss={() => setError("")} />

      {/* Autocomplete Suggestions */}
      {autocomplete.length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-6">
          <button onClick={() => setAcOpen(!acOpen)} className="w-full flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              ✨ Autocomplete Suggestions
              <span className="text-xs font-normal text-slate-500">({autocomplete.length})</span>
            </h3>
            <span className="text-slate-400">{acOpen ? "▼" : "▶"}</span>
          </button>
          {acOpen && (
            <div className="mt-4 flex flex-wrap gap-2">
              {autocomplete.map((s, i) => (
                <div key={i} className="flex items-center gap-1">
                  <button
                    onClick={() => deepDive(s)}
                    className="bg-slate-700/60 hover:bg-indigo-900/40 border border-slate-600/40 hover:border-indigo-500/30 text-gray-700 dark:text-slate-200 px-3 py-1.5 rounded-lg text-sm transition-colors"
                  >
                    {s}
                  </button>
                  <button
                    onClick={() => goToDomains(s)}
                    className="text-indigo-400 hover:text-indigo-300 text-xs px-1"
                    title="Domain Scan"
                  >
                    →🌐
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* People Also Ask */}
      {paa.length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-6">
          <button onClick={() => setPaaOpen(!paaOpen)} className="w-full flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              ❓ People Also Ask
              <span className="text-xs font-normal text-slate-500">({paa.length})</span>
            </h3>
            <span className="text-slate-400">{paaOpen ? "▼" : "▶"}</span>
          </button>
          {paaOpen && (
            <div className="mt-4 space-y-2">
              {paa.map((item, i) => {
                const vol = volumeIndicator(i);
                const question = typeof item === "string" ? item : item.question;
                const snippet = typeof item === "object" ? item.snippet : null;
                const isExpanded = expandedPaa[i];
                return (
                  <div key={i} className="border border-slate-700/30 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedPaa((prev) => ({ ...prev, [i]: !prev[i] }))}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-200 dark:hover:bg-slate-700/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-900 dark:text-white text-left">{question}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${vol.cls}`}>{vol.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); goToDomains(question); }}
                          className="text-indigo-400 hover:text-indigo-300 text-xs"
                          title="Domain Scan"
                        >
                          →🌐
                        </button>
                        <span className="text-slate-500">{isExpanded ? "▼" : "▶"}</span>
                      </div>
                    </button>
                    {isExpanded && snippet && (
                      <div className="px-4 py-3 bg-slate-900/30 border-t border-slate-700/30 text-sm text-slate-400">
                        {snippet}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Related Searches */}
      {related.length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-6">
          <button onClick={() => setRelOpen(!relOpen)} className="w-full flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              🔗 Related Searches
              <span className="text-xs font-normal text-slate-500">({related.length})</span>
            </h3>
            <span className="text-slate-400">{relOpen ? "▼" : "▶"}</span>
          </button>
          {relOpen && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {related.map((r, i) => (
                <div key={i} className="flex items-center gap-1">
                  <button
                    onClick={() => deepDive(r)}
                    className="flex-1 bg-slate-700/60 hover:bg-indigo-900/40 border border-slate-600/40 hover:border-indigo-500/30 text-gray-700 dark:text-slate-200 px-3 py-1.5 rounded-lg text-sm transition-colors text-left truncate"
                  >
                    {r}
                  </button>
                  <button
                    onClick={() => goToDomains(r)}
                    className="text-indigo-400 hover:text-indigo-300 text-xs px-1 shrink-0"
                    title="Domain Scan"
                  >
                    →🌐
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DataForSEO Panel */}
      <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-6">
        <button onClick={() => setDfOpen(!dfOpen)} className="w-full flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            📊 DataForSEO Panel
            <span className="text-xs font-normal text-slate-500">(Volume & CPC data)</span>
          </h3>
          <span className="text-slate-400">{dfOpen ? "▼" : "▶"}</span>
        </button>
        {dfOpen && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm text-gray-500 dark:text-slate-400 mb-1">API Key (saved locally)</label>
              <input
                type="password"
                value={dfKey}
                onChange={(e) => saveDfKey(e.target.value)}
                placeholder="Your DataForSEO API key"
                className="w-full bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600/50 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500 placeholder-gray-400 dark:placeholder-slate-500"
              />
            </div>
            {dfKey && (
              <>
                <div>
                  <label className="block text-sm text-gray-500 dark:text-slate-400 mb-1">Bulk Keywords (one per line)</label>
                  <textarea
                    value={dfKeywords}
                    onChange={(e) => setDfKeywords(e.target.value)}
                    rows={5}
                    placeholder={"wedding budget spreadsheet\nwedding planner template\nwedding checklist"}
                    className="w-full bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600/50 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500 placeholder-gray-400 dark:placeholder-slate-500 font-mono text-sm"
                  />
                </div>
                <button
                  onClick={bulkResearch}
                  disabled={dfLoading || !dfKeywords.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-gray-900 dark:text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                >
                  {dfLoading ? <><Spinner /> Fetching...</> : "Bulk Research"}
                </button>
                <ErrorMsg message={dfError} onDismiss={() => setDfError("")} />
                {dfResults.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700/50">
                          <th className="text-left px-3 py-2 text-slate-400">Keyword</th>
                          <th className="text-right px-3 py-2 text-slate-400">Volume</th>
                          <th className="text-right px-3 py-2 text-slate-400">CPC</th>
                          <th className="text-center px-3 py-2 text-slate-400">Competition</th>
                          <th className="text-center px-3 py-2 text-slate-400">Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dfResults.map((r, i) => (
                          <tr key={i} className="border-b border-slate-800/50 hover:bg-gray-200 dark:hover:bg-slate-700/20">
                            <td className="px-3 py-2 text-white">{r.keyword}</td>
                            <td className="px-3 py-2 text-right text-indigo-400">{r.volume?.toLocaleString() ?? "—"}</td>
                            <td className="px-3 py-2 text-right text-green-400">${r.cpc?.toFixed(2) ?? "—"}</td>
                            <td className="px-3 py-2 text-center">
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                r.competition === "Low" ? "bg-green-900/40 text-green-400" :
                                r.competition === "Medium" ? "bg-yellow-900/40 text-yellow-400" :
                                "bg-red-900/40 text-red-400"
                              }`}>{r.competition ?? "—"}</span>
                            </td>
                            <td className="px-3 py-2 text-center text-slate-300">{r.trend ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   TAB 4 — BLOG PLANNER
   ═══════════════════════════════════════════════════════════════════ */

function BlogPlanner({ sharedKeyword, sharedNiche, setSharedKeyword }) {
  const [keyword, setKeyword] = useState(sharedKeyword || "");
  const [niche, setNiche] = useState(sharedNiche || "wedding");
  const [product, setProduct] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [calendar, setCalendar] = useState([]);
  const [quickTopics, setQuickTopics] = useState([]);
  const [topicLoading, setTopicLoading] = useState(false);

  useEffect(() => {
    if (sharedKeyword && sharedKeyword !== keyword) setKeyword(sharedKeyword);
  }, [sharedKeyword]);

  useEffect(() => {
    if (sharedNiche && sharedNiche !== niche) setNiche(sharedNiche);
  }, [sharedNiche]);

  const generate = useCallback(async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setError("");
    setCalendar([]);

    const cacheKey = `blog_${keyword.trim()}_${niche}`;
    const cached = getCache(cacheKey);
    if (cached) {
      setCalendar(cached.calendar || []);
      setQuickTopics(cached.quickTopics || []);
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch("/api/marketing/keywords/blog-topics", {
        method: "POST",
        body: JSON.stringify({ keyword: keyword.trim(), niche }),
      });
      const cal = data.calendar || data.topics || [];
      const quick = data.quickTopics || data.paaTopics || [];
      setCalendar(cal);
      setQuickTopics(quick);
      setCache(cacheKey, { calendar: cal, quickTopics: quick });
    } catch (err) {
      setError(err.message || "Failed to generate content plan");
    } finally {
      setLoading(false);
    }
  }, [keyword, niche]);

  const loadQuickTopics = useCallback(async () => {
    if (!keyword.trim()) return;
    setTopicLoading(true);
    try {
      const q = encodeURIComponent(keyword.trim());
      const [acRes, paaRes] = await Promise.allSettled([
        apiFetch(`/api/marketing/keywords/autocomplete?q=${q}&country=ca`),
        apiFetch(`/api/marketing/keywords/paa?q=${q}`),
      ]);
      const ac = acRes.status === "fulfilled" ? (acRes.value.suggestions || []) : [];
      const pa = paaRes.status === "fulfilled" ? (paaRes.value.questions || []) : [];
      const questions = pa.map((p) => typeof p === "string" ? p : p.question);
      setQuickTopics([...questions, ...ac].slice(0, 20));
    } catch {}
    setTopicLoading(false);
  }, [keyword]);

  const addToCalendar = (topic) => {
    const week = Math.floor(calendar.length / 2) + 1;
    setCalendar((prev) => [
      ...prev,
      {
        week,
        title: topic,
        targetKeyword: keyword.trim(),
        type: CONTENT_TYPES[Math.floor(Math.random() * CONTENT_TYPES.length)],
        volume: "Medium",
        product: product || null,
      },
    ]);
  };

  const removeFromCalendar = (idx) => {
    setCalendar((prev) => prev.filter((_, i) => i !== idx));
  };

  const exportCalendar = () => {
    if (!calendar.length) return;
    const header = "Week | Title | Target Keyword | Type | Volume | Product";
    const divider = "---|---|---|---|---|---";
    const rows = calendar.map((c, i) =>
      `${c.week || Math.floor(i / 2) + 1} | ${c.title} | ${c.targetKeyword || keyword.trim()} | ${c.type || "guide"} | ${c.volume || "—"} | ${c.product || "—"}`
    );
    copyToClipboard([header, divider, ...rows].join("\n"));
  };

  const typeBadgeColor = (type) => {
    switch (type) {
      case "how-to": return "bg-blue-900/40 text-blue-400";
      case "listicle": return "bg-purple-900/40 text-purple-400";
      case "comparison": return "bg-amber-900/40 text-amber-400";
      case "guide": return "bg-green-900/40 text-green-400";
      default: return "bg-slate-700/40 text-slate-400";
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <span>📝</span> Blog Planner
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Generate a 12-week content calendar with 2 AI blog posts per week targeting high-volume questions.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate()}
            placeholder="e.g. wedding budget spreadsheet"
            className="flex-1 bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600/50 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500 placeholder-gray-400 dark:placeholder-slate-500"
          />
          <select
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            className="bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600/50 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500"
          >
            {NICHES.map((n) => (
              <option key={n.id} value={n.id}>{n.emoji} {n.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="Product name (optional, for mapping)"
            className="flex-1 bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600/50 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500 placeholder-gray-400 dark:placeholder-slate-500"
          />
          <button
            onClick={generate}
            disabled={loading || !keyword.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-gray-900 dark:text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 whitespace-nowrap"
          >
            {loading ? <><Spinner /> Generating...</> : "Generate Content Plan"}
          </button>
        </div>
      </div>

      <ErrorMsg message={error} onRetry={generate} onDismiss={() => setError("")} />

      {/* Content Calendar */}
      {calendar.length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              📅 Content Calendar
              <span className="text-xs font-normal text-slate-500">({calendar.length} posts)</span>
            </h3>
            <button
              onClick={exportCalendar}
              className="bg-slate-700 hover:bg-slate-600 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5"
            >
              📋 Export Calendar
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-3 py-2 text-gray-500 dark:text-slate-400 w-16">Week</th>
                  <th className="text-left px-3 py-2 text-slate-400">Blog Title</th>
                  <th className="text-left px-3 py-2 text-slate-400">Target Keyword</th>
                  <th className="text-center px-3 py-2 text-slate-400">Type</th>
                  <th className="text-center px-3 py-2 text-slate-400">Volume</th>
                  <th className="text-left px-3 py-2 text-slate-400">Product</th>
                  <th className="text-center px-3 py-2 text-gray-500 dark:text-slate-400 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {calendar.map((c, i) => (
                  <tr key={i} className="border-b border-slate-800/50 hover:bg-gray-200 dark:hover:bg-slate-700/20">
                    <td className="px-3 py-2.5 text-gray-500 dark:text-slate-400 font-mono text-xs">W{c.week || Math.floor(i / 2) + 1}</td>
                    <td className="px-3 py-2.5 text-white">{c.title}</td>
                    <td className="px-3 py-2.5 text-indigo-400 text-xs">{c.targetKeyword || keyword.trim()}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs ${typeBadgeColor(c.type)}`}>
                        {c.type || "guide"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-xs ${
                        c.volume === "High" ? "text-green-400" :
                        c.volume === "Medium" ? "text-yellow-400" : "text-slate-400"
                      }`}>{c.volume || "—"}</span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 dark:text-slate-300 text-xs">{c.product || "—"}</td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => removeFromCalendar(i)}
                        className="text-red-400 hover:text-red-300 text-xs"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Topic Ideas */}
      <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            💡 Quick Topic Ideas
          </h3>
          {quickTopics.length === 0 && (
            <button
              onClick={loadQuickTopics}
              disabled={topicLoading || !keyword.trim()}
              className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5"
            >
              {topicLoading ? <><Spinner /> Loading...</> : "Load Topics"}
            </button>
          )}
        </div>
        {quickTopics.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickTopics.map((t, i) => (
              <button
                key={i}
                onClick={() => addToCalendar(t)}
                className="text-left bg-slate-900/40 hover:bg-indigo-900/20 border border-slate-700/30 hover:border-indigo-500/30 rounded-lg px-3 py-2.5 text-sm text-gray-700 dark:text-slate-200 transition-colors group"
              >
                <span>{t}</span>
                <span className="text-xs text-indigo-400 opacity-0 group-hover:opacity-100 ml-2">+ Add to calendar</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Enter a keyword and click "Load Topics" to get question-based topic ideas from autocomplete and People Also Ask.</p>
        )}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   TAB 5 — GMB ADVISOR
   ═══════════════════════════════════════════════════════════════════ */

function GMBAdvisor({ sharedNiche }) {
  const [selectedNiche, setSelectedNiche] = useState(sharedNiche || "wedding");
  const [expandedNiches, setExpandedNiches] = useState({ [sharedNiche || "wedding"]: true });
  const [loading, setLoading] = useState(false);
  const [apiCategories, setApiCategories] = useState({});
  const [error, setError] = useState("");

  const toggleNiche = (id) => {
    setExpandedNiches((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchCategories = useCallback(async (nicheId) => {
    if (apiCategories[nicheId]) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/api/marketing/gmb/categories?niche=${nicheId}`);
      setApiCategories((prev) => ({ ...prev, [nicheId]: data.categories || [] }));
    } catch {
      // Fall back to local data
    } finally {
      setLoading(false);
    }
  }, [apiCategories]);

  const getCategories = (nicheId) => {
    return apiCategories[nicheId] || GMB_DATA[nicheId]?.categories || [];
  };

  const getReviewTips = (nicheId) => {
    return GMB_DATA[nicheId]?.reviewTips || [];
  };

  const checklist = [
    { label: "Create GMB profile with recommended primary category", icon: "📋" },
    { label: "Add business description mentioning target keywords", icon: "✏️" },
    { label: "Upload 5+ product photos (mockups, screenshots, lifestyle)", icon: "📸" },
    { label: "Get 15-20 five-star reviews from initial buyers", icon: "⭐" },
    { label: "Add all digital products as GMB products", icon: "🛍️" },
    { label: "Post weekly GMB updates (new products, tips, promotions)", icon: "📰" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <span>🏪</span> GMB Advisor
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Google My Business category recommendations, setup checklists, and review strategies for each niche.
        </p>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">Jump to niche:</span>
          <select
            value={selectedNiche}
            onChange={(e) => {
              setSelectedNiche(e.target.value);
              setExpandedNiches((prev) => ({ ...prev, [e.target.value]: true }));
            }}
            className="bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600/50 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500"
          >
            {NICHES.map((n) => (
              <option key={n.id} value={n.id}>{n.emoji} {n.name}</option>
            ))}
          </select>
        </div>
      </div>

      <ErrorMsg message={error} onDismiss={() => setError("")} />

      {/* Launch Checklist */}
      <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          ✅ GMB Launch Checklist
        </h3>
        <div className="space-y-2">
          {checklist.map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-slate-900/40 border border-slate-700/20 rounded-lg px-4 py-3">
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm text-slate-200">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* All Niches */}
      <div className="space-y-3">
        {NICHES.map((n) => {
          const isExpanded = expandedNiches[n.id];
          const cats = getCategories(n.id);
          const tips = getReviewTips(n.id);
          return (
            <div key={n.id} className="bg-slate-800/40 border border-slate-700/30 rounded-xl overflow-hidden">
              <button
                onClick={() => { toggleNiche(n.id); fetchCategories(n.id); }}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-200 dark:hover:bg-slate-700/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{n.emoji}</span>
                  <span className="text-white font-medium">{n.name}</span>
                  <span className="text-xs text-slate-500">{cats.length} categories</span>
                </div>
                <span className="text-slate-400">{isExpanded ? "▼" : "▶"}</span>
              </button>
              {isExpanded && (
                <div className="px-6 pb-6 space-y-4">
                  {/* Categories */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-slate-300 mb-3">Recommended Categories</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {cats.map((cat, i) => (
                        <div key={i} className="bg-slate-900/40 border border-slate-700/30 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-white">{cat.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              cat.relevance === "Primary" ? "bg-indigo-900/40 text-indigo-400 border border-indigo-500/30" : "bg-slate-700/40 text-gray-500 dark:text-slate-400 border border-slate-600/30"
                            }`}>{cat.relevance}</span>
                          </div>
                          <p className="text-xs text-slate-500">{cat.why}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Review Strategy */}
                  {tips.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 dark:text-slate-300 mb-3">Review Strategy</h4>
                      <div className="space-y-2">
                        {tips.map((tip, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-indigo-400 mt-0.5">•</span>
                            <span className="text-slate-400">{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   TAB 6 — SAVED REPORTS
   ═══════════════════════════════════════════════════════════════════ */

function SavedReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [sortBy, setSortBy] = useState("date");
  const [filterVerdict, setFilterVerdict] = useState("all");
  const [filterNiche, setFilterNiche] = useState("all");
  const [deleting, setDeleting] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/marketing/reports");
      setReports(data.reports || data || []);
    } catch (err) {
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const deleteReport = async (id) => {
    setDeleting(id);
    try {
      await apiFetch(`/api/marketing/reports/${id}`, { method: "DELETE" });
      setReports((prev) => prev.filter((r) => r.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      setError("Failed to delete: " + err.message);
    } finally {
      setDeleting(null);
    }
  };

  const getVerdict = (score) => {
    if (score >= 85) return { label: "LAUNCH", emoji: "🟢", cls: "bg-green-900/40 text-green-400" };
    if (score >= 70) return { label: "TEST", emoji: "🟡", cls: "bg-yellow-900/40 text-yellow-400" };
    if (score >= 50) return { label: "RISKY", emoji: "🟠", cls: "bg-orange-900/40 text-orange-400" };
    return { label: "SKIP", emoji: "🔴", cls: "bg-red-900/40 text-red-400" };
  };

  const filtered = useMemo(() => {
    let arr = [...reports];

    if (filterVerdict !== "all") {
      arr = arr.filter((r) => {
        const score = r.data?.score ?? r.score ?? 0;
        const v = getVerdict(score);
        return v.label === filterVerdict;
      });
    }

    if (filterNiche !== "all") {
      arr = arr.filter((r) => r.niche === filterNiche);
    }

    arr.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0);
      }
      if (sortBy === "score") {
        return (b.data?.score ?? b.score ?? 0) - (a.data?.score ?? a.score ?? 0);
      }
      if (sortBy === "niche") {
        return (a.niche || "").localeCompare(b.niche || "");
      }
      return 0;
    });

    return arr;
  }, [reports, filterVerdict, filterNiche, sortBy]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <span>📊</span> Saved Reports
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Previously saved marketing validation reports.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="date">Date</option>
              <option value="score">Score</option>
              <option value="niche">Niche</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Verdict:</span>
            <select
              value={filterVerdict}
              onChange={(e) => setFilterVerdict(e.target.value)}
              className="bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All</option>
              <option value="LAUNCH">🟢 LAUNCH</option>
              <option value="TEST">🟡 TEST</option>
              <option value="RISKY">🟠 RISKY</option>
              <option value="SKIP">🔴 SKIP</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Niche:</span>
            <select
              value={filterNiche}
              onChange={(e) => setFilterNiche(e.target.value)}
              className="bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Niches</option>
              {NICHES.map((n) => (
                <option key={n.id} value={n.id}>{n.emoji} {n.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchReports}
            disabled={loading}
            className="bg-slate-700 hover:bg-slate-600 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 ml-auto"
          >
            {loading ? <Spinner /> : "🔄"} Refresh
          </button>
        </div>
      </div>

      <ErrorMsg message={error} onRetry={fetchReports} onDismiss={() => setError("")} />

      {loading && !reports.length ? (
        <div className="flex items-center justify-center py-12 text-slate-500">
          <Spinner size="h-6 w-6" />
          <span className="ml-3">Loading reports...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-12 text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-slate-400">No saved reports yet. Use the Niche Validator to create your first report.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((report) => {
            const score = report.data?.score ?? report.score ?? 0;
            const verdict = getVerdict(score);
            const nicheObj = NICHES.find((n) => n.id === report.niche);
            const isExpanded = expandedId === report.id;
            const components = report.data?.components || {};
            const summary = report.data?.summary || {};

            return (
              <div key={report.id} className="bg-slate-800/40 border border-slate-700/30 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  className="w-full text-left px-5 py-4 hover:bg-gray-200 dark:hover:bg-slate-700/20 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{nicheObj?.emoji || "📦"}</span>
                      <span className="text-white font-medium">{report.keyword}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${verdict.cls}`}>
                        {verdict.emoji} {verdict.label}
                      </span>
                      <span className="text-slate-500">{isExpanded ? "▼" : "▶"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{nicheObj?.name || report.niche}</span>
                    <span>|</span>
                    <span>Score: {score}</span>
                    <span>|</span>
                    <span>{report.createdAt ? new Date(report.createdAt).toLocaleDateString() : report.date || "—"}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 space-y-4 border-t border-slate-700/30 pt-4">
                    {/* Score Breakdown */}
                    {Object.keys(components).length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-slate-300">Score Breakdown</h4>
                        {SCORE_COMPONENTS.map((comp) => {
                          const val = components[comp.key] ?? 0;
                          return (
                            <div key={comp.key}>
                              <div className="flex justify-between text-xs mb-0.5">
                                <span className="text-slate-400">{comp.label}</span>
                                <span className="text-slate-300">{val}/100</span>
                              </div>
                              <ProgressBar value={val} color={scoreColor(val)} height="h-1.5" />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Summary */}
                    {Object.keys(summary).length > 0 && (
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-900/40 rounded-lg p-2">
                          <div className="text-sm font-bold text-indigo-400">{summary.availableCities ?? "—"}/50</div>
                          <div className="text-xs text-slate-500">Cities</div>
                        </div>
                        <div className="bg-slate-900/40 rounded-lg p-2">
                          <div className="text-sm font-bold text-green-400">${summary.estCPC ?? "—"}</div>
                          <div className="text-xs text-slate-500">CPC</div>
                        </div>
                        <div className="bg-slate-900/40 rounded-lg p-2">
                          <div className="text-sm font-bold text-amber-400">{summary.monthlySearches?.toLocaleString() ?? "—"}</div>
                          <div className="text-xs text-slate-500">Searches/mo</div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => deleteReport(report.id)}
                      disabled={deleting === report.id}
                      className="bg-red-900/30 hover:bg-red-900/50 border border-red-700/50 text-red-400 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5"
                    >
                      {deleting === report.id ? <><Spinner /> Deleting...</> : "🗑️ Delete Report"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   MAIN — MARKETING ENGINE
   ═══════════════════════════════════════════════════════════════════ */

export default function MarketingEngine() {
  const [activeTab, setActiveTab] = useState("validator");
  const [sharedKeyword, setSharedKeyword] = useState("");
  const [sharedNiche, setSharedNiche] = useState("wedding");

  function renderTab() {
    switch (activeTab) {
      case "validator":
        return (
          <NicheValidator
            sharedKeyword={sharedKeyword}
            setSharedKeyword={setSharedKeyword}
            sharedNiche={sharedNiche}
            setSharedNiche={setSharedNiche}
            setActiveTab={setActiveTab}
          />
        );
      case "domains":
        return (
          <DomainScanner
            sharedKeyword={sharedKeyword}
            setSharedKeyword={setSharedKeyword}
          />
        );
      case "keywords":
        return (
          <KeywordLab
            sharedKeyword={sharedKeyword}
            setSharedKeyword={setSharedKeyword}
            setActiveTab={setActiveTab}
          />
        );
      case "blog":
        return (
          <BlogPlanner
            sharedKeyword={sharedKeyword}
            sharedNiche={sharedNiche}
            setSharedKeyword={setSharedKeyword}
          />
        );
      case "gmb":
        return (
          <GMBAdvisor sharedNiche={sharedNiche} />
        );
      case "reports":
        return <SavedReports />;
      default:
        return null;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>🚀</span> Marketing Engine
        </h1>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
          Domain strategy, keyword research, and launch planning for 50 Canadian cities
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                  : "bg-slate-800/40 text-gray-600 dark:text-slate-300 border border-slate-600/30 hover:bg-indigo-950/50 hover:text-gray-900 dark:hover:text-slate-200 hover:border-indigo-500/20"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      {renderTab()}
    </div>
  );
}
