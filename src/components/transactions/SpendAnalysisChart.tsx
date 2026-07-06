"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/Card";
import { Sheet } from "@/components/ui/Sheet";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { formatMoney } from "@/lib/format";
import type { CategoryMonthlySpend } from "@/lib/aggregate";
import { clsx } from "clsx";

export function SpendAnalysisChart({
  data,
}: {
  data: CategoryMonthlySpend[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryMonthlySpend | null>(
    null
  );

  if (data.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="p-4">
        <h2 className="mb-4 text-[15px] font-semibold text-ios-label">
          3-Month Spend Analysis
        </h2>

        {/* Grid of small multiples */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {data.map((category) => (
            <button
              key={category.categoryId}
              onClick={() => setSelectedCategory(category)}
              className="rounded-xl border border-ios-separator bg-ios-bg-secondary p-3 text-left transition-colors active:bg-ios-fill"
            >
              {/* Header with icon and name */}
              <div className="mb-2 flex items-center gap-2">
                <CategoryIcon
                  icon={category.categoryIcon}
                  color={category.categoryColor}
                  size={10}
                />
                <span className="flex-1 truncate text-[13px] font-medium text-ios-label">
                  {category.categoryName}
                </span>
              </div>

              {/* Mini chart */}
              <div className="h-[60px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={category.months} margin={{ left: -10, right: -10, top: 5, bottom: 0 }}>
                    <Bar
                      dataKey="amount"
                      fill={category.categoryColor}
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Footer with stats */}
              <div className="mt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-[11px] text-ios-label-secondary">Total</span>
                  <span className="text-[13px] font-semibold text-ios-label">
                    {formatMoney(category.total)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-ios-label-secondary">Avg</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[13px] font-medium text-ios-label">
                      {formatMoney(Math.round(category.average))}
                    </span>
                    <TrendIndicator trend={category.trend} />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <p className="mt-4 text-[11px] text-ios-label-tertiary">
          Tap any category to see detailed spending breakdown
        </p>
      </Card>

      {/* Detail sheet */}
      <SpendDetailSheet
        category={selectedCategory}
        onClose={() => setSelectedCategory(null)}
      />
    </>
  );
}

function TrendIndicator({ trend }: { trend: "up" | "down" | "flat" }) {
  return (
    <span
      className={clsx(
        "text-[11px] font-medium",
        trend === "up" && "text-ios-red",
        trend === "down" && "text-ios-green",
        trend === "flat" && "text-ios-label-secondary"
      )}
    >
      {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
    </span>
  );
}

function SpendDetailSheet({
  category,
  onClose,
}: {
  category: CategoryMonthlySpend | null;
  onClose: () => void;
}) {
  if (!category) return null;

  const monthLabels = ["Month 1", "Month 2", "Month 3"];

  return (
    <Sheet open={!!category} onClose={onClose} title={category.categoryName}>
      <div className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-ios-fill p-3">
            <div className="text-[11px] text-ios-label-secondary">Total</div>
            <div className="text-[18px] font-bold text-ios-label">
              {formatMoney(category.total)}
            </div>
          </div>
          <div className="rounded-lg bg-ios-fill p-3">
            <div className="text-[11px] text-ios-label-secondary">Average</div>
            <div className="text-[18px] font-bold text-ios-label">
              {formatMoney(Math.round(category.average))}
            </div>
          </div>
          <div className="rounded-lg bg-ios-fill p-3">
            <div className="text-[11px] text-ios-label-secondary">Trend</div>
            <div className="mt-1 flex items-center justify-center gap-1">
              <TrendIndicator trend={category.trend} />
              <span
                className={clsx(
                  "text-[14px] font-semibold",
                  category.trend === "up" && "text-ios-red",
                  category.trend === "down" && "text-ios-green",
                  category.trend === "flat" && "text-ios-label-secondary"
                )}
              >
                {category.trend === "up"
                  ? "Increasing"
                  : category.trend === "down"
                    ? "Decreasing"
                    : "Stable"}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed chart */}
        <div>
          <h3 className="mb-2 text-[13px] font-semibold text-ios-label">
            Monthly Breakdown
          </h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={category.months} margin={{ left: -10 }}>
                <XAxis
                  dataKey="key"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(k) => {
                    const [year, month] = k.split("-");
                    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
                      "en-US",
                      { month: "short", year: "2-digit" }
                    );
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                  tickFormatter={(v) => {
                    if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
                    return v.toString();
                  }}
                />
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
                <Bar
                  dataKey="amount"
                  fill={category.categoryColor}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Month-by-month details */}
        <div>
          <h3 className="mb-2 text-[13px] font-semibold text-ios-label">
            Month Details
          </h3>
          <div className="space-y-2">
            {category.months.map((month, idx) => (
              <div
                key={month.key}
                className="flex items-center justify-between rounded-lg bg-ios-fill p-3"
              >
                <span className="text-[13px] font-medium text-ios-label">
                  {monthLabels[idx]}
                </span>
                <span className="text-[14px] font-semibold text-ios-label">
                  {formatMoney(month.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Change stats */}
        <div>
          <h3 className="mb-2 text-[13px] font-semibold text-ios-label">
            Change
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-ios-fill p-3">
              <span className="text-[13px] text-ios-label-secondary">
                Month 1 → Month 2
              </span>
              <span
                className={clsx(
                  "text-[14px] font-semibold",
                  (category.months[1]?.amount ?? 0) >
                    (category.months[0]?.amount ?? 0)
                    ? "text-ios-red"
                    : "text-ios-green"
                )}
              >
                {formatMoney(
                  (category.months[1]?.amount ?? 0) -
                    (category.months[0]?.amount ?? 0)
                )}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-ios-fill p-3">
              <span className="text-[13px] text-ios-label-secondary">
                Month 2 → Month 3
              </span>
              <span
                className={clsx(
                  "text-[14px] font-semibold",
                  (category.months[2]?.amount ?? 0) >
                    (category.months[1]?.amount ?? 0)
                    ? "text-ios-red"
                    : "text-ios-green"
                )}
              >
                {formatMoney(
                  (category.months[2]?.amount ?? 0) -
                    (category.months[1]?.amount ?? 0)
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
