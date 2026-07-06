"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { upsertBudget, deleteBudget } from "@/lib/queries/budgets";
import type { Budget, Category, Person } from "@/lib/types";

export function AddEditBudgetSheet({
  open,
  onClose,
  onSaved,
  categories,
  people,
  budgets,
  editingCategoryId,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  categories: Category[];
  people: Person[];
  budgets: Budget[];
  editingCategoryId: string | null;
}) {
  const [categoryId, setCategoryId] = useState("");
  const [scope, setScope] = useState<"shared" | "per-person">("shared");
  const [sharedAmount, setSharedAmount] = useState("");
  const [amountsByPerson, setAmountsByPerson] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const budgetableCategories = categories.filter((c) => c.treat_as !== "income");
  const categoriesWithBudget = new Set(budgets.map((b) => b.category_id));
  const availableCategories = editingCategoryId
    ? budgetableCategories
    : budgetableCategories.filter((c) => !categoriesWithBudget.has(c.id));

  const existingForCategory = budgets.filter((b) => b.category_id === categoryId);

  useEffect(() => {
    if (!open) return;
    setError("");
    if (editingCategoryId) {
      setCategoryId(editingCategoryId);
      const existing = budgets.filter((b) => b.category_id === editingCategoryId);
      const perPerson = existing.filter((b) => b.person_id !== null);
      if (perPerson.length > 0) {
        setScope("per-person");
        const amounts: Record<string, string> = {};
        for (const b of perPerson) amounts[b.person_id as string] = String(b.monthly_amount);
        setAmountsByPerson(amounts);
        setSharedAmount("");
      } else {
        setScope("shared");
        setSharedAmount(existing[0] ? String(existing[0].monthly_amount) : "");
        setAmountsByPerson({});
      }
    } else {
      setCategoryId(availableCategories[0]?.id ?? "");
      setScope("shared");
      setSharedAmount("");
      setAmountsByPerson({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingCategoryId]);

  async function handleSave() {
    if (!categoryId) {
      setError("Pick a category");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const sharedRow = existingForCategory.find((b) => b.person_id === null);
      const perPersonRows = existingForCategory.filter((b) => b.person_id !== null);

      if (scope === "shared") {
        const amount = parseFloat(sharedAmount);
        if (!amount || amount <= 0) {
          setError("Enter a valid amount");
          setSaving(false);
          return;
        }
        // Switching from per-person -> shared: remove the old per-person rows.
        for (const row of perPersonRows) await deleteBudget(row.id);
        await upsertBudget({
          existingId: sharedRow?.id,
          category_id: categoryId,
          person_id: null,
          monthly_amount: amount,
        });
      } else {
        const amounts = people.map((p) => ({
          person: p,
          amount: parseFloat(amountsByPerson[p.id] ?? ""),
        }));
        if (amounts.some((a) => !a.amount || a.amount <= 0)) {
          setError("Enter a valid amount for each person");
          setSaving(false);
          return;
        }
        // Switching from shared -> per-person: remove the old shared row.
        if (sharedRow) await deleteBudget(sharedRow.id);
        for (const { person, amount } of amounts) {
          const existing = perPersonRows.find((b) => b.person_id === person.id);
          await upsertBudget({
            existingId: existing?.id,
            category_id: categoryId,
            person_id: person.id,
            monthly_amount: amount,
          });
        }
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
    if (!window.confirm("Delete this budget?")) return;
    setSaving(true);
    try {
      for (const row of existingForCategory) await deleteBudget(row.id);
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editingCategoryId ? "Edit Budget" : "Add Budget"}
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
            Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={!!editingCategoryId}
            className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3.5 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue disabled:opacity-60"
          >
            {availableCategories.length === 0 && !editingCategoryId && (
              <option value="">All categories already have a budget</option>
            )}
            {availableCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
            Scope
          </label>
          <SegmentedControl
            options={[
              { label: "Shared", value: "shared" },
              { label: "Per Person", value: "per-person" },
            ]}
            value={scope}
            onChange={setScope}
          />
        </div>

        {scope === "shared" ? (
          <div>
            <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
              Monthly Amount (AED)
            </label>
            <input
              inputMode="decimal"
              value={sharedAmount}
              onChange={(e) => setSharedAmount(e.target.value)}
              className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3.5 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {people.map((p) => (
              <div key={p.id}>
                <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
                  {p.name}&apos;s Monthly Amount (AED)
                </label>
                <input
                  inputMode="decimal"
                  value={amountsByPerson[p.id] ?? ""}
                  onChange={(e) =>
                    setAmountsByPerson((prev) => ({ ...prev, [p.id]: e.target.value }))
                  }
                  className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3.5 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
                />
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-[13px] text-ios-red">{error}</p>}

        <div className="flex gap-2">
          {editingCategoryId && (
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              Delete
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving || !categoryId} className="flex-1">
            {saving ? "Saving…" : "Save Budget"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
