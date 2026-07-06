// One-shot import of Apr-Jun 2026 transactions + full LIV mortgage history.
// Wipes existing rows (placeholder data) from the affected tables first.
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const data = JSON.parse(
  fs.readFileSync(
    "/tmp/claude-0/-home-user-Kunty-Tracker/792b08b1-5cb5-56ca-be8f-9505f448ef0f/scratchpad/import.json",
    "utf8"
  )
);

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

function fail(step, error) {
  console.error(`FAILED at ${step}:`, error.message ?? error);
  process.exit(1);
}

// --- lookups -----------------------------------------------------------
const { data: people, error: pErr } = await admin.from("people").select("*");
if (pErr) fail("people", pErr);
const personByName = Object.fromEntries(people.map((p) => [p.name, p.id]));

const { data: categories, error: cErr } = await admin.from("categories").select("*");
if (cErr) fail("categories", cErr);
const categoryByLower = Object.fromEntries(
  categories.map((c) => [c.name.toLowerCase(), c.id])
);

const unknownCats = new Set(
  data.transactions
    .map((t) => t.category)
    .filter((c) => !categoryByLower[c.toLowerCase()])
);
if (unknownCats.size) fail("category mapping", new Error([...unknownCats].join(", ")));

// --- wipe placeholder data ---------------------------------------------
console.log("Current row counts before wipe:");
for (const table of ["transactions", "mortgage_payments", "cc_payments", "opening_cc_balances", "opening_balance_seed"]) {
  const { count } = await admin.from(table).select("*", { count: "exact", head: true });
  console.log(`  ${table}: ${count}`);
  const { error } = await admin.from(table).delete().gte("created_at", "1900-01-01");
  if (error && !error.message.includes("created_at")) fail(`wipe ${table}`, error);
}
// opening_cc_balances / opening_balance_seed have no created_at — delete by always-true keys
await admin.from("opening_cc_balances").delete().in("person_id", Object.values(personByName));
await admin.from("opening_balance_seed").delete().eq("id", true);

// --- insert transactions (batched) --------------------------------------
const txRows = data.transactions.map((t) => ({
  occurred_on: t.occurred_on,
  amount: t.amount,
  category_id: categoryByLower[t.category.toLowerCase()],
  person_id: personByName[t.person],
  payment_method: t.payment_method,
  type: t.type,
  note: t.note,
  source: "import",
}));
for (let i = 0; i < txRows.length; i += 100) {
  const { error } = await admin.from("transactions").insert(txRows.slice(i, i + 100));
  if (error) fail(`transactions batch ${i}`, error);
}
console.log(`Inserted ${txRows.length} transactions`);

// --- insert mortgage payments -------------------------------------------
const { error: mErr } = await admin.from("mortgage_payments").insert(
  data.mortgage.map((m) => ({
    period_no: m.period_no,
    payment_date: m.payment_date,
    opening_principal: m.opening_principal,
    principal_amount: m.principal_amount,
    interest_amount: m.interest_amount,
    insurance_amount: m.insurance_amount,
    hoi_charge: m.hoi_charge,
    closing_principal: m.closing_principal,
    offset_opening_balance: m.offset_opening_balance,
    offset_closing_balance: m.offset_closing_balance,
    interest_saved: m.interest_saved,
    offset_transaction_amount: m.offset_transaction_amount,
    offset_note: m.offset_note,
  }))
);
if (mErr) fail("mortgage_payments", mErr);
console.log(`Inserted ${data.mortgage.length} mortgage payments`);

// --- seeds ----------------------------------------------------------------
const { error: sErr } = await admin.from("opening_balance_seed").insert({
  id: true,
  as_of_month: data.opening_seed.as_of_month,
  balance: data.opening_seed.balance,
});
if (sErr) fail("opening_balance_seed", sErr);

for (const [person, seed] of Object.entries(data.opening_cc)) {
  const { error } = await admin.from("opening_cc_balances").insert({
    person_id: personByName[person],
    as_of_month: seed.as_of_month,
    balance: seed.balance,
  });
  if (error) fail(`opening_cc_balances ${person}`, error);
}

const { error: ccErr } = await admin.from("cc_payments").insert(
  data.cc_payments.map((c) => ({
    person_id: personByName[c.person],
    month: c.month,
    amount_paid: c.amount_paid,
    note: "imported from tracker",
  }))
);
if (ccErr) fail("cc_payments", ccErr);
console.log("Seeds + CC payments inserted");

// --- post-import verification ---------------------------------------------
const { count: txCount } = await admin.from("transactions").select("*", { count: "exact", head: true });
const { count: mpCount } = await admin.from("mortgage_payments").select("*", { count: "exact", head: true });
console.log(`\nFinal DB counts: transactions=${txCount}, mortgage_payments=${mpCount}`);
console.log(txCount === txRows.length && mpCount === data.mortgage.length ? "COUNTS OK" : "COUNT MISMATCH!");
