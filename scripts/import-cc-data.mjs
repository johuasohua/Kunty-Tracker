import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function importCcData() {
  try {
    console.log("📥 Importing CC data...");

    // Fetch people
    const { data: people, error: peopleError } = await supabase
      .from("people")
      .select("id, name");

    if (peopleError) {
      console.error("Error fetching people:", peopleError);
      throw peopleError;
    }

    const personMap = new Map(people.map((p) => [p.name, p.id]));
    const kikiId = personMap.get("Kiki");
    const joshId = personMap.get("Josh");

    if (!kikiId || !joshId) {
      throw new Error("Could not find Kiki or Josh in people table");
    }

    console.log(`Found: Kiki (${kikiId}), Josh (${joshId})`);

    // Insert opening balances (June 1, 2026)
    console.log("\n💾 Inserting opening CC balances...");
    const openingBalances = [
      {
        person_id: kikiId,
        as_of_month: "2026-06-01",
        balance: 5296.62,
      },
      {
        person_id: joshId,
        as_of_month: "2026-06-01",
        balance: 10091,
      },
    ];

    for (const balance of openingBalances) {
      const { error } = await supabase
        .from("opening_cc_balances")
        .upsert(balance, { onConflict: "person_id" });

      if (error) {
        console.error("Error inserting opening balance:", error);
        throw error;
      }
      console.log(
        `  ✓ Inserted opening balance for ${balance.person_id === kikiId ? "Kiki" : "Josh"}: AED ${balance.balance}`
      );
    }

    // Insert CC payments (for June charges, paid in July)
    console.log("\n💾 Inserting CC payments...");
    const ccPayments = [
      {
        person_id: kikiId,
        month: "2026-06-01", // This is for June charges
        amount_paid: 9411,
        payment_date: "2026-07-06", // Actual payment date
        note: "June charges",
      },
      {
        person_id: joshId,
        month: "2026-06-01", // This is for June charges
        amount_paid: 14916,
        payment_date: "2026-07-03", // Actual payment date
        note: "June charges",
      },
    ];

    for (const payment of ccPayments) {
      const { error } = await supabase
        .from("cc_payments")
        .upsert(payment, { onConflict: "person_id,month" });

      if (error) {
        console.error("Error inserting CC payment:", error);
        throw error;
      }
      console.log(
        `  ✓ Inserted CC payment for ${payment.person_id === kikiId ? "Kiki" : "Josh"}: AED ${payment.amount_paid} (paid ${payment.payment_date})`
      );
    }

    console.log("\n✅ CC data import complete!");
  } catch (error) {
    console.error("❌ Import failed:", error);
    process.exit(1);
  }
}

importCcData();
