import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line,
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

function StarRating({ value, onChange }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star)}
          className={`text-sm transition-colors ${star <= value ? "text-yellow-400" : "text-slate-600 hover:text-yellow-500"}`}
        >
          {star <= value ? "\u2605" : "\u2606"}
        </button>
      ))}
    </div>
  );
}

const TYPE_BADGES = {
  PLR: "bg-purple-900/50 text-purple-400 border-purple-700",
  MRR: "bg-blue-900/50 text-blue-400 border-blue-700",
  Marketplace: "bg-green-900/50 text-green-400 border-green-700",
};

const STATUS_OPTIONS = ["Purchased", "Listed", "Selling", "Archived"];
const FORMAT_OPTIONS = ["Spreadsheet", "Template", "Guide", "Ebook", "Printable", "Planner", "Checklist", "Tracker", "Bundle", "Course", "Other"];
const PRICE_RANGE_OPTIONS = [
  { label: "$", value: "$", desc: "Under $20" },
  { label: "$$", value: "$$", desc: "$20-$50" },
  { label: "$$$", value: "$$$", desc: "$50+" },
];

const PIE_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
  "#a855f7", "#ef4444",
];

const NICHES = [
  {
    name: "Wedding Planning", emoji: "💍",
    suggestions: ["Budget planners", "Checklists", "Vendor contracts", "Timeline templates"],
  },
  {
    name: "Startup Kits", emoji: "🚀",
    suggestions: ["Business plan kits", "Pitch deck templates", "Financial projections", "Legal doc bundles"],
  },
  {
    name: "Resume & Career", emoji: "📄",
    suggestions: ["ATS-optimized templates", "Cover letter packs", "Interview guides", "Salary negotiation guides"],
  },
  {
    name: "Personal Finance", emoji: "💰",
    suggestions: ["Budget spreadsheets", "Debt payoff planners", "Investment trackers", "Tax preparation checklists"],
  },
  {
    name: "Meal Planning", emoji: "🥗",
    suggestions: ["Recipe ebooks", "Meal prep guides", "Grocery planners", "Nutrition trackers"],
  },
  {
    name: "Fitness & Workout", emoji: "💪",
    suggestions: ["Workout programs", "Body transformation guides", "Fitness planners", "Exercise libraries"],
  },
  {
    name: "Home Organization", emoji: "🏡",
    suggestions: ["Cleaning checklists", "Organization guides", "Home inventory templates", "Moving kits"],
  },
  {
    name: "Parenting & Baby", emoji: "👶",
    suggestions: ["Baby milestone trackers", "Parenting guides", "Homeschool curricula", "Chore chart packs"],
  },
  {
    name: "Event Planning", emoji: "🎉",
    suggestions: ["Event planning kits", "Party checklists", "Decoration guides", "Invitation templates"],
  },
  {
    name: "Social Media", emoji: "📱",
    suggestions: ["Content calendars", "Hashtag guides", "Analytics templates", "Growth strategy guides"],
  },
  {
    name: "Pet Care", emoji: "🐾",
    suggestions: ["Pet health records", "Training guides", "Pet care planners", "Emergency info cards"],
  },
  {
    name: "Real Estate", emoji: "🏠",
    suggestions: ["Property analysis tools", "Rental trackers", "Home buying guides", "Investment calculators"],
  },
];

const EMPTY_SOURCE = { name: "", url: "", type: "PLR", categories: "", notes: "", rating: 0, price_range: "$", last_visited: "" };
const EMPTY_PRODUCT = {
  name: "", source: "", category: "", format: "Template", purchase_price: "", resale_price: "",
  status: "Purchased", sales_count: 0, revenue: 0, notes: "", niche: "",
};

/* ──────────────────────────── Main Component ──────────────────────────── */

export default function PLRVault() {
  const [sources, setSources] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("niches");

  // Source form
  const [showSourceForm, setShowSourceForm] = useState(false);
  const [sourceForm, setSourceForm] = useState({ ...EMPTY_SOURCE });
  const [editingSourceId, setEditingSourceId] = useState(null);
  const [sourceSaving, setSourceSaving] = useState(false);

  // Product form
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({ ...EMPTY_PRODUCT });
  const [editingProductId, setEditingProductId] = useState(null);
  const [productSaving, setProductSaving] = useState(false);

  // Inline editing for source notes
  const [editingNotes, setEditingNotes] = useState({});

  // Product expansion
  const [expandedProducts, setExpandedProducts] = useState(new Set());

  // CSV import
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [csvText, setCsvText] = useState("");

  // Niche search
  const [searchingNiche, setSearchingNiche] = useState(null);

  const clearError = useCallback(() => setError(""), []);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [srcRes, prodRes] = await Promise.all([
        fetch(`${API}/api/plr/sources`),
        fetch(`${API}/api/plr/products`),
      ]);
      if (srcRes.ok) {
        const d = await srcRes.json();
        setSources(Array.isArray(d) ? d : d.sources || []);
      }
      if (prodRes.ok) {
        const d = await prodRes.json();
        setProducts(Array.isArray(d) ? d : d.products || []);
      }
    } catch (err) {
      setError("Failed to load PLR data");
    } finally {
      setLoading(false);
    }
  }

  /* ──── Source CRUD ──── */

  async function handleSaveSource() {
    if (!sourceForm.name.trim() || !sourceForm.url.trim()) {
      setError("Name and URL are required");
      return;
    }
    setSourceSaving(true);
    try {
      const body = {
        ...sourceForm,
        categories: typeof sourceForm.categories === "string"
          ? sourceForm.categories.split(",").map((c) => c.trim()).filter(Boolean)
          : sourceForm.categories,
      };
      let res;
      if (editingSourceId) {
        res = await fetch(`${API}/api/plr/sources/${editingSourceId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`${API}/api/plr/sources`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      if (!res.ok) throw new Error("Save failed");
      setShowSourceForm(false);
      setSourceForm({ ...EMPTY_SOURCE });
      setEditingSourceId(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSourceSaving(false);
    }
  }

  function handleEditSource(src) {
    setSourceForm({
      name: src.name || "",
      url: src.url || "",
      type: src.type || "PLR",
      categories: Array.isArray(src.categories) ? src.categories.join(", ") : src.categories || "",
      notes: src.notes || "",
      rating: src.rating || 0,
      price_range: src.price_range || "$",
      last_visited: src.last_visited || "",
    });
    setEditingSourceId(src.id || src._id);
    setShowSourceForm(true);
  }

  async function handleDeleteSource(id) {
    try {
      await fetch(`${API}/api/plr/sources/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdateSourceField(srcId, field, value) {
    try {
      const src = sources.find((s) => (s.id || s._id) === srcId);
      if (!src) return;
      const body = { ...src, [field]: value };
      await fetch(`${API}/api/plr/sources/${srcId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  /* ──── Product CRUD ──── */

  async function handleSaveProduct() {
    if (!productForm.name.trim()) {
      setError("Product name is required");
      return;
    }
    setProductSaving(true);
    try {
      let res;
      const body = { ...productForm };
      if (editingProductId) {
        res = await fetch(`${API}/api/plr/products/${editingProductId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`${API}/api/plr/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      if (!res.ok) throw new Error("Save failed");
      setShowProductForm(false);
      setProductForm({ ...EMPTY_PRODUCT });
      setEditingProductId(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setProductSaving(false);
    }
  }

  function handleEditProduct(prod) {
    setProductForm({
      name: prod.name || "",
      source: prod.source || "",
      category: prod.category || "",
      format: prod.format || "Template",
      purchase_price: prod.purchase_price ?? prod.purchasePrice ?? "",
      resale_price: prod.resale_price ?? prod.resalePrice ?? "",
      status: prod.status || "Purchased",
      sales_count: prod.sales_count || 0,
      revenue: prod.revenue || 0,
      notes: prod.notes || "",
      niche: prod.niche || "",
    });
    setEditingProductId(prod.id || prod._id);
    setShowProductForm(true);
  }

  async function handleDeleteProduct(id) {
    try {
      await fetch(`${API}/api/plr/products/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function toggleProductExpand(id) {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /* ──── CSV Import ──── */

  async function handleCSVImport() {
    if (!csvText.trim()) return;
    const lines = csvText.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    let imported = 0;
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(",").map((v) => v.trim());
      if (vals.length < 2) continue;
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = vals[idx] || "";
      });
      try {
        const body = {
          name: row.name || row.product || row.title || `Product ${i}`,
          source: row.source || row.marketplace || "",
          category: row.category || row.niche || "",
          niche: row.niche || row.category || "",
          format: row.format || row.type || "Template",
          purchase_price: row.purchase_price || row.cost || row.price || "",
          resale_price: row.resale_price || row.resale || row.sell || "",
          status: row.status || "Purchased",
          notes: row.notes || "",
        };
        const res = await fetch(`${API}/api/plr/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) imported++;
      } catch {}
    }
    setShowCSVImport(false);
    setCsvText("");
    setError("");
    await loadData();
    if (imported > 0) setError(`Successfully imported ${imported} products`);
  }

  /* ──── CSV Export ──── */

  function exportCSV() {
    const headers = ["Name", "Source", "Niche", "Format", "Purchase Price", "Resale Price", "Margin %", "ROI %", "Status", "Sales", "Revenue", "Date Added", "Notes"];
    const rows = products.map((p) => {
      const buy = parseFloat(p.purchase_price || p.purchasePrice) || 0;
      const sell = parseFloat(p.resale_price || p.resalePrice) || 0;
      const margin = buy > 0 ? ((sell - buy) / buy) * 100 : 0;
      const roi = buy > 0 ? (((p.revenue || 0) - buy) / buy) * 100 : 0;
      return [
        `"${(p.name || "").replace(/"/g, '""')}"`,
        `"${(p.source || "").replace(/"/g, '""')}"`,
        `"${(p.niche || p.category || "").replace(/"/g, '""')}"`,
        p.format || "",
        buy.toFixed(2),
        sell.toFixed(2),
        margin.toFixed(1),
        roi.toFixed(1),
        p.status || "",
        p.sales_count || 0,
        (p.revenue || 0).toFixed(2),
        p.date_added || p.created_at || "",
        `"${(p.notes || "").replace(/"/g, '""')}"`,
      ].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plr_inventory_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ──── Summary stats ──── */

  const summary = useMemo(() => {
    const totalInvested = products.reduce(
      (a, p) => a + (parseFloat(p.purchase_price || p.purchasePrice) || 0), 0
    );
    const totalRevenue = products.reduce(
      (a, p) => a + (parseFloat(p.revenue) || 0), 0
    );
    const margins = products.map((p) => {
      const buy = parseFloat(p.purchase_price || p.purchasePrice) || 0;
      const sell = parseFloat(p.resale_price || p.resalePrice) || 0;
      return buy > 0 ? ((sell - buy) / buy) * 100 : 0;
    }).filter((m) => m !== 0);
    const avgMargin = margins.length > 0 ? margins.reduce((a, m) => a + m, 0) / margins.length : 0;

    // Best ROI product
    let bestROI = null;
    let bestROIVal = -Infinity;
    products.forEach((p) => {
      const buy = parseFloat(p.purchase_price || p.purchasePrice) || 0;
      const rev = parseFloat(p.revenue) || 0;
      if (buy > 0) {
        const roi = ((rev - buy) / buy) * 100;
        if (roi > bestROIVal) {
          bestROIVal = roi;
          bestROI = p;
        }
      }
    });

    // Products by niche
    const nicheCount = {};
    products.forEach((p) => {
      const n = p.niche || p.category || "Uncategorized";
      nicheCount[n] = (nicheCount[n] || 0) + 1;
    });
    const nicheChartData = Object.entries(nicheCount).map(([name, value]) => ({ name, value }));

    // Monthly revenue estimate
    const listedProducts = products.filter((p) => p.status === "Listed" || p.status === "Selling");
    const monthlyEstimate = listedProducts.reduce(
      (a, p) => a + (parseFloat(p.resale_price || p.resalePrice) || 0), 0
    );

    // Niche coverage
    const coveredNiches = new Set(products.map((p) => p.niche || p.category).filter(Boolean));

    return { totalInvested, totalRevenue, totalProducts: products.length, avgMargin, bestROI, bestROIVal, nicheChartData, monthlyEstimate, coveredNiches };
  }, [products]);

  /* ──── ROI data ──── */

  const roiData = useMemo(() => {
    const sellingProducts = products.filter((p) => p.status === "Selling");
    const topPerformers = [...sellingProducts]
      .map((p) => {
        const buy = parseFloat(p.purchase_price || p.purchasePrice) || 0;
        const rev = parseFloat(p.revenue) || 0;
        const roi = buy > 0 ? ((rev - buy) / buy) * 100 : 0;
        return { ...p, roi, buy, rev };
      })
      .sort((a, b) => b.roi - a.roi);

    const underperformers = products.filter((p) => {
      if (p.status !== "Selling" && p.status !== "Listed") return false;
      const daysSinceAdded = p.date_added || p.created_at
        ? Math.floor((Date.now() - new Date(p.date_added || p.created_at).getTime()) / 86400000)
        : 0;
      return daysSinceAdded > 30 && (!p.sales_count || p.sales_count === 0);
    });

    return { sellingProducts, topPerformers, underperformers };
  }, [products]);

  /* ──── Products per source count ──── */

  const productsPerSource = useMemo(() => {
    const counts = {};
    products.forEach((p) => {
      const s = p.source || "Unknown";
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [products]);

  /* ──── Render ──── */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
        <span className="ml-2 text-slate-400">Loading PLR data...</span>
      </div>
    );
  }

  const SECTIONS = [
    { id: "niches", label: "Recommended for Your Niches", icon: "💡" },
    { id: "marketplace", label: "Marketplace Directory", icon: "🏪" },
    { id: "inventory", label: "Product Inventory", icon: "📦" },
    { id: "roi", label: "ROI Tracker", icon: "📊" },
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

      {/* ════════════════ Section 1: Recommended for Your Niches ════════════════ */}
      {activeSection === "niches" && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>💡</span> Recommended for Your Niches
              </h2>
              <p className="text-xs text-slate-500 mt-1">PLR product types that sell well in each niche</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Have products</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" /> No products yet</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {NICHES.map((niche) => {
              const hasProducts = summary.coveredNiches.has(niche.name);
              const productCount = products.filter(
                (p) => (p.niche || p.category) === niche.name
              ).length;

              return (
                <div
                  key={niche.name}
                  className={`bg-slate-800 rounded-xl p-5 border transition-all hover:shadow-lg hover:shadow-black/20 ${
                    hasProducts ? "border-green-700/50" : "border-slate-700/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{niche.emoji}</span>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{niche.name}</h3>
                        {hasProducts && (
                          <span className="text-[10px] text-green-400">{productCount} product{productCount !== 1 ? "s" : ""}</span>
                        )}
                      </div>
                    </div>
                    <span className={`w-3 h-3 rounded-full mt-1 ${hasProducts ? "bg-green-500" : "bg-slate-600"}`} />
                  </div>

                  <div className="space-y-1.5 mb-4">
                    {niche.suggestions.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-slate-600">-</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setSearchingNiche(niche.name);
                      window.open(`https://www.google.com/search?q=${encodeURIComponent(`${niche.name} PLR products digital download`)}`, "_blank");
                    }}
                    className="w-full bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white px-3 py-2 rounded-lg text-xs font-medium transition-all text-center"
                  >
                    Find PLR
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════ Section 2: Marketplace Directory ════════════════ */}
      {activeSection === "marketplace" && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>🏪</span> Marketplace Directory
              </h2>
              <p className="text-xs text-slate-500 mt-1">{sources.length} source{sources.length !== 1 ? "s" : ""} tracked</p>
            </div>
            <button
              onClick={() => {
                setSourceForm({ ...EMPTY_SOURCE });
                setEditingSourceId(null);
                setShowSourceForm(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Add Source
            </button>
          </div>

          {/* Add/Edit Source Form */}
          {showSourceForm && (
            <div className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-5 mb-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-300">
                {editingSourceId ? "Edit Source" : "Add New Source"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Name *</label>
                  <input
                    type="text"
                    value={sourceForm.name}
                    onChange={(e) => setSourceForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. PLR.me"
                    className="w-full bg-gray-900 border border-slate-700/50 rounded-lg px-4 py-2 text-gray-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">URL *</label>
                  <input
                    type="text"
                    value={sourceForm.url}
                    onChange={(e) => setSourceForm((p) => ({ ...p, url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full bg-gray-900 border border-slate-700/50 rounded-lg px-4 py-2 text-gray-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Type</label>
                  <select
                    value={sourceForm.type}
                    onChange={(e) => setSourceForm((p) => ({ ...p, type: e.target.value }))}
                    className="w-full bg-gray-900 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="PLR">PLR</option>
                    <option value="MRR">MRR</option>
                    <option value="Marketplace">Marketplace</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Categories (comma separated)</label>
                  <input
                    type="text"
                    value={sourceForm.categories}
                    onChange={(e) => setSourceForm((p) => ({ ...p, categories: e.target.value }))}
                    placeholder="Finance, Health, Business"
                    className="w-full bg-gray-900 border border-slate-700/50 rounded-lg px-4 py-2 text-gray-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Price Range</label>
                  <select
                    value={sourceForm.price_range}
                    onChange={(e) => setSourceForm((p) => ({ ...p, price_range: e.target.value }))}
                    className="w-full bg-gray-900 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
                  >
                    {PRICE_RANGE_OPTIONS.map((pr) => (
                      <option key={pr.value} value={pr.value}>{pr.label} - {pr.desc}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Last Visited</label>
                  <input
                    type="date"
                    value={sourceForm.last_visited}
                    onChange={(e) => setSourceForm((p) => ({ ...p, last_visited: e.target.value }))}
                    className="w-full bg-gray-900 border border-slate-700/50 rounded-lg px-4 py-2 text-gray-100 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Quality Rating</label>
                <StarRating value={sourceForm.rating} onChange={(v) => setSourceForm((p) => ({ ...p, rating: v }))} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Notes</label>
                <textarea
                  value={sourceForm.notes}
                  onChange={(e) => setSourceForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Notes about this source..."
                  rows={2}
                  className="w-full bg-gray-900 border border-slate-700/50 rounded-lg px-4 py-2 text-gray-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveSource}
                  disabled={sourceSaving}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  {sourceSaving && <Spinner />}
                  {editingSourceId ? "Update" : "Add"} Source
                </button>
                <button
                  onClick={() => { setShowSourceForm(false); setEditingSourceId(null); }}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Source Cards */}
          {sources.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No sources added yet. Click &quot;+ Add Source&quot; to get started.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sources.map((src) => {
                const srcId = src.id || src._id;
                const cats = Array.isArray(src.categories) ? src.categories : [];
                const typeCls = TYPE_BADGES[src.type] || TYPE_BADGES.PLR;
                const foundCount = productsPerSource[src.name] || 0;
                const isEditingNotes = editingNotes[srcId] !== undefined;

                return (
                  <div key={srcId} className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-white truncate">{src.name}</h3>
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-400 hover:text-indigo-300 break-all line-clamp-1"
                        >
                          {src.url}
                        </a>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ml-2 ${typeCls}`}>
                        {src.type}
                      </span>
                    </div>

                    {/* Rating + Price Range */}
                    <div className="flex items-center justify-between">
                      <StarRating
                        value={src.rating || 0}
                        onChange={(v) => handleUpdateSourceField(srcId, "rating", v)}
                      />
                      <span className="text-xs text-slate-500">
                        {src.price_range || "$"}
                      </span>
                    </div>

                    {/* Categories */}
                    {cats.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {cats.map((cat, i) => (
                          <span key={i} className="text-xs bg-slate-700 text-gray-300 px-2 py-0.5 rounded">
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>{foundCount} product{foundCount !== 1 ? "s" : ""} found</span>
                      {src.last_visited && (
                        <span>Last visited: {new Date(src.last_visited).toLocaleDateString()}</span>
                      )}
                    </div>

                    {/* Notes - inline editable */}
                    <div className="min-h-[28px]">
                      {isEditingNotes ? (
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={editingNotes[srcId]}
                            onChange={(e) => setEditingNotes((prev) => ({ ...prev, [srcId]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleUpdateSourceField(srcId, "notes", editingNotes[srcId]);
                                setEditingNotes((prev) => { const next = { ...prev }; delete next[srcId]; return next; });
                              }
                              if (e.key === "Escape") {
                                setEditingNotes((prev) => { const next = { ...prev }; delete next[srcId]; return next; });
                              }
                            }}
                            className="flex-1 bg-gray-900 border border-slate-600 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              handleUpdateSourceField(srcId, "notes", editingNotes[srcId]);
                              setEditingNotes((prev) => { const next = { ...prev }; delete next[srcId]; return next; });
                            }}
                            className="text-xs text-green-400 hover:text-green-300 px-1"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <p
                          onClick={() => setEditingNotes((prev) => ({ ...prev, [srcId]: src.notes || "" }))}
                          className="text-xs text-slate-500 line-clamp-2 cursor-pointer hover:text-slate-400 transition-colors"
                          title="Click to edit notes"
                        >
                          {src.notes || "Click to add notes..."}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleUpdateSourceField(srcId, "last_visited", new Date().toISOString().slice(0, 10))}
                        className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      >
                        Visit
                      </a>
                      <button
                        onClick={() => handleEditSource(src)}
                        className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSource(srcId)}
                        className="bg-red-900/30 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════ Section 3: Product Inventory ════════════════ */}
      {activeSection === "inventory" && (
        <div className="space-y-6">
          {/* Summary Dashboard */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>📦</span> Inventory Overview
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-400 mb-1">Total Invested</p>
                <p className="text-xl font-bold text-white">${summary.totalInvested.toFixed(2)}</p>
              </div>
              <div className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-400 mb-1">Total Products</p>
                <p className="text-xl font-bold text-white">{summary.totalProducts}</p>
              </div>
              <div className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-400 mb-1">Avg Margin</p>
                <p className={`text-xl font-bold ${summary.avgMargin >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {summary.avgMargin.toFixed(1)}%
                </p>
              </div>
              <div className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-400 mb-1">Best ROI Product</p>
                <p className="text-sm font-semibold text-yellow-400 truncate" title={summary.bestROI?.name}>
                  {summary.bestROI?.name || "N/A"}
                </p>
                {summary.bestROI && (
                  <p className="text-xs text-slate-500">{summary.bestROIVal.toFixed(0)}% ROI</p>
                )}
              </div>
              <div className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-400 mb-1">Monthly Revenue Est.</p>
                <p className="text-xl font-bold text-green-400">${summary.monthlyEstimate.toFixed(2)}</p>
              </div>
            </div>

            {/* Niche pie chart */}
            {summary.nicheChartData.length > 0 && (
              <div className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Products by Niche</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary.nicheChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name} (${value})`}
                        labelLine={true}
                      >
                        {summary.nicheChartData.map((_, i) => (
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

          {/* Product Table */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-lg font-semibold text-white">All Products</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCSVImport(true)}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                >
                  Import CSV
                </button>
                <button
                  onClick={exportCSV}
                  disabled={products.length === 0}
                  className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => {
                    setProductForm({ ...EMPTY_PRODUCT });
                    setEditingProductId(null);
                    setShowProductForm(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  + Add Product
                </button>
              </div>
            </div>

            {/* CSV Import */}
            {showCSVImport && (
              <div className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-4 mb-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-300">Bulk Import (CSV)</h3>
                <p className="text-xs text-slate-500">
                  Paste CSV with headers: name, source, niche, format, purchase_price, resale_price, status, notes
                </p>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={"name,source,niche,format,purchase_price,resale_price,status,notes\nBudget Planner,PLR.me,Personal Finance,Spreadsheet,15,45,Purchased,Great margins"}
                  rows={6}
                  className="w-full bg-gray-900 border border-slate-700/50 rounded-lg px-4 py-2 text-gray-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none resize-none font-mono text-xs"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCSVImport}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Import
                  </button>
                  <button
                    onClick={() => { setShowCSVImport(false); setCsvText(""); }}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Add/Edit Product Form */}
            {showProductForm && (
              <div className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-5 mb-4 space-y-4">
                <h3 className="text-sm font-semibold text-gray-300">
                  {editingProductId ? "Edit Product" : "Add New Product"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Product Name *</label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Budget Planner Bundle"
                      className="w-full bg-gray-900 border border-slate-700/50 rounded-lg px-4 py-2 text-gray-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Source Marketplace</label>
                    <input
                      type="text"
                      value={productForm.source}
                      onChange={(e) => setProductForm((p) => ({ ...p, source: e.target.value }))}
                      placeholder="e.g. PLR.me"
                      className="w-full bg-gray-900 border border-slate-700/50 rounded-lg px-4 py-2 text-gray-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Niche / Category</label>
                    <select
                      value={productForm.niche}
                      onChange={(e) => setProductForm((p) => ({ ...p, niche: e.target.value, category: e.target.value }))}
                      className="w-full bg-gray-900 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select niche...</option>
                      {NICHES.map((n) => (
                        <option key={n.name} value={n.name}>{n.emoji} {n.name}</option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Format</label>
                    <select
                      value={productForm.format}
                      onChange={(e) => setProductForm((p) => ({ ...p, format: e.target.value }))}
                      className="w-full bg-gray-900 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
                    >
                      {FORMAT_OPTIONS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Purchase Price ($)</label>
                    <input
                      type="number"
                      value={productForm.purchase_price}
                      onChange={(e) => setProductForm((p) => ({ ...p, purchase_price: e.target.value }))}
                      placeholder="0.00"
                      className="w-full bg-gray-900 border border-slate-700/50 rounded-lg px-4 py-2 text-gray-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Resale Price ($)</label>
                    <input
                      type="number"
                      value={productForm.resale_price}
                      onChange={(e) => setProductForm((p) => ({ ...p, resale_price: e.target.value }))}
                      placeholder="0.00"
                      className="w-full bg-gray-900 border border-slate-700/50 rounded-lg px-4 py-2 text-gray-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Status</label>
                    <select
                      value={productForm.status}
                      onChange={(e) => setProductForm((p) => ({ ...p, status: e.target.value }))}
                      className="w-full bg-gray-900 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Sales Count</label>
                    <input
                      type="number"
                      value={productForm.sales_count}
                      onChange={(e) => setProductForm((p) => ({ ...p, sales_count: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                      className="w-full bg-gray-900 border border-slate-700/50 rounded-lg px-4 py-2 text-gray-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Revenue ($)</label>
                    <input
                      type="number"
                      value={productForm.revenue}
                      onChange={(e) => setProductForm((p) => ({ ...p, revenue: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                      className="w-full bg-gray-900 border border-slate-700/50 rounded-lg px-4 py-2 text-gray-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Notes</label>
                  <textarea
                    value={productForm.notes}
                    onChange={(e) => setProductForm((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="Any additional notes..."
                    rows={2}
                    className="w-full bg-gray-900 border border-slate-700/50 rounded-lg px-4 py-2 text-gray-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none resize-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveProduct}
                    disabled={productSaving}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    {productSaving && <Spinner />}
                    {editingProductId ? "Update" : "Add"} Product
                  </button>
                  <button
                    onClick={() => { setShowProductForm(false); setEditingProductId(null); }}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Product Table */}
            {products.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">No products tracked yet. Add your first product or import via CSV.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-gray-300">
                  <thead>
                    <tr className="text-xs text-slate-500 uppercase tracking-wide border-b border-slate-700/40">
                      <th className="text-left py-3 px-2">Product</th>
                      <th className="text-left py-3 px-2">Source</th>
                      <th className="text-left py-3 px-2">Niche</th>
                      <th className="text-left py-3 px-2">Format</th>
                      <th className="text-right py-3 px-2">Purchase</th>
                      <th className="text-right py-3 px-2">Resale</th>
                      <th className="text-right py-3 px-2">Margin</th>
                      <th className="text-right py-3 px-2">ROI</th>
                      <th className="text-center py-3 px-2">Status</th>
                      <th className="text-right py-3 px-2">Sales</th>
                      <th className="text-right py-3 px-2">Revenue</th>
                      <th className="text-center py-3 px-2">Added</th>
                      <th className="text-right py-3 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((prod) => {
                      const prodId = prod.id || prod._id;
                      const buy = parseFloat(prod.purchase_price || prod.purchasePrice) || 0;
                      const sell = parseFloat(prod.resale_price || prod.resalePrice) || 0;
                      const margin = buy > 0 ? ((sell - buy) / buy) * 100 : 0;
                      const rev = parseFloat(prod.revenue) || 0;
                      const roi = buy > 0 ? ((rev - buy) / buy) * 100 : 0;
                      const isExpanded = expandedProducts.has(prodId);

                      const statusCls = {
                        Purchased: "bg-blue-900/50 text-blue-400",
                        Listed: "bg-yellow-900/50 text-yellow-400",
                        Selling: "bg-green-900/50 text-green-400",
                        Archived: "bg-slate-700 text-slate-400",
                      }[prod.status] || "bg-slate-700 text-slate-400";

                      return (
                        <Fragment key={prodId}>
                          <tr
                            className="border-b border-slate-700/40 hover:bg-slate-800/50 cursor-pointer"
                            onClick={() => toggleProductExpand(prodId)}
                          >
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-slate-600 text-xs transition-transform ${isExpanded ? "rotate-90" : ""}`}>&#9654;</span>
                                <span className="text-white font-medium">{prod.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-xs">{prod.source || "-"}</td>
                            <td className="py-3 px-2 text-xs">{prod.niche || prod.category || "-"}</td>
                            <td className="py-3 px-2 text-xs">{prod.format || "-"}</td>
                            <td className="py-3 px-2 text-right">${buy.toFixed(2)}</td>
                            <td className="py-3 px-2 text-right text-green-400">${sell.toFixed(2)}</td>
                            <td className={`py-3 px-2 text-right font-semibold ${margin >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {margin.toFixed(1)}%
                            </td>
                            <td className={`py-3 px-2 text-right font-semibold ${roi >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {roi.toFixed(1)}%
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${statusCls}`}>
                                {prod.status}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-right">{prod.sales_count || 0}</td>
                            <td className="py-3 px-2 text-right text-green-400">${rev.toFixed(2)}</td>
                            <td className="py-3 px-2 text-center text-xs text-slate-500">
                              {prod.date_added || prod.created_at
                                ? new Date(prod.date_added || prod.created_at).toLocaleDateString()
                                : "-"}
                            </td>
                            <td className="py-3 px-2 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleEditProduct(prod)}
                                  className="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(prodId)}
                                  className="text-xs text-red-400 hover:text-red-300 px-2 py-1 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="border-b border-slate-700/40">
                              <td colSpan={13} className="py-3 px-6 bg-slate-800/30">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                  <div>
                                    <span className="text-slate-500">Notes:</span>
                                    <p className="text-gray-300 mt-1">{prod.notes || "No notes"}</p>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Financial Summary:</span>
                                    <p className="text-gray-300 mt-1">
                                      Invested ${buy.toFixed(2)} | Listed at ${sell.toFixed(2)} | Earned ${rev.toFixed(2)} from {prod.sales_count || 0} sale{(prod.sales_count || 0) !== 1 ? "s" : ""}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Net Profit:</span>
                                    <p className={`mt-1 font-semibold ${(rev - buy) >= 0 ? "text-green-400" : "text-red-400"}`}>
                                      ${(rev - buy).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════ Section 4: ROI Tracker ════════════════ */}
      {activeSection === "roi" && (
        <div className="space-y-6">
          {/* Revenue overview */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>📊</span> ROI Tracker
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-400 mb-1">Selling Products</p>
                <p className="text-xl font-bold text-white">{roiData.sellingProducts.length}</p>
              </div>
              <div className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-400 mb-1">Total Revenue</p>
                <p className="text-xl font-bold text-green-400">${summary.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-400 mb-1">Total Invested</p>
                <p className="text-xl font-bold text-white">${summary.totalInvested.toFixed(2)}</p>
              </div>
              <div className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-400 mb-1">Net Profit</p>
                <p className={`text-xl font-bold ${(summary.totalRevenue - summary.totalInvested) >= 0 ? "text-green-400" : "text-red-400"}`}>
                  ${(summary.totalRevenue - summary.totalInvested).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Revenue by product bar chart */}
            {roiData.topPerformers.length > 0 && (
              <div className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Revenue by Product</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={roiData.topPerformers.slice(0, 10).map((p) => ({
                      name: p.name.length > 15 ? p.name.slice(0, 15) + "..." : p.name,
                      Revenue: p.rev,
                      Cost: p.buy,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                      <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                        itemStyle={{ color: "#e5e7eb" }}
                        formatter={(v) => `$${v.toFixed(2)}`}
                      />
                      <Legend />
                      <Bar dataKey="Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Cost" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Top Performers */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <span>🏆</span> Top Performers
            </h3>
            {roiData.topPerformers.length === 0 ? (
              <p className="text-sm text-slate-500">No selling products yet. Mark products as &quot;Selling&quot; and add revenue to track ROI.</p>
            ) : (
              <div className="space-y-3">
                {roiData.topPerformers.slice(0, 5).map((p) => {
                  const prodId = p.id || p._id;
                  return (
                    <div key={prodId} className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-4 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-white truncate">{p.name}</h4>
                        <p className="text-xs text-slate-500">{p.niche || p.category || "No niche"} | {p.sales_count || 0} sales</p>
                      </div>
                      <div className="flex items-center gap-6 shrink-0 ml-4">
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Revenue</p>
                          <p className="text-sm font-bold text-green-400">${p.rev.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">ROI</p>
                          <p className={`text-sm font-bold ${p.roi >= 0 ? "text-green-400" : "text-red-400"}`}>{p.roi.toFixed(0)}%</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Underperformers */}
          {roiData.underperformers.length > 0 && (
            <div className="bg-gray-900 rounded-2xl p-6 border border-slate-700/40">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <span>&#9888;&#65039;</span> Underperformers (0 sales, 30+ days)
              </h3>
              <div className="space-y-3">
                {roiData.underperformers.map((p) => {
                  const prodId = p.id || p._id;
                  const buy = parseFloat(p.purchase_price || p.purchasePrice) || 0;
                  const daysSince = p.date_added || p.created_at
                    ? Math.floor((Date.now() - new Date(p.date_added || p.created_at).getTime()) / 86400000)
                    : 0;
                  return (
                    <div key={prodId} className="bg-slate-800 border border-red-900/30 rounded-xl p-4 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-white truncate">{p.name}</h4>
                        <p className="text-xs text-slate-500">{p.niche || p.category || "No niche"} | Listed {daysSince} days ago</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 ml-4">
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Invested</p>
                          <p className="text-sm font-bold text-red-400">${buy.toFixed(2)}</p>
                        </div>
                        <button
                          onClick={() => handleEditProduct(p)}
                          className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

