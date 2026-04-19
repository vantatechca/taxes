import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useStorage } from "../hooks/useStorage.js";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [history, setHistory] = useStorage("notification_history", []);
  const [unreadCount, setUnreadCount] = useState(0);
  const nextIdRef = useRef(null);
  if (nextIdRef.current === null) {
    nextIdRef.current = Math.max(0, ...history.map((n) => n.id || 0)) + 1;
  }

  // Auto-dismiss toasts after 4s
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 4000);
    return () => clearTimeout(timer);
  }, [toasts]);

  const notify = useCallback((message, level = "info") => {
    const id = nextIdRef.current++;
    const entry = { id, message, level, timestamp: new Date().toISOString() };
    setToasts((prev) => [...prev, entry]);
    setHistory((prev) => [entry, ...prev].slice(0, 50));
    setUnreadCount((c) => c + 1);
    return id;
  }, [setHistory]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setUnreadCount(0);
  }, [setHistory]);

  return (
    <NotificationContext.Provider value={{ toasts, history, unreadCount, notify, dismissToast, markAllRead, clearHistory }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
