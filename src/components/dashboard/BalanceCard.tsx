import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/format";
import type { MonthPoint } from "@/lib/aggregate";

export function BalanceCard({ point }: { point: MonthPoint | null }) {
  if (!point) return null;

  return (
    <Card className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
      <Stat label="Opening" value={point.opening} />
      <Stat label="Income" value={point.totalIncome} tone="green" />
      <Stat label="Expense" value={point.totalExpense} tone="red" />
      <Stat label="Closing" value={point.closing} emphasize />
    </Card>
  );
}

function Stat({
  label,
  value,
  tone,
  emphasize,
}: {
  label: string;
  value: number;
  tone?: "green" | "red";
  emphasize?: boolean;
}) {
  return (
    <div>
      <div className="text-[12px] text-ios-label-secondary">{label}</div>
      <div
        className={
          "text-[17px] font-semibold " +
          (tone === "green"
            ? "text-ios-green"
            : tone === "red"
              ? "text-ios-red"
              : emphasize
                ? "text-ios-blue"
                : "text-ios-label")
        }
      >
        {formatMoney(value)}
      </div>
    </div>
  );
}
