"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { TrendingUp, ChevronRight } from "lucide-react";
import { GroupedSection } from "@/components/ui/Card";
import { formatMoney } from "@/lib/format";
import type { CategoryInsight } from "@/lib/aggregate";

export function InsightsList({
  insights,
  monthKey,
}: {
  insights: CategoryInsight[];
  monthKey: string;
}) {
  const router = useRouter();
  if (insights.length === 0) return null;

  const [from, to] = monthRangeFromKey(monthKey);

  return (
    <GroupedSection title="Insights">
      {insights.map((insight, i) => (
        <div
          key={insight.categoryId}
          className={
            "flex items-center gap-3 px-4 py-3 " +
            (i < insights.length - 1 ? "border-b border-ios-separator" : "")
          }
        >
          <button
            onClick={() =>
              router.push(
                `/transactions?category=${insight.categoryId}&from=${from}&to=${to}`
              )
            }
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ios-orange/15 text-ios-orange">
              <TrendingUp size={13} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] text-ios-label">
                <span className="font-medium">{insight.categoryName}</span> is{" "}
                {Math.round(insight.percentDelta * 100)}% above its average.
              </p>
              <p className="text-[12px] text-ios-label-secondary">
                {formatMoney(insight.currentTotal)} this month vs{" "}
                {formatMoney(insight.averageTotal)} average
              </p>
            </div>
            <ChevronRight size={16} className="shrink-0 text-ios-label-tertiary" />
          </button>
          <Link
            href="/budgets"
            className="shrink-0 text-[12px] font-medium text-ios-blue active:opacity-60"
          >
            Adjust budget
          </Link>
        </div>
      ))}
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
