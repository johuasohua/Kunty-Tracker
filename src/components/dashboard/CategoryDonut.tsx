"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { CategoryBreakdown } from "@/lib/aggregate";
import { formatMoney } from "@/lib/format";

export function CategoryDonut({
  breakdown,
  total,
}: {
  breakdown: CategoryBreakdown[];
  total: number;
}) {
  const data = breakdown
    .filter((b) => b.total > 0)
    .map((b) => ({
      name: b.category.name,
      value: b.total,
      color: b.category.color,
    }));

  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-[13px] text-ios-label-secondary">
        No expenses this month
      </div>
    );
  }

  return (
    <div className="relative h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="90%"
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatMoney(Number(value))}
            contentStyle={{
              borderRadius: 12,
              border: "none",
              fontSize: 13,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[12px] text-ios-label-secondary">Total Spend</span>
        <span className="text-[20px] font-bold text-ios-label">
          {formatMoney(total)}
        </span>
      </div>
    </div>
  );
}
