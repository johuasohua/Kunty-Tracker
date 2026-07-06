import { clsx } from "clsx";
import { formatMoney } from "@/lib/format";

export function BudgetProgressBar({
  label,
  actual,
  budget,
  color,
}: {
  label: string;
  actual: number;
  budget: number;
  color: string;
}) {
  const overBudget = budget > 0 && actual > budget;
  const widthPct = budget > 0 ? Math.min((actual / budget) * 100, 100) : 0;
  const delta = Math.abs(actual - budget);
  const deltaPct = budget > 0 ? Math.round((delta / budget) * 100) : 0;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[13px]">
        <span className="text-ios-label">{label}</span>
        <span
          className={clsx(
            "font-medium",
            overBudget ? "text-ios-red" : "text-ios-label-secondary"
          )}
        >
          {formatMoney(actual)} / {formatMoney(budget)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-ios-fill">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${widthPct}%`,
            backgroundColor: overBudget ? "#FF3B30" : color,
          }}
        />
      </div>
      <div
        className={clsx(
          "mt-1 text-[12px]",
          overBudget ? "text-ios-red" : "text-ios-green"
        )}
      >
        {formatMoney(delta)} ({deltaPct}%) {overBudget ? "over" : "under"} budget
      </div>
    </div>
  );
}
