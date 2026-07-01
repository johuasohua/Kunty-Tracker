"use client";

import { clsx } from "clsx";
import type { Category } from "@/lib/types";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

export function CategoryPicker({
  categories,
  value,
  onChange,
  filter = "expense",
}: {
  categories: Category[];
  value: string | null;
  onChange: (categoryId: string) => void;
  filter?: "expense" | "income" | "all";
}) {
  const options = categories.filter((c) => {
    if (filter === "all") return true;
    if (filter === "income") return c.treat_as === "income";
    return c.treat_as !== "income";
  });

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {options.map((cat) => {
        const active = cat.id === value;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.id)}
            className={clsx(
              "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center",
              active
                ? "border-ios-blue bg-ios-blue/10"
                : "border-transparent bg-ios-fill"
            )}
          >
            <CategoryIcon icon={cat.icon} color={cat.color} size={16} />
            <span
              className={clsx(
                "line-clamp-1 text-[12px] font-medium",
                active ? "text-ios-blue" : "text-ios-label"
              )}
            >
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
