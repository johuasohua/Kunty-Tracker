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

export type LedgerSyncResult =
  | "mortgage-period" // new payment period created
  | "offset-created" // new offset account period created
  | "offset-updated" // offset account period updated
  | "skipped-no-history"; // no ledger rows yet to attach to

async function fetchLatestPayment(): Promise<MortgagePayment | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("mortgage_payments")
    .select("*")
    .order("period_no", { ascending: false })
    .limit(1);
  if (error) throw error;
  return (data?.[0] as MortgagePayment) ?? null;
}

/**
 * Mirrors a "Mortgage" or "Offset" *transaction* into the mortgage ledger so
 * both views stay in sync (the transaction feeds the monthly cash-flow; the
 * ledger rows feed their respective tabs).
 *
 * - Offset → synced to offset_account_periods table (independent of mortgage).
 *   If no offset period exists, creates the first one. Otherwise updates the
 *   latest period with the new transaction amount and closing balance.
 * - Mortgage → opens the next mortgage payment period with the full amount as
 *   principal (closing = opening − principal, per the calc engine) and
 *   insurance/HOI carried forward. The bank's real P/I split isn't known at
 *   logging time — edit the row on the Mortgage tab to apportion interest;
 *   the row is flagged via offset_note so it's easy to spot.
 *
 * Edits/deletes of the transaction afterwards are NOT mirrored — the ledger
 * rows are managed on their respective tabs like any other.
 */
export async function syncLedgerForCategoryTransaction(input: {
  categoryName: string;
  amount: number;
  occurredOn: string; // yyyy-mm-dd
  note: string | null;
}): Promise<LedgerSyncResult | null> {
  const name = (input.categoryName ?? "").trim().toLowerCase();
  if (name !== "mortgage" && name !== "offset") return null;
  if (!input.amount || input.amount <= 0) return null;

  if (name === "offset") {
    const { syncOffsetTransaction } = await import("@/lib/queries/offset");
    const result = await syncOffsetTransaction({
      amount: input.amount,
      occurredOn: input.occurredOn,
      note: input.note,
    });
    return result;
  }

  const last = await fetchLatestPayment();

  // Mortgage payment → next period, amount as principal until split is edited.
  // Automatically deduct the full payment amount from offset account.
  const opening = last?.closing_principal ?? 0;
  const offsetOpening = last?.offset_closing_balance ?? null;
  const insuranceAmount = last?.insurance_amount ?? 0;
  const hoiAmount = last?.hoi_charge ?? 105;
  const totalPayment = input.amount + insuranceAmount + hoiAmount;
  const offsetClosing = offsetOpening !== null ? offsetOpening - totalPayment : null;

  await createMortgagePayment({
    period_no: (last?.period_no ?? 0) + 1,
    payment_date: input.occurredOn,
    opening_principal: opening,
    principal_amount: input.amount,
    interest_amount: 0,
    insurance_amount: insuranceAmount,
    hoi_charge: hoiAmount,
    closing_principal: opening - input.amount,
    offset_opening_balance: offsetOpening,
    offset_closing_balance: offsetClosing,
    offset_note: "Auto-logged from transaction — edit P/I split",
  });

  const { syncOffsetMortgageDeduction } = await import("@/lib/queries/offset");
  await syncOffsetMortgageDeduction({
    totalPayment,
    occurredOn: input.occurredOn,
  });

  return "mortgage-period";
}
