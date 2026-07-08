import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/format";

/**
 * Month-end reconciliation strip. The dashboard closing is an *accrual* cash
 * figure — every credit-card purchase is deducted at swipe time, so it already
 * sits net of card debt. The Savings tab tracks *settled* cash (card spend only
 * leaves when the bill is paid). The two therefore relate by a fixed identity:
 *
 *   dashboard cash  +  outstanding cards owed  =  savings closing
 *
 * This card surfaces that identity so the numbers can be checked each month.
 */
export function ReconciliationCard({
  cash,
  cardsOwed,
  savingsClosing,
}: {
  cash: number;
  cardsOwed: number;
  savingsClosing: number | null;
}) {
  const trueCash = cash + cardsOwed;
  const reconciles =
    savingsClosing != null && Math.abs(trueCash - savingsClosing) < 1;
  const diff = savingsClosing != null ? trueCash - savingsClosing : null;

  return (
    <Card className="p-4">
      <div className="mb-3 text-[13px] font-medium uppercase tracking-wide text-ios-label-secondary">
        Month-end reconciliation
      </div>

      <div className="flex flex-col gap-2 text-[14px]">
        <Row label="Cash balance" value={cash} />
        <Row label="+ Credit cards owed" value={cardsOwed} tone="red" />
        <div className="my-1 border-t border-ios-separator" />
        <Row label="= True cash" value={trueCash} emphasize />

        {savingsClosing != null ? (
          <>
            <Row label="Savings closing" value={savingsClosing} muted />
            <div
              className={
                "mt-1 rounded-lg px-3 py-2 text-[12px] " +
                (reconciles
                  ? "bg-ios-green/10 text-ios-green"
                  : "bg-ios-orange/10 text-ios-orange")
              }
            >
              {reconciles
                ? "✓ Reconciles — cash plus cards owed matches your savings balance."
                : `Off by ${formatMoney(Math.abs(diff ?? 0))} — this closes once every month’s transactions and card payments are logged.`}
            </div>
          </>
        ) : (
          <div className="mt-1 text-[12px] text-ios-label-tertiary">
            No savings figure for this month yet.
          </div>
        )}
      </div>
    </Card>
  );
}

function Row({
  label,
  value,
  tone,
  emphasize,
  muted,
}: {
  label: string;
  value: number;
  tone?: "red";
  emphasize?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={
          emphasize
            ? "font-semibold text-ios-label"
            : muted
              ? "text-ios-label-secondary"
              : "text-ios-label"
        }
      >
        {label}
      </span>
      <span
        className={
          "tabular-nums " +
          (emphasize
            ? "text-[15px] font-semibold text-ios-blue"
            : tone === "red"
              ? "text-ios-red"
              : muted
                ? "text-ios-label-secondary"
                : "text-ios-label")
        }
      >
        {formatMoney(value)}
      </span>
    </div>
  );
}
