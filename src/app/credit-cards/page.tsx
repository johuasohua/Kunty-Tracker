"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useProfile } from "@/lib/profile-context";
import { useDashboardData } from "@/lib/queries/dashboard-data";
import { useCcData } from "@/lib/queries/cc";
import { useCategories } from "@/lib/queries/categories";
import { buildCcSeries } from "@/lib/aggregate";
import { CcTrendChart } from "@/components/credit-cards/CcTrendChart";
import { CcHistoryTable } from "@/components/credit-cards/CcHistoryTable";
import { MarkPaidSheet } from "@/components/credit-cards/MarkPaidSheet";
import { SpeakTransactionButton } from "@/components/voice/SpeakTransactionButton";
import type { Person } from "@/lib/types";

export default function CreditCardsPage() {
  return (
    <Suspense fallback={null}>
      <CreditCardsPageContent />
    </Suspense>
  );
}

function CreditCardsPageContent() {
  const searchParams = useSearchParams();
  const { people } = useProfile();
  const { transactions, loading: txLoading } = useDashboardData();
  const { categories, loading: categoriesLoading } = useCategories();
  const { openingBalances, payments, loading: ccLoading, refresh } = useCcData();

  const [personId, setPersonId] = useState<string | null>(
    () => searchParams.get("person")
  );
  const [markPaidPerson, setMarkPaidPerson] = useState<Person | null>(null);

  const activePersonId = personId ?? people[0]?.id ?? null;
  const activePerson = people.find((p) => p.id === activePersonId) ?? null;

  const series = useMemo(() => {
    if (!activePersonId) return [];
    return buildCcSeries(transactions, payments, openingBalances, activePersonId, new Date(), categories);
  }, [transactions, payments, openingBalances, activePersonId, categories]);

  const loading = txLoading || ccLoading || categoriesLoading;

  return (
    <div className="px-4 md:px-0">
      <PageHeader title="Credit Cards" />

      <div className="mb-4">
        <SpeakTransactionButton />
      </div>

      {people.length > 0 && (
        <div className="mb-4 px-0">
          <SegmentedControl
            options={people.map((p) => ({ label: p.name, value: p.id }))}
            value={activePersonId ?? ""}
            onChange={setPersonId}
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-14">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ios-blue border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="mb-6">
            <CcTrendChart points={series} color={activePerson?.color ?? "#007AFF"} />
          </div>

          <div className="mb-4 flex justify-end">
            <button
              onClick={() => activePerson && setMarkPaidPerson(activePerson)}
              className="rounded-lg bg-ios-blue px-3 py-2 text-[13px] font-semibold text-white active:opacity-80"
            >
              Record payment
            </button>
          </div>

          <CcHistoryTable points={series} />
        </>
      )}

      <MarkPaidSheet
        person={markPaidPerson}
        onClose={() => setMarkPaidPerson(null)}
        onSaved={refresh}
      />
    </div>
  );
}
