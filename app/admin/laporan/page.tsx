"use client"

import { useState, useEffect } from "react"
import { Download, Calendar, FileText, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  apiClient,
  formatCurrency,
  type RevenueBreakdownItem,
  type ExpenditureBreakdownItem,
  type FinancingBreakdownItem,
  type TahunAnggaran,
  type DashboardSummary,
} from "@/lib/api"

export default function LaporanPage() {
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [years, setYears] = useState<TahunAnggaran[]>([])
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null)
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueBreakdownItem[]>([])
  const [expenditureBreakdown, setExpenditureBreakdown] = useState<ExpenditureBreakdownItem[]>([])
  const [financingBreakdown, setFinancingBreakdown] = useState<FinancingBreakdownItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedYear) {
      fetchReportData()
    }
  }, [selectedYear])

  const fetchInitialData = async () => {
    try {
      const yearsResponse = await apiClient.getTahunAnggaran()
      if (yearsResponse.success && yearsResponse.data) {
        setYears(yearsResponse.data)
        if (yearsResponse.data.length > 0) {
          const latestYear = Math.max(...yearsResponse.data.map((y) => y.tahun))
          setSelectedYear(latestYear)
        }
      }
    } catch (error) {
      console.error("Error fetching initial data:", error)
      setError("Gagal memuat data awal")
    }
  }

  const fetchReportData = async () => {
    if (!selectedYear) return

    try {
      setLoading(true)
      setError(null)

      const [dashboardResponse, revenueResponse, expenditureResponse, financingResponse] = await Promise.all([
        apiClient.getDashboardSummary(selectedYear),
        apiClient.getRevenueBreakdown(selectedYear),
        apiClient.getExpenditureBreakdown(selectedYear),
        apiClient.getFinancingBreakdown(selectedYear),
      ])

      if (dashboardResponse.success && dashboardResponse.data) {
        setDashboardData(dashboardResponse.data)
      } else {
        setDashboardData(null)
      }

      if (revenueResponse.success && revenueResponse.data) {
        setRevenueBreakdown(revenueResponse.data)
      } else {
        setRevenueBreakdown([])
      }

      if (expenditureResponse.success && expenditureResponse.data) {
        setExpenditureBreakdown(expenditureResponse.data)
      } else {
        setExpenditureBreakdown([])
      }

      if (financingResponse.success && financingResponse.data) {
        setFinancingBreakdown(financingResponse.data)
      } else {
        setFinancingBreakdown([])
      }
    } catch (error) {
      console.error(`❌ Error fetching report data for year ${selectedYear}:`, error)
      setError(`Gagal memuat data laporan untuk tahun ${selectedYear}`)
      setDashboardData(null)
      setRevenueBreakdown([])
      setExpenditureBreakdown([])
      setFinancingBreakdown([])
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            if (typeof value === "string" && value.includes(",")) {
              return `"${value}"`
            }
            return value
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}_${selectedYear}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderBreakdownTable = (
    data: (RevenueBreakdownItem | ExpenditureBreakdownItem | FinancingBreakdownItem)[],
    title: string,
    colorClass: string,
  ) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              Rincian {title.toLowerCase()} tahun {selectedYear}
            </CardDescription>
          </div>
          {/* <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV(data, title.toLowerCase().replace(" ", "_"))}
            disabled={data.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button> */}
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <FileText className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Data</h3>
            <p className="text-gray-500">
              Tidak ada data {title.toLowerCase()} untuk tahun {selectedYear}.
              <br />
              Pastikan data transaksi sudah diinput untuk tahun ini.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Uraian</TableHead>
                <TableHead className="text-right">Jumlah (Rp)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={index} className={item.isTotal ? "font-bold bg-muted" : ""}>
                  <TableCell>
                    <Badge variant="outline" className={item.level === 1 ? "bg-primary text-primary-foreground" : ""}>
                      {item.kode || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className={`${item.level > 1 ? `ml-${(item.level - 1) * 4}` : ""}`}>{item.nama}</div>
                  </TableCell>
                  <TableCell className={`text-right font-mono ${colorClass}`}>{formatCurrency(item.jumlah)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )

  if (loading || selectedYear === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 md:p-6">
            <Skeleton className="h-6 md:h-8 w-48 md:w-64 bg-blue-200/50" />
            <Skeleton className="h-3 md:h-4 w-32 md:w-48 bg-blue-200/30 mt-2" />
          </div>
          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg p-4">
                <Skeleton className="h-24 md:h-32 bg-blue-200/50" />
              </div>
            ))}
          </div>
          <Skeleton className="h-64 md:h-96 w-full bg-blue-100/50 rounded-lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
        <div className="p-4 md:p-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
        <div className="p-4 md:p-6">
          <Alert>
            <AlertDescription>
              Data tidak tersedia untuk tahun {selectedYear}. Silakan pilih tahun lain atau pastikan data sudah diinput.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 md:p-6 text-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start md:items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm flex-shrink-0">
                <FileText className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-balance leading-tight">
                  📊 Laporan Keuangan Tahunan
                </h1>
                <p className="text-blue-100 mt-1 text-sm md:text-base">
                  Laporan komprehensif BPKAD Kabupaten Garut
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                <Calendar className="h-4 w-4 text-blue-100 flex-shrink-0" />
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => {
                    const newYear = Number.parseInt(value);
                    setSelectedYear(newYear);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-32 bg-white/20 border-white/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years
                      .sort((a, b) => b.tahun - a.tahun)
                      .map((year) => (
                        <SelectItem
                          key={year.idTahun}
                          value={year.tahun.toString()}
                        >
                          {year.tahun}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {/* <Button
                onClick={() => {
                  if (dashboardData) {
                    exportToCSV([dashboardData], "ringkasan_apbd")
                  }
                }}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-sm"
                variant="outline"
                disabled={!dashboardData}
              >
                <Download className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Export Laporan</span>
              </Button> */}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
          <Card className="bg-gradient-to-br from-blue-100 to-indigo-100 border-blue-200 hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm lg:text-lg font-medium text-blue-900 truncate">
                  Total Pendapatan
                </CardTitle>
                {/* <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div> */}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold text-blue-700 truncate">
                {formatCurrency(dashboardData.totalPendapatan)}
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Realisasi pendapatan daerah
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-100 to-indigo-100 border-blue-200 hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-2 ">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm lg:text-lg font-medium text-blue-900 truncate">
                  Total Belanja
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold text-red-600 truncate">
                {formatCurrency(dashboardData.totalBelanja)}
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Realisasi belanja daerah
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-100 to-indigo-100 border-blue-200 hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm lg:text-lg font-medium text-blue-900 truncate">
                  Surplus/Defisit
                </CardTitle>
                <div
                  className={`p-2 rounded-lg flex-shrink-0 ${
                    dashboardData.surplusDefisit >= 0
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                >
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={`text-lg md:text-2xl font-bold truncate ${
                  dashboardData.surplusDefisit >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatCurrency(Math.abs(dashboardData.surplusDefisit))}
              </div>
              <Badge className={`text-xs mt-1 px-2 py-0.5 rounded-full `}>
                {dashboardData.surplusDefisit >= 0 ? "Surplus" : "Defisit"}
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-100 to-indigo-100 border-blue-200 hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm lg:text-lg font-medium text-blue-900 truncate">
                  Pembiayaan Netto
                </CardTitle>
                {/* <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
                  <DollarSign className="h-4 w-4 text-white" />
                </div> */}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold text-blue-700 truncate">
                {formatCurrency(dashboardData.pembiayaanNetto)}
              </div>
              <p className="text-xs text-blue-600 mt-1">Saldo pembiayaan</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Reports */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="bg-white/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-blue-200"
        >
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-blue-100 border-blue-200 h-auto">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs md:text-sm py-2 px-2"
            >
              Ringkasan
            </TabsTrigger>
            <TabsTrigger
              value="pendapatan"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs md:text-sm py-2 px-2"
            >
              Pendapatan
            </TabsTrigger>
            <TabsTrigger
              value="belanja"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs md:text-sm py-2 px-2"
            >
              Belanja
            </TabsTrigger>
            <TabsTrigger
              value="pembiayaan"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs md:text-sm py-2 px-2"
            >
              Pembiayaan
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="overview"
            className="space-y-4 md:space-y-6 mt-4 md:mt-6"
          >
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">
                  Ringkasan Eksekutif
                </CardTitle>
                <CardDescription className="text-sm">
                  Ikhtisar keuangan APBD Kabupaten Garut tahun {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow className="bg-blue-500 hover:bg-blue-500">
                        <TableHead className="text-white font-semibold text-xs md:text-sm min-w-[120px]">
                          Ringkasan
                        </TableHead>
                        <TableHead className="text-white font-semibold text-right text-xs md:text-sm min-w-[100px]">
                          Pendapatan
                        </TableHead>
                        <TableHead className="text-white font-semibold text-right text-xs md:text-sm min-w-[100px]">
                          Belanja
                        </TableHead>
                        <TableHead className="text-white font-semibold text-right text-xs md:text-sm min-w-[100px]">
                          Pembiayaan
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">
                              Ringkasan Eksekutif
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              Ikhtisar keuangan APBD Kabupaten Garut tahun{" "}
                              {selectedYear}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-blue-700 font-semibold text-xs md:text-sm">
                          {formatCurrency(dashboardData.totalPendapatan)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-red-600 font-semibold text-xs md:text-sm">
                          {formatCurrency(dashboardData.totalBelanja)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-blue-700 font-semibold text-xs md:text-sm">
                          {formatCurrency(dashboardData.pembiayaanNetto)}
                        </TableCell>
                      </TableRow>

                      {dashboardData.kategoriPendapatan &&
                        dashboardData.kategoriPendapatan.length > 0 && (
                          <>
                            {dashboardData.kategoriPendapatan
                              .slice(0, 3)
                              .map((kategori, index) => (
                                <TableRow
                                  key={`pendapatan-${index}`}
                                  className="hover:bg-blue-50"
                                >
                                  <TableCell className="pl-8">
                                    <div className="text-sm text-gray-700">
                                      {kategori.kategori ||
                                        `Kategori Pendapatan ${index + 1}`}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-blue-600">
                                    {formatCurrency(kategori.jumlah || 0)}
                                  </TableCell>

                                  <TableCell className="text-right text-gray-400">
                                    - - -
                                  </TableCell>
                                  <TableCell className="text-right text-gray-400">
                                    - - - -
                                  </TableCell>
                                </TableRow>
                              ))}
                          </>
                        )}

                      {expenditureBreakdown &&
                        expenditureBreakdown.length > 0 && (
                          <>
                            {expenditureBreakdown
                              .slice(0, 3)
                              .map((item, index) => (
                                <TableRow
                                  key={`belanja-${index}`}
                                  className="hover:bg-red-50"
                                >
                                  <TableCell className="pl-8">
                                    <div className="text-sm text-gray-700">
                                      {item.nama ||
                                        `Kategori Belanja ${index + 1}`}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right text-gray-400">
                                    - - -
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-red-600">
                                    {formatCurrency(item.jumlah || 0)}
                                  </TableCell>
                                  <TableCell className="text-right text-gray-400">
                                    - - - -
                                  </TableCell>
                                </TableRow>
                              ))}
                          </>
                        )}

                      {financingBreakdown && financingBreakdown.length > 0 && (
                        <>
                          {financingBreakdown.slice(0, 3).map((item, index) => (
                            <TableRow
                              key={`pembiayaan-${index}`}
                              className="hover:bg-blue-50"
                            >
                              <TableCell className="pl-8">
                                <div className="text-sm text-gray-700">
                                  {item.nama ||
                                    `Kategori Pembiayaan ${index + 1}`}
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-gray-400">
                                - - -
                              </TableCell>
                              <TableCell className="text-right text-gray-400">
                                - - - -
                              </TableCell>
                              <TableCell className="text-right font-mono text-blue-600">
                                {formatCurrency(item.jumlah || 0)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </>
                      )}

                      <TableRow className="border-t-2 border-blue-200 bg-blue-50 font-semibold">
                        <TableCell className="font-bold text-gray-900 text-sm">
                          Surplus/Defisit Anggaran
                        </TableCell>
                        <TableCell className="text-right text-gray-400">
                          - - -
                        </TableCell>
                        <TableCell className="text-right text-gray-400">
                          - - - -
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono font-bold text-xs md:text-sm ${
                            dashboardData.surplusDefisit >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(
                            Math.abs(dashboardData.surplusDefisit)
                          )}
                          <div className="text-xs mt-1">
                            <Badge
                              className={
                                dashboardData.surplusDefisit >= 0
                                  ? "bg-green-500 text-white"
                                  : "bg-red-500 text-white"
                              }
                            >
                              {dashboardData.surplusDefisit >= 0
                                ? "Surplus"
                                : "Defisit"}{" "}
                              Anggaran
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>

                      <TableRow className="bg-amber-50">
                        <TableCell className="font-semibold text-gray-900 text-sm">
                          Sisa Lebih Pembiayaan Anggaran (SILPA)
                        </TableCell>
                        <TableCell className="text-right text-gray-400">
                          - - -
                        </TableCell>
                        <TableCell className="text-right text-gray-400">
                          - - - -
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-amber-700 text-xs md:text-sm">
                          {formatCurrency(dashboardData.sisaPembiayaan)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 md:mt-6 p-3 md:p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-3 text-sm md:text-base">
                    Analisis Keuangan
                  </h4>
                  <div className="grid gap-2 md:gap-3 text-xs md:text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Total Pendapatan:</span>
                      <span className="font-mono font-semibold text-blue-700 truncate ml-2">
                        {formatCurrency(dashboardData.totalPendapatan)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Total Belanja:</span>
                      <span className="font-mono font-semibold text-red-600 truncate ml-2">
                        {formatCurrency(dashboardData.totalBelanja)}
                      </span>
                    </div>
                    {/* <div className="flex justify-between items-center border-t pt-2">
                      <span className="text-gray-700">
                        Rasio Belanja terhadap Pendapatan:
                      </span>
                      <span className="font-semibold ml-2">
                        {dashboardData.totalPendapatan > 0
                          ? (
                              (dashboardData.totalBelanja /
                                dashboardData.totalPendapatan) *
                              100
                            ).toFixed(2)
                          : "0.00"}
                        % - - -
                      </span>
                    </div> */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Status Anggaran:</span>
                      <Badge
                        className={
                          dashboardData.surplusDefisit >= 0
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                            : "bg-red-100 text-red-700 border border-red-300"
                        }
                      >
                        {dashboardData.surplusDefisit >= 0
                          ? "Surplus"
                          : "Defisit"}{" "}
                        Anggaran
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pendapatan" className="space-y-6">
            {renderBreakdownTable(
              revenueBreakdown,
              "Rincian Pendapatan",
              "text-blue-700"
            )}
          </TabsContent>

          <TabsContent value="belanja" className="space-y-6">
            {renderBreakdownTable(
              expenditureBreakdown,
              "Rincian Belanja",
              "text-red-600"
            )}
          </TabsContent>

          <TabsContent value="pembiayaan" className="space-y-6">
            {renderBreakdownTable(
              financingBreakdown,
              "Rincian Pembiayaan",
              "text-blue-700"
            )}
          </TabsContent>
        </Tabs>

        {/* Report Metadata */}
        <Card className="bg-white/50 backdrop-blur-sm border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 text-base md:text-lg">
              Informasi Laporan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2">
              <div>
                <h4 className="font-medium text-blue-800 text-sm md:text-base">
                  Periode Laporan
                </h4>
                <p className="text-xs md:text-sm text-blue-600">
                  Tahun Anggaran {selectedYear}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 text-sm md:text-base">
                  Tanggal Dibuat
                </h4>
                <p className="text-xs md:text-sm text-blue-600">
                  {new Date().toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 text-sm md:text-base">
                  Sumber Data
                </h4>
                <p className="text-xs md:text-sm text-blue-600">
                  Sistem Informasi APBD Kabupaten Garut
                </p>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 text-sm md:text-base">
                  Status
                </h4>
                <Badge
                  variant="default"
                  className="bg-blue-600 text-white text-xs"
                >
                  Data Terkini
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
