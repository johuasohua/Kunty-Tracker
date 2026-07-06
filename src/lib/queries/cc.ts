"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { CcPayment, OpeningCcBalance } from "@/lib/types";

export function useCcData() {
  const [openingBalances, setOpeningBalances] = useState<OpeningCcBalance[]>([]);
  const [payments, setPayments] = useState<CcPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabaseClient();
    const [openingRes, paymentsRes] = await Promise.all([
      supabase.from("opening_cc_balances").select("*"),
      supabase.from("cc_payments").select("*").order("month", { ascending: true }),
    ]);

    if (!openingRes.error && openingRes.data) {
      setOpeningBalances(openingRes.data as OpeningCcBalance[]);
    }
    if (!paymentsRes.error && paymentsRes.data) {
      setPayments(paymentsRes.data as CcPayment[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { openingBalances, payments, loading, refresh };
}

export async function upsertCcPayment(input: {
  person_id: string;
  month: string; // first-of-month
  amount_paid: number;
  payment_date: string;
  note?: string | null;
}) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("cc_payments")
    .upsert(input, { onConflict: "person_id,month" })
    .select()
    .single();
  if (error) throw error;
  return data as CcPayment;
}

export async function upsertOpeningCcBalance(input: {
  person_id: string;
  as_of_month: string;
  balance: number;
}) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("opening_cc_balances")
    .upsert(input, { onConflict: "person_id" })
    .select()
    .single();
  if (error) throw error;
  return data as OpeningCcBalance;
}
