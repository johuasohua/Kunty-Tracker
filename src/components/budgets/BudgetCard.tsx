"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { BudgetProgressBar } from "@/components/budgets/BudgetProgressBar";
import type { BudgetProgressEntry } from "@/lib/aggregate";

export function BudgetCard({
  entry,
  onEdit,
  onDelete,
  readOnly = false,
}: {
  entry: BudgetProgressEntry;
  onEdit?: () => void;
  onDelete?: () => void;
  readOnly?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CategoryIcon icon={entry.category.icon} color={entry.category.color} size={14} />
          <h3 className="text-[15px] font-semibold text-ios-label">
            {entry.category.name}
          </h3>
        </div>
        {!readOnly && (
          <div className="flex gap-1">
            <button
              onClick={onEdit}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-ios-fill text-ios-label-secondary"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={onDelete}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-ios-fill text-ios-red"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {entry.rows.map((row, i) => (
          <BudgetProgressBar
            key={row.person?.id ?? `shared-${i}`}
            label={row.person?.name ?? "Shared"}
            actual={row.actualAmount}
            budget={row.budgetAmount}
            color={entry.category.color}
          />
        ))}
      </div>
    </Card>
  );
}
