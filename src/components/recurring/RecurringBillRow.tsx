"use client";

import { Check } from "lucide-react";
import { clsx } from "clsx";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { formatMoney } from "@/lib/format";
import { currentCycleDueDate, amortizedMonthlyAmount } from "@/lib/aggregate";
import { unmarkBillPaid } from "@/lib/queries/recurring";
import type { RecurringBillPayment } from "@/lib/queries/recurring";
import type { Category, Person, RecurringBill } from "@/lib/types";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function RecurringBillRow({
  bill,
  category,
  owner,
  payments,
  onEdit,
  onMarkPaid,
  onChanged,
  last,
}: {
  bill: RecurringBill;
  category: Category | undefined;
  owner: Person | null;
  payments: RecurringBillPayment[];
  onEdit: () => void;
  onMarkPaid: () => void;
  onChanged: () => void;
  last: boolean;
}) {
  const dueDate = currentCycleDueDate(bill, payments);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daysUntilDue = Math.round(
    (dueDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24)
  );
  const overdue = daysUntilDue < 0;

  const billPayments = payments
    .filter((p) => p.recurring_bill_id === bill.id)
    .sort((a, b) => (a.month < b.month ? 1 : -1));
  const paidToday = billPayments.find((p) => p.paid_on === todayISO());

  const monthlyEquivalent =
    bill.frequency !== "monthly" ? amortizedMonthlyAmount(bill) : null;

  async function handleUnmark() {
    if (!paidToday) return;
    if (!window.confirm("Unmark this payment?")) return;
    await unmarkBillPaid(paidToday.id, paidToday.transaction_id);
    onChanged();
  }

  return (
    <div
      className={clsx(
        "flex items-center gap-3 px-4 py-3",
        !last && "border-b border-ios-separator"
      )}
    >
      <button onClick={onEdit} className="flex flex-1 items-center gap-3 text-left">
        <CategoryIcon icon={category?.icon ?? null} color={category?.color ?? "#8E8E93"} size={14} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] text-ios-label">{bill.name}</div>
          <div
            className={clsx(
              "truncate text-[13px]",
              overdue ? "text-ios-red" : "text-ios-label-secondary"
            )}
          >
            {paidToday && "Paid today · "}
            {overdue
              ? `Overdue by ${Math.abs(daysUntilDue)}d`
              : daysUntilDue === 0
                ? "Due today"
                : `Due in ${daysUntilDue}d`}
            {" · "}
            {owner?.name ?? "Shared"}
            {monthlyEquivalent !== null && ` · ≈ ${formatMoney(monthlyEquivalent)}/mo`}
          </div>
        </div>
        <div className="text-[15px] font-medium text-ios-label">
          {formatMoney(bill.amount)}
        </div>
      </button>

      {paidToday ? (
        <button
          onClick={handleUnmark}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ios-green text-white"
          aria-label="Paid today — tap to unmark"
        >
          <Check size={16} />
        </button>
      ) : (
        <button
          onClick={onMarkPaid}
          className="shrink-0 rounded-lg bg-ios-fill px-2.5 py-1.5 text-[12px] font-medium text-ios-blue"
        >
          Mark Paid
        </button>
      )}
    </div>
  );
}
