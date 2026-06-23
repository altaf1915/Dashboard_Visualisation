import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("dashboard_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("dashboard_token");
    if (!token) {
      setReady(true);
      return;
    }
    api.get("/auth/me")
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem("dashboard_user", JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem("dashboard_token");
        localStorage.removeItem("dashboard_user");
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  const persistSession = useCallback((data) => {
    localStorage.setItem("dashboard_token", data.token);
    localStorage.setItem("dashboard_user", JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const login = useCallback(async (payload) => {
    const res = await api.post("/auth/login", payload);
    persistSession(res.data);
  }, [persistSession]);

  const register = useCallback(async (payload) => {
    const res = await api.post("/auth/register", payload);
    persistSession(res.data);
  }, [persistSession]);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("dashboard_token");
      localStorage.removeItem("dashboard_user");
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, ready, login, register, logout, isAuthenticated: Boolean(user) }), [user, ready, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
