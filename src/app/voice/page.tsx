"use client";

import { useRouter } from "next/navigation";
import { Mic, X } from "lucide-react";

export default function VoicePage() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ios-bg px-6">
      <button
        onClick={() => router.back()}
        aria-label="Close"
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-ios-fill text-ios-label safe-top"
      >
        <X size={18} />
      </button>

      <button
        disabled
        className="flex h-28 w-28 items-center justify-center rounded-full bg-ios-blue text-white opacity-50 shadow-xl"
      >
        <Mic size={44} />
      </button>

      <p className="mt-6 max-w-xs text-center text-[15px] text-ios-label-secondary">
        Voice capture (&ldquo;eighty dirhams zomato dinner&rdquo;) lands in a
        later phase — it&apos;ll parse your speech into amount, category, and
        note automatically.
      </p>
    </div>
  );
}
