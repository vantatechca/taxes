import { useState, useMemo, useRef, useEffect } from "react";
import { useData } from "../context/DataContext.jsx";
import { NICHES, CITIES } from "../data/seedData.js";
import { fmt } from "../utils/formatters.js";

export default function GlobalSearch({ onNavigate }) {
  const { stores } = useData();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const results = useMemo(() => {
    if (!query || query.length < 2) return { stores: [], niches: [], cities: [] };
    const q = query.toLowerCase();

    const matchedStores = stores
      .filter((s) => s.brand_name.toLowerCase().includes(q) || s.domain.toLowerCase().includes(q) || s.city.toLowerCase().includes(q))
      .slice(0, 8);

    const matchedNiches = NICHES.filter((n) => n.name.toLowerCase().includes(q) || n.slug.includes(q));

    const matchedCities = CITIES.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 6);

    return { stores: matchedStores, niches: matchedNiches, cities: matchedCities };
  }, [query, stores]);

  const hasResults = results.stores.length > 0 || results.niches.length > 0 || results.cities.length > 0;

  function handleSelect(type, item) {
    setOpen(false);
    setQuery("");
    if (type === "store") onNavigate?.("stores");
    else if (type === "niche") onNavigate?.("niches");
    else if (type === "city") onNavigate?.("cities");
  }

  if (!open) {
    return (
      <button onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }} className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="hidden md:inline">Search...</span>
        <kbd className="hidden md:inline px-1.5 py-0.5 bg-gray-700 rounded text-[10px] text-gray-400 font-mono ml-2">{"\u2318K"}</kbd>
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => { setOpen(false); setQuery(""); }} />
      <div ref={containerRef} className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
            <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stores, niches, cities..."
              className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-500 focus:outline-none"
              autoFocus
            />
            <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] text-gray-500 font-mono">ESC</kbd>
          </div>

          {query.length >= 2 && (
            <div className="max-h-80 overflow-y-auto">
              {!hasResults && (
                <p className="px-4 py-6 text-sm text-gray-500 text-center">No results for &ldquo;{query}&rdquo;</p>
              )}

              {results.stores.length > 0 && (
                <div className="px-2 py-2">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider px-2 mb-1">Stores</p>
                  {results.stores.map((s) => (
                    <button key={s.store_id} onClick={() => handleSelect("store", s)} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-left">
                      <span className="text-xs text-gray-300 font-medium">{s.brand_name}</span>
                      <span className="text-xs text-gray-600">{s.domain}</span>
                      <span className="ml-auto text-xs text-gray-500">{s.city}</span>
                      <span className="text-xs text-green-400 font-medium">{fmt.currency(s.rev_7d)}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.niches.length > 0 && (
                <div className="px-2 py-2 border-t border-gray-800">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider px-2 mb-1">Niches</p>
                  {results.niches.map((n) => (
                    <button key={n.id} onClick={() => handleSelect("niche", n)} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-left">
                      <span>{n.emoji}</span>
                      <span className="text-xs text-gray-300 font-medium">{n.name}</span>
                      <span className="text-xs text-gray-600">{n.brand}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.cities.length > 0 && (
                <div className="px-2 py-2 border-t border-gray-800">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider px-2 mb-1">Cities</p>
                  {results.cities.map((c) => (
                    <button key={c.name} onClick={() => handleSelect("city", c)} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-left">
                      <span className="text-xs text-gray-300 font-medium">{c.name}</span>
                      <span className="text-xs text-gray-600">{c.province}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
