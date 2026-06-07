"use client";

import { createContext, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SessionUser } from "@/lib/auth";

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: Record<string, string>) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

async function fetchSession(): Promise<SessionUser | null> {
  const res = await fetch("/api/auth/me", { cache: "no-store" });
  if (!res.ok) return null;
  const data = (await res.json()) as { user: SessionUser | null };
  return data.user;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["session"],
    queryFn: fetchSession,
    staleTime: 5 * 60_000,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["session"] });

  async function login(email: string, password: string) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Login failed.");
    }
    await invalidate();
  }

  async function signup(payload: Record<string, string>) {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Sign up failed.");
    }
    await invalidate();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await invalidate();
  }

  return (
    <AuthContext.Provider
      value={{
        user: data ?? null,
        loading: isLoading,
        login,
        signup,
        logout,
        refresh: invalidate,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
