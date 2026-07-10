"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Goal } from "@/lib/types";

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("is_active", true)
      .order("priority_order", { ascending: true });

    if (!error && data) setGoals(data as Goal[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { goals, loading, refresh };
}

export async function createGoal(input: {
  name: string;
  target_amount: number;
  priority_order?: number;
  target_date?: string | null;
}) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("goals")
    .insert({
      name: input.name,
      target_amount: input.target_amount,
      priority_order: input.priority_order ?? 0,
      target_date: input.target_date ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Goal;
}

export async function updateGoal(
  id: string,
  input: {
    name?: string;
    target_amount?: number;
    priority_order?: number;
    target_date?: string | null;
    reached_at?: string | null;
  }
) {
  const supabase = getSupabaseClient();
  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.target_amount !== undefined) updates.target_amount = input.target_amount;
  if (input.priority_order !== undefined) updates.priority_order = input.priority_order;
  if (input.target_date !== undefined) updates.target_date = input.target_date;
  if (input.reached_at !== undefined) updates.reached_at = input.reached_at;

  const { data, error } = await supabase
    .from("goals")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Goal;
}

export async function deleteGoal(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("goals")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw error;
}
