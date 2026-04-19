import { useState } from "react";
import { useData } from "../context/DataContext.jsx";
import { useNotifications } from "../context/NotificationContext.jsx";
import { getNicheMetrics, getCityMetrics } from "../data/seedData.js";
import { fmt } from "../utils/formatters.js";
import { dateRangeMultiplier, dateRangeLabel } from "../hooks/useStorage.js";

function generateReportHTML(stores, niches, cities, dateRange) {
  const mult = dateRangeMultiplier(dateRange);
  const label = dateRangeLabel(dateRange);
  const liveStores = stores.filter((s) => s.status === "live");
  const totalRev = stores.reduce((a, s) => a + s.rev_7d * mult, 0);
  const totalOrders = stores.reduce((a, s) => a + s.orders_7d * mult, 0);
  const avgAOV = totalOrders > 0 ? totalRev / totalOrders : 0;
  const date = new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });

  const top5Niches = niches.slice(0, 5);
  const top10Cities = cities.slice(0, 10);

  const statusCounts = {};
  stores.forEach((s) => { statusCounts[s.status] = (statusCounts[s.status] || 0) + 1; });

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Digital Empire Report</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #1e293b; background: #fff; }
  h1 { font-size: 24px; margin-bottom: 4px; }
  h2 { font-size: 16px; color: #475569; margin: 32px 0 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
  .subtitle { color: #64748b; font-size: 13px; margin-bottom: 24px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
  .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
  .kpi .label { font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; }
  .kpi .value { font-size: 22px; font-weight: 700; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin: 8px 0; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; color: #94a3b8; padding: 6px 8px; border-bottom: 2px solid #e2e8f0; }
  td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; }
  tr:hover { background: #f8fafc; }
  .text-right { text-align: right; }
  .font-bold { font-weight: 600; }
  .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
  @media print { body { padding: 0; } .no-print { display: none; } }
</style></head><body>
<h1>Digital Products Empire</h1>
<p class="subtitle">Performance Report &mdash; ${date} &mdash; Period: Last ${label}</p>

<div class="kpi-grid">
  <div class="kpi"><div class="label">Total Stores</div><div class="value">${stores.length}</div></div>
  <div class="kpi"><div class="label">Live Stores</div><div class="value">${liveStores.length}</div></div>
  <div class="kpi"><div class="label">Revenue (${label})</div><div class="value">${fmt.currency(totalRev)}</div></div>
  <div class="kpi"><div class="label">Orders (${label})</div><div class="value">${fmt.num(Math.round(totalOrders))}</div></div>
</div>

<h2>Store Status Breakdown</h2>
<table>
  <thead><tr><th>Status</th><th class="text-right">Count</th><th class="text-right">%</th></tr></thead>
  <tbody>
    ${Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) =>
      `<tr><td style="text-transform:capitalize">${status}</td><td class="text-right">${count}</td><td class="text-right">${(count / stores.length * 100).toFixed(1)}%</td></tr>`
    ).join("")}
  </tbody>
</table>

<h2>Top 5 Niches by Revenue</h2>
<table>
  <thead><tr><th>Niche</th><th class="text-right">Stores</th><th class="text-right">Live</th><th class="text-right">Rev (${label})</th><th class="text-right">Orders</th><th class="text-right">Health</th></tr></thead>
  <tbody>
    ${top5Niches.map((n) => `<tr>
      <td>${n.emoji} ${n.name}</td>
      <td class="text-right">${n.stores}</td>
      <td class="text-right">${n.live}</td>
      <td class="text-right font-bold">${fmt.currency(n.rev_7d * mult)}</td>
      <td class="text-right">${fmt.num(Math.round(n.orders_7d * mult))}</td>
      <td class="text-right">${n.healthScore}/100</td>
    </tr>`).join("")}
  </tbody>
</table>

<h2>Top 10 Cities by Revenue</h2>
<table>
  <thead><tr><th>City</th><th>Province</th><th class="text-right">Stores</th><th class="text-right">Rev (${label})</th><th class="text-right">AOV</th></tr></thead>
  <tbody>
    ${top10Cities.map((c) => `<tr>
      <td>${c.city}</td>
      <td>${c.province}</td>
      <td class="text-right">${c.stores}</td>
      <td class="text-right font-bold">${fmt.currency(c.rev_7d * mult)}</td>
      <td class="text-right">${fmt.currencyFull(c.aov)}</td>
    </tr>`).join("")}
  </tbody>
</table>

<h2>Key Metrics</h2>
<div class="kpi-grid">
  <div class="kpi"><div class="label">Avg Order Value</div><div class="value">${fmt.currencyFull(avgAOV)}</div></div>
  <div class="kpi"><div class="label">12 Niches</div><div class="value">${niches.length}</div></div>
  <div class="kpi"><div class="label">50 Cities</div><div class="value">${cities.length}</div></div>
  <div class="kpi"><div class="label">Flagged</div><div class="value">${stores.filter((s) => s.shopify_flagged).length}</div></div>
</div>

<div class="footer">
  Generated by Digital Products Empire Command Center &mdash; ${date}
</div>

<div class="no-print" style="text-align:center;margin-top:20px">
  <button onclick="window.print()" style="padding:10px 24px;background:#6366f1;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px">Print / Save as PDF</button>
</div>
</body></html>`;
}

export default function ReportGenerator({ onClose, dateRange }) {
  const { stores } = useData();
  const { notify } = useNotifications();
  const [generating, setGenerating] = useState(false);

  function generate() {
    setGenerating(true);
    const niches = getNicheMetrics();
    const cities = getCityMetrics();
    const html = generateReportHTML(stores, niches, cities, dateRange);

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (!win) {
      // Fallback: download as file
      const a = document.createElement("a");
      a.href = url;
      a.download = `empire-report-${new Date().toISOString().slice(0, 10)}.html`;
      a.click();
    }
    URL.revokeObjectURL(url);

    notify("Report generated — use browser print to save as PDF", "success");
    setGenerating(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">Generate Report</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-400">
            Generate an HTML report with KPIs, niche performance, city breakdown, and store status.
            The report opens in a new tab where you can print or save as PDF.
          </p>

          <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Stores included</span>
              <span className="text-white font-medium">{stores.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Date range</span>
              <span className="text-white font-medium">{dateRangeLabel(dateRange)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Sections</span>
              <span className="text-white font-medium">KPIs, Niches, Cities, Status</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={generate} disabled={generating} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
              {generating ? "Generating..." : "Generate Report"}
            </button>
            <button onClick={onClose} className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
