import { useMemo, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine
} from "recharts";
import { useData } from "../context/DataContext.jsx";
import { getRevenueTrend } from "../data/seedData.js";
import { fmt } from "../utils/formatters.js";

const EXPENSE_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#ec4899"];

function EditableCost({ label, value, onChange, suffix = "/mo" }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function save() {
    onChange(parseFloat(draft) || 0);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center justify-between border-b border-gray-700/50 pb-2">
        <span className="text-xs text-gray-400">{label}</span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">$</span>
          <input type="number" value={draft} onChange={(e) => setDraft(e.target.value)} className="w-24 bg-gray-700 border border-gray-600 rounded px-2 py-0.5 text-xs text-white text-right focus:outline-none focus:border-indigo-500" autoFocus onKeyDown={(e) => e.key === "Enter" && save()} />
          <button onClick={save} className="text-xs text-green-400 ml-1">OK</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between border-b border-gray-700/50 pb-2 cursor-pointer group hover:bg-gray-700/20 -mx-1 px-1 rounded" onClick={() => { setDraft(value); setEditing(true); }}>
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-sm font-semibold text-white">{fmt.currency(value)}{suffix}</span>
        <span className="text-xs text-gray-600 opacity-0 group-hover:opacity-100">edit</span>
      </div>
    </div>
  );
}

export default function Financial() {
  const { stores, financialConfig, setFinancialConfig } = useData();

  const storeCount = stores.length;
  const liveStores = stores.filter((s) => s.status === "live");

  // Compute financials from editable config + live store data
  const computed = useMemo(() => {
    const cfg = financialConfig;
    const totalRev7d = stores.reduce((a, s) => a + s.rev_7d, 0);
    const monthlyGross = totalRev7d * 4.3;
    const refundAmt = stores.reduce((a, s) => a + s.rev_7d * 4.3 * s.refund_rate, 0);
    const netRev = monthlyGross - refundAmt;

    const shopifyCost = storeCount * cfg.shopify_per_store;
    const domainCost = storeCount * cfg.domain_per_store_monthly;
    const processingFee = netRev * cfg.payment_processing_rate;

    const expenses = {
      Shopify: shopifyCost,
      Domains: Math.round(domainCost),
      Apps: cfg.apps_total,
      Salaries: cfg.team_salaries,
      Processing: Math.round(processingFee),
      Ads: cfg.ad_spend,
      Misc: cfg.misc,
    };
    const totalExpenses = Object.values(expenses).reduce((a, v) => a + v, 0);
    const profit = netRev - totalExpenses;
    const margin = netRev > 0 ? profit / netRev : 0;
    const breakEvenPerStore = storeCount > 0 ? totalExpenses / storeCount : 0;
    const aboveBreakEven = stores.filter((s) => s.rev_7d * 4.3 > breakEvenPerStore).length;

    return { monthlyGross, refundAmt, netRev, expenses, totalExpenses, profit, margin, breakEvenPerStore, aboveBreakEven };
  }, [stores, financialConfig, storeCount]);

  const { monthlyGross, refundAmt, netRev, expenses, totalExpenses, profit, margin, breakEvenPerStore, aboveBreakEven } = computed;

  const expenseData = Object.entries(expenses).filter(([, v]) => v > 0).map(([name, value], i) => ({
    name, value, color: EXPENSE_COLORS[i] || "#6b7280",
  }));

  // Break-even histogram
  const histogram = useMemo(() => {
    const buckets = [
      { label: "$0", min: 0, max: 0, count: 0 },
      { label: "$1-50", min: 1, max: 50, count: 0 },
      { label: "$51-100", min: 51, max: 100, count: 0 },
      { label: "$101-200", min: 101, max: 200, count: 0 },
      { label: "$201-500", min: 201, max: 500, count: 0 },
      { label: "$501+", min: 501, max: Infinity, count: 0 },
    ];
    stores.forEach((s) => {
      const monthlyRev = s.rev_7d * 4.3;
      const bucket = buckets.find((b) => monthlyRev >= b.min && monthlyRev <= b.max);
      if (bucket) bucket.count++;
    });
    return buckets;
  }, [stores]);

  // Monthly P&L (simulated 6 months using growth curve)
  const plData = useMemo(() => {
    const months = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
    return months.map((month, i) => {
      const growth = 0.85 + i * 0.03;
      const rev = Math.round(netRev * growth);
      const exp = Math.round(totalExpenses * (0.95 + i * 0.01));
      return { month, revenue: rev, expenses: exp, profit: rev - exp };
    });
  }, [netRev, totalExpenses]);

  function updateConfig(key, value) {
    setFinancialConfig((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Gross Revenue</p>
          <p className="text-2xl font-bold text-white">{fmt.currency(monthlyGross)}</p>
          <p className="text-xs text-gray-500">this month (est)</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Refunds</p>
          <p className="text-2xl font-bold text-red-400">-{fmt.currency(refundAmt)}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Net Revenue</p>
          <p className="text-2xl font-bold text-white">{fmt.currency(netRev)}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Est. Profit</p>
          <p className={`text-2xl font-bold ${profit > 0 ? "text-green-400" : "text-red-400"}`}>{fmt.currency(profit)}</p>
          <p className="text-xs text-gray-500">{fmt.pct(margin)} margin</p>
        </div>
      </div>

      {/* Charts + Cost editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Monthly P&L — Last 6 Months</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={plData}>
              <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", fontSize: "12px" }} formatter={(val, name) => [`$${val.toLocaleString()}`, name]} />
              <ReferenceLine y={0} stroke="#374151" />
              <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.7} />
              <Bar dataKey="profit" name="Profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Expense Breakdown</h3>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={expenseData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value">
                {expenseData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", fontSize: "12px" }} formatter={(val) => [`$${val.toLocaleString()}`, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-1">
            {expenseData.map((e) => (
              <div key={e.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
                  <span className="text-gray-400">{e.name}</span>
                </div>
                <span className="text-white font-medium">{fmt.currency(e.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Editable cost structure + Break-even */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-1 uppercase tracking-wider">Monthly Costs (click to edit)</h3>
          <p className="text-xs text-gray-500 mb-4">All values persist in localStorage. Edit to match your real costs.</p>
          <div className="space-y-2.5">
            <EditableCost label={`Shopify (${storeCount} x $${financialConfig.shopify_per_store})`} value={storeCount * financialConfig.shopify_per_store} onChange={(v) => updateConfig("shopify_per_store", v / storeCount)} />
            <EditableCost label={`Domains (${storeCount} stores)`} value={Math.round(storeCount * financialConfig.domain_per_store_monthly)} onChange={(v) => updateConfig("domain_per_store_monthly", v / storeCount)} />
            <EditableCost label="Apps & tools" value={financialConfig.apps_total} onChange={(v) => updateConfig("apps_total", v)} />
            <EditableCost label={`Team salaries (${financialConfig.team_size} staff)`} value={financialConfig.team_salaries} onChange={(v) => updateConfig("team_salaries", v)} />
            <EditableCost label={`Processing fees (~${(financialConfig.payment_processing_rate * 100).toFixed(1)}%)`} value={Math.round(netRev * financialConfig.payment_processing_rate)} onChange={(v) => updateConfig("payment_processing_rate", netRev > 0 ? v / netRev : 0.029)} />
            <EditableCost label="Ad spend" value={financialConfig.ad_spend} onChange={(v) => updateConfig("ad_spend", v)} />
            <EditableCost label="Misc" value={financialConfig.misc} onChange={(v) => updateConfig("misc", v)} />
            <div className="flex items-center justify-between pt-2 border-t border-gray-600">
              <span className="text-xs font-bold text-gray-300">TOTAL COSTS</span>
              <span className="text-sm font-bold text-white">{fmt.currency(totalExpenses)}/mo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300">NET PROFIT</span>
              <span className={`text-sm font-bold ${profit > 0 ? "text-green-400" : "text-red-400"}`}>{fmt.currency(profit)}/mo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300">MARGIN</span>
              <span className="text-sm font-bold text-white">{fmt.pct(margin)}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Break-Even Analysis</h3>
          <div className="mb-4 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Break-even per store</span>
              <span className="text-white font-semibold">{fmt.currencyFull(Math.round(breakEvenPerStore))}/mo</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Above break-even</span>
              <span className="text-green-400 font-semibold">{aboveBreakEven}/{storeCount} ({Math.round(aboveBreakEven / storeCount * 100)}%)</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Below break-even</span>
              <span className="text-red-400 font-semibold">{storeCount - aboveBreakEven}/{storeCount}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-2">Revenue per store (monthly est.)</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={histogram}>
              <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", fontSize: "12px" }} formatter={(val) => [val + " stores", "Count"]} />
              <ReferenceLine x={`$${Math.round(breakEvenPerStore)}`} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "BE", fill: "#ef4444", fontSize: 10 }} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Unit economics */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Unit Economics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Rev / Store (7d)", value: fmt.currency(stores.reduce((a, s) => a + s.rev_7d, 0) / storeCount) },
            { label: "Rev / Live Store (7d)", value: fmt.currency(liveStores.reduce((a, s) => a + s.rev_7d, 0) / Math.max(1, liveStores.length)) },
            { label: "Cost / Store (mo)", value: fmt.currencyFull(Math.round(totalExpenses / storeCount)) },
            { label: "Profit / Store (mo)", value: fmt.currencyFull(Math.round(profit / storeCount)) },
            { label: "Stores", value: storeCount },
            { label: "Live Stores", value: liveStores.length },
          ].map((row) => (
            <div key={row.label} className="text-center">
              <p className="text-xs text-gray-500 mb-1">{row.label}</p>
              <p className="text-sm font-bold text-white">{row.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
