"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { formatMoney, monthLabelShort } from "@/lib/format";
import type { MonthPoint } from "@/lib/aggregate";

export function AnnualTrendChart({ points }: { points: MonthPoint[] }) {
  const data = points.map((p) => ({
    name: monthLabelShort(p.date),
    expense: p.totalExpense,
    income: p.totalIncome,
  }));

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-[15px] font-semibold text-ios-label">
        Income vs. Expense
      </h2>
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ios-separator)" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={60} />
            <Tooltip
              formatter={(value) => formatMoney(Number(value))}
              contentStyle={{ borderRadius: 12, border: "none", fontSize: 13 }}
            />
            <Line type="monotone" dataKey="income" stroke="#34C759" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="expense" stroke="#FF3B30" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
