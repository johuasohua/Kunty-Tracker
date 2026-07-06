"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo:
            typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (error) throw error;
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ios-bg px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ios-blue text-[28px] font-bold text-white">
            K
          </div>
          <h1 className="text-[22px] font-bold text-ios-label">
            Kunty
          </h1>
          <p className="text-center text-[14px] text-ios-label-secondary">
            Josh &amp; Kiki&apos;s household finance tracker. Sign in with the
            email you use for this household.
          </p>
        </div>

        {status === "sent" ? (
          <div className="rounded-2xl bg-ios-bg-secondary p-5 text-center">
            <p className="text-[15px] font-medium text-ios-label">
              Check your inbox
            </p>
            <p className="mt-1 text-[13px] text-ios-label-secondary">
              We sent a sign-in link to {email}. Open it on this device to
              continue.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-ios-separator bg-ios-bg-secondary px-4 py-3 text-[15px] text-ios-label outline-none focus:border-ios-blue"
            />
            {status === "error" && (
              <p className="text-[13px] text-ios-red">{errorMessage}</p>
            )}
            <Button type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Sending link…" : "Send sign-in link"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
