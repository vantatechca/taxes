import { useState, useEffect, useCallback, useMemo } from "react";

const API = "";
const PER_PAGE = 50;

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

function maskProxy(proxy) {
  if (!proxy) return "***";
  const str = typeof proxy === "string" ? proxy : proxy.host || proxy.address || "";
  if (str.length <= 10) return str;
  return str.slice(0, 6) + "***" + str.slice(-4);
}

function StatusBadge({ status }) {
  const config = {
    working: { label: "✅ Working", cls: "text-green-400" },
    failed: { label: "❌ Failed", cls: "text-red-400" },
    untested: { label: "⚪ Untested", cls: "text-slate-400" },
  };
  const s = (status || "untested").toLowerCase();
  const c = config[s] || config.untested;
  return <span className={`text-xs font-medium ${c.cls}`}>{c.label}</span>;
}

export default function ProxyManager() {
  const [proxies, setProxies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Bulk add
  const [bulkText, setBulkText] = useState("");
  const [adding, setAdding] = useState(false);

  // Testing
  const [testingId, setTestingId] = useState(null);
  const [testingAll, setTestingAll] = useState(false);
  const [testProgress, setTestProgress] = useState(0);

  // Pagination
  const [page, setPage] = useState(1);

  const clearError = useCallback(() => setError(""), []);

  useEffect(() => {
    fetchProxies();
  }, []);

  async function fetchProxies() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/proxies`);
      if (!res.ok) throw new Error("Failed to load proxies");
      const data = await res.json();
      setProxies(Array.isArray(data) ? data : data.proxies || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkAdd() {
    const lines = bulkText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/proxies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proxies: bulkText }),
      });
      if (!res.ok) throw new Error("Failed to add proxies");
      setBulkText("");
      await fetchProxies();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleTestOne(id) {
    setTestingId(id);
    try {
      const res = await fetch(`${API}/api/proxies/test/${id}`, { method: "POST" });
      if (!res.ok) throw new Error("Test failed");
      await fetchProxies();
    } catch (err) {
      setError(err.message);
    } finally {
      setTestingId(null);
    }
  }

  async function handleTestAll() {
    setTestingAll(true);
    setTestProgress(0);
    try {
      const res = await fetch(`${API}/api/proxies/test-all`, { method: "POST" });
      if (!res.ok) throw new Error("Test all failed");
      // Simulate progress
      let prog = 0;
      const interval = setInterval(() => {
        prog += Math.random() * 15;
        if (prog >= 100) {
          prog = 100;
          clearInterval(interval);
        }
        setTestProgress(Math.round(prog));
      }, 500);
      await fetchProxies();
      clearInterval(interval);
      setTestProgress(100);
    } catch (err) {
      setError(err.message);
    } finally {
      setTestingAll(false);
      setTestProgress(0);
    }
  }

  async function handleRemove(id) {
    try {
      await fetch(`${API}/api/proxies/${id}`, { method: "DELETE" });
      await fetchProxies();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemoveFailed() {
    const failed = proxies.filter(
      (p) => (p.status || "").toLowerCase() === "failed"
    );
    if (failed.length === 0) return;
    try {
      await Promise.all(
        failed.map((p) =>
          fetch(`${API}/api/proxies/${p.id || p._id}`, { method: "DELETE" })
        )
      );
      await fetchProxies();
    } catch (err) {
      setError(err.message);
    }
  }

  // Stats
  const stats = useMemo(() => {
    const total = proxies.length;
    const working = proxies.filter(
      (p) => (p.status || "").toLowerCase() === "working"
    ).length;
    const failed = proxies.filter(
      (p) => (p.status || "").toLowerCase() === "failed"
    ).length;
    const latencies = proxies
      .map((p) => p.latency || p.response_time)
      .filter((l) => l != null && l > 0);
    const avgLatency =
      latencies.length > 0
        ? Math.round(latencies.reduce((a, l) => a + l, 0) / latencies.length)
        : 0;

    return { total, working, failed, avgLatency };
  }, [proxies]);

  // Paginated proxies
  const totalPages = Math.max(1, Math.ceil(proxies.length / PER_PAGE));
  const paginatedProxies = proxies.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE
  );

  const bulkCount = bulkText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
        <span className="ml-2 text-slate-400">Loading proxies...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ErrorMsg message={error} onDismiss={clearError} />

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-2xl p-4 border border-slate-700/40 text-center">
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Total Proxies</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-4 border border-slate-700/40 text-center">
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Working</p>
          <p className="text-2xl font-bold text-green-400">{stats.working}</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-4 border border-slate-700/40 text-center">
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Failed</p>
          <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-4 border border-slate-700/40 text-center">
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Avg Latency</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.avgLatency > 0 ? `${stats.avgLatency}ms` : "-"}
          </p>
        </div>
      </div>

      {/* Bulk Add */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-700/40">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Proxies</h2>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder={"Paste proxies, one per line\nFormat: ip:port or ip:port:user:pass or http://user:pass@ip:port"}
          rows={5}
          className="w-full bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-600/50 rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-none font-mono"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-slate-500">
            {bulkCount > 0 ? `${bulkCount} proxies to add` : ""}
          </span>
          <button
            onClick={handleBulkAdd}
            disabled={adding || bulkCount === 0}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors text-sm"
          >
            {adding ? (
              <>
                <Spinner />
                Adding {bulkCount} proxies...
              </>
            ) : (
              "Add Proxies"
            )}
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-700/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Proxy List ({proxies.length})
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleTestAll}
              disabled={testingAll || proxies.length === 0}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              {testingAll ? <Spinner /> : null}
              Test All
            </button>
            <button
              onClick={handleRemoveFailed}
              disabled={stats.failed === 0}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Remove Failed ({stats.failed})
            </button>
          </div>
        </div>

        {/* Progress bar during testing */}
        {testingAll && (
          <div className="mt-3">
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${testProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
              Testing proxies... {testProgress}%
            </p>
          </div>
        )}

        {/* Proxy Table */}
        {proxies.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-slate-500 py-4 mt-2">No proxies added yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm text-gray-300">
                <thead>
                  <tr className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wide border-b border-slate-700/40">
                    <th className="text-left py-3 px-2 w-8">#</th>
                    <th className="text-left py-3 px-2">Proxy</th>
                    <th className="text-center py-3 px-2">Type</th>
                    <th className="text-center py-3 px-2">Status</th>
                    <th className="text-right py-3 px-2">Latency</th>
                    <th className="text-center py-3 px-2">Last Used</th>
                    <th className="text-center py-3 px-2">Fails</th>
                    <th className="text-right py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProxies.map((proxy, idx) => {
                    const proxyId = proxy.id || proxy._id;
                    const globalIdx = (page - 1) * PER_PAGE + idx + 1;
                    return (
                      <tr
                        key={proxyId || idx}
                        className="border-b border-slate-700/40 hover:bg-slate-800/50"
                      >
                        <td className="py-3 px-2 text-xs text-slate-500">
                          {globalIdx}
                        </td>
                        <td className="py-3 px-2 font-mono text-xs">
                          {maskProxy(proxy.proxy || proxy.host || proxy.address || proxy)}
                        </td>
                        <td className="py-3 px-2 text-center text-xs text-slate-400">
                          {proxy.type || "HTTP"}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <StatusBadge status={proxy.status} />
                        </td>
                        <td className="py-3 px-2 text-right text-xs">
                          {proxy.latency || proxy.response_time
                            ? `${proxy.latency || proxy.response_time}ms`
                            : "-"}
                        </td>
                        <td className="py-3 px-2 text-center text-xs text-slate-500">
                          {proxy.last_used
                            ? new Date(proxy.last_used).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="py-3 px-2 text-center text-xs">
                          <span
                            className={
                              (proxy.fail_count || 0) > 0
                                ? "text-red-400"
                                : "text-slate-500"
                            }
                          >
                            {proxy.fail_count || 0}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleTestOne(proxyId)}
                              disabled={testingId === proxyId}
                              className="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1 transition-colors disabled:opacity-50"
                            >
                              {testingId === proxyId ? (
                                <Spinner />
                              ) : (
                                "Test"
                              )}
                            </button>
                            <button
                              onClick={() => handleRemove(proxyId)}
                              className="text-xs text-red-400 hover:text-red-300 px-2 py-1 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-gray-900 dark:text-white px-3 py-1.5 rounded-lg text-xs transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-gray-900 dark:text-white px-3 py-1.5 rounded-lg text-xs transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
