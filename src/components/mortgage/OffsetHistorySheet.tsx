"use client";

import { Sheet } from "@/components/ui/Sheet";
import { formatMoney } from "@/lib/format";
import type { MortgagePayment } from "@/lib/types";

export function OffsetHistorySheet({
  open,
  onClose,
  payments,
}: {
  open: boolean;
  onClose: () => void;
  payments: MortgagePayment[];
}) {
  // Only periods that actually touched the offset account, newest first.
  const rows = [...payments]
    .filter(
      (p) =>
        p.offset_opening_balance != null ||
        p.offset_closing_balance != null ||
        p.offset_transaction_amount != null
    )
    .reverse();

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
                  {new Date(p.payment_date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                {p.interest_saved != null && (
                  <span className="text-[12px] text-ios-blue">
                    Saved {formatMoney(p.interest_saved)}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-[13px]">
                <Cell label="Opening" value={p.offset_opening_balance} />
                <Cell label="Closing" value={p.offset_closing_balance} />
                <Cell
                  label="Deposit"
                  value={p.offset_transaction_amount}
                  tone="green"
                />
              </div>
              {p.offset_note && (
                <div className="mt-1.5 text-[12px] text-ios-label-secondary">
                  {p.offset_note}
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
