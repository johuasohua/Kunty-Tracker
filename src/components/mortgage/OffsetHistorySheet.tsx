"use client";

import { Trash2 } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { formatMoney } from "@/lib/format";
import { deleteOffsetPeriod } from "@/lib/queries/offset";
import type { OffsetSeriesPoint } from "@/lib/aggregate";

export function OffsetHistorySheet({
  open,
  onClose,
  series,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  series: OffsetSeriesPoint[];
  onDeleted?: () => void;
}) {
  // Newest first; show only locked (historical) rows
  const rows = [...series].filter((p) => p.locked).reverse();

  async function handleDelete(id: string, month: string) {
    if (
      !window.confirm(
        `Delete the ${month} offset entry? This cannot be undone.`
      )
    )
      return;
    await deleteOffsetPeriod(id);
    onDeleted?.();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Offset History">
      {rows.length === 0 ? (
        <p className="py-6 text-center text-[14px] text-ios-label-secondary">
          No offset activity recorded yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-[13px]">
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
                <th className="px-3 py-2.5 text-right font-semibold text-ios-label-secondary">
                  Mortgage Payment
                </th>
                <th className="px-3 py-2.5 text-left font-semibold text-ios-label-secondary">
                  Note
                </th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p, idx) => (
                <tr
                  key={p.id ?? p.periodMonth}
                  className={
                    idx !== rows.length - 1
                      ? "border-b border-ios-separator"
                      : ""
                  }
                >
                  <td className="px-3 py-3 text-ios-label">
                    <span className="font-semibold">{p.periodMonth}</span>
                  </td>
                  <td className="px-3 py-3 text-right text-ios-label">
                    {formatMoney(p.openingBalance)}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-ios-label">
                    {formatMoney(p.closingBalance)}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-ios-green">
                    {p.depositAmount ? formatMoney(p.depositAmount) : "—"}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-ios-red">
                    {p.mortgageDeduction ? formatMoney(-p.mortgageDeduction) : "—"}
                  </td>
                  <td className="px-3 py-3 text-[12px] text-ios-label-secondary">
                    {p.transactionNote || "—"}
                  </td>
                  <td className="px-3 py-3">
                    {p.locked && p.id ? (
                      <button
                        onClick={() => handleDelete(p.id!, p.periodMonth)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-ios-fill text-ios-red"
                        aria-label={`Delete ${p.periodMonth} entry`}
                      >
                        <Trash2 size={13} />
                      </button>
                    ) : (
                      // Derived from live transactions + mortgage payments —
                      // edit those to change this row; nothing stored to delete.
                      <span className="rounded-full bg-ios-fill px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ios-label-secondary">
                        Live
                      </span>
                    )}
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
