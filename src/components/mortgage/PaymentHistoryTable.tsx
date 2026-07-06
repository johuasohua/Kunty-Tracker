"use client";

import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/format";
import { deleteMortgagePayment } from "@/lib/queries/mortgage";
import type { MortgagePayment } from "@/lib/types";

export function PaymentHistoryTable({
  payments,
  onChanged,
}: {
  payments: MortgagePayment[];
  onChanged: () => void;
}) {
  const rows = [...payments].reverse();

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this payment period? This cannot be undone.")) return;
    await deleteMortgagePayment(id);
    onChanged();
  }

  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-ios-separator text-left text-ios-label-secondary">
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2 text-right">Opening</th>
            <th className="px-3 py-2 text-right">Principal</th>
            <th className="px-3 py-2 text-right">Interest</th>
            <th className="px-3 py-2 text-right">Insurance</th>
            <th className="px-3 py-2 text-right">HOI</th>
            <th className="px-3 py-2 text-right">Closing</th>
            <th className="px-3 py-2 text-right">Interest Saved</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="group border-b border-ios-separator last:border-0 hover:bg-ios-fill-secondary">
              <td className="whitespace-nowrap px-3 py-2 text-ios-label">
                {new Date(p.payment_date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="px-3 py-2 text-right text-ios-label-secondary">
                {formatMoney(p.opening_principal)}
              </td>
              <td className="px-3 py-2 text-right text-ios-green">
                {formatMoney(p.principal_amount)}
              </td>
              <td className="px-3 py-2 text-right text-ios-red">
                {formatMoney(p.interest_amount)}
              </td>
              <td className="px-3 py-2 text-right text-ios-label-secondary">
                {formatMoney(p.insurance_amount)}
              </td>
              <td className="px-3 py-2 text-right text-ios-label-secondary">
                {formatMoney(p.hoi_charge)}
              </td>
              <td className="px-3 py-2 text-right font-medium text-ios-label">
                {formatMoney(p.closing_principal)}
              </td>
              <td className="px-3 py-2 text-right text-ios-blue">
                {p.interest_saved != null ? formatMoney(p.interest_saved) : "—"}
              </td>
              <td className="px-3 py-2">
                <button
                  onClick={() => handleDelete(p.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-ios-fill text-ios-red opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
