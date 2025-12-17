"use client";

import React from "react";
import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Clock,
  DollarSign,
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
import { apiClient, formatCurrency } from "@/lib/api";

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

export default function PendapatanPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("2024"); // Default year set to 2024
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [level2Categories, setLevel2Categories] = useState<Category[]>([]);
  const [level3Categories, setLevel3Categories] = useState<Category[]>([]);
  const [selectedLevel2, setSelectedLevel2] = useState<string>(""); // Default level 2 category set to empty
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
    }
  }, [selectedYear, years]);

  const fetchInitialData = async () => {
    try {
      console.log(" Fetching initial data...");
      console.log(" API URL:", process.env.NEXT_PUBLIC_API_URL);

      const [yearsResponse, categoriesResponse] = await Promise.all([
        apiClient.getTahunAnggaran(),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/kategori-apbd?jenis=Pendapatan`
        ),
      ]);

      console.log(" Years response:", yearsResponse);

      if (yearsResponse.success && yearsResponse.data) {
        const yearsData = yearsResponse.data;
        setYears(yearsData);
        console.log(" Years loaded:", yearsData.length);

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
        console.log(" Categories response:", categoriesData);
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
      console.error(" Error fetching initial data:", error);
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
        `${process.env.NEXT_PUBLIC_API_URL}/api/transaksi-apbd?tahun=${selectedYear}&jenis=Pendapatan&limit=100`
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
          console.log(" Transactions loaded:", processedTransactions.length);
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
      console.error(" Error fetching transactions:", error);
      setError("Gagal memuat data transaksi");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null); // Clear previous errors before submitting

    if (
      !formData.idKategori ||
      !formData.idTahun ||
      formData.jumlah === "" ||
      formData.jumlah === null ||
      formData.jumlah === undefined
    ) {
      setError("Tahun, kategori, dan jumlah wajib diisi");
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
        await fetchTransactions();
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
        await fetchTransactions();
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

  const groupedTransactions = React.useMemo(() => {
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
        // Level 1: sort by category ID
        return categoryA.idKategori - categoryB.idKategori;
      } else if (categoryA.level === 2) {
        // Level 2: sort by category ID
        return categoryA.idKategori - categoryB.idKategori;
      } else if (categoryA.level === 3) {
        // Level 3: sort by parent ID first, then by category ID
        const parentDiff =
          (categoryA.idParent || 0) - (categoryB.idParent || 0);
        if (parentDiff !== 0) return parentDiff;
        return categoryA.idKategori - categoryB.idKategori;
      }

      // Default sort by category ID
      return categoryA.idKategori - categoryB.idKategori;
    });

    const hierarchyMap = new Map();
    const level1Categories = new Map();
    const level2Categories = new Map();

    // First pass: collect all categories by level
    sortedTransactions.forEach((transaction) => {
      const category = transaction.kategoriApbd;
      const level = category.level;

      if (level === 1) {
        if (!level1Categories.has(category.idKategori)) {
          level1Categories.set(category.idKategori, {
            category,
            transaction,
            children: [], // Level 2 children
            total: Number(transaction.jumlah) || 0,
          });
        }
      } else if (level === 2) {
        if (!level2Categories.has(category.idKategori)) {
          level2Categories.set(category.idKategori, {
            category,
            transaction,
            children: [], // Level 3 children - ensure children array is always initialized
            total: Number(transaction.jumlah) || 0,
          });
        }
      } else if (level === 3 && category.idParent) {
        // Level 3 categories will be added to their Level 2 parents
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

    // Second pass: organize Level 2 categories under their Level 1 parents
    level2Categories.forEach((level2Group) => {
      const level2Category = level2Group.category;
      if (level2Category.idParent) {
        const level1Parent = level1Categories.get(level2Category.idParent);
        if (level1Parent) {
          level1Parent.children.push(level2Group);
        }
      }
    });

    // Build final result array maintaining hierarchy
    const result: Array<{
      category: Category;
      transaction: Transaction;
      children: Array<{
        category: Category;
        transaction: Transaction;
        children?: Array<{
          category: Category;
          transaction: Transaction;
          amount: number;
        }>;
        total: number;
      }>[];
      total: number;
    }> = [];

    // Add Level 1 categories first with their complete hierarchy
    level1Categories.forEach((level1Group) => {
      result.push(level1Group);
    });

    // Add standalone Level 2 categories (those without Level 1 parents)
    level2Categories.forEach((level2Group) => {
      const level2Category = level2Group.category;
      if (
        !level2Category.idParent ||
        !level1Categories.has(level2Category.idParent)
      ) {
        result.push(level2Group);
      }
    });

    return result;
  }, [filteredTransactions]);

  const totalPendapatan = React.useMemo(() => {
    return groupedTransactions.reduce((sum, group) => {
      // Only count level 1 categories in total
      if (group.category.level === 1) {
        return sum + group.total;
      }
      return sum;
    }, 0);
  }, [groupedTransactions]);

  const filteredLevel3Categories = level3Categories.filter((cat) => {
    if (!selectedLevel2) return false;
    return cat.idParent?.toString() === selectedLevel2;
  });

  console.log(" Grouped transactions:", groupedTransactions);
  console.log(" Total pendapatan (level 1 only):", totalPendapatan);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 lg:p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 lg:p-6 space-y-4 lg:space-y-6">
      <div className="relative overflow-hidden rounded-xl lg:rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-4 lg:p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-balance">
              💰 Kelola Pendapatan
            </h1>
            <p className="text-blue-100 text-sm lg:text-lg text-pretty">
              Kelola data pendapatan daerah BPKAD Kabupaten Garut
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                size="lg"
                className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg font-semibold w-full md:w-auto"
              >
                <Plus className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Tambah Pendapatan</span>
                <span className="sm:hidden">Tambah</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTransaction ? "Edit Pendapatan" : "Tambah Pendapatan"}
                </DialogTitle>
                <DialogDescription>
                  {editingTransaction
                    ? "Ubah data pendapatan yang sudah ada"
                    : "Tambahkan data pendapatan baru"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
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
                        // Reset level 3 selection when level 2 changes
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

      <div className="grid gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600"></div>
          <CardHeader className="relative text-white pb-2 p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xs lg:text-lg font-medium text-emerald-100">
                  Total Pendapatan
                </CardTitle>
                <div className="text-lg lg:text-2xl font-bold mt-1 truncate">
                  {formatCurrency(totalPendapatan)}
                </div>
              </div>
              <div className="p-2 lg:p-3 bg-white/20 rounded-full shrink-0">
                <DollarSign className="h-4 w-4 lg:h-6 lg:w-6" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600"></div>
          <CardHeader className="relative text-white pb-2 p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xs lg:text-lg font-medium text-blue-100">
                  Total Transaksi
                </CardTitle>
                <div className="text-lg lg:text-2xl font-bold mt-1">
                  {filteredTransactions.length}
                </div>
              </div>
              <div className="p-2 lg:p-3 bg-white/20 rounded-full shrink-0">
                <FileText className="h-4 w-4 lg:h-6 lg:w-6" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg sm:col-span-2 lg:col-span-1">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600"></div>
          <CardHeader className="relative text-white pb-2 p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xs lg:text-lg font-medium text-purple-100">
                  Tahun Aktif
                </CardTitle>
                <div className="text-lg lg:text-2xl font-bold mt-1">
                  {selectedYear}
                </div>
              </div>
              <div className="p-2 lg:p-3 bg-white/20 rounded-full shrink-0">
                <Clock className="h-5 w-5 md:h-6 md:w-6" />
              </div>
            </div>
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
                placeholder="Cari kategori pendapatan..."
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
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b p-4 lg:p-6">
          <CardTitle className="text-base lg:text-xl text-slate-800">
            📊 Data Pendapatan
          </CardTitle>
          <CardDescription className="text-slate-600 text-sm lg:text-base">
            Daftar semua transaksi pendapatan daerah tahun {selectedYear} (Total
            dari Level 1)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="font-semibold text-slate-700 text-left px-4 lg:px-6 min-w-[200px] lg:min-w-[300px]">
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
                  <TableHead className="text-center font-semibold text-slate-700 min-w-[100px] lg:min-w-[120px]">
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
                          <FileText className="h-8 w-8 text-slate-400" />
                        </div>
                        <div className="text-slate-500 font-medium">
                          Tidak ada data pendapatan
                        </div>
                        <div className="text-sm text-slate-400">
                          Silakan tambah data pendapatan baru
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  groupedTransactions.map((group, groupIndex) => (
                    <React.Fragment key={group.category.idKategori}>
                      <TableRow
                        className={
                          groupIndex % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                        }
                      >
                        <TableCell className="font-bold text-slate-900 px-4 lg:px-6 text-sm lg:text-base">
                          <div
                            className="truncate"
                            title={group.category.namaKategori}
                          >
                            {group.category.namaKategori}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 text-xs"
                          >
                            {group.category.kode || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 text-center text-sm">
                          {group.transaction.tahunAnggaran.tahun}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-emerald-600 text-sm lg:text-base">
                          <div
                            className="truncate"
                            title={formatCurrency(group.total)}
                          >
                            {formatCurrency(group.total)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <Badge variant="secondary" className="text-xs">
                              Auto Calculate
                            </Badge>
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
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center">
                                <Badge variant="secondary" className="text-xs">
                                  Auto Calculate
                                </Badge>
                              </div>
                            </TableCell>
                          </TableRow>

                          {level2Child.children &&
                            level2Child.children.map(
                              (level3Child: {
                                category: Category;
                                transaction: Transaction;
                                amount: number;
                              }) => (
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
                                      title={formatCurrency(level3Child.amount)}
                                    >
                                      {formatCurrency(level3Child.amount)}
                                    </div>
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
                                            level3Child.transaction.idTransaksi
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
                      ))}
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
