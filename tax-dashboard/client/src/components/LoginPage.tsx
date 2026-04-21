import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">T</div>
          <h1 className="text-3xl font-bold text-white">Tax Dashboard</h1>
          <p className="text-slate-400 mt-2">Multi-Entity Tax Management</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl border border-slate-700 p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Sign In</h2>

          {error && (
            <div className="p-3 rounded-lg text-sm bg-red-500/20 text-red-400">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@taxdashboard.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Min 6 characters"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

        </form>
      </div>
    </div>
  );
}
