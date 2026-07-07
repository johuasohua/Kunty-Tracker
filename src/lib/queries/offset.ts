"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

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

export interface OffsetPeriodInput {
  period_no: number;
  period_month: string; // YYYY-MM
  opening_balance: number;
  closing_balance: number;
  transaction_amount?: number | null;
  deposit_amount?: number | null;
  mortgage_deduction?: number | null;
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
      deposit_amount: input.deposit_amount ?? 0,
      mortgage_deduction: input.mortgage_deduction ?? 0,
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
 * Sync an Offset category deposit to the offset account ledger.
 * If no offset period exists, creates an initial one.
 * If the latest period is the same calendar month, adds to it.
 * Otherwise opens a new period carrying the balance forward.
 */
export async function syncOffsetTransaction(input: {
  amount: number;
  occurredOn: string; // yyyy-mm-dd
  note: string | null;
}): Promise<"offset-created" | "offset-updated"> {
  const last = await fetchLatestOffsetPeriod();

  // Extract period month (YYYY-MM) from date
  const periodMonth = input.occurredOn.substring(0, 7);
  const addedNote = input.note ?? `Deposit on ${input.occurredOn}`;

  if (!last) {
    await createOffsetPeriod({
      period_no: 1,
      period_month: periodMonth,
      opening_balance: 0,
      closing_balance: input.amount,
      transaction_amount: input.amount,
      deposit_amount: input.amount,
      mortgage_deduction: 0,
      transaction_note: addedNote,
    });
    return "offset-created";
  }

  if (last.period_month === periodMonth) {
    await updateOffsetPeriod(last.id, {
      closing_balance: last.closing_balance + input.amount,
      transaction_amount: (last.transaction_amount ?? 0) + input.amount,
      deposit_amount: (last.deposit_amount ?? 0) + input.amount,
      transaction_note: last.transaction_note
        ? `${last.transaction_note}; ${addedNote}`
        : addedNote,
    });
    return "offset-updated";
  }

  await createOffsetPeriod({
    period_no: last.period_no + 1,
    period_month: periodMonth,
    opening_balance: last.closing_balance,
    closing_balance: last.closing_balance + input.amount,
    transaction_amount: input.amount,
    deposit_amount: input.amount,
    mortgage_deduction: 0,
    transaction_note: addedNote,
  });
  return "offset-created";
}

/**
 * Sync a mortgage payment's deduction to the offset account ledger.
 * Mirrors syncOffsetTransaction but subtracts the total payment instead
 * of adding a deposit, keeping deposit_amount and mortgage_deduction
 * tracked as separate figures.
 */
export async function syncOffsetMortgageDeduction(input: {
  totalPayment: number;
  occurredOn: string; // yyyy-mm-dd
}): Promise<"offset-created" | "offset-updated"> {
  const last = await fetchLatestOffsetPeriod();

  const periodMonth = input.occurredOn.substring(0, 7);
  const note = "Mortgage payment";

  if (!last) {
    await createOffsetPeriod({
      period_no: 1,
      period_month: periodMonth,
      opening_balance: 0,
      closing_balance: -input.totalPayment,
      transaction_amount: -input.totalPayment,
      deposit_amount: 0,
      mortgage_deduction: input.totalPayment,
      transaction_note: note,
    });
    return "offset-created";
  }

  if (last.period_month === periodMonth) {
    await updateOffsetPeriod(last.id, {
      closing_balance: last.closing_balance - input.totalPayment,
      transaction_amount: (last.transaction_amount ?? 0) - input.totalPayment,
      mortgage_deduction: (last.mortgage_deduction ?? 0) + input.totalPayment,
      transaction_note: last.transaction_note
        ? `${last.transaction_note}; ${note}`
        : note,
    });
    return "offset-updated";
  }

  await createOffsetPeriod({
    period_no: last.period_no + 1,
    period_month: periodMonth,
    opening_balance: last.closing_balance,
    closing_balance: last.closing_balance - input.totalPayment,
    transaction_amount: -input.totalPayment,
    deposit_amount: 0,
    mortgage_deduction: input.totalPayment,
    transaction_note: note,
  });
  return "offset-created";
}
