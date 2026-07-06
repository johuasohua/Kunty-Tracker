"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronUp, ChevronDown, Plus, EyeOff } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { CategoryEditSheet } from "@/components/settings/CategoryEditSheet";
import { useAllCategories, swapCategoryOrder } from "@/lib/queries/categories";
import type { Category } from "@/lib/types";

const TREAT_AS_LABEL: Record<Category["treat_as"], string> = {
  expense: "Expense",
  income: "Income",
  offset: "Offsets expense",
};

export default function ManageCategoriesPage() {
  const { categories, loading, refresh } = useAllCategories();
  const [editing, setEditing] = useState<Category | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reordering, setReordering] = useState(false);

  function openNew() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setSheetOpen(true);
  }

  async function move(index: number, direction: -1 | 1) {
    const other = categories[index + direction];
    if (!other || reordering) return;
    setReordering(true);
    try {
      await swapCategoryOrder(categories[index], other);
      await refresh();
    } finally {
      setReordering(false);
    }
  }

  const nextSortOrder =
    categories.length > 0
      ? Math.max(...categories.map((c) => c.sort_order)) + 1
      : 0;

  return (
    <div className="px-4 md:px-0">
      <Link
        href="/settings"
        className="mt-4 inline-flex items-center gap-1 text-[15px] font-medium text-ios-blue"
      >
        <ChevronLeft size={18} /> Settings
      </Link>

      <PageHeader
        title="Categories"
        action={
          <button
            onClick={openNew}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ios-blue text-white"
            aria-label="Add category"
          >
            <Plus size={18} />
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-14">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ios-blue border-t-transparent" />
        </div>
      ) : (
        <>
          <Card>
            {categories.map((c, i) => (
              <div
                key={c.id}
                className={
                  "flex items-center gap-3 px-4 py-3 " +
                  (i < categories.length - 1 ? "border-b border-ios-separator" : "")
                }
              >
                <button
                  onClick={() => openEdit(c)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left active:opacity-70"
                >
                  <CategoryIcon icon={c.icon} color={c.color} size={14} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={
                          "truncate text-[15px] " +
                          (c.is_active ? "text-ios-label" : "text-ios-label-tertiary")
                        }
                      >
                        {c.name}
                      </span>
                      {!c.is_active && (
                        <EyeOff size={12} className="shrink-0 text-ios-label-tertiary" />
                      )}
                    </div>
                    <div className="text-[12px] text-ios-label-secondary">
                      {TREAT_AS_LABEL[c.treat_as]}
                    </div>
                  </div>
                </button>

                <div className="flex shrink-0 flex-col">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0 || reordering}
                    aria-label={`Move ${c.name} up`}
                    className="flex h-6 w-7 items-center justify-center rounded text-ios-label-secondary active:bg-ios-fill disabled:opacity-25"
                  >
                    <ChevronUp size={15} />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === categories.length - 1 || reordering}
                    aria-label={`Move ${c.name} down`}
                    className="flex h-6 w-7 items-center justify-center rounded text-ios-label-secondary active:bg-ios-fill disabled:opacity-25"
                  >
                    <ChevronDown size={15} />
                  </button>
                </div>
              </div>
            ))}
          </Card>
          <p className="mt-2 px-4 text-[13px] text-ios-label-secondary md:px-0">
            Tap a category to rename, recolor, or hide it. Renames apply
            everywhere immediately — categories are data, not code.
          </p>
        </>
      )}

      <CategoryEditSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSaved={refresh}
        category={editing}
        nextSortOrder={nextSortOrder}
      />
    </div>
  );
}
