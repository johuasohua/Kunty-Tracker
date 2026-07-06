"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { RecurringBill, RecurringFrequency, PaymentMethod } from "@/lib/types";

export interface RecurringBillPayment {
  id: string;
  recurring_bill_id: string;
  month: string;
  paid_on: string;
  transaction_id: string | null;
  created_at: string;
}

export function useRecurringBills() {
  const [bills, setBills] = useState<RecurringBill[]>([]);
  const [payments, setPayments] = useState<RecurringBillPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabaseClient();
    const [billsRes, paymentsRes] = await Promise.all([
      supabase
        .from("recurring_bills")
        .select("*")
        .eq("is_active", true)
        .order("next_due_date", { ascending: true }),
      supabase
        .from("recurring_bill_payments")
        .select("*")
        .order("month", { ascending: false }),
    ]);

    if (!billsRes.error && billsRes.data) setBills(billsRes.data as RecurringBill[]);
    if (!paymentsRes.error && paymentsRes.data) {
      setPayments(paymentsRes.data as RecurringBillPayment[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { bills, payments, loading, refresh };
}

export interface RecurringBillInput {
  name: string;
  amount: number;
  frequency: RecurringFrequency;
  next_due_date: string;
  category_id: string | null;
  owner_person_id: string | null;
  default_payment_method: PaymentMethod | null;
  notes?: string | null;
}

export async function createRecurringBill(input: RecurringBillInput) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("recurring_bills")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as RecurringBill;
}

export async function updateRecurringBill(
  id: string,
  patch: Partial<RecurringBillInput>
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("recurring_bills")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as RecurringBill;
}

export async function deleteRecurringBill(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("recurring_bills").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Marks a bill's current cycle paid, and optionally logs the matching
 * transaction in one shot (so the spend still shows up in category
 * breakdowns/budgets without a second manual entry).
 */
export async function markBillPaid(input: {
  recurring_bill_id: string;
  month: string; // the current cycle's due date (see currentCycleDueDate)
  createTransaction: boolean;
  transactionDetails?: {
    occurred_on: string;
    amount: number;
    category_id: string;
    person_id: string;
    payment_method: PaymentMethod;
    note: string;
    created_by_person_id: string | null;
  };
}) {
  const supabase = getSupabaseClient();
  let transactionId: string | null = null;

  if (input.createTransaction && input.transactionDetails) {
    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .insert({ ...input.transactionDetails, type: "expense", source: "manual" })
      .select()
      .single();
    if (txError) throw txError;
    transactionId = tx.id;
  }

  const { data, error } = await supabase
    .from("recurring_bill_payments")
    .upsert(
      {
        recurring_bill_id: input.recurring_bill_id,
        month: input.month,
        transaction_id: transactionId,
      },
      { onConflict: "recurring_bill_id,month" }
    )
    .select()
    .single();
  if (error) throw error;
  return data as RecurringBillPayment;
}

export async function unmarkBillPaid(paymentId: string, transactionId: string | null) {
  const supabase = getSupabaseClient();
  await supabase.from("recurring_bill_payments").delete().eq("id", paymentId);
  if (transactionId) {
    await supabase.from("transactions").delete().eq("id", transactionId);
  }
}
