"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
  createRecurringBill,
  updateRecurringBill,
  deleteRecurringBill,
} from "@/lib/queries/recurring";
import type {
  Category,
  PaymentMethod,
  Person,
  RecurringBill,
  RecurringFrequency,
} from "@/lib/types";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function AddEditBillSheet({
  bill,
  open,
  onClose,
  onSaved,
  categories,
  people,
}: {
  bill: RecurringBill | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  categories: Category[];
  people: Person[];
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [nextDueDate, setNextDueDate] = useState(todayISO());
  const [categoryId, setCategoryId] = useState("");
  const [ownerId, setOwnerId] = useState(""); // "" = shared
  const [method, setMethod] = useState<PaymentMethod>("credit");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(bill?.name ?? "");
    setAmount(bill ? String(bill.amount) : "");
    setFrequency(bill?.frequency ?? "monthly");
    setNextDueDate(bill?.next_due_date ?? todayISO());
    setCategoryId(bill?.category_id ?? categories[0]?.id ?? "");
    setOwnerId(bill?.owner_person_id ?? "");
    setMethod(bill?.default_payment_method ?? "credit");
    setNotes(bill?.notes ?? "");
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, bill]);

  async function handleSave() {
    const parsedAmount = parseFloat(amount);
    if (!name.trim()) {
      setError("Enter a name");
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (!nextDueDate) {
      setError("Pick a due date");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const input = {
        name: name.trim(),
        amount: parsedAmount,
        frequency,
        next_due_date: nextDueDate,
        category_id: categoryId || null,
        owner_person_id: ownerId || null,
        default_payment_method: method,
        notes: notes || null,
      };
      if (bill) {
        await updateRecurringBill(bill.id, input);
      } else {
        await createRecurringBill(input);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!bill) return;
    if (!window.confirm(`Delete "${bill.name}"?`)) return;
    setSaving(true);
    try {
      await deleteRecurringBill(bill.id);
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const monthlyEquivalent =
    frequency !== "monthly" && parseFloat(amount) > 0
      ? parseFloat(amount) / (frequency === "quarterly" ? 3 : 12)
      : null;

  return (
    <Sheet open={open} onClose={onClose} title={bill ? "Edit Bill" : "Add Recurring Bill"}>
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Netflix, TOD TV, Building Maintenance"
            className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3.5 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
          />
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
            How Often
          </label>
          <SegmentedControl
            options={[
              { label: "Monthly", value: "monthly" },
              { label: "Quarterly", value: "quarterly" },
              { label: "Annual", value: "annual" },
            ]}
            value={frequency}
            onChange={setFrequency}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
              Amount (AED)
            </label>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3.5 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
            />
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
              {bill ? "Next Due Date" : "First Due Date"}
            </label>
            <input
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3.5 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
            />
          </div>
        </div>

        {monthlyEquivalent !== null && (
          <p className="text-[13px] text-ios-label-secondary">
            ≈ AED {monthlyEquivalent.toFixed(2)}/month effective cost. The full
            amount is still logged as one payment on its actual due date —
            this is just for comparing against monthly budgets.
          </p>
        )}

        <div>
          <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
            Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3.5 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
          >
            {categories
              .filter((c) => c.treat_as !== "income")
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
            Owner
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setOwnerId("")}
              className={
                "rounded-lg px-3 py-1.5 text-[14px] font-medium " +
                (ownerId === "" ? "bg-ios-blue text-white" : "bg-ios-fill text-ios-label")
              }
            >
              Shared
            </button>
            {people.map((p) => (
              <button
                key={p.id}
                onClick={() => setOwnerId(p.id)}
                className={
                  "rounded-lg px-3 py-1.5 text-[14px] font-medium " +
                  (ownerId === p.id ? "bg-ios-blue text-white" : "bg-ios-fill text-ios-label")
                }
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
            Default Payment Method
          </label>
          <SegmentedControl
            options={[
              { label: "Credit", value: "credit" },
              { label: "Debit", value: "debit" },
            ]}
            value={method}
            onChange={setMethod}
          />
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
            Notes (optional)
          </label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3.5 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
          />
        </div>

        {error && <p className="text-[13px] text-ios-red">{error}</p>}

        <div className="flex gap-2">
          {bill && (
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              Delete
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
