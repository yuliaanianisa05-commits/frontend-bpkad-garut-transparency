"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Plus, Search, Filter, TrendingDown, CreditCard, FileText, Edit, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient, formatCurrency } from "@/lib/api"

interface Transaction {
  idTransaksi: number
  jumlah: number
  kategoriApbd: {
    idKategori: number
    namaKategori: string
    kode?: string
    level: number
    jenis?: string
    idParent?: number
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

interface Year {
  idTahun: number
  tahun: number
}

interface GroupedTransaction {
  category: Category
  transactions: Transaction[]
  total: number
  children?: GroupedTransaction[]
}

export default function PembelanjaanPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [years, setYears] = useState<Year[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedYear, setSelectedYear] = useState<string>("2024") // Default to 2024
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [level2Categories, setLevel2Categories] = useState<Category[]>([])
  const [level3Categories, setLevel3Categories] = useState<Category[]>([])
  const [selectedLevel2, setSelectedLevel2] = useState<string>("")

  const [formData, setFormData] = useState({
    idKategori: "",
    idTahun: "",
    jumlah: "",
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedYear && years.length > 0) {
      fetchTransactions()
    }
  }, [selectedYear, years])

  const fetchInitialData = async () => {
    try {
      console.log(" Fetching initial data for pembelanjaan...")
      const [yearsResponse, categoriesResponse] = await Promise.all([
        apiClient.getTahunAnggaran(),
        // coba jenis=Belanja, fallback ke Pembelanjaan jika kosong/tidak ok
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kategori-apbd?jenis=Belanja`).then(async (res) => {
          if (res.ok) {
            const data = await res.json()
            if (data.success && data.data && data.data.length > 0) {
              return data
            }
          }
          const fallbackRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kategori-apbd?jenis=Pembelanjaan`)
          return fallbackRes.ok ? await fallbackRes.json() : { success: false, data: [] }
        }),
      ])

      console.log(" Years response:", yearsResponse)
      if (yearsResponse.success && yearsResponse.data) {
        const yearsData = yearsResponse.data
        setYears(yearsData)
        console.log(
          " Available years:",
          yearsData.map((y) => y.tahun),
        )
        if (yearsData.length > 0) {
          const latestYear = yearsData.reduce((latest, current) => (current.tahun > latest.tahun ? current : latest))
          setSelectedYear(latestYear.tahun.toString())
          console.log(" Selected year:", latestYear.tahun)
        }
      }

      // perbaiki parsing categoriesResponse (sudah berupa JSON di atas)
      console.log(" Categories response:", categoriesResponse)
      if (categoriesResponse.success) {
        const allCategories = categoriesResponse.data
        setCategories(allCategories)
        console.log(" All categories count:", allCategories.length)
        const level2Cats = allCategories.filter((cat: Category) => cat.level === 2)
        const level3Cats = allCategories.filter((cat: Category) => cat.level === 3)

        setLevel2Categories(level2Cats)
        setLevel3Categories(level3Cats)

        console.log(" Level 2 categories loaded:", level2Cats.length)
        console.log(" Level 3 categories loaded:", level3Cats.length)
      }
    } catch (error) {
      console.error("Error fetching initial data:", error)
      setError("Gagal memuat data awal")
    }
  }

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      console.log(" Fetching transactions for year:", selectedYear)

      let response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transaksi-apbd?tahun=${selectedYear}&jenis=Belanja&limit=100`,
      )

      if (response.ok) {
        const data = await response.json()
        console.log(" Transaction API response (Belanja):", data)
        if (data.success && data.data.transactions && data.data.transactions.length > 0) {
          setTransactions(data.data.transactions)
          console.log(" Loaded transactions (Belanja):", data.data.transactions.length)
          return
        }
      }

      console.log(" Trying Pembelanjaan...")
      response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transaksi-apbd?tahun=${selectedYear}&jenis=Pembelanjaan&limit=100`,
      )

      if (response.ok) {
        const data = await response.json()
        console.log(" Transaction API response (Pembelanjaan):", data)
        if (data.success) {
          setTransactions(data.data.transactions || [])
          console.log(" Loaded transactions (Pembelanjaan):", data.data.transactions?.length || 0)
        } else {
          console.log(" API returned success=false:", data.message)
          setTransactions([])
        }
      } else {
        console.log(" API response not ok:", response.status)
        setTransactions([])
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
      setError("Gagal memuat data transaksi")
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null) // Clear previous errors before submitting

    if (
      !formData.idKategori ||
      !formData.idTahun ||
      formData.jumlah === "" ||
      formData.jumlah === null ||
      formData.jumlah === undefined
    ) {
      setError("Semua field harus diisi")
      setSubmitting(false)
      return
    }

    const jumlahValue = Number.parseFloat(formData.jumlah)
    if (isNaN(jumlahValue) || jumlahValue < 0) {
      setError("Jumlah harus berupa angka dan tidak boleh negatif")
      setSubmitting(false)
      return
    }

    try {
      console.log(" Submitting form data:", {
        idKategori: Number.parseInt(formData.idKategori),
        idTahun: Number.parseInt(formData.idTahun),
        jumlah: Number.parseFloat(formData.jumlah),
      })

      const url = editingTransaction
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/transaksi-apbd/${editingTransaction.idTransaksi}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/transaksi-apbd`

      const method = editingTransaction ? "PUT" : "POST"

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
      })

      console.log(" Response status:", response.status)
      const responseData = await response.json() // Always parse response data first
      console.log(" Response data:", responseData)

      if (response.ok) {
        await fetchTransactions()
        setIsDialogOpen(false)
        resetForm()
        setError(null) // Clear error on success
      } else {
        const errorMessage = responseData.message || `Gagal menyimpan data (${response.status})`
        setError(errorMessage)
        console.error(" Backend error:", errorMessage)
      }
    } catch (error) {
      console.error(" Network error:", error)
      setError("Gagal terhubung ke server. Periksa koneksi internet Anda.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      idKategori: transaction.kategoriApbd.idKategori.toString(),
      idTahun: transaction.tahunAnggaran.idTahun.toString(),
      jumlah: transaction.jumlah.toString(),
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transaksi-apbd/${id}`, { method: "DELETE" })

      if (response.ok) {
        await fetchTransactions()
      } else {
        setError("Gagal menghapus data")
      }
    } catch (error) {
      console.error("Error deleting transaction:", error)
      setError("Gagal menghapus data")
    }
  }

  const resetForm = () => {
    setFormData({ idKategori: "", idTahun: "", jumlah: "" })
    setSelectedLevel2("")
    setEditingTransaction(null)
  }

  const filteredLevel3Categories = level3Categories.filter((cat) => {
    if (!selectedLevel2) return false
    return cat.idParent?.toString() === selectedLevel2
  })

  const groupedTransactions = React.useMemo(() => {
    const filtered = transactions.filter((transaction) =>
      transaction.kategoriApbd.namaKategori.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    // Create a map to store transactions by category
    const categoryMap = new Map<number, GroupedTransaction>()

    // Group transactions by category
    filtered.forEach((transaction) => {
      const categoryId = transaction.kategoriApbd.idKategori
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          category: {
            ...transaction.kategoriApbd,
            jenis: transaction.kategoriApbd.jenis || "Belanja",
          } as Category,
          transactions: [],
          total: 0,
        })
      }
      const group = categoryMap.get(categoryId)!
      group.transactions.push(transaction)
      group.total += transaction.jumlah
    })

    // Convert to array and create hierarchy
    const categoryGroups = Array.from(categoryMap.values())

    // Create hierarchy structure
    const level1Groups: GroupedTransaction[] = []
    const level2Map = new Map<number, GroupedTransaction>()
    const level3Map = new Map<number, GroupedTransaction>()

    categoryGroups.forEach((group: GroupedTransaction) => {
      const level = group.category.level

      if (level === 1) {
        level1Groups.push({
          ...group,
          children: [],
        })
      } else if (level === 2) {
        level2Map.set(group.category.idKategori, {
          ...group,
          children: [],
        })
      } else if (level === 3) {
        level3Map.set(group.category.idKategori, group)
      }
    })

    // Build hierarchy: Level 3 under Level 2, Level 2 under Level 1
    level3Map.forEach((level3Group: GroupedTransaction) => {
      const parentId = level3Group.category.idParent
      if (parentId && level2Map.has(parentId)) {
        level2Map.get(parentId)!.children!.push(level3Group)
      }
    })

    level2Map.forEach((level2Group: GroupedTransaction) => {
      const parentId = level2Group.category.idParent
      const level1Parent = level1Groups.find((l1: GroupedTransaction) => l1.category.idKategori === parentId)
      if (level1Parent) {
        level1Parent.children!.push(level2Group)
      } else {
        // If no Level 1 parent found, add as standalone Level 2
        level1Groups.push(level2Group)
      }
    })

    const sumTransactions = (txs: Transaction[] = []) => txs.reduce((s, t) => s + (Number(t.jumlah) || 0), 0)

    level2Map.forEach((level2Group: GroupedTransaction) => {
      if (level2Group.children && level2Group.children.length > 0) {
        const childTotal = level2Group.children.reduce((sum, l3) => {
          // gunakan total l3 jika ada, jika tidak jumlahkan transaksi l3
          const own =
            typeof l3.total === "number" && !isNaN(l3.total) ? Number(l3.total) : sumTransactions(l3.transactions)
          return sum + own
        }, 0)
        level2Group.total = childTotal
      }
    })

    level1Groups.forEach((level1Group: GroupedTransaction) => {
      if (level1Group.children && level1Group.children.length > 0) {
        const childTotal = level1Group.children.reduce((sum, l2) => sum + (Number(l2.total) || 0), 0)
        level1Group.total = childTotal
      }
    })

    // Sort Level 1 groups and their children
    level1Groups.sort((a: GroupedTransaction, b: GroupedTransaction) =>
      a.category.namaKategori.localeCompare(b.category.namaKategori),
    )

    level1Groups.forEach((level1Group: GroupedTransaction) => {
      level1Group.children!.sort((a: GroupedTransaction, b: GroupedTransaction) =>
        a.category.namaKategori.localeCompare(b.category.namaKategori),
      )
      level1Group.children!.forEach((level2Group: GroupedTransaction) => {
        if (level2Group.children) {
          level2Group.children.sort((a: GroupedTransaction, b: GroupedTransaction) =>
            a.category.namaKategori.localeCompare(b.category.namaKategori),
          )
        }
      })
    })

    return level1Groups
  }, [transactions, searchTerm])

  const totalBelanja = React.useMemo(() => {
    return groupedTransactions.reduce((sum: number, level1Group: GroupedTransaction) => {
      if (level1Group.category.level === 1) {
        return sum + level1Group.total
      }
      return sum
    }, 0)
  }, [groupedTransactions])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 lg:p-6 space-y-4 lg:space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 lg:p-6 space-y-4 lg:space-y-6">
      <div className="relative overflow-hidden rounded-xl lg:rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-4 lg:p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-balance">💳 Kelola Pembelanjaan</h1>
            <p className="text-blue-100 text-sm lg:text-lg text-pretty">
              Kelola data belanja daerah BPKAD Kabupaten Garut
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
                <span className="hidden sm:inline">Tambah Belanja</span>
                <span className="sm:hidden">Tambah</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTransaction ? "Edit Belanja" : "Tambah Belanja"}</DialogTitle>
                <DialogDescription>
                  {editingTransaction ? "Ubah data belanja yang sudah ada" : "Tambahkan data belanja baru"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  {error && (
                    <Alert variant="destructive" className="border-red-200 bg-red-50">
                      <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="level2">Kategori Level 2</Label>
                    <Select
                      value={selectedLevel2}
                      onValueChange={(value) => {
                        setSelectedLevel2(value)
                        // Reset level 3 selection when level 2 changes
                        setFormData({ ...formData, idKategori: "" })
                      }}
                      required
                      disabled={submitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori level 2" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {level2Categories.map((category) => (
                          <SelectItem key={category.idKategori} value={category.idKategori.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{category.namaKategori}</span>
                              {category.kode && (
                                <span className="text-xs text-muted-foreground">Kode: {category.kode}</span>
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
                      onValueChange={(value) => setFormData({ ...formData, idKategori: value })}
                      disabled={!selectedLevel2 || submitting}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={selectedLevel2 ? "Pilih kategori level 3" : "Pilih level 2 terlebih dahulu"}
                        />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {filteredLevel3Categories.map((category) => (
                          <SelectItem key={category.idKategori} value={category.idKategori.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{category.namaKategori}</span>
                              {category.kode && (
                                <span className="text-xs text-muted-foreground">Kode: {category.kode}</span>
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
                      onValueChange={(value) => setFormData({ ...formData, idTahun: value })}
                      required
                      disabled={submitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tahun" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {years.map((year) => (
                          <SelectItem key={year.idTahun} value={year.idTahun.toString()}>
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
                      onChange={(e) => setFormData({ ...formData, jumlah: e.target.value })}
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
                    {submitting ? "Menyimpan..." : editingTransaction ? "Simpan Perubahan" : "Tambah"}
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
                <CardTitle className="text-xs lg:text-lg font-medium text-emerald-100">Total Belanja</CardTitle>
                <div className="text-lg lg:text-2xl font-bold mt-1 truncate">{formatCurrency(totalBelanja)}</div>
              </div>
              <div className="p-2 lg:p-3 bg-white/20 rounded-full shrink-0">
                <CreditCard className="h-4 w-4 lg:h-6 lg:w-6" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600"></div>
          <CardHeader className="relative text-white pb-2 p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xs lg:text-lg font-medium text-blue-100">Total Transaksi</CardTitle>
                <div className="text-lg lg:text-2xl font-bold mt-1">{transactions.length}</div>
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
                <CardTitle className="text-xs lg:text-lg font-medium text-purple-100">Tahun Aktif</CardTitle>
                <div className="text-lg lg:text-2xl font-bold mt-1">{selectedYear}</div>
              </div>
              <div className="p-2 lg:p-3 bg-white/20 rounded-full shrink-0">
                <TrendingDown className="h-4 w-4 lg:h-6 lg:w-6" />
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
                placeholder="Cari kategori belanja..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border-blue-200 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg shrink-0">
                <Filter className="h-4 w-4 text-indigo-600" />
              </div>
              <Select value={selectedYear} onValueChange={setSelectedYear} disabled={submitting}>
                <SelectTrigger className="w-full lg:w-40 border-indigo-200 focus:border-indigo-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year.idTahun} value={year.tahun.toString()}>
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
          <CardTitle className="text-base lg:text-xl text-slate-800">📊 Data Pembelanjaan</CardTitle>
          <CardDescription className="text-slate-600 text-sm lg:text-base">
            Data semua transaksi belanja daerah tahun {selectedYear} (Semua Level)
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
                  <TableHead className="text-center font-semibold text-slate-700 min-w-[100px] lg:min-w-[120px] text-xs">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-3 bg-slate-100 rounded-full">
                          <FileText className="h-6 w-6 text-slate-400" />
                        </div>
                        <div className="text-slate-500 font-medium text-sm">Tidak ada data belanja</div>
                        <div className="text-xs text-slate-400">
                          Data belanja tidak tersedia untuk tahun {selectedYear}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  groupedTransactions.map((level1Group: GroupedTransaction) => (
                    <React.Fragment key={`level1-${level1Group.category.idKategori}`}>
                      {/* Level 1 */}
                      <TableRow className="bg-slate-50 border-b">
                        <TableCell className="font-bold text-slate-800 px-3 py-2 text-xs lg:text-sm sticky left-0 bg-slate-50">
                          <div className="truncate" title={level1Group.category.namaKategori}>
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
                          <div className="truncate" title={formatCurrency(level1Group.total)}>
                            {formatCurrency(level1Group.total)}
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

                      {/* Level 2 */}
                      {level1Group.children &&
                        level1Group.children.map((level2Child: GroupedTransaction) => (
                          <React.Fragment key={`level2-${level2Child.category.idKategori}`}>
                            <TableRow className="bg-white hover:bg-slate-50/50">
                              <TableCell className="font-semibold text-slate-700 px-3 py-2 sticky left-0 bg-white hover:bg-slate-50/50">
                                <div className="flex items-center">
                                  <span className="w-3 h-px bg-slate-300 mr-2 shrink-0"></span>
                                  <span className="text-xs truncate" title={level2Child.category.namaKategori}>
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
                                <div className="truncate" title={formatCurrency(level2Child.total)}>
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

                            {/* Level 3 per-transaksi */}
                            {level2Child.children &&
                              level2Child.children.map((level3Child: GroupedTransaction) =>
                                level3Child.transactions.map((transaction: Transaction) => (
                                  <TableRow
                                    key={`level3-${transaction.idTransaksi}`}
                                    className="bg-white hover:bg-slate-50/30"
                                  >
                                    <TableCell className="font-medium text-slate-600 px-3 py-2 sticky left-0 bg-white hover:bg-slate-50/30">
                                      <div className="flex items-center">
                                        <span className="w-6 h-px bg-slate-300 mr-2 shrink-0"></span>
                                        <span className="text-xs truncate" title={level3Child.category.namaKategori}>
                                          {level3Child.category.namaKategori}
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
                                      <div className="truncate" title={formatCurrency(transaction.jumlah)}>
                                        {formatCurrency(transaction.jumlah)}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="flex items-center justify-center gap-1 lg:gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleEdit(transaction)}
                                          className="border-blue-200 text-blue-600 hover:bg-blue-50 h-7 w-7 lg:h-8 lg:w-8 p-0"
                                        >
                                          <Edit className="h-3 w-3 lg:h-4 lg:w-4" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleDelete(transaction.idTransaksi)}
                                          className="border-red-200 text-red-600 hover:bg-red-50 h-7 w-7 lg:h-8 lg:w-8 p-0"
                                        >
                                          <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )),
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
  )
}
