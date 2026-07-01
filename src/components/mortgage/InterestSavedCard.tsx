import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/format";
import type { MortgagePayment } from "@/lib/types";

export function InterestSavedCard({
  payments,
}: {
  payments: MortgagePayment[];
}) {
  const totalSaved = payments.reduce((sum, p) => sum + (p.interest_saved ?? 0), 0);
  const totalPrincipalPaid = payments.reduce((sum, p) => sum + p.principal_amount, 0);
  const totalInterestPaid = payments.reduce((sum, p) => sum + p.interest_amount, 0);
  const latest = payments[payments.length - 1];

  return (
    <Card className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
      <Stat label="Current Balance" value={latest?.closing_principal ?? 0} />
      <Stat label="Principal Paid" value={totalPrincipalPaid} tone="green" />
      <Stat label="Interest Paid" value={totalInterestPaid} tone="red" />
      <Stat label="Interest Saved (Offset)" value={totalSaved} emphasize />
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
          "text-[16px] font-semibold " +
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
