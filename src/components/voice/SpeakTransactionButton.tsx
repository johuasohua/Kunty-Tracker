"use client";

import { useRouter } from "next/navigation";
import { Mic } from "lucide-react";
import { clsx } from "clsx";

/**
 * Prominent entry point into the voice workflow, placed on the Dashboard,
 * Transactions and Credit Cards screens. Routes to the full-screen /voice
 * flow (the same destination as the mobile mic FAB).
 */
export function SpeakTransactionButton({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/voice")}
      className={clsx(
        "flex w-full items-center justify-center gap-2 rounded-2xl bg-ios-blue px-4 py-3 text-[16px] font-semibold text-white shadow-sm transition-opacity active:opacity-80",
        className
      )}
    >
      <Mic size={18} />
      Speak Transaction
    </button>
  );
}
