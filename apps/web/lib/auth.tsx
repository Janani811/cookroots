"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, type User } from "./api";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const persistSession = useCallback((token: string, nextUser: User) => {
    localStorage.setItem("cooksy_token", token);
    setUser(nextUser);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("cooksy_token");
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .getMe()
      .then(setUser)
      .catch(() => localStorage.removeItem("cooksy_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { token, user: nextUser } = await api.login(email, password);
      persistSession(token, nextUser);
    },
    [persistSession]
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const { token, user: nextUser } = await api.signup(name, email, password);
      persistSession(token, nextUser);
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("cooksy_token");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, signup, logout }),
    [user, loading, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
