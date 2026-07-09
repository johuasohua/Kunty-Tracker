"use client";

import { useState } from "react";
import { ChevronRight, PiggyBank } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/format";
import type { OffsetSeriesPoint } from "@/lib/aggregate";
import { OffsetHistorySheet } from "@/components/mortgage/OffsetHistorySheet";

export function OffsetPanel({
  series,
  onLedgerChanged,
  historyOpen: controlledOpen,
  onHistoryOpenChange,
}: {
  series: OffsetSeriesPoint[];
  onLedgerChanged?: () => void;
  historyOpen?: boolean;
  onHistoryOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const historyOpen = controlledOpen ?? internalOpen;
  const setHistoryOpen = onHistoryOpenChange ?? setInternalOpen;

  // Earliest period = where offset started
  const firstPeriod = series[0] ?? null;
  // Latest period = current state (derived live for open months)
  const lastPeriod = series[series.length - 1] ?? null;

  const openingBalance = firstPeriod?.openingBalance ?? 0;
  const closingBalance = lastPeriod?.closingBalance ?? 0;
  // Most recent period that actually had a deposit (not just a mortgage deduction)
  const lastDeposit = [...series].reverse().find((p) => p.depositAmount > 0) ?? null;

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
            value={lastDeposit?.depositAmount ?? 0}
            tone="green"
            note={lastDeposit?.transactionNote ?? undefined}
          />
        </div>
      </Card>

      <OffsetHistorySheet
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        series={series}
        onDeleted={onLedgerChanged}
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
