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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (bill) {
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
      const shouldCreateTransaction = !!bill.category_id && !!personId;

      await markBillPaid({
        recurring_bill_id: bill.id,
        month: cycleDueDateStr,
        createTransaction: shouldCreateTransaction,
        transactionDetails: shouldCreateTransaction
          ? {
              occurred_on: dateOnlyString(new Date()),
              amount: bill.amount,
              category_id: bill.category_id!,
              person_id: personId!,
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

  const canCreateTransaction = bill && !!bill.category_id && !!bill.owner_person_id;
  const warningText = bill && !canCreateTransaction
    ? bill.category_id ? "Bill is missing owner assignment" : "Bill is missing category"
    : null;

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

          {canCreateTransaction && (
            <div className="rounded-xl bg-ios-blue/10 px-3 py-2 text-[13px] text-ios-blue">
              ✓ Will be logged as a transaction automatically
            </div>
          )}

          {warningText && (
            <div className="rounded-xl bg-ios-orange/10 px-3 py-2 text-[13px] text-ios-orange">
              ⚠️ {warningText} — bill will be marked paid but not logged as a transaction
            </div>
          )}

          {error && <p className="text-[13px] text-ios-red">{error}</p>}

          <Button onClick={handleConfirm} disabled={saving}>
            {saving ? "Saving…" : "Confirm Paid"}
          </Button>
        </div>
      )}
    </Sheet>
  );
}
