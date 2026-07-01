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
import { formatMoney } from "@/lib/format";
import type { MortgagePayment } from "@/lib/types";

export function MortgageBalanceChart({
  payments,
}: {
  payments: MortgagePayment[];
}) {
  const data = payments.map((p) => ({
    name: new Date(p.payment_date).toLocaleDateString("en-GB", {
      month: "short",
      year: "2-digit",
    }),
    balance: p.closing_principal,
  }));

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-[15px] font-semibold text-ios-label">
        Mortgage Balance Over Time
      </h2>
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ios-separator)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={70}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value) => formatMoney(Number(value))}
              contentStyle={{ borderRadius: 12, border: "none", fontSize: 13 }}
            />
            <Line type="monotone" dataKey="balance" stroke="#5856D6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
