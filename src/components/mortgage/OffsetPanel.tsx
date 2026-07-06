"use client";

import { useState } from "react";
import { ChevronRight, PiggyBank } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/format";
import { OffsetHistorySheet } from "@/components/mortgage/OffsetHistorySheet";
import type { MortgagePayment } from "@/lib/types";

export function OffsetPanel({ payments }: { payments: MortgagePayment[] }) {
  const [historyOpen, setHistoryOpen] = useState(false);

  // Earliest period with an offset opening balance = where the offset started.
  const firstWithOpening = payments.find((p) => p.offset_opening_balance != null);
  // Latest period with an offset closing balance = current offset balance.
  const lastWithClosing = [...payments]
    .reverse()
    .find((p) => p.offset_closing_balance != null);
  // Most recent ad-hoc deposit/withdrawal into the offset account.
  const lastDeposit = [...payments]
    .reverse()
    .find((p) => p.offset_transaction_amount != null);

  const openingBalance = firstWithOpening?.offset_opening_balance ?? 0;
  const closingBalance = lastWithClosing?.offset_closing_balance ?? 0;

  return (
    <>
      <Card className="p-0">
        <button
          onClick={() => setHistoryOpen(true)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-ios-fill-secondary"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#30B0C7]/15 text-[#30B0C7]">
            <PiggyBank size={16} />
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-semibold text-ios-label">
              Offset Account
            </div>
            <div className="text-[13px] text-ios-label-secondary">
              Tap for full history
            </div>
          </div>
          <ChevronRight size={18} className="text-ios-label-tertiary" />
        </button>

        <div className="grid grid-cols-3 gap-3 border-t border-ios-separator px-4 py-3">
          <Stat label="Opening Balance" value={openingBalance} />
          <Stat label="Closing Balance" value={closingBalance} emphasize />
          <Stat
            label="Last Deposit"
            value={lastDeposit?.offset_transaction_amount ?? 0}
            tone="green"
            note={lastDeposit?.offset_note ?? undefined}
          />
        </div>
      </Card>

      <OffsetHistorySheet
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        payments={payments}
      />
    </>
  );
}

function Stat({
  label,
  value,
  tone,
  emphasize,
  note,
}: {
  label: string;
  value: number;
  tone?: "green";
  emphasize?: boolean;
  note?: string;
}) {
  return (
    <div>
      <div className="text-[11px] text-ios-label-secondary">{label}</div>
      <div
        className={
          "text-[15px] font-semibold " +
          (tone === "green"
            ? "text-ios-green"
            : emphasize
              ? "text-[#30B0C7]"
              : "text-ios-label")
        }
      >
        {formatMoney(value)}
      </div>
      {note && (
        <div className="mt-0.5 truncate text-[11px] text-ios-label-tertiary" title={note}>
          {note}
        </div>
      )}
    </div>
  );
}
