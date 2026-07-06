"use client";

import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown } from "lucide-react";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { formatMoney } from "@/lib/format";
import type { CategorySpendCard } from "@/lib/aggregate";
import { Sparkline } from "./Sparkline";

export function CategorySpendCards({
  cards,
  monthKey,
}: {
  cards: CategorySpendCard[];
  monthKey: string;
}) {
  const router = useRouter();
  if (cards.length === 0) return null;

  const [from, to] = monthRangeFromKey(monthKey);

  return (
    <div className="mb-6">
      <div className="mb-2 px-4 text-[13px] font-medium uppercase tracking-wide text-ios-label-secondary md:px-0">
        Spend by Category
      </div>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <button
            key={c.category.id}
            onClick={() =>
              router.push(
                `/transactions?category=${c.category.id}&from=${from}&to=${to}`
              )
            }
            className="flex flex-col gap-2 rounded-2xl bg-ios-bg-secondary p-3 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] active:bg-ios-fill"
          >
            <div className="flex items-center gap-2">
              <CategoryIcon icon={c.category.icon} color={c.category.color} size={12} />
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ios-label">
                {c.category.name}
              </span>
            </div>

            <Sparkline values={c.spark} color={c.category.color} />

            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-[15px] font-semibold text-ios-label">
                {formatMoney(c.current)}
              </span>
              <DeltaBadge delta={c.delta} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) {
    return <span className="shrink-0 text-[11px] text-ios-label-tertiary">new</span>;
  }
  const up = delta > 0.005;
  const down = delta < -0.005;
  return (
    <span
      className={
        "flex shrink-0 items-center gap-0.5 text-[11px] font-medium " +
        (up ? "text-ios-red" : down ? "text-ios-green" : "text-ios-label-secondary")
      }
    >
      {up ? <ArrowUp size={10} /> : down ? <ArrowDown size={10} /> : null}
      {Math.abs(delta * 100).toFixed(0)}%
    </span>
  );
}

function monthRangeFromKey(key: string): [string, string] {
  const [y, m] = key.split("-").map(Number);
  const from = `${key}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const to = `${key}-${String(lastDay).padStart(2, "0")}`;
  return [from, to];
}
