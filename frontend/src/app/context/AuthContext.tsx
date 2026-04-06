"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  parent_id?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async (authToken: string) => {
    try {
      const response = await fetch(`${API}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return userData;
      } else {
        // Se o token for inválido (401), desloga
        if (response.status === 401) {
          logout();
        }
        return null;
      }
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem("bai_token");
    if (savedToken) {
      setToken(savedToken);
      fetchUser(savedToken).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  const login = async (newToken: string) => {
    localStorage.setItem("bai_token", newToken);
    setToken(newToken);
    setLoading(true);
    await fetchUser(newToken);
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("bai_token");
    setToken(null);
    setUser(null);
    router.push("/");
  };

  const refreshUser = async () => {
    if (token) {
      await fetchUser(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
