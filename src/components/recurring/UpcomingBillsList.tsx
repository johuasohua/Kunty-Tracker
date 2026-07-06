import { clsx } from "clsx";
import { GroupedSection } from "@/components/ui/Card";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { formatMoney } from "@/lib/format";
import type { UpcomingBill } from "@/lib/aggregate";
import type { Category } from "@/lib/types";

export function UpcomingBillsList({
  bills,
  categories,
}: {
  bills: UpcomingBill[];
  categories: Category[];
}) {
  if (bills.length === 0) return null;

  return (
    <GroupedSection title="Upcoming Bills">
      {bills.map(({ bill, daysUntilDue, overdue }, i) => {
        const category = categories.find((c) => c.id === bill.category_id);
        return (
          <div
            key={bill.id}
            className={clsx(
              "flex items-center gap-3 px-4 py-3",
              i < bills.length - 1 && "border-b border-ios-separator"
            )}
          >
            <CategoryIcon icon={category?.icon ?? null} color={category?.color ?? "#8E8E93"} size={14} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] text-ios-label">{bill.name}</div>
              <div
                className={clsx(
                  "text-[13px]",
                  overdue ? "text-ios-red" : "text-ios-label-secondary"
                )}
              >
                {overdue
                  ? `Overdue by ${Math.abs(daysUntilDue)}d`
                  : daysUntilDue === 0
                    ? "Due today"
                    : `Due in ${daysUntilDue}d`}
              </div>
            </div>
            <div className="text-[15px] font-medium text-ios-label">
              {formatMoney(bill.amount)}
            </div>
          </div>
        );
      })}
    </GroupedSection>
  );
}
