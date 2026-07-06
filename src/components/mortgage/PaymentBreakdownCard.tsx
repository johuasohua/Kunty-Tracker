"use client";

import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/format";
import type { MortgagePayment } from "@/lib/types";

export function PaymentBreakdownCard({
  payments,
}: {
  payments: MortgagePayment[];
}) {
  const totalPrincipal = payments.reduce((sum, p) => sum + p.principal_amount, 0);
  const totalInterest = payments.reduce((sum, p) => sum + p.interest_amount, 0);
  const totalHoi = payments.reduce((sum, p) => sum + p.hoi_charge, 0);
  const totalPayments = totalPrincipal + totalInterest + totalHoi;

  const principalPct = totalPayments > 0 ? (totalPrincipal / totalPayments) * 100 : 0;
  const interestPct = totalPayments > 0 ? (totalInterest / totalPayments) * 100 : 0;
  const hoiPct = totalPayments > 0 ? (totalHoi / totalPayments) * 100 : 0;

  return (
    <Card className="p-4">
      <h2 className="mb-4 text-[15px] font-semibold text-ios-label">
        Payment Breakdown
      </h2>

      <div className="mb-4 space-y-3">
        {/* Principal */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[13px] text-ios-label-secondary">Principal</span>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-ios-label">
                {formatMoney(totalPrincipal)}
              </span>
              <span className="text-[14px] font-semibold text-ios-blue">
                {principalPct.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ios-fill">
            <div
              className="h-full bg-ios-blue"
              style={{ width: `${principalPct}%` }}
            />
          </div>
        </div>

        {/* Interest */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[13px] text-ios-label-secondary">Interest</span>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-ios-label">
                {formatMoney(totalInterest)}
              </span>
              <span className="text-[14px] font-semibold text-ios-red">
                {interestPct.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ios-fill">
            <div
              className="h-full bg-ios-red"
              style={{ width: `${interestPct}%` }}
            />
          </div>
        </div>

        {/* HOI */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[13px] text-ios-label-secondary">HOI</span>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-ios-label">
                {formatMoney(totalHoi)}
              </span>
              <span className="text-[14px] font-semibold text-ios-orange">
                {hoiPct.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ios-fill">
            <div
              className="h-full bg-ios-orange"
              style={{ width: `${hoiPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="border-t border-ios-separator pt-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-ios-label-secondary">
            Total Payments
          </span>
          <span className="text-[14px] font-semibold text-ios-label">
            {formatMoney(totalPayments)}
          </span>
        </div>
      </div>
    </Card>
  );
}
