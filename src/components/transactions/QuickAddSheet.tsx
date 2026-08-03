"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { CategoryPicker } from "@/components/transactions/CategoryPicker";
import { useCategories } from "@/lib/queries/categories";
import { useProfile } from "@/lib/profile-context";
import { createTransaction } from "@/lib/queries/transactions";
import { CURRENCY_OPTIONS, fetchAedRate } from "@/lib/currency";
import { formatMoney } from "@/lib/format";
import type { PaymentMethod } from "@/lib/types";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function QuickAddSheet({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { categories } = useCategories();
  const { activePerson, people, lastUsedMethod, setLastUsedMethod } =
    useProfile();

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("AED");
  const [rate, setRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [personId, setPersonId] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>(lastUsedMethod);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const effectivePersonId = personId ?? activePerson?.id ?? null;
  const selectedCategory = categories.find((c) => c.id === categoryId);

  // Fetch the AED rate whenever a foreign currency is picked — independent
  // of the amount, so it doesn't refetch on every keystroke.
  useEffect(() => {
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
  }, [currency]);

  const parsedAmount = parseFloat(amount) || 0;
  const convertedAed = currency !== "AED" && rate ? parsedAmount * rate : null;

  function reset() {
    setAmount("");
    setCurrency("AED");
    setRate(null);
    setRateError("");
    setCategoryId(null);
    setNote("");
    setShowMore(false);
    setDate(todayISO());
    setPersonId(null);
    setMethod(lastUsedMethod);
    setError("");
  }

  async function handleSave() {
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Enter an amount");
      return;
    }
    if (!categoryId || !selectedCategory) {
      setError("Pick a category");
      return;
    }
    if (!effectivePersonId) {
      setError("No profile selected");
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
      await createTransaction({
        occurred_on: date,
        amount: aedAmount,
        category_id: categoryId,
        person_id: effectivePersonId,
        payment_method: method,
        type: selectedCategory.treat_as === "income" ? "income" : "expense",
        note: note || null,
        created_by_person_id: activePerson?.id ?? null,
        original_amount: currency === "AED" ? null : parsedAmount,
        original_currency: currency === "AED" ? null : currency,
        exchange_rate: currency === "AED" ? null : rate,
      });
      setLastUsedMethod(method);
      reset();
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Add Expense">
      <div className="flex flex-col gap-4">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-[13px] font-medium text-ios-label-secondary">
              Amount
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
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
            autoFocus
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border border-ios-separator bg-ios-bg px-4 py-3 text-[28px] font-semibold text-ios-label outline-none focus:border-ios-blue"
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
            exclude={["Mortgage", "Offset"]}
          />
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
            Note (optional)
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. dinner with friends"
            className="w-full rounded-xl border border-ios-separator bg-ios-bg px-4 py-2.5 text-[15px] text-ios-label outline-none focus:border-ios-blue"
          />
        </div>

        {!showMore ? (
          <button
            onClick={() => setShowMore(true)}
            className="text-left text-[14px] font-medium text-ios-blue"
          >
            More options (date, person, payment method)
          </button>
        ) : (
          <div className="flex flex-col gap-3 rounded-xl bg-ios-bg p-3">
            <div>
              <label className="mb-1 block text-[13px] font-medium text-ios-label-secondary">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-ios-separator bg-ios-bg-secondary px-3 py-2 text-[15px] text-ios-label outline-none focus:border-ios-blue"
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
                      (effectivePersonId === p.id
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
          </div>
        )}

        {error && <p className="text-[13px] text-ios-red">{error}</p>}

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </Sheet>
  );
}
