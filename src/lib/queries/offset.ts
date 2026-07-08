"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

/**
 * A locked, reconciled month of offset-account history (imported from the
 * spreadsheet or explicitly closed). Months after the last locked period are
 * NOT stored — they're derived live by `buildOffsetSeries` in aggregate.ts
 * from Offset-category transactions (deposits) and mortgage_payments
 * (deductions), so edits/deletes/backdating of those sources can never
 * drift out of sync with this ledger.
 */
export interface OffsetAccountPeriod {
  id: string;
  period_no: number;
  period_month: string; // YYYY-MM
  opening_balance: number;
  closing_balance: number;
  transaction_amount: number; // net change (deposit_amount - mortgage_deduction)
  deposit_amount: number;
  mortgage_deduction: number;
  transaction_note: string | null;
  created_at: string;
  updated_at: string;
}

export function useOffsetAccount() {
  const [periods, setPeriods] = useState<OffsetAccountPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("offset_account_periods")
      .select("*")
      .order("period_no", { ascending: true });

    if (!error && data) setPeriods(data as OffsetAccountPeriod[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { periods, loading, refresh };
}

export async function deleteOffsetPeriod(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("offset_account_periods")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
