"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export interface OffsetAccountPeriod {
  id: string;
  period_no: number;
  period_month: string; // YYYY-MM
  opening_balance: number;
  closing_balance: number;
  transaction_amount: number;
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

export interface OffsetPeriodInput {
  period_no: number;
  period_month: string; // YYYY-MM
  opening_balance: number;
  closing_balance: number;
  transaction_amount?: number | null;
  transaction_note?: string | null;
}

export async function createOffsetPeriod(input: OffsetPeriodInput) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("offset_account_periods")
    .insert({
      period_no: input.period_no,
      period_month: input.period_month,
      opening_balance: input.opening_balance,
      closing_balance: input.closing_balance,
      transaction_amount: input.transaction_amount ?? 0,
      transaction_note: input.transaction_note ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as OffsetAccountPeriod;
}

export async function updateOffsetPeriod(
  id: string,
  patch: Partial<OffsetPeriodInput>
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("offset_account_periods")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as OffsetAccountPeriod;
}

export async function deleteOffsetPeriod(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("offset_account_periods")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

async function fetchLatestOffsetPeriod(): Promise<OffsetAccountPeriod | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("offset_account_periods")
    .select("*")
    .order("period_no", { ascending: false })
    .limit(1);
  if (error) throw error;
  return (data?.[0] as OffsetAccountPeriod) ?? null;
}

/**
 * Sync an Offset category transaction to the offset account ledger.
 * If no offset period exists, creates an initial one.
 * If a period exists, updates it with the new transaction.
 */
export async function syncOffsetTransaction(input: {
  amount: number;
  occurredOn: string; // yyyy-mm-dd
  note: string | null;
}): Promise<"offset-created" | "offset-updated"> {
  const last = await fetchLatestOffsetPeriod();
  const supabase = getSupabaseClient();

  // Extract period month (YYYY-MM) from date
  const periodMonth = input.occurredOn.substring(0, 7);

  if (!last) {
    // Create initial offset period
    await createOffsetPeriod({
      period_no: 1,
      period_month: periodMonth,
      opening_balance: 0,
      closing_balance: input.amount,
      transaction_amount: input.amount,
      transaction_note: input.note ?? `Deposit on ${input.occurredOn}`,
    });
    return "offset-created";
  }

  // Update latest period
  const baseBalance = last.closing_balance;
  const addedNote = input.note ?? `Deposit on ${input.occurredOn}`;
  await updateOffsetPeriod(last.id, {
    closing_balance: baseBalance + input.amount,
    transaction_amount: (last.transaction_amount ?? 0) + input.amount,
    transaction_note: last.transaction_note
      ? `${last.transaction_note}; ${addedNote}`
      : addedNote,
  });
  return "offset-updated";
}
