"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCategories } from "@/lib/queries/categories";
import { useProfile } from "@/lib/profile-context";
import { useDashboardData } from "@/lib/queries/dashboard-data";
import { useSavingsPeriods } from "@/lib/queries/savings-periods";
import {
  buildMonthlySeries,
  buildCcSeries,
  breakdownByCategory,
  breakdownByCategoryForYear,
  buildCategorySpendCards,
  buildSavingsData,
  computeMonthlyReview,
  computeCashDeployment,
  computeBudgetProgress,
  computeBudgetProgressForYear,
  computeUpcomingBills,
  type MonthPoint,
} from "@/lib/aggregate";
import { monthKey, formatMoney } from "@/lib/format";
import { SpeakTransactionButton } from "@/components/voice/SpeakTransactionButton";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { ReconciliationCard } from "@/components/dashboard/ReconciliationCard";
import { CategorySpendCards } from "@/components/dashboard/CategorySpendCards";
import { AccountBreakdownTable } from "@/components/dashboard/AccountBreakdownTable";
import { MonthlyReviewCard } from "@/components/dashboard/MonthlyReviewCard";
import { AnnualTrendChart } from "@/components/dashboard/AnnualTrendChart";
import { AnnualCategoryList } from "@/components/dashboard/AnnualCategoryList";
import { useCcData } from "@/lib/queries/cc";
import { CcSummaryCard } from "@/components/credit-cards/CcSummaryCard";
import { MarkPaidSheet } from "@/components/credit-cards/MarkPaidSheet";
import { useBudgets } from "@/lib/queries/budgets";
import { useRecurringBills } from "@/lib/queries/recurring";
import { BudgetCard } from "@/components/budgets/BudgetCard";
import { UpcomingBillsList } from "@/components/recurring/UpcomingBillsList";
import type { Person } from "@/lib/types";

export default function DashboardPage() {
  const { categories, loading: categoriesLoading } = useCategories();
  const { people } = useProfile();
  const { transactions, seed, loading: dataLoading } = useDashboardData();
  const { periods: lockedSavings } = useSavingsPeriods();
  const { openingBalances, payments: ccPayments, loading: ccLoading, refresh: refreshCc } =
    useCcData();
  const { budgets, loading: budgetsLoading } = useBudgets();
  const { bills, payments: billPayments, loading: billsLoading } = useRecurringBills();
  const [markPaidPerson, setMarkPaidPerson] = useState<Person | null>(null);

  const [view, setView] = useState<"monthly" | "annual">("monthly");
  const [month, setMonth] = useState(() => new Date());
  const [year, setYear] = useState(() => new Date().getFullYear());

  const loading =
    categoriesLoading || dataLoading || ccLoading || budgetsLoading || billsLoading;

  const series = useMemo(
    () => buildMonthlySeries(transactions, categories, seed, month),
    [transactions, categories, seed, month]
  );

  const currentPoint: MonthPoint | null = useMemo(() => {
    const key = monthKey(month);
    return series.find((p) => p.key === key) ?? null;
  }, [series, month]);

  const currentBreakdown = useMemo(
    () => breakdownByCategory(transactions, categories, month),
    [transactions, categories, month]
  );

  const categoryCards = useMemo(
    () => buildCategorySpendCards(transactions, categories, month),
    [transactions, categories, month]
  );

  const monthlyReview = useMemo(
    () => computeMonthlyReview(transactions, categories, budgets, people, month),
    [transactions, categories, budgets, people, month]
  );

  // Lightweight cash-deployment nudge: does savings sit above the buffer? The
  // full split (offset vs invest) lives on the Savings tab; here it's a teaser.
  const cashNudge = useMemo(() => {
    const savingsMonths = buildSavingsData({
      transactions,
      categories,
      ccPayments,
      lockedPeriods: lockedSavings,
      endMonth: new Date(),
    });
    return computeCashDeployment({ savingsMonths, offsetBase: null });
  }, [transactions, categories, ccPayments, lockedSavings]);

  const yearSeries = useMemo(() => {
    const end = new Date(year, 11, 1);
    return buildMonthlySeries(transactions, categories, seed, end).filter(
      (p) => p.date.getFullYear() === year
    );
  }, [transactions, categories, seed, year]);

  const annualTotals = useMemo(
    () => breakdownByCategoryForYear(transactions, categories, year),
    [transactions, categories, year]
  );

  const yearIncome = yearSeries.reduce((sum, p) => sum + p.totalIncome, 0);
  const yearExpense = yearSeries.reduce((sum, p) => sum + p.totalExpense, 0);

  const budgetEntries = useMemo(
    () => computeBudgetProgress(budgets, categories, transactions, people, month),
    [budgets, categories, transactions, people, month]
  );

  const annualBudgetEntries = useMemo(
    () => computeBudgetProgressForYear(budgets, categories, transactions, people, year),
    [budgets, categories, transactions, people, year]
  );

  const upcomingBills = useMemo(
    () => computeUpcomingBills(bills, billPayments, new Date()),
    [bills, billPayments]
  );

  const ccSeriesByPerson = useMemo(() => {
    const map = new Map<string, ReturnType<typeof buildCcSeries>>();
    for (const p of people) {
      map.set(p.id, buildCcSeries(transactions, ccPayments, openingBalances, p.id, month));
    }
    return map;
  }, [people, transactions, ccPayments, openingBalances, month]);

  // Reconciliation: dashboard cash (accrual) + outstanding cards owed should
  // equal the settled-cash Savings closing for the same month.
  const reconciliation = useMemo(() => {
    if (!currentPoint) return null;
    const key = monthKey(month);

    let cardsOwed = 0;
    for (const p of people) {
      const s = ccSeriesByPerson.get(p.id) ?? [];
      const pt = s.find((x) => x.key === key);
      if (pt) cardsOwed += pt.closing;
    }

    const savingsMonths = buildSavingsData({
      transactions,
      categories,
      ccPayments,
      lockedPeriods: lockedSavings,
      endMonth: month,
    });
    const savingsPoint = savingsMonths.find((m) => m.key === key) ?? null;

    return {
      cash: currentPoint.closing,
      cardsOwed,
      savingsClosing: savingsPoint?.closingBalance ?? null,
    };
  }, [
    currentPoint,
    month,
    people,
    ccSeriesByPerson,
    transactions,
    categories,
    ccPayments,
    lockedSavings,
  ]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-ios-blue border-t-transparent" />
      </div>
    );
  }

  const hasAnyData = transactions.length > 0;

  return (
    <div className="px-4 md:px-0">
      <PageHeader title="Dashboard" />

      <MonthSelector
        view={view}
        onViewChange={setView}
        month={month}
        onMonthChange={setMonth}
        year={year}
        onYearChange={setYear}
      />

      <div className="mb-6">
        <SpeakTransactionButton />
      </div>

      {!hasAnyData ? (
        <EmptyState
          title="No data yet"
          subtitle="Add a transaction to see your monthly breakdown, budgets, and balance trends here."
        />
      ) : view === "monthly" ? (
        <>
          <div className="mb-6">
            <BalanceCard point={currentPoint} />
          </div>

          {reconciliation && (
            <div className="mb-6">
              <ReconciliationCard
                cash={reconciliation.cash}
                cardsOwed={reconciliation.cardsOwed}
                savingsClosing={reconciliation.savingsClosing}
              />
            </div>
          )}

          <UpcomingBillsList bills={upcomingBills} categories={categories} />

          {people.length > 0 && (
            <div className="mb-6 grid gap-4 md:grid-cols-2">
              {people.map((p) => {
                const s = ccSeriesByPerson.get(p.id) ?? [];
                const point = s.find((pt) => pt.key === monthKey(month)) ?? null;
                return (
                  <CcSummaryCard
                    key={p.id}
                    person={p}
                    point={point}
                    onMarkPaid={() => setMarkPaidPerson(p)}
                  />
                );
              })}
            </div>
          )}

          {budgetEntries.length > 0 && (
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between px-4 md:px-0">
                <span className="text-[13px] font-medium uppercase tracking-wide text-ios-label-secondary">
                  Budgets
                </span>
                <Link href="/budgets" className="text-[13px] font-medium text-ios-blue">
                  Manage
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {budgetEntries.map((entry) => (
                  <BudgetCard key={entry.category.id} entry={entry} readOnly />
                ))}
              </div>
            </div>
          )}

          <CategorySpendCards cards={categoryCards} monthKey={monthKey(month)} />

          <AccountBreakdownTable breakdown={currentBreakdown} people={people} />

          {cashNudge && (
            <Link href="/savings" className="mb-6 block">
              <Card className="flex items-center gap-3 p-4 active:bg-ios-fill-secondary">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: "#30B0C726", color: "#30B0C7" }}
                >
                  <Sparkles size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-ios-label">
                    {formatMoney(cashNudge.surplus)} ready to put to work
                  </div>
                  <div className="text-[13px] text-ios-label-secondary">
                    Savings are above your {formatMoney(cashNudge.floor)} buffer —
                    see how to deploy it.
                  </div>
                </div>
                <ChevronRight size={18} className="shrink-0 text-ios-label-tertiary" />
              </Card>
            </Link>
          )}

          <MonthlyReviewCard review={monthlyReview} monthKey={monthKey(month)} />
        </>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <div className="text-[12px] text-ios-label-secondary">
                Total Income
              </div>
              <div className="text-[19px] font-semibold text-ios-green">
                {formatMoney(yearIncome)}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-[12px] text-ios-label-secondary">
                Total Expense
              </div>
              <div className="text-[19px] font-semibold text-ios-red">
                {formatMoney(yearExpense)}
              </div>
            </Card>
            <Card className="col-span-2 p-4 sm:col-span-1">
              <div className="text-[12px] text-ios-label-secondary">Net</div>
              <div className="text-[19px] font-semibold text-ios-blue">
                {formatMoney(yearIncome - yearExpense)}
              </div>
            </Card>
          </div>

          <div className="mb-6">
            <AnnualTrendChart points={yearSeries} />
          </div>

          {annualBudgetEntries.length > 0 && (
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between px-4 md:px-0">
                <span className="text-[13px] font-medium uppercase tracking-wide text-ios-label-secondary">
                  Budgets — {year}
                </span>
                <Link href="/budgets" className="text-[13px] font-medium text-ios-blue">
                  Manage
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {annualBudgetEntries.map((entry) => (
                  <BudgetCard key={entry.category.id} entry={entry} readOnly />
                ))}
              </div>
            </div>
          )}

          <AnnualCategoryList totals={annualTotals} year={year} />
        </>
      )}

      <MarkPaidSheet
        person={markPaidPerson}
        onClose={() => setMarkPaidPerson(null)}
        onSaved={refreshCc}
      />
    </div>
  );
}
