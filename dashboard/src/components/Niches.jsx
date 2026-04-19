import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area
} from "recharts";
import { useData } from "../context/DataContext.jsx";
import { getNicheMetrics, getRevenueTrend, NICHES } from "../data/seedData.js";
import { fmt, NICHE_COLORS } from "../utils/formatters.js";

function NicheCard({ niche, rank, color, onClick, isSelected }) {
  return (
    <div
      className={`bg-gray-800 border rounded-xl p-4 cursor-pointer transition-colors ${isSelected ? "border-indigo-500 bg-indigo-900/10" : "border-gray-700 hover:border-gray-600"}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs font-mono">#{rank}</span>
          <span className="text-xl">{niche.emoji}</span>
          <div>
            <p className="text-sm font-semibold text-white">{niche.name}</p>
            <p className="text-xs text-gray-500">{niche.stores} stores · {niche.live} live</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-base font-bold text-white">{fmt.currency(niche.rev_7d)}</p>
          <p className="text-xs text-gray-400">{fmt.currency(niche.rev_7d / 7)}/day</p>
        </div>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-1 mb-3">
        <div className="h-1 rounded-full" style={{ width: `${niche.healthScore}%`, backgroundColor: color }} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div><p className="text-xs text-gray-500">AOV</p><p className="text-xs font-semibold text-white">{fmt.currencyFull(niche.aov)}</p></div>
        <div><p className="text-xs text-gray-500">Refund</p><p className="text-xs font-semibold text-white">{fmt.pct(niche.refund_rate)}</p></div>
        <div><p className="text-xs text-gray-500">Orders</p><p className="text-xs font-semibold text-white">{fmt.num(niche.orders_7d)}</p></div>
      </div>
    </div>
  );
}

function NicheDrillDown({ niche, nicheIdx, stores }) {
  const nicheStores = stores.filter((s) => s.niche_id === niche.id);
  const revTrend = useMemo(() => getRevenueTrend(90), []);
  const nicheSlug = NICHES[nicheIdx]?.slug;

  // Top cities for this niche
  const cityRev = {};
  nicheStores.forEach((s) => {
    cityRev[s.city] = (cityRev[s.city] || 0) + s.rev_7d;
  });
  const topCities = Object.entries(cityRev).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([city, rev]) => ({ city, rev }));

  // Revenue trend for this niche
  const nicheTrend = revTrend.map((d) => ({
    date: d.date,
    revenue: d[nicheSlug] || 0,
  }));

  return (
    <div className="bg-gray-800 border border-indigo-500/30 rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider">
          {niche.emoji} {niche.name} — Deep Dive
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-gray-400">Health: <span className="text-white font-bold">{niche.healthScore}/100</span></span>
          <span className="text-gray-400">Blogs: <span className="text-white font-bold">{niche.blog_posts}</span></span>
          <span className="text-gray-400">Products: <span className="text-white font-bold">{niche.products}</span></span>
          <span className="text-gray-400">Sessions: <span className="text-white font-bold">{fmt.num(niche.organic_sessions)}</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-2">Revenue Trend (90 days)</h4>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={nicheTrend}>
              <defs>
                <linearGradient id={`drillGrad${nicheIdx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={NICHE_COLORS[nicheIdx]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={NICHE_COLORS[nicheIdx]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 9 }} tickLine={false} interval={14} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 9 }} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", fontSize: "12px" }} />
              <Area type="monotone" dataKey="revenue" stroke={NICHE_COLORS[nicheIdx]} fill={`url(#drillGrad${nicheIdx})`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-2">Top 10 Cities</h4>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={topCities} layout="vertical" margin={{ left: 60 }}>
              <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 9 }} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <YAxis type="category" dataKey="city" tick={{ fill: "#9ca3af", fontSize: 10 }} tickLine={false} width={60} />
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", fontSize: "12px" }} formatter={(v) => [`$${v}`, "Rev 7d"]} />
              <Bar dataKey="rev" fill={NICHE_COLORS[nicheIdx]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Content status */}
      <div>
        <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-2">Content Status</h4>
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-gray-700/50 rounded-lg p-2.5 text-center">
            <p className="text-xs text-gray-500">Blogs/wk</p>
            <p className="text-sm font-bold text-white">{niche.blog_this_week}/{niche.blogTarget}</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-2.5 text-center">
            <p className="text-xs text-gray-500">GMB/wk</p>
            <p className="text-sm font-bold text-white">{niche.gmb_this_week}/{niche.gmbTarget}</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-2.5 text-center">
            <p className="text-xs text-gray-500">Products</p>
            <p className="text-sm font-bold text-white">{niche.products}</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-2.5 text-center">
            <p className="text-xs text-gray-500">Active GMB</p>
            <p className="text-sm font-bold text-white">{niche.active_gmb}/{niche.stores}</p>
          </div>
        </div>
      </div>

      {/* Store list for this niche */}
      <div>
        <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-2">All {nicheStores.length} Stores</h4>
        <div className="overflow-x-auto max-h-48 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-800">
              <tr className="text-left text-gray-500 uppercase border-b border-gray-700">
                <th className="pb-1.5 pr-3">Store</th>
                <th className="pb-1.5 pr-3">City</th>
                <th className="pb-1.5 pr-3">Status</th>
                <th className="pb-1.5 pr-3 text-right">Rev 7d</th>
                <th className="pb-1.5 text-right">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {nicheStores.sort((a, b) => b.rev_7d - a.rev_7d).slice(0, 30).map((s) => (
                <tr key={s.store_id} className="hover:bg-gray-700/20">
                  <td className="py-1.5 pr-3 text-gray-300">{s.brand_name} <span className="text-gray-600">{s.domain}</span></td>
                  <td className="py-1.5 pr-3 text-gray-400">{s.city}</td>
                  <td className="py-1.5 pr-3"><span className={`${s.status === "live" ? "text-green-400" : "text-gray-500"}`}>{s.status}</span></td>
                  <td className="py-1.5 pr-3 text-right text-white font-medium">{fmt.currency(s.rev_7d)}</td>
                  <td className="py-1.5 text-right text-gray-400">{s.orders_7d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Niches() {
  const { stores } = useData();
  const nicheMetrics = useMemo(() => getNicheMetrics(), []);
  const [selectedNiche, setSelectedNiche] = useState(null);

  const barData = nicheMetrics.map((n, i) => ({
    name: n.emoji + " " + n.name.split(" ")[0],
    rev: Math.round(n.rev_7d),
    color: NICHE_COLORS[i],
  }));

  const radarData = nicheMetrics.slice(0, 6).map((n) => ({
    subject: n.name.split(" ")[0],
    Revenue: Math.round((n.rev_7d / nicheMetrics[0].rev_7d) * 100),
    Health: n.healthScore,
    Stores: Math.round((n.live / n.stores) * 100),
  }));

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Niches</p>
          <p className="text-2xl font-bold text-white">{nicheMetrics.length}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Best Niche Rev</p>
          <p className="text-2xl font-bold text-white">{fmt.currency(nicheMetrics[0]?.rev_7d)}</p>
          <p className="text-xs text-gray-500">{nicheMetrics[0]?.emoji} {nicheMetrics[0]?.name}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Avg Health Score</p>
          <p className="text-2xl font-bold text-white">{Math.round(nicheMetrics.reduce((a, n) => a + n.healthScore, 0) / nicheMetrics.length)}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total 7d Orders</p>
          <p className="text-2xl font-bold text-white">{fmt.num(nicheMetrics.reduce((a, n) => a + n.orders_7d, 0))}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Revenue by Niche (7d)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ left: 0 }}>
              <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 9 }} tickLine={false} interval={0} angle={-20} textAnchor="end" height={40} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", fontSize: "12px" }} formatter={(val) => [`$${val.toLocaleString()}`, "Revenue"]} />
              <Bar dataKey="rev" radius={[4, 4, 0, 0]}>
                {barData.map((entry, i) => <rect key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Top 6 Niche Radar</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#9ca3af", fontSize: 10 }} />
              <PolarRadiusAxis tick={{ fill: "#6b7280", fontSize: 8 }} />
              <Radar name="Revenue" dataKey="Revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
              <Radar name="Health" dataKey="Health" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} />
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", fontSize: "12px" }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Drill-down panel */}
      {selectedNiche !== null && (
        <NicheDrillDown
          niche={nicheMetrics[selectedNiche]}
          nicheIdx={NICHES.findIndex((n) => n.id === nicheMetrics[selectedNiche].id)}
          stores={stores}
        />
      )}

      {/* Niche cards — click to drill down */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-1 uppercase tracking-wider">All Niches</h3>
        <p className="text-xs text-gray-500 mb-3">Click a niche to drill down</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {nicheMetrics.map((n, i) => (
            <NicheCard
              key={n.id}
              niche={n}
              rank={i + 1}
              color={NICHE_COLORS[NICHES.findIndex((x) => x.id === n.id)]}
              onClick={() => setSelectedNiche(selectedNiche === i ? null : i)}
              isSelected={selectedNiche === i}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
