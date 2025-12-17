"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/api";
import { ChartContainer } from "@/components/ui/chart";

interface TrendData {
  tahun: string;
  pendapatan: number;
  belanja: number;
  surplus: number;
}

interface TrendChartProps {
  currentYear: number;
}

const chartConfig = {
  pendapatan: {
    label: "Pendapatan",
  },
  belanja: {
    label: "Belanja",
  },
  surplus: {
    label: "Surplus/Defisit",
  },
};

export function TrendChart({ currentYear }: TrendChartProps) {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard/comparison`);
        const response = await res.json();

        if (response.success && response.data) {
          const mappedData: TrendData[] = response.data.map((item: any) => ({
            tahun: String(item.tahun),
            pendapatan: Number(item.pendapatan ?? 0),
            belanja: Number(item.belanja ?? 0),
            surplus: Number(item.surplusDefisit ?? 0),
          }));
          setTrendData(mappedData);
          console.log(" Trend data loaded successfully:", mappedData);
        } else {
          console.error(" Failed to load trend data:", response);
        }
      } catch (err) {
        console.error(" Gagal ambil data trend:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendData();
  }, [currentYear]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-sm">Memuat data trend...</div>
        </div>
      </div>
    );
  }

  if (trendData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="text-sm">Tidak ada data trend tersedia</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white p-4 rounded-xl shadow">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={trendData}
            margin={{ top: 20, right: 40, left: 20, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

            <XAxis
              dataKey="tahun"
              type="category"
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: "#cbd5e1" }}
            />

            <YAxis
              yAxisId="left"
              tickFormatter={(value) =>
                `${(value / 1_000_000_000_000).toFixed(1)} T`
              }
              tick={{ fontSize: 11 }}
              axisLine={{ stroke: "#cbd5e1" }}
            />

            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) =>
                `${(value / 1_000_000_000_000).toFixed(1)} T`
              }
              tick={{ fontSize: 11 }}
              axisLine={{ stroke: "#cbd5e1" }}
            />

            {/* Custom Tooltip agar hover terlihat jelas */}
            <Tooltip
              cursor={{ stroke: "rgba(59, 130, 246, 0.2)", strokeWidth: 2 }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white border border-gray-300 rounded-lg shadow p-2 text-xs">
                      <p className="font-semibold text-gray-700 mb-1">
                        Tahun {label}
                      </p>
                      {payload.map((entry, index) => (
                        <p
                          key={index}
                          className="text-gray-600"
                          style={{ color: entry.color }}
                        >
                          {entry.name}: {formatCurrency(entry.value as number)}
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />

            <Legend wrapperStyle={{ paddingTop: "15px", fontSize: "12px" }} />

            <Line
              yAxisId="left"
              type="monotone"
              dataKey="pendapatan"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", stroke: "white", r: 3 }}
              connectNulls
              name="Pendapatan"
            />

            <Line
              yAxisId="left"
              type="monotone"
              dataKey="belanja"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: "#10b981", stroke: "white", r: 3 }}
              connectNulls
              name="Belanja"
            />

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="surplus"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={{ fill: "#f59e0b", stroke: "white", r: 3 }}
              connectNulls
              name="Surplus/Defisit"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
