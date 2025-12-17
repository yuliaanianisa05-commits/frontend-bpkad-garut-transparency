"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
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

interface CompositionData {
  name: string;
  value: number;
  percentage: number;
  color: string;
  fullName: string;
}

interface CompositionPieChartProps {
  jenis: "Pendapatan" | "Pembelanjaan" | "Belanja" | "Pembiayaan";
  currentYear: string;
}

const COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#84cc16",
  "#ec4899",
  "#6366f1",
];

export default function CompositionPieChart({
  jenis,
  currentYear,
}: CompositionPieChartProps) {
  const [data, setData] = useState<CompositionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchCompositionData();
  }, [jenis, currentYear]);

  const fetchCompositionData = async () => {
    try {
      setLoading(true);

      console.log(" CompositionPieChart - Fetching data for:", {
        jenis,
        currentYear,
      });

      const jenisQuery = jenis === "Pembelanjaan" ? "Belanja" : jenis;

      console.log(" CompositionPieChart - Using jenis query:", jenisQuery);

      let response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transaksi-apbd/composition?tahun=${currentYear}&jenis=${jenisQuery}&level=2`
      );

      console.log(" CompositionPieChart - Composition API response:", {
        ok: response.ok,
        status: response.status,
        url: response.url,
      });

      if (response.ok) {
        const result = await response.json();
        console.log(
          " CompositionPieChart - Composition API result:",
          result
        );

        if (
          result.success &&
          result.data &&
          result.data.categories &&
          result.data.categories.length > 0
        ) {
          const categories = result.data.categories;
          const totalAmount = result.data.total || 0;
          setTotal(totalAmount);

          const chartData: CompositionData[] = categories
            .map((category: any, index: number) => ({
              name:
                category.name.length > 15
                  ? category.name.substring(0, 15) + "..."
                  : category.name,
              value: category.value || 0,
              percentage: Number(category.percentage) || 0,
              color: COLORS[index % COLORS.length],
              fullName: category.name,
            }))
            .slice(0, 8);

          console.log(
            " CompositionPieChart - Chart data from composition endpoint:",
            {
              totalAmount,
              chartData,
            }
          );
          setData(chartData);
          return;
        }
      }

      console.log(
        " CompositionPieChart - Falling back to general transaction endpoint"
      );
      response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transaksi-apbd?tahun=${currentYear}&jenis=${jenisQuery}`
      );

      console.log(" CompositionPieChart - General API response:", {
        ok: response.ok,
        status: response.status,
        url: response.url,
      });

      if (response.ok) {
        const result = await response.json();

        console.log(" CompositionPieChart - General API result:", {
          success: result.success,
          transactionCount: result.data?.transactions?.length || 0,
        });

        if (result.success && result.data && result.data.transactions) {
          const transactions = result.data.transactions || [];

          const grouped: { [key: string]: number } = {};

          transactions.forEach((transaction: any) => {
            const category = transaction.kategoriApbd;

            if (category && category.level === 2) {
              const name = category.namaKategori;
              grouped[name] =
                (grouped[name] || 0) + (Number(transaction.jumlah) || 0);
            }
          });

          console.log(
            " CompositionPieChart - Grouped by level 2:",
            grouped
          );

          const totalAmount = Object.values(grouped).reduce(
            (sum, value) => sum + value,
            0
          );
          setTotal(totalAmount);

          const chartData: CompositionData[] = Object.entries(grouped)
            .map(([name, value], index) => ({
              name: name.length > 15 ? name.substring(0, 15) + "..." : name,
              value,
              percentage: totalAmount > 0 ? (value / totalAmount) * 100 : 0,
              color: COLORS[index % COLORS.length],
              fullName: name,
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);

          console.log(
            " CompositionPieChart - Final chart data from fallback:",
            {
              totalAmount,
              chartData,
            }
          );
          setData(chartData);
        } else {
          console.log(
            " CompositionPieChart - No valid data in API response"
          );
          setData([]);
          setTotal(0);
        }
      } else {
        console.log(" CompositionPieChart - All API requests failed");
        setData([]);
        setTotal(0);
      }
    } catch (error) {
      console.error(
        " CompositionPieChart - Error fetching composition data:",
        error
      );
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">{data.fullName}</p>
          <p className="text-blue-600">
            Jumlah:{" "}
            <span className="font-mono">{formatCurrency(data.value)}</span>
          </p>
          <p className="text-gray-600">
            Persentase:{" "}
            <span className="font-semibold">{data.percentage.toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percentage,
  }: any) => {
    if (percentage < 5) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${percentage.toFixed(1)}%`}
      </text>
    );
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
      <CardHeader className="bg-gradient-to-r from-slate-50 via-purple-50 to-pink-50 border-b p-3 lg:p-4">
        <CardTitle className="text-sm lg:text-lg text-slate-800 flex items-center gap-2">
          <div className="p-1.5 bg-purple-100 rounded-lg">
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </div>
          Komposisi {jenis}
        </CardTitle>
        <CardDescription className="text-slate-600 text-xs lg:text-sm">
          Komposisi {jenis.toLowerCase()} tahun {currentYear} berdasarkan
          kategori level 2
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 lg:p-4">
        <div className="flex flex-col xl:flex-row items-center gap-4">
          <div className="w-full xl:w-3/5">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomLabel}
                  outerRadius={120}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#ffffff"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full xl:w-2/5 space-y-2">
            <div className="text-center xl:text-left p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <p className="text-xs text-gray-600 font-medium">Total {jenis}</p>
              <p className="text-sm lg:text-lg font-bold text-gray-800 mt-1">
                {formatCurrency(total)}
              </p>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {data.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 border border-gray-100"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-semibold text-gray-800 truncate"
                      title={item.fullName}
                    >
                      {item.fullName}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded-full">
                        {item.percentage.toFixed(1)}%
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
