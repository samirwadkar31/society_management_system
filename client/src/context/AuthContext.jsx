import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    const token = localStorage.getItem('kutumb_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const me = await api('/users/me');
      setUser(me);
    } catch (e) {
      localStorage.removeItem('kutumb_token');
      setUser(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadMe();
  }, []);

  function login(token, u) {
    localStorage.setItem('kutumb_token', token);
    setUser(u);
  }

  function logout() {
    localStorage.removeItem('kutumb_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, loadMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
