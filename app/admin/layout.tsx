"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Settings,
  FileText,
  ChevronDown,
  ChevronRight,
  DollarSign,
  CreditCard,
  PiggyBank,
  FolderTree,
  Calendar,
  LogOut,
  Users,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AuthProvider, useAuth } from "@/components/auth-provider";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Kelola User",
    href: "/admin/kelola-user",
    icon: Users,
  },
  {
    name: "Kelola Anggaran",
    icon: Settings,
    children: [
      {
        name: "Kelola Tahun Anggaran",
        href: "/admin/tahun-anggaran",
        icon: Calendar,
      },
      {
        name: "Kelola Pendapatan",
        href: "/admin/pendapatan",
        icon: DollarSign,
      },
      {
        name: "Kelola Pembelanjaan",
        href: "/admin/pembelanjaan",
        icon: CreditCard,
      },
      {
        name: "Kelola Pembiayaan",
        href: "/admin/pembiayaan",
        icon: PiggyBank,
      },
      {
        name: "Kelola Kategori",
        href: "/admin/kategori",
        icon: FolderTree,
      },
    ],
  },
  {
    name: "Laporan Keuangan Tahunan",
    href: "/admin/laporan",
    icon: FileText,
  },
];

function AdminSidebar({
  className,
  isMobileOpen,
  onMobileClose,
}: {
  className?: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([
    "Kelola Anggaran",
  ]);
  const { user, logout } = useAuth();

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((name) => name !== itemName)
        : [...prev, itemName]
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <div
        className={cn(
          "flex h-full w-full flex-col bg-gradient-to-b from-blue-50 to-indigo-100 border-r border-blue-200",
          "fixed lg:relative z-50 lg:z-auto",
          "transform transition-transform duration-300 ease-in-out lg:transform-none",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        <div className="flex h-14 md:h-16 items-center justify-between border-b border-blue-200 px-4 md:px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
              <LayoutDashboard className="h-3 w-3 md:h-4 md:w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs md:text-sm font-semibold text-blue-900">
                BPKAD Admin
              </span>
              <span className="text-xs text-blue-600">Kabupaten Garut</span>
            </div>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-blue-600 hover:bg-blue-200/50"
            onClick={onMobileClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-3 md:p-4">
          {navigation.map((item) => {
            if (item.children) {
              const isExpanded = expandedItems.includes(item.name);
              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className="flex w-full items-center justify-between rounded-lg px-2 md:px-3 py-2 text-xs md:text-sm font-medium text-blue-700 hover:bg-blue-200/50 hover:text-blue-900 transition-colors"
                  >
                    <div className="flex items-center gap-2 md:gap-3">
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="ml-4 md:ml-6 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-2 md:gap-3 rounded-lg px-2 md:px-3 py-2 text-xs md:text-sm font-medium transition-colors",
                            pathname === child.href
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                              : "text-blue-600 hover:bg-blue-200/50 hover:text-blue-900"
                          )}
                        >
                          <child.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{child.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 md:gap-3 rounded-lg px-2 md:px-3 py-2 text-xs md:text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "text-blue-600 hover:bg-blue-200/50 hover:text-blue-900"
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-blue-200 p-3 md:p-4">
          <Separator className="mb-3 md:mb-4 bg-blue-200" />

          <Button
            onClick={logout}
            variant="outline"
            size="sm"
            className="w-full flex items-center gap-2 text-xs md:text-sm text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 bg-transparent"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Keluar</span>
          </Button>
        </div>
      </div>
    </>
  );
}

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/admin/login" && !loading && !user) {
      router.replace(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, pathname, router]);

  if (loading || !user) {
    return null;
  }

  return <>{children}</>;
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Don't show sidebar on login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <AdminAuthGuard>
      <div className="flex h-screen bg-gray-50">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <AdminSidebar />
        </div>

        {/* Mobile Sidebar */}
        <AdminSidebar
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
          className="lg:hidden w-64"
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="lg:hidden bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm text-white shadow-lg">
                  <LayoutDashboard className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">
                    BPKAD Admin
                  </span>
                  <span className="text-xs text-blue-100">Kabupaten Garut</span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="text-white hover:bg-white/20 backdrop-blur-sm border border-white/20"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto bg-gray-50 lg:bg-transparent">
            <div className="min-h-full">{children}</div>
          </main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AuthProvider>
  );
}


