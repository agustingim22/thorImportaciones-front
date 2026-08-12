"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { PublicUser } from "./user";

type RegisterInput = { email: string; password: string; name: string; phone?: string };
type LoginInput = { email: string; password: string };
type ProfileInput = {
  name: string;
  phone?: string | null;
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
  province?: string | null;
  floor?: string | null;
  apartment?: string | null;
};

type AuthContextValue = {
  user: PublicUser | null;
  loading: boolean;
  register: (input: RegisterInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: ProfileInput) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    if (data?.errors) return Object.values(data.errors as Record<string, string[]>).flat().join(" ");
    if (data?.error) return data.error;
  } catch {
    /* sin cuerpo JSON */
  }
  return fallback;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    const data = await res.json();
    setUser(data.user);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  async function register(input: RegisterInput) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(await parseError(res, "No se pudo crear la cuenta."));
    const data = await res.json();
    setUser(data.user);
  }

  async function login(input: LoginInput) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(await parseError(res, "No se pudo iniciar sesión."));
    const data = await res.json();
    setUser(data.user);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  async function updateProfile(input: ProfileInput) {
    const res = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(await parseError(res, "No se pudo guardar."));
    const data = await res.json();
    setUser(data.user);
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
