"use client";

import { GroupedSection } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { formatMoney } from "@/lib/format";
import type { Category, Person, Transaction } from "@/lib/types";

export function TransactionMobileList({
  transactions,
  categories,
  people,
  onSelect,
}: {
  transactions: Transaction[];
  categories: Category[];
  people: Person[];
  onSelect: (t: Transaction) => void;
}) {
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const list = groups.get(t.occurred_on) ?? [];
    list.push(t);
    groups.set(t.occurred_on, list);
  }
  const dateKeys = Array.from(groups.keys()).sort((a, b) => (a < b ? 1 : -1));

  return (
    <>
      {dateKeys.map((dateKey) => {
        const dayTransactions = groups.get(dateKey)!;
        const label = new Date(dateKey).toLocaleDateString("en-GB", {
          weekday: "short",
          day: "2-digit",
          month: "short",
        });
        return (
          <GroupedSection key={dateKey} title={label}>
            {dayTransactions.map((t, i) => {
              const category = categories.find((c) => c.id === t.category_id);
              const person = people.find((p) => p.id === t.person_id);
              const isExpense = t.type === "expense" && category?.treat_as !== "rak";
              return (
                <ListRow
                  key={t.id}
                  onClick={() => onSelect(t)}
                  last={i === dayTransactions.length - 1}
                  icon={
                    <CategoryIcon
                      icon={category?.icon ?? null}
                      color={category?.color ?? "#8E8E93"}
                      size={14}
                    />
                  }
                  label={category?.name ?? "Uncategorized"}
                  subtitle={`${person?.name ?? "—"} · ${t.payment_method}${
                    t.note ? ` · ${t.note}` : ""
                  }`}
                  value={
                    <span className={isExpense ? "" : "text-ios-green"}>
                      {isExpense ? "-" : "+"}
                      {formatMoney(t.amount)}
                    </span>
                  }
                />
              );
            })}
          </GroupedSection>
        );
      })}
    </>
  );
}
