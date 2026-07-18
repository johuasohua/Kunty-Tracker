"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { updateMortgagePayment } from "@/lib/queries/mortgage";
import type { MortgagePayment } from "@/lib/types";

export function EditPaymentSheet({
  open,
  onClose,
  onSaved,
  payment,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  payment: MortgagePayment | null;
}) {
  const [paymentDate, setPaymentDate] = useState("");
  const [openingPrincipal, setOpeningPrincipal] = useState("");
  const [principal, setPrincipal] = useState("");
  const [interest, setInterest] = useState("");
  const [insurance, setInsurance] = useState("");
  const [hoi, setHoi] = useState("");
  const [offsetOpening, setOffsetOpening] = useState("");
  const [offsetClosing, setOffsetClosing] = useState("");
  const [interestSaved, setInterestSaved] = useState("");
  const [offsetTxAmount, setOffsetTxAmount] = useState("");
  const [offsetNote, setOffsetNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !payment) return;
    setPaymentDate(payment.payment_date);
    setOpeningPrincipal(String(payment.opening_principal));
    setPrincipal(String(payment.principal_amount));
    setInterest(String(payment.interest_amount));
    setInsurance(String(payment.insurance_amount));
    setHoi(String(payment.hoi_charge));
    setOffsetOpening(
      payment.offset_opening_balance != null ? String(payment.offset_opening_balance) : ""
    );
    setOffsetClosing(
      payment.offset_closing_balance != null ? String(payment.offset_closing_balance) : ""
    );
    setInterestSaved(payment.interest_saved != null ? String(payment.interest_saved) : "");
    setOffsetTxAmount(
      payment.offset_transaction_amount != null ? String(payment.offset_transaction_amount) : ""
    );
    setOffsetNote(payment.offset_note ?? "");
    setError("");
  }, [open, payment]);

  const openingNum = parseFloat(openingPrincipal) || 0;
  const principalNum = parseFloat(principal) || 0;

  const closingPreview = openingNum - principalNum;

  async function handleSave() {
    if (!payment) return;
    if (!openingPrincipal || !principal || !interest) {
      setError("Opening principal, principal, and interest are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateMortgagePayment(payment.id, {
        payment_date: paymentDate,
        opening_principal: openingNum,
        principal_amount: principalNum,
        interest_amount: parseFloat(interest) || 0,
        insurance_amount: parseFloat(insurance) || 0,
        hoi_charge: parseFloat(hoi) || 0,
        closing_principal: closingPreview,
        offset_opening_balance: offsetOpening ? parseFloat(offsetOpening) : null,
        offset_closing_balance: offsetClosing ? parseFloat(offsetClosing) : null,
        interest_saved: interestSaved ? parseFloat(interestSaved) : null,
        offset_transaction_amount: offsetTxAmount ? parseFloat(offsetTxAmount) : null,
        offset_note: offsetNote || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (!payment) return null;

  return (
    <Sheet open={open} onClose={onClose} title="Edit Payment Period">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Payment Date">
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3.5 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
            />
          </Field>
          <Field label="Opening Principal">
            <input
              inputMode="decimal"
              value={openingPrincipal}
              onChange={(e) => setOpeningPrincipal(e.target.value)}
              className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3.5 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
            />
          </Field>
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
          <Field label="Insurance (Life + Property)">
            <input
              inputMode="decimal"
              value={insurance}
              onChange={(e) => setInsurance(e.target.value)}
              className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3.5 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
            />
          </Field>
          <Field label="HOI Charge">
            <input
              inputMode="decimal"
              value={hoi}
              onChange={(e) => setHoi(e.target.value)}
              className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3.5 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
            />
          </Field>
        </div>

        <div className="rounded-xl bg-ios-fill px-3 py-2 text-[13px] text-ios-label-secondary">
          Closing principal (opening − principal):{" "}
          <span className="font-semibold text-ios-label">
            {closingPreview.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="border-t border-ios-separator pt-4">
          <p className="mb-3 text-[13px] font-medium text-ios-label-secondary">
            Offset Account
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Offset Opening Balance">
              <input
                inputMode="decimal"
                value={offsetOpening}
                onChange={(e) => setOffsetOpening(e.target.value)}
                className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3.5 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
              />
            </Field>
            <Field label="Offset Closing Balance">
              <input
                inputMode="decimal"
                value={offsetClosing}
                onChange={(e) => setOffsetClosing(e.target.value)}
                className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3.5 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
              />
            </Field>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Interest Saved">
              <input
                inputMode="decimal"
                value={interestSaved}
                onChange={(e) => setInterestSaved(e.target.value)}
                className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3.5 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
              />
            </Field>
            <Field label="Ad-hoc Deposit/Withdrawal">
              <input
                inputMode="decimal"
                value={offsetTxAmount}
                onChange={(e) => setOffsetTxAmount(e.target.value)}
                className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3.5 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
              />
            </Field>
          </div>
          <div className="mt-3">
            <Field label="Note">
              <input
                value={offsetNote}
                onChange={(e) => setOffsetNote(e.target.value)}
                placeholder="e.g. deposited in current account"
                className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3.5 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
              />
            </Field>
          </div>
        </div>

        {error && <p className="text-[13px] text-ios-red">{error}</p>}

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
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
