import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function importMayPayments() {
  try {
    console.log("📥 Importing May CC payments...\n");

    // Fetch people
    const { data: people, error: peopleError } = await supabase
      .from("people")
      .select("id, name");

    if (peopleError) throw peopleError;

    const kikiId = people.find(p => p.name === "Kiki").id;
    const joshId = people.find(p => p.name === "Josh").id;

    console.log(`Found: Kiki (${kikiId.slice(0, 8)}...), Josh (${joshId.slice(0, 8)}...)\n`);

    // Get opening balances to confirm amounts
    const { data: openingBalances } = await supabase
      .from("opening_cc_balances")
      .select("*");

    const kikiOpening = openingBalances.find(b => b.person_id === kikiId);
    const joshOpening = openingBalances.find(b => b.person_id === joshId);

    console.log("Opening balances (May charges paid in June):");
    console.log(`  Kiki: AED ${kikiOpening.balance}`);
    console.log(`  Josh: AED ${joshOpening.balance}\n`);

    // Record May payments (paid in June)
    const mayPayments = [
      {
        person_id: kikiId,
        month: "2026-05-01",
        amount_paid: kikiOpening.balance,
        payment_date: "2026-06-01", // Paid early June for May charges
        note: "May charges payment",
      },
      {
        person_id: joshId,
        month: "2026-05-01",
        amount_paid: joshOpening.balance,
        payment_date: "2026-06-01", // Paid early June for May charges
        note: "May charges payment",
      },
    ];

    console.log("💾 Recording May CC payments...");
    for (const payment of mayPayments) {
      const { error } = await supabase
        .from("cc_payments")
        .upsert(payment, { onConflict: "person_id,month" });

      if (error) {
        console.error("Error:", error);
        throw error;
      }

      const person = payment.person_id === kikiId ? "Kiki" : "Josh";
      console.log(`  ✓ ${person}: AED ${payment.amount_paid} (${payment.payment_date})`);
    }

    console.log("\n✅ May CC payments recorded!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

importMayPayments();
