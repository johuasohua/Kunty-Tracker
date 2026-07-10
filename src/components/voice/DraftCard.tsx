"use client";

import { useEffect, useState } from "react";
import { Trash2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { CategoryPicker } from "@/components/transactions/CategoryPicker";
import { CURRENCY_OPTIONS, fetchAedRate } from "@/lib/currency";
import { formatMoney } from "@/lib/format";
import type { VoiceDraft } from "@/lib/voice/parse";
import type { Category, PaymentMethod, Person } from "@/lib/types";

export function DraftCard({
  draft,
  index,
  categories,
  people,
  onChange,
  onRemove,
}: {
  draft: VoiceDraft;
  index: number;
  categories: Category[];
  people: Person[];
  onChange: (patch: Partial<VoiceDraft>) => void;
  onRemove: () => void;
}) {
  const missing = new Set(draft.unresolved);

  // Keep the amount field as raw text so decimals ("47.50") type cleanly;
  // the numeric draft value is derived on change.
  const [amountText, setAmountText] = useState(
    draft.amount != null ? String(draft.amount) : ""
  );

  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState("");

  // Fetch the AED rate whenever the currency is (or starts as, from parsing)
  // non-AED. The rate lives on the draft itself via onChange so VoiceReview's
  // save step can read it directly.
  useEffect(() => {
    if (draft.currency === "AED") {
      setRateError("");
      return;
    }
    let cancelled = false;
    setRateLoading(true);
    setRateError("");
    fetchAedRate(draft.currency)
      .then((r) => {
        if (!cancelled) onChange({ exchangeRate: r });
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
  }, [draft.currency]);

  const convertedAed =
    draft.currency !== "AED" && draft.exchangeRate && draft.amount != null
      ? draft.amount * draft.exchangeRate
      : null;

  function setCategory(categoryId: string) {
    const category = categories.find((c) => c.id === categoryId);
    onChange({
      categoryId,
      type: category?.treat_as === "income" ? "income" : "expense",
    });
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[12px] font-medium uppercase tracking-wide text-ios-label-tertiary">
            Transaction {index + 1}
          </div>
          {draft.rawText && (
            <div className="truncate text-[12px] text-ios-label-secondary">
              &ldquo;{draft.rawText}&rdquo;
            </div>
          )}
        </div>
        <button
          onClick={onRemove}
          aria-label="Remove transaction"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ios-fill text-ios-red active:opacity-70"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Amount + person */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between">
            <label className="text-[12px] font-medium text-ios-label-secondary">
              Amount
            </label>
            <select
              value={draft.currency}
              onChange={(e) => onChange({ currency: e.target.value, exchangeRate: null })}
              className="rounded-lg border border-ios-separator bg-ios-bg px-2 py-1 text-[11px] font-medium text-ios-label outline-none"
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
            value={amountText}
            onChange={(e) => {
              const v = e.target.value;
              setAmountText(v);
              const n = parseFloat(v);
              onChange({ amount: v.trim() === "" || Number.isNaN(n) ? null : n });
            }}
            placeholder="0.00"
            className={
              "w-full rounded-xl border bg-ios-bg px-3 py-2 text-[22px] font-semibold text-ios-label outline-none focus:border-ios-blue " +
              (missing.has("amount") ? "border-ios-red" : "border-ios-separator")
            }
          />
          {draft.currency !== "AED" && (
            <p className="mt-1 text-[11px] text-ios-label-secondary">
              {rateLoading
                ? "Fetching exchange rate…"
                : rateError
                  ? rateError
                  : draft.exchangeRate && convertedAed !== null
                    ? `≈ ${formatMoney(convertedAed)} at 1 ${draft.currency} = ${draft.exchangeRate.toFixed(4)} AED`
                    : null}
            </p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium text-ios-label-secondary">
            Person
          </label>
          <div className="flex gap-1.5">
            {people.map((p) => (
              <button
                key={p.id}
                onClick={() => onChange({ personId: p.id })}
                className={
                  "rounded-lg px-3 py-2 text-[14px] font-medium " +
                  (draft.personId === p.id
                    ? "bg-ios-blue text-white"
                    : "bg-ios-fill text-ios-label")
                }
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category */}
      <div className="mb-3">
        <label className="mb-1 block text-[12px] font-medium text-ios-label-secondary">
          Category
          {missing.has("category") && (
            <span className="ml-1 inline-flex items-center gap-0.5 text-ios-red">
              <AlertCircle size={11} /> pick one
            </span>
          )}
        </label>
        <CategoryPicker
          categories={categories}
          value={draft.categoryId}
          onChange={setCategory}
          filter="all"
          exclude={["Mortgage", "Offset"]}
        />
      </div>

      {/* Date + method */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-[12px] font-medium text-ios-label-secondary">
            Date
          </label>
          <input
            type="date"
            value={draft.date}
            onChange={(e) => onChange({ date: e.target.value })}
            className="w-full rounded-lg border border-ios-separator bg-ios-bg px-3 py-2 text-[14px] text-ios-label outline-none focus:border-ios-blue"
          />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium text-ios-label-secondary">
            Method
          </label>
          <SegmentedControl
            options={[
              { label: "Credit", value: "credit" },
              { label: "Debit", value: "debit" },
            ]}
            value={draft.paymentMethod}
            onChange={(m: PaymentMethod) => onChange({ paymentMethod: m })}
          />
        </div>
      </div>

      {/* Note */}
      <div className="mt-3">
        <label className="mb-1 block text-[12px] font-medium text-ios-label-secondary">
          Note (optional)
        </label>
        <input
          value={draft.note ?? ""}
          onChange={(e) => onChange({ note: e.target.value || null })}
          placeholder="Add a note"
          className="w-full rounded-lg border border-ios-separator bg-ios-bg px-3 py-2 text-[14px] text-ios-label outline-none focus:border-ios-blue"
        />
      </div>
    </Card>
  );
}
