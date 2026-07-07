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
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-ios-separator">
                <th className="px-3 py-2.5 text-left font-semibold text-ios-label-secondary">
                  Month
                </th>
                <th className="px-3 py-2.5 text-right font-semibold text-ios-label-secondary">
                  Opening
                </th>
                <th className="px-3 py-2.5 text-right font-semibold text-ios-label-secondary">
                  Closing
                </th>
                <th className="px-3 py-2.5 text-right font-semibold text-ios-label-secondary">
                  Deposit
                </th>
                <th className="px-3 py-2.5 text-left font-semibold text-ios-label-secondary">
                  Note
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p, idx) => (
                <tr
                  key={p.id}
                  className={
                    idx !== rows.length - 1
                      ? "border-b border-ios-separator"
                      : ""
                  }
                >
                  <td className="px-3 py-3 text-ios-label">
                    <span className="font-semibold">{p.period_month}</span>
                  </td>
                  <td className="px-3 py-3 text-right text-ios-label">
                    {formatMoney(p.opening_balance)}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-ios-label">
                    {formatMoney(p.closing_balance)}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-ios-green">
                    {formatMoney(p.transaction_amount)}
                  </td>
                  <td className="px-3 py-3 text-[12px] text-ios-label-secondary">
                    {p.transaction_note || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Sheet>
  );
}
