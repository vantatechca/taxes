import { useState } from "react";
import { useNotifications } from "../context/NotificationContext.jsx";

const LEVEL_STYLES = {
  info: "border-blue-500/40 bg-blue-900/30 text-blue-300",
  success: "border-green-500/40 bg-green-900/30 text-green-300",
  warning: "border-yellow-500/40 bg-yellow-900/30 text-yellow-300",
  error: "border-red-500/40 bg-red-900/30 text-red-300",
};

const LEVEL_ICONS = { info: "i", success: "\u2713", warning: "!", error: "\u2717" };

export function ToastContainer() {
  const { toasts, dismissToast } = useNotifications();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] space-y-2 max-w-sm">
      {toasts.map((t) => (
        <div key={t.id} className={`flex items-start gap-2 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm text-sm animate-slide-up ${LEVEL_STYLES[t.level] || LEVEL_STYLES.info}`}>
          <span className="font-bold text-xs mt-0.5 shrink-0">{LEVEL_ICONS[t.level] || "i"}</span>
          <span className="flex-1">{t.message}</span>
          <button onClick={() => dismissToast(t.id)} className="opacity-60 hover:opacity-100 text-xs leading-none ml-2">&times;</button>
        </div>
      ))}
    </div>
  );
}

export function NotificationBell() {
  const { history, unreadCount, markAllRead, clearHistory } = useNotifications();
  const [open, setOpen] = useState(false);

  function toggle() {
    setOpen(!open);
    if (!open) markAllRead();
  }

  return (
    <div className="relative">
      <button onClick={toggle} className="text-gray-400 hover:text-white transition-colors relative" title="Notifications">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              {history.length > 0 && (
                <button onClick={clearHistory} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Clear all</button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {history.length === 0 ? (
                <p className="px-4 py-6 text-sm text-gray-500 text-center">No notifications yet</p>
              ) : (
                history.map((n) => (
                  <div key={n.id} className="px-4 py-2.5 border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors">
                    <p className="text-xs text-gray-300">{n.message}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">{new Date(n.timestamp).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
