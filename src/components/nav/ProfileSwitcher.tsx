"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { useProfile } from "@/lib/profile-context";

function initials(name: string) {
  return name.slice(0, 1).toUpperCase();
}

export function ProfileSwitcher() {
  const { people, activePerson, setActivePersonId, loading, refreshPeople } =
    useProfile();
  const [open, setOpen] = useState(false);

  // Profiles failed to load (rather than just still loading) — show a
  // visible retry instead of silently rendering nothing, so this is
  // diagnosable instead of looking like "the app doesn't know who I am".
  if (!activePerson) {
    if (loading) return null;
    return (
      <button
        onClick={() => refreshPeople()}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-ios-fill text-ios-red"
        aria-label="Couldn't load profiles — tap to retry"
        title="Couldn't load profiles — tap to retry"
      >
        !
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-[15px] font-semibold text-white active:opacity-70"
        style={{ backgroundColor: activePerson.color }}
        aria-label="Switch profile"
      >
        {initials(activePerson.name)}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl bg-ios-bg-secondary py-1 shadow-lg ring-1 ring-black/5">
            {people.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setActivePersonId(p.id);
                  setOpen(false);
                }}
                className={clsx(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-[15px] active:bg-ios-fill",
                  p.id === activePerson.id
                    ? "font-semibold text-ios-blue"
                    : "text-ios-label"
                )}
              >
                <span
                  className="h-5 w-5 shrink-0 rounded-full text-center text-[11px] font-semibold leading-5 text-white"
                  style={{ backgroundColor: p.color }}
                >
                  {initials(p.name)}
                </span>
                {p.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
