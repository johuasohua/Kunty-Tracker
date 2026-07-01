"use client";

import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import type { Category, Person, PaymentMethod } from "@/lib/types";
import type { TransactionFilters } from "@/lib/queries/transactions";
import { clsx } from "clsx";

export function FilterSheet({
  open,
  onClose,
  filters,
  onChange,
  categories,
  people,
}: {
  open: boolean;
  onClose: () => void;
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
  categories: Category[];
  people: Person[];
}) {
  function toggleCategory(id: string) {
    const current = filters.categoryIds ?? [];
    const next = current.includes(id)
      ? current.filter((c) => c !== id)
      : [...current, id];
    onChange({ ...filters, categoryIds: next.length ? next : undefined });
  }

  return (
    <Sheet open={open} onClose={onClose} title="Filters">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
              From
            </label>
            <input
              type="date"
              value={filters.from ?? ""}
              onChange={(e) => onChange({ ...filters, from: e.target.value || undefined })}
              className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3 py-2.5 text-[15px] outline-none focus:border-ios-blue"
            />
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
              To
            </label>
            <input
              type="date"
              value={filters.to ?? ""}
              onChange={(e) => onChange({ ...filters, to: e.target.value || undefined })}
              className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3 py-2.5 text-[15px] outline-none focus:border-ios-blue"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
            Person
          </label>
          <div className="flex flex-wrap gap-2">
            {people.map((p) => (
              <button
                key={p.id}
                onClick={() =>
                  onChange({
                    ...filters,
                    personId: filters.personId === p.id ? undefined : p.id,
                  })
                }
                className={clsx(
                  "rounded-lg px-3 py-1.5 text-[14px] font-medium",
                  filters.personId === p.id
                    ? "bg-ios-blue text-white"
                    : "bg-ios-fill text-ios-label"
                )}
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
          <SegmentedControl<PaymentMethod | "all">
            options={[
              { label: "All", value: "all" },
              { label: "Credit", value: "credit" },
              { label: "Debit", value: "debit" },
            ]}
            value={filters.paymentMethod ?? "all"}
            onChange={(v) =>
              onChange({
                ...filters,
                paymentMethod: v === "all" ? undefined : v,
              })
            }
          />
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
            Categories
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => toggleCategory(c.id)}
                className={clsx(
                  "rounded-lg px-3 py-1.5 text-[13px] font-medium",
                  (filters.categoryIds ?? []).includes(c.id)
                    ? "bg-ios-blue text-white"
                    : "bg-ios-fill text-ios-label"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
            Sort by
          </label>
          <SegmentedControl
            options={[
              { label: "Newest", value: "date_desc" },
              { label: "Oldest", value: "date_asc" },
              { label: "Highest", value: "amount_desc" },
              { label: "Lowest", value: "amount_asc" },
            ]}
            value={filters.sort ?? "date_desc"}
            onChange={(v) => onChange({ ...filters, sort: v })}
          />
        </div>

        <Button variant="secondary" onClick={() => onChange({ sort: filters.sort })}>
          Clear filters
        </Button>
      </div>
    </Sheet>
  );
}
