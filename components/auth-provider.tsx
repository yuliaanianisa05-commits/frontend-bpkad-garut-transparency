"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiClient } from "@/lib/api";

interface User {
  idAdmin: number;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem("admin_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.verifyToken();
        if (response.success && response.data) {
          setUser(response.data.user);
        } else {
          // Token tidak valid, hapus dari storage
          localStorage.removeItem("admin_token");
          document.cookie =
            "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        }
      } catch (error) {
        console.error(" Auth verification failed:", error);
        localStorage.removeItem("admin_token");
        document.cookie =
          "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      const response = await apiClient.loginAdmin(username, password);

      if (response.success && response.data) {
        setUser(response.data.user);
        localStorage.setItem("admin_token", response.data.token);
        document.cookie = `admin_token=${response.data.token}; path=/; max-age=86400; SameSite=Strict`;
        return true;
      }
      return false;
    } catch (error) {
      console.error(" Login failed:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("admin_token");
    document.cookie =
      "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";

    router.push("/admin/login");
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
