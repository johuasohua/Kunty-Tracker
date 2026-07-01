"use client";

import { usePathname, useRouter } from "next/navigation";
import { Mic } from "lucide-react";

export function MicFAB() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname.startsWith("/voice") || pathname.startsWith("/login")) {
    return null;
  }

  return (
    <button
      aria-label="Log expense by voice"
      onClick={() => router.push("/voice")}
      className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ios-blue text-white shadow-lg active:opacity-80 md:hidden"
    >
      <Mic size={24} />
    </button>
  );
}
