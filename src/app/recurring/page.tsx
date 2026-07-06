"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { GroupedSection } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCategories } from "@/lib/queries/categories";
import { useProfile } from "@/lib/profile-context";
import { useRecurringBills } from "@/lib/queries/recurring";
import { currentCycleDueDate } from "@/lib/aggregate";
import { RecurringBillRow } from "@/components/recurring/RecurringBillRow";
import { AddEditBillSheet } from "@/components/recurring/AddEditBillSheet";
import { MarkBillPaidSheet } from "@/components/recurring/MarkBillPaidSheet";
import type { RecurringBill } from "@/lib/types";

export default function RecurringPage() {
  const { categories } = useCategories();
  const { people } = useProfile();
  const { bills, payments, loading, refresh } = useRecurringBills();

  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [markPaidBill, setMarkPaidBill] = useState<RecurringBill | null>(null);

  // Sort by each bill's *derived* current cycle due date, not the raw
  // stored anchor, since an old anchor can be far behind the real cycle.
  const sortedBills = useMemo(
    () =>
      [...bills].sort(
        (a, b) =>
          currentCycleDueDate(a, payments).getTime() -
          currentCycleDueDate(b, payments).getTime()
      ),
    [bills, payments]
  );

  return (
    <div className="px-4 md:px-0">
      <PageHeader
        title="Recurring Bills"
        action={
          <button
            onClick={() => setAddOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ios-blue text-white"
            aria-label="Add recurring bill"
          >
            <Plus size={18} />
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-14">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ios-blue border-t-transparent" />
        </div>
      ) : bills.length === 0 ? (
        <EmptyState
          title="No recurring bills yet"
          subtitle="Track utility bills and subscriptions with due dates using the + button."
        />
      ) : (
        <GroupedSection>
          {sortedBills.map((bill, i) => (
            <RecurringBillRow
              key={bill.id}
              bill={bill}
              category={categories.find((c) => c.id === bill.category_id)}
              owner={people.find((p) => p.id === bill.owner_person_id) ?? null}
              payments={payments}
              onEdit={() => setEditingBill(bill)}
              onMarkPaid={() => setMarkPaidBill(bill)}
              onChanged={refresh}
              last={i === sortedBills.length - 1}
            />
          ))}
        </GroupedSection>
      )}

      <AddEditBillSheet
        bill={null}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={refresh}
        categories={categories}
        people={people}
      />
      <AddEditBillSheet
        bill={editingBill}
        open={!!editingBill}
        onClose={() => setEditingBill(null)}
        onSaved={refresh}
        categories={categories}
        people={people}
      />
      <MarkBillPaidSheet
        bill={markPaidBill}
        payments={payments}
        onClose={() => setMarkPaidBill(null)}
        onSaved={refresh}
      />
    </div>
  );
}
