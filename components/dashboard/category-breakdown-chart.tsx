"use client";

import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/api";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";

interface CategoryData {
  kategori: string;
  jumlah: number;
  persentase: number;
}

interface CategoryBreakdownChartProps {
  data: CategoryData[];
  type: "pendapatan" | "belanja" | "pembelanjaan";
}

const COLORS = [
  "#3b82f6", // Bright Blue
  "#10b981", // Emerald Green
  "#f59e0b", // Golden Yellow
  "#ef4444", // Coral Red
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#14b8a6", // Teal
];

const chartConfig = {
  total: {
    label: "Total",
  },
};

/* ✅ FIXED — gabungkan kategori kecil & koreksi persentase jadi tepat 100% */
function aggregateSmallCategories(data: CategoryData[], threshold = 0.03) {
  if (!data || data.length === 0) return [];

  const total = data.reduce((sum, d) => sum + d.jumlah, 0);

  const small = data.filter((d) => d.jumlah / total < threshold);
  const big = data.filter((d) => d.jumlah / total >= threshold);

  if (small.length > 0) {
    const smallTotal = small.reduce((sum, d) => sum + d.jumlah, 0);

    big.push({
      kategori: "Lain-lain",
      jumlah: smallTotal,
      persentase: (smallTotal / total) * 100,
    });
  }

  let result = big.map((d) => ({
    ...d,
    raw: (d.jumlah / total) * 100,
  }));

  result = result.map((d) => ({
    ...d,
    persentase: parseFloat(d.raw.toFixed(1)),
  }));

  const sumRounded = result.reduce((s, d) => s + d.persentase, 0);
  const diff = parseFloat((100 - sumRounded).toFixed(1));

  if (Math.abs(diff) > 0.01 && result.length > 0) {
    let maxIndex = 0;
    for (let i = 1; i < result.length; i++) {
      if (result[i].raw > result[maxIndex].raw) {
        maxIndex = i;
      }
    }

    if (result[maxIndex]) {
      result[maxIndex].persentase = parseFloat(
        (result[maxIndex].persentase + diff).toFixed(1)
      );
    }
  }

  return result;
}

export function CategoryBreakdownChart({
  data,
  type,
}: CategoryBreakdownChartProps) {
  const processedData = aggregateSmallCategories(data);

  // ✅ FIXED → pakai persentase dari processedData
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    index,
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    index: number;
  }) => {
    const item = processedData[index];
    if (!item || item.persentase < 5) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.4;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={14}
        fontWeight={600}
        style={{
          textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
          filter: "drop-shadow(1px 1px 1px rgba(0,0,0,0.5))",
        }}
      >
        {item.persentase.toFixed(1)}%
      </text>
    );
  };

  if (!processedData || processedData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="text-sm sm:text-base font-medium">Tidak ada data</div>
          <div className="text-xs sm:text-sm">
            Data kategori{" "}
            {type === "belanja" || type === "pembelanjaan"
              ? "pembelanjaan"
              : type}{" "}
            tidak tersedia
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 10, right: 10, bottom: 50, left: 10 }}>
            <Pie
              data={processedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius="90%"
              innerRadius="35%"
              dataKey="jumlah"
              nameKey="kategori"
              stroke="white"
              strokeWidth={2}
              minAngle={3}
            >
              {processedData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  style={{
                    filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))",
                  }}
                />
              ))}
            </Pie>

            <ChartTooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                color: "#111827",
                padding: "8px 12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
              formatter={(value: any, name: string) => [
                typeof value === "number" ? formatCurrency(value) : value,
                name,
              ]}
            />

            <Legend
              verticalAlign="bottom"
              height={40}
              wrapperStyle={{
                paddingTop: "15px",
                fontSize: "11px",
                lineHeight: "1.2",
              }}
              formatter={(value) => {
                const item = processedData.find((d) => d.kategori === value);
                return (
                  <span className="text-xs font-medium text-muted-foreground">
                    {value} — {item ? `${item.persentase.toFixed(1)}%` : ""}
                  </span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
