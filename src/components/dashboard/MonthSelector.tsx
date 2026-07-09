"use client";

import { ChevronLeft, ChevronRight, ArrowLeftRight } from "lucide-react";
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

      <button
        onClick={() => onViewChange(view === "monthly" ? "annual" : "monthly")}
        className="flex items-center gap-1.5 rounded-full bg-ios-fill px-3 py-1.5 text-[13px] font-medium text-ios-label active:bg-ios-fill-secondary"
        aria-label={`Switch to ${view === "monthly" ? "annual" : "monthly"} view`}
      >
        <ArrowLeftRight size={13} className="text-ios-label-secondary" />
        {view === "monthly" ? "Monthly" : "Annual"}
      </button>
    </div>
  );
}
