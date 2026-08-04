"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { AccountOpeningBalance } from "@/lib/types";

/**
 * Opening-balance seeds for the per-person account ledgers. Tolerates the
 * table not existing yet (migration 0015 is applied by hand, per this
 * project's convention) — an absent table simply yields no seeds, which the
 * aggregate layer reports as "unseeded" rather than a balance of zero.
 */
export function useAccountOpeningBalances() {
  const [openingBalances, setOpeningBalances] = useState<AccountOpeningBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("account_opening_balances").select("*");
    if (!error && data) {
      setOpeningBalances(data as AccountOpeningBalance[]);
    } else {
      setOpeningBalances([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { openingBalances, loading, refresh };
}

export async function upsertAccountOpeningBalance(input: {
  person_id: string;
  as_of_date: string;
  balance: number;
}) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("account_opening_balances")
    .upsert(input, { onConflict: "person_id" })
    .select()
    .single();
  if (error) throw error;
  return data as AccountOpeningBalance;
}
