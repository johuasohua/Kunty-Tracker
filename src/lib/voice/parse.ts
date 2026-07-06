import type { Category, PaymentMethod, Person, TransactionType } from "@/lib/types";

/**
 * A single parsed transaction ready for review. Every field is a best-effort
 * guess — the confirmation screen lets the user fix anything before saving.
 * `unresolved` lists the fields the parser couldn't fill confidently so the
 * UI can highlight them.
 */
export interface VoiceDraft {
  id: string;
  amount: number | null;
  categoryId: string | null;
  personId: string | null;
  paymentMethod: PaymentMethod;
  type: TransactionType;
  date: string; // yyyy-mm-dd
  note: string | null;
  rawText: string;
  unresolved: Array<"amount" | "category" | "person">;
}

export interface ParseContext {
  categories: Category[];
  people: Person[];
  defaultPersonId: string | null;
  defaultMethod: PaymentMethod;
  now?: Date;
}

/**
 * Keyword → category-name aliases. Auto-categorization matches these against
 * the spoken text; the category itself is resolved by name against the live
 * category list (categories are data, so this maps aliases to names, never
 * to hard-coded ids). Extend freely — refined in a later phase.
 */
const CATEGORY_ALIASES: Record<string, string[]> = {
  Taxi: ["taxi", "uber", "careem", "cab", "ride"],
  Zomato: ["zomato", "dinner", "lunch", "food", "takeaway", "takeout", "restaurant", "deliveroo", "talabat"],
  Instashop: ["instashop", "groceries", "grocery", "supermarket", "carrefour", "spinneys"],
  Salary: ["salary", "paycheck", "payroll", "wages", "income"],
  Investments: ["investment", "investments", "stocks", "shares", "dividend"],
  Bills: ["bill", "bills", "utility", "utilities", "dewa", "internet", "electricity", "water"],
  Shopping: ["shopping", "clothes", "amazon", "noon", "shein"],
  Lifestyle: ["lifestyle", "gym", "spa", "haircut", "salon", "entertainment"],
  Travel: ["travel", "flight", "flights", "hotel", "airbnb", "trip"],
  Maintenance: ["maintenance", "repair", "repairs", "plumber", "handyman"],
  Mortgage: ["mortgage", "principal"],
  Offset: ["offset", "transfer to offset"],
  Refunds: ["refund", "refunds", "reimbursement", "cashback"],
};

/** Words that separate one transaction from the next in a batch utterance.
 * A segment is only kept if it contains a number (see parseVoiceInput), so a
 * stray "Josh and Kiki" style split simply drops the number-less half. */
const BATCH_SEPARATORS = /\s*(?:\band then\b|\bthen\b|\balso\b|\bnext\b|\bplus\b|\band\b|&|;|\n|(?:\.\s))\s*/i;

function todayISO(now: Date): string {
  return toISO(now);
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/** Resolve a spoken date phrase to an ISO date, defaulting to today. */
function extractDate(text: string, now: Date): string {
  if (/\bday before yesterday\b/.test(text)) return toISO(addDays(now, -2));
  if (/\byesterday\b/.test(text)) return toISO(addDays(now, -1));
  if (/\b(today|now|just now)\b/.test(text)) return todayISO(now);

  const daysAgo = text.match(/\b(\d+)\s+days?\s+ago\b/);
  if (daysAgo) return toISO(addDays(now, -parseInt(daysAgo[1], 10)));

  // "last monday" / "on tuesday" → most recent past occurrence of that weekday.
  const weekday = text.match(
    /\b(?:last\s+|on\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/
  );
  if (weekday) {
    const target = WEEKDAYS.indexOf(weekday[1]);
    let d = new Date(now);
    do {
      d = addDays(d, -1);
    } while (d.getDay() !== target);
    return toISO(d);
  }

  return todayISO(now);
}

/** First monetary amount in the segment. Supports "1,200", "47.50", "10k". */
function extractAmount(text: string): number | null {
  const kMatch = text.match(/(\d[\d,]*(?:\.\d+)?)\s*k\b/i);
  if (kMatch) {
    const n = parseFloat(kMatch[1].replace(/,/g, ""));
    if (!Number.isNaN(n)) return n * 1000;
  }
  const match = text.match(/(\d[\d,]*(?:\.\d+)?)/);
  if (!match) return null;
  const n = parseFloat(match[1].replace(/,/g, ""));
  return Number.isNaN(n) ? null : n;
}

function extractPerson(text: string, people: Person[]): Person | null {
  for (const p of people) {
    const name = p.name.toLowerCase();
    if (new RegExp(`\\b${escapeRegExp(name)}\\b`, "i").test(text)) return p;
  }
  return null;
}

function extractMethod(text: string): PaymentMethod | null {
  if (/\b(debit|cash|bank)\b/.test(text)) return "debit";
  if (/\bcredit\b/.test(text)) return "credit";
  return null;
}

/**
 * Auto-categorization: score each active category by alias/name hits in the
 * text and return the best match. Returns null when nothing matches.
 */
function extractCategory(text: string, categories: Category[]): Category | null {
  let best: { category: Category; score: number } | null = null;

  for (const category of categories) {
    const aliases = CATEGORY_ALIASES[category.name] ?? [];
    const needles = [category.name.toLowerCase(), ...aliases];
    let score = 0;
    for (const needle of needles) {
      if (new RegExp(`\\b${escapeRegExp(needle)}\\b`, "i").test(text)) {
        // Prefer longer, more specific matches.
        score = Math.max(score, needle.length);
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { category, score };
    }
  }

  return best?.category ?? null;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

let draftCounter = 0;
function nextId(): string {
  draftCounter += 1;
  return `draft-${Date.now()}-${draftCounter}`;
}

/** Parse one segment (already split from any batch) into a single draft. */
export function parseSegment(segment: string, ctx: ParseContext): VoiceDraft {
  const now = ctx.now ?? new Date();
  const text = ` ${segment.toLowerCase().trim()} `;

  const amount = extractAmount(text);
  const category = extractCategory(text, ctx.categories);
  const person = extractPerson(text, ctx.people);
  const method = extractMethod(text) ?? ctx.defaultMethod;
  const date = extractDate(text, now);

  const type: TransactionType =
    category?.treat_as === "income" ? "income" : "expense";

  const personId = person?.id ?? ctx.defaultPersonId;

  const unresolved: VoiceDraft["unresolved"] = [];
  if (amount === null || amount <= 0) unresolved.push("amount");
  if (!category) unresolved.push("category");
  if (!personId) unresolved.push("person");

  return {
    id: nextId(),
    amount,
    categoryId: category?.id ?? null,
    personId,
    paymentMethod: method,
    type,
    date,
    note: buildNote(segment, category, ctx.people),
    rawText: segment.trim(),
    unresolved,
  };
}

/** Structural words stripped when distilling a note from raw speech. */
const NOTE_FILLER = new RegExp(
  "\\b(?:" +
    "spent|spend|paid|pay|cost|costs|bought|buy|for|on|of|to|the|a|an|" +
    "credit|debit|cash|bank|card|dirhams?|aed|dollars?|" +
    "yesterday|today|now|just|tomorrow|day before|ago|last|" +
    "sunday|monday|tuesday|wednesday|thursday|friday|saturday|days?|" +
    "transfer|transferred" +
    ")\\b",
  "ig"
);

/**
 * Distil a short human note from the raw phrase by stripping the parts the
 * parser has already captured as structured fields — the amount, category,
 * person, payment method and date words — plus common filler. So "Kiki spent
 * 47 on Zomato yesterday for dinner" leaves just "dinner". Null when nothing
 * meaningful remains.
 */
function buildNote(
  segment: string,
  category: Category | null,
  people: Person[]
): string | null {
  let note = ` ${segment} `;
  // Amounts (including "10k").
  note = note.replace(/\d[\d,]*(?:\.\d+)?\s*k?\b/gi, " ");
  // Category name + its aliases.
  if (category) {
    const needles = [category.name, ...(CATEGORY_ALIASES[category.name] ?? [])];
    for (const needle of needles) {
      note = note.replace(new RegExp(`\\b${escapeRegExp(needle)}\\b`, "ig"), " ");
    }
  }
  // Person names.
  for (const p of people) {
    note = note.replace(new RegExp(`\\b${escapeRegExp(p.name)}\\b`, "ig"), " ");
  }
  // Structural filler + date words.
  note = note.replace(NOTE_FILLER, " ");
  note = note.replace(/\s+/g, " ").trim();
  return note.length >= 3 ? note : null;
}

/**
 * Split a spoken (or typed) utterance into one draft per transaction.
 * Batch mode: "Kiki spent 47 on Zomato and Josh 30 on taxi" → two drafts.
 */
export function parseVoiceInput(input: string, ctx: ParseContext): VoiceDraft[] {
  const segments = input
    .split(BATCH_SEPARATORS)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && /\d/.test(s)); // a real entry needs a number

  if (segments.length === 0) return [];
  return segments.map((segment) => parseSegment(segment, ctx));
}

/** Ready-made template phrases surfaced as quick-start chips. */
export interface VoiceTemplate {
  label: string;
  categoryName: string;
  example: string;
}

export const VOICE_TEMPLATES: VoiceTemplate[] = [
  { label: "Taxi", categoryName: "Taxi", example: "Taxi 30 today" },
  { label: "Zomato", categoryName: "Zomato", example: "Zomato 47 dinner" },
  { label: "Instashop", categoryName: "Instashop", example: "Instashop 120 groceries" },
  { label: "Salary", categoryName: "Salary", example: "Salary 10000 credit" },
  { label: "Offset", categoryName: "Offset", example: "Transfer 5000 to Offset" },
  { label: "Mortgage", categoryName: "Mortgage", example: "Mortgage 5000 principal today" },
];

/** A blank draft seeded from a template category, for manual quick-add. */
export function templateDraft(
  categoryName: string,
  ctx: ParseContext
): VoiceDraft {
  const category = ctx.categories.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase()
  );
  const now = ctx.now ?? new Date();
  const unresolved: VoiceDraft["unresolved"] = ["amount"];
  if (!category) unresolved.push("category");
  if (!ctx.defaultPersonId) unresolved.push("person");
  return {
    id: nextId(),
    amount: null,
    categoryId: category?.id ?? null,
    personId: ctx.defaultPersonId,
    paymentMethod: ctx.defaultMethod,
    type: category?.treat_as === "income" ? "income" : "expense",
    date: todayISO(now),
    note: null,
    rawText: "",
    unresolved,
  };
}

/** A completely empty draft for the "add manually" affordance. */
export function blankDraft(ctx: ParseContext): VoiceDraft {
  return templateDraft("", ctx);
}
