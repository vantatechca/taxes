import { useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { useData } from "../context/DataContext.jsx";
import { useNotifications } from "../context/NotificationContext.jsx";
import { getNicheMetrics, getRevenueTrend, NICHES } from "../data/seedData.js";
import { fmt, ALERT_STYLES, NICHE_COLORS } from "../utils/formatters.js";
import { exportCSV, dateRangeMultiplier, dateRangeLabel } from "../hooks/useStorage.js";
import AddStoreModal from "./AddStoreModal.jsx";
import CSVImport from "./CSVImport.jsx";
import ReportGenerator from "./ReportGenerator.jsx";
import CanadaMap from "./CanadaMap.jsx";

function MetricCard({ title, value, sub, trend, trendPos }) {
  const isPositive = trendPos !== undefined ? trendPos : trend >= 0;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{title}</p>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      {trend !== undefined && (
        <p className={`text-xs font-medium ${isPositive ? "text-green-400" : "text-red-400"}`}>
          {isPositive ? "+" : ""}{trend}% WoW
        </p>
      )}
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

export default function Overview({ filters, onNavigate }) {
  const { stores, alerts, dismissAlert } = useData();
  const { notify } = useNotifications();
  const [showAddStore, setShowAddStore] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const nicheMetrics = useMemo(() => getNicheMetrics(), []);
  const mult = dateRangeMultiplier(filters.dateRange);
  const rangeLabel = dateRangeLabel(filters.dateRange);

  // Revenue trend days based on date range
  const trendDays = filters.dateRange === "7d" ? 7 : filters.dateRange === "30d" ? 30 : filters.dateRange === "90d" ? 90 : 90;
  const revTrend = useMemo(() => getRevenueTrend(trendDays), [trendDays]);

  const filtered = useMemo(() => {
    return stores.filter((s) => {
      if (filters.niche !== "all" && s.niche_id !== parseInt(filters.niche)) return false;
      if (filters.city !== "all" && s.city !== filters.city) return false;
      if (filters.status !== "all" && s.status !== filters.status) return false;
      return true;
    });
  }, [stores, filters]);

  // Scale metrics by date range
  const totalRev = filtered.reduce((a, s) => a + s.rev_7d * mult, 0);
  const totalOrders = filtered.reduce((a, s) => a + s.orders_7d * mult, 0);
  const avgAOV = totalOrders > 0 ? totalRev / totalOrders : 0;
  const totalRefunds = filtered.reduce((a, s) => a + s.orders_7d * mult * s.refund_rate, 0);
  const refundRate = totalOrders > 0 ? totalRefunds / totalOrders : 0;

  const storeHealth = {
    live: stores.filter((s) => s.status === "live").length,
    pending: stores.filter((s) => s.status === "pending").length,
    paused: stores.filter((s) => s.status === "paused").length,
    flagged: stores.filter((s) => s.shopify_flagged).length,
    dead: stores.filter((s) => s.status === "dead").length,
  };
  const healthData = [
    { name: "Live", value: storeHealth.live, color: "#22c55e" },
    { name: "Pending", value: storeHealth.pending, color: "#eab308" },
    { name: "Paused", value: storeHealth.paused, color: "#6b7280" },
    { name: "Flagged", value: storeHealth.flagged, color: "#ef4444" },
    { name: "Dead", value: storeHealth.dead, color: "#374151" },
  ].filter((h) => h.value > 0);

  const top5Niches = nicheMetrics.slice(0, 5);

  function handleSync() {
    setSyncing(true);
    // Simulate sync: check for issues and fire notifications
    const flagged = stores.filter((s) => s.shopify_flagged);
    const deadStores = stores.filter((s) => s.last_order_days_ago > 90 && s.status === "live");
    const lowContent = stores.filter((s) => s.blog_posts_count < 5 && s.status === "live");

    setTimeout(() => {
      notify(`Sync complete \u2014 ${stores.length} stores, ${stores.filter((s) => s.status === "live").length} live`, "success");
      if (flagged.length > 0) notify(`${flagged.length} stores flagged by Shopify`, "error");
      if (deadStores.length > 0) notify(`${deadStores.length} stores need attention \u2014 90+ days no sales`, "warning");
      if (lowContent.length > 0) notify(`${lowContent.length} live stores with <5 blog posts`, "warning");
      setSyncing(false);
    }, 800);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title={`Total Revenue (${rangeLabel})`} value={fmt.currency(totalRev)} trend={12} />
        <MetricCard title={`Total Orders (${rangeLabel})`} value={fmt.num(Math.round(totalOrders))} trend={8} />
        <MetricCard title="Avg Order Value" value={fmt.currencyFull(avgAOV)} trend={-2} trendPos={false} />
        <MetricCard title="Refund Rate" value={fmt.pct(refundRate)} trend={-0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
            Revenue {"\u2014"} Last {trendDays} Days
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revTrend}>
              <defs>
                <linearGradient id="revAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} interval={Math.max(1, Math.floor(trendDays / 8))} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", fontSize: "12px" }} formatter={(val) => [`$${val.toLocaleString()}`, ""]} />
              <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} fill="url(#revAreaGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Store Health</h3>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={healthData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                {healthData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {healthData.map((h) => (
              <div key={h.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: h.color }} />
                  <span className="text-gray-400">{h.name}</span>
                </div>
                <span className="text-white font-medium">{h.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Canada Map Heatmap */}
      <CanadaMap dateRange={filters.dateRange} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Top 5 Niches by Revenue</h3>
          <div className="space-y-3">
            {top5Niches.map((n, i) => (
              <div key={n.id} className="flex items-center gap-3">
                <span className="text-gray-500 text-xs w-4">{i + 1}</span>
                <span className="text-sm">{n.emoji}</span>
                <span className="text-sm text-gray-300 flex-1">{n.name}</span>
                <div className="flex-1 bg-gray-700 rounded-full h-1.5 mx-2">
                  <div className="h-1.5 rounded-full" style={{ width: `${(n.rev_7d / top5Niches[0].rev_7d) * 100}%`, backgroundColor: NICHE_COLORS[i] }} />
                </div>
                <span className="text-sm font-semibold text-white">{fmt.currency(n.rev_7d * mult)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Alerts ({alerts.length})</h3>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <p className="text-gray-500 text-sm">No active alerts</p>
            ) : (
              alerts.map((a, i) => {
                const style = ALERT_STYLES[a.level];
                return (
                  <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-xs ${style.bg} ${style.text}`}>
                    <span>{style.icon}</span>
                    <span className="flex-1">{a.message}</span>
                    <button onClick={() => dismissAlert(i)} className="opacity-50 hover:opacity-100 text-xs leading-none">&times;</button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <button onClick={() => setShowAddStore(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">+ Add Store</button>
        <button onClick={() => setShowImport(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors">Import CSV</button>
        <button onClick={() => onNavigate?.("content")} className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors">Log Content</button>
        <button onClick={handleSync} disabled={syncing} className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-300 text-sm font-medium rounded-lg transition-colors">
          {syncing ? "Syncing..." : "Sync Data"}
        </button>
        <button onClick={() => exportCSV(filtered, "stores-export")} className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors">Export CSV</button>
        <button onClick={() => setShowReport(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors">Generate Report</button>
      </div>

      {showAddStore && <AddStoreModal onClose={() => setShowAddStore(false)} />}
      {showImport && <CSVImport onClose={() => setShowImport(false)} />}
      {showReport && <ReportGenerator onClose={() => setShowReport(false)} dateRange={filters.dateRange} />}
    </div>
  );
}
