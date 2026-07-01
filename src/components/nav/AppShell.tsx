"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "./Sidebar";
import { TabBar } from "./TabBar";
import { TopBar } from "./TopBar";
import { MicFAB } from "./MicFAB";

const PUBLIC_ROUTES = ["/login"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  useEffect(() => {
    if (loading) return;
    if (!session && !isPublicRoute) {
      router.replace("/login");
    }
    if (session && isPublicRoute) {
      router.replace("/dashboard");
    }
  }, [loading, session, isPublicRoute, router]);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (loading || !session) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-ios-bg">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-ios-blue border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-ios-bg">
      <Sidebar />
      <TopBar />
      <main className="pb-24 md:ml-64 md:pb-10">
        <div className="mx-auto max-w-6xl px-0 py-4 md:px-8 md:py-8">
          {children}
        </div>
      </main>
      <TabBar />
      <MicFAB />
    </div>
  );
}
