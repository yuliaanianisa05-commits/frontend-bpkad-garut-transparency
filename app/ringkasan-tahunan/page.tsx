"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, PieChart, Target, Wallet } from "lucide-react"
import { apiClient } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"

interface Transaction {
  idTransaksi: number
  jumlah: number
  kategoriApbd: {
    idKategori: number
    namaKategori: string
    kode?: string
    level: number
    idParent?: number
    jenis: string
  }
  tahunAnggaran: {
    idTahun: number
    tahun: number
  }
}

interface Category {
  idKategori: number
  namaKategori: string
  kode?: string
  level: number
  jenis: string
  idParent?: number
}

interface Level3TransactionItem {
  category: Category
  transaction: Transaction
  amount: number
}

interface Level2Group {
  category: Category
  transaction: Transaction
  children: Level3TransactionItem[]
  total: number
}

interface Level1Group {
  category: Category
  transaction: Transaction
  children: Level2Group[]
  total: number
}

interface AnnualSummary {
  tahun: number
  pendapatan: {
    total: number
    categories: Array<{
      nama: string
      jumlah: number
      persentase: number
    }>
  }
  belanja: {
    total: number
    categories: Array<{
      nama: string
      jumlah: number
      persentase: number
    }>
  }
  pembiayaan: {
    total: number
    categories: Array<{
      nama: string
      jumlah: number
      persentase: number
    }>
  }
  surplus_defisit: number
}

const formatCompactCurrency = (amount: number): string => {
  if (amount >= 1e12) return `Rp ${(amount / 1e12).toFixed(1)}T`
  if (amount >= 1e9) return `Rp ${(amount / 1e9).toFixed(1)}M`
  if (amount >= 1e6) return `Rp ${(amount / 1e6).toFixed(1)}Jt`
  if (amount >= 1e3) return `Rp ${(amount / 1e3).toFixed(1)}K`
  return formatCurrency(amount)
}

export default function RingkasanTahunanPage() {
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [summaryData, setSummaryData] = useState<AnnualSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAvailableYears = async () => {
      try {
        const response = await apiClient.getTahunAnggaran()
        if (response.success && response.data) {
          const years = response.data.map((year) => year.tahun).sort((a, b) => b - a)
          setAvailableYears(years)
          if (years.length > 0) {
            setSelectedYear(years[0])
          }
        }
      } catch (err) {
        console.error(" Error fetching available years:", err)
        const currentYear = new Date().getFullYear()
        setAvailableYears([currentYear])
        setSelectedYear(currentYear)
      }
    }

    fetchAvailableYears()
  }, [])

  useEffect(() => {
    if (selectedYear) {
      fetchAnnualSummary()
    }
  }, [selectedYear])

  const fetchAnnualSummary = async () => {
    if (!selectedYear) return

    try {
      setLoading(true)
      setError(null)
      console.log(" Fetching annual summary for year:", selectedYear)

      const [pendapatanResponse, belanjaResponse, pembiayaanResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transaksi-apbd?tahun=${selectedYear}&jenis=Pendapatan`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transaksi-apbd?tahun=${selectedYear}&jenis=Belanja`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transaksi-apbd?tahun=${selectedYear}&jenis=Pembiayaan`),
      ])

      const [pendapatanData, belanjaData, pembiayaanData] = await Promise.all([
        pendapatanResponse.ok ? pendapatanResponse.json() : { success: false, data: { transactions: [] } },
        belanjaResponse.ok ? belanjaResponse.json() : { success: false, data: { transactions: [] } },
        pembiayaanResponse.ok ? pembiayaanResponse.json() : { success: false, data: { transactions: [] } },
      ])

      console.log(" Received transaction data:", {
        pendapatanData,
        belanjaData,
        pembiayaanData,
      })

      const processTransactions = (transactions: Transaction[]) => {
        const sortedTransactions = [...transactions].sort((a, b) => {
          const categoryA = a.kategoriApbd
          const categoryB = b.kategoriApbd

          if (categoryA.jenis !== categoryB.jenis) {
            return categoryA.jenis.localeCompare(categoryB.jenis)
          }

          if (categoryA.level !== categoryB.level) {
            return categoryA.level - categoryB.level
          }

          if (categoryA.level === 1) {
            return categoryA.idKategori - categoryB.idKategori
          } else if (categoryA.level === 2) {
            return categoryA.idKategori - categoryB.idKategori
          } else if (categoryA.level === 3) {
            const parentDiff = (categoryA.idParent || 0) - (categoryB.idParent || 0)
            if (parentDiff !== 0) return parentDiff
            return categoryA.idKategori - categoryB.idKategori
          }

          return categoryA.idKategori - categoryB.idKategori
        })

        const level1Categories = new Map<number, Level1Group>()
        const level2Categories = new Map<number, Level2Group>()

        sortedTransactions.forEach((transaction) => {
          const category = transaction.kategoriApbd
          const level = category.level

          if (level === 1) {
            if (!level1Categories.has(category.idKategori)) {
              level1Categories.set(category.idKategori, {
                category,
                transaction,
                children: [],
                total: Number(transaction.jumlah) || 0,
              })
            }
          } else if (level === 2) {
            if (!level2Categories.has(category.idKategori)) {
              level2Categories.set(category.idKategori, {
                category,
                transaction,
                children: [],
                total: Number(transaction.jumlah) || 0,
              })
            }
          } else if (level === 3 && category.idParent) {
            const level2Parent = level2Categories.get(category.idParent)
            if (level2Parent) {
              level2Parent.children.push({
                category,
                transaction,
                amount: Number(transaction.jumlah) || 0,
              })
            }
          }
        })

        level2Categories.forEach((level2Group: Level2Group) => {
          const level2Category = level2Group.category
          if (level2Category.idParent) {
            const level1Parent = level1Categories.get(level2Category.idParent)
            if (level1Parent) {
              level1Parent.children.push(level2Group)
            }
          }
        })

        const result: Level1Group[] = []

        level1Categories.forEach((level1Group: Level1Group) => {
          result.push(level1Group)
        })

        level2Categories.forEach((level2Group: Level2Group) => {
          const level2Category = level2Group.category
          if (!level2Category.idParent || !level1Categories.has(level2Category.idParent)) {
            result.push({
              category: level2Group.category,
              transaction: level2Group.transaction,
              children: level2Group.children.map((child) => ({
                category: child.category,
                transaction: child.transaction,
                children: [],
                total: child.amount,
              })),
              total: level2Group.total,
            })
          }
        })

        return result
      }

      const pendapatanTransactions =
        pendapatanData.success && pendapatanData.data?.transactions
          ? pendapatanData.data.transactions.map((t: any) => ({ ...t, jumlah: Number(t.jumlah) || 0 }))
          : []
      const belanjaTransactions =
        belanjaData.success && belanjaData.data?.transactions
          ? belanjaData.data.transactions.map((t: any) => ({ ...t, jumlah: Number(t.jumlah) || 0 }))
          : []
      const pembiayaanTransactions =
        pembiayaanData.success && pembiayaanData.data?.transactions
          ? pembiayaanData.data.transactions.map((t: any) => ({ ...t, jumlah: Number(t.jumlah) || 0 }))
          : []

      const pendapatanGroups = processTransactions(pendapatanTransactions)
      const belanjaGroups = processTransactions(belanjaTransactions)
      const pembiayaanGroups = processTransactions(pembiayaanTransactions)

      const pendapatanTotal = pendapatanGroups.reduce((sum, group) => sum + group.total, 0)
      const belanjaTotal = belanjaGroups.reduce((sum, group) => sum + group.total, 0)
      const pembiayaanTotal = pembiayaanGroups.reduce((sum, group) => sum + group.total, 0)

      const pendapatanCategories = pendapatanGroups.flatMap((group) =>
        group.children.map((child) => ({
          nama: child.category.namaKategori,
          jumlah: child.total,
          persentase: pendapatanTotal > 0 ? (child.total / pendapatanTotal) * 100 : 0,
        })),
      )

      const belanjaCategories = belanjaGroups.flatMap((group) =>
        group.children.map((child) => ({
          nama: child.category.namaKategori,
          jumlah: child.total,
          persentase: belanjaTotal > 0 ? (child.total / belanjaTotal) * 100 : 0,
        })),
      )

      const pembiayaanCategories = pembiayaanGroups.flatMap((group) =>
        group.children.map((child) => ({
          nama: child.category.namaKategori,
          jumlah: child.total,
          persentase: pembiayaanTotal > 0 ? (child.total / pembiayaanTotal) * 100 : 0,
        })),
      )

      const summary: AnnualSummary = {
        tahun: selectedYear,
        pendapatan: {
          total: pendapatanTotal,
          categories: pendapatanCategories,
        },
        belanja: {
          total: belanjaTotal,
          categories: belanjaCategories,
        },
        pembiayaan: {
          total: pembiayaanTotal,
          categories: pembiayaanCategories,
        },
        surplus_defisit: pendapatanTotal - belanjaTotal,
      }

      console.log(" Calculated summary:", summary)
      setSummaryData(summary)
    } catch (err) {
      console.error(" Error fetching annual summary:", err)
      setError("Gagal memuat ringkasan tahunan")
    } finally {
      setLoading(false)
    }
  }

  if (loading || selectedYear === null) {
    return (
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-lg font-medium text-blue-600">Memuat ringkasan tahunan...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4 text-lg">{error}</p>
            <button
              onClick={fetchAnnualSummary}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (
    !summaryData ||
    (summaryData.pendapatan.total === 0 && summaryData.belanja.total === 0 && summaryData.pembiayaan.total === 0)
  ) {
    return (
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl md:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
          <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Bagian Judul */}
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">
                Ringkasan Tahunan BPKAD
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-blue-100 leading-relaxed">
                Ringkasan lengkap anggaran pendapatan dan belanja daerah tahun {selectedYear}
              </p>
            </div>

            {/* Dropdown Tahun */}
            <div className="flex flex-col items-start lg:items-end gap-3">
              <Select
                value={selectedYear ? selectedYear.toString() : ""}
                onValueChange={(value) => setSelectedYear(Number.parseInt(value))}
              >
                <SelectTrigger className="w-full sm:w-40 md:w-48 h-10 sm:h-12 border-2 border-white/40 text-white placeholder:text-white rounded-lg bg-white/10 backdrop-blur">
                  <SelectValue placeholder="Pilih Tahun" />
                </SelectTrigger>

                {/* Isi dropdown tetap putih, text item hitam */}
                <SelectContent className="bg-white text-black rounded-lg shadow-md">
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()} className="hover:bg-gray-100 text-black">
                      Tahun {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <PieChart className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Data Belum Tersedia</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Data APBD untuk tahun {selectedYear} belum tersedia di database.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl md:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Bagian Judul */}
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">
              Ringkasan Tahunan APBD
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-blue-100 leading-relaxed">
              Ringkasan lengkap anggaran pendapatan dan belanja daerah tahun{" "}
              {selectedYear}
            </p>
          </div>

          {/* Dropdown Tahun */}
          <div className="flex flex-col items-start lg:items-end gap-3">
            <Select
              value={selectedYear ? selectedYear.toString() : ""}
              onValueChange={(value) => setSelectedYear(Number.parseInt(value))}
            >
              <SelectTrigger className="w-full sm:w-40 md:w-48 h-10 sm:h-12 border-2 border-white/40 text-white placeholder:text-white rounded-lg bg-white/10 backdrop-blur">
                <SelectValue placeholder="Pilih Tahun" />
              </SelectTrigger>

              {/* Isi dropdown tetap putih, text item hitam */}
              <SelectContent className="bg-white text-black rounded-lg shadow-md">
                {availableYears.map((year) => (
                  <SelectItem
                    key={year}
                    value={year.toString()}
                    className="hover:bg-gray-100 text-black"
                  >
                    Tahun {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2">
        <Card className="px-3 border-0 shadow-md bg-gradient-to-br from-emerald-500 to-green-600 text-white overflow-hidden relative min-h-28">
          <div className="absolute top-0 right-0 w-6 h-6 sm:w-8 sm:h-8 bg-white/10 rounded-full -translate-y-3 translate-x-3"></div>

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2">
            <CardTitle className="text-xs lg:text-lg font-medium opacity-90">
              Total Pendapatan
            </CardTitle>
            {/* <div className="p-1 bg-white/20 rounded-lg flex-shrink-0">
              <TrendingUp className="h-3 w-3" />
            </div> */}
          </CardHeader>

          <CardContent className="p-2 pt-0">
            <div className="text-sm lg:text-2xl font-bold mb-1 leading-tight break-all">
              <span className="lg:hidden">
                {formatCompactCurrency(summaryData.pendapatan.total)}
              </span>
              <span className="hidden lg:inline">
                {formatCurrency(summaryData.pendapatan.total)}
              </span>
            </div>
            <p className="text-[10px] opacity-80 leading-tight">
              {summaryData.pendapatan.categories.length} kategori pendapatan
            </p>
          </CardContent>
        </Card>

        <Card className="px-3 border-0 shadow-md bg-gradient-to-br from-red-500 to-rose-600 text-white overflow-hidden relative min-h-28">
          <div className="absolute top-0 right-0 w-6 h-6 sm:w-8 sm:h-8 bg-white/10 rounded-full -translate-y-3 translate-x-3"></div>

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2">
            <CardTitle className="text-sm lg:text-lg font-medium opacity-90">
              Total Belanja
            </CardTitle>
            {/* <div className="p-1 bg-white/20 rounded-lg flex-shrink-0">
              <TrendingDown className="h-3 w-3" />
            </div> */}
          </CardHeader>

          <CardContent className="p-2 pt-0">
            <div className="text-sm lg:text-2xl font-bold mb-1 leading-tight break-all">
              <span className="lg:hidden">
                {formatCompactCurrency(summaryData.belanja.total)}
              </span>
              <span className="hidden lg:inline">
                {formatCurrency(summaryData.belanja.total)}
              </span>
            </div>
            <p className="text-[10px] opacity-80 leading-tight">
              {summaryData.belanja.categories.length} kategori belanja
            </p>
          </CardContent>
        </Card>

        <Card className="px-3 border-0 shadow-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white overflow-hidden relative min-h-28">
          <div className="absolute top-0 right-0 w-6 h-6 sm:w-8 sm:h-8 bg-white/10 rounded-full -translate-y-3 translate-x-3"></div>

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2">
            <CardTitle className="text-sm lg:text-lg font-medium opacity-90">
              Total Pembiayaan
            </CardTitle>
            {/* <div className="p-1 bg-white/20 rounded-lg flex-shrink-0">
              <Wallet className="h-3 w-3" />
            </div> */}
          </CardHeader>

          <CardContent className="p-2 pt-0">
            <div className="text-sm lg:text-2xl font-bold mb-1 leading-tight break-all">
              <span className="lg:hidden">
                {formatCompactCurrency(summaryData.pembiayaan.total)}
              </span>
              <span className="hidden lg:inline">
                {formatCurrency(summaryData.pembiayaan.total)}
              </span>
            </div>
            <p className="text-[10px] opacity-80 leading-tight">
              {summaryData.pembiayaan.categories.length} kategori pembiayaan
            </p>
          </CardContent>
        </Card>

        <Card
          className={`px-3 border-0 shadow-md text-white overflow-hidden relative min-h-28 ${
            summaryData.surplus_defisit >= 0
              ? "bg-gradient-to-br from-emerald-500 to-teal-600"
              : "bg-gradient-to-br from-orange-500 to-red-600"
          }`}
        >
          <div className="absolute top-0 right-0 w-6 h-6 sm:w-8 sm:h-8 bg-white/10 rounded-full -translate-y-3 translate-x-3"></div>

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2">
            <CardTitle className="text-sm lg:text-lg font-medium opacity-90 ">
              Surplus/Defisit
            </CardTitle>
            <div className="p-1 bg-white/20 rounded-lg flex-shrink-0">
              <Target className="h-3 w-3" />
            </div>
          </CardHeader>

          <CardContent className="p-2 pt-0">
            <div className="text-sm lg:text-2xl font-bold mb-1 leading-tight break-all">
              <span className="lg:hidden">
                {formatCompactCurrency(summaryData.surplus_defisit)}
              </span>
              <span className="hidden lg:inline">
                {formatCurrency(summaryData.surplus_defisit)}
              </span>
            </div>
            <p className="text-[10px] opacity-80 leading-tight">
              {summaryData.surplus_defisit >= 0
                ? "Anggaran Surplus"
                : "Anggaran Defisit"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100 p-3 sm:p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 sm:gap-3 text-emerald-700 text-sm sm:text-base md:text-lg">
              {/* <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-emerald-600" />
              </div> */}
              Pendapatan Daerah
            </CardTitle>
            <CardDescription className="text-emerald-600 text-xs sm:text-sm leading-relaxed">
              Breakdown pendapatan berdasarkan kategori
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
            {summaryData.pendapatan.categories.map((category, index) => (
              <div key={index} className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 flex-1 min-w-0 truncate">
                    {category.nama}
                  </span>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 flex-shrink-0 text-xs">
                    {category.persentase.toFixed(1)}%
                  </Badge>
                </div>
                <Progress
                  value={category.persentase}
                  className="h-1.5 sm:h-2 bg-emerald-100"
                />
                <div className="text-sm sm:text-base md:text-lg font-bold text-emerald-600 break-all overflow-wrap-anywhere">
                  <span className="sm:hidden">
                    {formatCompactCurrency(category.jumlah)}
                  </span>
                  <span className="hidden sm:inline">
                    {formatCurrency(category.jumlah)}
                  </span>
                </div>
                {index < summaryData.pendapatan.categories.length - 1 && (
                  <Separator className="bg-emerald-100" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-100 p-3 sm:p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 sm:gap-3 text-red-700 text-sm sm:text-base md:text-lg">
              {/* <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg flex-shrink-0">
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-red-600" />
              </div> */}
              Belanja Daerah
            </CardTitle>
            <CardDescription className="text-red-600 text-xs sm:text-sm leading-relaxed">
              Breakdown belanja berdasarkan kategori
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
            {summaryData.belanja.categories.map((category, index) => (
              <div key={index} className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 flex-1 min-w-0 truncate">
                    {category.nama}
                  </span>
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-200 flex-shrink-0 text-xs">
                    {category.persentase.toFixed(1)}%
                  </Badge>
                </div>
                <Progress
                  value={category.persentase}
                  className="h-1.5 sm:h-2 bg-red-100"
                />
                <div className="text-sm sm:text-base md:text-lg font-bold text-red-600 break-all overflow-wrap-anywhere">
                  <span className="sm:hidden">
                    {formatCompactCurrency(category.jumlah)}
                  </span>
                  <span className="hidden sm:inline">
                    {formatCurrency(category.jumlah)}
                  </span>
                </div>
                {index < summaryData.belanja.categories.length - 1 && (
                  <Separator className="bg-red-100" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-3 sm:p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 sm:gap-3 text-blue-700 text-sm sm:text-base md:text-lg">
              {/* <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Wallet className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-600" />
              </div> */}
              Pembiayaan Daerah
            </CardTitle>
            <CardDescription className="text-blue-600 text-xs sm:text-sm leading-relaxed">
              Breakdown pembiayaan berdasarkan kategori
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
            {summaryData.pembiayaan.categories.length > 0 ? (
              summaryData.pembiayaan.categories.map((category, index) => (
                <div key={index} className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-700 flex-1 min-w-0 truncate">
                      {category.nama}
                    </span>
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 flex-shrink-0 text-xs">
                      {category.persentase.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress
                    value={category.persentase}
                    className="h-1.5 sm:h-2 bg-blue-100"
                  />
                  <div className="text-sm sm:text-base md:text-lg font-bold text-blue-600 break-all overflow-wrap-anywhere">
                    <span className="sm:hidden">
                      {formatCompactCurrency(category.jumlah)}
                    </span>
                    <span className="hidden sm:inline">
                      {formatCurrency(category.jumlah)}
                    </span>
                  </div>
                  {index < summaryData.pembiayaan.categories.length - 1 && (
                    <Separator className="bg-blue-100" />
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-6 sm:py-8 md:py-12 text-gray-500">
                <div className="p-3 sm:p-4 bg-blue-50 rounded-full w-fit mx-auto mb-3 sm:mb-4">
                  <PieChart className="h-6 w-6 sm:h-8 sm:w-8 md:h-12 md:w-12 text-blue-300" />
                </div>
                <p className="text-sm sm:text-base md:text-lg font-medium">
                  Tidak ada data pembiayaan
                </p>
                <p className="text-xs sm:text-sm">untuk tahun {selectedYear}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
