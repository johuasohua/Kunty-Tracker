import { Card } from "@/components/ui/Card";
import { formatMoney, monthLabel } from "@/lib/format";
import type { CcMonthPoint } from "@/lib/aggregate";

export function CcHistoryTable({ points }: { points: CcMonthPoint[] }) {
  const rows = [...points].reverse();

  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-ios-separator text-left text-ios-label-secondary">
            <th className="px-3 py-2">Month</th>
            <th className="px-3 py-2 text-right">Carry Over</th>
            <th className="px-3 py-2 text-right">CC Spend</th>
            <th className="px-3 py-2 text-right">Paid Off</th>
            <th className="px-3 py-2 text-right">Balance</th>
            <th className="px-3 py-2 text-right">Cash Expense</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.key} className="border-b border-ios-separator last:border-0">
              <td className="whitespace-nowrap px-3 py-2 text-ios-label">
                {monthLabel(p.date)}
              </td>
              <td className="px-3 py-2 text-right text-ios-label-secondary">
                {formatMoney(p.carryOver)}
              </td>
              <td className="px-3 py-2 text-right text-ios-label-secondary">
                {formatMoney(p.currentSpend)}
              </td>
              <td className="px-3 py-2 text-right text-ios-green">
                {formatMoney(p.paidOff)}
              </td>
              <td className="px-3 py-2 text-right font-medium text-ios-label">
                {formatMoney(p.closing)}
              </td>
              <td className="px-3 py-2 text-right text-ios-label-secondary">
                {formatMoney(p.cashFlowExpense)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
