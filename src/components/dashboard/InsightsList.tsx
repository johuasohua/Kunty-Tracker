import { TrendingUp } from "lucide-react";
import { GroupedSection } from "@/components/ui/Card";
import type { CategoryInsight } from "@/lib/aggregate";

export function InsightsList({ insights }: { insights: CategoryInsight[] }) {
  if (insights.length === 0) return null;

  return (
    <GroupedSection title="Insights">
      {insights.map((insight, i) => (
        <div
          key={insight.categoryId}
          className={
            "flex items-start gap-3 px-4 py-3 " +
            (i < insights.length - 1 ? "border-b border-ios-separator" : "")
          }
        >
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ios-orange/15 text-ios-orange">
            <TrendingUp size={13} />
          </div>
          <p className="text-[14px] text-ios-label">
            <span className="font-medium">{insight.categoryName}</span> is{" "}
            {Math.round(insight.percentDelta * 100)}% above your 3-month
            average.
          </p>
        </div>
      ))}
    </GroupedSection>
  );
}
