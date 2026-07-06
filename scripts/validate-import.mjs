// Cross-check imported DB rows against the workbook's pivot totals.
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

const { data: people } = await admin.from("people").select("*");
const { data: categories } = await admin.from("categories").select("*");
const personName = Object.fromEntries(people.map((p) => [p.id, p.name]));
const catName = Object.fromEntries(categories.map((c) => [c.id, c.name]));

const { data: tx, error } = await admin
  .from("transactions")
  .select("occurred_on, amount, category_id, person_id, payment_method, type")
  .limit(2000);
if (error) throw error;
console.log(`DB transactions: ${tx.length}`);

// Rebuild the same (category, person, method) sums from the DB and compare
// with the parsed sheet rows (which already matched the sheet's pivots).
const dbSums = new Map();
for (const t of tx) {
  const key = `${catName[t.category_id].toLowerCase()}|${personName[t.person_id]}|${t.payment_method}`;
  dbSums.set(key, (dbSums.get(key) ?? 0) + Number(t.amount));
}
const sheetSums = new Map();
for (const t of data.transactions) {
  const key = `${t.category.toLowerCase()}|${t.person}|${t.payment_method}`;
  sheetSums.set(key, (sheetSums.get(key) ?? 0) + t.amount);
}
let bad = 0;
for (const [key, expected] of sheetSums) {
  const actual = dbSums.get(key) ?? 0;
  if (Math.abs(actual - expected) > 0.011) {
    console.log(`MISMATCH ${key}: sheet=${expected.toFixed(2)} db=${actual.toFixed(2)}`);
    bad++;
  }
}
for (const key of dbSums.keys()) {
  if (!sheetSums.has(key)) { console.log(`UNEXPECTED in db: ${key}`); bad++; }
}
console.log(bad === 0 ? "All category x person x account totals match the sheet." : `${bad} mismatches`);

// Monthly income/expense totals as the app will compute them (offset category reduces expense)
const catTreat = Object.fromEntries(categories.map((c) => [c.id, c.treat_as]));
const monthly = new Map();
for (const t of tx) {
  const m = t.occurred_on.slice(0, 7);
  const e = monthly.get(m) ?? { income: 0, expense: 0 };
  if (t.type === "income") e.income += Number(t.amount);
  else if (catTreat[t.category_id] === "offset") e.expense -= Number(t.amount);
  else e.expense += Number(t.amount);
  monthly.set(m, e);
}
console.log("\nMonthly totals as the app will show them:");
for (const [m, e] of [...monthly].sort()) {
  console.log(`  ${m}: income=${e.income.toFixed(2)} expense=${e.expense.toFixed(2)}`);
}
console.log("\nSheet Overview reference: Apr income=65013 expense=13583.85 | May income=65000 expense=47193.15 | Jun income=65565 expense=75669.59");

// Mortgage: last closing principal + totals
const { data: mp } = await admin.from("mortgage_payments").select("*").order("period_no");
const last = mp[mp.length - 1];
console.log(`\nMortgage: ${mp.length} periods, last=${last.payment_date}, closing=${last.closing_principal} (sheet: 1915657.08)`);
const interestSaved = mp.reduce((s, r) => s + Number(r.interest_saved ?? 0), 0);
console.log(`Cumulative interest saved: ${interestSaved.toFixed(2)}`);
