"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useCategories } from "@/lib/queries/categories";
import { useProfile } from "@/lib/profile-context";
import { createTransaction } from "@/lib/queries/transactions";
import type { PaymentMethod } from "@/lib/types";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function DesktopEntryForm({ onSaved }: { onSaved: () => void }) {
  const { categories } = useCategories();
  const { activePerson, people, lastUsedMethod, setLastUsedMethod } =
    useProfile();

  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [personId, setPersonId] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>(lastUsedMethod);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const effectivePersonId = personId ?? activePerson?.id ?? "";
  const selectedCategory = categories.find((c) => c.id === categoryId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (!categoryId || !selectedCategory) {
      setError("Pick a category");
      return;
    }
    if (!effectivePersonId) {
      setError("No profile selected");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await createTransaction({
        occurred_on: date,
        amount: parsedAmount,
        category_id: categoryId,
        person_id: effectivePersonId,
        payment_method: method,
        type: selectedCategory.treat_as === "income" ? "income" : "expense",
        note: note || null,
        created_by_person_id: activePerson?.id ?? null,
      });
      setLastUsedMethod(method);
      setAmount("");
      setCategoryId("");
      setNote("");
      setDate(todayISO());
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-[15px] font-semibold text-ios-label">
        Add Transaction
      </h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="col-span-1">
          <label className="mb-1 block text-[12px] font-medium text-ios-label-secondary">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-ios-separator bg-ios-bg px-2.5 py-2 text-[14px] text-ios-label outline-none focus:border-ios-blue"
          />
        </div>

        <div className="col-span-1">
          <label className="mb-1 block text-[12px] font-medium text-ios-label-secondary">
            Amount
          </label>
          <input
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-ios-separator bg-ios-bg px-2.5 py-2 text-[14px] text-ios-label outline-none focus:border-ios-blue"
          />
        </div>

        <div className="col-span-2">
          <label className="mb-1 block text-[12px] font-medium text-ios-label-secondary">
            Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-ios-separator bg-ios-bg px-2.5 py-2 text-[14px] text-ios-label outline-none focus:border-ios-blue"
          >
            <option value="">Select…</option>
            {categories
              .filter((c) => c.name.toLowerCase() !== "mortgage")
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </div>

        <div className="col-span-1">
          <label className="mb-1 block text-[12px] font-medium text-ios-label-secondary">
            Person
          </label>
          <select
            value={effectivePersonId}
            onChange={(e) => setPersonId(e.target.value)}
            className="w-full rounded-lg border border-ios-separator bg-ios-bg px-2.5 py-2 text-[14px] text-ios-label outline-none focus:border-ios-blue"
          >
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-1">
          <label className="mb-1 block text-[12px] font-medium text-ios-label-secondary">
            Method
          </label>
          <SegmentedControl
            className="w-full justify-center"
            options={[
              { label: "Credit", value: "credit" },
              { label: "Debit", value: "debit" },
            ]}
            value={method}
            onChange={setMethod}
          />
        </div>

        <div className="col-span-2 sm:col-span-3 lg:col-span-4">
          <label className="mb-1 block text-[12px] font-medium text-ios-label-secondary">
            Note
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional"
            className="w-full rounded-lg border border-ios-separator bg-ios-bg px-2.5 py-2 text-[14px] text-ios-label outline-none focus:border-ios-blue"
          />
        </div>

        <div className="col-span-2 flex items-end lg:col-span-2">
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Saving…" : "Add"}
          </Button>
        </div>
      </form>
      {error && <p className="mt-2 text-[13px] text-ios-red">{error}</p>}
    </Card>
  );
}
