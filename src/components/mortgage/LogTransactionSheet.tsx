"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useProfile } from "@/lib/profile-context";
import { createMortgagePayment } from "@/lib/queries/mortgage";
import { createTransaction } from "@/lib/queries/transactions";
import { syncOffsetMortgageDeduction } from "@/lib/queries/offset";
import type { MortgagePayment } from "@/lib/types";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

type TabType = "mortgage" | "offset";

export function LogTransactionSheet({
  open,
  onClose,
  onSaved,
  lastPayment,
  offsetCategoryId,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  lastPayment: MortgagePayment | null;
  offsetCategoryId: string | undefined;
}) {
  const { activePerson } = useProfile();
  const [tab, setTab] = useState<TabType>("mortgage");

  // Mortgage payment fields
  const [mortgageDate, setMortgageDate] = useState(todayISO());
  const [principal, setPrincipal] = useState("");
  const [interest, setInterest] = useState("");
  const [insurance, setInsurance] = useState("");
  const [interestSaved, setInterestSaved] = useState("");

  // Offset deposit fields
  const [offsetDate, setOffsetDate] = useState(todayISO());
  const [offsetAmount, setOffsetAmount] = useState("");
  const [offsetNote, setOffsetNote] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setMortgageDate(todayISO());
    setPrincipal("");
    setInterest("");
    setInsurance(lastPayment ? String(lastPayment.insurance_amount) : "");
    setInterestSaved("");
    setOffsetDate(todayISO());
    setOffsetAmount("");
    setOffsetNote("");
    setError("");
  }, [open, lastPayment]);

  async function handleSaveMortgage() {
    if (!principal || !interest) {
      setError("Principal and interest are required");
      return;
    }

    const principalNum = parseFloat(principal) || 0;
    const interestNum = parseFloat(interest) || 0;
    const insuranceNum = parseFloat(insurance) || 0;
    const interestSavedNum = parseFloat(interestSaved) || 0;

    setSaving(true);
    setError("");
    try {
      const opening = lastPayment?.closing_principal ?? 0;
      const offsetOpening = lastPayment?.offset_closing_balance ?? null;
      const hoiAmount = lastPayment?.hoi_charge ?? 105;
      const totalPayment = principalNum + interestNum + insuranceNum + hoiAmount;
      const offsetClosing = offsetOpening !== null ? offsetOpening - totalPayment : null;

      await createMortgagePayment({
        period_no: (lastPayment?.period_no ?? 0) + 1,
        payment_date: mortgageDate,
        opening_principal: opening,
        principal_amount: principalNum,
        interest_amount: interestNum,
        insurance_amount: insuranceNum,
        hoi_charge: hoiAmount,
        closing_principal: opening - principalNum,
        offset_opening_balance: offsetOpening,
        offset_closing_balance: offsetClosing,
        interest_saved: interestSavedNum || null,
      });
      await syncOffsetMortgageDeduction({
        totalPayment,
        occurredOn: mortgageDate,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveOffset() {
    if (!offsetAmount) {
      setError("Amount is required");
      return;
    }

    if (!offsetCategoryId) {
      setError("Offset category not found");
      return;
    }

    if (!activePerson?.id) {
      setError("No profile selected");
      return;
    }

    const amount = parseFloat(offsetAmount) || 0;
    if (amount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await createTransaction({
        type: "expense",
        category_id: offsetCategoryId,
        amount,
        occurred_on: offsetDate,
        note: offsetNote || null,
        payment_method: "debit",
        person_id: activePerson.id,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Log Transaction">
      <div className="flex flex-col gap-4">
        <SegmentedControl
          value={tab}
          onChange={(v) => {
            setTab(v as TabType);
            setError("");
          }}
          options={[
            { value: "mortgage", label: "Mortgage Payment" },
            { value: "offset", label: "Offset Deposit" },
          ]}
        />

        {tab === "mortgage" ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Payment Date">
                <input
                  type="date"
                  value={mortgageDate}
                  onChange={(e) => setMortgageDate(e.target.value)}
                  className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3.5 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
                />
              </Field>
              <div />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Principal">
                <input
                  inputMode="decimal"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3.5 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
                />
              </Field>
              <Field label="Interest">
                <input
                  inputMode="decimal"
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3.5 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Insurance">
                <input
                  inputMode="decimal"
                  value={insurance}
                  onChange={(e) => setInsurance(e.target.value)}
                  className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3.5 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
                />
              </Field>
              <Field label="Interest Saved">
                <input
                  inputMode="decimal"
                  value={interestSaved}
                  onChange={(e) => setInterestSaved(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3.5 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
                />
              </Field>
            </div>

            <div className="rounded-xl bg-ios-fill px-3 py-2 text-[12px] text-ios-label-secondary">
              HOI: {(lastPayment?.hoi_charge ?? 105).toFixed(2)} AED (fixed monthly)
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Deposit Date">
                <input
                  type="date"
                  value={offsetDate}
                  onChange={(e) => setOffsetDate(e.target.value)}
                  className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3.5 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
                />
              </Field>
              <Field label="Amount">
                <input
                  inputMode="decimal"
                  value={offsetAmount}
                  onChange={(e) => setOffsetAmount(e.target.value)}
                  className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3.5 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
                />
              </Field>
            </div>

            <Field label="Note (optional)">
              <input
                value={offsetNote}
                onChange={(e) => setOffsetNote(e.target.value)}
                placeholder="e.g. transferred from current account"
                className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3.5 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
              />
            </Field>
          </>
        )}

        {error && <p className="text-[13px] text-ios-red">{error}</p>}

        <Button
          onClick={tab === "mortgage" ? handleSaveMortgage : handleSaveOffset}
          disabled={saving}
        >
          {saving ? "Saving…" : `Log ${tab === "mortgage" ? "Payment" : "Deposit"}`}
        </Button>
      </div>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[12px] font-medium text-ios-label-secondary">
        {label}
      </label>
      {children}
    </div>
  );
}
