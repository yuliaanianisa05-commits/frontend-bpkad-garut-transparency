"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/api";
import { TrendingUp } from "lucide-react";

interface ComparisonData {
  name: string;
  current: number;
  previous: number;
  category: string;
}

interface ComparisonBarChartProps {
  jenis: "Pendapatan" | "Pembelanjaan" | "Belanja" | "Pembiayaan";
  currentYear: string;
}

export default function ComparisonBarChart({
  jenis,
  currentYear,
}: ComparisonBarChartProps) {
  const [data, setData] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComparisonData();
  }, [jenis, currentYear]);

  const fetchComparisonData = async () => {
    try {
      setLoading(true);
      const currentYearNum = Number.parseInt(currentYear);
      const previousYear = currentYearNum - 1;

      console.log(" ComparisonBarChart - Fetching data for:", {
        jenis,
        currentYear,
        previousYear,
      });

      const jenisQuery = jenis === "Pembelanjaan" ? "Belanja" : jenis;

      const [currentResponse, previousResponse] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/transaksi-apbd?tahun=${currentYear}&jenis=${jenisQuery}`
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/transaksi-apbd?tahun=${previousYear}&jenis=${jenisQuery}`
        ),
      ]);

      const currentData = currentResponse.ok
        ? await currentResponse.json()
        : { success: false };
      const previousData = previousResponse.ok
        ? await previousResponse.json()
        : { success: false };

      console.log(" ComparisonBarChart - API responses:", {
        currentData: {
          success: currentData.success,
          count: currentData.data?.transactions?.length || 0,
        },
        previousData: {
          success: previousData.success,
          count: previousData.data?.transactions?.length || 0,
        },
      });

      if (currentData.success || previousData.success) {
        const currentTransactions = currentData.success
          ? currentData.data.transactions || []
          : [];
        const previousTransactions = previousData.success
          ? previousData.data.transactions || []
          : [];

        console.log(" ComparisonBarChart - Transaction counts:", {
          current: currentTransactions.length,
          previous: previousTransactions.length,
        });

        const currentGrouped = groupByLevel2(currentTransactions);
        const previousGrouped = groupByLevel2(previousTransactions);

        console.log(" ComparisonBarChart - Grouped data:", {
          currentCategories: Object.keys(currentGrouped).length,
          previousCategories: Object.keys(previousGrouped).length,
          currentGrouped,
          previousGrouped,
        });

        const comparisonData: ComparisonData[] = [];
        const allCategories = new Set([
          ...Object.keys(currentGrouped),
          ...Object.keys(previousGrouped),
        ]);

        allCategories.forEach((categoryName) => {
          comparisonData.push({
            name:
              categoryName.length > 20
                ? categoryName.substring(0, 20) + "..."
                : categoryName,
            current: currentGrouped[categoryName] || 0,
            previous: previousGrouped[categoryName] || 0,
            category: categoryName,
          });
        });

        comparisonData.sort((a, b) => b.current - a.current);
        const finalData = comparisonData.slice(0, 8);

        console.log(" ComparisonBarChart - Final chart data:", finalData);
        setData(finalData);
      } else {
        console.log(
          " ComparisonBarChart - No successful API responses, setting empty data"
        );
        setData([]);
      }
    } catch (error) {
      console.error(
        " ComparisonBarChart - Error fetching comparison data:",
        error
      );
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const groupByLevel2 = (transactions: any[]) => {
    const grouped: { [key: string]: number } = {};

    transactions.forEach((transaction) => {
      const category = transaction.kategoriApbd;

      if (category && category.level === 2) {
        const name = category.namaKategori;
        grouped[name] =
          (grouped[name] || 0) + (Number(transaction.jumlah) || 0);
      }
    });

    return grouped;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">{data.category}</p>
          <p className="text-blue-600">
            {currentYear}:{" "}
            <span className="font-mono">{formatCurrency(data.current)}</span>
          </p>
          <p className="text-gray-600">
            {Number.parseInt(currentYear) - 1}:{" "}
            <span className="font-mono">{formatCurrency(data.previous)}</span>
          </p>
          {data.current > 0 && data.previous > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Perubahan:{" "}
              {(((data.current - data.previous) / data.previous) * 100).toFixed(
                1
              )}
              %
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 h-full">
      <CardHeader className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border-b p-3 lg:p-4">
        <CardTitle className="text-sm lg:text-lg text-slate-800 flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          Perbandingan {jenis}
        </CardTitle>
        <CardDescription className="text-slate-600 text-xs lg:text-sm">
          Perbandingan {jenis.toLowerCase()} tahun {currentYear} vs{" "}
          {Number.parseInt(currentYear) - 1} (Level 2)
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 lg:p-4">
        <div className="w-full">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data}
              margin={{ top: 10, right: 15, left: 10, bottom: 40 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
                opacity={0.6}
              />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={60}
                fontSize={10}
                stroke="#64748b"
                fontWeight={500}
              />
              <YAxis
                tickFormatter={(value) => `${(value / 1000000000000).toFixed(1)} T`}
                fontSize={10}
                stroke="#64748b"
                fontWeight={500}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: "30px", fontSize: "12px" }}
                iconType="rect"
              />
              <Bar
                dataKey="current"
                name={`Tahun ${currentYear}`}
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                strokeWidth={1}
                stroke="#2563eb"
              />
              <Bar
                dataKey="previous"
                name={`Tahun ${Number.parseInt(currentYear) - 1}`}
                fill="#94a3b8"
                radius={[4, 4, 0, 0]}
                strokeWidth={1}
                stroke="#64748b"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
