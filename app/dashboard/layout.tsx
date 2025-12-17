"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Home,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Detail Anggaran",
    icon: Settings,
    children: [
      {
        name: "Detail Pendapatan",
        href: "/detail-anggaran/pendapatan",
        icon: DollarSign,
      },
      {
        name: "Detail Pembelanjaan",
        href: "/detail-anggaran/pembelanjaan",
        icon: CreditCard,
      },
      {
        name: "Detail Pembiayaan",
        href: "/detail-anggaran/pembiayaan",
        icon: PiggyBank,
      },
    ],
  },
  {
    name: "Ringkasan Tahunan",
    href: "/ringkasan-tahunan",
    icon: FileText,
  },
];

function DashboardSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([
    "Detail Anggaran",
  ]);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((name) => name !== itemName)
        : [...prev, itemName]
    );
  };

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col bg-gradient-to-b from-blue-50 to-indigo-100 border-r border-blue-200",
        className
      )}
    >
      <div className="flex h-14 md:h-16 items-center border-b border-blue-200 px-4 md:px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
            <LayoutDashboard className="h-3 w-3 md:h-4 md:w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs md:text-sm font-semibold text-blue-900">
              BPKAD Dashboard
            </span>
            <span className="text-xs text-blue-600">Kabupaten Garut</span>
          </div>
        </Link>
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
          variant="outline"
          size="sm"
          asChild
          className="w-full flex items-center gap-2 text-xs md:text-sm text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 bg-transparent"
        >
          <Link href="/">
            <Home className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Kembali ke Beranda</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}

function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden flex items-center justify-between h-14 px-4 bg-white border-b border-blue-200 sticky top-0 z-50">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
          <img src="../../public/New folder/logo-bpkad.png" alt="Logo" className="h-3 w-3" />
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-semibold text-blue-900">
            BPKAD Dashboard
          </span>
          <span className="text-xs text-blue-600">Kabupaten Garut</span>
        </div>
      </Link>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="p-2">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <DashboardSidebar />
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <DashboardSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <MobileHeader />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 lg:p-8 max-w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
