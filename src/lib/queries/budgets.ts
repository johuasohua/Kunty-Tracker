"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Budget } from "@/lib/types";

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("budgets")
      .select("*")
      .eq("is_active", true)
      .order("effective_from", { ascending: true });

    if (!error && data) setBudgets(data as Budget[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { budgets, loading, refresh };
}

/**
 * Budgets aren't versioned in the UI (even though the schema supports
 * effective-dated rows for future use) — editing a category/person's
 * budget updates today's active row if one already covers the current
 * month, otherwise inserts a fresh one.
 */
export async function upsertBudget(input: {
  existingId?: string;
  category_id: string;
  person_id: string | null;
  monthly_amount: number;
}) {
  const supabase = getSupabaseClient();

  if (input.existingId) {
    const { data, error } = await supabase
      .from("budgets")
      .update({ monthly_amount: input.monthly_amount })
      .eq("id", input.existingId)
      .select()
      .single();
    if (error) throw error;
    return data as Budget;
  }

  const now = new Date();
  const effectiveFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const { data, error } = await supabase
    .from("budgets")
    .insert({
      category_id: input.category_id,
      person_id: input.person_id,
      monthly_amount: input.monthly_amount,
      effective_from: effectiveFrom,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Budget;
}

/**
 * Set a budget by (category, person) without needing the caller to know the
 * existing row id — used by the voice command and the history seeder. Finds
 * the latest row already in effect for this month and updates it, otherwise
 * inserts a fresh one. `person_id: null` targets the shared budget.
 */
export async function upsertBudgetByKey(input: {
  category_id: string;
  person_id: string | null;
  monthly_amount: number;
}) {
  const supabase = getSupabaseClient();
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  let query = supabase
    .from("budgets")
    .select("id")
    .eq("category_id", input.category_id)
    .eq("is_active", true)
    .lte("effective_from", monthStart)
    .order("effective_from", { ascending: false })
    .limit(1);
  query = input.person_id === null
    ? query.is("person_id", null)
    : query.eq("person_id", input.person_id);

  const { data, error } = await query;
  if (error) throw error;

  return upsertBudget({ existingId: data?.[0]?.id, ...input });
}

export async function deleteBudget(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) throw error;
}
