import { useState, useEffect, useCallback } from "react";

const API = "";

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function ErrorMsg({ message, onDismiss }) {
  useEffect(() => {
    if (message) {
      const t = setTimeout(onDismiss, 5000);
      return () => clearTimeout(t);
    }
  }, [message, onDismiss]);
  if (!message) return null;
  return (
    <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-2 text-sm text-red-400 flex items-center justify-between">
      <span>{message}</span>
      <button onClick={onDismiss} className="text-red-400 hover:text-red-300 ml-3">&times;</button>
    </div>
  );
}

const SCHEDULE_TYPES = [
  { value: "etsy_search", label: "Etsy Search Scan" },
  { value: "etsy_shop", label: "Etsy Shop Re-scan" },
  { value: "trend_check", label: "Trend Check" },
  { value: "full_cycle", label: "Full Research Cycle" },
];

const FREQUENCY_PRESETS = [
  { value: "0 * * * *", label: "Every hour" },
  { value: "0 */6 * * *", label: "Every 6 hours" },
  { value: "0 9 * * *", label: "Daily (9 AM)" },
  { value: "0 9 * * 1", label: "Weekly (Mon 9 AM)" },
  { value: "custom", label: "Custom" },
];

function cronToHuman(cron) {
  if (!cron) return "Unknown";
  const parts = cron.split(" ");
  if (parts.length !== 5) return cron;

  const [min, hour, dom, mon, dow] = parts;

  if (min === "0" && hour === "*") return "Every hour";
  if (min === "0" && hour.startsWith("*/")) return `Every ${hour.slice(2)} hours`;
  if (min === "0" && hour !== "*" && dom === "*" && mon === "*" && dow === "*")
    return `Daily at ${hour}:00`;
  if (min === "0" && hour !== "*" && dow === "1" && dom === "*")
    return `Weekly (Mon) at ${hour}:00`;
  if (min === "0" && hour !== "*" && dow === "1-5")
    return `Weekdays at ${hour}:00`;
  return cron;
}

function StatusBadge({ status }) {
  const isActive = (status || "").toLowerCase() === "active";
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
        isActive
          ? "bg-green-900/50 text-green-400 border border-green-700"
          : "bg-yellow-900/50 text-yellow-400 border border-yellow-700"
      }`}
    >
      {isActive ? "🟢" : "🟡"} {isActive ? "Active" : "Paused"}
    </span>
  );
}

const EMPTY_FORM = {
  name: "",
  type: "etsy_search",
  frequency: "0 9 * * *",
  customCron: "",
  config: {
    queries: "",
    pages: 3,
    shop_urls: "",
    keywords: "",
  },
};

export default function ScheduleManager() {
  const [schedules, setSchedules] = useState([]);
  const [costData, setCostData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState("");

  const clearError = useCallback(() => setError(""), []);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [schedRes, costRes] = await Promise.all([
        fetch(`${API}/api/schedules`),
        fetch(`${API}/api/schedules/cost`),
      ]);
      if (schedRes.ok) {
        const d = await schedRes.json();
        setSchedules(Array.isArray(d) ? d : d.schedules || []);
      }
      if (costRes.ok) {
        const d = await costRes.json();
        setCostData(d);
      }
    } catch (err) {
      setError("Failed to load schedules");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError("Schedule name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const cron = form.frequency === "custom" ? form.customCron : form.frequency;
      const body = {
        name: form.name,
        type: form.type,
        cron,
        config: form.config,
      };

      let res;
      if (editingId) {
        res = await fetch(`${API}/api/schedules/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`${API}/api/schedules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      if (!res.ok) throw new Error("Save failed");
      setShowForm(false);
      setForm({ ...EMPTY_FORM });
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(sched) {
    const presetMatch = FREQUENCY_PRESETS.find(
      (p) => p.value === sched.cron
    );
    setForm({
      name: sched.name || "",
      type: sched.type || "etsy_search",
      frequency: presetMatch ? sched.cron : "custom",
      customCron: presetMatch ? "" : sched.cron || "",
      config: sched.config || { queries: "", pages: 3, shop_urls: "", keywords: "" },
    });
    setEditingId(sched.id || sched._id);
    setShowForm(true);
  }

  async function handleDelete(id) {
    try {
      await fetch(`${API}/api/schedules/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleTogglePause(sched) {
    const id = sched.id || sched._id;
    const isActive = (sched.status || "").toLowerCase() === "active";
    setActionLoading(id);
    try {
      const endpoint = isActive ? "pause" : "resume";
      const res = await fetch(`${API}/api/schedules/${id}/${endpoint}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`Failed to ${endpoint}`);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading("");
    }
  }

  async function handleRunNow(id) {
    setActionLoading(id);
    try {
      const res = await fetch(`${API}/api/schedules/${id}/run-now`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Run failed");
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading("");
    }
  }

  // Cost preview based on form
  function getCostPreview() {
    const cron = form.frequency === "custom" ? form.customCron : form.frequency;
    if (!cron) return null;

    const parts = cron.split(" ");
    if (parts.length !== 5) return null;

    let runsPerDay = 1;
    const [, hour] = parts;
    if (hour === "*") runsPerDay = 24;
    else if (hour.startsWith("*/")) runsPerDay = Math.floor(24 / parseInt(hour.slice(2)));

    let requestsPerRun = 1;
    if (form.type === "etsy_search") {
      const queryCount = (form.config.queries || "")
        .split(",")
        .filter((q) => q.trim()).length || 1;
      requestsPerRun = queryCount * (form.config.pages || 3);
    } else if (form.type === "etsy_shop") {
      requestsPerRun = (form.config.shop_urls || "")
        .split("\n")
        .filter((u) => u.trim()).length || 1;
    } else if (form.type === "trend_check") {
      requestsPerRun = (form.config.keywords || "")
        .split(",")
        .filter((k) => k.trim()).length || 1;
    } else if (form.type === "full_cycle") {
      requestsPerRun = 10;
    }

    return {
      runsPerDay,
      requestsPerDay: runsPerDay * requestsPerRun,
      proxiesUsed: runsPerDay * requestsPerRun,
    };
  }

  const costPreview = getCostPreview();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
        <span className="ml-2 text-slate-400">Loading schedules...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ErrorMsg message={error} onDismiss={clearError} />

      {/* Cost Dashboard */}
      {costData && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-700/40">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cost Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600/50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Runs / Day</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {costData.runs_per_day || costData.runsPerDay || 0}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600/50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Requests / Day</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {costData.requests_per_day || costData.requestsPerDay || 0}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600/50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Est. Cost / Day</p>
              <p className="text-lg font-bold text-green-400">
                ${(costData.cost_per_day || costData.costPerDay || 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600/50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Est. Cost / Month</p>
              <p className="text-lg font-bold text-green-400">
                ${(costData.cost_per_month || costData.costPerMonth || 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Breakdown by schedule */}
          {costData.breakdown && Array.isArray(costData.breakdown) && costData.breakdown.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700/40">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">Breakdown by Schedule</h3>
              <div className="space-y-2">
                {costData.breakdown.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">{item.name}</span>
                    <span className="text-gray-300">{item.runs || 0} runs/day &middot; ${(item.cost || 0).toFixed(2)}/day</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Schedules */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-700/40">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Schedules ({schedules.length})</h2>
          <button
            onClick={() => {
              setForm({ ...EMPTY_FORM });
              setEditingId(null);
              setShowForm(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-gray-900 dark:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Create Schedule
          </button>
        </div>

        {schedules.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-slate-500 py-4">No schedules configured yet.</p>
        ) : (
          <div className="space-y-3">
            {schedules.map((sched) => {
              const schedId = sched.id || sched._id;
              const isActive = (sched.status || "").toLowerCase() === "active";

              return (
                <div
                  key={schedId}
                  className="bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600/50 rounded-xl p-4"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{sched.name}</h3>
                        <StatusBadge status={sched.status} />
                        <span className="text-xs bg-slate-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                          {SCHEDULE_TYPES.find((t) => t.value === sched.type)?.label || sched.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{"⏰"} {cronToHuman(sched.cron)}</span>
                        {sched.last_run && (
                          <span>Last: {new Date(sched.last_run).toLocaleString()}</span>
                        )}
                        {sched.next_run && (
                          <span>Next: {new Date(sched.next_run).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePause(sched)}
                        disabled={actionLoading === schedId}
                        className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-gray-900 dark:text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        {actionLoading === schedId && <Spinner />}
                        {isActive ? "Pause" : "Resume"}
                      </button>
                      <button
                        onClick={() => handleRunNow(schedId)}
                        disabled={actionLoading === schedId}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-gray-900 dark:text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        {actionLoading === schedId && <Spinner />}
                        Run Now
                      </button>
                      <button
                        onClick={() => handleEdit(sched)}
                        className="bg-slate-700 hover:bg-slate-600 text-gray-900 dark:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(schedId)}
                        className="bg-red-600 hover:bg-red-500 text-gray-900 dark:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Schedule Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-700/40">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingId ? "Edit Schedule" : "Create Schedule"}
          </h2>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Schedule name"
                className="w-full bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600/50 rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                className="w-full bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600/50 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-gray-300 focus:outline-none focus:border-indigo-500"
              >
                {SCHEDULE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Config (dynamic based on type) */}
            <div className="bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600/50 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-300">Configuration</h3>

              {(form.type === "etsy_search" || form.type === "full_cycle") && (
                <>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">
                      Search Queries (comma separated)
                    </label>
                    <input
                      type="text"
                      value={form.config.queries}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          config: { ...p.config, queries: e.target.value },
                        }))
                      }
                      placeholder="digital planner, printable art, SVG bundle..."
                      className="w-full bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600/50 rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">
                      Pages per Query
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={form.config.pages}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          config: {
                            ...p.config,
                            pages: Math.max(1, Math.min(10, parseInt(e.target.value) || 1)),
                          },
                        }))
                      }
                      className="w-24 bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600/50 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 text-center focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {(form.type === "etsy_shop" || form.type === "full_cycle") && (
                <div>
                  <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">
                    Shop URLs (one per line)
                  </label>
                  <textarea
                    value={form.config.shop_urls}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        config: { ...p.config, shop_urls: e.target.value },
                      }))
                    }
                    placeholder="https://www.etsy.com/shop/ShopName"
                    rows={3}
                    className="w-full bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600/50 rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-none"
                  />
                </div>
              )}

              {(form.type === "trend_check" || form.type === "full_cycle") && (
                <div>
                  <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">
                    Keywords (comma separated)
                  </label>
                  <input
                    type="text"
                    value={form.config.keywords}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        config: { ...p.config, keywords: e.target.value },
                      }))
                    }
                    placeholder="digital planner, printable wall art..."
                    className="w-full bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600/50 rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Frequency</label>
              <div className="flex flex-wrap gap-2">
                {FREQUENCY_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() =>
                      setForm((p) => ({ ...p, frequency: preset.value }))
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                      form.frequency === preset.value
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-slate-800 border-gray-200 dark:border-slate-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-200 dark:hover:bg-slate-700/70"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {form.frequency === "custom" && (
                <input
                  type="text"
                  value={form.customCron}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, customCron: e.target.value }))
                  }
                  placeholder="Cron expression (e.g., 0 */2 * * *)"
                  className="mt-2 w-full bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600/50 rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono text-sm"
                />
              )}
            </div>

            {/* Cost Preview */}
            {costPreview && (
              <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-3">
                <p className="text-xs text-slate-400">
                  This schedule will run ~<span className="text-white font-medium">{costPreview.runsPerDay}</span> times/day,
                  make ~<span className="text-white font-medium">{costPreview.requestsPerDay}</span> requests,
                  using ~<span className="text-white font-medium">{costPreview.proxiesUsed}</span> proxies
                </p>
              </div>
            )}

            {/* Form actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-gray-900 dark:text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                {saving && <Spinner />}
                {editingId ? "Update" : "Create"} Schedule
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="bg-slate-700 hover:bg-slate-600 text-gray-900 dark:text-white px-5 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
