"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency, type DashboardSummary } from "@/lib/api";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";

interface BudgetOverviewChartProps {
  data: DashboardSummary;
}

const chartConfig = {
  pendapatan: {
    label: "Pendapatan",
  },
  belanja: {
    label: "Pembelanjaan",
  },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 md:p-3 min-w-[160px] md:min-w-[200px] mx-2 md:mx-3">
        <p className="font-semibold text-gray-900 mb-1 md:mb-2 text-xs md:text-sm">{`${label} ${
          payload[0]?.payload?.tahun || ""
        }`}</p>
        {payload.map((entry: any, index: number) => (
          <div
            key={index}
            className="flex items-center justify-between gap-2 md:gap-4 mb-1"
          >
            <div className="flex items-center gap-1 md:gap-2">
              <div
                className="w-2 h-2 md:w-3 md:h-3 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs md:text-sm text-gray-600">
                {entry.name}:
              </span>
            </div>
            <span className="font-mono font-medium text-xs md:text-sm text-gray-900">
              <span className="hidden sm:inline">
                {formatCurrency(entry.value)}
              </span>
              <span className="sm:hidden">
                {formatCurrency(entry.value).replace("Rp ", "Rp")}
              </span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function BudgetOverviewChart({ data }: BudgetOverviewChartProps) {
  if (!data || (data.totalPendapatan === 0 && data.totalBelanja === 0)) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="text-sm sm:text-base font-medium">Tidak ada data</div>
          <div className="text-xs sm:text-sm">
            Data ringkasan anggaran tidak tersedia
          </div>
        </div>
      </div>
    );
  }

  console.log(" BudgetOverviewChart data:", {
    totalPendapatan: data.totalPendapatan,
    totalBelanja: data.totalBelanja,
    tahun: data.tahun,
  });

  const chartData = [
    {
      name: "Anggaran",
      pendapatan: data.totalPendapatan || 0,
      belanja: data.totalBelanja || 0,
      tahun: data.tahun,
    },
  ];

  return (
    <div className="w-full h-full">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 10,
              right: 10,
              left: 10,
              bottom: 20,
              ...(window.innerWidth >= 768 && {
                top: 20,
                right: 20,
                left: 20,
                bottom: 40,
              }),
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: window.innerWidth >= 768 ? 12 : 10 }}
              axisLine={{ stroke: "#cbd5e1" }}
            />
            <YAxis
              tickFormatter={(value) =>
                `${(value / 1000000000000).toFixed(1)} T`
              }
              tick={{ fontSize: window.innerWidth >= 768 ? 11 : 9 }}
              axisLine={{ stroke: "#cbd5e1" }}
            />
            <ChartTooltip content={<CustomTooltip />} cursor={false} />

            <Legend
              wrapperStyle={{
                paddingTop: window.innerWidth >= 768 ? "10px" : "5px",
                fontSize: window.innerWidth >= 768 ? "12px" : "10px",
              }}
            />
            <Bar
              dataKey="pendapatan"
              fill="#3b82f6"
              radius={[6, 6, 0, 0]}
              name="Pendapatan"
            />
            <Bar
              dataKey="belanja"
              fill="#10b981"
              radius={[6, 6, 0, 0]}
              name="Pembelanjaan"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
