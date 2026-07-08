import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function verifyCcBalances() {
  try {
    // Get people
    const { data: people } = await supabase.from("people").select("id, name");
    const kiki = people.find((p) => p.name === "Kiki");
    const josh = people.find((p) => p.name === "Josh");

    console.log("=== CC BALANCE VERIFICATION ===\n");

    // Get opening balances
    const { data: openingBalances } = await supabase
      .from("opening_cc_balances")
      .select("*");

    const kikiOpening = openingBalances.find((b) => b.person_id === kiki.id);
    const joshOpening = openingBalances.find((b) => b.person_id === josh.id);

    console.log("OPENING BALANCES (June 1, 2026):");
    console.log(`  Kiki: AED ${kikiOpening?.balance ?? 0}`);
    console.log(`  Josh: AED ${joshOpening?.balance ?? 0}\n`);

    // Get CC payments for June (month = 2026-06-01)
    const { data: ccPayments } = await supabase
      .from("cc_payments")
      .select("*")
      .eq("month", "2026-06-01");
    const kikiPayment = ccPayments.find((p) => p.person_id === kiki.id);
    const joshPayment = ccPayments.find((p) => p.person_id === josh.id);

    console.log("CC PAYMENTS (for June, paid in July):");
    console.log(`  Kiki: AED ${kikiPayment?.amount_paid ?? 0} (${kikiPayment?.payment_date})`);
    console.log(`  Josh: AED ${joshPayment?.amount_paid ?? 0} (${joshPayment?.payment_date})\n`);

    // Get transactions for June and July
    const { data: transactions } = await supabase.from("transactions").select("*");

    function getCcSpendForMonth(personId, month) {
      const monthStart = new Date(`${month}-01`);
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

      return transactions
        .filter((t) => {
          const txDate = new Date(t.occurred_on);
          return (
            t.person_id === personId &&
            t.type === "expense" &&
            t.payment_method === "credit" &&
            txDate >= monthStart &&
            txDate <= monthEnd
          );
        })
        .reduce((sum, t) => sum + t.amount, 0);
    }

    const juneKikiSpend = getCcSpendForMonth(kiki.id, "2026-06");
    const juneJoshSpend = getCcSpendForMonth(josh.id, "2026-06");
    const julyKikiSpend = getCcSpendForMonth(kiki.id, "2026-07");
    const julyJoshSpend = getCcSpendForMonth(josh.id, "2026-07");

    console.log("CC SPEND FROM TRANSACTIONS:");
    console.log(`  Kiki June: AED ${juneKikiSpend.toFixed(2)}`);
    console.log(`  Josh June: AED ${juneJoshSpend.toFixed(2)}`);
    console.log(`  Kiki July: AED ${julyKikiSpend.toFixed(2)}`);
    console.log(`  Josh July: AED ${julyJoshSpend.toFixed(2)}\n`);

    // Calculate balances
    console.log("=== CALCULATED BALANCES ===\n");

    const kikiJuneOpening = kikiOpening?.balance ?? 0;
    const kikiJuneClosing =
      kikiJuneOpening + juneKikiSpend - (kikiPayment?.amount_paid ?? 0);
    const kikiJulyOpening = kikiJuneClosing;
    const kikiJulyClosing = kikiJulyOpening + julyKikiSpend;

    const joshJuneOpening = joshOpening?.balance ?? 0;
    const joshJuneClosing =
      joshJuneOpening + juneJoshSpend - (joshPayment?.amount_paid ?? 0);
    const joshJulyOpening = joshJuneClosing;
    const joshJulyClosing = joshJulyOpening + julyJoshSpend;

    console.log("KIKI:");
    console.log(`  June: Opening AED ${kikiJuneOpening.toFixed(2)} → Closing AED ${kikiJuneClosing.toFixed(2)}`);
    console.log(`        (Opening + Spend AED ${juneKikiSpend.toFixed(2)} - Payment AED ${kikiPayment?.amount_paid ?? 0})`);
    console.log(`  July: Opening AED ${kikiJulyOpening.toFixed(2)} → Closing AED ${kikiJulyClosing.toFixed(2)}`);
    console.log(`        (Opening + Spend AED ${julyKikiSpend.toFixed(2)})\n`);

    console.log("JOSH:");
    console.log(`  June: Opening AED ${joshJuneOpening.toFixed(2)} → Closing AED ${joshJuneClosing.toFixed(2)}`);
    console.log(`        (Opening + Spend AED ${juneJoshSpend.toFixed(2)} - Payment AED ${joshPayment?.amount_paid ?? 0})`);
    console.log(`  July: Opening AED ${joshJulyOpening.toFixed(2)} → Closing AED ${joshJulyClosing.toFixed(2)}`);
    console.log(`        (Opening + Spend AED ${julyJoshSpend.toFixed(2)})\n`);

    console.log("=== SUMMARY TABLE ===\n");
    console.log("Month | Person | Opening      | CC Spend    | Payment | Closing");
    console.log("------|--------|--------------|-------------|---------|----------");
    console.log(
      `June  | Kiki   | AED ${kikiJuneOpening.toFixed(2).padEnd(8)} | AED ${juneKikiSpend.toFixed(2).padEnd(7)} | AED ${(kikiPayment?.amount_paid ?? 0).toFixed(2).padEnd(5)} | AED ${kikiJuneClosing.toFixed(2)}`
    );
    console.log(
      `June  | Josh   | AED ${joshJuneOpening.toFixed(2).padEnd(8)} | AED ${juneJoshSpend.toFixed(2).padEnd(7)} | AED ${(joshPayment?.amount_paid ?? 0).toFixed(2).padEnd(5)} | AED ${joshJuneClosing.toFixed(2)}`
    );
    console.log(
      `July  | Kiki   | AED ${kikiJulyOpening.toFixed(2).padEnd(8)} | AED ${julyKikiSpend.toFixed(2).padEnd(7)} | AED ${"0.00".padEnd(5)} | AED ${kikiJulyClosing.toFixed(2)}`
    );
    console.log(
      `July  | Josh   | AED ${joshJulyOpening.toFixed(2).padEnd(8)} | AED ${julyJoshSpend.toFixed(2).padEnd(7)} | AED ${"0.00".padEnd(5)} | AED ${joshJulyClosing.toFixed(2)}`
    );
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

verifyCcBalances();
