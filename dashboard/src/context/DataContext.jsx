import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useStorage } from "../hooks/useStorage.js";
import { STORES as SEED_STORES, NICHES as SEED_NICHES, CITIES, generateAlerts } from "../data/seedData.js";

const API = "";

function apiFetch(url, options = {}) {
  const token = localStorage.getItem('de_token');
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}

const DataContext = createContext(null);

const DEFAULT_FINANCIAL_CONFIG = {
  shopify_per_store: 39,
  domain_per_store_monthly: 1.5,
  apps_total: 1200,
  team_salaries: 85000,
  misc: 500,
  ad_spend: 0,
  payment_processing_rate: 0.029,
  payment_processing_fixed: 0.30,
  team_size: 42,
};

const CHECKLIST_DEFAULTS = {
  domain: false, shopify_live: false, products_uploaded: false,
  payments_active: false, gmb_active: false, blogs_published: false,
  email_sequences: false, cs_setup: false, gsc_verified: false,
};

export function DataProvider({ children }) {
  const [stores, setStores] = useState([]);
  const [contentLogs, setContentLogs] = useState([]);
  const [csTickets, setCsTickets] = useState([]);
  const [financialConfig, setFinancialConfigState] = useState(DEFAULT_FINANCIAL_CONFIG);
  const [checklists, setChecklists] = useState({});
  const [storeNotes, setStoreNotes] = useState({});
  const [loading, setLoading] = useState(true);

  // Keep niche edits in localStorage (static data, minor overrides)
  const [nicheEdits, setNicheEdits] = useStorage("niche_edits", {});
  const [dismissedAlerts, setDismissedAlerts] = useStorage("dismissed_alerts", []);

  // Load all data from Neon on mount
  useEffect(() => {
    async function loadAll() {
      try {
        const [storesRes, contentRes, ticketsRes, financialRes, checklistsRes, notesRes] = await Promise.all([
          apiFetch(`${API}/api/data/stores`),
          apiFetch(`${API}/api/data/content`),
          apiFetch(`${API}/api/data/tickets`),
          apiFetch(`${API}/api/data/financial`),
          apiFetch(`${API}/api/data/checklists`),
          apiFetch(`${API}/api/data/notes`),
        ]);

        const [storesData, contentData, ticketsData, financialData, checklistsData, notesData] = await Promise.all([
          storesRes.json(), contentRes.json(), ticketsRes.json(),
          financialRes.json(), checklistsRes.json(), notesRes.json(),
        ]);

        let loadedStores = storesData.stores || [];

        // Seed mock stores only if VITE_MOCK_DATA=true and Neon is empty
        const mockEnabled = import.meta.env.VITE_MOCK_DATA === "true";
        if (loadedStores.length === 0 && mockEnabled) {
          const seedRes = await apiFetch(`${API}/api/data/stores/seed`, {
            method: "POST",
            body: JSON.stringify({ stores: SEED_STORES }),
          });
          const seedData = await seedRes.json();
          if (seedData.success) loadedStores = SEED_STORES;
        }

        setStores(loadedStores);
        setContentLogs(contentData.logs || []);
        setCsTickets(ticketsData.tickets || []);
        setFinancialConfigState(financialData.config || DEFAULT_FINANCIAL_CONFIG);
        setChecklists(checklistsData.checklists || {});
        setStoreNotes(notesData.notes || {});
      } catch (err) {
        console.error('[DataContext] Failed to load data:', err.message);
        // Fallback to seed data if API fails
        setStores(SEED_STORES);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const niches = useMemo(() => {
    return SEED_NICHES.map((n) => {
      const edits = nicheEdits[n.id];
      return edits ? { ...n, ...edits } : n;
    });
  }, [nicheEdits]);

  const alerts = useMemo(() => {
    if (import.meta.env.VITE_MOCK_DATA !== "true") return [];
    return generateAlerts().filter((a, i) => !dismissedAlerts.includes(i));
  }, [dismissedAlerts]);

  // --- Store actions ---
  const updateStore = useCallback(async (storeId, changes) => {
    setStores((prev) => prev.map((s) => s.store_id === storeId ? { ...s, ...changes } : s));
    try {
      await apiFetch(`${API}/api/data/stores/${storeId}`, {
        method: "PUT",
        body: JSON.stringify(changes),
      });
    } catch (err) {
      console.error('[DataContext] updateStore failed:', err.message);
    }
  }, []);

  const bulkUpdateStores = useCallback(async (storeIds, changes) => {
    const idSet = new Set(storeIds);
    setStores((prev) => prev.map((s) => idSet.has(s.store_id) ? { ...s, ...changes } : s));
    try {
      await apiFetch(`${API}/api/data/stores/bulk-update`, {
        method: "POST",
        body: JSON.stringify({ ids: storeIds, changes }),
      });
    } catch (err) {
      console.error('[DataContext] bulkUpdateStores failed:', err.message);
    }
  }, []);

  const addStore = useCallback(async (store) => {
    setStores((prev) => [...prev, store]);
    try {
      await apiFetch(`${API}/api/data/stores`, {
        method: "POST",
        body: JSON.stringify(store),
      });
    } catch (err) {
      console.error('[DataContext] addStore failed:', err.message);
    }
  }, []);

  const deleteStore = useCallback(async (storeId) => {
    setStores((prev) => prev.filter((s) => s.store_id !== storeId));
    try {
      await apiFetch(`${API}/api/data/stores/${storeId}`, { method: "DELETE" });
    } catch (err) {
      console.error('[DataContext] deleteStore failed:', err.message);
    }
  }, []);

  // --- Niche actions ---
  const updateNiche = useCallback((nicheId, changes) => {
    setNicheEdits((prev) => ({ ...prev, [nicheId]: { ...(prev[nicheId] || {}), ...changes } }));
  }, [setNicheEdits]);

  // --- Content actions ---
  const addContentLog = useCallback(async (entry) => {
    const newEntry = { ...entry, id: Date.now(), logged_at: new Date().toISOString() };
    setContentLogs((prev) => [newEntry, ...prev]);
    try {
      await apiFetch(`${API}/api/data/content`, {
        method: "POST",
        body: JSON.stringify(entry),
      });
    } catch (err) {
      console.error('[DataContext] addContentLog failed:', err.message);
    }
  }, []);

  const deleteContentLog = useCallback(async (logId) => {
    setContentLogs((prev) => prev.filter((l) => l.id !== logId));
    try {
      await apiFetch(`${API}/api/data/content/${logId}`, { method: "DELETE" });
    } catch (err) {
      console.error('[DataContext] deleteContentLog failed:', err.message);
    }
  }, []);

  // --- CS actions ---
  const addTicket = useCallback(async (ticket) => {
    const newTicket = { ...ticket, id: Date.now(), created_at: new Date().toISOString(), status: "open" };
    setCsTickets((prev) => [newTicket, ...prev]);
    try {
      await apiFetch(`${API}/api/data/tickets`, {
        method: "POST",
        body: JSON.stringify(ticket),
      });
    } catch (err) {
      console.error('[DataContext] addTicket failed:', err.message);
    }
  }, []);

  const resolveTicket = useCallback(async (ticketId) => {
    setCsTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status: "resolved", resolved_at: new Date().toISOString() } : t));
    try {
      await apiFetch(`${API}/api/data/tickets/${ticketId}`, {
        method: "PUT",
        body: JSON.stringify({ status: "resolved", resolved_at: new Date().toISOString() }),
      });
    } catch (err) {
      console.error('[DataContext] resolveTicket failed:', err.message);
    }
  }, []);

  // --- Financial actions ---
  const setFinancialConfig = useCallback(async (updater) => {
    setFinancialConfigState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      apiFetch(`${API}/api/data/financial`, {
        method: "PUT",
        body: JSON.stringify(next),
      }).catch((err) => console.error('[DataContext] setFinancialConfig failed:', err.message));
      return next;
    });
  }, []);

  // --- Alert actions ---
  const dismissAlert = useCallback((alertIndex) => {
    setDismissedAlerts((prev) => [...prev, alertIndex]);
  }, [setDismissedAlerts]);

  // --- Checklist actions ---
  const updateChecklist = useCallback(async (storeId, key, value) => {
    setChecklists((prev) => ({
      ...prev,
      [storeId]: { ...(prev[storeId] || {}), [key]: value },
    }));
    try {
      await apiFetch(`${API}/api/data/checklists/${storeId}`, {
        method: "PUT",
        body: JSON.stringify({ [key]: value }),
      });
    } catch (err) {
      console.error('[DataContext] updateChecklist failed:', err.message);
    }
  }, []);

  const getChecklist = useCallback((storeId) => {
    return { ...CHECKLIST_DEFAULTS, ...(checklists[storeId] || {}) };
  }, [checklists]);

  // --- Notes actions ---
  const addNote = useCallback(async (storeId, note) => {
    setStoreNotes((prev) => ({
      ...prev,
      [storeId]: [...(prev[storeId] || []), { text: note, date: new Date().toISOString() }],
    }));
    try {
      await apiFetch(`${API}/api/data/notes/${storeId}`, {
        method: "POST",
        body: JSON.stringify({ text: note }),
      });
    } catch (err) {
      console.error('[DataContext] addNote failed:', err.message);
    }
  }, []);

  const value = {
    stores, niches, cities: CITIES, alerts, loading,
    financialConfig, contentLogs, csTickets, storeNotes,
    updateStore, bulkUpdateStores, addStore, deleteStore,
    updateNiche,
    setFinancialConfig,
    addContentLog, deleteContentLog,
    addTicket, resolveTicket,
    dismissAlert,
    updateChecklist, getChecklist,
    addNote,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
