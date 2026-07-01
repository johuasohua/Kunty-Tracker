"use client";

import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { GroupedSection } from "@/components/ui/Card";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { formatMoney } from "@/lib/format";
import type { CategoryBreakdown } from "@/lib/aggregate";

export function CategoryMoMList({
  current,
  previous,
  monthKey,
}: {
  current: CategoryBreakdown[];
  previous: CategoryBreakdown[];
  monthKey: string;
}) {
  const router = useRouter();
  const prevByCategory = new Map(previous.map((b) => [b.category.id, b.total]));
  const withSpend = current.filter((b) => b.total !== 0);

  if (withSpend.length === 0) {
    return null;
  }

  return (
    <GroupedSection title="Spend by Category">
      {withSpend.map((b, i) => {
        const prevTotal = prevByCategory.get(b.category.id) ?? 0;
        const delta = prevTotal > 0 ? (b.total - prevTotal) / prevTotal : null;

        const [from, to] = monthRangeFromKey(monthKey);

        return (
          <button
            key={b.category.id}
            onClick={() =>
              router.push(
                `/transactions?category=${b.category.id}&from=${from}&to=${to}`
              )
            }
            className={
              "flex w-full items-center gap-3 px-4 py-3 text-left active:bg-ios-fill " +
              (i < withSpend.length - 1 ? "border-b border-ios-separator" : "")
            }
          >
            <CategoryIcon icon={b.category.icon} color={b.category.color} size={14} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] text-ios-label">
                {b.category.name}
              </div>
              {delta !== null && (
                <div
                  className={
                    "flex items-center gap-0.5 text-[12px] " +
                    (delta > 0.05
                      ? "text-ios-red"
                      : delta < -0.05
                        ? "text-ios-green"
                        : "text-ios-label-secondary")
                  }
                >
                  {delta > 0.05 ? (
                    <ArrowUp size={11} />
                  ) : delta < -0.05 ? (
                    <ArrowDown size={11} />
                  ) : (
                    <Minus size={11} />
                  )}
                  {Math.abs(delta * 100).toFixed(0)}% vs last month
                </div>
              )}
            </div>
            <div className="text-[15px] font-medium text-ios-label">
              {formatMoney(b.total)}
            </div>
          </button>
        );
      })}
    </GroupedSection>
  );
}

function monthRangeFromKey(key: string): [string, string] {
  const [y, m] = key.split("-").map(Number);
  const from = `${key}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const to = `${key}-${String(lastDay).padStart(2, "0")}`;
  return [from, to];
}
