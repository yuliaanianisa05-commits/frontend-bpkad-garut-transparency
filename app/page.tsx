"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3, PieChart, TrendingUp, Menu, X } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const teamMembers = [
    {
      id: 1,
      name: "Restu Imam Fauzan, S.T.",
      position: "Pembimbing Lapangan Dinas BPKAD Kab Garut",
      image: "/img/poto-pak-restu.jpeg",
    },
    {
      id: 2,
      name: "Dr.Ayu Latifah, S.T,M.T",
      position: "Dosen Pembimbing Institut Teknologi Garut",
      image: "/img/poto-bu-ayu.jpeg",
    },
    {
      id: 3,
      name: "Nida Nurapipah",
      position: "Mahasiswa Institut Teknologi Garut",
      image: "/img/poto-nida.jpeg",
    },
    {
      id: 4,
      name: "Siti Sarah Yuliana",
      position: "Mahasiswa Institut Teknologi Garut",
      image: "/img/poto-siti.jpg",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src="/img/logo-bpkad.png"
                alt="Logo BPKAD"
                className="w-[80px] sm:w-[100px] md:w-[120px] object-contain"
              />
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="#fitur"
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
              >
                Fitur
              </Link>
              <Link
                href="#tentang"
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
              >
                Tentang
              </Link>
              <Link
                href="#tim"
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
              >
                Tim Kami
              </Link>
            </nav>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 space-y-2 px-4 pb-4 border-t pt-4">
              <Link
                href="#tentang"
                className="block py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tentang
              </Link>
              <Link
                href="#fitur"
                className="block py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Fitur
              </Link>
              <Link
                href="#tim"
                className="block py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tim Kami
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-balance mb-4 sm:mb-6 text-gray-900 leading-tight">
              Selamat Datang di Aplikasi{" "}
              <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                BPKAD
              </span>{" "}
              Kabupaten Garut
            </h1>
            <p className="text-base sm:text-lg text-gray-600 text-balance max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed">
              Sistem informasi transparansi Anggaran Pendapatan dan Belanja
              Daerah untuk meningkatkan akuntabilitas pengelolaan keuangan
              daerah
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 sm:mb-12">
            <Button
              asChild
              size="lg"
              className="text-white text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg w-full sm:w-auto"
            >
              <Link href="/dashboard">
                <BarChart3 className="mr-2 h-5 w-5" />
                Lihat Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="fitur"
        className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-50 to-indigo-50"
      >
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Fitur Utama
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Akses informasi anggaran daerah dengan mudah dan transparan
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <Card className="hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur border-blue-100 hover:-translate-y-1">
              <CardHeader className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg mx-auto">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-gray-900 text-center mb-2">
                  Dashboard Interaktif
                </CardTitle>
                <CardDescription className="text-gray-600 text-center leading-relaxed">
                  Visualisasi data anggaran dengan grafik dan chart yang mudah
                  dipahami
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur border-blue-100 hover:-translate-y-1">
              <CardHeader className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4 shadow-lg mx-auto">
                  <PieChart className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-gray-900 text-center mb-2">
                  Detail Anggaran
                </CardTitle>
                <CardDescription className="text-gray-600 text-center leading-relaxed">
                  Informasi lengkap pendapatan, belanja, dan pembiayaan daerah
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur border-blue-100 hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
              <CardHeader className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-4 shadow-lg mx-auto">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-gray-900 text-center mb-2">
                  Ringkasan Tahunan
                </CardTitle>
                <CardDescription className="text-gray-600 text-center leading-relaxed">
                  Perbandingan dan tren anggaran dari tahun ke tahun
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        id="tentang"
        className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white"
      >
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-gray-900">
            Tentang BPKAD Kabupaten Garut
          </h2>
          <p className="text-base sm:text-lg text-gray-600 text-balance mb-8 leading-relaxed">
            Aplikasi ini dikembangkan untuk meningkatkan transparansi dan
            akuntabilitas pengelolaan keuangan di BPKAD Kabupaten Garut.
            Masyarakat dapat mengakses informasi anggaran secara real-time dan
            memahami bagaimana dana publik dikelola.
          </p>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-blue-200 text-blue-700 hover:bg-blue-50 bg-transparent w-full sm:w-auto"
          >
            <Link href="/dashboard">Mulai Jelajahi Data</Link>
          </Button>
        </div>
      </section>

      {/* Team Section - Added Tim Kami section with team member cards */}
      <section
        id="tim"
        className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-50 to-indigo-50"
      >
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Tim <span className="text-blue-600">Kami</span>
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Kenali Tim yang telah berdedikasi untuk mewujudkan
              aplikasi BPKAD Kabupaten Garut
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <div className="aspect-square overflow-hidden bg-gray-200">
                  <img
                    src={member.image || "/placeholder.svg"}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-blue-600 font-medium text-sm mb-2">
                    {member.position}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gradient-to-r from-gray-50 to-blue-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-bold text-gray-900 text-lg">
                  BPKAD Kabupaten Garut
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Sistem informasi transparansi anggaran daerah untuk masyarakat
                Kabupaten Garut
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-gray-900">Menu</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link
                    href="/dashboard"
                    className="hover:text-blue-600 transition-colors block py-1"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/detail-anggaran"
                    className="hover:text-blue-600 transition-colors block py-1"
                  >
                    Detail Anggaran
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/ringkasan-tahunan"
                    className="hover:text-blue-600 transition-colors block py-1"
                  >
                    Ringkasan Tahunan
                  </Link>
                </li>
              </ul>
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <h3 className="font-semibold mb-4 text-gray-900">Kontak</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Pemerintah Kabupaten Garut
                <br />
                Jl. Kiansantang No.3, Regol, Kec. Garut Kota, Kabupaten Garut,
                <br />
                Jawa Barat 44118
              </p>
            </div>
          </div>

          <div className="border-t mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2025 BPKAD Kabupaten Garut. Semua hak dilindungi.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
