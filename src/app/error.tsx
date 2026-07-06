"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ios-orange/15 text-ios-orange">
        <AlertTriangle size={26} />
      </div>
      <div>
        <h2 className="text-[17px] font-semibold text-ios-label">
          Something went wrong
        </h2>
        <p className="mt-1 max-w-xs text-[14px] text-ios-label-secondary">
          The page hit an unexpected error. Your data is safe — try again, and
          if it keeps happening check your connection.
        </p>
        {error.digest && (
          <p className="mt-1 text-[11px] text-ios-label-tertiary">
            Ref: {error.digest}
          </p>
        )}
      </div>
      <button
        onClick={() => unstable_retry()}
        className="rounded-xl bg-ios-blue px-5 py-2.5 text-[15px] font-semibold text-white active:opacity-70"
      >
        Try again
      </button>
    </div>
  );
}
