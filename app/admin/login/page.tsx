"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  LayoutDashboard,
  Lock,
  User,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      const redirectTo = searchParams.get("redirect") || "/admin/dashboard";
      router.replace(redirectTo);
    }
  }, [user, authLoading, router, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log(" Attempting login with:", { username });
      const success = await login(username, password);

      if (success) {
        console.log(" Login successful, redirecting to dashboard");
        const redirectTo = searchParams.get("redirect") || "/admin/dashboard";
        router.push(redirectTo);
      } else {
        setError("Username atau password salah. Silakan coba lagi.");
      }
    } catch (err: any) {
      console.error(" Login error:", err);

      if (err.message) {
        setError(err.message);
      } else if (err.response?.status === 401) {
        setError("Username atau password salah. Silakan coba lagi.");
      } else if (err.response?.status === 400) {
        setError("Username dan password harus diisi.");
      } else if (err.name === "TypeError" && err.message.includes("fetch")) {
        setError(
          "Tidak dapat terhubung ke server. Pastikan backend berjalan di localhost:5000"
        );
      } else {
        setError("Terjadi kesalahan saat login. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-700">Memeriksa status login...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center text-blue-900">
              Masuk Admin
            </CardTitle>
            <CardDescription className="text-center text-blue-600">
              Masukkan kredensial admin untuk mengakses dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <Alert
                  variant="destructive"
                  className="border-red-200 bg-red-50"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-blue-900 font-medium">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Masukkan username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500 bg-white/70"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-blue-900 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500 bg-white/70"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 shadow-lg transition-all duration-200"
                disabled={loading}
              >
                {loading ? "Memproses..." : "Masuk"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Beranda
              </Link>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
