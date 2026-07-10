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
import type { OffsetSeriesPoint } from "@/lib/aggregate";

export function MortgageBalanceChart({
  payments,
  offsetSeries,
}: {
  payments: MortgagePayment[];
  offsetSeries?: OffsetSeriesPoint[];
}) {
  const offsetByMonth = new Map(
    (offsetSeries ?? []).map((p) => [p.periodMonth, p.closingBalance])
  );
  const mortgageByMonth = new Map(
    payments.map((p) => [
      new Date(p.payment_date).toISOString().slice(0, 7), // YYYY-MM
      p.closing_principal,
    ])
  );

  // Union of every month either source has activity for — a month with a
  // new offset deposit but no mortgage payment (or vice versa) still gets a
  // point, instead of the timeline being gated by whichever source is
  // sparser. Mortgage balance carries forward between payments since
  // principal only changes when one is actually logged.
  const months = Array.from(
    new Set([...offsetByMonth.keys(), ...mortgageByMonth.keys()])
  ).sort();

  // Running mortgage balance per month, computed immutably (no reassignment
  // across the scan) — carries forward from the prior month whenever that
  // month itself has no logged payment.
  const startingBalance = payments[0]?.opening_principal ?? 0;
  const runningBalances = months.reduce<number[]>((acc, month, i) => {
    const prevBalance = i === 0 ? startingBalance : acc[i - 1];
    return [...acc, mortgageByMonth.get(month) ?? prevBalance];
  }, []);

  const data = months.map((month, i) => {
    const mortgageBalance = runningBalances[i];
    const offsetBalance = offsetByMonth.get(month) ?? 0;
    const effectiveDebt = Math.max(0, mortgageBalance - offsetBalance);
    const [y, m] = month.split("-").map(Number);

    return {
      name: new Date(y, m - 1, 1).toLocaleDateString("en-GB", {
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
