"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { Check } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { CategoryIcon, CATEGORY_ICON_NAMES } from "@/components/ui/CategoryIcon";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/queries/categories";
import type { Category, CategoryTreatAs } from "@/lib/types";

/** iOS system palette — matches the colors used by the seeded categories. */
const COLORS = [
  "#FF3B30", "#FF9500", "#FFCC00", "#34C759", "#30B0C7",
  "#007AFF", "#5856D6", "#AF52DE", "#FF2D55", "#8E8E93",
];

/**
 * Create/edit a category: rename, type, color, icon, hide/show, delete.
 * Deleting is blocked by the DB once transactions reference the category —
 * that error is caught and the user is pointed at hiding instead.
 */
export function CategoryEditSheet({
  open,
  onClose,
  onSaved,
  category,
  nextSortOrder,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  category: Category | null; // null = create new
  nextSortOrder: number;
}) {
  const [name, setName] = useState("");
  const [treatAs, setTreatAs] = useState<CategoryTreatAs>("expense");
  const [color, setColor] = useState(COLORS[5]);
  const [icon, setIcon] = useState<string>(CATEGORY_ICON_NAMES[0]);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? "");
    setTreatAs(category?.treat_as ?? "expense");
    setColor(category?.color ?? COLORS[5]);
    setIcon(category?.icon ?? CATEGORY_ICON_NAMES[0]);
    setIsActive(category?.is_active ?? true);
    setError("");
  }, [open, category]);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a name");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (category) {
        await updateCategory(category.id, {
          name: trimmed,
          treat_as: treatAs,
          color,
          icon,
          is_active: isActive,
        });
      } else {
        await createCategory({
          name: trimmed,
          treat_as: treatAs,
          color,
          icon,
          sort_order: nextSortOrder,
        });
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
    if (!category) return;
    if (!window.confirm(`Delete "${category.name}"? This cannot be undone.`)) return;
    setSaving(true);
    setError("");
    try {
      await deleteCategory(category.id);
      onSaved();
      onClose();
    } catch {
      setError(
        "This category has transactions, so it can't be deleted — hide it instead."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={category ? "Edit Category" : "New Category"}
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Groceries"
            className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3.5 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
          />
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
            Type
          </label>
          <SegmentedControl<CategoryTreatAs>
            options={[
              { label: "Expense", value: "expense" },
              { label: "Income", value: "income" },
              { label: "Rak", value: "rak" },
            ]}
            value={treatAs}
            onChange={setTreatAs}
          />
          <p className="mt-1 text-[12px] text-ios-label-tertiary">
            &ldquo;Rak&rdquo; (like Rak deposits) is money moved to your own account —
            not card spend, but cash that leaves.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: c }}
              >
                {color === c && <Check size={15} className="text-white" />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
            Icon
          </label>
          <div className="grid grid-cols-7 gap-2">
            {CATEGORY_ICON_NAMES.map((n) => (
              <button
                key={n}
                onClick={() => setIcon(n)}
                aria-label={`Icon ${n}`}
                className={clsx(
                  "flex items-center justify-center rounded-xl border p-1.5",
                  icon === n
                    ? "border-ios-blue bg-ios-blue/10"
                    : "border-transparent bg-ios-fill"
                )}
              >
                <CategoryIcon icon={n} color={color} size={13} />
              </button>
            ))}
          </div>
        </div>

        {category && (
          <div className="flex items-center justify-between rounded-xl bg-ios-bg p-3">
            <div>
              <div className="text-[15px] text-ios-label">Visible</div>
              <div className="text-[12px] text-ios-label-secondary">
                Hidden categories keep their history but leave the pickers.
              </div>
            </div>
            <button
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive((v) => !v)}
              className={clsx(
                "relative h-7 w-12 shrink-0 rounded-full transition-colors",
                isActive ? "bg-ios-green" : "bg-ios-fill"
              )}
            >
              <span
                className={clsx(
                  "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all",
                  isActive ? "left-[22px]" : "left-0.5"
                )}
              />
            </button>
          </div>
        )}

        {error && <p className="text-[13px] text-ios-red">{error}</p>}

        <div className="flex gap-2">
          {category && (
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
