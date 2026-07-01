export type PaymentMethod = "credit" | "debit";
export type TransactionType = "income" | "expense";
export type CategoryTreatAs = "expense" | "income" | "offset";
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
  amount: number;
  category_id: string;
  person_id: string;
  payment_method: PaymentMethod;
  type: TransactionType;
  note: string | null;
  source: EntrySource;
  raw_capture_text: string | null;
  created_by_person_id: string | null;
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

export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  due_day: number;
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
  created_at: string;
}

export interface OpeningCcBalance {
  person_id: string;
  as_of_month: string;
  balance: number;
}
