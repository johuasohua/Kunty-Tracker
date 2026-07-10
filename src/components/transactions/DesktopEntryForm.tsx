"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
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

export function DesktopEntryForm({ onSaved }: { onSaved: () => void }) {
  const { categories } = useCategories();
  const { activePerson, people, lastUsedMethod, setLastUsedMethod } =
    useProfile();

  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("AED");
  const [rate, setRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [personId, setPersonId] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>(lastUsedMethod);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const effectivePersonId = personId ?? activePerson?.id ?? "";
  const selectedCategory = categories.find((c) => c.id === categoryId);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Enter a valid amount");
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
      setAmount("");
      setCurrency("AED");
      setRate(null);
      setCategoryId("");
      setNote("");
      setDate(todayISO());
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-[15px] font-semibold text-ios-label">
        Add Transaction
      </h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="col-span-1">
          <label className="mb-1 block text-[12px] font-medium text-ios-label-secondary">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-ios-separator bg-ios-bg px-2.5 py-2 text-[14px] text-ios-label outline-none focus:border-ios-blue"
          />
        </div>

        <div className="col-span-1">
          <label className="mb-1 block text-[12px] font-medium text-ios-label-secondary">
            Amount
          </label>
          <div className="flex gap-1.5">
            <input
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full min-w-0 flex-1 rounded-lg border border-ios-separator bg-ios-bg px-2.5 py-2 text-[14px] text-ios-label outline-none focus:border-ios-blue"
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="shrink-0 rounded-lg border border-ios-separator bg-ios-bg px-1.5 py-2 text-[12px] font-medium text-ios-label outline-none"
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
          </div>
          {currency !== "AED" && (
            <p className="mt-1 text-[11px] text-ios-label-secondary">
              {rateLoading
                ? "Fetching rate…"
                : rateError
                  ? rateError
                  : rate && convertedAed !== null
                    ? `≈ ${formatMoney(convertedAed)} @ ${rate.toFixed(4)}`
                    : null}
            </p>
          )}
        </div>

        <div className="col-span-2">
          <label className="mb-1 block text-[12px] font-medium text-ios-label-secondary">
            Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-ios-separator bg-ios-bg px-2.5 py-2 text-[14px] text-ios-label outline-none focus:border-ios-blue"
          >
            <option value="">Select…</option>
            {categories
              .filter(
                (c) =>
                  c.name.toLowerCase() !== "mortgage" &&
                  c.name.toLowerCase() !== "offset"
              )
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </div>

        <div className="col-span-1">
          <label className="mb-1 block text-[12px] font-medium text-ios-label-secondary">
            Person
          </label>
          <select
            value={effectivePersonId}
            onChange={(e) => setPersonId(e.target.value)}
            className="w-full rounded-lg border border-ios-separator bg-ios-bg px-2.5 py-2 text-[14px] text-ios-label outline-none focus:border-ios-blue"
          >
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-1">
          <label className="mb-1 block text-[12px] font-medium text-ios-label-secondary">
            Method
          </label>
          <SegmentedControl
            className="w-full justify-center"
            options={[
              { label: "Credit", value: "credit" },
              { label: "Debit", value: "debit" },
            ]}
            value={method}
            onChange={setMethod}
          />
        </div>

        <div className="col-span-2 sm:col-span-3 lg:col-span-4">
          <label className="mb-1 block text-[12px] font-medium text-ios-label-secondary">
            Note
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional"
            className="w-full rounded-lg border border-ios-separator bg-ios-bg px-2.5 py-2 text-[14px] text-ios-label outline-none focus:border-ios-blue"
          />
        </div>

        <div className="col-span-2 flex items-end lg:col-span-2">
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Saving…" : "Add"}
          </Button>
        </div>
      </form>
      {error && <p className="mt-2 text-[13px] text-ios-red">{error}</p>}
    </Card>
  );
}
