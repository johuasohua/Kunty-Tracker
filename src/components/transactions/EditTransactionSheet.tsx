"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { CategoryPicker } from "@/components/transactions/CategoryPicker";
import { useCategories } from "@/lib/queries/categories";
import { useProfile } from "@/lib/profile-context";
import { updateTransaction, deleteTransaction } from "@/lib/queries/transactions";
import type { PaymentMethod, Transaction } from "@/lib/types";

export function EditTransactionSheet({
  transaction,
  onClose,
  onSaved,
}: {
  transaction: Transaction | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { categories } = useCategories();
  const { people } = useProfile();

  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [personId, setPersonId] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("credit");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!transaction) return;
    setDate(transaction.occurred_on);
    setAmount(String(transaction.amount));
    setCategoryId(transaction.category_id);
    setPersonId(transaction.person_id);
    setMethod(transaction.payment_method);
    setNote(transaction.note ?? "");
    setError("");
  }, [transaction]);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  async function handleSave() {
    if (!transaction) return;
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateTransaction(transaction.id, {
        occurred_on: date,
        amount: parsedAmount,
        category_id: categoryId,
        person_id: personId,
        payment_method: method,
        type: selectedCategory?.treat_as === "income" ? "income" : "expense",
        note: note || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!transaction) return;
    if (!window.confirm("Delete this transaction?")) return;
    setSaving(true);
    try {
      await deleteTransaction(transaction.id);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setSaving(false);
    }
  }

  return (
    <Sheet open={!!transaction} onClose={onClose} title="Edit Transaction">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
            />
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
              Amount (AED)
            </label>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
            Category
          </label>
          <CategoryPicker
            categories={categories}
            value={categoryId}
            onChange={setCategoryId}
            filter="all"
            exclude={["Mortgage"]}
          />
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
            Person
          </label>
          <div className="flex gap-2">
            {people.map((p) => (
              <button
                key={p.id}
                onClick={() => setPersonId(p.id)}
                className={
                  "rounded-lg px-3 py-1.5 text-[14px] font-medium " +
                  (personId === p.id
                    ? "bg-ios-blue text-white"
                    : "bg-ios-fill text-ios-label")
                }
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
            Payment method
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
            Note
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
          />
        </div>

        {error && <p className="text-[13px] text-ios-red">{error}</p>}

        <div className="flex gap-2">
          <Button variant="destructive" onClick={handleDelete} disabled={saving}>
            Delete
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
