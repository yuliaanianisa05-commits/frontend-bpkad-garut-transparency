"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
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
import { apiClient } from "@/lib/api";

interface TahunAnggaran {
  idTahun: number;
  tahun: number;
  nomorPerda?: string;
  tanggalPenetapan?: string;
  _count?: {
    transaksiApbd: number;
    ringkasanApbd: number;
  };
}

export default function TahunAnggaranPage() {
  const [years, setYears] = useState<TahunAnggaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<TahunAnggaran | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    tahun: "",
    nomorPerda: "",
    tanggalPenetapan: "",
  });

  useEffect(() => {
    fetchYears();
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

  const fetchYears = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getTahunAnggaran();

      if (response.success) {
        setYears(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching years:", error);
      setError("Gagal memuat data tahun anggaran");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url = editingYear
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/tahun-anggaran/${editingYear.idTahun}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/tahun-anggaran`;

      const method = editingYear ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tahun: Number.parseInt(formData.tahun),
          nomorPerda: formData.nomorPerda || null,
          tanggalPenetapan: formData.tanggalPenetapan || null,
        }),
      });

      if (response.ok) {
        await fetchYears();
        setIsDialogOpen(false);
        resetForm();
        setError(null);
        setSuccess(
          editingYear
            ? "Tahun anggaran berhasil diperbarui"
            : "Tahun anggaran berhasil ditambahkan"
        );
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Gagal menyimpan data");
        setIsDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error saving year:", error);
      setError("Gagal menyimpan data");
      setIsDialogOpen(false);
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (year: TahunAnggaran) => {
    setEditingYear(year);
    setFormData({
      tahun: year.tahun.toString(),
      nomorPerda: year.nomorPerda || "",
      tanggalPenetapan: year.tanggalPenetapan
        ? year.tanggalPenetapan.split("T")[0]
        : "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    const year = years.find((y) => y.idTahun === id);
    if (year?._count?.transaksiApbd && year._count.transaksiApbd > 0) {
      setError("Tidak dapat menghapus tahun anggaran yang memiliki transaksi");
      return;
    }

    if (!confirm("Apakah Anda yakin ingin menghapus tahun anggaran ini?"))
      return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tahun-anggaran/${id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        await fetchYears();
        setError(null);
        setSuccess("Tahun anggaran berhasil dihapus");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Gagal menghapus data");
      }
    } catch (error) {
      console.error("Error deleting year:", error);
      setError("Gagal menghapus data");
    }
  };

  const resetForm = () => {
    setFormData({
      tahun: "",
      nomorPerda: "",
      tanggalPenetapan: "",
    });
    setEditingYear(null);
  };

  const filteredYears = years.filter(
    (year) =>
      year.tahun.toString().includes(searchTerm) ||
      (year.nomorPerda &&
        year.nomorPerda.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalYears = years.length;
  const activeYears = years.filter(
    (y) => y._count?.transaksiApbd && y._count.transaksiApbd > 0
  ).length;
  const currentYear = new Date().getFullYear();

  if (loading) {
    return (
      <div className="space-y-6 w-full">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 w-full px-5 py-5">
      <div className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-4 md:p-6 lg:p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2 min-w-0 flex-1">
            <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-balance">
              📅 Kelola Tahun Anggaran
            </h1>
            <p className="text-blue-100 text-sm md:text-base lg:text-lg text-pretty">
              Kelola tahun anggaran BPKAD Kabupaten Garut dan peraturan daerah
              terkait
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                size="lg"
                className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg font-semibold w-full md:w-auto flex-shrink-0"
              >
                <Plus className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                <span className="hidden sm:inline">Tambah Tahun Anggaran</span>
                <span className="sm:hidden">Tambah</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md mx-4">
              <DialogHeader>
                <DialogTitle>
                  {editingYear
                    ? "Edit Tahun Anggaran"
                    : "Tambah Tahun Anggaran"}
                </DialogTitle>
                <DialogDescription>
                  {editingYear
                    ? "Ubah data tahun anggaran yang sudah ada"
                    : "Tambahkan tahun anggaran APBD baru"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="tahun">Tahun Anggaran</Label>
                    <Input
                      id="tahun"
                      type="number"
                      value={formData.tahun}
                      onChange={(e) =>
                        setFormData({ ...formData, tahun: e.target.value })
                      }
                      placeholder="Contoh: 2024"
                      min="2000"
                      max="2100"
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="nomorPerda">Nomor Perda (Opsional)</Label>
                    <Input
                      id="nomorPerda"
                      value={formData.nomorPerda}
                      onChange={(e) =>
                        setFormData({ ...formData, nomorPerda: e.target.value })
                      }
                      placeholder="Contoh: 9/2021"
                      disabled={submitting}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tanggalPenetapan">
                      Tanggal Penetapan (Opsional)
                    </Label>
                    <Input
                      id="tanggalPenetapan"
                      type="date"
                      value={formData.tanggalPenetapan}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tanggalPenetapan: e.target.value,
                        })
                      }
                      disabled={submitting}
                    />
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={submitting}
                    className="w-full sm:w-auto"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto"
                  >
                    {submitting
                      ? "Menyimpan..."
                      : editingYear
                      ? "Simpan Perubahan"
                      : "Tambah"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription className="font-medium">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 md:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full">
        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600"></div>
          <CardHeader className="relative text-white pb-2 p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xs md:text-lg font-medium text-blue-100">
                  Total Tahun
                </CardTitle>
                <div className="text-xl md:text-2xl font-bold mt-1">
                  {totalYears}
                </div>
              </div>
              <div className="p-2 md:p-3 bg-white/20 rounded-full flex-shrink-0">
                <Calendar className="h-5 w-5 md:h-6 md:w-6" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600"></div>
          <CardHeader className="relative text-white pb-2 p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xs lg:text-lg font-medium text-emerald-100">
                  Tahun Aktif
                </CardTitle>
                <div className="text-xl md:text-2xl font-bold mt-1">
                  {activeYears}
                </div>
              </div>
              <div className="p-2 md:p-3 bg-white/20 rounded-full flex-shrink-0">
                <Users className="h-5 w-5 md:h-6 md:w-6" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg sm:col-span-2 lg:col-span-1">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600"></div>
          <CardHeader className="relative text-white pb-2 p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xs lg:text-lg font-medium text-purple-100">
                  Tahun Sekarang
                </CardTitle>
                <div className="text-xl md:text-2xl font-bold mt-1">
                  {currentYear}
                </div>
              </div>
              <div className="p-2 md:p-3 bg-white/20 rounded-full flex-shrink-0">
                <Clock className="h-5 w-5 md:h-6 md:w-6" />
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm w-full">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <Search className="h-4 w-4 text-blue-600" />
            </div>
            <Input
              placeholder="Cari tahun atau nomor perda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:max-w-80 border-blue-200 focus:border-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm w-full">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b p-4 md:p-6">
          <CardTitle className="text-base md:text-lg lg:text-xl text-slate-800">
            📅 Data Tahun Anggaran
          </CardTitle>
          <CardDescription className="text-slate-600 text-sm md:text-base">
            Daftar semua tahun anggaran APBD dengan informasi peraturan daerah
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
            <Table className="w-full min-w-[700px]">
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="font-semibold text-slate-700 px-3 md:px-4 lg:px-6 w-[100px] md:w-[120px]">
                    Tahun
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 w-[140px] md:w-[160px]">
                    Nomor Perda
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 w-[180px] md:w-[200px]">
                    Tanggal Penetapan
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 w-[100px] md:w-[120px]">
                    Transaksi
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 w-[100px] md:w-[120px]">
                    Status
                  </TableHead>
                  <TableHead className="text-center font-semibold text-slate-700 w-[120px] md:w-[150px]">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredYears.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 md:py-12"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-3 md:p-4 bg-slate-100 rounded-full">
                          <Calendar className="h-6 w-6 md:h-8 md:w-8 text-slate-400" />
                        </div>
                        <div className="text-slate-500 font-medium text-sm md:text-base">
                          Tidak ada data tahun anggaran
                        </div>
                        <div className="text-xs md:text-sm text-slate-400">
                          Silakan tambah tahun anggaran baru untuk memulai
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredYears.map((year, index) => (
                    <TableRow
                      key={year.idTahun}
                      className={
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                      }
                    >
                      <TableCell className="font-bold text-slate-800 text-base md:text-lg px-3 md:px-4 lg:px-6">
                        {year.tahun}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 font-mono text-xs"
                        >
                          {year.nomorPerda || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 text-xs md:text-sm">
                        {year.tanggalPenetapan
                          ? new Date(year.tanggalPenetapan).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs bg-slate-50"
                        >
                          {year._count?.transaksiApbd || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            year.tahun === currentYear ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {year.tahun === currentYear
                            ? "Berjalan"
                            : year.tahun > currentYear
                            ? "Masa Depan"
                            : "Selesai"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 md:gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(year)}
                            className="border-blue-200 text-blue-600 hover:bg-blue-50 h-7 w-7 md:h-8 md:w-8 p-0"
                          >
                            <Edit className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(year.idTahun)}
                            disabled={(year._count?.transaksiApbd ?? 0) > 0}
                            className="border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 h-7 w-7 md:h-8 md:w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
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
