"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { suggestBudgetsFromHistory } from "@/lib/aggregate";
import { upsertBudgetByKey } from "@/lib/queries/budgets";
import type { LightTransaction } from "@/lib/queries/dashboard-data";
import type { Budget, Category } from "@/lib/types";

interface Row {
  category: Category;
  amount: string;
  include: boolean;
  monthsCounted: number;
  hasExisting: boolean;
}

/**
 * Pre-populates budgets from historical spend (the imported Excel data). Lists
 * a suggested monthly amount per category — derived from the trailing average —
 * with editable amounts and per-row include toggles. Categories that already
 * have a budget start unchecked so nothing is overwritten by accident.
 */
export function SuggestBudgetsSheet({
  open,
  onClose,
  onSaved,
  transactions,
  categories,
  budgets,
  month,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  transactions: LightTransaction[];
  categories: Category[];
  budgets: Budget[];
  month: Date;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const budgetedCategoryIds = new Set(budgets.map((b) => b.category_id));
    const suggestions = suggestBudgetsFromHistory(transactions, categories, month);
    setRows(
      suggestions.map((s) => ({
        category: s.category,
        amount: String(s.monthlyAverage),
        include: !budgetedCategoryIds.has(s.category.id),
        monthsCounted: s.monthsCounted,
        hasExisting: budgetedCategoryIds.has(s.category.id),
      }))
    );
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const includedCount = rows.filter((r) => r.include).length;

  function setRow(id: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.category.id === id ? { ...r, ...patch } : r)));
  }

  async function handleApply() {
    setSaving(true);
    setError("");
    try {
      for (const r of rows) {
        if (!r.include) continue;
        const amount = parseFloat(r.amount);
        if (!amount || amount <= 0) continue;
        await upsertBudgetByKey({
          category_id: r.category.id,
          person_id: null,
          monthly_amount: amount,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Suggest from history">
      <div className="flex flex-col gap-4">
        {rows.length === 0 ? (
          <p className="py-6 text-center text-[15px] text-ios-label-secondary">
            Not enough spending history yet to suggest budgets.
          </p>
        ) : (
          <>
            <p className="text-[13px] text-ios-label-secondary">
              Based on your average monthly spend over the last few months. Adjust
              any amount, then apply. Shared (household) budgets are created.
            </p>

            <div className="flex flex-col gap-2">
              {rows.map((r) => (
                <div
                  key={r.category.id}
                  className="flex items-center gap-3 rounded-xl bg-ios-bg p-3"
                >
                  <button
                    onClick={() => setRow(r.category.id, { include: !r.include })}
                    aria-label={r.include ? "Exclude" : "Include"}
                    className={
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border " +
                      (r.include
                        ? "border-ios-blue bg-ios-blue text-white"
                        : "border-ios-separator bg-ios-bg-secondary")
                    }
                  >
                    {r.include && <Check size={14} />}
                  </button>

                  <CategoryIcon icon={r.category.icon} color={r.category.color} size={13} />

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] text-ios-label">
                      {r.category.name}
                    </div>
                    <div className="text-[11px] text-ios-label-tertiary">
                      {r.hasExisting
                        ? "already has a budget"
                        : `avg of ${r.monthsCounted} month${r.monthsCounted === 1 ? "" : "s"}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[12px] text-ios-label-secondary">AED</span>
                    <input
                      inputMode="decimal"
                      value={r.amount}
                      onChange={(e) => setRow(r.category.id, { amount: e.target.value })}
                      className="w-20 rounded-lg border border-ios-separator bg-ios-bg-secondary px-2 py-1.5 text-right text-[14px] text-ios-label outline-none focus:border-ios-blue"
                    />
                  </div>
                </div>
              ))}
            </div>

            {error && <p className="text-[13px] text-ios-red">{error}</p>}

            <Button onClick={handleApply} disabled={saving || includedCount === 0}>
              {saving
                ? "Applying…"
                : `Apply ${includedCount} budget${includedCount === 1 ? "" : "s"}`}
            </Button>
          </>
        )}
      </div>
    </Sheet>
  );
}
