"use client";

import React from "react";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

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

interface GroupedTransaction {
  category: Category;
  children: any[];
  total: number;
}

interface Level3TransactionItem {
  category: Category;
  transaction: Transaction;
  amount: number;
}

export default function PembiayaanPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("2024"); // Default to 2024
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [level2Categories, setLevel2Categories] = useState<Category[]>([]);
  const [level3Categories, setLevel3Categories] = useState<Category[]>([]);
  const [selectedLevel2, setSelectedLevel2] = useState<string>(""); // Default to 2024
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [formData, setFormData] = useState({
    idKategori: "",
    idTahun: "",
    jumlah: "",
  });

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
      console.log(" Fetching initial data for pembiayaan...");
      const [yearsResponse, categoriesResponse] = await Promise.all([
        getTahunAnggaran(),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/kategori-apbd?jenis=Pembiayaan`
        ),
      ]);

      console.log(" Years response:", yearsResponse);
      if (yearsResponse.success && yearsResponse.data) {
        const yearsData = yearsResponse.data;
        setYears(yearsData);
        console.log(" Years loaded:", yearsData.length);

        if (yearsData.length > 0) {
          const latestYear = yearsData.reduce((latest: Year, current: Year) =>
            current.tahun > latest.tahun ? current : latest
          );
          setSelectedYear(latestYear.tahun.toString());
          console.log(" Set default year to:", latestYear.tahun);
        }
      }

      console.log(
        " Categories response status:",
        categoriesResponse.status
      );
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        console.log(" Categories data:", categoriesData);
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

          console.log(" Level 2 categories loaded:", level2Cats.length);
          console.log(" Level 3 categories loaded:", level3Cats.length);
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
      const selectedYearData = years.find(
        (y) => y.tahun.toString() === selectedYear
      );
      const yearId = selectedYearData?.idTahun || selectedYear;

      console.log(
        " Fetching transactions for year:",
        yearId,
        "selectedYear:",
        selectedYear
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transaksi-apbd?tahun=${selectedYear}&jenis=Pembiayaan&limit=100`
      );

      console.log(" Transactions response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log(" Transactions data:", data);
        if (data.success) {
          const processedTransactions = (data.data.transactions || []).map(
            (transaction: any) => ({
              ...transaction,
              jumlah: Number(transaction.jumlah) || 0, // Force conversion to number
            })
          );

          setTransactions(processedTransactions);
          console.log(
            " Transactions loaded:",
            processedTransactions.length
          );
          console.log(
            " Sample transaction amounts:",
            processedTransactions.slice(0, 3).map((t: any) => ({
              kategori: t.kategoriApbd?.namaKategori,
              jumlah: t.jumlah,
              type: typeof t.jumlah,
            }))
          );
        }
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
          console.log(" Dashboard data loaded:", data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (
      !formData.idKategori ||
      !formData.idTahun ||
      formData.jumlah === "" ||
      formData.jumlah === null ||
      formData.jumlah === undefined
    ) {
      setError("Semua field harus diisi");
      setSubmitting(false);
      return;
    }

    const jumlahValue = Number.parseFloat(formData.jumlah);
    if (isNaN(jumlahValue) || jumlahValue < 0) {
      setError("Jumlah harus berupa angka dan tidak boleh negatif");
      setSubmitting(false);
      return;
    }

    try {
      console.log(" Submitting form data:", {
        idKategori: Number.parseInt(formData.idKategori),
        idTahun: Number.parseInt(formData.idTahun),
        jumlah: Number.parseFloat(formData.jumlah),
      });

      const url = editingTransaction
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/transaksi-apbd/${editingTransaction.idTransaksi}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/transaksi-apbd`;

      const method = editingTransaction ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idKategori: Number.parseInt(formData.idKategori),
          idTahun: Number.parseInt(formData.idTahun),
          jumlah: Number.parseFloat(formData.jumlah),
        }),
      });

      console.log(" Response status:", response.status);
      const responseData = await response.json(); // Always parse response data first
      console.log(" Response data:", responseData);

      if (response.ok) {
        await Promise.all([fetchTransactions(), fetchDashboardData()]);
        setIsDialogOpen(false);
        resetForm();
        setError(null); // Clear error on success
      } else {
        const errorMessage =
          responseData.message || `Gagal menyimpan data (${response.status})`;
        setError(errorMessage);
        console.error(" Backend error:", errorMessage);
      }
    } catch (error) {
      console.error(" Network error:", error);
      setError("Gagal terhubung ke server. Periksa koneksi internet Anda.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      idKategori: transaction.kategoriApbd.idKategori.toString(),
      idTahun: transaction.tahunAnggaran.idTahun.toString(),
      jumlah: transaction.jumlah.toString(),
    });
    setSelectedLevel2(transaction.kategoriApbd.idParent?.toString() || "");
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transaksi-apbd/${id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        await Promise.all([fetchTransactions(), fetchDashboardData()]);
      } else {
        setError("Gagal menghapus data");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      setError("Gagal menghapus data");
    }
  };

  const resetForm = () => {
    setFormData({ idKategori: "", idTahun: "", jumlah: "" });
    setSelectedLevel2("");
    setEditingTransaction(null);
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

      // First sort by jenis (type)
      if (categoryA.jenis !== categoryB.jenis) {
        return categoryA.jenis.localeCompare(categoryB.jenis);
      }

      // Then by level (Level 1 first, then Level 2, then Level 3)
      if (categoryA.level !== categoryB.level) {
        return categoryA.level - categoryB.level;
      }

      // For same level, sort by hierarchy
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

    const level1Categories = new Map<number, GroupedTransaction>();
    const level2Categories = new Map<number, GroupedTransaction>();
    const level3Transactions: Level3TransactionItem[] = [];

    // First pass: collect Level 3 transactions only (actual data entries)
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

    // Second pass: build Level 2 groups from Level 3 transactions
    level3Transactions.forEach((level3Item: Level3TransactionItem) => {
      const parentId = level3Item.category.idParent;
      if (parentId) {
        if (!level2Categories.has(parentId)) {
          // Find the Level 2 category info
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

    // Third pass: build Level 1 groups from Level 2 groups
    level2Categories.forEach((level2Group: GroupedTransaction) => {
      const level2ParentId = level2Group.category.idParent;
      if (level2ParentId) {
        if (!level1Categories.has(level2ParentId)) {
          // Find the Level 1 category info
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

    // Build final result array
    const result: GroupedTransaction[] = [];
    level1Categories.forEach((level1Group: GroupedTransaction) => {
      result.push(level1Group);
    });

    return result;
  }, [filteredTransactions, categories]);

  const pembiayaanCalculations = useMemo(() => {
    console.log(" Dashboard data in calculations:", dashboardData);

    if (dashboardData) {
      const calculations = {
        totalPenerimaan: Number(dashboardData.totalPenerimaanPembiayaan || 0),
        totalPengeluaran: Number(dashboardData.totalPengeluaranPembiayaan || 0),
        pembiayaanNetto: Number(dashboardData.pembiayaanNetto || 0),
        surplusDefisit: Number(dashboardData.surplusDefisit || 0),
        sisaLebihPembiayaan: Number(dashboardData.sisaPembiayaan || 0),
      };

      console.log(" Using dashboard calculations:", calculations);
      return calculations;
    }

    console.log(" No dashboard data, calculating from transactions");
    console.log(" Grouped transactions:", groupedTransactions.length);

    let totalPenerimaan = 0;
    let totalPengeluaran = 0;

    groupedTransactions.forEach((level1Group: GroupedTransaction) => {
      level1Group.children.forEach((level2Child: GroupedTransaction) => {
        const categoryName = level2Child.category.namaKategori.toLowerCase();
        const categoryCode = level2Child.category.kode || "";

        console.log(" Processing level2:", {
          name: categoryName,
          code: categoryCode,
          total: level2Child.total,
        });

        if (
          categoryName.includes("penerimaan") ||
          categoryCode.startsWith("6.1")
        ) {
          totalPenerimaan += level2Child.total;
          console.log(" Added to penerimaan:", level2Child.total);
        } else if (
          categoryName.includes("pengeluaran") ||
          categoryCode.startsWith("6.2")
        ) {
          totalPengeluaran += level2Child.total;
          console.log(" Added to pengeluaran:", level2Child.total);
        }
      });
    });

    const pembiayaanNetto = totalPenerimaan - totalPengeluaran;
    const surplusDefisit = 0; // Will be 0 if no dashboard data
    const sisaLebihPembiayaan = surplusDefisit + pembiayaanNetto;

    const fallbackCalculations = {
      totalPenerimaan,
      totalPengeluaran,
      pembiayaanNetto,
      surplusDefisit,
      sisaLebihPembiayaan,
    };

    console.log(" Using fallback calculations:", fallbackCalculations);
    return fallbackCalculations;
  }, [dashboardData, groupedTransactions]);

  const filteredLevel3Categories = level3Categories.filter((cat) => {
    if (!selectedLevel2) return false;
    return cat.idParent?.toString() === selectedLevel2;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 lg:p-6">
        <div className="space-y-4 lg:space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 lg:p-6 space-y-4 lg:space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl lg:rounded-2xl p-4 lg:p-8 text-white shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-balance">
              💰 Kelola Pembiayaan
            </h1>
            <p className="text-blue-100 text-sm lg:text-lg text-pretty">
              Kelola data pembiayaan daerah BPKAD Kabupaten Garut
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg border-0 px-6 py-3 font-semibold w-full md:w-auto"
              >
                <Plus className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Tambah Pembiayaan</span>
                <span className="sm:hidden">Tambah</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTransaction ? "Edit Pembiayaan" : "Tambah Pembiayaan"}
                </DialogTitle>
                <DialogDescription>
                  {editingTransaction
                    ? "Ubah data pembiayaan yang sudah ada"
                    : "Tambahkan data pembiayaan baru"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  {error && (
                    <Alert
                      variant="destructive"
                      className="border-red-200 bg-red-50"
                    >
                      <AlertDescription className="text-red-800">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="level2">Kategori Level 2</Label>
                    <Select
                      value={selectedLevel2}
                      onValueChange={(value) => {
                        setSelectedLevel2(value);
                        setFormData({ ...formData, idKategori: "" });
                      }}
                      required
                      disabled={submitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori level 2" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {level2Categories.map((category) => (
                          <SelectItem
                            key={category.idKategori}
                            value={category.idKategori.toString()}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {category.namaKategori}
                              </span>
                              {category.kode && (
                                <span className="text-xs text-muted-foreground">
                                  Kode: {category.kode}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="kategori">Kategori Level 3</Label>
                    <Select
                      value={formData.idKategori}
                      onValueChange={(value) =>
                        setFormData({ ...formData, idKategori: value })
                      }
                      disabled={!selectedLevel2 || submitting}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            selectedLevel2
                              ? "Pilih kategori level 3"
                              : "Pilih level 2 terlebih dahulu"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {filteredLevel3Categories.map((category) => (
                          <SelectItem
                            key={category.idKategori}
                            value={category.idKategori.toString()}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {category.namaKategori}
                              </span>
                              {category.kode && (
                                <span className="text-xs text-muted-foreground">
                                  Kode: {category.kode}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="tahun">Tahun</Label>
                    <Select
                      value={formData.idTahun}
                      onValueChange={(value) =>
                        setFormData({ ...formData, idTahun: value })
                      }
                      required
                      disabled={submitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tahun" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {years.map((year) => (
                          <SelectItem
                            key={year.idTahun}
                            value={year.idTahun.toString()}
                          >
                            {year.tahun}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="jumlah">Jumlah (Rp)</Label>
                    <Input
                      id="jumlah"
                      type="number"
                      placeholder="0"
                      min="0"
                      step="1"
                      value={formData.jumlah}
                      onChange={(e) =>
                        setFormData({ ...formData, jumlah: e.target.value })
                      }
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={submitting}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting
                      ? "Menyimpan..."
                      : editingTransaction
                      ? "Simpan Perubahan"
                      : "Tambah"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-3 p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-emerald-100 text-xs lg:text-lg font-medium">
                  Total Penerimaan
                </CardTitle>
                <div className="text-lg lg:text-2xl font-bold mt-1 truncate">
                  {formatCurrency(pembiayaanCalculations.totalPenerimaan)}
                </div>
              </div>
              <div className="p-2 bg-white/20 rounded-full shrink-0">
                <TrendingUp className="h-4 w-4 lg:h-5 lg:w-5" />
              </div>
            </div>
            <p className="text-emerald-100 text-xs lg:text-sm mt-1">
              Penerimaan Pembiayaan
            </p>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-pink-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-3 p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-red-100 text-xs lg:text-lg font-medium">
                  Total Pengeluaran
                </CardTitle>
                <div className="text-lg lg:text-2xl font-bold mt-1 truncate">
                  {formatCurrency(pembiayaanCalculations.totalPengeluaran)}
                </div>
              </div>
              <div className="p-2 bg-white/20 rounded-full shrink-0">
                <DollarSign className="h-4 w-4 lg:h-5 lg:w-5" />
              </div>
            </div>
            <p className="text-red-100 text-xs lg:text-sm mt-1">
              Pengeluaran Pembiayaan
            </p>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-3 p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-blue-100 text-xs lg:text-lg font-medium">
                  Pembiayaan Netto
                </CardTitle>
                <div className="text-lg lg:text-2xl font-bold mt-1 truncate">
                  {formatCurrency(pembiayaanCalculations.pembiayaanNetto)}
                </div>
              </div>
              <div className="p-2 bg-white/20 rounded-full shrink-0">
                <BarChart3 className="h-4 w-4 lg:h-5 lg:w-5" />
              </div>
            </div>
            <p className="text-blue-100 text-xs lg:text-sm mt-1">
              Penerimaan - Pengeluaran
            </p>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-3 p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-purple-100 text-xs lg:text-lg font-medium">
                  Sisa Lebih
                </CardTitle>
                <div className="text-lg lg:text-2xl font-bold mt-1 truncate">
                  {formatCurrency(pembiayaanCalculations.sisaLebihPembiayaan)}
                </div>
              </div>
              <div className="p-2 bg-white/20 rounded-full shrink-0">
                <Calendar className="h-4 w-4 lg:h-5 lg:w-5" />
              </div>
            </div>
            <p className="text-purple-100 text-xs lg:text-sm mt-1">
              SILPA -{" "}
              {pembiayaanCalculations.sisaLebihPembiayaan >= 0
                ? "Surplus"
                : "Defisit"}{" "}
              + Netto
            </p>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                <Search className="h-4 w-4 text-blue-600" />
              </div>
              <Input
                placeholder="Cari kategori pembiayaan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border-blue-200 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg shrink-0">
                <Filter className="h-4 w-4 text-indigo-600" />
              </div>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full lg:w-40 border-indigo-200 focus:border-indigo-500">
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

      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-xl border-b p-4 lg:p-6">
          <CardTitle className="text-slate-800 flex items-center gap-2 text-base lg:text-xl">
            <BarChart3 className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
            📊 Data Pembiayaan
          </CardTitle>
          <CardDescription className="text-slate-600 text-sm lg:text-base">
            Data semua transaksi pembiayaan daerah tahun {selectedYear} (Total
            dari Level 1)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="font-semibold text-slate-700 px-4 lg:px-6 min-w-[200px] lg:min-w-[300px]">
                    Kategori
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center min-w-[80px] lg:min-w-[100px]">
                    Kode
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center min-w-[70px] lg:min-w-[80px]">
                    Tahun
                  </TableHead>
                  <TableHead className="text-right font-semibold text-slate-700 min-w-[120px] lg:min-w-[150px]">
                    Jumlah
                  </TableHead>
                  <TableHead className="text-center font-semibold text-slate-700 min-w-[100px] lg:min-[120px]">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-slate-100 rounded-full">
                          <BarChart3 className="h-8 w-8 text-slate-400" />
                        </div>
                        <div className="text-slate-500 font-medium">
                          Tidak ada data pembiayaan
                        </div>
                        <div className="text-sm text-slate-400">
                          Silakan tambah data pembiayaan baru
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
                        <TableCell className="font-bold text-slate-800 px-4 lg:px-6 py-4 text-sm lg:text-base">
                          {level1Group.category.namaKategori}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className="bg-slate-100 text-slate-700 border-slate-300 text-xs"
                          >
                            {level1Group.category.kode || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-slate-600 font-medium text-sm">
                          {selectedYear}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-green-600 text-sm lg:text-base">
                          {formatCurrency(level1Group.total)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-slate-600 font-medium text-xs lg:text-sm">
                            Auto Calculate
                          </span>
                        </TableCell>
                      </TableRow>

                      {level1Group.children.map(
                        (level2Child: GroupedTransaction) => (
                          <React.Fragment
                            key={`level2-${level2Child.category.idKategori}`}
                          >
                            <TableRow className="bg-white hover:bg-slate-50/50">
                              <TableCell className="font-semibold text-slate-700 px-4 lg:px-6 py-3">
                                <div className="flex items-center">
                                  <span className="w-4 h-px bg-slate-300 mr-3"></span>
                                  <span className="text-sm">
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
                              <TableCell className="text-center text-slate-600 font-medium text-sm">
                                {selectedYear}
                              </TableCell>
                              <TableCell className="text-right font-mono font-semibold text-blue-600 text-sm">
                                {formatCurrency(level2Child.total)}
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="text-slate-600 font-medium text-xs lg:text-sm">
                                  Auto Calculate
                                </span>
                              </TableCell>
                            </TableRow>

                            {level2Child.children &&
                              level2Child.children.map(
                                (level3Child: Level3TransactionItem) => (
                                  <TableRow
                                    key={`level3-${level3Child.category.idKategori}-${level3Child.transaction.idTransaksi}`}
                                    className="bg-white hover:bg-slate-50/30"
                                  >
                                    <TableCell className="font-medium text-slate-600 px-4 lg:px-6 py-3">
                                      <div className="flex items-center">
                                        <span className="w-8 h-px bg-slate-300 mr-3"></span>
                                        <span className="text-sm">
                                          {level3Child.category.namaKategori}
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
                                    <TableCell className="text-center text-slate-500 text-sm">
                                      {
                                        level3Child.transaction.tahunAnggaran
                                          .tahun
                                      }
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-medium text-slate-700 text-sm">
                                      {formatCurrency(level3Child.amount)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="flex items-center justify-center gap-1 lg:gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            handleEdit(level3Child.transaction)
                                          }
                                          className="border-blue-200 text-blue-600 hover:bg-blue-50 h-7 w-7 lg:h-8 lg:w-8 p-0"
                                        >
                                          <Edit className="h-3 w-3 lg:h-4 lg:w-4" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            handleDelete(
                                              level3Child.transaction
                                                .idTransaksi
                                            )
                                          }
                                          className="border-red-200 text-red-600 hover:bg-red-50 h-7 w-7 lg:h-8 lg:w-8 p-0"
                                        >
                                          <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
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
