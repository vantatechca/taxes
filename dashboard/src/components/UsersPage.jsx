import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const API = "";
const ROLE_LABELS = { owner: "Owner", lead: "Team Lead", member: "Member" };
const ROLE_COLORS = { owner: "text-indigo-400 bg-indigo-400/10", lead: "text-blue-400 bg-blue-400/10", member: "text-gray-400 bg-gray-400/10" };

function apiFetch(url, getToken, options = {}) {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}

export default function UsersPage() {
  const { user: me, getToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "member" });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Change password state
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await apiFetch(`${API}/api/users`, getToken);
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    setAdding(true);
    try {
      const res = await apiFetch(`${API}/api/users`, getToken, {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create user"); return; }
      setUsers(prev => [...prev, data]);
      setForm({ name: "", email: "", password: "", role: "member" });
      setShowAdd(false);
      setSuccess(`User "${data.name}" created successfully.`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(userId, userName) {
    if (!confirm(`Delete user "${userName}"? This cannot be undone.`)) return;
    try {
      const res = await apiFetch(`${API}/api/users/${userId}`, getToken, { method: "DELETE" });
      if (res.ok) setUsers(prev => prev.filter(u => u.id !== userId));
      else { const d = await res.json(); alert(d.error); }
    } catch (err) { alert(err.message); }
  }

  async function handleRoleChange(userId, role) {
    try {
      const res = await apiFetch(`${API}/api/users/${userId}`, getToken, {
        method: "PUT",
        body: JSON.stringify({ role }),
      });
      if (res.ok) setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
      else { const d = await res.json(); alert(d.error); }
    } catch (err) { alert(err.message); }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: "error", text: "New passwords do not match" });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMsg({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }
    setPwLoading(true);
    try {
      const res = await apiFetch(`${API}/api/auth/change-password`, getToken, {
        method: "POST",
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setPwMsg({ type: "error", text: data.error }); return; }
      setPwMsg({ type: "success", text: "Password changed successfully" });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwMsg({ type: "error", text: err.message });
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Team Members</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage who has access to the dashboard.</p>
        </div>
        <button
          onClick={() => { setShowAdd(!showAdd); setError(""); }}
          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
        >
          + Add User
        </button>
      </div>

      {success && (
        <div className="p-3 rounded-lg text-sm bg-green-500/20 text-green-400 border border-green-500/20">{success}</div>
      )}

      {/* Add User Form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-gray-800 border border-indigo-500/30 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-indigo-300">New User</h3>
          {error && <div className="p-3 rounded-lg text-sm bg-red-500/20 text-red-400">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Full Name</label>
              <input
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
                placeholder="e.g. Maria"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Email</label>
              <input
                type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required
                placeholder="maria@empire.com"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Password</label>
              <input
                type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={6}
                placeholder="Min 6 characters"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Role</label>
              <select
                value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="owner">Owner</option>
                <option value="lead">Team Lead</option>
                <option value="member">Member</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={adding}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm rounded-lg flex items-center gap-2">
              {adding ? "Creating..." : "Create User"}
            </button>
            <button type="button" onClick={() => { setShowAdd(false); setError(""); }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Users list */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading users...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Role</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t border-gray-700 hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <span className="text-white font-medium">{u.name}</span>
                      {u.id === me?.id && <span className="text-[10px] text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded">you</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.id === me?.id ? (
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${ROLE_COLORS[u.role]}`}>{ROLE_LABELS[u.role]}</span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                        className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="owner">Owner</option>
                        <option value="lead">Team Lead</option>
                        <option value="member">Member</option>
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.id !== me?.id && (
                      <button
                        onClick={() => handleDelete(u.id, u.name)}
                        className="px-2 py-1 text-xs text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Change own password */}
      <div className="border-t border-gray-700 pt-6">
        <button
          onClick={() => { setShowPw(!showPw); setPwMsg(null); }}
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          {showPw ? "▲ Hide" : "▼ Change my password"}
        </button>

        {showPw && (
          <form onSubmit={handleChangePassword} className="mt-4 max-w-sm space-y-3">
            {pwMsg && (
              <div className={`p-3 rounded-lg text-sm ${pwMsg.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                {pwMsg.text}
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Current Password</label>
              <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">New Password</label>
              <input type="password" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} required minLength={6}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Confirm New Password</label>
              <input type="password" value={pwForm.confirmPassword} onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))} required minLength={6}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <button type="submit" disabled={pwLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm rounded-lg">
              {pwLoading ? "Saving..." : "Change Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
