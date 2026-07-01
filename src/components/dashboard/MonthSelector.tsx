"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { monthLabel } from "@/lib/format";

export function MonthSelector({
  view,
  onViewChange,
  month,
  onMonthChange,
  year,
  onYearChange,
}: {
  view: "monthly" | "annual";
  onViewChange: (v: "monthly" | "annual") => void;
  month: Date;
  onMonthChange: (d: Date) => void;
  year: number;
  onYearChange: (y: number) => void;
}) {
  return (
    <div className="mb-4 flex items-center justify-between px-4 md:px-0">
      <div className="flex items-center gap-1">
        <button
          onClick={() =>
            view === "monthly"
              ? onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))
              : onYearChange(year - 1)
          }
          className="flex h-8 w-8 items-center justify-center rounded-full bg-ios-fill text-ios-label"
          aria-label="Previous"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-[140px] text-center text-[15px] font-medium text-ios-label">
          {view === "monthly" ? monthLabel(month) : year}
        </span>
        <button
          onClick={() =>
            view === "monthly"
              ? onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))
              : onYearChange(year + 1)
          }
          className="flex h-8 w-8 items-center justify-center rounded-full bg-ios-fill text-ios-label"
          aria-label="Next"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <SegmentedControl
        options={[
          { label: "Monthly", value: "monthly" },
          { label: "Annual", value: "annual" },
        ]}
        value={view}
        onChange={onViewChange}
      />
    </div>
  );
}
