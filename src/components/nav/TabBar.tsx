"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { MoreHorizontal } from "lucide-react";
import { primaryNavItems } from "./nav-items";

export function TabBar() {
  const pathname = usePathname();

  const items = [
    ...primaryNavItems,
    { href: "/more", label: "More", icon: MoreHorizontal },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ios-separator bg-ios-bg-secondary/95 backdrop-blur-lg safe-bottom md:hidden">
      <div className="flex items-stretch">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium",
                active ? "text-ios-blue" : "text-ios-label-tertiary"
              )}
            >
              <Icon size={24} strokeWidth={active ? 2.3 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
