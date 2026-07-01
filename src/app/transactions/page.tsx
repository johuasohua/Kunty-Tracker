import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export default function TransactionsPage() {
  return (
    <div className="px-4 md:px-0">
      <PageHeader title="Transactions" />
      <EmptyState
        title="No transactions yet"
        subtitle="Quick-add on mobile, full entry form on desktop, and filters by date/category/person/method land in the next phase."
      />
    </div>
  );
}
