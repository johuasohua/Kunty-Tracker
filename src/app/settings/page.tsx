"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { GroupedSection } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { useProfile } from "@/lib/profile-context";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
  const { people, activePerson, setActivePersonId } = useProfile();
  const { session } = useAuth();

  async function handleSignOut() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  }

  return (
    <div className="px-4 md:px-0">
      <PageHeader title="Settings" />

      <GroupedSection title="Account">
        <ListRow label="Signed in as" value={session?.user.email} last />
      </GroupedSection>

      <GroupedSection title="Active Profile" footer="Tags every new entry until you switch.">
        {people.map((p, i) => (
          <ListRow
            key={p.id}
            label={p.name}
            value={p.id === activePerson?.id ? "Active" : undefined}
            valueClassName={p.id === activePerson?.id ? "text-ios-blue font-medium" : undefined}
            onClick={() => setActivePersonId(p.id)}
            last={i === people.length - 1}
          />
        ))}
      </GroupedSection>

      <GroupedSection title="Categories, Budgets & Recurring Bills" footer="Managing these directly lands in a later phase — for now they're seeded via the historical data import.">
        <ListRow label="Manage categories" chevron last={false} />
        <ListRow label="Manage recurring bills" chevron last={true} />
      </GroupedSection>

      <GroupedSection title="iOS Shortcuts" footer="Generate a personal API token to log expenses from the Lock Screen or Siri. Lands in a later phase.">
        <ListRow label="Generate Shortcuts token" chevron last />
      </GroupedSection>

      <button
        onClick={handleSignOut}
        className="mt-2 w-full rounded-2xl bg-ios-bg-secondary px-4 py-3 text-center text-[15px] font-medium text-ios-red active:opacity-70"
      >
        Sign Out
      </button>
    </div>
  );
}
