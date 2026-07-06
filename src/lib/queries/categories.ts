"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/types";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (!error && data) setCategories(data as Category[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { categories, loading, refresh };
}

/** Every category, hidden ones included — for the Settings management UI. */
export function useAllCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (!error && data) setCategories(data as Category[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { categories, loading, refresh };
}

export interface CategoryInput {
  name: string;
  treat_as: Category["treat_as"];
  color: string;
  icon: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export async function createCategory(input: CategoryInput) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

export async function updateCategory(id: string, patch: Partial<CategoryInput>) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

/** Hard delete — fails (FK) once transactions reference the category; the
 * UI catches that and offers hiding instead. */
export async function deleteCategory(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

/** Swap the sort positions of two adjacent categories. */
export async function swapCategoryOrder(a: Category, b: Category) {
  await updateCategory(a.id, { sort_order: b.sort_order });
  await updateCategory(b.id, { sort_order: a.sort_order });
}
