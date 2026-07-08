"use client";

import { Suspense } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSavingsData } from "@/lib/queries/savings";
import { useMortgagePayments } from "@/lib/queries/mortgage";
import { computeCashDeployment, computeOffsetOptimizerBase } from "@/lib/aggregate";
import { CashDeploymentCard } from "@/components/savings/CashDeploymentCard";
import { formatMoney } from "@/lib/format";

export default function SavingsPage() {
  return (
    <Suspense fallback={null}>
      <SavingsPageContent />
    </Suspense>
  );
}

function SavingsPageContent() {
  const { savingsMonths, loading } = useSavingsData();
  const { payments, loading: mortgageLoading } = useMortgagePayments();

  if (loading || mortgageLoading) {
    return (
      <div className="flex justify-center py-14">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-ios-blue border-t-transparent" />
      </div>
    );
  }

  if (savingsMonths.length === 0) {
    return (
      <div className="px-4 md:px-0">
        <PageHeader title="Savings" />
        <EmptyState
          title="No savings data yet"
          subtitle="Add your first transaction to see your savings analysis."
        />
      </div>
    );
  }

  const totalSavedYtd = savingsMonths.reduce((sum, m) => sum + m.amountSaved, 0);
  const avgMonthlySavings =
    savingsMonths.length > 0 ? totalSavedYtd / savingsMonths.length : 0;
  const monthlyTarget = 10000;
  const progress = (avgMonthlySavings / monthlyTarget) * 100;

  const deployPlan = computeCashDeployment({
    savingsMonths,
    offsetBase: computeOffsetOptimizerBase(payments),
  });

  return (
    <div className="px-4 md:px-0">
      <PageHeader title="Savings" />

      {deployPlan && (
        <div className="mb-6">
          <CashDeploymentCard plan={deployPlan} />
        </div>
      )}

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <SummaryCard
          label="Total Saved YTD"
          value={formatMoney(totalSavedYtd)}
        />
        <SummaryCard
          label="Average Monthly"
          value={formatMoney(Math.round(avgMonthlySavings))}
        />
        <SummaryCard
          label="Progress to 10K/month"
          value={`${Math.round(progress)}%`}
          detail={`${formatMoney(Math.round(avgMonthlySavings))} / ${formatMoney(monthlyTarget)}`}
        />
      </div>

      {/* Savings Table */}
      <div className="mb-6 overflow-x-auto rounded-2xl bg-ios-bg-secondary">
        <table className="w-full border-collapse text-[14px] md:text-[15px]">
          <thead>
            <tr className="border-b border-ios-separator text-left text-[11px] font-medium uppercase tracking-wide text-ios-label-secondary">
              <th className="px-3 py-2.5 md:px-4">Month</th>
              <th className="px-3 py-2.5 text-right md:px-4">Opening</th>
              <th className="px-3 py-2.5 text-right md:px-4">Income</th>
              <th className="px-3 py-2.5 text-right md:px-4">Cash Out</th>
              <th className="px-3 py-2.5 text-right md:px-4">CC Paid</th>
              <th className="px-3 py-2.5 text-right md:px-4">Total Exp</th>
              <th className="px-3 py-2.5 text-right md:px-4">Closing</th>
              <th className="px-3 py-2.5 text-right font-semibold md:px-4">
                Saved
              </th>
            </tr>
          </thead>
          <tbody>
            {savingsMonths.map((month, idx) => (
              <tr
                key={month.key}
                className={idx % 2 === 0 ? "bg-ios-bg" : undefined}
              >
                <td className="px-3 py-2.5 font-medium text-ios-label md:px-4">
                  {month.month.toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-3 py-2.5 text-right text-ios-label md:px-4">
                  {formatMoney(month.openingBalance)}
                </td>
                <td className="px-3 py-2.5 text-right text-ios-green md:px-4">
                  {formatMoney(month.totalIncome)}
                </td>
                <td className="px-3 py-2.5 text-right text-ios-red md:px-4">
                  {formatMoney(month.cashOut)}
                </td>
                <td className="px-3 py-2.5 text-right text-ios-label md:px-4">
                  {formatMoney(month.ccPaidOff)}
                </td>
                <td className="px-3 py-2.5 text-right text-ios-label md:px-4">
                  {formatMoney(month.totalExpense)}
                </td>
                <td className="px-3 py-2.5 text-right text-ios-label md:px-4">
                  {formatMoney(month.closingBalance)}
                </td>
                <td
                  className={clsx(
                    "px-3 py-2.5 text-right font-semibold md:px-4",
                    month.amountSaved >= 0
                      ? "text-ios-green"
                      : "text-ios-red"
                  )}
                >
                  {formatMoney(month.amountSaved)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl bg-ios-bg-secondary p-4">
      <div className="mb-2 text-[13px] font-medium text-ios-label-secondary">
        {label}
      </div>
      <div className="text-[24px] font-bold text-ios-label">{value}</div>
      {detail && (
        <div className="mt-1 text-[12px] text-ios-label-tertiary">
          {detail}
        </div>
      )}
    </div>
  );
}

function clsx(...args: (string | undefined | false)[]): string {
  return args.filter(Boolean).join(" ");
}
