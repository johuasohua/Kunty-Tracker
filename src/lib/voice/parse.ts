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

/**
 * Resolve an *explicitly spoken* date phrase to an ISO date, or null when the
 * utterance names no date. Per the parser rules, date is inferred only when
 * mentioned; callers decide whether to default a null to today.
 */
function matchExplicitDate(text: string, now: Date): string | null {
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

  return null;
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

// ---------------------------------------------------------------------------
// SPEECH_TO_TX_PARSER
// ---------------------------------------------------------------------------

/**
 * Output shape of the speech-to-transaction parser: one object per
 * transaction, in the agreed schema. `amount` is *signed* — positive means
 * paid on credit, negative means debit — and `type` mirrors that sign. The
 * app itself stores a positive amount plus a separate payment method, so the
 * mapping to the app schema happens in {@link parsedToDraft}.
 */
export interface ParsedTransaction {
  date: string | null; // "YYYY-MM-DD", or null when no date was spoken
  amount: number; // signed: + = credit, - = debit
  person: string; // "Josh" | "Kiki"
  category: string; // resolved category name, e.g. "Taxi"
  note: string; // merchant details / extra context
  type: "debit" | "credit";
}

function defaultPerson(ctx: ParseContext): Person | null {
  return ctx.people.find((p) => p.id === ctx.defaultPersonId) ?? null;
}

/** Turn one already-split segment into a parser-schema transaction. */
function segmentToParsed(
  segment: string,
  ctx: ParseContext,
  now: Date
): ParsedTransaction {
  const text = ` ${segment.toLowerCase().trim()} `;

  const rawAmount = extractAmount(text) ?? 0;
  const category = extractCategory(text, ctx.categories);
  const person = extractPerson(text, ctx.people) ?? defaultPerson(ctx);
  const method = extractMethod(text) ?? ctx.defaultMethod;
  const signed = method === "debit" ? -Math.abs(rawAmount) : Math.abs(rawAmount);

  return {
    date: matchExplicitDate(text, now),
    amount: signed,
    person: person?.name ?? "",
    category: category?.name ?? "",
    note: buildNote(segment, category, ctx.people) ?? "",
    type: method,
  };
}

/**
 * SPEECH_TO_TX_PARSER — the public entry point. Splits a (possibly batched)
 * utterance into one clean transaction object per spoken transaction, in the
 * agreed schema. Budget commands (see {@link parseBudgetCommand}) are not
 * transactions and are excluded here.
 */
export function speechToTransactions(
  input: string,
  ctx: ParseContext
): ParsedTransaction[] {
  const now = ctx.now ?? new Date();
  return splitSegments(input)
    .filter((seg) => !parseBudgetCommand(seg, ctx))
    .map((seg) => segmentToParsed(seg, ctx, now));
}

/**
 * Map a parser-schema transaction onto the app's editable draft: resolve the
 * category/person names to ids, take the absolute amount with the sign folded
 * into the payment method, derive income/expense from the category, and
 * default a missing date to today.
 */
export function parsedToDraft(
  parsed: ParsedTransaction,
  ctx: ParseContext,
  rawText = ""
): VoiceDraft {
  const now = ctx.now ?? new Date();
  const category =
    ctx.categories.find(
      (c) => c.name.toLowerCase() === parsed.category.toLowerCase()
    ) ?? null;
  const person =
    ctx.people.find((p) => p.name.toLowerCase() === parsed.person.toLowerCase()) ??
    null;

  const amount = parsed.amount === 0 ? null : Math.abs(parsed.amount);
  const method: PaymentMethod = parsed.type ?? (parsed.amount < 0 ? "debit" : "credit");
  const personId = person?.id ?? ctx.defaultPersonId;
  const type: TransactionType =
    category?.treat_as === "income" ? "income" : "expense";

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
    date: parsed.date ?? todayISO(now),
    note: parsed.note || null,
    rawText,
    unresolved,
  };
}

/** Parse one segment (already split from any batch) into a single draft. */
export function parseSegment(segment: string, ctx: ParseContext): VoiceDraft {
  const now = ctx.now ?? new Date();
  return parsedToDraft(segmentToParsed(segment, ctx, now), ctx, segment.trim());
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
 * Split an utterance into candidate segments — one per transaction/command.
 * A segment is only kept if it contains a number, so number-less fragments
 * (e.g. a stray "Josh and" half) are dropped rather than merged.
 */
function splitSegments(input: string): string[] {
  return input
    .split(BATCH_SEPARATORS)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && /\d/.test(s));
}

/**
 * Split a spoken (or typed) utterance into one draft per transaction.
 * Batch mode: "Kiki spent 47 on Zomato and Josh 30 on taxi" → two drafts.
 * Budget commands are excluded (see {@link parseVoiceSession}).
 */
export function parseVoiceInput(input: string, ctx: ParseContext): VoiceDraft[] {
  return parseVoiceSession(input, ctx).transactions;
}

// ---------------------------------------------------------------------------
// Budget voice commands — "Set Josh Taxi budget 800 monthly"
// ---------------------------------------------------------------------------

export interface BudgetCommand {
  id: string;
  personName: string | null; // null = shared / household budget
  personId: string | null;
  categoryName: string;
  categoryId: string | null;
  monthlyAmount: number; // always normalised to a monthly figure
  period: "monthly" | "annual"; // as spoken
  rawText: string;
  unresolved: Array<"amount" | "category">;
}

/**
 * Recognise a budget-setting command in a segment, e.g.
 * "Set Josh Taxi budget 800 monthly" or "Zomato budget 500 shared". Returns
 * null when the segment isn't a budget command (it's then treated as a normal
 * transaction). An annual figure is normalised to a monthly amount.
 */
export function parseBudgetCommand(
  segment: string,
  ctx: ParseContext
): BudgetCommand | null {
  const text = ` ${segment.toLowerCase().trim()} `;
  if (!/\bbudget\b/.test(text)) return null;

  const amount = extractAmount(text);
  if (amount === null || amount <= 0) return null;

  const category = extractCategory(text, ctx.categories);
  const shared = /\b(shared|both|joint|household|combined|our)\b/.test(text);
  const person = shared ? null : extractPerson(text, ctx.people);
  const period: "monthly" | "annual" = /\b(annual|annually|yearly|per year|a year|year)\b/.test(
    text
  )
    ? "annual"
    : "monthly";
  const monthlyAmount = period === "annual" ? amount / 12 : amount;

  const unresolved: BudgetCommand["unresolved"] = [];
  if (!category) unresolved.push("category");

  return {
    id: nextId(),
    personName: person?.name ?? null,
    personId: person?.id ?? null,
    categoryName: category?.name ?? "",
    categoryId: category?.id ?? null,
    monthlyAmount,
    period,
    rawText: segment.trim(),
    unresolved,
  };
}

export interface VoiceParseResult {
  transactions: VoiceDraft[];
  budgetCommands: BudgetCommand[];
}

/**
 * Full voice session parse: classifies each segment as a budget command or a
 * transaction and returns both lists. This is what the voice flow consumes.
 */
export function parseVoiceSession(
  input: string,
  ctx: ParseContext
): VoiceParseResult {
  const transactions: VoiceDraft[] = [];
  const budgetCommands: BudgetCommand[] = [];

  for (const seg of splitSegments(input)) {
    const budget = parseBudgetCommand(seg, ctx);
    if (budget) {
      budgetCommands.push(budget);
    } else {
      transactions.push(parseSegment(seg, ctx));
    }
  }

  return { transactions, budgetCommands };
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
