"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Mic } from "lucide-react";
import { primaryNavItems, secondaryNavItems } from "./nav-items";
import { ProfileSwitcher } from "./ProfileSwitcher";
import { useProfile } from "@/lib/profile-context";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { activePerson } = useProfile();

  const renderItem = (item: (typeof primaryNavItems)[number]) => {
    const active =
      pathname === item.href || pathname.startsWith(item.href + "/");
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={clsx(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] font-medium",
          active
            ? "bg-ios-blue/10 text-ios-blue"
            : "text-ios-label hover:bg-ios-fill-secondary"
        )}
      >
        <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
        {item.label}
      </Link>
    );
  };

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-ios-separator bg-ios-bg-secondary px-3 py-6 md:flex">
      <div className="mb-6 px-3 text-[20px] font-bold text-ios-label">
        Kunty Tracker
      </div>

      <button
        onClick={() => router.push("/voice")}
        className="mb-6 flex items-center justify-center gap-2 rounded-xl bg-ios-blue px-3 py-2.5 text-[15px] font-semibold text-white active:opacity-80"
      >
        <Mic size={18} />
        Log Expense
      </button>

      <nav className="flex flex-1 flex-col gap-1">
        {primaryNavItems.map(renderItem)}
        <div className="my-3 border-t border-ios-separator" />
        {secondaryNavItems.map(renderItem)}
      </nav>

      <div className="mt-3 flex items-center justify-between border-t border-ios-separator px-3 pt-3">
        <span className="text-[13px] text-ios-label-secondary">
          Logged in as {activePerson?.name ?? "—"}
        </span>
        <ProfileSwitcher />
      </div>
    </aside>
  );
}
