"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { getSupabaseClient } from "@/lib/supabase/client";

/**
 * Re-authenticates with the current password before setting the new one —
 * Supabase's updateUser() only needs an active session, so without this
 * check anyone with a few minutes of unlocked-device access could change
 * the password without knowing it.
 */
export function ChangePasswordSheet({
  open,
  onClose,
  email,
}: {
  open: boolean;
  onClose: () => void;
  email: string | undefined;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function reset() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("No account email found");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const supabase = getSupabaseClient();

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (verifyError) throw new Error("Current password is incorrect");

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={handleClose} title="Change Password">
      {success ? (
        <div className="flex flex-col gap-4">
          <p className="text-[15px] text-ios-label">
            Password updated. Use it next time you sign in.
          </p>
          <Button onClick={handleClose}>Done</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
              Current password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-ios-separator bg-ios-bg px-4 py-3 text-[15px] text-ios-label outline-none focus:border-ios-blue"
            />
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
              New password
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full rounded-xl border border-ios-separator bg-ios-bg px-4 py-3 text-[15px] text-ios-label outline-none focus:border-ios-blue"
            />
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
              Confirm new password
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-ios-separator bg-ios-bg px-4 py-3 text-[15px] text-ios-label outline-none focus:border-ios-blue"
            />
          </div>

          {error && <p className="text-[13px] text-ios-red">{error}</p>}

          <Button type="submit" disabled={saving}>
            {saving ? "Updating…" : "Update Password"}
          </Button>
        </form>
      )}
    </Sheet>
  );
}
