import { createContext, useContext, useMemo, useCallback } from "react";
import { useStorage, mergeEdits } from "../hooks/useStorage.js";
import { STORES as SEED_STORES, NICHES as SEED_NICHES, CITIES, generateAlerts } from "../data/seedData.js";

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

export function DataProvider({ children }) {
  // Store edits: { [store_id]: { field: newValue, ... } }
  const [storeEdits, setStoreEdits] = useStorage("store_edits", {});
  // Added stores (user-created)
  const [addedStores, setAddedStores] = useStorage("added_stores", []);
  // Niche edits: { [niche_id]: { field: newValue, ... } }
  const [nicheEdits, setNicheEdits] = useStorage("niche_edits", {});
  // Financial config (fully editable)
  const [financialConfig, setFinancialConfig] = useStorage("financial_config", DEFAULT_FINANCIAL_CONFIG);
  // Content logs
  const [contentLogs, setContentLogs] = useStorage("content_logs", []);
  // CS tickets (user-created)
  const [csTickets, setCsTickets] = useStorage("cs_tickets", []);
  // Dismissed alert keys
  const [dismissedAlerts, setDismissedAlerts] = useStorage("dismissed_alerts", []);
  // Store checklist overrides: { [store_id]: { domain: true, ... } }
  const [checklists, setChecklists] = useStorage("store_checklists", {});
  // Notes per store
  const [storeNotes, setStoreNotes] = useStorage("store_notes", {});

  // Merge seed data with user edits
  const stores = useMemo(() => {
    const merged = mergeEdits(SEED_STORES, storeEdits, "store_id");
    return [...merged, ...addedStores];
  }, [storeEdits, addedStores]);

  const niches = useMemo(() => {
    return SEED_NICHES.map((n) => {
      const edits = nicheEdits[n.id];
      return edits ? { ...n, ...edits } : n;
    });
  }, [nicheEdits]);

  const alerts = useMemo(() => {
    return generateAlerts().filter((a, i) => !dismissedAlerts.includes(i));
  }, [dismissedAlerts]);

  // --- Store actions ---
  const updateStore = useCallback((storeId, changes) => {
    setStoreEdits((prev) => ({
      ...prev,
      [storeId]: { ...(prev[storeId] || {}), ...changes },
    }));
  }, [setStoreEdits]);

  const bulkUpdateStores = useCallback((storeIds, changes) => {
    setStoreEdits((prev) => {
      const next = { ...prev };
      storeIds.forEach((id) => {
        next[id] = { ...(next[id] || {}), ...changes };
      });
      return next;
    });
  }, [setStoreEdits]);

  const addStore = useCallback((store) => {
    setAddedStores((prev) => [...prev, store]);
  }, [setAddedStores]);

  const deleteStore = useCallback((storeId) => {
    // Remove from added stores if user-created
    setAddedStores((prev) => prev.filter((s) => s.store_id !== storeId));
    // Mark seed store as dead
    setStoreEdits((prev) => ({
      ...prev,
      [storeId]: { ...(prev[storeId] || {}), status: "dead" },
    }));
  }, [setAddedStores, setStoreEdits]);

  // --- Niche actions ---
  const updateNiche = useCallback((nicheId, changes) => {
    setNicheEdits((prev) => ({
      ...prev,
      [nicheId]: { ...(prev[nicheId] || {}), ...changes },
    }));
  }, [setNicheEdits]);

  // --- Content actions ---
  const addContentLog = useCallback((entry) => {
    setContentLogs((prev) => [{ ...entry, id: Date.now(), logged_at: new Date().toISOString() }, ...prev]);
  }, [setContentLogs]);

  const deleteContentLog = useCallback((logId) => {
    setContentLogs((prev) => prev.filter((l) => l.id !== logId));
  }, [setContentLogs]);

  // --- CS actions ---
  const addTicket = useCallback((ticket) => {
    setCsTickets((prev) => [{ ...ticket, id: Date.now(), created_at: new Date().toISOString(), status: "open" }, ...prev]);
  }, [setCsTickets]);

  const resolveTicket = useCallback((ticketId) => {
    setCsTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status: "resolved", resolved_at: new Date().toISOString() } : t));
  }, [setCsTickets]);

  // --- Alert actions ---
  const dismissAlert = useCallback((alertIndex) => {
    setDismissedAlerts((prev) => [...prev, alertIndex]);
  }, [setDismissedAlerts]);

  // --- Checklist actions ---
  const updateChecklist = useCallback((storeId, key, value) => {
    setChecklists((prev) => ({
      ...prev,
      [storeId]: { ...(prev[storeId] || {}), [key]: value },
    }));
  }, [setChecklists]);

  const getChecklist = useCallback((storeId) => {
    const defaults = {
      domain: false, shopify_live: false, products_uploaded: false,
      payments_active: false, gmb_active: false, blogs_published: false,
      email_sequences: false, cs_setup: false, gsc_verified: false,
    };
    return { ...defaults, ...(checklists[storeId] || {}) };
  }, [checklists]);

  // --- Notes actions ---
  const addNote = useCallback((storeId, note) => {
    setStoreNotes((prev) => ({
      ...prev,
      [storeId]: [...(prev[storeId] || []), { text: note, date: new Date().toISOString() }],
    }));
  }, [setStoreNotes]);

  // --- Reset ---
  const resetAll = useCallback(() => {
    setStoreEdits({});
    setAddedStores([]);
    setNicheEdits({});
    setFinancialConfig(DEFAULT_FINANCIAL_CONFIG);
    setContentLogs([]);
    setCsTickets([]);
    setDismissedAlerts([]);
    setChecklists({});
    setStoreNotes({});
  }, [setStoreEdits, setAddedStores, setNicheEdits, setFinancialConfig, setContentLogs, setCsTickets, setDismissedAlerts, setChecklists, setStoreNotes]);

  const value = {
    // Data
    stores, niches, cities: CITIES, alerts,
    financialConfig, contentLogs, csTickets, storeNotes,
    // Store actions
    updateStore, bulkUpdateStores, addStore, deleteStore,
    // Niche actions
    updateNiche,
    // Financial actions
    setFinancialConfig,
    // Content actions
    addContentLog, deleteContentLog,
    // CS actions
    addTicket, resolveTicket,
    // Alert actions
    dismissAlert,
    // Checklist
    updateChecklist, getChecklist,
    // Notes
    addNote,
    // Reset
    resetAll,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
