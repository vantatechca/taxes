import { useState } from "react";
import { DataProvider, useData } from "./context/DataContext.jsx";
import { ThemeProvider, useTheme } from "./context/ThemeContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import Overview from "./components/Overview.jsx";
import Niches from "./components/Niches.jsx";
import Cities from "./components/Cities.jsx";
import Stores from "./components/Stores.jsx";
import Content from "./components/Content.jsx";
import CS from "./components/CS.jsx";
import Financial from "./components/Financial.jsx";
import AlertBanner from "./components/AlertBanner.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import GlobalSearch from "./components/GlobalSearch.jsx";
import Research from "./components/Research/Research.jsx";
import BrandStudio from "./components/BrandStudio/BrandStudio.jsx";
import { NotificationBell, ToastContainer } from "./components/NotificationCenter.jsx";
import { NICHES, CITIES } from "./data/seedData.js";

const TABS = [
  { id: "overview", label: "Overview", icon: "\uD83D\uDCCA", roles: ["owner", "lead", "member"] },
  { id: "niches", label: "Niches", icon: "\uD83C\uDFF7\uFE0F", roles: ["owner", "lead"] },
  { id: "cities", label: "Cities", icon: "\uD83C\uDFD9\uFE0F", roles: ["owner", "lead"] },
  { id: "stores", label: "Stores", icon: "\uD83C\uDFEA", roles: ["owner", "lead"] },
  { id: "content", label: "Content", icon: "\uD83D\uDCDD", roles: ["owner", "lead", "member"] },
  { id: "cs", label: "CS", icon: "\uD83C\uDFA7", roles: ["owner", "lead", "member"] },
  { id: "financial", label: "Financial", icon: "\uD83D\uDCB0", roles: ["owner"] },
  { id: "research", label: "Research", icon: "\uD83D\uDD2C", roles: ["owner"] },
  { id: "brandstudio", label: "Brand Studio", icon: "\uD83C\uDFA8", roles: ["owner"] },
];

const ROLES = {
  owner: { name: "Andrei", role: "Owner", level: "owner" },
  lead_jerome: { name: "Jerome", role: "Team Lead", level: "lead" },
  lead_joanne: { name: "Joanne", role: "Team Lead", level: "lead" },
  member: { name: "Team Member", role: "Member", level: "member" },
};

const uniqueCities = [...new Set(CITIES.map((c) => c.name))].sort();

function AppInner() {
  const { stores, resetAll } = useData();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("overview");
  const [role, setRole] = useState("owner");
  const [filters, setFilters] = useState({ niche: "all", city: "all", status: "all", dateRange: "7d" });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const currentRole = ROLES[role];
  const visibleTabs = TABS.filter((t) => t.roles.includes(currentRole.level));

  // If current tab not visible for role, reset to first visible
  if (!visibleTabs.find((t) => t.id === activeTab)) {
    setActiveTab(visibleTabs[0]?.id || "overview");
  }

  function updateFilter(key, val) {
    setFilters((prev) => ({ ...prev, [key]: val }));
  }

  function renderTab() {
    switch (activeTab) {
      case "overview": return <Overview filters={filters} onNavigate={setActiveTab} />;
      case "niches": return <Niches filters={filters} />;
      case "cities": return <Cities filters={filters} />;
      case "stores": return <Stores filters={filters} />;
      case "content": return <Content filters={filters} />;
      case "cs": return <CS filters={filters} />;
      case "financial": return <Financial filters={filters} />;
      case "research": return <Research />;
      case "brandstudio": return <BrandStudio />;
      default: return <Overview filters={filters} onNavigate={setActiveTab} />;
    }
  }

  const storeCount = stores.length;
  const liveCount = stores.filter((s) => s.status === "live").length;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-56 translate-x-0" : "w-16 -translate-x-full md:translate-x-0"} fixed md:sticky top-0 h-screen bg-gray-950 border-r border-gray-800 flex flex-col transition-all duration-200 shrink-0 z-40`}>
        <div className="px-4 py-5 border-b border-gray-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">DE</div>
          {sidebarOpen && (
            <div>
              <p className="text-sm font-bold text-white leading-tight">Digital Empire</p>
              <p className="text-xs text-gray-500">Command Center</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-3 space-y-1 px-2">
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); if (window.innerWidth < 768) setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                {sidebarOpen && <span className="font-medium">{tab.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Reset data button */}

        {/* User */}
        <div className="border-t border-gray-800 px-3 py-3">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                {currentRole.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-200 truncate">{currentRole.name}</p>
                <p className="text-xs text-gray-500">{currentRole.role}</p>
              </div>
            </div>
          ) : (
            <div className="w-7 h-7 mx-auto rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">
              {currentRole.name.charAt(0)}
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-0">
        {/* Alert banner */}
        <AlertBanner />

        {/* Top bar */}
        <header className="bg-gray-950/80 backdrop-blur-sm border-b border-gray-800 px-4 md:px-6 py-3 flex items-center gap-2 md:gap-4 sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <button onClick={toggleTheme} className="text-gray-400 hover:text-white transition-colors" title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
            {theme === "dark" ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>

          {/* Global search */}
          <GlobalSearch onNavigate={setActiveTab} />

          <div className="flex-1" />

          {/* Notification bell */}
          <NotificationBell />

          {/* Global filters */}
          <div className="flex items-center gap-2 flex-wrap overflow-x-auto">
            <select value={filters.niche} onChange={(e) => updateFilter("niche", e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500">
              <option value="all">All Niches</option>
              {NICHES.map((n) => <option key={n.id} value={n.id}>{n.emoji} {n.name}</option>)}
            </select>

            <select value={filters.city} onChange={(e) => updateFilter("city", e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500">
              <option value="all">All Cities</option>
              {uniqueCities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <select value={filters.status} onChange={(e) => updateFilter("status", e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500">
              <option value="all">All Status</option>
              <option value="live">Live</option>
              <option value="pending">Pending</option>
              <option value="paused">Paused</option>
              <option value="dead">Dead</option>
            </select>

            <select value={filters.dateRange} onChange={(e) => updateFilter("dateRange", e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500">
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All Time</option>
            </select>

            <select value={role} onChange={(e) => setRole(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500">
              <option value="owner">Andrei (Owner)</option>
              <option value="lead_jerome">Jerome (Lead)</option>
              <option value="lead_joanne">Joanne (Lead)</option>
              <option value="member">Team Member</option>
            </select>
          </div>
        </header>

        {/* Page title */}
        <div className="px-4 md:px-6 pt-5 pb-2">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            {TABS.find((t) => t.id === activeTab)?.icon}
            {TABS.find((t) => t.id === activeTab)?.label}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {filters.niche !== "all" || filters.city !== "all" || filters.status !== "all"
              ? "Filtered view"
              : `${storeCount} stores \u00B7 ${liveCount} live \u00B7 12 niches \u00B7 50 cities`}
          </p>
        </div>

        <main className="flex-1 px-4 md:px-6 pb-8">
          <ErrorBoundary>
            {renderTab()}
          </ErrorBoundary>
        </main>

        <footer className="border-t border-gray-800 px-4 md:px-6 py-3 text-xs text-gray-600 flex items-center justify-between">
          <span>Digital Products Empire — Phase 5</span>
          <span>Edits persist in localStorage</span>
        </footer>
      </div>

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <DataProvider>
          <AppInner />
        </DataProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
