"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { buildSavingsData, type SavingsMonth } from "@/lib/aggregate";
import type { Category, CcPayment } from "@/lib/types";
import type { LightTransaction, OpeningBalanceSeed } from "@/lib/queries/dashboard-data";

export function useSavingsData() {
  const [savingsMonths, setSavingsMonths] = useState<SavingsMonth[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabaseClient();

    const now = new Date();
    const endOfYear = new Date(now.getFullYear(), 11, 31);

    try {
      // Load all necessary data
      const [transactionsRes, categoriesRes, ccPaymentsRes, seedRes] =
        await Promise.all([
          supabase
            .from("transactions")
            .select("id,occurred_on,amount,type,category_id,payment_method")
            .lte("occurred_on", endOfYear.toISOString().split("T")[0]),
          supabase.from("categories").select("*"),
          supabase
            .from("cc_payments")
            .select("*")
            .lte("payment_date", endOfYear.toISOString().split("T")[0]),
          supabase
            .from("opening_balance_seed")
            .select("*")
            .single(),
        ]);

      const transactions = (transactionsRes.data ??
        []) as LightTransaction[];
      const categories = (categoriesRes.data ?? []) as Category[];
      const ccPayments = (ccPaymentsRes.data ?? []) as CcPayment[];
      const seed = (seedRes.data ?? null) as OpeningBalanceSeed | null;

      const data = buildSavingsData({
        transactions,
        categories,
        ccPayments,
        seed,
        endMonth: endOfYear,
      });

      setSavingsMonths(data);
    } catch (err) {
      console.error("Failed to load savings data:", err);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { savingsMonths, loading, refresh };
}
