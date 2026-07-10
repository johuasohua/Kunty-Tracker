"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const [mode, setMode] = useState<"password" | "link">("password");

  // Password sign-in — completes entirely in the current context (no email
  // round-trip), so it's the reliable path for the installed Home Screen
  // app, where iOS gives the standalone app its own storage separate from
  // Safari and email links always open in Safari, never the installed app.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    setSigningIn(true);
    setPasswordError("");
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // AppShell picks up the new session via onAuthStateChange and redirects.
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Invalid email or password"
      );
    } finally {
      setSigningIn(false);
    }
  }

  // Email-link sign-in — works fine in a normal Safari tab, but the link
  // always opens in Safari even when requested from the installed Home
  // Screen app, so it can't complete a login started there.
  const [linkEmail, setLinkEmail] = useState("");
  const [linkStatus, setLinkStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [linkError, setLinkError] = useState("");

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault();
    setLinkStatus("sending");
    setLinkError("");
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: linkEmail,
        options: {
          emailRedirectTo:
            typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (error) throw error;
      setLinkStatus("sent");
    } catch (err) {
      setLinkStatus("error");
      setLinkError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ios-bg px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ios-blue text-[28px] font-bold text-white">
            K
          </div>
          <h1 className="text-[22px] font-bold text-ios-label">Kunty</h1>
          <p className="text-center text-[14px] text-ios-label-secondary">
            Josh &amp; Kiki&apos;s household finance tracker.
          </p>
        </div>

        {mode === "password" ? (
          <form onSubmit={handlePasswordSignIn} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-ios-separator bg-ios-bg-secondary px-4 py-3 text-[15px] text-ios-label outline-none focus:border-ios-blue"
            />
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-ios-separator bg-ios-bg-secondary px-4 py-3 text-[15px] text-ios-label outline-none focus:border-ios-blue"
            />
            {passwordError && (
              <p className="text-[13px] text-ios-red">{passwordError}</p>
            )}
            <Button type="submit" disabled={signingIn}>
              {signingIn ? "Signing in…" : "Sign In"}
            </Button>
            <button
              type="button"
              onClick={() => setMode("link")}
              className="text-center text-[13px] font-medium text-ios-blue"
            >
              Use an email link instead
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            {linkStatus === "sent" ? (
              <div className="rounded-2xl bg-ios-bg-secondary p-5 text-center">
                <p className="text-[15px] font-medium text-ios-label">
                  Check your inbox
                </p>
                <p className="mt-1 text-[13px] text-ios-label-secondary">
                  We sent a sign-in link to {linkEmail}. Open it in Safari to
                  continue — email links can&apos;t open the installed
                  Home Screen app directly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendLink} className="flex flex-col gap-3">
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={linkEmail}
                  onChange={(e) => setLinkEmail(e.target.value)}
                  className="rounded-xl border border-ios-separator bg-ios-bg-secondary px-4 py-3 text-[15px] text-ios-label outline-none focus:border-ios-blue"
                />
                {linkStatus === "error" && (
                  <p className="text-[13px] text-ios-red">{linkError}</p>
                )}
                <Button type="submit" disabled={linkStatus === "sending"}>
                  {linkStatus === "sending" ? "Sending link…" : "Send sign-in link"}
                </Button>
              </form>
            )}
            <button
              type="button"
              onClick={() => setMode("password")}
              className="text-center text-[13px] font-medium text-ios-blue"
            >
              Use password instead
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
