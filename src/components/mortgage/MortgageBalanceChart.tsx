"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { formatMoney, formatAxisTick } from "@/lib/format";
import type { MortgagePayment } from "@/lib/types";

export function MortgageBalanceChart({
  payments,
}: {
  payments: MortgagePayment[];
}) {
  const data = payments.map((p) => {
    const mortgageBalance = p.closing_principal;
    const offsetBalance = p.offset_closing_balance ?? 0;
    const effectiveDebt = Math.max(0, mortgageBalance - offsetBalance);

    return {
      name: new Date(p.payment_date).toLocaleDateString("en-GB", {
        month: "short",
        year: "2-digit",
      }),
      mortgage: mortgageBalance,
      offset: offsetBalance,
      effective: effectiveDebt,
    };
  });

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-[15px] font-semibold text-ios-label">
        Mortgage vs Offset Over Time
      </h2>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: -10, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ios-separator)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={70}
              tickFormatter={formatAxisTick}
            />
            <Tooltip
              formatter={(value) => formatMoney(Number(value))}
              contentStyle={{ borderRadius: 12, border: "none", fontSize: 13 }}
            />
            <Legend
              wrapperStyle={{ paddingTop: 16 }}
              iconType="line"
              height={40}
            />
            <Line
              type="monotone"
              dataKey="mortgage"
              stroke="#5856D6"
              strokeWidth={2}
              dot={false}
              name="Mortgage Balance"
            />
            <Line
              type="monotone"
              dataKey="offset"
              stroke="#30B0C7"
              strokeWidth={2}
              dot={false}
              name="Offset Balance"
            />
            <Line
              type="monotone"
              dataKey="effective"
              stroke="#FF9500"
              strokeWidth={2}
              dot={false}
              name="Effective Debt"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
