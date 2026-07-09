"use client";

import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import type { MonthlyReview } from "@/lib/aggregate";

/**
 * The Monthly Review headline: a cash-flow tile of Income / Expense / Net
 * for the selected month. The plain-language insights list (anomalies,
 * spikes, budget variance) lives in MonthlyInsightsList, rendered
 * separately so the two can be placed at different points on the page.
 */
export function MonthlyReviewCard({ review }: { review: MonthlyReview }) {
  return (
    <div className="mb-6">
      <div className="mb-2 px-4 text-[13px] font-medium uppercase tracking-wide text-ios-label-secondary md:px-0">
        Monthly Review
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Income" value={review.totalIncome} tone="green" />
          <Stat label="Expense" value={review.totalExpense} tone="red" />
          <Stat label="Net" value={review.net} tone={review.net >= 0 ? "green" : "red"} emphasize />
        </div>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  emphasize,
}: {
  label: string;
  value: number;
  tone: "green" | "red";
  emphasize?: boolean;
}) {
  return (
    <div>
      <div className="text-[12px] text-ios-label-secondary">{label}</div>
      <Money
        value={value}
        stacked
        className={
          "font-semibold " +
          (emphasize ? "text-[17px] " : "text-[15px] ") +
          (tone === "green" ? "text-ios-green" : "text-ios-red")
        }
      />
    </div>
  );
}
