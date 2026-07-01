import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export default function MortgagePage() {
  return (
    <div className="px-4 md:px-0">
      <PageHeader title="Mortgage" />
      <EmptyState
        title="Mortgage tracker coming next"
        subtitle="Balance-over-time chart, offset trend, cumulative interest saved, and the full payment history table land in the next phase."
      />
    </div>
  );
}
