import { useState, useRef } from "react";
import { useData } from "../context/DataContext.jsx";
import { useNotifications } from "../context/NotificationContext.jsx";
import { parseCSV } from "../hooks/useStorage.js";
import { NICHES, CITIES } from "../data/seedData.js";

const NICHE_MAP = Object.fromEntries(NICHES.map((n) => [n.name.toLowerCase(), n]));
const CITY_SET = new Set(CITIES.map((c) => c.name));
const CITY_PROVINCE = Object.fromEntries(CITIES.map((c) => [c.name, c.province]));

function normalizeStore(row) {
  // Try to match niche by name or ID
  let niche = NICHES[0];
  if (row.niche_id) {
    const found = NICHES.find((n) => n.id === parseInt(row.niche_id));
    if (found) niche = found;
  } else if (row.niche || row.niche_name) {
    const key = (row.niche || row.niche_name).toLowerCase();
    if (NICHE_MAP[key]) niche = NICHE_MAP[key];
  }

  const city = CITY_SET.has(row.city) ? row.city : "Toronto";
  const province = CITY_PROVINCE[city] || "ON";

  return {
    store_id: `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    niche_id: niche.id,
    niche: niche.slug,
    niche_name: niche.name,
    city,
    province,
    domain: row.domain || `store-${Date.now()}.ca`,
    brand_name: row.brand_name || row.name || niche.brand,
    status: ["live", "pending", "paused"].includes(row.status) ? row.status : "pending",
    gmb_status: ["active", "pending", "suspended", "none"].includes(row.gmb_status) ? row.gmb_status : "none",
    days_live: parseInt(row.days_live) || 0,
    products_count: parseInt(row.products_count || row.products) || 0,
    blog_posts_count: parseInt(row.blog_posts_count || row.blog_posts) || 0,
    rev_7d: parseFloat(row.rev_7d || row.revenue) || 0,
    orders_7d: parseInt(row.orders_7d || row.orders) || 0,
    aov: parseFloat(row.aov) || 0,
    refund_rate: parseFloat(row.refund_rate) || 0,
    organic_sessions_30d: parseInt(row.organic_sessions_30d || row.sessions) || 0,
    last_order_days_ago: parseInt(row.last_order_days_ago) || 0,
    shopify_flagged: row.shopify_flagged === "true",
  };
}

export default function CSVImport({ onClose }) {
  const { addStore } = useData();
  const { notify } = useNotifications();
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rows = parseCSV(ev.target.result);
        if (rows.length === 0) { setError("No valid rows found in CSV"); return; }
        const normalized = rows.map(normalizeStore);
        setPreview(normalized);
      } catch (err) {
        setError("Failed to parse CSV: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  function handleImport() {
    if (!preview) return;
    preview.forEach((store) => addStore(store));
    notify(`Imported ${preview.length} stores from CSV`, "success");
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">Import Stores from CSV</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          {/* Upload area */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500/50 transition-colors"
          >
            <svg className="w-8 h-8 mx-auto text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-400">Click to upload CSV or drag and drop</p>
            <p className="text-xs text-gray-600 mt-1">Required columns: brand_name, city, niche_name (or niche_id)</p>
            <p className="text-xs text-gray-600">Optional: domain, status, rev_7d, orders_7d, products_count, blog_posts_count</p>
            <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" onChange={handleFile} className="hidden" />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          {/* Preview */}
          {preview && (
            <div>
              <p className="text-sm text-gray-300 mb-2">{preview.length} stores ready to import:</p>
              <div className="max-h-48 overflow-y-auto border border-gray-700 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-800">
                    <tr className="text-gray-400 uppercase tracking-wider">
                      <th className="px-3 py-2 text-left">Brand</th>
                      <th className="px-3 py-2 text-left">Domain</th>
                      <th className="px-3 py-2 text-left">City</th>
                      <th className="px-3 py-2 text-left">Niche</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-right">Rev 7d</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 20).map((s, i) => (
                      <tr key={i} className="border-t border-gray-700/50 text-gray-300">
                        <td className="px-3 py-1.5">{s.brand_name}</td>
                        <td className="px-3 py-1.5 text-gray-500">{s.domain}</td>
                        <td className="px-3 py-1.5">{s.city}</td>
                        <td className="px-3 py-1.5">{s.niche_name}</td>
                        <td className="px-3 py-1.5">{s.status}</td>
                        <td className="px-3 py-1.5 text-right">${s.rev_7d}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 20 && <p className="text-xs text-gray-500 px-3 py-2">...and {preview.length - 20} more</p>}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {preview && (
              <button onClick={handleImport} className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors">
                Import {preview.length} Stores
              </button>
            )}
            <button onClick={onClose} className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
