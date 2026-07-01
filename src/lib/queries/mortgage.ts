"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { MortgagePayment } from "@/lib/types";

export function useMortgagePayments() {
  const [payments, setPayments] = useState<MortgagePayment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("mortgage_payments")
      .select("*")
      .order("period_no", { ascending: true });

    if (!error && data) setPayments(data as MortgagePayment[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { payments, loading, refresh };
}

export interface MortgagePaymentInput {
  period_no: number;
  payment_date: string;
  opening_principal: number;
  principal_amount: number;
  interest_amount: number;
  insurance_amount: number;
  hoi_charge: number;
  closing_principal: number;
  offset_opening_balance?: number | null;
  offset_closing_balance?: number | null;
  interest_saved?: number | null;
  offset_transaction_amount?: number | null;
  offset_note?: string | null;
}

export async function createMortgagePayment(input: MortgagePaymentInput) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("mortgage_payments")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as MortgagePayment;
}

export async function updateMortgagePayment(
  id: string,
  patch: Partial<MortgagePaymentInput>
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("mortgage_payments")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as MortgagePayment;
}

export async function deleteMortgagePayment(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("mortgage_payments").delete().eq("id", id);
  if (error) throw error;
}
