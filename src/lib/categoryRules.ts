import type { PaymentMethod, Person } from "@/lib/types";

/**
 * Hard business rules pinning a category to one person's card, regardless
 * of who is logging the entry — e.g. the household agreed all Taxi spend
 * goes on Kiki's credit card only, so both Josh and Kiki logging a Taxi
 * expense must land on Kiki + credit. Keyed by category name since
 * categories are otherwise data, not code (see CLAUDE.md); extend this map
 * for future hard-pinned categories.
 */
const CATEGORY_HARD_RULES: Record<
  string,
  { personName: string; paymentMethod: PaymentMethod }
> = {
  Taxi: { personName: "Kiki", paymentMethod: "credit" },
};

export interface CategoryHardRule {
  personId: string;
  personName: string;
  paymentMethod: PaymentMethod;
}

/**
 * Resolve the hard rule for a category name against the live people list, or
 * null when the category has no rule (or the named person can't be found —
 * e.g. before `people` has loaded).
 */
export function resolveCategoryHardRule(
  categoryName: string | null | undefined,
  people: Person[]
): CategoryHardRule | null {
  if (!categoryName) return null;
  const rule = CATEGORY_HARD_RULES[categoryName];
  if (!rule) return null;
  const person = people.find((p) => p.name === rule.personName);
  if (!person) return null;
  return { personId: person.id, personName: person.name, paymentMethod: rule.paymentMethod };
}
