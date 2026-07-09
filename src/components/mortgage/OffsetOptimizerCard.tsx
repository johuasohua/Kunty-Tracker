"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/format";
import {
  computeOffsetOptimizerBase,
  computeOffsetOptimization,
} from "@/lib/aggregate";
import type { MortgagePayment } from "@/lib/types";

const OFFSET_TEAL = "#30B0C7";
const QUICK_PICKS = [1000, 5000, 10000, 25000];

/** Round a raw ceiling down to a tidy thousand for the slider max. */
function roundToThousand(n: number): number {
  return Math.max(1000, Math.floor(n / 1000) * 1000);
}

function formatMonths(m: number): string {
  if (m <= 0) return "<1 mo";
  if (m < 12) return `${m} mo`;
  const years = Math.floor(m / 12);
  const rem = m % 12;
  return rem === 0 ? `${years} yr` : `${years}y ${rem}m`;
}

export function OffsetOptimizerCard({
  payments,
}: {
  payments: MortgagePayment[];
}) {
  const base = useMemo(() => computeOffsetOptimizerBase(payments), [payments]);

  // Cap the slider at the useful range — no point modelling more than the
  // remaining effective debt (nor a wildly large sum). Tidy to a round figure.
  const sliderMax = useMemo(() => {
    if (!base) return 25000;
    return roundToThousand(Math.min(base.effectiveDebt, 100000));
  }, [base]);

  const [extra, setExtra] = useState(() => Math.min(5000, sliderMax));

  const result = useMemo(
    () => (base ? computeOffsetOptimization(base, extra) : null),
    [base, extra]
  );

  // Not enough mortgage history to derive a rate — hide entirely.
  if (!base || !result) return null;

  const monthsSooner = result.monthsSooner ?? 0;
  const showMonths = monthsSooner > 0;

  return (
    <Card className="p-3.5">
      <div className="mb-2.5 flex items-center gap-2">
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full"
          style={{ backgroundColor: `${OFFSET_TEAL}26`, color: OFFSET_TEAL }}
        >
          <Sparkles size={13} />
        </div>
        <h2 className="text-[14px] font-semibold text-ios-label">
          Offset Optimizer
        </h2>
      </div>

      {/* Amount + anchor to current offset balance */}
      <div className="flex items-baseline justify-between">
        <span className="text-[12px] text-ios-label-secondary">
          Move into offset
        </span>
        <span className="text-[20px] font-bold text-ios-label">
          {formatMoney(extra)}
        </span>
      </div>
      <div className="mb-2 text-right text-[11px] text-ios-label-secondary">
        Offset {formatMoney(base.currentOffset)}{" "}
        <span className="text-ios-label-tertiary">→</span>{" "}
        <span className="font-semibold" style={{ color: OFFSET_TEAL }}>
          {formatMoney(base.currentOffset + extra)}
        </span>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={0}
        max={sliderMax}
        step={1000}
        value={extra}
        onChange={(e) => setExtra(Number(e.target.value))}
        aria-label="Extra amount to move into offset"
        className="mb-2.5 w-full cursor-pointer"
        style={{ accentColor: OFFSET_TEAL }}
      />

      {/* Quick picks */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {QUICK_PICKS.filter((v) => v <= sliderMax).map((v) => {
          const active = extra === v;
          return (
            <button
              key={v}
              onClick={() => setExtra(v)}
              className={
                "rounded-full px-2.5 py-0.5 text-[12px] font-medium transition-colors " +
                (active
                  ? "text-white"
                  : "bg-ios-fill text-ios-label active:bg-ios-fill-secondary")
              }
              style={active ? { backgroundColor: OFFSET_TEAL } : undefined}
            >
              {formatMoney(v)}
            </button>
          );
        })}
      </div>

      {/* Outcomes */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-ios-fill p-2.5">
          <div className="text-[10px] text-ios-label-secondary">
            Interest saved / year
          </div>
          <div className="text-[16px] font-bold text-ios-green">
            {formatMoney(result.annualInterestSaved)}
          </div>
        </div>
        <div className="rounded-lg bg-ios-fill p-2.5">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-ios-label-secondary">
              Mortgage cleared
            </span>
            <span className="rounded bg-ios-label-tertiary/15 px-1 text-[9px] font-medium uppercase tracking-wide text-ios-label-tertiary">
              est
            </span>
          </div>
          <div className="text-[16px] font-bold" style={{ color: OFFSET_TEAL }}>
            {showMonths ? `${formatMonths(monthsSooner)} sooner` : "—"}
          </div>
        </div>
      </div>

      {/* Assumptions footnote */}
      <p className="mt-3 text-[11px] text-ios-label-tertiary">
        Assumes the balance stays in offset and your payment is unchanged. Rate
        ~{base.annualRatePct.toFixed(1)}%, derived from your latest payment.
      </p>
    </Card>
  );
}
