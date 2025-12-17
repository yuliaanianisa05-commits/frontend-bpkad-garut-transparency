"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  FolderTree,
  CheckCircle2,
  TrendingUp,
  FileText,
  FolderOpen,
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

interface Category {
  idKategori: number;
  namaKategori: string;
  kode?: string;
  level: number;
  jenis: string;
  idParent?: number;
  parent?: {
    namaKategori: string;
  };
  children?: Category[];
  _count?: {
    transaksiApbd: number;
  };
}

export default function KategoriPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJenis, setSelectedJenis] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    namaKategori: "",
    kode: "",
    jenis: "Pendapatan",
    level: "1",
    idParent: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/kategori-apbd`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCategories(data.data || []);
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError("Gagal memuat data kategori");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null); // Clear previous errors before submitting

    try {
      if (!formData.namaKategori.trim()) {
        setError("Nama kategori wajib diisi");
        setSubmitting(false);
        return;
      }

      if (Number.parseInt(formData.level) > 1 && !formData.idParent) {
        setError("Kategori level 2 atau lebih harus memiliki kategori induk");
        setSubmitting(false);
        return;
      }

      const url = editingCategory
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/kategori-apbd/${editingCategory.idKategori}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/kategori-apbd`;

      const method = editingCategory ? "PUT" : "POST";

      console.log(" Sending request:", {
        url,
        method,
        data: {
          namaKategori: formData.namaKategori.trim(),
          kode: formData.kode.trim() || null,
          jenis: formData.jenis,
          level: Number.parseInt(formData.level),
          idParent: formData.idParent
            ? Number.parseInt(formData.idParent)
            : null,
        },
      });

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          namaKategori: formData.namaKategori.trim(),
          kode: formData.kode.trim() || null,
          jenis: formData.jenis,
          level: Number.parseInt(formData.level),
          idParent: formData.idParent
            ? Number.parseInt(formData.idParent)
            : null,
        }),
      });

      const responseData = await response.json(); // Always parse response data first

      console.log(" Response:", {
        status: response.status,
        data: responseData,
      });

      if (response.ok) {
        await fetchCategories();
        setIsDialogOpen(false);
        resetForm();
        setError(null);
        setSuccess(
          editingCategory
            ? "Kategori berhasil diperbarui"
            : "Kategori berhasil ditambahkan"
        );
      } else {
        setError(responseData.message || "Gagal menyimpan data");
        console.log(" Backend error:", responseData.message); // Log backend error for debugging
      }
    } catch (error) {
      console.error(" Error saving category:", error);
      setError("Gagal menyimpan data - periksa koneksi internet");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      namaKategori: category.namaKategori,
      kode: category.kode || "",
      jenis: category.jenis,
      level: category.level.toString(),
      idParent: category.idParent?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    const category = categories.find((c) => c.idKategori === id);
    if (category?._count?.transaksiApbd && category._count.transaksiApbd > 0) {
      setError("Tidak dapat menghapus kategori yang memiliki transaksi");
      return;
    }

    if (!confirm("Apakah Anda yakin ingin menghapus kategori ini?")) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/kategori-apbd/${id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        await fetchCategories();
        setError(null);
        setSuccess("Kategori berhasil dihapus");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Gagal menghapus data");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      setError("Gagal menghapus data");
    }
  };

  const resetForm = () => {
    setFormData({
      namaKategori: "",
      kode: "",
      jenis: "Pendapatan",
      level: "1",
      idParent: "",
    });
    setEditingCategory(null);
  };

  const filteredCategories = categories.filter((category) => {
    const matchesSearch = category.namaKategori
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesJenis =
      selectedJenis === "all" || category.jenis === selectedJenis;
    return matchesSearch && matchesJenis;
  });

  const getParentCategories = () => {
    const level = Number.parseInt(formData.level);
    if (level === 1) return [];

    const targetLevel = level - 1;
    return categories.filter(
      (cat) => cat.level === targetLevel && cat.jenis === formData.jenis
    );
  };

  const getAvailableLevels = () => {
    const availableLevels = [{ value: "1", label: "Level 1 (Kategori Utama)" }];

    // Check if there are Level 1 categories for the selected jenis
    const level1Categories = categories.filter(
      (cat) => cat.level === 1 && cat.jenis === formData.jenis
    );

    if (level1Categories.length > 0) {
      availableLevels.push({ value: "2", label: "Level 2 (Sub Kategori)" });

      // Check if there are Level 2 categories for the selected jenis
      const level2Categories = categories.filter(
        (cat) => cat.level === 2 && cat.jenis === formData.jenis
      );

      if (level2Categories.length > 0) {
        availableLevels.push({ value: "3", label: "Level 3 (Detail)" });
      }
    }

    return availableLevels;
  };

  const parentCategories = getParentCategories();
  const availableLevels = getAvailableLevels();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 lg:p-6 space-y-4">
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
              📁 Kelola Kategori
            </h1>
            <p className="text-blue-100 text-sm lg:text-lg text-pretty">
              Kelola kategori APBD (Pendapatan, Belanja, Pembelanjaan,
              Pembiayaan) Kabupaten Garut
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
                <span className="hidden sm:inline">Tambah Kategori</span>
                <span className="sm:hidden">Tambah</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Edit Kategori" : "Tambah Kategori"}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory
                    ? "Ubah data kategori yang sudah ada"
                    : "Tambahkan kategori APBD baru"}
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
                    <Label htmlFor="namaKategori">Nama Kategori</Label>
                    <Input
                      id="namaKategori"
                      value={formData.namaKategori}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          namaKategori: e.target.value,
                        })
                      }
                      placeholder="Masukkan nama kategori"
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="kode">Kode (Opsional)</Label>
                    <Input
                      id="kode"
                      value={formData.kode}
                      onChange={(e) =>
                        setFormData({ ...formData, kode: e.target.value })
                      }
                      placeholder="Contoh: 4.1.1"
                      disabled={submitting}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="jenis">Jenis</Label>
                    <Select
                      value={formData.jenis}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          jenis: value,
                          idParent: "",
                          level: "1",
                        })
                      }
                      disabled={submitting}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendapatan">Pendapatan</SelectItem>
                        <SelectItem value="Belanja">Belanja</SelectItem>
                        <SelectItem value="Pembelanjaan">
                          Pembelanjaan
                        </SelectItem>
                        <SelectItem value="Pembiayaan">Pembiayaan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="level">Level</Label>
                    <Select
                      value={formData.level}
                      onValueChange={(value) => {
                        const newLevel = Number.parseInt(value);
                        const currentLevel = Number.parseInt(formData.level);

                        // If changing to a lower level, reset parent
                        if (newLevel <= currentLevel) {
                          setFormData({
                            ...formData,
                            level: value,
                            idParent: "",
                          });
                        } else {
                          setFormData({
                            ...formData,
                            level: value,
                            idParent: "",
                          });
                        }
                      }}
                      disabled={submitting}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {availableLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {formData.jenis === "Pendapatan" ||
                      // formData.jenis === "Belanja" ||
                      formData.jenis === "Pembelanjaan" ||
                      formData.jenis === "Pembiayaan"
                        ? availableLevels.length === 1
                          ? "Mulai dengan Level 1 untuk membuat kategori utama"
                          : availableLevels.length === 2
                          ? "Level 2 tersedia setelah ada kategori Level 1"
                          : "Semua level tersedia"
                        : ""}
                    </p>
                  </div>
                  {Number.parseInt(formData.level) > 1 && (
                    <div className="grid gap-2">
                      <Label htmlFor="parent">Kategori Induk</Label>
                      {parentCategories.length === 0 ? (
                        <div className="p-3 border border-amber-200 bg-amber-50 rounded-md">
                          <p className="text-sm text-amber-800">
                            Tidak ada kategori Level{" "}
                            {Number.parseInt(formData.level) - 1} untuk jenis "
                            {formData.jenis}
                            ". Silakan buat kategori Level{" "}
                            {Number.parseInt(formData.level) - 1} terlebih
                            dahulu.
                          </p>
                        </div>
                      ) : (
                        <>
                          <Select
                            value={formData.idParent}
                            onValueChange={(value) =>
                              setFormData({ ...formData, idParent: value })
                            }
                            disabled={submitting}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih kategori induk" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60 overflow-y-auto">
                              {parentCategories.map((category) => (
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
                          <p className="text-xs text-muted-foreground">
                            {Number.parseInt(formData.level) === 2
                              ? "Pilih kategori Level 1 sebagai induk"
                              : "Pilih kategori Level 2 sebagai induk"}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={submitting}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      submitting ||
                      (Number.parseInt(formData.level) > 1 &&
                        parentCategories.length === 0)
                    }
                  >
                    {submitting
                      ? "Menyimpan..."
                      : editingCategory
                      ? "Simpan Perubahan"
                      : "Tambah"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription className="font-medium">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {["Pendapatan", "Belanja", "Pembiayaan"].map(
          (jenis) => {
            const count = categories.filter(
              (cat) => cat.jenis === jenis
            ).length;
            const gradientMap = {
              Pendapatan: "bg-gradient-to-br from-emerald-500 to-teal-600",
              Belanja: "bg-gradient-to-br from-red-500 to-pink-600",
              Pembelanjaan: FileText,
              Pembiayaan: "bg-gradient-to-br from-purple-500 to-indigo-600",
            };
            const iconMap = {
              Pendapatan: TrendingUp,
              Belanja: FileText,
              Pembelanjaan: FileText,
              Pembiayaan: FolderOpen,
            };
            const Icon = iconMap[jenis as keyof typeof iconMap];
            return (
              <Card
                key={jenis}
                className="relative overflow-hidden border-0 shadow-lg"
              >
                <div
                  className={`absolute inset-0 ${
                    gradientMap[jenis as keyof typeof gradientMap]
                  }`}
                ></div>
                <CardHeader className="relative text-white pb-2 p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-xs lg:text-lg font-medium text-white/90">
                        Kategori {jenis}
                      </CardTitle>
                      <div className="text-lg lg:text-2xl font-bold mt-1">
                        {count}
                      </div>
                    </div>
                    <div className="p-2 lg:p-3 bg-white/20 rounded-full shrink-0">
                      <Icon className="h-4 w-4 lg:h-6 lg:w-6" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          }
        )}
      </div>

      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm flex-1">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b p-4 lg:p-6">
          <CardTitle className="text-base lg:text-xl text-slate-800">
            📁 Data Kategori
          </CardTitle>
          <CardDescription className="text-slate-600 text-sm lg:text-base">
            Daftar semua kategori BPKAD dengan hierarki dan struktur organisasi
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="max-h-96 overflow-y-auto">
              <Table className="min-w-full">
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="font-semibold text-slate-700 px-4 lg:px-6 py-3 min-w-[200px] lg:min-w-[250px]">
                      Nama Kategori
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 py-3 text-center min-w-[80px] lg:min-w-[100px]">
                      Kode
                    </TableHead>
                    {/* <TableHead className="font-semibold text-slate-700 py-3 text-center min-w-[90px] lg:min-w-[110px]">
                      Jenis
                    </TableHead> */}
                    <TableHead className="font-semibold text-slate-700 py-3 text-center min-w-[70px] lg:min-w-[80px]">
                      Level
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 py-3 min-w-[120px] lg:min-w-[150px]">
                      Induk
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 py-3 text-center min-w-[80px] lg:min-w-[100px]">
                      Transaksi
                    </TableHead>
                    <TableHead className="text-center font-semibold text-slate-700 py-3 min-w-[100px] lg:min-w-[120px]">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-4 bg-slate-100 rounded-full">
                            <FolderTree className="h-8 w-8 text-slate-400" />
                          </div>
                          <div className="text-slate-500 font-medium">
                            Tidak ada data kategori
                          </div>
                          <div className="text-sm text-slate-400">
                            Silakan tambah kategori baru untuk memulai
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCategories.map((category, index) => (
                      <TableRow
                        key={category.idKategori}
                        className={
                          index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                        }
                      >
                        <TableCell className="font-medium text-slate-800 py-3 px-4 lg:px-6">
                          <div className="flex items-center gap-2">
                            {category.level === 2 && (
                              <div className="flex items-center gap-1 shrink-0">
                                <div className="w-4 h-px bg-slate-300"></div>
                                <FolderTree className="h-3 w-3 text-muted-foreground" />
                              </div>
                            )}
                            {category.level === 3 && (
                              <div className="flex items-center gap-1 shrink-0">
                                <div className="w-8 h-px bg-slate-300"></div>
                                <FolderTree className="h-3 w-3 text-muted-foreground" />
                              </div>
                            )}
                            <span
                              className="truncate text-sm lg:text-base"
                              title={category.namaKategori}
                            >
                              {category.namaKategori}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200 font-mono text-xs"
                          >
                            {category.kode || "-"}
                          </Badge>
                        </TableCell>
                        {/* <TableCell className="py-3 text-center">
                          <Badge
                            variant={
                              category.jenis === "Pendapatan"
                                ? "default"
                                : category.jenis === "Belanja"
                                ? "destructive"
                                : category.jenis === "Pembelanjaan"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {category.jenis}
                          </Badge>
                        </TableCell> */}
                        <TableCell className="text-slate-600 py-3 text-center">
                          <span className="text-sm">
                            Level {category.level}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-600 py-3">
                          <span
                            className="text-sm truncate"
                            title={category.parent?.namaKategori || "-"}
                          >
                            {category.parent?.namaKategori || "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center align-middle py-3">
                          <Badge
                            variant="outline"
                            className="text-xs bg-slate-50"
                          >
                            {category._count?.transaksiApbd || 0}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-center py-3">
                          <div className="flex items-center justify-center gap-1 lg:gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(category)}
                              className="border-blue-200 text-blue-600 hover:bg-blue-50 h-7 w-7 lg:h-8 lg:w-8 p-0"
                            >
                              <Edit className="h-3 w-3 lg:h-4 lg:w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(category.idKategori)}
                              disabled={Boolean(
                                category._count?.transaksiApbd &&
                                  category._count.transaksiApbd > 0
                              )}
                              className="border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 h-7 w-7 lg:h-8 lg:w-8 p-0"
                            >
                              <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
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
