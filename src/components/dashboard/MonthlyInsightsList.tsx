"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Card, GroupedSection } from "@/components/ui/Card";
import { formatMoney } from "@/lib/format";
import type { CashDeployment, ReviewItem } from "@/lib/aggregate";

/**
 * Plain-language list of anomalies, spikes and budget variance for the
 * selected month, each with a simple recommendation and (where relevant) a
 * tap-through to the underlying transactions. The cash-deployment nudge
 * (savings above the buffer) renders as part of this same section.
 */
export function MonthlyInsightsList({
  items,
  monthKey,
  cashNudge,
}: {
  items: ReviewItem[];
  monthKey: string;
  cashNudge?: CashDeployment | null;
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
        Insights
      </div>

      {items.length === 0 ? (
        <Card className="mb-3 p-4">
          <p className="text-[14px] text-ios-label-secondary">
            Nothing notable this month — no spikes, anomalies, or budget overruns.
          </p>
        </Card>
      ) : (
        <div className="mb-3">
          <GroupedSection>
            {items.map((item, i) => (
              <ReviewRow
                key={item.id}
                item={item}
                last={i === items.length - 1}
                onClick={() => goToCategory(item.categoryId)}
              />
            ))}
          </GroupedSection>
        </div>
      )}

      {cashNudge && (
        <Link href="/savings" className="block">
          <Card className="flex items-center gap-3 p-4 active:bg-ios-fill-secondary">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: "#30B0C726", color: "#30B0C7" }}
            >
              <Sparkles size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold text-ios-label">
                {formatMoney(cashNudge.surplus)} ready to put to work
              </div>
              <div className="text-[13px] text-ios-label-secondary">
                Savings are above your {formatMoney(cashNudge.floor)} buffer —
                see how to deploy it.
              </div>
            </div>
            <ChevronRight size={18} className="shrink-0 text-ios-label-tertiary" />
          </Card>
        </Link>
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

function monthRangeFromKey(key: string): [string, string] {
  const [y, m] = key.split("-").map(Number);
  const from = `${key}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const to = `${key}-${String(lastDay).padStart(2, "0")}`;
  return [from, to];
}
