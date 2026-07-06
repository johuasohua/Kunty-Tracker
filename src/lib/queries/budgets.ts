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

export async function deleteBudget(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) throw error;
}
