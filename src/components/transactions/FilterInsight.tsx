"use client";

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/format";
import type { FilterSummary } from "@/lib/aggregate";

function TrendPill({ trend }: { trend: FilterSummary["trend"] }) {
  return (
    <span
      className={clsx(
        "text-[13px] font-semibold",
        trend === "up" && "text-ios-red",
        trend === "down" && "text-ios-green",
        trend === "flat" && "text-ios-label-secondary"
      )}
    >
      {trend === "up" ? "↑ rising" : trend === "down" ? "↓ falling" : "→ steady"}
    </span>
  );
}

function monthTick(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short" });
}

export function FilterInsight({
  summary,
  title,
  rangeLabel,
  accentColor = "#007AFF",
}: {
  summary: FilterSummary;
  title: string;
  rangeLabel: string;
  accentColor?: string;
}) {
  const multiMonth = summary.monthsInRange > 1;

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[14px] font-semibold text-ios-label">
            {title}
          </div>
          <div className="text-[12px] text-ios-label-secondary">{rangeLabel}</div>
        </div>
        {multiMonth && <TrendPill trend={summary.trend} />}
      </div>

      {/* Data points */}
      <div className="mb-3 grid grid-cols-3 gap-3">
        <div>
          <div className="text-[11px] text-ios-label-secondary">Total</div>
          <div className="text-[19px] font-bold text-ios-label">
            {formatMoney(summary.total)}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-ios-label-secondary">
            {multiMonth ? "Avg / month" : "This month"}
          </div>
          <div className="text-[19px] font-bold text-ios-label">
            {formatMoney(Math.round(summary.avgPerMonth))}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-ios-label-secondary">Transactions</div>
          <div className="text-[19px] font-bold text-ios-label">{summary.count}</div>
        </div>
      </div>

      {/* Per-month chart (only meaningful across multiple months) */}
      {multiMonth && (
        <div className="h-[80px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary.months} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
              <XAxis
                dataKey="key"
                tickFormatter={monthTick}
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <Tooltip
                formatter={(v) => formatMoney(Number(v))}
                labelFormatter={(k) => monthTick(String(k))}
                contentStyle={{ borderRadius: 12, border: "none", fontSize: 13 }}
              />
              <Bar dataKey="amount" fill={accentColor} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
