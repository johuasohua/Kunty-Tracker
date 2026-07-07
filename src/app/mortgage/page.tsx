"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useMortgagePayments } from "@/lib/queries/mortgage";
import { MortgageBalanceChart } from "@/components/mortgage/MortgageBalanceChart";
import { InterestSavedCard } from "@/components/mortgage/InterestSavedCard";
import { PaymentBreakdownCard } from "@/components/mortgage/PaymentBreakdownCard";
import { OffsetPanel } from "@/components/mortgage/OffsetPanel";
import { OffsetOptimizerCard } from "@/components/mortgage/OffsetOptimizerCard";
import { PaymentHistoryTable } from "@/components/mortgage/PaymentHistoryTable";
import { AddPaymentSheet } from "@/components/mortgage/AddPaymentSheet";

export default function MortgagePage() {
  const { payments, loading, refresh } = useMortgagePayments();
  const [addOpen, setAddOpen] = useState(false);

  const lastPayment = payments[payments.length - 1] ?? null;

  return (
    <div className="px-4 md:px-0">
      <PageHeader
        title="Mortgage"
        action={
          <button
            onClick={() => setAddOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ios-blue text-white"
            aria-label="Add payment period"
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
            <OffsetPanel payments={payments} />
          </div>

          <div className="mb-6">
            <MortgageBalanceChart payments={payments} />
          </div>

          <div className="mb-6">
            <OffsetOptimizerCard payments={payments} />
          </div>

          <PaymentHistoryTable payments={payments} onChanged={refresh} />
        </>
      )}

      <AddPaymentSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={refresh}
        lastPayment={lastPayment}
      />
    </div>
  );
}
