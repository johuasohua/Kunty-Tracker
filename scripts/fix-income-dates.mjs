// Re-date salary/income rows to the month of the tab they were logged under.
// The sheet dates each month's salary in the *previous* calendar month; the
// app groups by real date, so without this, income lands in the wrong month.
import { createClient } from "@supabase/supabase-js";
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: people } = await admin.from("people").select("*");
const byName = Object.fromEntries(people.map(p => [p.name, p.id]));

const fixes = [
  { person: "Kiki", amount: 45000, from: "2026-03-26", to: "2026-04-01" }, // APR tab salary
  { person: "Kiki", amount: 45000, from: "2026-04-24", to: "2026-05-01" }, // MAY tab salary
  { person: "Kiki", amount: 45555, from: "2026-05-25", to: "2026-06-01" }, // JUN tab salary
  { person: "Josh", amount: 20000, from: "2026-05-30", to: "2026-06-01" }, // JUN tab salary (was blank)
  { person: "Kiki", amount: 10,    from: "2026-07-24", to: "2026-06-01" }, // JUN tab "j transfer test"
];
for (const f of fixes) {
  const { data, error } = await admin.from("transactions")
    .update({ occurred_on: f.to })
    .eq("person_id", byName[f.person]).eq("type","income").eq("amount", f.amount).eq("occurred_on", f.from)
    .select("id");
  if (error) { console.error("FAILED", f, error.message); process.exit(1); }
  if (data.length !== 1) { console.error(`expected 1 row, got ${data.length} for`, f); process.exit(1); }
  console.log(`  ${f.person} ${f.amount}: ${f.from} -> ${f.to} (ok)`);
}
const { data: tx } = await admin.from("transactions").select("occurred_on, amount, type").limit(2000);
const inc = {};
for (const t of tx) { const m = t.occurred_on.slice(0,7); if (t.type==="income") inc[m]=(inc[m]??0)+Number(t.amount); }
console.log("\nMonthly income now:");
for (const m of Object.keys(inc).sort()) console.log(`  ${m}: ${inc[m].toFixed(2)}`);
console.log("Sheet Overview: Apr 65013 / May 65000 / Jun 65565");
