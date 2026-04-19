import { useMemo, useState } from "react";
import { useData } from "../context/DataContext.jsx";
import { NICHES } from "../data/seedData.js";
import { fmt, STATUS_COLORS, STATUS_TEXT, GMB_COLORS, NICHE_COLORS } from "../utils/formatters.js";
import { exportCSV } from "../hooks/useStorage.js";
import StoreDetail from "./StoreDetail.jsx";

const NICHE_MAP = Object.fromEntries(NICHES.map((n) => [n.id, n]));

function StatusBadge({ status }) {
  const dot = STATUS_COLORS[status] || "bg-gray-500";
  const text = STATUS_TEXT[status] || "text-gray-400";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
}

function GmbBadge({ status }) {
  const color = GMB_COLORS[status] || "text-gray-500";
  const labels = { active: "GMB OK", pending: "GMB ~", suspended: "GMB !", none: "No GMB" };
  return <span className={`text-xs ${color}`}>{labels[status] || status}</span>;
}

export default function Stores({ filters }) {
  const { stores, bulkUpdateStores, deleteStore } = useData();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("rev_7d");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [detailStore, setDetailStore] = useState(null);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const PAGE_SIZE = 25;

  const filtered = useMemo(() => {
    return stores.filter((s) => {
      if (filters?.niche !== "all" && s.niche_id !== parseInt(filters.niche)) return false;
      if (filters?.city !== "all" && s.city !== filters.city) return false;
      if (filters?.status !== "all" && s.status !== filters.status) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!s.brand_name.toLowerCase().includes(q) && !s.city.toLowerCase().includes(q) && !s.domain.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [stores, filters, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortBy], bv = b[sortBy];
      if (typeof av === "string") return sortDir === "desc" ? bv.localeCompare(av) : av.localeCompare(bv);
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [filtered, sortBy, sortDir]);

  const pageData = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  function toggleSort(col) {
    if (sortBy === col) setSortDir(sortDir === "desc" ? "asc" : "desc");
    else { setSortBy(col); setSortDir("desc"); }
    setPage(0);
  }

  function SortIcon({ col }) {
    if (sortBy !== col) return <span className="text-gray-600 ml-0.5">↕</span>;
    return <span className="text-indigo-400 ml-0.5">{sortDir === "desc" ? "↓" : "↑"}</span>;
  }

  function toggleSelect(storeId) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(storeId) ? next.delete(storeId) : next.add(storeId);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === pageData.length) setSelected(new Set());
    else setSelected(new Set(pageData.map((s) => s.store_id)));
  }

  function bulkAction(action) {
    const ids = [...selected];
    if (ids.length === 0) return;
    switch (action) {
      case "pause": bulkUpdateStores(ids, { status: "paused" }); break;
      case "resume": bulkUpdateStores(ids, { status: "live" }); break;
      case "flag": bulkUpdateStores(ids, { shopify_flagged: true }); break;
      case "kill": bulkUpdateStores(ids, { status: "dead" }); break;
      case "export":
        exportCSV(stores.filter((s) => ids.includes(s.store_id)), "stores-export.csv");
        break;
    }
    setSelected(new Set());
    setShowBulkMenu(false);
  }

  function handleExportAll() {
    exportCSV(sorted.map(({ store_id, brand_name, domain, city, province, niche, status, gmb_status, rev_7d, orders_7d, aov, refund_rate, days_live, blog_posts_count, products_count }) =>
      ({ store_id, brand_name, domain, city, province, niche, status, gmb_status, rev_7d, orders_7d, aov, refund_rate, days_live, blog_posts_count, products_count })
    ), "all-stores.csv");
  }

  // When user clicks a store in the list, find the latest version from context
  function openDetail(store) {
    const fresh = stores.find((s) => s.store_id === store.store_id) || store;
    setDetailStore(fresh);
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{sorted.length} stores</span>
          {filtered.length !== stores.length && (
            <span className="text-xs text-indigo-400 bg-indigo-900/30 px-2 py-0.5 rounded-full">filtered</span>
          )}
          {selected.size > 0 && (
            <span className="text-xs text-yellow-400 bg-yellow-900/30 px-2 py-0.5 rounded-full">{selected.size} selected</span>
          )}
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <input
            type="text"
            placeholder="Search brand, city, domain..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-indigo-500 w-52"
          />
          {/* Bulk actions */}
          {selected.size > 0 && (
            <div className="relative">
              <button onClick={() => setShowBulkMenu(!showBulkMenu)} className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">
                Bulk Actions ({selected.size})
              </button>
              {showBulkMenu && (
                <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 z-20 w-40">
                  <button onClick={() => bulkAction("pause")} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700">Pause selected</button>
                  <button onClick={() => bulkAction("resume")} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700">Resume selected</button>
                  <button onClick={() => bulkAction("flag")} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700">Flag for review</button>
                  <button onClick={() => bulkAction("export")} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700">Export selected CSV</button>
                  <hr className="border-gray-700 my-1" />
                  <button onClick={() => bulkAction("kill")} className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-gray-700">Mark as dead</button>
                </div>
              )}
            </div>
          )}
          <button onClick={handleExportAll} className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors">
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px]">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-700 bg-gray-800/80">
                <th className="px-3 py-3 w-8">
                  <input type="checkbox" checked={selected.size === pageData.length && pageData.length > 0} onChange={toggleSelectAll} className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-700 text-indigo-500" />
                </th>
                <th className="px-3 py-3 cursor-pointer hover:text-gray-200" onClick={() => toggleSort("brand_name")}>
                  Store <SortIcon col="brand_name" />
                </th>
                <th className="px-3 py-3">City</th>
                <th className="px-3 py-3">Niche</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">GMB</th>
                <th className="px-3 py-3 cursor-pointer hover:text-gray-200 text-right" onClick={() => toggleSort("rev_7d")}>
                  Rev 7d <SortIcon col="rev_7d" />
                </th>
                <th className="px-3 py-3 cursor-pointer hover:text-gray-200 text-right" onClick={() => toggleSort("orders_7d")}>
                  Orders <SortIcon col="orders_7d" />
                </th>
                <th className="px-3 py-3 cursor-pointer hover:text-gray-200 text-right" onClick={() => toggleSort("aov")}>
                  AOV <SortIcon col="aov" />
                </th>
                <th className="px-3 py-3 cursor-pointer hover:text-gray-200 text-right" onClick={() => toggleSort("days_live")}>
                  Days <SortIcon col="days_live" />
                </th>
                <th className="px-3 py-3 text-right">Refund</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/40">
              {pageData.map((s) => {
                const niche = NICHE_MAP[s.niche_id];
                const nicheIdx = NICHES.findIndex((n) => n.id === s.niche_id);
                const isSelected = selected.has(s.store_id);
                return (
                  <tr key={s.store_id} className={`hover:bg-gray-700/30 transition-colors cursor-pointer ${s.shopify_flagged ? "bg-red-900/10" : ""} ${isSelected ? "bg-indigo-900/15" : ""}`} onClick={() => openDetail(s)}>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(s.store_id)} className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-700 text-indigo-500" />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        {s.shopify_flagged && <span title="Shopify flagged" className="text-red-400 text-xs">!</span>}
                        <div>
                          <p className="text-gray-200 font-medium text-xs leading-tight">{s.brand_name}</p>
                          <p className="text-gray-500 text-xs">{s.domain}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="text-gray-300 text-xs">{s.city}</p>
                      <p className="text-gray-500 text-xs">{s.province}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs" style={{ color: NICHE_COLORS[nicheIdx] }}>
                        {niche?.emoji} {niche?.name.split(" ")[0]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5"><StatusBadge status={s.status} /></td>
                    <td className="px-3 py-2.5"><GmbBadge status={s.gmb_status} /></td>
                    <td className="px-3 py-2.5 text-right">
                      <span className={`font-semibold text-xs ${s.rev_7d > 500 ? "text-green-400" : s.rev_7d > 100 ? "text-white" : "text-gray-400"}`}>
                        {fmt.currency(s.rev_7d)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-300 text-xs">{s.orders_7d}</td>
                    <td className="px-3 py-2.5 text-right text-gray-300 text-xs">{fmt.currencyFull(s.aov)}</td>
                    <td className="px-3 py-2.5 text-right text-gray-400 text-xs">{s.days_live}d</td>
                    <td className="px-3 py-2.5 text-right">
                      <span className={`text-xs ${s.refund_rate > 0.05 ? "text-red-400" : "text-gray-400"}`}>
                        {fmt.pct(s.refund_rate)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700 bg-gray-800/60">
          <span className="text-xs text-gray-400">
            {sorted.length > 0 ? `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, sorted.length)} of ${sorted.length}` : "0 results"}
          </span>
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1 text-xs rounded-lg bg-gray-700 text-gray-300 disabled:opacity-30 hover:bg-gray-600 transition-colors">
              Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
              if (p >= totalPages) return null;
              return (
                <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 text-xs rounded-lg transition-colors ${p === page ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}>
                  {p + 1}
                </button>
              );
            })}
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-3 py-1 text-xs rounded-lg bg-gray-700 text-gray-300 disabled:opacity-30 hover:bg-gray-600 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Store Detail Modal */}
      {detailStore && <StoreDetail store={stores.find((s) => s.store_id === detailStore.store_id) || detailStore} onClose={() => setDetailStore(null)} />}
    </div>
  );
}
