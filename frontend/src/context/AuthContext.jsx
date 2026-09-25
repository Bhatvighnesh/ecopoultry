import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('ecopoultry_user');
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback(async (email, password) => {
    const { data } = await apiClient.post('/api/auth/login', { email, password });
    localStorage.setItem('ecopoultry_token', data.token);
    localStorage.setItem('ecopoultry_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ecopoultry_token');
    localStorage.removeItem('ecopoultry_user');
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, login, logout, isAdmin: user?.role === 'admin' }),
    [user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
