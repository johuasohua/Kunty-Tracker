import { PageHeader } from "@/components/ui/PageHeader";
import { GroupedSection } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import Link from "next/link";

export default function MorePage() {
  return (
    <div className="px-4 md:px-0">
      <PageHeader title="More" />
      <GroupedSection>
        <Link href="/recurring">
          <ListRow label="Recurring Bills" chevron />
        </Link>
        <Link href="/settings">
          <ListRow label="Settings" chevron last />
        </Link>
      </GroupedSection>
    </div>
  );
}
