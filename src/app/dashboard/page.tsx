import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export default function DashboardPage() {
  return (
    <div className="px-4 md:px-0">
      <PageHeader title="Dashboard" />
      <EmptyState
        title="Dashboard coming next"
        subtitle="Monthly & annual spend breakdowns, budgets vs. actuals, and balance trends land in the next phase."
      />
    </div>
  );
}
