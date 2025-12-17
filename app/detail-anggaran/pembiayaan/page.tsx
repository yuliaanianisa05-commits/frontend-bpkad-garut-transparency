"use client";

import React from "react";
import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Calendar,
  BarChart3,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ComparisonBarChart from "../../../components/dashboard/comparison-bar-chart";
import CompositionPieChart from "../../../components/dashboard/composition-pie-chart";

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getTahunAnggaran = async () => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/tahun-anggaran`
    );
    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.data };
    }
    return { success: false, data: [] };
  } catch (error) {
    console.error("Error fetching years:", error);
    return { success: false, data: [] };
  }
};

interface Transaction {
  idTransaksi: number;
  jumlah: number;
  kategoriApbd: {
    idKategori: number;
    namaKategori: string;
    kode?: string;
    level: number;
    idParent?: number;
    jenis: string;
  };
  tahunAnggaran: {
    idTahun: number;
    tahun: number;
  };
}

interface Category {
  idKategori: number;
  namaKategori: string;
  kode?: string;
  level: number;
  jenis: string;
  idParent?: number;
}

interface Year {
  idTahun: number;
  tahun: number;
}

interface Level3TransactionItem {
  category: Category;
  transaction: Transaction;
  amount: number;
}

interface Level2Group {
  category: Category;
  children: Level3TransactionItem[];
  total: number;
}

interface Level1Group {
  category: Category;
  children: Level2Group[];
  total: number;
}

export default function DetailPembiayaanPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("2024");
  const [level2Categories, setLevel2Categories] = useState<Category[]>([]);
  const [level3Categories, setLevel3Categories] = useState<Category[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedYear && years.length > 0) {
      fetchTransactions();
      fetchDashboardData();
    }
  }, [selectedYear, years]);

  const fetchInitialData = async () => {
    try {
      const [yearsResponse, categoriesResponse] = await Promise.all([
        getTahunAnggaran(),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/kategori-apbd?jenis=Pembiayaan`
        ),
      ]);

      if (yearsResponse.success && yearsResponse.data) {
        const yearsData = yearsResponse.data;
        setYears(yearsData);

        if (yearsData.length > 0) {
          const latestYear = yearsData.reduce((latest: Year, current: Year) =>
            current.tahun > latest.tahun ? current : latest
          );
          setSelectedYear(latestYear.tahun.toString());
        }
      }

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        if (categoriesData.success) {
          const allCategories = categoriesData.data;
          setCategories(allCategories);

          const level2Cats = allCategories.filter(
            (cat: Category) => cat.level === 2
          );
          const level3Cats = allCategories.filter(
            (cat: Category) => cat.level === 3
          );

          setLevel2Categories(level2Cats);
          setLevel3Categories(level3Cats);
        }
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
      setError("Gagal memuat data awal");
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transaksi-apbd?tahun=${selectedYear}&jenis=Pembiayaan`
      );

      console.log(
        " API URL:",
        `${process.env.NEXT_PUBLIC_API_URL}/api/transaksi-apbd?tahun=${selectedYear}&jenis=Pembiayaan`
      );

      if (response.ok) {
        const data = await response.json();
        console.log(" API Response:", data);

        if (data.success) {
          const processedTransactions = (data.data.transactions || []).map(
            (transaction: any) => ({
              ...transaction,
              jumlah: Number(transaction.jumlah) || 0,
            })
          );

          console.log(" Processed transactions:", processedTransactions);
          setTransactions(processedTransactions);
        } else {
          console.log(" API returned success: false");
        }
      } else {
        console.log(
          " API response not ok:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError("Gagal memuat data transaksi");
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/summary/${selectedYear}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDashboardData(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const filteredTransactions = transactions.filter((transaction) =>
    transaction.kategoriApbd.namaKategori
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const groupedTransactions = useMemo(() => {
    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
      const categoryA = a.kategoriApbd;
      const categoryB = b.kategoriApbd;

      if (categoryA.jenis !== categoryB.jenis) {
        return categoryA.jenis.localeCompare(categoryB.jenis);
      }

      if (categoryA.level !== categoryB.level) {
        return categoryA.level - categoryB.level;
      }

      if (categoryA.level === 1) {
        return categoryA.idKategori - categoryB.idKategori;
      } else if (categoryA.level === 2) {
        return categoryA.idKategori - categoryB.idKategori;
      } else if (categoryA.level === 3) {
        const parentDiff =
          (categoryA.idParent || 0) - (categoryB.idParent || 0);
        if (parentDiff !== 0) return parentDiff;
        return categoryA.idKategori - categoryB.idKategori;
      }

      return categoryA.idKategori - categoryB.idKategori;
    });

    const level1Categories = new Map<number, Level1Group>();
    const level2Categories = new Map<number, Level2Group>();
    const level3Transactions: Level3TransactionItem[] = [];

    sortedTransactions.forEach((transaction) => {
      const category = transaction.kategoriApbd;
      if (category.level === 3) {
        level3Transactions.push({
          category,
          transaction,
          amount: Number(transaction.jumlah) || 0,
        });
      }
    });

    level3Transactions.forEach((level3Item: Level3TransactionItem) => {
      const parentId = level3Item.category.idParent;
      if (parentId) {
        if (!level2Categories.has(parentId)) {
          const level2Category = categories.find(
            (cat) => cat.idKategori === parentId && cat.level === 2
          );
          if (level2Category) {
            level2Categories.set(parentId, {
              category: level2Category,
              children: [],
              total: 0,
            });
          }
        }

        const level2Group = level2Categories.get(parentId);
        if (level2Group) {
          level2Group.children.push(level3Item);
          level2Group.total += level3Item.amount;
        }
      }
    });

    level2Categories.forEach((level2Group: Level2Group) => {
      const level2ParentId = level2Group.category.idParent;
      if (level2ParentId) {
        if (!level1Categories.has(level2ParentId)) {
          const level1Category = categories.find(
            (cat) => cat.idKategori === level2ParentId && cat.level === 1
          );
          if (level1Category) {
            level1Categories.set(level2ParentId, {
              category: level1Category,
              children: [],
              total: 0,
            });
          }
        }

        const level1Group = level1Categories.get(level2ParentId);
        if (level1Group) {
          level1Group.children.push(level2Group);
          level1Group.total += level2Group.total;
        }
      }
    });

    const result: Level1Group[] = [];
    level1Categories.forEach((level1Group: Level1Group) => {
      result.push(level1Group);
    });

    return result;
  }, [filteredTransactions, categories]);

  const pembiayaanCalculations = useMemo(() => {
    if (dashboardData) {
      const calculations = {
        totalPenerimaan: Number(dashboardData.totalPenerimaanPembiayaan || 0),
        totalPengeluaran: Number(dashboardData.totalPengeluaranPembiayaan || 0),
        pembiayaanNetto: Number(dashboardData.pembiayaanNetto || 0),
        surplusDefisit: Number(dashboardData.surplusDefisit || 0),
        sisaLebihPembiayaan: Number(dashboardData.sisaPembiayaan || 0),
      };

      return calculations;
    }

    let totalPenerimaan = 0;
    let totalPengeluaran = 0;

    groupedTransactions.forEach((level1Group: Level1Group) => {
      level1Group.children.forEach((level2Child: Level2Group) => {
        const categoryName = level2Child.category.namaKategori.toLowerCase();
        const categoryCode = level2Child.category.kode || "";

        if (
          categoryName.includes("penerimaan") ||
          categoryCode.startsWith("6.1")
        ) {
          totalPenerimaan += level2Child.total;
        } else if (
          categoryName.includes("pengeluaran") ||
          categoryCode.startsWith("6.2")
        ) {
          totalPengeluaran += level2Child.total;
        }
      });
    });

    const pembiayaanNetto = totalPenerimaan - totalPengeluaran;
    const surplusDefisit = 0;
    const sisaLebihPembiayaan = surplusDefisit + pembiayaanNetto;

    const fallbackCalculations = {
      totalPenerimaan,
      totalPengeluaran,
      pembiayaanNetto,
      surplusDefisit,
      sisaLebihPembiayaan,
    };

    return fallbackCalculations;
  }, [dashboardData, groupedTransactions]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3 lg:space-y-4 px-2 sm:px-0">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg lg:rounded-xl p-2 sm:p-3 lg:p-6 text-white shadow-lg">
        <div className="flex flex-col gap-1 sm:gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-0.5 sm:space-y-1">
            <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-balance">
              💰 Detail Pembiayaan
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm lg:text-sm text-pretty">
              Detail data pembiayaan daerah BPKAD Kabupaten Garut
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-1 sm:pb-2 p-2 sm:p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-emerald-100 text-xs lg:text-lg font-medium">
                  Total Penerimaan
                </CardTitle>
                <div className="text-xs sm:text-sm lg:text-base xl:text-lg font-bold mt-0.5 sm:mt-1 truncate">
                  {formatCurrency(pembiayaanCalculations.totalPenerimaan)}
                </div>
              </div>
              {/* <div className="p-1 sm:p-1.5 bg-white/20 rounded-full shrink-0">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              </div> */}
            </div>
            <p className="text-emerald-100 text-xs lg:text-sm mt-0.5 sm:mt-1">
              Penerimaan Pembiayaan
            </p>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-pink-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-1 sm:pb-2 p-2 sm:p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-red-100 text-xs lg:text-lg font-medium">
                  Total Pengeluaran
                </CardTitle>
                <div className="text-xs sm:text-sm lg:text-base xl:text-lg font-bold mt-0.5 sm:mt-1 truncate">
                  {formatCurrency(pembiayaanCalculations.totalPengeluaran)}
                </div>
              </div>
              {/* <div className="p-1 sm:p-1.5 bg-white/20 rounded-full shrink-0">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
              </div> */}
            </div>
            <p className="text-red-100 text-xs lg:text-sm mt-0.5 sm:mt-1">
              Pengeluaran Pembiayaan
            </p>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-1 sm:pb-2 p-2 sm:p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-blue-100  text-xs lg:text-lg font-medium">
                  Pembiayaan Netto
                </CardTitle>
                <div className="text-xs sm:text-sm lg:text-base xl:text-lg font-bold mt-0.5 sm:mt-1 truncate">
                  {formatCurrency(pembiayaanCalculations.pembiayaanNetto)}
                </div>
              </div>
              {/* <div className="p-1 sm:p-1.5 bg-white/20 rounded-full shrink-0">
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              </div> */}
            </div>
            <p className="text-blue-100 text-xs lg:text-sm mt-0.5 sm:mt-1">
              Penerimaan - Pengeluaran
            </p>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-1 sm:pb-2 p-2 sm:p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-purple-100 text-xs lg:text-lg font-medium">
                  Sisa Lebih
                </CardTitle>
                <div className="text-xs sm:text-sm lg:text-base xl:text-lg font-bold mt-0.5 sm:mt-1 truncate">
                  {formatCurrency(pembiayaanCalculations.sisaLebihPembiayaan)}
                </div>
              </div>
              {/* <div className="p-1 sm:p-1.5 bg-white/20 rounded-full shrink-0">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              </div> */}
            </div>
            <p className="text-purple-100 text-xs lg:text-sm mt-0.5 sm:mt-1">
              SILPA -{" "}
              {pembiayaanCalculations.sisaLebihPembiayaan >= 0
                ? "Surplus"
                : "Defisit"}{" "}
              + Netto
            </p>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
        <CardContent className="p-2 sm:p-3 lg:p-4">
          <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="p-1 sm:p-1.5 bg-blue-100 rounded-lg shrink-0">
                <Search className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
              </div>
              <Input
                placeholder="Cari kategori pembiayaan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border-blue-200 focus:border-blue-500 text-xs sm:text-sm"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="p-1 sm:p-1.5 bg-indigo-100 rounded-lg shrink-0">
                <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-600" />
              </div>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full sm:w-28 lg:w-32 border-indigo-200 focus:border-indigo-500 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
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
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 grid-cols-1 xl:grid-cols-1">
        <ComparisonBarChart jenis="Pembiayaan" currentYear={selectedYear} />
        <CompositionPieChart jenis="Pembiayaan" currentYear={selectedYear} />
      </div>

      <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg border-b p-2 sm:p-3 lg:p-4">
          <CardTitle className="text-slate-800 flex items-center gap-2 text-sm sm:text-base lg:text-lg">
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
            📊 Data Pembiayaan
          </CardTitle>
          <CardDescription className="text-slate-600 text-xs sm:text-sm">
            Data semua transaksi pembiayaan daerah tahun {selectedYear} (Semua
            Level)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-full inline-block align-middle">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="font-semibold text-slate-700 px-2 sm:px-3 lg:px-4 w-2/5 sm:w-1/2 text-xs sm:text-sm sticky left-0 bg-slate-50/50 z-10">
                      Kategori
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 text-center w-16 sm:w-20 lg:w-24 text-xs sm:text-sm">
                      Kode
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 text-center w-12 sm:w-16 lg:w-20 text-xs sm:text-sm">
                      Tahun
                    </TableHead>
                    <TableHead className="text-right font-semibold text-slate-700 w-1/3 sm:w-1/4 text-xs sm:text-sm">
                      Jumlah
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-6 sm:py-8"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-2 sm:p-3 bg-slate-100 rounded-full">
                            <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400" />
                          </div>
                          <div className="text-slate-500 font-medium text-xs sm:text-sm">
                            Tidak ada data pembiayaan
                          </div>
                          <div className="text-xs text-slate-400">
                            Data pembiayaan tidak tersedia untuk tahun{" "}
                            {selectedYear}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {groupedTransactions.map((level1Group: Level1Group) => (
                        <React.Fragment
                          key={`level1-${level1Group.category.idKategori}`}
                        >
                          <TableRow className="bg-slate-50 border-b">
                            <TableCell className="font-bold text-slate-800 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm sticky left-0 bg-slate-50 z-10">
                              <div
                                className="truncate pr-1 sm:pr-2"
                                title={level1Group.category.namaKategori}
                              >
                                {level1Group.category.namaKategori}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className="bg-slate-100 text-slate-700 border-slate-300 text-xs"
                              >
                                {level1Group.category.kode || "-"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center text-slate-600 font-medium text-xs">
                              {selectedYear}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-green-600 text-xs sm:text-sm">
                              <div className="truncate">
                                {formatCurrency(level1Group.total)}
                              </div>
                            </TableCell>
                          </TableRow>

                          {level1Group.children.map(
                            (level2Child: Level2Group) => (
                              <React.Fragment
                                key={`level2-${level2Child.category.idKategori}`}
                              >
                                <TableRow className="bg-white hover:bg-slate-50/50">
                                  <TableCell className="font-semibold text-slate-700 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 sticky left-0 bg-white hover:bg-slate-50/50 z-10">
                                    <div className="flex items-center">
                                      <span className="w-3 h-px bg-slate-300 mr-2 shrink-0"></span>
                                      <span
                                        className="text-xs sm:text-sm truncate pr-1 sm:pr-2"
                                        title={
                                          level2Child.category.namaKategori
                                        }
                                      >
                                        {level2Child.category.namaKategori}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge
                                      variant="outline"
                                      className="bg-slate-50 text-slate-600 border-slate-200 text-xs"
                                    >
                                      {level2Child.category.kode || "-"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center text-slate-600 font-medium text-xs">
                                    {selectedYear}
                                  </TableCell>
                                  <TableCell className="text-right font-mono font-semibold text-blue-600 text-xs sm:text-sm">
                                    <div className="truncate">
                                      {formatCurrency(level2Child.total)}
                                    </div>
                                  </TableCell>
                                </TableRow>

                                {level2Child.children &&
                                  /* Fixed implicit any type for level3Child parameter */
                                  level2Child.children.map(
                                    (level3Child: Level3TransactionItem) => (
                                      <TableRow
                                        key={`level3-${level3Child.category.idKategori}-${level3Child.transaction.idTransaksi}`}
                                        className="bg-white hover:bg-slate-50/30"
                                      >
                                        <TableCell className="font-medium text-slate-600 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm sticky left-0 bg-white hover:bg-slate-50/30 z-10">
                                          <div className="flex items-center">
                                            <span className="w-6 h-px bg-slate-300 mr-2 shrink-0"></span>
                                            <span
                                              className="text-xs sm:text-sm truncate pr-1 sm:pr-2"
                                              title={
                                                level3Child.category
                                                  .namaKategori
                                              }
                                            >
                                              {
                                                level3Child.category
                                                  .namaKategori
                                              }
                                            </span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                          <Badge
                                            variant="outline"
                                            className="bg-slate-50 text-slate-500 border-slate-200 text-xs"
                                          >
                                            {level3Child.category.kode || "-"}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-center text-slate-500 text-xs">
                                          {
                                            level3Child.transaction
                                              .tahunAnggaran.tahun
                                          }
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-medium text-slate-700 text-xs sm:text-sm">
                                          <div className="truncate">
                                            {formatCurrency(level3Child.amount)}
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    )
                                  )}
                              </React.Fragment>
                            )
                          )}
                        </React.Fragment>
                      ))}

                      <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t-2 border-blue-200">
                        <TableCell className="font-bold text-blue-800 px-2 sm:px-3 lg:px-4 py-3 text-xs sm:text-sm sticky left-0 bg-gradient-to-r from-blue-50 to-indigo-50 z-10">
                          Pembiayaan Netto
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className="bg-blue-100 text-blue-700 border-blue-300 text-xs"
                          >
                            NETTO
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-blue-600 font-medium text-xs">
                          {selectedYear}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-blue-700 text-xs sm:text-sm">
                          <div className="truncate">
                            {formatCurrency(
                              pembiayaanCalculations.pembiayaanNetto
                            )}
                          </div>
                        </TableCell>
                      </TableRow>

                      <TableRow className="bg-gradient-to-r from-purple-50 to-violet-50 border-t-2 border-purple-200">
                        <TableCell className="font-bold text-purple-800 px-2 sm:px-3 lg:px-4 py-3 text-xs sm:text-sm sticky left-0 bg-gradient-to-r from-purple-50 to-violet-50 z-10">
                          <div
                            className="truncate pr-1 sm:pr-2"
                            title="Sisa Lebih Pembiayaan Anggaran Daerah Tahun Berkenaan"
                          >
                            Sisa Lebih Pembiayaan Anggaran Daerah Tahun
                            Berkenaan
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className="bg-purple-100 text-purple-700 border-purple-300 text-xs"
                          >
                            SILPA
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-purple-600 font-medium text-xs">
                          {selectedYear}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-purple-700 text-xs sm:text-sm">
                          <div className="truncate">
                            {pembiayaanCalculations.sisaLebihPembiayaan < 0
                              ? "-"
                              : ""}
                            {formatCurrency(
                              Math.abs(
                                pembiayaanCalculations.sisaLebihPembiayaan
                              )
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
