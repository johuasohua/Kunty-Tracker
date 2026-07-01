import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export default function BudgetsPage() {
  return (
    <div className="px-4 md:px-0">
      <PageHeader title="Budgets" />
      <EmptyState
        title="Budgets coming next"
        subtitle="Per-category and per-person sub-budgets with iOS-style progress rings land in a later phase."
      />
    </div>
  );
}
