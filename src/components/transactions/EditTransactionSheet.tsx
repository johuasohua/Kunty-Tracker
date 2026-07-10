"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { CategoryPicker } from "@/components/transactions/CategoryPicker";
import { useCategories } from "@/lib/queries/categories";
import { useProfile } from "@/lib/profile-context";
import { updateTransaction, deleteTransaction } from "@/lib/queries/transactions";
import { CURRENCY_OPTIONS, fetchAedRate } from "@/lib/currency";
import { formatMoney } from "@/lib/format";
import type { PaymentMethod, Transaction } from "@/lib/types";

export function EditTransactionSheet({
  transaction,
  onClose,
  onSaved,
}: {
  transaction: Transaction | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { categories } = useCategories();
  const { people } = useProfile();

  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("AED");
  const [rate, setRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [personId, setPersonId] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("credit");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!transaction) return;
    setDate(transaction.occurred_on);
    if (transaction.original_currency && transaction.original_amount != null) {
      setCurrency(transaction.original_currency);
      setAmount(String(transaction.original_amount));
      setRate(transaction.exchange_rate);
    } else {
      setCurrency("AED");
      setAmount(String(transaction.amount));
      setRate(null);
    }
    setCategoryId(transaction.category_id);
    setPersonId(transaction.person_id);
    setMethod(transaction.payment_method);
    setNote(transaction.note ?? "");
    setError("");
    setRateError("");
  }, [transaction]);

  // Refetch the rate only when the currency is actually changed by hand —
  // the initial load above seeds the transaction's original stored rate.
  const [currencyTouched, setCurrencyTouched] = useState(false);
  useEffect(() => {
    if (!currencyTouched) return;
    if (currency === "AED") {
      setRate(null);
      setRateError("");
      return;
    }
    let cancelled = false;
    setRateLoading(true);
    setRateError("");
    fetchAedRate(currency)
      .then((r) => {
        if (!cancelled) setRate(r);
      })
      .catch(() => {
        if (!cancelled) setRateError("Couldn't fetch exchange rate — try again");
      })
      .finally(() => {
        if (!cancelled) setRateLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency, currencyTouched]);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const parsedAmount = parseFloat(amount) || 0;
  const convertedAed = currency !== "AED" && rate ? parsedAmount * rate : null;

  async function handleSave() {
    if (!transaction) return;
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (currency !== "AED" && !rate) {
      setError(rateError || "Waiting for exchange rate — try again");
      return;
    }

    const aedAmount = currency === "AED" ? parsedAmount : (convertedAed as number);

    setSaving(true);
    setError("");
    try {
      await updateTransaction(transaction.id, {
        occurred_on: date,
        amount: aedAmount,
        category_id: categoryId,
        person_id: personId,
        payment_method: method,
        type: selectedCategory?.treat_as === "income" ? "income" : "expense",
        note: note || null,
        original_amount: currency === "AED" ? null : parsedAmount,
        original_currency: currency === "AED" ? null : currency,
        exchange_rate: currency === "AED" ? null : rate,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!transaction) return;
    if (!window.confirm("Delete this transaction?")) return;
    setSaving(true);
    try {
      await deleteTransaction(transaction.id);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setSaving(false);
    }
  }

  return (
    <Sheet open={!!transaction} onClose={onClose} title="Edit Transaction">
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-[13px] font-medium text-ios-label-secondary">
              Amount
            </label>
            <select
              value={currency}
              onChange={(e) => {
                setCurrencyTouched(true);
                setCurrency(e.target.value);
              }}
              className="rounded-lg border border-ios-separator bg-ios-bg px-2 py-1 text-[12px] font-medium text-ios-label outline-none"
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
          </div>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
          />
          {currency !== "AED" && (
            <p className="mt-1 text-[12px] text-ios-label-secondary">
              {rateLoading
                ? "Fetching exchange rate…"
                : rateError
                  ? rateError
                  : rate && convertedAed !== null
                    ? `≈ ${formatMoney(convertedAed)} at 1 ${currency} = ${rate.toFixed(4)} AED`
                    : null}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
            Category
          </label>
          <CategoryPicker
            categories={categories}
            value={categoryId}
            onChange={setCategoryId}
            filter="all"
            exclude={["Mortgage", "Offset"]}
          />
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
            Person
          </label>
          <div className="flex gap-2">
            {people.map((p) => (
              <button
                key={p.id}
                onClick={() => setPersonId(p.id)}
                className={
                  "rounded-lg px-3 py-1.5 text-[14px] font-medium " +
                  (personId === p.id
                    ? "bg-ios-blue text-white"
                    : "bg-ios-fill text-ios-label")
                }
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
            Payment method
          </label>
          <SegmentedControl
            options={[
              { label: "Credit", value: "credit" },
              { label: "Debit", value: "debit" },
            ]}
            value={method}
            onChange={setMethod}
          />
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
            Note
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-xl border border-ios-separator bg-ios-bg px-3 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
          />
        </div>

        {error && <p className="text-[13px] text-ios-red">{error}</p>}

        <div className="flex gap-2">
          <Button variant="destructive" onClick={handleDelete} disabled={saving}>
            Delete
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
