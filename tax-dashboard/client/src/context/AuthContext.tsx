import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

const TOKEN_KEY = 'tax_dashboard_token';

interface AppUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'reviewer' | 'viewer';
  is_all_companies: boolean;
  company_access: string[];
}

interface AuthContextType {
  appUser: AppUser | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  isAdmin: boolean;
  isReviewer: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) {
      setToken(saved);
      loadUser(saved);
    } else {
      setLoading(false);
    }
  }, []);

  async function loadUser(jwt: string) {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        const user = await res.json();
        setAppUser(user);
      } else {
        // Token expired or invalid
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }

  const signIn = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }

    const data = await res.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setAppUser(data.user);
  };

  const signOut = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setAppUser(null);
  };

  return (
    <AuthContext.Provider value={{
      appUser, token, loading,
      signIn, signOut,
      isAdmin: appUser?.role === 'admin',
      isReviewer: appUser?.role === 'admin' || appUser?.role === 'reviewer',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
