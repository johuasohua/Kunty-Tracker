import {
  LayoutGrid,
  List,
  Landmark,
  PiggyBank,
  Repeat,
  Settings,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
}

// Primary items shown in both the mobile tab bar and the desktop sidebar.
export const primaryNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/transactions", label: "Transactions", icon: List },
  { href: "/mortgage", label: "Mortgage", icon: Landmark },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
];

// Only surfaced in the desktop sidebar and the mobile "More" tab.
export const secondaryNavItems: NavItem[] = [
  { href: "/recurring", label: "Recurring Bills", icon: Repeat },
  { href: "/settings", label: "Settings", icon: Settings },
];
