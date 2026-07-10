export type PaymentMethod = "credit" | "debit";
export type TransactionType = "income" | "expense";
// "offset"   = contra-expense: money coming back (e.g. Refunds) — reduces
//              expense totals and is displayed as "+" in transaction lists.
// "transfer" = money moved out to another own account (e.g. mortgage-offset
//              deposits) — behaves like "offset" in every aggregate (excluded
//              from CC spend, counts as settlement cash-out) but is displayed
//              as "−" because the cash genuinely leaves.
export type CategoryTreatAs = "expense" | "income" | "offset" | "transfer";
export type EntrySource = "manual" | "voice" | "shortcut" | "import";

export interface Person {
  id: string;
  name: string;
  color: string;
  auth_user_id: string | null;
  last_used_payment_method: PaymentMethod | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  treat_as: CategoryTreatAs;
  color: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  occurred_on: string;
  amount: number; // always AED — see original_amount/original_currency for foreign-currency entries
  category_id: string;
  person_id: string;
  payment_method: PaymentMethod;
  type: TransactionType;
  note: string | null;
  source: EntrySource;
  raw_capture_text: string | null;
  created_by_person_id: string | null;
  original_amount: number | null;
  original_currency: string | null;
  exchange_rate: number | null;
  created_at: string;
  updated_at: string;
}

export interface MortgagePayment {
  id: string;
  period_no: number;
  payment_date: string;
  opening_principal: number;
  principal_amount: number;
  interest_amount: number;
  insurance_amount: number;
  hoi_charge: number;
  closing_principal: number;
  offset_opening_balance: number | null;
  offset_closing_balance: number | null;
  interest_saved: number | null;
  offset_transaction_amount: number | null;
  offset_note: string | null;
  created_at: string;
}

export interface Budget {
  id: string;
  category_id: string;
  person_id: string | null;
  monthly_amount: number;
  effective_from: string;
  is_active: boolean;
  created_at: string;
}

export type RecurringFrequency = "monthly" | "quarterly" | "annual";

export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  frequency: RecurringFrequency;
  next_due_date: string; // anchor date; current cycle is derived, not stored
  category_id: string | null;
  owner_person_id: string | null;
  default_payment_method: PaymentMethod | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

export interface CcPayment {
  id: string;
  person_id: string;
  month: string;
  amount_paid: number;
  note: string | null;
  payment_date: string;
  created_at: string;
}

export interface OpeningCcBalance {
  person_id: string;
  as_of_month: string;
  balance: number;
}

export interface CcStatement {
  id: string;
  person_id: string;
  month: string;
  statement_amount: number;
  note: string | null;
  created_at: string;
}

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  priority_order: number;
  target_date: string | null;
  reached_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
