"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { VoiceFlow } from "@/components/voice/VoiceFlow";

export default function VoicePage() {
  const router = useRouter();

  function close() {
    // Return to wherever the user launched from; fall back to the dashboard.
    if (window.history.length > 1) router.back();
    else router.push("/dashboard");
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ios-bg">
      <div className="safe-top flex items-center justify-between px-4 py-3">
        <h1 className="text-[20px] font-bold text-ios-label">Speak Transaction</h1>
        <button
          onClick={close}
          aria-label="Close"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-ios-fill text-ios-label"
        >
          <X size={18} />
        </button>
      </div>

      <div className="momentum-scroll safe-bottom flex-1 overflow-y-auto px-4 pb-8 pt-4">
        <VoiceFlow onClose={close} />
      </div>
    </div>
  );
}
