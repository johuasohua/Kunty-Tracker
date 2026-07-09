"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCategories } from "@/lib/queries/categories";
import { useMortgagePayments } from "@/lib/queries/mortgage";
import { useRakAccount } from "@/lib/queries/rak";
import { useDashboardData } from "@/lib/queries/dashboard-data";
import { buildRakSeries } from "@/lib/aggregate";
import { MortgageBalanceChart } from "@/components/mortgage/MortgageBalanceChart";
import { InterestSavedCard } from "@/components/mortgage/InterestSavedCard";
import { PaymentBreakdownCard } from "@/components/mortgage/PaymentBreakdownCard";
import { RakPanel } from "@/components/mortgage/RakPanel";
import { OffsetOptimizerCard } from "@/components/mortgage/OffsetOptimizerCard";
import { PaymentHistoryTable } from "@/components/mortgage/PaymentHistoryTable";
import { LogTransactionSheet } from "@/components/mortgage/LogTransactionSheet";

export default function MortgagePage() {
  const { categories } = useCategories();
  const { payments, loading, refresh } = useMortgagePayments();
  const { periods: lockedRakPeriods, refresh: refreshRak } = useRakAccount();
  const { transactions, refresh: refreshTransactions } = useDashboardData();
  const [logOpen, setLogOpen] = useState(false);

  const lastPayment = payments[payments.length - 1] ?? null;
  const rakCategoryId = categories.find((c) => c.name.toLowerCase() === "rak")?.id;

  // Locked ledger history + months derived live from Rak transactions and
  // mortgage payments — nothing derived is stored, so it can't drift.
  const rakSeries = useMemo(
    () =>
      buildRakSeries({
        lockedPeriods: lockedRakPeriods,
        transactions,
        rakCategoryId,
        mortgagePayments: payments,
        endMonth: new Date(),
      }),
    [lockedRakPeriods, transactions, rakCategoryId, payments]
  );

  const handleTransactionSaved = () => {
    // Refresh every source the Rak series derives from
    refresh();
    refreshRak();
    refreshTransactions();
  };

  return (
    <div className="px-4 md:px-0">
      <PageHeader
        title="Mortgage"
        action={
          <button
            onClick={() => setLogOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ios-blue text-white"
            aria-label="Log transaction"
          >
            <Plus size={18} />
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-14">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ios-blue border-t-transparent" />
        </div>
      ) : payments.length === 0 ? (
        <EmptyState
          title="No mortgage payments yet"
          subtitle="Add your first payment period with the + button, or run the historical import to bring in your existing LIV sheet."
        />
      ) : (
        <>
          <div className="mb-6">
            <InterestSavedCard payments={payments} />
          </div>

          <div className="mb-6">
            <PaymentBreakdownCard payments={payments} />
          </div>

          <div className="mb-6">
            <RakPanel series={rakSeries} onLedgerChanged={refreshRak} />
          </div>

          <div className="mb-6">
            <MortgageBalanceChart payments={payments} rakSeries={rakSeries} />
          </div>

          <div className="mb-6">
            <OffsetOptimizerCard payments={payments} />
          </div>

          <PaymentHistoryTable payments={payments} onChanged={refresh} />
        </>
      )}

      <LogTransactionSheet
        open={logOpen}
        onClose={() => setLogOpen(false)}
        onSaved={handleTransactionSaved}
        lastPayment={lastPayment}
        rakCategoryId={rakCategoryId}
      />
    </div>
  );
}
