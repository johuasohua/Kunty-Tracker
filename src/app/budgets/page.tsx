"use client";

import { useMemo, useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCategories } from "@/lib/queries/categories";
import { useProfile } from "@/lib/profile-context";
import { useBudgets, deleteBudget } from "@/lib/queries/budgets";
import { useDashboardData } from "@/lib/queries/dashboard-data";
import { computeBudgetProgress, computeBudgetProgressForYear } from "@/lib/aggregate";
import { BudgetCard } from "@/components/budgets/BudgetCard";
import { AddEditBudgetSheet } from "@/components/budgets/AddEditBudgetSheet";
import { SuggestBudgetsSheet } from "@/components/budgets/SuggestBudgetsSheet";
import { MonthSelector } from "@/components/dashboard/MonthSelector";

export default function BudgetsPage() {
  const { categories, loading: categoriesLoading } = useCategories();
  const { people } = useProfile();
  const { budgets, loading: budgetsLoading, refresh } = useBudgets();
  const { transactions, loading: txLoading } = useDashboardData();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [view, setView] = useState<"monthly" | "annual">("monthly");
  const [month, setMonth] = useState(() => new Date());
  const [year, setYear] = useState(() => new Date().getFullYear());

  const loading = categoriesLoading || budgetsLoading || txLoading;

  const monthlyEntries = useMemo(
    () => computeBudgetProgress(budgets, categories, transactions, people, month),
    [budgets, categories, transactions, people, month]
  );

  const annualEntries = useMemo(
    () => computeBudgetProgressForYear(budgets, categories, transactions, people, year),
    [budgets, categories, transactions, people, year]
  );

  const entries = view === "monthly" ? monthlyEntries : annualEntries;

  function openAdd() {
    setEditingCategoryId(null);
    setSheetOpen(true);
  }

  function openEdit(categoryId: string) {
    setEditingCategoryId(categoryId);
    setSheetOpen(true);
  }

  async function handleDelete(categoryId: string) {
    if (!window.confirm("Delete this budget?")) return;
    const rows = budgets.filter((b) => b.category_id === categoryId);
    for (const row of rows) await deleteBudget(row.id);
    refresh();
  }

  return (
    <div className="px-4 md:px-0">
      <PageHeader
        title="Budgets"
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setSuggestOpen(true)}
              className="flex h-9 items-center gap-1.5 rounded-full bg-ios-fill px-3 text-[13px] font-semibold text-ios-blue"
              aria-label="Suggest budgets from history"
            >
              <Sparkles size={15} />
              Suggest
            </button>
            <button
              onClick={openAdd}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-ios-blue text-white"
              aria-label="Add budget"
            >
              <Plus size={18} />
            </button>
          </div>
        }
      />

      <MonthSelector
        view={view}
        onViewChange={setView}
        month={month}
        onMonthChange={setMonth}
        year={year}
        onYearChange={setYear}
      />

      {loading ? (
        <div className="flex justify-center py-14">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ios-blue border-t-transparent" />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          title="No budgets set"
          subtitle="Add a monthly budget per category, with optional per-person sub-budgets, using the + button."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {entries.map((entry) => (
            <BudgetCard
              key={entry.category.id}
              entry={entry}
              onEdit={() => openEdit(entry.category.id)}
              onDelete={() => handleDelete(entry.category.id)}
            />
          ))}
        </div>
      )}

      <AddEditBudgetSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSaved={refresh}
        categories={categories}
        people={people}
        budgets={budgets}
        editingCategoryId={editingCategoryId}
      />

      <SuggestBudgetsSheet
        open={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        onSaved={refresh}
        transactions={transactions}
        categories={categories}
        budgets={budgets}
        month={month}
      />
    </div>
  );
}
