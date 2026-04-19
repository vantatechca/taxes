import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useData } from "../context/DataContext.jsx";
import { getCityMetrics, getRevenueTrend, NICHES } from "../data/seedData.js";
import { fmt, NICHE_COLORS } from "../utils/formatters.js";

const PROVINCE_COLORS = {
  ON: "#6366f1", BC: "#22c55e", AB: "#f59e0b", QC: "#ec4899",
  MB: "#3b82f6", SK: "#8b5cf6", NS: "#14b8a6", NB: "#f97316",
  NL: "#06b6d4", PE: "#a78bfa",
};

function CityDrillDown({ city, stores }) {
  const cityStores = stores.filter((s) => s.city === city.city);
  const revTrend = useMemo(() => getRevenueTrend(30), []);

  // Simulated city trend (sum of all niches for the city)
  const cityTrend = revTrend.map((d) => ({
    date: d.date,
    revenue: Math.round(d.total / 50 * (city.rev_7d / (stores.reduce((a, s) => a + s.rev_7d, 0) / 50) || 1)),
  }));

  return (
    <div className="bg-gray-800 border border-indigo-500/30 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider">
          {city.city}, {city.province} — All {cityStores.length} Stores
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-gray-400">Rev 7d: <span className="text-white font-bold">{fmt.currency(city.rev_7d)}</span></span>
          <span className="text-gray-400">Orders: <span className="text-white font-bold">{city.orders_7d}</span></span>
          <span className="text-gray-400">Health: <span className="text-white font-bold">{city.healthScore}</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-2">Traffic Trend (30 days)</h4>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={cityTrend}>
              <defs>
                <linearGradient id="cityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 9 }} tickLine={false} interval={6} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 9 }} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", fontSize: "12px" }} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#cityGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-y-auto max-h-48">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-800">
              <tr className="text-left text-gray-500 uppercase border-b border-gray-700">
                <th className="pb-1.5 pr-3">Niche</th>
                <th className="pb-1.5 pr-3">Status</th>
                <th className="pb-1.5 pr-3">GMB</th>
                <th className="pb-1.5 pr-3 text-right">Rev 7d</th>
                <th className="pb-1.5 text-right">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {cityStores.sort((a, b) => b.rev_7d - a.rev_7d).map((s) => {
                const nicheIdx = NICHES.findIndex((n) => n.id === s.niche_id);
                const niche = NICHES[nicheIdx];
                return (
                  <tr key={s.store_id} className="hover:bg-gray-700/20">
                    <td className="py-1.5 pr-3" style={{ color: NICHE_COLORS[nicheIdx] }}>{niche?.emoji} {niche?.name.split(" ")[0]}</td>
                    <td className="py-1.5 pr-3"><span className={s.status === "live" ? "text-green-400" : "text-gray-500"}>{s.status}</span></td>
                    <td className="py-1.5 pr-3"><span className={s.gmb_status === "active" ? "text-green-400" : s.gmb_status === "suspended" ? "text-red-400" : "text-gray-500"}>{s.gmb_status}</span></td>
                    <td className="py-1.5 pr-3 text-right text-white font-medium">{fmt.currency(s.rev_7d)}</td>
                    <td className="py-1.5 text-right text-gray-400">{s.orders_7d}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Cities() {
  const { stores } = useData();
  const cityMetrics = useMemo(() => getCityMetrics(), []);
  const [sortBy, setSortBy] = useState("rev_7d");
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState(null);

  const sorted = useMemo(() => {
    return [...cityMetrics]
      .filter((c) => c.city.toLowerCase().includes(search.toLowerCase()) || c.province.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b[sortBy] - a[sortBy]);
  }, [cityMetrics, sortBy, search]);

  const top10 = sorted.slice(0, 10);

  const provinces = useMemo(() => {
    const map = {};
    cityMetrics.forEach((c) => {
      if (!map[c.province]) map[c.province] = { province: c.province, rev: 0, stores: 0, cities: 0 };
      map[c.province].rev += c.rev_7d;
      map[c.province].stores += c.stores;
      map[c.province].cities += 1;
    });
    return Object.values(map).sort((a, b) => b.rev - a.rev);
  }, [cityMetrics]);

  const totalRev = cityMetrics.reduce((a, c) => a + c.rev_7d, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Cities Active</p>
          <p className="text-2xl font-bold text-white">{cityMetrics.length}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Top City</p>
          <p className="text-2xl font-bold text-white">{fmt.currency(sorted[0]?.rev_7d)}</p>
          <p className="text-xs text-gray-500">{sorted[0]?.city}, {sorted[0]?.province}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Provinces</p>
          <p className="text-2xl font-bold text-white">{provinces.length}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Avg Rev / City</p>
          <p className="text-2xl font-bold text-white">{fmt.currency(totalRev / cityMetrics.length)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Top 10 Cities by Revenue</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={top10} layout="vertical" margin={{ left: 60, right: 20 }}>
              <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="city" tick={{ fill: "#9ca3af", fontSize: 11 }} tickLine={false} width={60} />
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", fontSize: "12px" }} formatter={(val) => [`$${val.toLocaleString()}`, "Revenue"]} />
              <Bar dataKey="rev_7d" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Revenue by Province</h3>
          <div className="space-y-2">
            {provinces.map((p) => (
              <div key={p.province} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-8">{p.province}</span>
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${(p.rev / provinces[0].rev) * 100}%`, backgroundColor: PROVINCE_COLORS[p.province] || "#6b7280" }} />
                </div>
                <span className="text-xs font-medium text-white w-14 text-right">{fmt.currency(p.rev)}</span>
                <span className="text-xs text-gray-500 w-16 text-right">{p.stores} stores</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drill-down */}
      {selectedCity !== null && (
        <CityDrillDown city={sorted[selectedCity]} stores={stores} />
      )}

      {/* Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-4 items-start sm:items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">All Cities</h3>
            <p className="text-xs text-gray-500">Click a city to drill down</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <input type="text" placeholder="Search city..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-indigo-500 w-36" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-indigo-500">
              <option value="rev_7d">Sort: Revenue</option>
              <option value="stores">Sort: Stores</option>
              <option value="orders_7d">Sort: Orders</option>
              <option value="healthScore">Sort: Health</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-700">
                <th className="pb-2 pr-4">#</th>
                <th className="pb-2 pr-4">City</th>
                <th className="pb-2 pr-4">Prov</th>
                <th className="pb-2 pr-4 text-right">Stores</th>
                <th className="pb-2 pr-4 text-right">Live</th>
                <th className="pb-2 pr-4 text-right">Rev 7d</th>
                <th className="pb-2 pr-4 text-right">Orders</th>
                <th className="pb-2 pr-4 text-right">AOV</th>
                <th className="pb-2 text-right">Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {sorted.map((c, i) => (
                <tr
                  key={c.city}
                  className={`hover:bg-gray-700/30 transition-colors cursor-pointer ${selectedCity === i ? "bg-indigo-900/15 border-l-2 border-l-indigo-500" : ""}`}
                  onClick={() => setSelectedCity(selectedCity === i ? null : i)}
                >
                  <td className="py-2 pr-4 text-gray-500 text-xs">{i + 1}</td>
                  <td className="py-2 pr-4 text-gray-200 font-medium">{c.city}</td>
                  <td className="py-2 pr-4">
                    <span className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ color: PROVINCE_COLORS[c.province] || "#6b7280", backgroundColor: (PROVINCE_COLORS[c.province] || "#6b7280") + "22" }}>
                      {c.province}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-right text-gray-400">{c.stores}</td>
                  <td className="py-2 pr-4 text-right text-green-400">{c.live}</td>
                  <td className="py-2 pr-4 text-right text-white font-semibold">{fmt.currency(c.rev_7d)}</td>
                  <td className="py-2 pr-4 text-right text-gray-300">{fmt.num(c.orders_7d)}</td>
                  <td className="py-2 pr-4 text-right text-gray-300">{fmt.currencyFull(c.aov)}</td>
                  <td className="py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-12 bg-gray-700 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${c.healthScore}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 w-6">{c.healthScore}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
