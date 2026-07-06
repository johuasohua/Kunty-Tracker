"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type {
  EntrySource,
  PaymentMethod,
  Transaction,
  TransactionType,
} from "@/lib/types";

export interface TransactionFilters {
  from?: string; // yyyy-mm-dd, inclusive
  to?: string; // yyyy-mm-dd, inclusive
  categoryIds?: string[];
  personId?: string;
  paymentMethod?: PaymentMethod;
  type?: TransactionType;
  sort?: "date_desc" | "date_asc" | "amount_desc" | "amount_asc";
  limit?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilters(query: any, filters: TransactionFilters) {
  let q = query;
  if (filters.from) q = q.gte("occurred_on", filters.from);
  if (filters.to) q = q.lte("occurred_on", filters.to);
  if (filters.categoryIds && filters.categoryIds.length > 0) {
    q = q.in("category_id", filters.categoryIds);
  }
  if (filters.personId) q = q.eq("person_id", filters.personId);
  if (filters.paymentMethod) q = q.eq("payment_method", filters.paymentMethod);
  if (filters.type) q = q.eq("type", filters.type);

  switch (filters.sort) {
    case "date_asc":
      q = q.order("occurred_on", { ascending: true });
      break;
    case "amount_desc":
      q = q.order("amount", { ascending: false });
      break;
    case "amount_asc":
      q = q.order("amount", { ascending: true });
      break;
    case "date_desc":
    default:
      q = q.order("occurred_on", { ascending: false });
      break;
  }
  q = q.order("created_at", { ascending: false });

  if (filters.limit) q = q.limit(filters.limit);
  return q;
}

export function useTransactions(filters: TransactionFilters) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const filtersKey = JSON.stringify(filters);

  const refresh = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabaseClient();
    const base = supabase.from("transactions").select("*");
    const { data, error } = await applyFilters(base, filters);

    if (!error && data) setTransactions(data as Transaction[]);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { transactions, loading, refresh };
}

export interface TransactionInput {
  occurred_on: string;
  amount: number;
  category_id: string;
  person_id: string;
  payment_method: PaymentMethod;
  type: TransactionType;
  note?: string | null;
  source?: EntrySource;
  raw_capture_text?: string | null;
  created_by_person_id?: string | null;
}

export async function createTransaction(input: TransactionInput) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("transactions")
    .insert({ source: "manual", ...input })
    .select()
    .single();
  if (error) throw error;
  const transaction = data as Transaction;

  // "Mortgage" / "Offset" transactions also populate the mortgage ledger by
  // default, so logging the payment once keeps both the cash-flow view and
  // the Mortgage tab current. The transaction is already saved at this point;
  // a ledger hiccup shouldn't lose it, so sync failures only warn.
  try {
    const { data: category } = await supabase
      .from("categories")
      .select("name")
      .eq("id", input.category_id)
      .single();
    if (category && typeof category.name === "string") {
      const { syncLedgerForCategoryTransaction } = await import("@/lib/queries/mortgage");
      await syncLedgerForCategoryTransaction({
        categoryName: category.name,
        amount: input.amount,
        occurredOn: input.occurred_on,
        note: input.note ?? null,
      });
    }
  } catch (err) {
    console.warn("Mortgage ledger sync failed (transaction saved):", err);
  }

  return transaction;
}

export async function updateTransaction(
  id: string,
  patch: Partial<TransactionInput>
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("transactions")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Transaction;
}

export async function deleteTransaction(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
}
