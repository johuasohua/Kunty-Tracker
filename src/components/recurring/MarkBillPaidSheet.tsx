"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { useProfile } from "@/lib/profile-context";
import { markBillPaid, type RecurringBillPayment } from "@/lib/queries/recurring";
import { currentCycleDueDate } from "@/lib/aggregate";
import type { RecurringBill } from "@/lib/types";
import { formatMoney } from "@/lib/format";

function dateOnlyString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function MarkBillPaidSheet({
  bill,
  payments,
  onClose,
  onSaved,
}: {
  bill: RecurringBill | null;
  payments: RecurringBillPayment[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { activePerson } = useProfile();
  const [createTransaction, setCreateTransaction] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (bill) {
      setCreateTransaction(true);
      setError("");
    }
  }, [bill]);

  async function handleConfirm() {
    if (!bill) return;
    setSaving(true);
    setError("");
    try {
      const cycleDueDate = currentCycleDueDate(bill, payments);
      const cycleDueDateStr = dateOnlyString(cycleDueDate);
      const personId = bill.owner_person_id ?? activePerson?.id;

      await markBillPaid({
        recurring_bill_id: bill.id,
        month: cycleDueDateStr,
        createTransaction: createTransaction && !!bill.category_id && !!personId,
        transactionDetails:
          createTransaction && bill.category_id && personId
            ? {
                occurred_on: dateOnlyString(new Date()),
                amount: bill.amount,
                category_id: bill.category_id,
                person_id: personId,
                payment_method: bill.default_payment_method ?? "credit",
                note: bill.name,
                created_by_person_id: activePerson?.id ?? null,
              }
            : undefined,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={!!bill} onClose={onClose} title="Mark as Paid">
      {bill && (
        <div className="flex flex-col gap-4">
          <p className="text-[14px] text-ios-label-secondary">
            Mark <span className="font-medium text-ios-label">{bill.name}</span> (
            {formatMoney(bill.amount)}) as paid for its{" "}
            {currentCycleDueDate(bill, payments).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}{" "}
            due date.
          </p>

          <label className="flex items-center gap-2 rounded-xl bg-ios-fill px-3 py-2.5">
            <input
              type="checkbox"
              checked={createTransaction}
              onChange={(e) => setCreateTransaction(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-[14px] text-ios-label">
              Also log this as a transaction
            </span>
          </label>

          {error && <p className="text-[13px] text-ios-red">{error}</p>}

          <Button onClick={handleConfirm} disabled={saving}>
            {saving ? "Saving…" : "Confirm Paid"}
          </Button>
        </div>
      )}
    </Sheet>
  );
}
