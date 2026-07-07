"use client";

import { Sheet } from "@/components/ui/Sheet";
import { formatMoney } from "@/lib/format";
import type { OffsetAccountPeriod } from "@/lib/queries/offset";

export function OffsetHistorySheet({
  open,
  onClose,
  periods,
}: {
  open: boolean;
  onClose: () => void;
  periods: OffsetAccountPeriod[];
}) {
  // Newest first
  const rows = [...periods].reverse();

  return (
    <Sheet open={open} onClose={onClose} title="Offset History">
      {rows.length === 0 ? (
        <p className="py-6 text-center text-[14px] text-ios-label-secondary">
          No offset activity recorded yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-ios-separator px-3 py-2.5"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[14px] font-semibold text-ios-label">
                  {p.period_month}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[13px]">
                <Cell label="Opening" value={p.opening_balance} />
                <Cell label="Closing" value={p.closing_balance} />
                <Cell
                  label="Deposit"
                  value={p.transaction_amount}
                  tone="green"
                />
              </div>
              {p.transaction_note && (
                <div className="mt-1.5 text-[12px] text-ios-label-secondary">
                  {p.transaction_note}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}

function Cell({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | null;
  tone?: "green";
}) {
  return (
    <div>
      <div className="text-[11px] text-ios-label-tertiary">{label}</div>
      <div
        className={
          "font-medium " + (tone === "green" ? "text-ios-green" : "text-ios-label")
        }
      >
        {value != null ? formatMoney(value) : "—"}
      </div>
    </div>
  );
}
