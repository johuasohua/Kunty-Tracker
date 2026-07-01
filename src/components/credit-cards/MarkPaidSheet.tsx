"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { upsertCcPayment } from "@/lib/queries/cc";
import type { Person } from "@/lib/types";
import { monthKey } from "@/lib/format";

function currentMonthISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function MarkPaidSheet({
  person,
  existingAmount,
  onClose,
  onSaved,
}: {
  person: Person | null;
  existingAmount?: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (person) {
      setAmount(existingAmount ? String(existingAmount) : "");
      setNote("");
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person]);

  async function handleSave() {
    if (!person) return;
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      setError("Enter a valid amount");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await upsertCcPayment({
        person_id: person.id,
        month: currentMonthISO(),
        amount_paid: parsed,
        note: note || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const monthLabel = person ? monthKey(new Date()) : "";

  return (
    <Sheet
      open={!!person}
      onClose={onClose}
      title={person ? `${person.name}'s CC Payment` : ""}
    >
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-ios-label-secondary">
          Amount actually paid off {person?.name}&apos;s credit card for{" "}
          {monthLabel}.
        </p>
        <div>
          <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
            Amount Paid (AED)
          </label>
          <input
            autoFocus
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-xl border border-ios-separator bg-ios-bg px-4 py-3 text-[20px] font-semibold text-ios-label outline-none focus:border-ios-blue"
          />
        </div>
        <div>
          <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
            Note (optional)
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-xl border border-ios-separator bg-ios-bg px-4 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
          />
        </div>
        {error && <p className="text-[13px] text-ios-red">{error}</p>}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </Sheet>
  );
}
