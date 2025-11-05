import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("authUser");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed.user || null);
        setToken(parsed.token || null);
        // set axios default header when rehydrating
        if (parsed.token) {
          axios.defaults.headers.common.Authorization = `Bearer ${parsed.token}`;
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const login = ({ user: u, token: t }) => {
    setUser(u || null);
    setToken(t || null);
    localStorage.setItem("authUser", JSON.stringify({ user: u, token: t }));
    // set axios default Authorization so requests use the token
    if (t) {
      axios.defaults.headers.common.Authorization = `Bearer ${t}`;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("authUser");
    // remove axios default header
    try {
      delete axios.defaults.headers.common.Authorization;
    } catch (e) {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
