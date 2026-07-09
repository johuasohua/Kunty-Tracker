import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";

/**
 * Model-agnostic balance summary. Fed settled-cash figures (real bank
 * position) so Opening/Closing tie out to the Savings tab and the bank:
 * Expense here means cash that actually left the account (debit + offset +
 * card bills paid), not accrual spend-at-swipe.
 */
export interface BalancePoint {
  opening: number;
  income: number;
  expense: number;
  closing: number;
}

export function BalanceCard({ point }: { point: BalancePoint | null }) {
  if (!point) return null;

  return (
    <Card className="grid grid-cols-3 gap-4 p-4">
      <Stat label="Opening" value={point.opening} />
      <Stat label="Income" value={point.income} tone="green" />
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
      <Money
        value={value}
        stacked
        className={
          "font-semibold " +
          (emphasize ? "text-[17px] " : "text-[15px] ") +
          (tone === "green"
            ? "text-ios-green"
            : tone === "red"
              ? "text-ios-red"
              : emphasize
                ? "text-ios-blue"
                : "text-ios-label")
        }
      />
    </div>
  );
}
