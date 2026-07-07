"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export interface SavingsPeriod {
  id: string;
  period_month: string; // YYYY-MM
  opening_balance: number;
  total_income: number;
  debit_expense: number;
  cc_paid_off: number;
  total_expense: number;
  closing_balance: number;
  amount_saved: number;
  created_at: string;
  updated_at: string;
}

export function useSavingsPeriods() {
  const [periods, setPeriods] = useState<SavingsPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("savings_periods")
      .select("*")
      .order("period_month", { ascending: true });

    if (!error && data) setPeriods(data as SavingsPeriod[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { periods, loading, refresh };
}
