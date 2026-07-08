import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: people } = await supabase.from("people").select("id, name");
  const kiki = people.find(p => p.name === "Kiki");
  const josh = people.find(p => p.name === "Josh");

  console.log("Setting June opening CC balances to 0 (May was paid off in June)...\n");

  for (const person of [kiki, josh]) {
    const { error } = await supabase
      .from("opening_cc_balances")
      .upsert({ person_id: person.id, as_of_month: "2026-06-01", balance: 0 }, { onConflict: "person_id" });
    if (error) { console.error(error); throw error; }
    console.log(`  ✓ ${person.name}: June opening set to AED 0.00`);
  }
  console.log("\n✅ Done. May's charges are captured by the May payment records; June now starts clean.");
}
run();
