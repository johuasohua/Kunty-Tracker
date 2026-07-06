import type {
  Budget,
  CcPayment,
  Category,
  OpeningCcBalance,
  Person,
  RecurringBill,
  RecurringFrequency,
} from "@/lib/types";
import type {
  LightTransaction,
  OpeningBalanceSeed,
} from "@/lib/queries/dashboard-data";
import type { RecurringBillPayment } from "@/lib/queries/recurring";
import { monthKey } from "@/lib/format";

export interface MonthPoint {
  key: string; // "2026-01"
  date: Date; // first of month
  totalIncome: number;
  totalExpense: number; // expense categories minus offset categories
  net: number;
  opening: number;
  closing: number;
}

function categoryTreatAsMap(categories: Category[]) {
  const map = new Map<string, Category["treat_as"]>();
  for (const c of categories) map.set(c.id, c.treat_as);
  return map;
}

/**
 * Builds a chronological, gap-free monthly series from the earliest
 * transaction (or the opening balance seed month, if earlier) through the
 * given end month, with running opening/closing balances.
 */
export function buildMonthlySeries(
  transactions: LightTransaction[],
  categories: Category[],
  seed: OpeningBalanceSeed | null,
  endMonth: Date
): MonthPoint[] {
  const treatAs = categoryTreatAsMap(categories);

  const perMonth = new Map<string, { income: number; expense: number }>();
  for (const t of transactions) {
    const d = new Date(t.occurred_on);
    const key = monthKey(d);
    const bucket = perMonth.get(key) ?? { income: 0, expense: 0 };
    const kind = treatAs.get(t.category_id);
    if (t.type === "income") {
      bucket.income += t.amount;
    } else if (kind === "offset") {
      bucket.expense -= t.amount;
    } else {
      bucket.expense += t.amount;
    }
    perMonth.set(key, bucket);
  }

  let startDate: Date;
  if (seed) {
    startDate = new Date(seed.as_of_month);
  } else if (transactions.length > 0) {
    startDate = new Date(transactions[0].occurred_on);
  } else {
    startDate = endMonth;
  }
  startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endMonth.getFullYear(), endMonth.getMonth(), 1);

  const series: MonthPoint[] = [];
  let running = seed?.balance ?? 0;
  const cursor = new Date(startDate);

  while (cursor <= end) {
    const key = monthKey(cursor);
    const bucket = perMonth.get(key) ?? { income: 0, expense: 0 };
    const opening = running;
    const net = bucket.income - bucket.expense;
    const closing = opening + net;
    series.push({
      key,
      date: new Date(cursor),
      totalIncome: bucket.income,
      totalExpense: bucket.expense,
      net,
      opening,
      closing,
    });
    running = closing;
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return series;
}

export interface CategoryBreakdown {
  category: Category;
  total: number;
  byPerson: Record<string, number>;
  byAccount: Record<string, number>; // `${person_id}:${payment_method}`
}

export function breakdownByCategory(
  transactions: LightTransaction[],
  categories: Category[],
  month: Date
): CategoryBreakdown[] {
  const key = monthKey(month);
  const inMonth = transactions.filter(
    (t) => monthKey(new Date(t.occurred_on)) === key && t.type === "expense"
  );

  const byCategory = new Map<string, CategoryBreakdown>();
  for (const cat of categories) {
    if (cat.treat_as === "income") continue;
    byCategory.set(cat.id, {
      category: cat,
      total: 0,
      byPerson: {},
      byAccount: {},
    });
  }

  for (const t of inMonth) {
    const entry = byCategory.get(t.category_id);
    if (!entry) continue;
    const sign = entry.category.treat_as === "offset" ? -1 : 1;
    entry.total += sign * t.amount;
    entry.byPerson[t.person_id] = (entry.byPerson[t.person_id] ?? 0) + sign * t.amount;
    const accountKey = `${t.person_id}:${t.payment_method}`;
    entry.byAccount[accountKey] = (entry.byAccount[accountKey] ?? 0) + sign * t.amount;
  }

  return Array.from(byCategory.values()).sort((a, b) => b.total - a.total);
}

export interface CategoryInsight {
  categoryId: string;
  categoryName: string;
  currentTotal: number;
  averageTotal: number;
  percentDelta: number; // e.g. 0.32 = 32% above average
}

/**
 * Flags expense categories trending meaningfully above their trailing
 * 3-month average. Simple rule-based comparison, not real "AI".
 */
export function computeInsights(
  transactions: LightTransaction[],
  categories: Category[],
  month: Date,
  thresholdPct = 0.2
): CategoryInsight[] {
  const insights: CategoryInsight[] = [];

  const trailingMonths: Date[] = [1, 2, 3].map(
    (n) => new Date(month.getFullYear(), month.getMonth() - n, 1)
  );

  const current = breakdownByCategory(transactions, categories, month);

  for (const entry of current) {
    if (entry.category.treat_as !== "expense") continue;
    if (entry.total <= 0) continue;

    const trailingTotals = trailingMonths.map(
      (m) =>
        breakdownByCategory(transactions, categories, m).find(
          (b) => b.category.id === entry.category.id
        )?.total ?? 0
    );
    const withData = trailingTotals.filter((v) => v > 0);
    if (withData.length === 0) continue;

    const average =
      trailingTotals.reduce((a, b) => a + b, 0) / trailingTotals.length;
    if (average <= 0) continue;

    const percentDelta = (entry.total - average) / average;
    if (percentDelta >= thresholdPct) {
      insights.push({
        categoryId: entry.category.id,
        categoryName: entry.category.name,
        currentTotal: entry.total,
        averageTotal: average,
        percentDelta,
      });
    }
  }

  return insights.sort((a, b) => b.percentDelta - a.percentDelta);
}

export interface AnnualCategoryTotal {
  category: Category;
  total: number;
  byMonth: number[]; // index 0 = January
}

export function breakdownByCategoryForYear(
  transactions: LightTransaction[],
  categories: Category[],
  year: number
): AnnualCategoryTotal[] {
  const byCategory = new Map<string, AnnualCategoryTotal>();
  for (const cat of categories) {
    if (cat.treat_as === "income") continue;
    byCategory.set(cat.id, { category: cat, total: 0, byMonth: Array(12).fill(0) });
  }

  for (const t of transactions) {
    if (t.type !== "expense") continue;
    const d = new Date(t.occurred_on);
    if (d.getFullYear() !== year) continue;
    const entry = byCategory.get(t.category_id);
    if (!entry) continue;
    const sign = entry.category.treat_as === "offset" ? -1 : 1;
    entry.total += sign * t.amount;
    entry.byMonth[d.getMonth()] += sign * t.amount;
  }

  return Array.from(byCategory.values()).sort((a, b) => b.total - a.total);
}

export interface CcMonthPoint {
  key: string;
  date: Date;
  currentSpend: number; // credit-card spend this month
  debitSpend: number; // debit spend this month
  paidOff: number; // amount actually paid off the card this month
  carryOver: number; // CC balance carried into this month
  closing: number; // CC balance carried out of this month
  cashFlowExpense: number; // debitSpend + paidOff — the real cash that left the bank
}

/**
 * Per-person credit card balance trend. Mirrors the "Balances" sheet:
 * current month CC spend and the amount actually paid off are tracked
 * separately, so paying down a card isn't double-counted against raw
 * card spend. carryOver/closing form a running balance seeded by
 * opening_cc_balances.
 */
export function buildCcSeries(
  transactions: LightTransaction[],
  ccPayments: CcPayment[],
  openingBalances: OpeningCcBalance[],
  personId: string,
  endMonth: Date
): CcMonthPoint[] {
  const seed = openingBalances.find((b) => b.person_id === personId) ?? null;
  const personTransactions = transactions.filter((t) => t.person_id === personId);

  const spendByMonth = new Map<string, { credit: number; debit: number }>();
  for (const t of personTransactions) {
    if (t.type !== "expense") continue;
    const key = monthKey(new Date(t.occurred_on));
    const bucket = spendByMonth.get(key) ?? { credit: 0, debit: 0 };
    if (t.payment_method === "credit") bucket.credit += t.amount;
    else bucket.debit += t.amount;
    spendByMonth.set(key, bucket);
  }

  const paidByMonth = new Map<string, number>();
  for (const p of ccPayments) {
    if (p.person_id !== personId) continue;
    const key = monthKey(new Date(p.month));
    paidByMonth.set(key, (paidByMonth.get(key) ?? 0) + p.amount_paid);
  }

  let startDate: Date;
  if (seed) {
    startDate = new Date(seed.as_of_month);
  } else if (personTransactions.length > 0) {
    startDate = new Date(personTransactions[0].occurred_on);
  } else {
    startDate = endMonth;
  }
  startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endMonth.getFullYear(), endMonth.getMonth(), 1);

  const series: CcMonthPoint[] = [];
  let running = seed?.balance ?? 0;
  const cursor = new Date(startDate);

  while (cursor <= end) {
    const key = monthKey(cursor);
    const spend = spendByMonth.get(key) ?? { credit: 0, debit: 0 };
    const paidOff = paidByMonth.get(key) ?? 0;
    const carryOver = running;
    const closing = carryOver + spend.credit - paidOff;
    series.push({
      key,
      date: new Date(cursor),
      currentSpend: spend.credit,
      debitSpend: spend.debit,
      paidOff,
      carryOver,
      closing,
      cashFlowExpense: spend.debit + paidOff,
    });
    running = closing;
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return series;
}

export interface BudgetProgressRow {
  person: Person | null; // null = shared budget across both people
  budgetAmount: number;
  actualAmount: number;
}

export interface BudgetProgressEntry {
  category: Category;
  rows: BudgetProgressRow[];
  totalBudget: number;
  totalActual: number;
}

/**
 * For each category with an active budget, resolves the currently
 * applicable amount(s) — either one shared figure, or one per person if
 * per-person sub-budgets exist for that category (per-person takes
 * precedence over any shared row for the same category) — and pairs it
 * with actual spend for the given month.
 */
export function computeBudgetProgress(
  budgets: Budget[],
  categories: Category[],
  transactions: LightTransaction[],
  people: Person[],
  month: Date
): BudgetProgressEntry[] {
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const applicable = budgets.filter((b) => new Date(b.effective_from) <= monthStart);

  // Latest applicable row per (category_id, person_id) key.
  const latestByKey = new Map<string, Budget>();
  for (const b of applicable) {
    const key = `${b.category_id}:${b.person_id ?? "shared"}`;
    const existing = latestByKey.get(key);
    if (!existing || new Date(b.effective_from) > new Date(existing.effective_from)) {
      latestByKey.set(key, b);
    }
  }

  const byCategory = new Map<string, Budget[]>();
  for (const b of latestByKey.values()) {
    const list = byCategory.get(b.category_id) ?? [];
    list.push(b);
    byCategory.set(b.category_id, list);
  }

  const breakdown = breakdownByCategory(transactions, categories, month);
  const breakdownByCategoryId = new Map(breakdown.map((b) => [b.category.id, b]));

  const entries: BudgetProgressEntry[] = [];
  for (const [categoryId, categoryBudgets] of byCategory) {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) continue;

    const perPerson = categoryBudgets.filter((b) => b.person_id !== null);
    const shared = categoryBudgets.find((b) => b.person_id === null);
    const spend = breakdownByCategoryId.get(categoryId);

    const rows: BudgetProgressRow[] = [];
    if (perPerson.length > 0) {
      for (const b of perPerson) {
        const person = people.find((p) => p.id === b.person_id) ?? null;
        rows.push({
          person,
          budgetAmount: b.monthly_amount,
          actualAmount: spend?.byPerson[b.person_id as string] ?? 0,
        });
      }
    } else if (shared) {
      rows.push({
        person: null,
        budgetAmount: shared.monthly_amount,
        actualAmount: spend?.total ?? 0,
      });
    }

    if (rows.length === 0) continue;

    entries.push({
      category,
      rows,
      totalBudget: rows.reduce((sum, r) => sum + r.budgetAmount, 0),
      totalActual: rows.reduce((sum, r) => sum + r.actualAmount, 0),
    });
  }

  return entries.sort((a, b) => b.totalActual / b.totalBudget - a.totalActual / a.totalBudget);
}

export function intervalMonthsForFrequency(frequency: RecurringFrequency): number {
  return frequency === "monthly" ? 1 : frequency === "quarterly" ? 3 : 12;
}

/** The recurring bill's real per-payment amount, spread evenly across its
 * billing interval — e.g. an AED 700/year subscription is "≈ AED 58.33/mo".
 * Informational only: the actual transaction logged when marking paid is
 * always the full amount, on the real date it's actually paid. */
export function amortizedMonthlyAmount(bill: RecurringBill): number {
  return bill.amount / intervalMonthsForFrequency(bill.frequency);
}

function dateOnlyString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * The due date of the current unpaid cycle for this bill. `next_due_date`
 * is a fixed anchor (the bill's first-ever due date) — every cycle already
 * covered by a payment row advances the cursor by one billing interval,
 * so this works the same way for monthly, quarterly, and annual bills
 * without ever mutating the stored anchor.
 */
export function currentCycleDueDate(
  bill: RecurringBill,
  payments: RecurringBillPayment[]
): Date {
  const interval = intervalMonthsForFrequency(bill.frequency);
  const paidDueDates = new Set(
    payments.filter((p) => p.recurring_bill_id === bill.id).map((p) => p.month)
  );

  let cursor = new Date(bill.next_due_date);
  // Guard against a runaway loop if something is malformed; a decade of
  // cycles is far more than this app will ever need to advance through.
  for (let i = 0; i < 480 && paidDueDates.has(dateOnlyString(cursor)); i++) {
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + interval, cursor.getDate());
  }
  return cursor;
}

export interface UpcomingBill {
  bill: RecurringBill;
  dueDate: Date;
  daysUntilDue: number;
  overdue: boolean;
}

/**
 * Bills whose current (unpaid) cycle is due within the next `withinDays`
 * days, or already overdue. Works uniformly across monthly/quarterly/
 * annual bills since the cycle due date is derived per-bill.
 */
export function computeUpcomingBills(
  bills: RecurringBill[],
  payments: RecurringBillPayment[],
  today: Date,
  withinDays = 7
): UpcomingBill[] {
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const results: UpcomingBill[] = [];

  for (const bill of bills) {
    const dueDate = currentCycleDueDate(bill, payments);
    const daysUntilDue = Math.round(
      (dueDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilDue <= withinDays) {
      results.push({ bill, dueDate, daysUntilDue, overdue: daysUntilDue < 0 });
    }
  }

  return results.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

/**
 * Same shape as computeBudgetProgress, but for a full calendar year:
 * actual spend sums every month of the year, and the target is the
 * currently-applicable monthly budget (resolved as of December of that
 * year) times 12.
 */
export function computeBudgetProgressForYear(
  budgets: Budget[],
  categories: Category[],
  transactions: LightTransaction[],
  people: Person[],
  year: number
): BudgetProgressEntry[] {
  const yearEnd = new Date(year, 11, 1);
  const applicable = budgets.filter((b) => new Date(b.effective_from) <= yearEnd);

  const latestByKey = new Map<string, Budget>();
  for (const b of applicable) {
    const key = `${b.category_id}:${b.person_id ?? "shared"}`;
    const existing = latestByKey.get(key);
    if (!existing || new Date(b.effective_from) > new Date(existing.effective_from)) {
      latestByKey.set(key, b);
    }
  }

  const byCategory = new Map<string, Budget[]>();
  for (const b of latestByKey.values()) {
    const list = byCategory.get(b.category_id) ?? [];
    list.push(b);
    byCategory.set(b.category_id, list);
  }

  // Actual spend for the year, split by category and by person.
  const actualByKey = new Map<string, number>(); // `${categoryId}:${personId}`
  const actualByCategory = new Map<string, number>();
  const categoryTreatAs = categoryTreatAsMap(categories);

  for (const t of transactions) {
    if (t.type !== "expense") continue;
    const d = new Date(t.occurred_on);
    if (d.getFullYear() !== year) continue;
    const sign = categoryTreatAs.get(t.category_id) === "offset" ? -1 : 1;

    const key = `${t.category_id}:${t.person_id}`;
    actualByKey.set(key, (actualByKey.get(key) ?? 0) + sign * t.amount);
    actualByCategory.set(
      t.category_id,
      (actualByCategory.get(t.category_id) ?? 0) + sign * t.amount
    );
  }

  const entries: BudgetProgressEntry[] = [];
  for (const [categoryId, categoryBudgets] of byCategory) {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) continue;

    const perPerson = categoryBudgets.filter((b) => b.person_id !== null);
    const shared = categoryBudgets.find((b) => b.person_id === null);

    const rows: BudgetProgressRow[] = [];
    if (perPerson.length > 0) {
      for (const b of perPerson) {
        const person = people.find((p) => p.id === b.person_id) ?? null;
        rows.push({
          person,
          budgetAmount: b.monthly_amount * 12,
          actualAmount: actualByKey.get(`${categoryId}:${b.person_id}`) ?? 0,
        });
      }
    } else if (shared) {
      rows.push({
        person: null,
        budgetAmount: shared.monthly_amount * 12,
        actualAmount: actualByCategory.get(categoryId) ?? 0,
      });
    }

    if (rows.length === 0) continue;

    entries.push({
      category,
      rows,
      totalBudget: rows.reduce((sum, r) => sum + r.budgetAmount, 0),
      totalActual: rows.reduce((sum, r) => sum + r.actualAmount, 0),
    });
  }

  return entries.sort((a, b) => b.totalActual / b.totalBudget - a.totalActual / a.totalBudget);
}
