"use client";

import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/format";
import type { CashDeployment } from "@/lib/aggregate";

const OFFSET_TEAL = "#30B0C7";
const INVEST_PURPLE = "#AF52DE";

function formatMonths(m: number): string {
  if (m <= 0) return "";
  if (m < 12) return `${m} mo`;
  const years = Math.floor(m / 12);
  const rem = m % 12;
  return rem === 0 ? `${years} yr` : `${years}y ${rem}m`;
}

export function CashDeploymentCard({ plan }: { plan: CashDeployment }) {
  const offsetPct =
    plan.surplus > 0 ? (plan.offsetAmount / plan.surplus) * 100 : 0;
  const investPct = 100 - offsetPct;
  const monthsLabel =
    plan.offsetMonthsSooner && plan.offsetMonthsSooner > 0
      ? formatMonths(plan.offsetMonthsSooner)
      : "";

  return (
    <Card className="p-4">
      <div className="mb-1 flex items-center gap-2">
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full"
          style={{ backgroundColor: `${OFFSET_TEAL}26`, color: OFFSET_TEAL }}
        >
          <Sparkles size={13} />
        </div>
        <h2 className="text-[14px] font-semibold text-ios-label">
          Put your cash to work
        </h2>
      </div>
      <p className="mb-3 text-[13px] text-ios-label-secondary">
        You&apos;re holding{" "}
        <span className="font-semibold text-ios-label">
          {formatMoney(plan.cashBalance)}
        </span>{" "}
        — that&apos;s{" "}
        <span className="font-semibold text-ios-green">
          {formatMoney(plan.surplus)}
        </span>{" "}
        above your {formatMoney(plan.floor)} buffer.
      </p>

      {/* Split bar */}
      <div className="mb-2 flex h-2.5 overflow-hidden rounded-full bg-ios-fill">
        {plan.offsetAmount > 0 && (
          <div style={{ width: `${offsetPct}%`, backgroundColor: OFFSET_TEAL }} />
        )}
        {plan.investAmount > 0 && (
          <div style={{ width: `${investPct}%`, backgroundColor: INVEST_PURPLE }} />
        )}
      </div>

      {/* Split amounts */}
      <div className="grid grid-cols-2 gap-3">
        {plan.offsetAmount > 0 && (
          <div className="rounded-lg bg-ios-fill p-2.5">
            <div className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: OFFSET_TEAL }}
              />
              <span className="text-[11px] text-ios-label-secondary">
                To offset
              </span>
            </div>
            <div className="text-[16px] font-bold" style={{ color: OFFSET_TEAL }}>
              {formatMoney(plan.offsetAmount)}
            </div>
            {plan.offsetAnnualInterestSaved > 0 && (
              <div className="mt-0.5 text-[11px] text-ios-label-tertiary">
                ~{formatMoney(plan.offsetAnnualInterestSaved)}/yr saved
                {monthsLabel ? ` · ${monthsLabel} sooner` : ""}
              </div>
            )}
          </div>
        )}
        <div className="rounded-lg bg-ios-fill p-2.5">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: INVEST_PURPLE }}
            />
            <span className="text-[11px] text-ios-label-secondary">
              To investments
            </span>
          </div>
          <div className="text-[16px] font-bold" style={{ color: INVEST_PURPLE }}>
            {formatMoney(plan.investAmount)}
          </div>
          <div className="mt-0.5 text-[11px] text-ios-label-tertiary">
            Higher potential return, more risk
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-ios-label-tertiary">
        A suggestion, not advice. Offset is a guaranteed, tax-free return you can
        pull back anytime; investing may earn more but carries risk.
      </p>
    </Card>
  );
}
