"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="safe-bottom relative flex max-h-[90dvh] w-full flex-col rounded-t-2xl bg-ios-bg-secondary md:max-h-[85dvh] md:w-[480px] md:rounded-2xl">
        <div className="flex items-center justify-between border-b border-ios-separator px-4 py-3">
          <span className="text-[17px] font-semibold text-ios-label">
            {title}
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-ios-fill text-ios-label-secondary"
          >
            <X size={16} />
          </button>
        </div>
        <div className="momentum-scroll overflow-y-auto px-4 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
