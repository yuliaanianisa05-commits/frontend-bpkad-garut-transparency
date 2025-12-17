const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface TahunAnggaran {
  idTahun: number;
  tahun: number;
  nomorPerda: string;
  tanggalPenetapan: string;
}

export interface KategoriApbd {
  idKategori: number;
  idParent?: number;
  jenis: "Pendapatan" | "Belanja" | "Pembelanjaan" | "Pembiayaan"; // Added "Belanja" as valid jenis type
  namaKategori: string;
  level: number;
  children?: KategoriApbd[];
}

export interface TransaksiApbd {
  idTransaksi: number;
  idTahun: number;
  idKategori: number;
  jumlah: number;
  kodeRekening?: string; // Will be derived from kategori
  namaRekening?: string; // Will be derived from kategori
  anggaran?: number; // Will use jumlah as anggaran
  realisasi?: number; // Will use jumlah as realisasi
  kategori?: KategoriApbd;
  kategoriApbd?: KategoriApbd; // Backend uses this field name
  tahunAnggaran?: TahunAnggaran;
}

export interface RingkasanApbd {
  idRingkasan: number;
  idTahun: number;
  totalPendapatan: number;
  totalBelanja: number;
  surplusDefisit: number;
  pembiayaanNetto: number;
  sisaPembiayaan: number;
  tahunAnggaran?: TahunAnggaran;
}

export interface DashboardSummary {
  tahun: number;
  totalPendapatan: number;
  totalBelanja: number;
  surplusDefisit: number;
  pembiayaanNetto: number;
  sisaPembiayaan: number;
  kategoriBelanja: Array<{
    kategori: string;
    jumlah: number;
    persentase: number;
  }>;
  kategoriPendapatan: Array<{
    kategori: string;
    jumlah: number;
    persentase: number;
  }>;
}

export interface RevenueBreakdownItem {
  kode: string;
  nama: string;
  jumlah: number;
  level: number;
  isSubCategory?: boolean;
  isTotal?: boolean;
}

export interface ExpenditureBreakdownItem {
  kode: string;
  nama: string;
  jumlah: number;
  level: number;
  isSubCategory?: boolean;
  isTotal?: boolean;
}

export interface FinancingBreakdownItem {
  kode: string;
  nama: string;
  jumlah: number;
  level: number;
  isSubCategory?: boolean;
  isTotal?: boolean;
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      console.log(`[v0] 🌐 Making API request to: ${API_BASE_URL}${endpoint}`);
      console.log(
        `[v0] 🔧 API_BASE_URL from env: ${process.env.NEXT_PUBLIC_API_URL}`
      );

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("admin_token")
          : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      // Add options headers if they exist and are of correct type
      if (options?.headers) {
        const optionsHeaders = options.headers as Record<string, string>;
        Object.assign(headers, optionsHeaders);
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers,
        mode: "cors",
        credentials: "omit", // Changed from "include" to "omit" for better CORS compatibility
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      console.log(`[v0] 📡 Response status: ${response.status}`);
      console.log(
        `[v0] 📡 Response headers:`,
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;

        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          // If we can't parse JSON, use default error messages
          if (response.status === 404) {
            errorMessage = `Endpoint tidak ditemukan: ${endpoint}`;
          } else if (response.status === 500) {
            errorMessage = `Server error: Periksa koneksi backend`;
          } else if (response.status === 0 || !response.status) {
            errorMessage = `Tidak dapat terhubung ke server backend di ${API_BASE_URL}`;
          }
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log(`[v0] 📦 Response data:`, data);
      return data;
    } catch (error) {
      console.error("[v0] ❌ API request failed:", error);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          return {
            success: false,
            error:
              "❌ Request timeout - Backend server tidak merespons dalam 10 detik",
          };
        }

        if (
          error.message.includes("fetch") ||
          error.message.includes("NetworkError")
        ) {
          return {
            success: false,
            error:
              "❌ Tidak dapat terhubung ke server backend. Kemungkinan masalah:\n" +
              "1. Backend server tidak berjalan di " +
              API_BASE_URL +
              "\n" +
              "2. CORS tidak dikonfigurasi dengan benar\n" +
              "3. URL backend salah atau tidak dapat diakses\n" +
              "4. Firewall atau network blocking request",
          };
        }
      }

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Dashboard API
  async getDashboardSummary(
    tahun?: number
  ): Promise<ApiResponse<DashboardSummary>> {
    const healthResponse = await this.healthCheck();
    if (!healthResponse.success) {
      return {
        success: false,
        error:
          "❌ Backend server tidak dapat diakses. Pastikan server backend berjalan di " +
          API_BASE_URL,
      };
    }

    const endpoint = tahun
      ? `/api/dashboard/summary/${tahun}`
      : "/api/dashboard/summary";
    const response = await this.request<any>(endpoint);

    if (response.success && response.data) {
      const backendData = response.data;

      const normalizedData: DashboardSummary = {
        tahun: backendData.tahun || tahun || 2024,
        totalPendapatan:
          backendData.totalPendapatan || backendData.pendapatan || 0,
        totalBelanja:
          backendData.totalBelanja ||
          backendData.belanja ||
          backendData.totalPembelanjaan ||
          backendData.pembelanjaan ||
          0,
        surplusDefisit: backendData.surplusDefisit || 0,
        pembiayaanNetto: backendData.pembiayaanNetto || 0,
        sisaPembiayaan: backendData.sisaPembiayaan || 0,
        kategoriBelanja:
          backendData.kategoriBelanja || backendData.kategoriPembelanjaan || [],
        kategoriPendapatan: backendData.kategoriPendapatan || [],
      };

      console.log(`[v0] 🔄 Backend raw data:`, {
        totalBelanja: backendData.totalBelanja,
        belanja: backendData.belanja,
        totalPembelanjaan: backendData.totalPembelanjaan,
        pembelanjaan: backendData.pembelanjaan,
        kategoriBelanja: backendData.kategoriBelanja,
        kategoriPembelanjaan: backendData.kategoriPembelanjaan,
      });
      console.log(`[v0] 🔄 Normalized dashboard data:`, normalizedData);

      return {
        success: true,
        data: normalizedData,
      };
    }

    return response as ApiResponse<DashboardSummary>;
  }

  // Tahun Anggaran API
  async getTahunAnggaran(): Promise<ApiResponse<TahunAnggaran[]>> {
    return this.request<TahunAnggaran[]>("/api/tahun-anggaran");
  }

  // Kategori APBD API
  async getKategoriApbd(
    jenis?: string,
    level?: number
  ): Promise<ApiResponse<KategoriApbd[]>> {
    const params = new URLSearchParams();
    if (jenis) params.append("jenis", jenis);
    if (level) params.append("level", level.toString());

    const endpoint = `/api/kategori-apbd${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    return this.request<KategoriApbd[]>(endpoint);
  }

  async getKategoriTree(): Promise<ApiResponse<KategoriApbd[]>> {
    return this.request<KategoriApbd[]>("/api/kategori-apbd/tree");
  }

  // Transaksi APBD API
  async getTransaksiApbd(
    tahun?: number,
    kategoriId?: number,
    page = 1,
    limit = 1000 // Increased limit to get more data
  ): Promise<
    ApiResponse<{
      transactions: TransaksiApbd[];
      total: number;
      page: number;
      totalPages: number;
    }>
  > {
    const params = new URLSearchParams();
    if (tahun) params.append("tahun", tahun.toString());
    if (kategoriId) params.append("kategoriId", kategoriId.toString());
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    console.log(
      `[v0] 🔍 Fetching transactions with params:`,
      params.toString()
    );

    const response = await this.request(
      `/api/transaksi-apbd?${params.toString()}`
    );

    if (response.success && response.data) {
      const backendData = response.data as any;
      const transactions = backendData.transactions || [];

      console.log(`[v0] 📦 Backend returned:`, backendData);
      console.log(`[v0] 📋 Raw transactions:`, transactions.length);

      const transformedTransactions = transactions.map((transaction: any) => ({
        ...transaction,
        // Map database fields to frontend expected fields
        kodeRekening:
          transaction.kategoriApbd?.idKategori?.toString() ||
          transaction.idKategori?.toString(),
        namaRekening:
          transaction.kategoriApbd?.namaKategori || "Unknown Category",
        anggaran: Number(transaction.jumlah) || 0,
        realisasi: Number(transaction.jumlah) || 0,
        kategori: transaction.kategoriApbd, // Ensure kategori is available for filtering
        kategoriApbd: transaction.kategoriApbd
          ? {
              ...transaction.kategoriApbd,
              jenis:
                transaction.kategoriApbd.jenis === "Pembelanjaan"
                  ? "Belanja"
                  : transaction.kategoriApbd.jenis,
            }
          : undefined,
      }));

      console.log(
        `[v0] ✅ Transformed ${transformedTransactions.length} transactions`
      );

      return {
        success: true,
        data: {
          transactions: transformedTransactions,
          total: backendData.total || transformedTransactions.length,
          page: backendData.page || 1,
          totalPages: backendData.totalPages || 1,
        },
      };
    }

    return response as ApiResponse<{
      transactions: TransaksiApbd[];
      total: number;
      page: number;
      totalPages: number;
    }>;
  }

  async getTransaksiSummary(
    tahun?: number,
    jenis?: string
  ): Promise<
    ApiResponse<
      Array<{
        kategori: string;
        jumlah: number;
        persentase: number;
      }>
    >
  > {
    const params = new URLSearchParams();
    if (tahun) params.append("tahun", tahun.toString());
    if (jenis) params.append("jenis", jenis.toString());

    return this.request(`/api/transaksi-apbd/summary?${params.toString()}`);
  }

  // APBD API
  async getApbdCategories(
    jenis?: string
  ): Promise<ApiResponse<KategoriApbd[]>> {
    const endpoint = jenis
      ? `/api/apbd/categories/${jenis}`
      : "/api/apbd/categories";
    return this.request<KategoriApbd[]>(endpoint);
  }

  async getApbdTransactions(
    tahun: number,
    kategoriId?: number
  ): Promise<ApiResponse<TransaksiApbd[]>> {
    const endpoint = kategoriId
      ? `/api/apbd/transactions/${tahun}/${kategoriId}`
      : `/api/apbd/transactions/${tahun}`;
    return this.request<TransaksiApbd[]>(endpoint);
  }

  async getApbdSummary(
    tahun: number,
    jenis: string
  ): Promise<
    ApiResponse<{
      total: number;
      categories: Array<{
        kategori: string;
        jumlah: number;
        persentase: number;
      }>;
    }>
  > {
    return this.request(`/api/apbd/summary/${tahun}/${jenis}`);
  }

  // New methods for pendapatan, belanja, and pembiayaan data
  async getPendapatanData(tahun: number): Promise<
    ApiResponse<
      Array<{
        kategori: string;
        jumlah: number;
        persentase: number;
      }>
    >
  > {
    return this.request(`/api/apbd/summary/${tahun}/Pendapatan`);
  }

  async getBelanjaData(tahun: number): Promise<
    ApiResponse<
      Array<{
        kategori: string;
        jumlah: number;
        persentase: number;
      }>
    >
  > {
    const belanjaResponse = await this.request<
      Array<{
        kategori: string;
        jumlah: number;
        persentase: number;
      }>
    >(`/api/apbd/summary/${tahun}/Belanja`);

    if (belanjaResponse.success) {
      return belanjaResponse;
    }

    return this.request<
      Array<{
        kategori: string;
        jumlah: number;
        persentase: number;
      }>
    >(`/api/apbd/summary/${tahun}/Pembelanjaan`);
  }

  async getPembiayaanData(tahun: number): Promise<
    ApiResponse<
      Array<{
        kategori: string;
        jumlah: number;
        persentase: number;
      }>
    >
  > {
    return this.request(`/api/apbd/summary/${tahun}/Pembiayaan`);
  }

  // New method for trend data
  async getTrendData(jenis: string): Promise<
    ApiResponse<
      Array<{
        periode: string;
        [key: string]: string | number;
      }>
    >
  > {
    return this.request(`/api/transaksi-apbd/summary?jenis=${jenis}`);
  }

  async getRevenueBreakdown(
    tahun: number
  ): Promise<ApiResponse<RevenueBreakdownItem[]>> {
    return this.request<RevenueBreakdownItem[]>(
      `/api/apbd/revenue-breakdown/${tahun}`
    );
  }

  async getExpenditureBreakdown(
    tahun: number
  ): Promise<ApiResponse<ExpenditureBreakdownItem[]>> {
    return this.request<ExpenditureBreakdownItem[]>(
      `/api/apbd/expenditure-breakdown/${tahun}`
    );
  }

  async getFinancingBreakdown(
    tahun: number
  ): Promise<ApiResponse<FinancingBreakdownItem[]>> {
    return this.request<FinancingBreakdownItem[]>(
      `/api/apbd/financing-breakdown/${tahun}`
    );
  }

  async getPendapatanBreakdown(tahun: number): Promise<RevenueBreakdownItem[]> {
    const response = await this.getRevenueBreakdown(tahun);
    if (response.success && response.data) {
      return response.data;
    }
    return [];
  }

  async getBelanjaBreakdown(
    tahun: number
  ): Promise<ExpenditureBreakdownItem[]> {
    const response = await this.getExpenditureBreakdown(tahun);
    if (response.success && response.data) {
      return response.data;
    }
    return [];
  }

  async getPembiayaanBreakdown(
    tahun: number
  ): Promise<FinancingBreakdownItem[]> {
    const response = await this.getFinancingBreakdown(tahun);
    if (response.success && response.data) {
      return response.data;
    }
    return [];
  }

  // Create new APBD transaction (only level 3 allowed)
  async createTransaksiApbd(data: {
    idTahun: number;
    idKategori: number;
    jumlah: number;
  }): Promise<ApiResponse<TransaksiApbd>> {
    return this.request<TransaksiApbd>("/api/apbd/transaksi", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Update APBD transaction (only level 3 allowed)
  async updateTransaksiApbd(
    id: number,
    data: {
      idTahun?: number;
      idKategori?: number;
      jumlah?: number;
    }
  ): Promise<ApiResponse<TransaksiApbd>> {
    return this.request<TransaksiApbd>(`/api/apbd/transaksi/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Delete APBD transaction
  async deleteTransaksiApbd(
    id: number
  ): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/api/apbd/transaksi/${id}`, {
      method: "DELETE",
    });
  }

  // Get categories by level (for form filtering)
  async getKategoriByLevel(
    jenis: string,
    level: number
  ): Promise<ApiResponse<KategoriApbd[]>> {
    return this.request<KategoriApbd[]>(
      `/api/kategori-apbd?jenis=${jenis}&level=${level}`
    );
  }

  // Calculate level 2 totals automatically
  async calculateLevel2(
    tahun: number,
    jenis: string
  ): Promise<ApiResponse<{ message: string; updated: number }>> {
    return this.request<{ message: string; updated: number }>(
      `/api/apbd/calculate-level2/${tahun}/${jenis}`,
      {
        method: "POST",
      }
    );
  }

  // Update APBD summary (ringkasan)
  async updateRingkasanApbd(
    tahun: number
  ): Promise<ApiResponse<RingkasanApbd>> {
    return this.request<RingkasanApbd>(`/api/apbd/update-ringkasan/${tahun}`, {
      method: "POST",
    });
  }

  // Get APBD summary/ringkasan
  async getRingkasanApbd(tahun: number): Promise<ApiResponse<RingkasanApbd>> {
    return this.request<RingkasanApbd>(`/api/apbd/ringkasan/${tahun}`);
  }

  // Get hierarchical APBD data (level 2 and level 3)
  async getApbdHierarchy(
    tahun: number,
    jenis: string
  ): Promise<
    ApiResponse<{
      level2: Array<{
        kategori: KategoriApbd;
        total: number;
        level3Items: Array<{
          kategori: KategoriApbd;
          transaksi: TransaksiApbd[];
          total: number;
        }>;
      }>;
      grandTotal: number;
    }>
  > {
    return this.request(`/api/apbd/hierarchy/${tahun}/${jenis}`);
  }

  // Get only level 3 categories for input forms
  async getLevel3Categories(
    jenis: string
  ): Promise<ApiResponse<KategoriApbd[]>> {
    return this.request<KategoriApbd[]>(
      `/api/kategori-apbd?jenis=${jenis}&level=3`
    );
  }

  // Bulk operations for efficiency
  async bulkCreateTransaksi(
    transactions: Array<{
      idTahun: number;
      idKategori: number;
      jumlah: number;
    }>
  ): Promise<ApiResponse<{ created: number; message: string }>> {
    return this.request<{ created: number; message: string }>(
      "/api/apbd/transaksi/bulk",
      {
        method: "POST",
        body: JSON.stringify({ transactions }),
      }
    );
  }

  // Get APBD statistics for dashboard cards
  async getApbdStats(tahun: number): Promise<
    ApiResponse<{
      totalPendapatan: number;
      totalBelanja: number;
      totalPembiayaan: number;
      surplusDefisit: number;
      jumlahTransaksi: number;
      kategoriTerbesar: {
        pendapatan: { nama: string; jumlah: number };
        belanja: { nama: string; jumlah: number };
        pembiayaan: { nama: string; jumlah: number };
      };
    }>
  > {
    return this.request(`/api/apbd/stats/${tahun}`);
  }

  async healthCheck(): Promise<
    ApiResponse<{ status: string; message: string }>
  > {
    try {
      console.log(
        `[v0] 🏥 Checking backend health using tahun-anggaran endpoint`
      );
      const response = await this.request<TahunAnggaran[]>(
        "/api/tahun-anggaran"
      );

      if (response.success) {
        return {
          success: true,
          data: { status: "healthy", message: "Backend is responding" },
        };
      } else {
        return {
          success: false,
          error: response.error || "Backend health check failed",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: "Backend health check failed",
      };
    }
  }

  async loginAdmin(
    username: string,
    password: string
  ): Promise<
    ApiResponse<{
      user: {
        idAdmin: number;
        username: string;
        role: string;
      };
      token: string;
    }>
  > {
    return this.request<{
      user: {
        idAdmin: number;
        username: string;
        role: string;
      };
      token: string;
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  }

  async verifyToken(): Promise<
    ApiResponse<{
      user: {
        idAdmin: number;
        username: string;
        role: string;
      };
    }>
  > {
    return this.request<{
      user: {
        idAdmin: number;
        username: string;
        role: string;
      };
    }>("/api/auth/verify");
  }

  async logoutAdmin(): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>("/api/auth/logout", {
      method: "POST",
    });
  }
}

export const apiClient = new ApiClient();

// Utility functions
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1000000000000) {
    return `Rp ${(amount / 1000000000000).toFixed(1)}T`;
  } else if (amount >= 1000000000) {
    return `Rp ${(amount / 1000000000).toFixed(1)}M`;
  } else if (amount >= 1000000) {
    return `Rp ${(amount / 1000000).toFixed(1)}Jt`;
  } else if (amount >= 1000) {
    return `Rp ${(amount / 1000).toFixed(1)}Rb`;
  }
  return formatCurrency(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("id-ID").format(num);
}

export function calculatePercentage(part: number, total: number): number {
  return total > 0 ? (part / total) * 100 : 0;
}
