"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  buildSavingsData,
  type SavingsMonth,
  type LockedSavingsPeriod,
} from "@/lib/aggregate";
import type { Category, CcPayment } from "@/lib/types";
import type { LightTransaction } from "@/lib/queries/dashboard-data";

export function useSavingsData() {
  const [savingsMonths, setSavingsMonths] = useState<SavingsMonth[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabaseClient();

    // Derive live months up to (and including) the current month only —
    // avoids trailing empty future rows.
    const now = new Date();
    const endMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const upTo = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    try {
      const [transactionsRes, categoriesRes, ccPaymentsRes, lockedRes] =
        await Promise.all([
          supabase
            .from("transactions")
            .select("id,occurred_on,amount,type,category_id,payment_method")
            .lte("occurred_on", upTo),
          supabase.from("categories").select("*"),
          supabase.from("cc_payments").select("*").lte("payment_date", upTo),
          supabase
            .from("savings_periods")
            .select("*")
            .order("period_month", { ascending: true }),
        ]);

      const transactions = (transactionsRes.data ?? []) as LightTransaction[];
      const categories = (categoriesRes.data ?? []) as Category[];
      const ccPayments = (ccPaymentsRes.data ?? []) as CcPayment[];
      const lockedPeriods = (lockedRes.data ?? []) as LockedSavingsPeriod[];

      const data = buildSavingsData({
        transactions,
        categories,
        ccPayments,
        lockedPeriods,
        endMonth,
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
