"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, SlidersHorizontal, Search, X } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCategories } from "@/lib/queries/categories";
import { useProfile } from "@/lib/profile-context";
import {
  useTransactions,
  type TransactionFilters,
} from "@/lib/queries/transactions";
import { QuickAddSheet } from "@/components/transactions/QuickAddSheet";
import { EditTransactionSheet } from "@/components/transactions/EditTransactionSheet";
import { FilterSheet } from "@/components/transactions/FilterSheet";
import { QuickFilters } from "@/components/transactions/QuickFilters";
import { TransactionMobileList } from "@/components/transactions/TransactionMobileList";
import { TransactionTableRow } from "@/components/transactions/TransactionTableRow";
import { DesktopEntryForm } from "@/components/transactions/DesktopEntryForm";
import { SpeakTransactionButton } from "@/components/voice/SpeakTransactionButton";
import type { Transaction } from "@/lib/types";

export default function TransactionsPage() {
  return (
    <Suspense fallback={null}>
      <TransactionsPageContent />
    </Suspense>
  );
}

function TransactionsPageContent() {
  const { categories } = useCategories();
  const { people } = useProfile();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<TransactionFilters>(() => {
    const category = searchParams.get("category");
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;
    return {
      sort: "date_desc",
      categoryIds: category ? [category] : undefined,
      from,
      to,
    };
  });
  const { transactions, loading, refresh } = useTransactions(filters);

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [search, setSearch] = useState("");

  // Free-text search over the loaded rows — matches note, category, person,
  // payment method and amount. Runs on top of the server-side filters.
  const visibleTransactions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter((t) => {
      const category = categories.find((c) => c.id === t.category_id);
      const person = people.find((p) => p.id === t.person_id);
      const haystack = [
        t.note ?? "",
        category?.name ?? "",
        person?.name ?? "",
        t.payment_method,
        t.type,
        String(t.amount),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [transactions, search, categories, people]);

  const activeFilterCount =
    (filters.categoryIds?.length ?? 0) +
    (filters.personId ? 1 : 0) +
    (filters.paymentMethod ? 1 : 0) +
    (filters.type ? 1 : 0) +
    (filters.from ? 1 : 0) +
    (filters.to ? 1 : 0);

  return (
    <div className="px-4 md:px-0">
      <PageHeader
        title="Transactions"
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setFilterOpen(true)}
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-ios-fill text-ios-label"
              aria-label="Filters"
            >
              <SlidersHorizontal size={16} />
              {activeFilterCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-ios-blue text-[10px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setQuickAddOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-ios-blue text-white md:hidden"
              aria-label="Add transaction"
            >
              <Plus size={18} />
            </button>
          </div>
        }
      />

      <div className="mb-4">
        <SpeakTransactionButton />
      </div>

      <div className="relative mb-4">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ios-label-secondary"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search transactions"
          className="w-full rounded-xl border border-ios-separator bg-ios-bg-secondary py-2.5 pl-9 pr-9 text-[15px] text-ios-label outline-none focus:border-ios-blue"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-ios-fill text-ios-label-secondary"
          >
            <X size={13} />
          </button>
        )}
      </div>

      <QuickFilters filters={filters} onChange={setFilters} people={people} />

      {/* Desktop: always-visible full entry form */}
      <div className="mb-6 hidden md:block">
        <DesktopEntryForm onSaved={refresh} />
      </div>

      {loading ? (
        <div className="flex justify-center py-14">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ios-blue border-t-transparent" />
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          subtitle="Add your first expense with the + button, or use the mic to log one by voice."
        />
      ) : visibleTransactions.length === 0 ? (
        <EmptyState
          title="No matches"
          subtitle={`Nothing matches “${search}”. Try a different search or clear it.`}
        />
      ) : (
        <>
          {/* Mobile: grouped list */}
          <div className="md:hidden">
            <TransactionMobileList
              transactions={visibleTransactions}
              categories={categories}
              people={people}
              onSelect={setEditing}
            />
          </div>

          {/* Desktop: dense table with inline editing */}
          <div className="hidden overflow-hidden rounded-2xl bg-ios-bg-secondary md:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-ios-separator text-left text-[12px] font-medium uppercase tracking-wide text-ios-label-secondary">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Account</th>
                  <th className="px-3 py-2">Note</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {visibleTransactions.map((t) => (
                  <TransactionTableRow
                    key={t.id}
                    transaction={t}
                    categories={categories}
                    people={people}
                    onChanged={refresh}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <QuickAddSheet
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSaved={refresh}
      />
      <EditTransactionSheet
        transaction={editing}
        onClose={() => setEditing(null)}
        onSaved={refresh}
      />
      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onChange={setFilters}
        categories={categories}
        people={people}
      />
    </div>
  );
}
