import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_BASE = '';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('de_token');
    if (!token) { setLoading(false); return; }
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(u => { if (u) setUser(u); else localStorage.removeItem('de_token'); })
      .catch(() => localStorage.removeItem('de_token'))
      .finally(() => setLoading(false));
  }, []);

  async function signIn(email, password) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('de_token', data.token);
    setUser(data.user);
  }

  function signOut() {
    localStorage.removeItem('de_token');
    setUser(null);
  }

  function getToken() {
    return localStorage.getItem('de_token');
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, getToken, isOwner: user?.role === 'owner' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
