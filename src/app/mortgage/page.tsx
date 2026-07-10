"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCategories } from "@/lib/queries/categories";
import { useMortgagePayments } from "@/lib/queries/mortgage";
import { useOffsetAccount } from "@/lib/queries/offset";
import { useDashboardData } from "@/lib/queries/dashboard-data";
import { buildOffsetSeries } from "@/lib/aggregate";
import { MortgageBalanceChart } from "@/components/mortgage/MortgageBalanceChart";
import { InterestSavedCard } from "@/components/mortgage/InterestSavedCard";
import { PaymentBreakdownCard } from "@/components/mortgage/PaymentBreakdownCard";
import { OffsetPanel } from "@/components/mortgage/OffsetPanel";
import { OffsetOptimizerCard } from "@/components/mortgage/OffsetOptimizerCard";
import { PaymentHistoryTable } from "@/components/mortgage/PaymentHistoryTable";
import { LogTransactionSheet } from "@/components/mortgage/LogTransactionSheet";

export default function MortgagePage() {
  const searchParams = useSearchParams();
  const { categories, loading: categoriesLoading } = useCategories();
  const { payments, loading, refresh } = useMortgagePayments();
  const { periods: lockedOffsetPeriods, refresh: refreshOffset } = useOffsetAccount();
  const { transactions, refresh: refreshTransactions } = useDashboardData();
  const [logOpen, setLogOpen] = useState(false);
  // Deep-linked from the dashboard's Offset spend card.
  const [historyOpen, setHistoryOpen] = useState(
    () => searchParams.get("openHistory") === "1"
  );

  const lastPayment = payments[payments.length - 1] ?? null;
  const offsetCategoryId = categories.find((c) => c.name.toLowerCase() === "offset")?.id;

  // Locked ledger history + months derived live from Offset transactions and
  // mortgage payments — nothing derived is stored, so it can't drift.
  const offsetSeries = useMemo(
    () =>
      buildOffsetSeries({
        lockedPeriods: lockedOffsetPeriods,
        transactions,
        offsetCategoryId,
        mortgagePayments: payments,
        endMonth: new Date(),
      }),
    [lockedOffsetPeriods, transactions, offsetCategoryId, payments]
  );

  const handleTransactionSaved = () => {
    // Refresh every source the offset series derives from
    refresh();
    refreshOffset();
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
            <OffsetPanel
              series={offsetSeries}
              onLedgerChanged={refreshOffset}
              historyOpen={historyOpen}
              onHistoryOpenChange={setHistoryOpen}
            />
          </div>

          <div className="mb-6">
            <MortgageBalanceChart payments={payments} offsetSeries={offsetSeries} />
          </div>

          <div className="mb-6">
            <OffsetOptimizerCard
              payments={payments}
              currentOffsetBalance={
                offsetSeries[offsetSeries.length - 1]?.closingBalance
              }
            />
          </div>

          <PaymentHistoryTable payments={payments} onChanged={refresh} />
        </>
      )}

      <LogTransactionSheet
        open={logOpen}
        onClose={() => setLogOpen(false)}
        onSaved={handleTransactionSaved}
        lastPayment={lastPayment}
        offsetCategoryId={offsetCategoryId}
        categoriesLoading={categoriesLoading}
      />
    </div>
  );
}
