"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { PaymentMethod, TransactionType } from "@/lib/types";

export interface LightTransaction {
  id: string;
  occurred_on: string;
  amount: number;
  category_id: string;
  person_id: string;
  payment_method: PaymentMethod;
  type: TransactionType;
}

export interface OpeningBalanceSeed {
  as_of_month: string;
  balance: number;
}

/**
 * Loads every transaction (lightweight columns only) plus the opening
 * balance seed row. Fine at household scale (hundreds–low thousands of
 * rows/year) — lets the dashboard compute monthly series, annual totals,
 * and trailing averages without a round trip per view.
 */
export function useDashboardData() {
  const [transactions, setTransactions] = useState<LightTransaction[]>([]);
  const [seed, setSeed] = useState<OpeningBalanceSeed | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabaseClient();

    const [txRes, seedRes] = await Promise.all([
      supabase
        .from("transactions")
        .select(
          "id, occurred_on, amount, category_id, person_id, payment_method, type"
        )
        .order("occurred_on", { ascending: true }),
      supabase.from("opening_balance_seed").select("as_of_month, balance").maybeSingle(),
    ]);

    if (!txRes.error && txRes.data) {
      setTransactions(txRes.data as LightTransaction[]);
    }
    if (!seedRes.error && seedRes.data) {
      setSeed(seedRes.data as OpeningBalanceSeed);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { transactions, seed, loading, refresh };
}
