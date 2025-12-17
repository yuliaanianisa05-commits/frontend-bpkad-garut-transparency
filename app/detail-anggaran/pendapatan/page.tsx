"use client";

import React from "react";
import { useState, useEffect } from "react";
import { Search, Filter, TrendingUp, DollarSign, FileText } from "lucide-react";
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
import { apiClient, formatCurrency } from "@/lib/api";
import ComparisonBarChart from "../../../components/dashboard/comparison-bar-chart";
import CompositionPieChart from "../../../components/dashboard/composition-pie-chart";

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
  transaction: Transaction;
  children: Level3TransactionItem[];
  total: number;
}

interface Level1Group {
  category: Category;
  transaction: Transaction;
  children: Level2Group[];
  total: number;
}

export default function DetailPendapatanPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("2024");

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedYear && years.length > 0) {
      fetchTransactions();
    }
  }, [selectedYear, years]);

  const fetchInitialData = async () => {
    try {
      const [yearsResponse, categoriesResponse] = await Promise.all([
        apiClient.getTahunAnggaran(),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/kategori-apbd?jenis=Pendapatan`
        ),
      ]);

      if (yearsResponse.success && yearsResponse.data) {
        const yearsData = yearsResponse.data;
        setYears(yearsData);

        if (yearsData.length > 0) {
          const latestYear = yearsData.reduce((latest, current) =>
            current.tahun > latest.tahun ? current : latest
          );
          setSelectedYear(latestYear.tahun.toString());
          console.log(" Set default year to:", latestYear.tahun);
        }
      }

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        if (categoriesData.success) {
          const allCategories = categoriesData.data;
          setCategories(allCategories);
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
        `${process.env.NEXT_PUBLIC_API_URL}/api/transaksi-apbd?tahun=${selectedYear}&jenis=Pendapatan`
      );

      if (!response.ok) {
        const errorText = await response.text();
        setError(`API Error: ${response.status} - ${response.statusText}`);
        setTransactions([]);
        return;
      }

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.data && data.data.transactions) {
          const processedTransactions = (data.data.transactions || []).map(
            (transaction: Transaction) => ({
              ...transaction,
              jumlah: Number(transaction.jumlah) || 0,
            })
          );

          setTransactions(processedTransactions);
          setError(null);
        } else {
          setTransactions([]);
          setError("No transaction data available");
        }
      }
    } catch (error) {
      setError(
        `Connection error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((transaction) =>
    transaction.kategoriApbd.namaKategori
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const groupedTransactions = React.useMemo(() => {
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

    const hierarchyMap = new Map();
    const level1Categories = new Map<number, Level1Group>();
    const level2Categories = new Map<number, Level2Group>();

    sortedTransactions.forEach((transaction) => {
      const category = transaction.kategoriApbd;
      const level = category.level;

      if (level === 1) {
        if (!level1Categories.has(category.idKategori)) {
          level1Categories.set(category.idKategori, {
            category,
            transaction,
            children: [],
            total: Number(transaction.jumlah) || 0,
          });
        }
      } else if (level === 2) {
        if (!level2Categories.has(category.idKategori)) {
          level2Categories.set(category.idKategori, {
            category,
            transaction,
            children: [],
            total: Number(transaction.jumlah) || 0,
          });
        }
      } else if (level === 3 && category.idParent) {
        const level2Parent = level2Categories.get(category.idParent);
        if (level2Parent) {
          level2Parent.children.push({
            category,
            transaction,
            amount: Number(transaction.jumlah) || 0,
          });
        }
      }
    });

    level2Categories.forEach((level2Group: Level2Group) => {
      const level2Category = level2Group.category;
      if (level2Category.idParent) {
        const level1Parent = level1Categories.get(level2Category.idParent);
        if (level1Parent) {
          level1Parent.children.push(level2Group);
        }
      }
    });

    const result: Level1Group[] = [];

    level1Categories.forEach((level1Group: Level1Group) => {
      result.push(level1Group);
    });

    level2Categories.forEach((level2Group: Level2Group) => {
      const level2Category = level2Group.category;
      if (
        !level2Category.idParent ||
        !level1Categories.has(level2Category.idParent)
      ) {
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
        });
      }
    });

    return result;
  }, [filteredTransactions, categories]);

  const totalPendapatan = React.useMemo(() => {
    return groupedTransactions.reduce((sum, group) => {
      return sum + group.total;
    }, 0);
  }, [groupedTransactions]);

  if (loading) {
    return (
      <div className="space-y-3 p-3">
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="grid gap-3 grid-cols-1 xl:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-3 py-1 space-y-4">
        {error && (
          <Card className="border-red-200 bg-red-50/80 backdrop-blur-sm shadow-md">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-100 rounded-full">
                  <FileText className="h-4 w-4 text-red-600" />
                </div>
                <div className="text-red-800 font-medium text-sm">
                  ⚠️ Error: {error}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 shadow-lg">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative p-4">
            <div className="max-w-3xl">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2 text-balance">
                💰 Detail Pendapatan BPKAD
              </h1>
              <p className="text-blue-100 text-sm lg:text-base text-pretty leading-relaxed">
                Analisis data pendapatan daerah BPKAD Kabupaten Garut
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          <Card className="relative h-full overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">

            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 group-hover:from-emerald-600 group-hover:to-teal-700 transition-all duration-300"></div>
            <CardHeader className="relative text-white p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-xs lg:text-lg font-medium text-emerald-100 mb-1">
                    Total Pendapatan
                  </CardTitle>
                  <div className="text-lg lg:text-xl font-bold truncate">
                    {formatCurrency(totalPendapatan)}
                  </div>
                </div>
                {/* <div className="p-2 bg-white/20 rounded-xl shrink-0 group-hover:bg-white/30 transition-all duration-300">
                  <DollarSign className="h-5 w-5" />
                </div> */}
              </div>
            </CardHeader>
          </Card>

          <Card className="relative h-full overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">

            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600 group-hover:from-blue-600 group-hover:to-cyan-700 transition-all duration-300"></div>
            <CardHeader className="relative text-white p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-xs lg:text-lg text-blue-100 mb-1">
                    Total Transaksi
                  </CardTitle>
                  <div className="text-lg lg:text-xl font-bold">
                    {filteredTransactions.length.toLocaleString()}
                  </div>
                </div>
                {/* <div className="p-2 bg-white/20 rounded-xl shrink-0 group-hover:bg-white/30 transition-all duration-300">
                  <FileText className="h-5 w-5" />
                </div> */}
              </div>
            </CardHeader>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group sm:col-span-2 xl:col-span-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 group-hover:from-purple-600 group-hover:to-pink-700 transition-all duration-300"></div>
            <CardHeader className="relative text-white p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-xs lg:text-lg font-medium text-purple-100 mb-1">
                    Tahun Aktif
                  </CardTitle>
                  <div className="text-lg lg:text-xl font-bold">
                    {selectedYear}
                  </div>
                </div>
                {/* <div className="p-2 bg-white/20 rounded-xl shrink-0 group-hover:bg-white/30 transition-all duration-300">
                  <TrendingUp className="h-5 w-5" />
                </div> */}
              </div>
            </CardHeader>
          </Card>
        </div>

        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                  <Search className="h-4 w-4 text-blue-600" />
                </div>
                <Input
                  placeholder="Cari kategori pendapatan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border-blue-200 focus:border-blue-500 h-10"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg shrink-0">
                  <Filter className="h-4 w-4 text-indigo-600" />
                </div>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-full lg:w-40 border-indigo-200 focus:border-indigo-500 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem
                        key={year.idTahun}
                        value={year.tahun.toString()}
                      >
                        Tahun {year.tahun}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 grid-cols-1 2xl:grid-cols-2">
          <div className="w-full">
            <ComparisonBarChart jenis="Pendapatan" currentYear={selectedYear} />
          </div>
          <div className="w-full">
            <CompositionPieChart
              jenis="Pendapatan"
              currentYear={selectedYear}
            />
          </div>
        </div>

        <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border-b p-4">
            <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              Data Pendapatan Daerah
            </CardTitle>
            <CardDescription className="text-slate-600 text-sm mt-1">
              Daftar transaksi pendapatan daerah tahun {selectedYear}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-100 to-blue-100">
                    <TableHead className="font-bold text-slate-800 text-left px-4 py-3 min-w-[250px]">
                      Kategori Pendapatan
                    </TableHead>
                    <TableHead className="font-bold text-slate-800 text-center py-3 min-w-[80px]">
                      Kode
                    </TableHead>
                    <TableHead className="font-bold text-slate-800 text-center py-3 min-w-[70px]">
                      Tahun
                    </TableHead>
                    <TableHead className="text-right font-bold text-slate-800 py-3 min-w-[150px]">
                      Jumlah (Rp)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-4 bg-slate-100 rounded-full">
                            <FileText className="h-8 w-8 text-slate-400" />
                          </div>
                          <div className="text-slate-500 font-semibold">
                            Tidak ada data pendapatan
                          </div>
                          <div className="text-slate-400 text-sm">
                            Data pendapatan tidak tersedia untuk tahun{" "}
                            {selectedYear}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    groupedTransactions.map(
                      (group: Level1Group, groupIndex: number) => (
                        <React.Fragment key={group.category.idKategori}>
                          <TableRow
                            className={`hover:bg-blue-50/50 transition-colors duration-200 ${
                              groupIndex % 2 === 0
                                ? "bg-white"
                                : "bg-slate-50/50"
                            }`}
                          >
                            <TableCell className="font-bold text-slate-900 px-4 py-3">
                              <div
                                className="truncate"
                                title={group.category.namaKategori}
                              >
                                {group.category.namaKategori}
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-3">
                              <Badge
                                variant="outline"
                                className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold px-2 py-0.5 text-xs"
                              >
                                {group.category.kode || "-"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-600 text-center font-medium py-3 text-sm">
                              {group.transaction.tahunAnggaran.tahun}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-emerald-600 py-3">
                              <div
                                className="truncate"
                                title={formatCurrency(group.total)}
                              >
                                {formatCurrency(group.total)}
                              </div>
                            </TableCell>
                          </TableRow>

                          {group.children.map((level2Child, level2Index) => (
                            <React.Fragment
                              key={`level2-${level2Child.category.idKategori}`}
                            >
                              <TableRow
                                className={
                                  groupIndex % 2 === 0
                                    ? "bg-blue-50/30"
                                    : "bg-slate-100/50"
                                }
                              >
                                <TableCell className="font-medium text-slate-700 px-6 lg:px-10">
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-px bg-slate-400 shrink-0"></div>
                                    <span
                                      className="text-slate-700 text-sm truncate"
                                      title={level2Child.category.namaKategori}
                                    >
                                      {level2Child.category.namaKategori}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge
                                    variant="outline"
                                    className="bg-blue-50 text-blue-600 border-blue-200 text-xs"
                                  >
                                    {level2Child.category.kode || "-"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-slate-600 text-center text-sm">
                                  {level2Child.transaction.tahunAnggaran.tahun}
                                </TableCell>
                                <TableCell className="text-right font-mono font-bold text-blue-600 text-sm">
                                  <div
                                    className="truncate"
                                    title={formatCurrency(level2Child.total)}
                                  >
                                    {formatCurrency(level2Child.total)}
                                  </div>
                                </TableCell>
                              </TableRow>

                              {level2Child.children &&
                                level2Child.children.map(
                                  (level3Child: Level3TransactionItem) => (
                                    <TableRow
                                      key={`level3-${level3Child.category.idKategori}`}
                                      className={
                                        groupIndex % 2 === 0
                                          ? "bg-indigo-50/30"
                                          : "bg-slate-200/50"
                                      }
                                    >
                                      <TableCell className="font-medium text-slate-600 px-8 lg:px-14">
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-px bg-slate-400 shrink-0"></div>
                                          <span
                                            className="text-slate-600 text-sm truncate"
                                            title={
                                              level3Child.category.namaKategori
                                            }
                                          >
                                            {level3Child.category.namaKategori}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Badge
                                          variant="outline"
                                          className="bg-gray-50 text-gray-600 border-gray-200 text-xs"
                                        >
                                          {level3Child.category.kode || "-"}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-slate-600 text-center text-sm">
                                        {
                                          level3Child.transaction.tahunAnggaran
                                            .tahun
                                        }
                                      </TableCell>
                                      <TableCell className="text-right font-mono font-semibold text-slate-600 text-sm">
                                        <div
                                          className="truncate"
                                          title={formatCurrency(
                                            level3Child.amount
                                          )}
                                        >
                                          {formatCurrency(level3Child.amount)}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )
                                )}
                            </React.Fragment>
                          ))}
                        </React.Fragment>
                      )
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
