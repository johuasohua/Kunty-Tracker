"use client";

import { useRouter } from "next/navigation";
import { GroupedSection } from "@/components/ui/Card";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { formatMoney } from "@/lib/format";
import type { AnnualCategoryTotal } from "@/lib/aggregate";

export function AnnualCategoryList({
  totals,
  year,
}: {
  totals: AnnualCategoryTotal[];
  year: number;
}) {
  const router = useRouter();
  const withSpend = totals.filter((t) => t.total !== 0);
  if (withSpend.length === 0) return null;

  const maxTotal = Math.max(...withSpend.map((t) => t.total));

  return (
    <GroupedSection title={`Total Spend by Category — ${year}`}>
      {withSpend.map((t, i) => (
        <button
          key={t.category.id}
          onClick={() =>
            router.push(
              `/transactions?category=${t.category.id}&from=${year}-01-01&to=${year}-12-31`
            )
          }
          className={
            "flex w-full items-center gap-3 px-4 py-3 text-left active:bg-ios-fill " +
            (i < withSpend.length - 1 ? "border-b border-ios-separator" : "")
          }
        >
          <CategoryIcon icon={t.category.icon} color={t.category.color} size={14} />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between">
              <span className="truncate text-[14px] text-ios-label">
                {t.category.name}
              </span>
              <span className="text-[14px] font-medium text-ios-label">
                {formatMoney(t.total)}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-ios-fill">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(t.total / maxTotal) * 100}%`,
                  backgroundColor: t.category.color,
                }}
              />
            </div>
          </div>
        </button>
      ))}
    </GroupedSection>
  );
}
