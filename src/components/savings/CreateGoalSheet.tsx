"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { createGoal } from "@/lib/queries/goals";

export function CreateGoalSheet({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName("");
    setTargetAmount("");
    setTargetDate("");
    setError("");
  }, [open]);

  async function handleSave() {
    if (!name.trim()) {
      setError("Enter a goal name");
      return;
    }
    const amount = parseFloat(targetAmount);
    if (!amount || amount <= 0) {
      setError("Enter a valid target amount");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createGoal({
        name: name.trim(),
        target_amount: amount,
        priority_order: 0,
        target_date: targetDate || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create goal");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Create Goal">
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
            Goal Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Honeymoon Fund"
            className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3.5 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
          />
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
            Target Amount (AED)
          </label>
          <input
            type="number"
            inputMode="decimal"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="e.g., 50000"
            className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3.5 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
          />
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
            Target Date (Optional)
          </label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3.5 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
          />
        </div>

        {error && <p className="text-[13px] text-ios-red">{error}</p>}

        <Button onClick={handleSave} disabled={saving || !name.trim()} className="w-full">
          {saving ? "Creating…" : "Create Goal"}
        </Button>
      </div>
    </Sheet>
  );
}
