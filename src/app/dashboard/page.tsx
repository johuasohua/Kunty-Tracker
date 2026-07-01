"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCategories } from "@/lib/queries/categories";
import { useProfile } from "@/lib/profile-context";
import { useDashboardData } from "@/lib/queries/dashboard-data";
import {
  buildMonthlySeries,
  breakdownByCategory,
  breakdownByCategoryForYear,
  computeInsights,
  type MonthPoint,
} from "@/lib/aggregate";
import { monthKey, formatMoney } from "@/lib/format";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { CategoryDonut } from "@/components/dashboard/CategoryDonut";
import { CategoryMoMList } from "@/components/dashboard/CategoryMoMList";
import { AccountBreakdownTable } from "@/components/dashboard/AccountBreakdownTable";
import { InsightsList } from "@/components/dashboard/InsightsList";
import { AnnualTrendChart } from "@/components/dashboard/AnnualTrendChart";
import { AnnualCategoryList } from "@/components/dashboard/AnnualCategoryList";

export default function DashboardPage() {
  const { categories, loading: categoriesLoading } = useCategories();
  const { people } = useProfile();
  const { transactions, seed, loading: dataLoading } = useDashboardData();

  const [view, setView] = useState<"monthly" | "annual">("monthly");
  const [month, setMonth] = useState(() => new Date());
  const [year, setYear] = useState(() => new Date().getFullYear());

  const loading = categoriesLoading || dataLoading;

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

  const previousBreakdown = useMemo(() => {
    const previousMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
    return breakdownByCategory(transactions, categories, previousMonth);
  }, [transactions, categories, month]);

  const insights = useMemo(
    () => computeInsights(transactions, categories, month),
    [transactions, categories, month]
  );

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

          <InsightsList insights={insights} />

          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <Card className="p-4">
              <h2 className="mb-2 text-[15px] font-semibold text-ios-label">
                Spend Breakdown
              </h2>
              <CategoryDonut
                breakdown={currentBreakdown}
                total={currentPoint?.totalExpense ?? 0}
              />
            </Card>
            <CategoryMoMList
              current={currentBreakdown}
              previous={previousBreakdown}
              monthKey={monthKey(month)}
            />
          </div>

          <AccountBreakdownTable breakdown={currentBreakdown} people={people} />
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

          <AnnualCategoryList totals={annualTotals} year={year} />
        </>
      )}
    </div>
  );
}
