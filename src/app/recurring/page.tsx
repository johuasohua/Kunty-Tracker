import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export default function RecurringPage() {
  return (
    <div className="px-4 md:px-0">
      <PageHeader title="Recurring Bills" />
      <EmptyState
        title="Recurring bills coming next"
        subtitle="DEWA, DU, Zenner, Spotify, Netflix and friends — with a 'due in 7 days' view — land in a later phase."
      />
    </div>
  );
}
