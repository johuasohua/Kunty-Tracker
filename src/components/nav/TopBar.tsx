"use client";

import { ProfileSwitcher } from "./ProfileSwitcher";

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ios-separator bg-ios-bg/80 px-4 py-2.5 backdrop-blur-lg safe-top md:hidden">
      <span className="text-[17px] font-semibold text-ios-label">
        Kunty
      </span>
      <ProfileSwitcher />
    </header>
  );
}
