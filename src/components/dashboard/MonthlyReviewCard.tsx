"use client";

import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronRight,
} from "lucide-react";
import { Card, GroupedSection } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import type { MonthlyReview, ReviewItem } from "@/lib/aggregate";

/**
 * The Monthly Review: a headline cash-flow tile plus a plain-language list of
 * anomalies, spikes and budget variance, each with a simple recommendation and
 * (where relevant) a tap-through to the underlying transactions.
 */
export function MonthlyReviewCard({
  review,
  monthKey,
}: {
  review: MonthlyReview;
  monthKey: string;
}) {
  const router = useRouter();
  const [from, to] = monthRangeFromKey(monthKey);

  const goToCategory = (categoryId?: string) => {
    if (!categoryId) return;
    router.push(`/transactions?category=${categoryId}&from=${from}&to=${to}`);
  };

  return (
    <div className="mb-6">
      <div className="mb-2 px-4 text-[13px] font-medium uppercase tracking-wide text-ios-label-secondary md:px-0">
        Monthly Review
      </div>

      {/* Headline cash-flow */}
      <Card className="mb-3 p-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Income" value={review.totalIncome} tone="green" />
          <Stat label="Expense" value={review.totalExpense} tone="red" />
          <Stat label="Net" value={review.net} tone={review.net >= 0 ? "green" : "red"} emphasize />
        </div>
        {review.expenseDelta !== null && (
          <div className="mt-3 flex items-center gap-1 border-t border-ios-separator pt-3 text-[13px]">
            {review.expenseDelta > 0.001 ? (
              <TrendingUp size={14} className="text-ios-red" />
            ) : review.expenseDelta < -0.001 ? (
              <TrendingDown size={14} className="text-ios-green" />
            ) : null}
            <span className="text-ios-label-secondary">
              Spending {review.expenseDelta >= 0 ? "up" : "down"}{" "}
              <span
                className={
                  review.expenseDelta >= 0 ? "font-medium text-ios-red" : "font-medium text-ios-green"
                }
              >
                {Math.abs(Math.round(review.expenseDelta * 100))}%
              </span>{" "}
              vs last month
            </span>
          </div>
        )}
      </Card>

      {review.items.length === 0 ? (
        <Card className="p-4">
          <p className="text-[14px] text-ios-label-secondary">
            Nothing notable this month — no spikes, anomalies, or budget overruns.
          </p>
        </Card>
      ) : (
        <GroupedSection>
          {review.items.map((item, i) => (
            <ReviewRow
              key={item.id}
              item={item}
              last={i === review.items.length - 1}
              onClick={() => goToCategory(item.categoryId)}
            />
          ))}
        </GroupedSection>
      )}
    </div>
  );
}

function ReviewRow({
  item,
  last,
  onClick,
}: {
  item: ReviewItem;
  last: boolean;
  onClick: () => void;
}) {
  const tappable = !!item.categoryId;
  const content = (
    <>
      <ReviewIcon item={item} />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-ios-label">{item.title}</p>
        <p className="text-[13px] text-ios-label-secondary">{item.detail}</p>
        {item.recommendation && (
          <p className="mt-0.5 text-[13px] text-ios-blue">{item.recommendation}</p>
        )}
      </div>
      {tappable && <ChevronRight size={16} className="mt-0.5 shrink-0 text-ios-label-tertiary" />}
    </>
  );

  const className =
    "flex w-full items-start gap-3 px-4 py-3 text-left " +
    (last ? "" : "border-b border-ios-separator ") +
    (tappable ? "active:bg-ios-fill" : "");

  return tappable ? (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}

function ReviewIcon({ item }: { item: ReviewItem }) {
  // Forecast items are forward-looking — a trend icon reads clearer than a
  // generic info/warning dot, tinted by severity (orange = at risk).
  if (item.kind === "forecast") {
    const tone =
      item.severity === "warn" ? "bg-ios-orange/15 text-ios-orange" : "bg-ios-blue/15 text-ios-blue";
    return (
      <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${tone}`}>
        <TrendingUp size={13} />
      </div>
    );
  }
  if (item.severity === "good") {
    return (
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ios-green/15 text-ios-green">
        <CheckCircle2 size={13} />
      </div>
    );
  }
  if (item.severity === "info") {
    return (
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ios-blue/15 text-ios-blue">
        <Info size={13} />
      </div>
    );
  }
  return (
    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ios-orange/15 text-ios-orange">
      <AlertTriangle size={13} />
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

function monthRangeFromKey(key: string): [string, string] {
  const [y, m] = key.split("-").map(Number);
  const from = `${key}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const to = `${key}-${String(lastDay).padStart(2, "0")}`;
  return [from, to];
}
