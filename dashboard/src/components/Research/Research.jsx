import { useState } from "react";
import EtsySpy from "./EtsySpy.jsx";
import TrendRadar from "./TrendRadar.jsx";
import PLRVault from "./PLRVault.jsx";
import Scoreboard from "./Scoreboard.jsx";
import ProxyManager from "./ProxyManager.jsx";
import ScheduleManager from "./ScheduleManager.jsx";
import ResearchAssistant from "./ResearchAssistant.jsx";
import Brain from "./Brain.jsx";
import MarketingEngine from "./MarketingEngine.jsx";

const SUB_TABS = [
  { id: "etsy", label: "Etsy Spy", icon: "🔍" },
  { id: "trends", label: "Trends", icon: "📈" },
  { id: "plr", label: "PLR Vault", icon: "📦" },
  { id: "scoreboard", label: "Scoreboard", icon: "🏆" },
  { id: "brain", label: "Brain", icon: "🧠" },
  { id: "marketing", label: "Marketing", icon: "🚀" },
  { id: "proxies", label: "Proxies", icon: "🌐" },
  { id: "schedules", label: "Schedules", icon: "⏰" },
];

export default function Research() {
  const [activeSubTab, setActiveSubTab] = useState("etsy");
  const [assistantOpen, setAssistantOpen] = useState(false);

  function renderSubTab() {
    switch (activeSubTab) {
      case "etsy":
        return <EtsySpy />;
      case "trends":
        return <TrendRadar />;
      case "plr":
        return <PLRVault />;
      case "brain":
        return <Brain />;
      case "scoreboard":
        return <Scoreboard />;
      case "marketing":
        return <MarketingEngine />;
      case "proxies":
        return <ProxyManager />;
      case "schedules":
        return <ScheduleManager />;
      default:
        return <EtsySpy />;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>🔬</span> Research Lab
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Find winning digital products
        </p>
      </div>

      {/* Sub-navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-700/40">
        {SUB_TABS.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-slate-800 text-indigo-400 border-b-2 border-indigo-500"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active sub-component */}
      <div>{renderSubTab()}</div>

      {/* AI Assistant floating button */}
      {!assistantOpen && (
        <button
          onClick={() => setAssistantOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-600/30 flex items-center justify-center text-2xl transition-all hover:scale-105 z-50"
          title="AI Research Assistant"
        >
          <span>🤖</span>
        </button>
      )}

      {/* AI Assistant panel */}
      {assistantOpen && (
        <ResearchAssistant onClose={() => setAssistantOpen(false)} />
      )}
    </div>
  );
}
