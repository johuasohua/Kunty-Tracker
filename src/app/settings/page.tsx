"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { GroupedSection } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { useProfile } from "@/lib/profile-context";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ChangePasswordSheet } from "@/components/settings/ChangePasswordSheet";

export default function SettingsPage() {
  const { people, activePerson, setActivePersonId, profileLocked } =
    useProfile();
  const { session } = useAuth();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  async function handleSignOut() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  }

  return (
    <div className="px-4 md:px-0">
      <PageHeader title="Settings" />

      <GroupedSection title="Account">
        <ListRow label="Signed in as" value={session?.user.email} />
        <ListRow
          label="Change password"
          chevron
          last
          onClick={() => setChangePasswordOpen(true)}
        />
      </GroupedSection>

      {profileLocked ? (
        <GroupedSection
          title="Your Profile"
          footer="Auto-detected from your login — every entry you add is tagged to you."
        >
          <ListRow
            label={activePerson?.name ?? "—"}
            value="You"
            valueClassName="text-ios-blue font-medium"
            last
          />
        </GroupedSection>
      ) : (
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
      )}

      <GroupedSection
        title="Categories, Budgets & Recurring Bills"
        footer="Rename, recolor, reorder, or hide categories — changes apply everywhere immediately. Budgets are managed on the Budgets tab."
      >
        <Link href="/settings/categories">
          <ListRow label="Manage categories" chevron last={false} />
        </Link>
        <Link href="/recurring">
          <ListRow label="Manage recurring bills" chevron last={true} />
        </Link>
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

      <ChangePasswordSheet
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        email={session?.user.email}
      />
    </div>
  );
}
