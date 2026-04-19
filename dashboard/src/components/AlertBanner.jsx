import { useData } from "../context/DataContext.jsx";
import { ALERT_STYLES } from "../utils/formatters.js";

export default function AlertBanner() {
  const { alerts, dismissAlert } = useData();
  const critical = alerts.filter((a) => a.level === "critical");

  if (critical.length === 0) return null;

  return (
    <div className="bg-red-900/30 border-b border-red-500/30 px-6 py-2 flex items-center gap-3 overflow-x-auto">
      <span className="text-red-400 text-xs font-bold uppercase tracking-wider shrink-0">Critical:</span>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {critical.slice(0, 3).map((a, i) => {
          const origIdx = alerts.indexOf(a);
          return (
            <div key={i} className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-red-300">{a.message}</span>
              <button onClick={() => dismissAlert(origIdx)} className="text-red-500 hover:text-red-300 text-xs leading-none">&times;</button>
              {i < Math.min(critical.length, 3) - 1 && <span className="text-red-800">|</span>}
            </div>
          );
        })}
      </div>
      {critical.length > 3 && <span className="text-xs text-red-500 shrink-0">+{critical.length - 3} more</span>}
    </div>
  );
}
