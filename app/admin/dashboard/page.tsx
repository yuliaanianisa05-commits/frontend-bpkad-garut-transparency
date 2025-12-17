"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  AlertCircle,
  Database,
  RefreshCw,
} from "lucide-react";
import {
  apiClient,
  formatCurrency,
  type DashboardSummary,
  type TahunAnggaran,
} from "@/lib/api";
import { BudgetOverviewChart } from "@/components/dashboard/budget-overview-chart";
import { CategoryBreakdownChart } from "@/components/dashboard/category-breakdown-chart";
import { TrendChart } from "@/components/dashboard/trend-chart";

export default function DashboardPage() {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(
    null
  );
  const [availableYears, setAvailableYears] = useState<TahunAnggaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<
    "checking" | "connected" | "disconnected"
  >("checking");
  const [isDataMissing, setIsDataMissing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refreshData = async () => {
    if (!selectedYear) return;

    setRefreshing(true);
    console.log(`🔄 Manual refresh triggered`);

    const response = await apiClient.getDashboardSummary(selectedYear);
    if (response.success && response.data) {
      setDashboardData(response.data);
      setError(null);
      setIsDataMissing(false);
      console.log(`✅ Data refreshed successfully`);
    } else {
      console.log(`❌ Refresh failed:`, response.error);
      if (
        response.error?.includes("404") ||
        response.error?.includes("tidak ditemukan")
      ) {
        setIsDataMissing(true);
        setError(
          `Data BPKAD untuk tahun ${selectedYear} belum tersedia dalam database`
        );
      } else {
        setIsDataMissing(false);
        setError(response.error || "Gagal memuat data dashboard");
      }
    }

    setRefreshing(false);
  };

  useEffect(() => {
    const checkBackendConnection = async () => {
      console.log(`🔍 Checking backend connection...`);
      const healthResponse = await apiClient.healthCheck();

      if (healthResponse.success) {
        console.log(`✅ Backend is connected`);
        setBackendStatus("connected");
      } else {
        console.log(`❌ Backend connection failed:`, healthResponse.error);
        setBackendStatus("disconnected");
        setError(healthResponse.error || "Backend tidak dapat diakses");
        setIsDataMissing(false);
        setLoading(false);
        return;
      }

      const fetchAvailableYears = async () => {
        console.log(`📅 Fetching available years...`);
        const response = await apiClient.getTahunAnggaran();
        if (response.success && response.data) {
          console.log(`✅ Available years:`, response.data);
          setAvailableYears(response.data);
          if (response.data.length > 0) {
            const sortedYears = response.data.sort((a, b) => b.tahun - a.tahun);
            const latestYear = sortedYears[0].tahun;
            console.log(`📅 Auto-selecting latest year: ${latestYear}`);
            setSelectedYear(latestYear);
          }
        } else {
          console.log(`❌ Failed to fetch years:`, response.error);
          setError(response.error || "Gagal memuat data tahun anggaran");
          setIsDataMissing(false);
        }
      };

      await fetchAvailableYears();
    };

    checkBackendConnection();
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!selectedYear || backendStatus !== "connected") return;

      setLoading(true);
      setError(null);
      setIsDataMissing(false);

      console.log(`🔄 Fetching dashboard data for year: ${selectedYear}`);

      const response = await apiClient.getDashboardSummary(selectedYear);

      console.log(`📊 Dashboard API Response:`, response);

      if (response.success && response.data) {
        console.log(
          `✅ Dashboard data loaded successfully:`,
          response.data
        );
        console.log(`💸 Spending data check:`, {
          totalBelanja: response.data.totalBelanja,
          kategoriBelanja: response.data.kategoriBelanja?.length || 0,
          hasSpendingData: response.data.totalBelanja > 0,
        });
        setDashboardData(response.data);
      } else {
        console.log(`❌ Dashboard API Error:`, response.error);
        const emptyDashboardData: DashboardSummary = {
          tahun: selectedYear,
          totalPendapatan: 0,
          totalBelanja: 0,
          surplusDefisit: 0,
          pembiayaanNetto: 0,
          sisaPembiayaan: 0,
          kategoriBelanja: [],
          kategoriPendapatan: [],
        };

        console.log(
          `📊 Using empty data structure for year ${selectedYear}`
        );
        setDashboardData(emptyDashboardData);

        if (
          response.error?.includes("404") ||
          response.error?.includes("tidak ditemukan")
        ) {
          console.log(
            `ℹ️ No data available for year ${selectedYear}, showing empty dashboard`
          );
        }
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, [selectedYear, backendStatus]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (backendStatus === "disconnected") {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-semibold">Koneksi Backend Bermasalah</div>
              <div className="text-sm">
                ❌ Backend server tidak dapat diakses. Pastikan server backend
                berjalan di http://localhost:5000
              </div>
              <div className="text-xs mt-3 p-3 bg-red-50 rounded border">
                <div className="font-medium mb-1">Langkah troubleshooting:</div>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Pastikan backend server berjalan di port 5000</li>
                  <li>Cek environment variable NEXT_PUBLIC_API_URL</li>
                  <li>Pastikan database terhubung dengan benar</li>
                  <li>Periksa CORS configuration di backend</li>
                </ol>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error && !isDataMissing) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-semibold">Terjadi Kesalahan</div>
              <div className="text-sm">{error}</div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!selectedYear || !dashboardData) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Data tidak tersedia untuk tahun yang dipilih
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const surplusDefisit = dashboardData.surplusDefisit;
  const isSurplus = surplusDefisit >= 0;

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6 min-h-screen bg-gray-50/50">
      <div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-balance text-gray-900">
            Dashboard BPKAD
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Ringkasan Anggaran Pendapatan dan Belanja Daerah
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(Number.parseInt(value))}
          >
            <SelectTrigger className="w-full sm:w-32 md:w-40 border-blue-200 focus:ring-blue-500">
              <SelectValue placeholder="Pilih Tahun" />
            </SelectTrigger>
            <SelectContent>
              {availableYears
                .sort((a, b) => b.tahun - a.tahun)
                .map((year) => (
                  <SelectItem key={year.idTahun} value={year.tahun.toString()}>
                    {year.tahun}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button
            onClick={refreshData}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-white hover:bg-blue-50 border-blue-200 hover:border-blue-300 transition-colors"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">
              {refreshing ? "Memuat..." : "Refresh"}
            </span>
          </Button>
        </div>
      </div>

      {dashboardData.totalPendapatan === 0 &&
        dashboardData.totalBelanja === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 md:p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <Database className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">
                Data BPKAD untuk tahun {selectedYear} belum tersedia dalam
                database. Dashboard menampilkan nilai 0 untuk semua kategori.
              </span>
            </div>
          </div>
        )}

      {dashboardData.totalPendapatan > 0 &&
        dashboardData.totalBelanja === 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 md:p-4">
            <div className="flex items-center gap-2 text-orange-800">
              <Database className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">
                Data pembelanjaan untuk tahun {selectedYear} belum tersedia.
                Hanya data pendapatan yang ditampilkan.
              </span>
            </div>
          </div>
        )}

      {dashboardData.totalPendapatan === 0 &&
        dashboardData.totalBelanja > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <Database className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">
                Data pendapatan untuk tahun {selectedYear} belum tersedia. Hanya
                data pembelanjaan yang ditampilkan.
              </span>
            </div>
          </div>
        )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-700 leading-tight">
              Total Pendapatan
            </CardTitle>
            {/* <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </div> */}
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-700 break-words leading-tight">
              {formatCurrency(dashboardData.totalPendapatan)}
            </div>
            <p className="text-xs text-blue-600 mt-1 leading-tight">
              Realisasi pendapatan daerah
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-700 leading-tight">
              Total Pembelanjaan
            </CardTitle>
            {/* <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </div> */}
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-700 break-words leading-tight">
              {formatCurrency(dashboardData.totalBelanja)}
            </div>
            <p className="text-xs text-emerald-600 mt-1 leading-tight">
              Realisasi pembelanjaan daerah
            </p>
          </CardContent>
        </Card>

        <Card
          className={`shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 ${
            isSurplus
              ? "bg-gradient-to-br from-green-50 to-green-100 border-green-200"
              : "bg-gradient-to-br from-red-50 to-red-100 border-red-200"
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-700 leading-tight">
              Surplus/Defisit
            </CardTitle>
            {/* <div
              className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                isSurplus ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {isSurplus ? (
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              ) : (
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              )}
            </div> */}
          </CardHeader>
          <CardContent className="pt-1">
            <div
              className={`text-lg sm:text-xl lg:text-2xl font-bold break-words leading-tight ${
                isSurplus ? "text-green-700" : "text-red-700"
              }`}
            >
              {formatCurrency(Math.abs(surplusDefisit))}
            </div>
            <div
              className={`flex items-center gap-2 mt-1 text-lg sm:text-xl lg:text-2xl font-bold break-words leading-tight ${
                isSurplus ? "text-green-700" : "text-red-700"
              }`}
            >
              <span
                className={`text-xs font-medium ${
                  isSurplus ? "text-green-700" : "text-red-700"
                }`}
              >
                {isSurplus ? "Surplus" : "Defisit"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-700 leading-tight">
              Pembiayaan Netto
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-amber-700 break-words leading-tight">
              {formatCurrency(dashboardData.pembiayaanNetto)}
            </div>
            <p className="text-xs text-amber-600 mt-1 leading-tight">
              Saldo pembiayaan
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="bg-white border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg text-gray-900">
              Ringkasan Anggaran
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Perbandingan pendapatan dan pembelanjaan tahun {selectedYear}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="w-full h-[280px] sm:h-[320px] lg:h-[350px]">
              <BudgetOverviewChart data={dashboardData} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg text-gray-900">
              Komposisi Pendapatan
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Breakdown kategori pendapatan daerah
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="w-full h-[280px] sm:h-[320px] lg:h-[350px]">
              <CategoryBreakdownChart
                data={dashboardData.kategoriPendapatan}
                type="pendapatan"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="bg-white border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg text-gray-900">
              Komposisi Pembelanjaan
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Breakdown kategori pembelanjaan daerah
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="w-full h-[280px] sm:h-[320px] lg:h-[350px]">
              <CategoryBreakdownChart
                data={dashboardData.kategoriBelanja}
                type="belanja"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg text-gray-900">
              Tren Anggaran
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Perbandingan anggaran dari waktu ke waktu
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="w-full h-[280px] sm:h-[320px] lg:h-[350px]">
              <TrendChart currentYear={selectedYear} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6 min-h-screen">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
