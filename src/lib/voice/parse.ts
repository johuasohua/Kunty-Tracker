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
  "Food Delivery": ["food delivery", "zomato", "deliveroo", "talabat", "food", "dinner", "lunch", "takeaway", "takeout", "restaurant", "ordered"],
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

/** First monetary amount in the segment. Tries, in order: a number next to a
 * currency word ("47 aed", "dhs 300"), a number after a spend verb ("paid
 * 3000", "for 250"), a k-suffixed shorthand ("10k"), then the first bare
 * number. Date phrases are stripped first so "3 days ago" can't be read as
 * an amount. Word numbers ("forty-seven") are handled upstream by
 * normalizeWordNumbers, which rewrites them to digits. */
function extractAmount(text: string): number | null {
  const t = text
    .replace(/\b\d+\s+days?\s+ago\b/gi, " ")
    .replace(/\bday before yesterday\b/gi, " ");

  const NUM = "(\\d[\\d,]*(?:\\.\\d+)?)\\s*(k)?";
  const strategies = [
    new RegExp(`${NUM}\\s*(?:aed|dhs|dirhams?)\\b`, "i"),
    new RegExp(`\\b(?:aed|dhs|dirhams?)\\s*${NUM}`, "i"),
    new RegExp(`\\b(?:spent|paid|pay|pays|costs?|for|worth)\\s+(?:about\\s+|around\\s+)?${NUM}\\b`, "i"),
    new RegExp(`${NUM.replace("(k)?", "(k)")}\\b`, "i"), // k-suffix anywhere
    new RegExp(NUM),
  ];

  for (const re of strategies) {
    const m = t.match(re);
    if (!m) continue;
    const n = parseFloat(m[1].replace(/,/g, ""));
    if (Number.isNaN(n)) continue;
    return m[2] ? n * 1000 : n;
  }
  return null;
}

// --- Word-number support ("forty-seven", "ten thousand", "one hundred and fifty") ---

const NUM_UNITS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19,
};
const NUM_TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, ninety: 90,
};
const NUM_SCALES: Record<string, number> = {
  hundred: 100, thousand: 1000, grand: 1000, million: 1000000,
};

interface WordToken {
  start: number;
  end: number;
  kind: "unit" | "tens" | "scale" | "and";
  value: number;
}

/** Classify one whitespace token (possibly hyphenated, e.g. "forty-seven"). */
function classifyNumberWord(raw: string): Omit<WordToken, "start" | "end">[] | null {
  const clean = raw.toLowerCase().replace(/[.,!?]+$/, "");
  const parts = clean.split("-");
  const out: Omit<WordToken, "start" | "end">[] = [];
  for (const p of parts) {
    if (p in NUM_UNITS) out.push({ kind: "unit", value: NUM_UNITS[p] });
    else if (p in NUM_TENS) out.push({ kind: "tens", value: NUM_TENS[p] });
    else if (p in NUM_SCALES) out.push({ kind: "scale", value: NUM_SCALES[p] });
    else if (p === "and") out.push({ kind: "and", value: 0 });
    else return null;
  }
  return out.length > 0 ? out : null;
}

function evaluateNumberRun(tokens: WordToken[]): number {
  let total = 0;
  let current = 0;
  for (const t of tokens) {
    if (t.kind === "and") continue;
    if (t.kind === "scale") {
      if (t.value >= 1000) {
        total += (current || 1) * t.value;
        current = 0;
      } else {
        current = (current || 1) * t.value;
      }
    } else {
      current += t.value;
    }
  }
  return total + current;
}

/**
 * Rewrite spoken number words to digits across the whole utterance, e.g.
 * "Zomato one hundred and fifty" → "Zomato 150". Runs *before* the batch
 * splitter so an "and" inside a number ("hundred and fifty") is consumed here
 * and can no longer be mistaken for a transaction separator. An "and" only
 * continues a run when it directly follows a scale word (hundred/thousand),
 * so "fifty and taxi thirty" still splits into two entries.
 */
export function normalizeWordNumbers(input: string): string {
  const tokenRe = /\S+/g;
  interface Raw { start: number; end: number; parts: Omit<WordToken, "start" | "end">[] | null; text: string }
  const raws: Raw[] = [];
  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(input)) !== null) {
    raws.push({ start: m.index, end: m.index + m[0].length, parts: classifyNumberWord(m[0]), text: m[0] });
  }

  const replacements: Array<{ start: number; end: number; value: number }> = [];
  let i = 0;
  while (i < raws.length) {
    if (!raws[i].parts || raws[i].parts!.every((p) => p.kind === "and")) {
      i += 1;
      continue;
    }
    // Start of a run — extend while tokens stay numeric under the "and" rule.
    const run: WordToken[] = [];
    let j = i;
    let lastKind: WordToken["kind"] | null = null;
    let endIndex = i; // last token actually included
    while (j < raws.length && raws[j].parts) {
      const parts = raws[j].parts!;
      const isPureAnd = parts.every((p) => p.kind === "and");
      if (isPureAnd) {
        // "and" continues the run only after a scale word and only when the
        // next token is numeric too; otherwise it terminates the run.
        const next = raws[j + 1];
        if (lastKind === "scale" && next?.parts && !next.parts.every((p) => p.kind === "and")) {
          j += 1; // consume the "and" but don't include it in bounds yet
          continue;
        }
        break;
      }
      for (const p of parts) run.push({ ...p, start: raws[j].start, end: raws[j].end });
      lastKind = parts[parts.length - 1].kind;
      endIndex = j;
      j += 1;
    }
    if (run.length > 0) {
      replacements.push({
        start: raws[i].start,
        end: raws[endIndex].end,
        value: evaluateNumberRun(run),
      });
    }
    i = Math.max(j, endIndex + 1);
  }

  if (replacements.length === 0) return input;
  let out = "";
  let cursor = 0;
  for (const r of replacements) {
    out += input.slice(cursor, r.start) + String(r.value);
    cursor = r.end;
  }
  out += input.slice(cursor);
  return out;
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
    note: buildNote(segment, category) ?? "",
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

/** Structural words stripped when distilling a note from raw speech.
 * Note: preserves location prepositions (to, at, near, from) for restaurant/location names.
 * Also preserves "ordered" context for food delivery transactions.
 */
const NOTE_FILLER = new RegExp(
  "\\b(?:" +
    "spent|spend|paid|pay|cost|costs|bought|buy|for|on|of|the|a|an|" +
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
 * and date words — plus common filler. So "Kiki spent 47 on Zomato yesterday
 * for dinner" leaves "dinner". Location context like "to office" or "at home"
 * is preserved. Null when nothing meaningful remains.
 *
 * Note: We now PRESERVE person names if they appear after location words
 * (e.g., "picked up Kiki" → "picked up Kiki"), since this adds useful context.
 */
function buildNote(
  segment: string,
  category: Category | null
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

  // Remove only the PRIMARY person from the start of the note (the one who paid).
  // If other people names appear later (e.g., "picked up Kiki"), keep them.
  // This preserves context like "picked up Kiki" or "with Josh" as notes.
  const primaryPersonName = segment.match(/\b(josh|kiki)\b/i)?.[1];
  if (primaryPersonName) {
    // Only remove the first occurrence of the primary person's name
    note = note.replace(new RegExp(`\\b${escapeRegExp(primaryPersonName)}\\b`, "i"), " ");
  }

  // Structural filler + date words (but NOT location prepositions).
  note = note.replace(NOTE_FILLER, " ");
  note = note.replace(/\s+/g, " ").trim();
  return note.length >= 3 ? note : null;
}

/**
 * Split an utterance into candidate segments — one per transaction/command.
 * Word numbers are normalised to digits first (so "hundred and fifty" can't
 * be split on its own "and"). Fragments without a number aren't dropped:
 * they're glued onto the neighbouring entry so "burger and fries 30" stays
 * one transaction with its full context intact.
 */
function splitSegments(input: string): string[] {
  const parts = normalizeWordNumbers(input)
    .split(BATCH_SEPARATORS)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const segments: string[] = [];
  let pendingPrefix = "";
  for (const part of parts) {
    if (/\d/.test(part)) {
      segments.push(pendingPrefix ? `${pendingPrefix} ${part}` : part);
      pendingPrefix = "";
    } else if (segments.length > 0) {
      segments[segments.length - 1] += ` ${part}`;
    } else {
      pendingPrefix = pendingPrefix ? `${pendingPrefix} ${part}` : part;
    }
  }
  return segments;
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

  // Merely *containing* "budget" isn't enough — "paid 500 for budget app" is
  // a transaction. It's a command only when phrased like one: an imperative
  // verb before "budget", or the amount directly adjacent to the word.
  const looksLikeCommand =
    /\b(set|update|change|make|adjust|increase|decrease)\b[\s\S]*\bbudget\b/.test(text) ||
    /\bbudget\b\s*(?:of|to|at|is)?\s*\d/.test(text) ||
    /\d[\d,]*(?:\.\d+)?\s*(?:aed\s*)?(?:monthly|per month|a month|annual(?:ly)?|yearly|per year)?\s*budget\b/.test(text);
  if (!looksLikeCommand) return null;

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
  { label: "Food Delivery", categoryName: "Food Delivery", example: "Ordered 50 from abad hind" },
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
