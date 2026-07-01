import type { Category } from "@/lib/types";
import type {
  LightTransaction,
  OpeningBalanceSeed,
} from "@/lib/queries/dashboard-data";
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
