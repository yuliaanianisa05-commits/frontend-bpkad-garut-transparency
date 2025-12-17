"use client";

import React from "react";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  TrendingDown,
  CreditCard,
  FileText,
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
import { apiClient, formatCurrency } from "@/lib/api";
import ComparisonBarChart from "@/components/dashboard/comparison-bar-chart";
import CompositionPieChart from "@/components/dashboard/composition-pie-chart";

interface Transaction {
  idTransaksi: number;
  jumlah: number;
  kategoriApbd: {
    idKategori: number;
    namaKategori: string;
    kode?: string;
    level: number;
    idParent?: number;
    jenis?: string; // Added optional jenis property to match Category interface
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

interface GroupedTransaction {
  category: Category;
  transactions: Transaction[];
  total: number;
  children?: GroupedTransaction[];
}

export default function DetailPembelanjaanPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("2024");
  const [level2Categories, setLevel2Categories] = useState<Category[]>([]);
  const [level3Categories, setLevel3Categories] = useState<Category[]>([]);

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
      console.log(" Fetching initial data for pembelanjaan...");
      const [yearsResponse, categoriesResponse] = await Promise.all([
        apiClient.getTahunAnggaran(),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/kategori-apbd?jenis=Belanja`
        ).then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.data && data.data.length > 0) {
              return data;
            }
          }
          const fallbackRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/kategori-apbd?jenis=Pembelanjaan`
          );
          return fallbackRes.ok
            ? await fallbackRes.json()
            : { success: false, data: [] };
        }),
      ]);

      console.log(" Years response:", yearsResponse);
      if (yearsResponse.success && yearsResponse.data) {
        const yearsData = yearsResponse.data;
        setYears(yearsData);

        if (yearsData.length > 0) {
          const latestYear = yearsData.reduce((latest, current) =>
            current.tahun > latest.tahun ? current : latest
          );
          setSelectedYear(latestYear.tahun.toString());
        }
      }

      console.log(" Categories response:", categoriesResponse);
      if (categoriesResponse.success) {
        const allCategories = categoriesResponse.data;
        setCategories(allCategories);

        const level2Cats = allCategories.filter(
          (cat: Category) => cat.level === 2
        );
        const level3Cats = allCategories.filter(
          (cat: Category) => cat.level === 3
        );

        setLevel2Categories(level2Cats);
        setLevel3Categories(level3Cats);

        console.log(" Level 2 categories loaded:", level2Cats.length);
        console.log(" Level 3 categories loaded:", level3Cats.length);
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
      setError("Gagal memuat data awal");
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      console.log(" Fetching transactions for year:", selectedYear);

      let response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transaksi-apbd?tahun=${selectedYear}&jenis=Belanja&limit=100`
      );

      if (response.ok) {
        const data = await response.json();
        console.log(" Transaction API response (Belanja):", data);
        if (
          data.success &&
          data.data.transactions &&
          data.data.transactions.length > 0
        ) {
          setTransactions(data.data.transactions);
          console.log(
            " Loaded transactions (Belanja):",
            data.data.transactions.length
          );
          return;
        }
      }

      console.log(" Trying Pembelanjaan...");
      response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transaksi-apbd?tahun=${selectedYear}&jenis=Pembelanjaan&limit=100`
      );

      if (response.ok) {
        const data = await response.json();
        console.log(" Transaction API response (Pembelanjaan):", data);
        if (data.success) {
          setTransactions(data.data.transactions || []);
          console.log(
            " Loaded transactions (Pembelanjaan):",
            data.data.transactions?.length || 0
          );
        } else {
          console.log(" API returned success=false:", data.message);
          setTransactions([]);
        }
      } else {
        console.log(" API response not ok:", response.status);
        setTransactions([]);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError("Gagal memuat data transaksi");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const groupedTransactions = React.useMemo(() => {
    const filtered = transactions.filter((transaction) =>
      transaction.kategoriApbd.namaKategori
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

    console.log(" Filtered transactions:", filtered.length);

    const categoryMap = new Map<number, GroupedTransaction>();

    filtered.forEach((transaction) => {
      const categoryId = transaction.kategoriApbd.idKategori;
      if (!categoryMap.has(categoryId)) {
        const category: Category = {
          ...transaction.kategoriApbd,
          jenis: transaction.kategoriApbd.jenis || "Belanja", // Default to 'Belanja' if not provided
        };

        categoryMap.set(categoryId, {
          category,
          transactions: [],
          total: 0,
        });
      }
      const group = categoryMap.get(categoryId)!;
      group.transactions.push(transaction);
      group.total += transaction.jumlah;
    });

    const categoryGroups = Array.from(categoryMap.values());

    const level1Groups: GroupedTransaction[] = [];
    const level2Map = new Map<number, GroupedTransaction>();
    const level3Map = new Map<number, GroupedTransaction>();

    categoryGroups.forEach((group: GroupedTransaction) => {
      const level = group.category.level;

      if (level === 1) {
        level1Groups.push({
          ...group,
          children: [],
        });
      } else if (level === 2) {
        level2Map.set(group.category.idKategori, {
          ...group,
          children: [],
        });
      } else if (level === 3) {
        level3Map.set(group.category.idKategori, group);
      }
    });

    level3Map.forEach((level3Group: GroupedTransaction) => {
      const parentId = level3Group.category.idParent;
      if (parentId && level2Map.has(parentId)) {
        level2Map.get(parentId)!.children!.push(level3Group);
      }
    });

    level2Map.forEach((level2Group: GroupedTransaction) => {
      const parentId = level2Group.category.idParent;
      const level1Parent = level1Groups.find(
        (l1: GroupedTransaction) => l1.category.idKategori === parentId
      );
      if (level1Parent) {
        level1Parent.children!.push(level2Group);
      } else {
        level1Groups.push(level2Group);
      }
    });

    level1Groups.sort((a: GroupedTransaction, b: GroupedTransaction) =>
      a.category.namaKategori.localeCompare(b.category.namaKategori)
    );

    level1Groups.forEach((level1Group: GroupedTransaction) => {
      level1Group.children!.sort(
        (a: GroupedTransaction, b: GroupedTransaction) =>
          a.category.namaKategori.localeCompare(b.category.namaKategori)
      );
      level1Group.children!.forEach((level2Group: GroupedTransaction) => {
        if (level2Group.children) {
          level2Group.children.sort(
            (a: GroupedTransaction, b: GroupedTransaction) =>
              a.category.namaKategori.localeCompare(b.category.namaKategori)
          );
        }
      });
    });

    console.log(
      " Grouped transactions:",
      level1Groups.length,
      "level 1 groups"
    );
    return level1Groups;
  }, [transactions, searchTerm]);

  const totalBelanja = React.useMemo(() => {
    return groupedTransactions.reduce(
      (sum: number, level1Group: GroupedTransaction) => {
        if (level1Group.category.level === 1) {
          return sum + level1Group.total;
        }
        return sum;
      },
      0
    );
  }, [groupedTransactions]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-3 lg:p-4 text-white shadow-lg">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-balance">
              💳 Detail Pembelanjaan
            </h1>
            <p className="text-blue-100 text-xs lg:text-sm text-pretty">
              Detail data belanja daerah BPKAD Kabupaten Garut
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="relative overflow-hidden border-0 shadow-md">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600"></div>
          <CardHeader className="relative text-white pb-1 p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xs lg:text-lg font-medium text-emerald-100">
                  Total Belanja
                </CardTitle>
                <div className="text-sm lg:text-xl font-bold mt-1 truncate">
                  {formatCurrency(totalBelanja)}
                </div>
              </div>
              {/* <div className="p-1.5 bg-white/20 rounded-full shrink-0">
                <CreditCard className="h-3 w-3 lg:h-4 lg:w-4" />
              </div> */}
            </div>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600"></div>
          <CardHeader className="relative text-white pb-1 p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xs lg:text-lg font-medium text-blue-100">
                  Total Transaksi
                </CardTitle>
                <div className="text-sm lg:text-xl font-bold mt-1">
                  {transactions.length}
                </div>
              </div>
              {/* <div className="p-1.5 bg-white/20 rounded-full shrink-0">
                <FileText className="h-3 w-3 lg:h-4 lg:w-4" />
              </div> */}
            </div>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md sm:col-span-2 lg:col-span-1">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600"></div>
          <CardHeader className="relative text-white pb-1 p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xs lg:text-lg font-medium text-purple-100">
                  Tahun Aktif
                </CardTitle>
                <div className="text-sm lg:text-xl font-bold mt-1">
                  {selectedYear}
                </div>
              </div>
              {/* <div className="p-1.5 bg-white/20 rounded-full shrink-0">
                <TrendingDown className="h-3 w-3 lg:h-4 lg:w-4" />
              </div> */}
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
        <CardContent className="p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 flex-1">
              <div className="p-1.5 bg-blue-100 rounded-md shrink-0">
                <Search className="h-4 w-4 text-blue-600" />
              </div>
              <Input
                placeholder="Cari kategori belanja..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border-blue-200 focus:border-blue-500 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 rounded-md shrink-0">
                <Filter className="h-4 w-4 text-indigo-600" />
              </div>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full lg:w-32 border-indigo-200 focus:border-indigo-500 text-sm">
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
        <ComparisonBarChart jenis="Belanja" currentYear={selectedYear} />
        <CompositionPieChart jenis="Belanja" currentYear={selectedYear} />
      </div>

      <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b p-3">
          <CardTitle className="text-sm lg:text-base text-slate-800">
            📊 Data Pembelanjaan
          </CardTitle>
          <CardDescription className="text-slate-600 text-xs lg:text-sm">
            Data semua transaksi belanja daerah tahun {selectedYear} (Semua
            Level)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="font-semibold text-slate-700 px-3 py-2 min-w-[180px] lg:min-w-[250px] sticky left-0 bg-slate-50/50 text-xs">
                    Kategori
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center min-w-[60px] lg:min-w-[80px] text-xs">
                    Kode
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center min-w-[50px] lg:min-w-[60px] text-xs">
                    Tahun
                  </TableHead>
                  <TableHead className="text-right font-semibold text-slate-700 min-w-[100px] lg:min-w-[120px] text-xs">
                    Jumlah
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-3 bg-slate-100 rounded-full">
                          <FileText className="h-6 w-6 text-slate-400" />
                        </div>
                        <div className="text-slate-500 font-medium text-sm">
                          Tidak ada data belanja
                        </div>
                        <div className="text-xs text-slate-400">
                          Data belanja tidak tersedia untuk tahun {selectedYear}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  groupedTransactions.map((level1Group: GroupedTransaction) => (
                    <React.Fragment
                      key={`level1-${level1Group.category.idKategori}`}
                    >
                      <TableRow className="bg-slate-50 border-b">
                        <TableCell className="font-bold text-slate-800 px-3 py-2 text-xs lg:text-sm sticky left-0 bg-slate-50">
                          <div
                            className="truncate"
                            title={level1Group.category.namaKategori}
                          >
                            {level1Group.category.namaKategori}
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <Badge
                            variant="outline"
                            className="bg-slate-100 text-slate-700 border-slate-300 text-xs px-1 py-0"
                          >
                            {level1Group.category.kode || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-slate-600 font-medium text-xs py-2">
                          {selectedYear}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-green-600 text-xs lg:text-sm py-2">
                          <div
                            className="truncate"
                            title={formatCurrency(level1Group.total)}
                          >
                            {formatCurrency(level1Group.total)}
                          </div>
                        </TableCell>
                      </TableRow>

                      {level1Group.children!.map(
                        (level2Child: GroupedTransaction) => (
                          <React.Fragment
                            key={`level2-${level2Child.category.idKategori}`}
                          >
                            <TableRow className="bg-white hover:bg-slate-50/50">
                              <TableCell className="font-semibold text-slate-700 px-3 py-2 sticky left-0 bg-white hover:bg-slate-50/50">
                                <div className="flex items-center">
                                  <span className="w-3 h-px bg-slate-300 mr-2 shrink-0"></span>
                                  <span
                                    className="text-xs truncate"
                                    title={level2Child.category.namaKategori}
                                  >
                                    {level2Child.category.namaKategori}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center py-2">
                                <Badge
                                  variant="outline"
                                  className="bg-slate-50 text-slate-600 border-slate-200 text-xs px-1 py-0"
                                >
                                  {level2Child.category.kode || "-"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center text-slate-600 font-medium text-xs py-2">
                                {selectedYear}
                              </TableCell>
                              <TableCell className="text-right font-mono font-semibold text-blue-600 text-xs py-2">
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
                                (level3Child: GroupedTransaction) =>
                                  level3Child.transactions.map(
                                    (
                                      transaction: Transaction,
                                      index: number
                                    ) => (
                                      <TableRow
                                        key={`level3-${transaction.idTransaksi}`}
                                        className="bg-white hover:bg-slate-50/30"
                                      >
                                        <TableCell className="font-medium text-slate-600 px-3 py-2 sticky left-0 bg-white hover:bg-slate-50/30">
                                          <div className="flex items-center">
                                            <span className="w-6 h-px bg-slate-300 mr-2 shrink-0"></span>
                                            <span
                                              className="text-xs truncate"
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
                                        <TableCell className="text-center py-2">
                                          <Badge
                                            variant="outline"
                                            className="bg-slate-50 text-slate-500 border-slate-200 text-xs px-1 py-0"
                                          >
                                            {level3Child.category.kode || "-"}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-center text-slate-500 text-xs py-2">
                                          {transaction.tahunAnggaran.tahun}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-medium text-slate-700 text-xs py-2">
                                          <div
                                            className="truncate"
                                            title={formatCurrency(
                                              transaction.jumlah
                                            )}
                                          >
                                            {formatCurrency(transaction.jumlah)}
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    )
                                  )
                              )}
                          </React.Fragment>
                        )
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
