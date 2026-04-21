import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { COMPANY_TYPES, JURISDICTIONS } from '../lib/constants';
import { Building2, CreditCard, Users, Shield, Save, Trash2, Plus, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { isAdmin, appUser } = useAuth();
  const [companies, setCompanies] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [tab, setTab] = useState<'companies' | 'users' | 'audit' | 'password'>('companies');
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingCompany, setSavingCompany] = useState<string | null>(null);
  const [savedCompany, setSavedCompany] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '', role: 'reviewer' });
  const [addingUser, setAddingUser] = useState(false);

  useEffect(() => {
    api.getCompanies().then(setCompanies);
    if (isAdmin) {
      api.getUsers().then(setUsers).catch(() => {});
      api.getAuditLog().then(setAuditLog).catch(() => {});
    }
  }, [isAdmin]);

  async function saveCompany(company: any) {
    setSavingCompany(company.id);
    try {
      await api.updateCompany(company.id, {
        name: company.name,
        tax_id_canada: company.tax_id_canada,
        tax_id_us: company.tax_id_us,
        tps_number: company.tps_number,
        tvq_number: company.tvq_number,
        filing_frequency: company.filing_frequency,
      });
      setSavedCompany(company.id);
      setTimeout(() => setSavedCompany(prev => prev === company.id ? null : prev), 2000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingCompany(null);
    }
  }

  function updateCompanyField(id: string, field: string, value: string) {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  }

  async function updateUserRole(userId: string, role: string) {
    try {
      await api.updateUser(userId, { role });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setAddingUser(true);
    try {
      const { user } = await api.registerUser(newUser);
      setUsers(prev => [...prev, user]);
      setNewUser({ email: '', password: '', name: '', role: 'reviewer' });
      setShowAddUser(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAddingUser(false);
    }
  }

  async function handleDeleteUser(userId: string, userName: string) {
    if (!confirm(`Delete user "${userName}"? This cannot be undone.`)) return;
    try {
      await api.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    setPwLoading(true);
    setPwMessage(null);
    try {
      await api.changePassword(pwForm.currentPassword, pwForm.newPassword);
      setPwMessage({ type: 'success', text: 'Password changed successfully' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPwMessage({ type: 'error', text: err.message });
    } finally {
      setPwLoading(false);
    }
  }

  const tabs = [
    { key: 'companies', label: 'Companies', icon: Building2 },
    ...(isAdmin ? [
      { key: 'users', label: 'Users', icon: Users },
      { key: 'audit', label: 'Audit Log', icon: Shield },
    ] : []),
    { key: 'password', label: 'Change Password', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
              tab === t.key ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
            }`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* Companies Tab */}
      {tab === 'companies' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Configure your 7 companies. Fill in names and tax registration numbers.</p>
          {companies.map(c => (
            <div key={c.id} className={`bg-slate-800 border border-slate-700 rounded-xl p-4 ${
              c.jurisdiction === 'QC' ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-green-500'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 bg-slate-700 rounded text-slate-300">{c.short_code}</span>
                  <span className="text-xs text-slate-500">{COMPANY_TYPES[c.type as keyof typeof COMPANY_TYPES]}</span>
                  <span className="text-xs text-slate-500">{JURISDICTIONS[c.jurisdiction as keyof typeof JURISDICTIONS]?.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {savedCompany === c.id && <span className="text-green-400 text-xs">Saved!</span>}
                  <button onClick={() => saveCompany(c)} disabled={savingCompany === c.id}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs rounded-lg flex items-center gap-1">
                    {savingCompany === c.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    {savingCompany === c.id ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Company Name</label>
                  <input value={c.name} onChange={e => updateCompanyField(c.id, 'name', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm" placeholder="Enter company name" />
                </div>
                {c.jurisdiction === 'QC' && (
                  <>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">BN / Tax ID (Canada)</label>
                      <input value={c.tax_id_canada || ''} onChange={e => updateCompanyField(c.id, 'tax_id_canada', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm" placeholder="123456789RT0001" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">TPS Number</label>
                      <input value={c.tps_number || ''} onChange={e => updateCompanyField(c.id, 'tps_number', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">TVQ Number</label>
                      <input value={c.tvq_number || ''} onChange={e => updateCompanyField(c.id, 'tvq_number', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm" />
                    </div>
                  </>
                )}
                {c.jurisdiction.startsWith('US') && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">EIN (US)</label>
                    <input value={c.tax_id_us || ''} onChange={e => updateCompanyField(c.id, 'tax_id_us', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm" placeholder="XX-XXXXXXX" />
                  </div>
                )}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Filing Frequency</label>
                  <select value={c.filing_frequency} onChange={e => updateCompanyField(c.id, 'filing_frequency', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Manage user access and roles.</p>
            <button onClick={() => setShowAddUser(!showAddUser)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
              <Plus size={14} /> Add User
            </button>
          </div>

          {/* Add User Form */}
          {showAddUser && (
            <form onSubmit={handleAddUser} className="bg-slate-800 border border-blue-500/30 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-blue-300">New User</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Name</label>
                  <input value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} required
                    placeholder="Full name"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Email</label>
                  <input type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} required
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Password</label>
                  <input type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} required minLength={6}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Role</label>
                  <select value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="admin">Admin</option>
                    <option value="reviewer">Reviewer</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={addingUser}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg flex items-center gap-2">
                  {addingUser ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create User
                </button>
                <button type="button" onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="text-left px-4 py-3 text-slate-300 font-medium">User</th>
                  <th className="text-left px-4 py-3 text-slate-300 font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-slate-300 font-medium">Role</th>
                  <th className="text-left px-4 py-3 text-slate-300 font-medium">Joined</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-t border-slate-700">
                    <td className="px-4 py-3 text-white">{u.name}</td>
                    <td className="px-4 py-3 text-slate-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <select value={u.role} onChange={e => updateUserRole(u.id, e.target.value)} disabled={u.id === appUser?.id}
                        className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs disabled:opacity-50">
                        <option value="admin">Admin</option>
                        <option value="reviewer">Reviewer</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      {u.id !== appUser?.id && (
                        <button onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Log Tab */}
      {tab === 'audit' && isAdmin && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="text-left px-4 py-3 text-slate-300 font-medium">Time</th>
                <th className="text-left px-4 py-3 text-slate-300 font-medium">User</th>
                <th className="text-left px-4 py-3 text-slate-300 font-medium">Action</th>
                <th className="text-left px-4 py-3 text-slate-300 font-medium">Entity</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map(log => (
                <tr key={log.id} className="border-t border-slate-700">
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-300">{log.users?.name || log.users?.email || '-'}</td>
                  <td className="px-4 py-3 text-white">{log.action}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{log.entity_type} {log.entity_id?.slice(0, 8)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Change Password Tab */}
      {tab === 'password' && (
        <div className="max-w-md">
          <h2 className="text-lg font-semibold text-white mb-4">Change Password</h2>
          {pwMessage && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${pwMessage.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {pwMessage.text}
            </div>
          )}
          <form onSubmit={handleChangePassword} className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Current Password</label>
              <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} required
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">New Password</label>
              <input type="password" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} required minLength={6}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Confirm New Password</label>
              <input type="password" value={pwForm.confirmPassword} onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))} required minLength={6}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" disabled={pwLoading}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2">
              {pwLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {pwLoading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
