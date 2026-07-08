import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verify() {
  const { data: people } = await supabase.from("people").select("id, name");
  const { data: categories } = await supabase.from("categories").select("id, treat_as");
  const { data: transactions } = await supabase.from("transactions").select("*");
  const { data: ccPayments } = await supabase.from("cc_payments").select("*").eq("month", "2026-06-01");
  const { data: openingBalances } = await supabase.from("opening_cc_balances").select("*");

  const kiki = people.find(p => p.name === "Kiki");
  const josh = people.find(p => p.name === "Josh");
  
  const treatAsMap = new Map(categories.map(c => [c.id, c.treat_as]));

  function getCcSpendExcludingOffset(personId, month) {
    const monthStart = new Date(`${month}-01`);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

    return transactions
      .filter(t => {
        const txDate = new Date(t.occurred_on);
        return (
          t.person_id === personId &&
          t.type === "expense" &&
          t.payment_method === "credit" &&
          treatAsMap.get(t.category_id) !== "offset" &&
          txDate >= monthStart &&
          txDate <= monthEnd
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }

  const kikiJuneSpend = getCcSpendExcludingOffset(kiki.id, "2026-06");
  const joshJuneSpend = getCcSpendExcludingOffset(josh.id, "2026-06");
  const kikiJulySpend = getCcSpendExcludingOffset(kiki.id, "2026-07");
  const joshJulySpend = getCcSpendExcludingOffset(josh.id, "2026-07");

  const kikiPayment = ccPayments.find(p => p.person_id === kiki.id);
  const joshPayment = ccPayments.find(p => p.person_id === josh.id);

  const kikiOpening = openingBalances.find(b => b.person_id === kiki.id);
  const joshOpening = openingBalances.find(b => b.person_id === josh.id);

  console.log("=== CORRECT CC BALANCES (excluding offset) ===\n");
  
  const kikiJuneClosing = (kikiOpening?.balance ?? 0) + kikiJuneSpend - (kikiPayment?.amount_paid ?? 0);
  const joshJuneClosing = (joshOpening?.balance ?? 0) + joshJuneSpend - (joshPayment?.amount_paid ?? 0);

  console.log("JUNE:");
  console.log(`  Kiki: Opening AED ${(kikiOpening?.balance ?? 0).toFixed(2)} → Closing AED ${kikiJuneClosing.toFixed(2)}`);
  console.log(`        (Spend: AED ${kikiJuneSpend.toFixed(2)}, Payment: AED ${kikiPayment?.amount_paid ?? 0})`);
  console.log(`  Josh: Opening AED ${(joshOpening?.balance ?? 0).toFixed(2)} → Closing AED ${joshJuneClosing.toFixed(2)}`);
  console.log(`        (Spend: AED ${joshJuneSpend.toFixed(2)}, Payment: AED ${joshPayment?.amount_paid ?? 0})\n`);

  console.log("JULY:");
  const kikiJulyClosing = kikiJuneClosing + kikiJulySpend;
  const joshJulyClosing = joshJuneClosing + joshJulySpend;
  console.log(`  Kiki: Opening AED ${kikiJuneClosing.toFixed(2)} → Closing AED ${kikiJulyClosing.toFixed(2)}`);
  console.log(`        (Spend: AED ${kikiJulySpend.toFixed(2)})`);
  console.log(`  Josh: Opening AED ${joshJuneClosing.toFixed(2)} → Closing AED ${joshJulyClosing.toFixed(2)}`);
  console.log(`        (Spend: AED ${joshJulySpend.toFixed(2)})\n`);

  console.log("=== SUMMARY TABLE ===\n");
  console.log("Month | Person | Opening      | CC Spend    | Payment | Closing");
  console.log("------|--------|--------------|-------------|---------|----------");
  console.log(`June  | Kiki   | AED ${(kikiOpening?.balance ?? 0).toFixed(2).padEnd(8)} | AED ${kikiJuneSpend.toFixed(2).padEnd(7)} | AED ${(kikiPayment?.amount_paid ?? 0).toFixed(2).padEnd(5)} | AED ${kikiJuneClosing.toFixed(2)}`);
  console.log(`June  | Josh   | AED ${(joshOpening?.balance ?? 0).toFixed(2).padEnd(8)} | AED ${joshJuneSpend.toFixed(2).padEnd(7)} | AED ${(joshPayment?.amount_paid ?? 0).toFixed(2).padEnd(5)} | AED ${joshJuneClosing.toFixed(2)}`);
  console.log(`July  | Kiki   | AED ${kikiJuneClosing.toFixed(2).padEnd(8)} | AED ${kikiJulySpend.toFixed(2).padEnd(7)} | AED ${"0.00".padEnd(5)} | AED ${kikiJulyClosing.toFixed(2)}`);
  console.log(`July  | Josh   | AED ${joshJuneClosing.toFixed(2).padEnd(8)} | AED ${joshJulySpend.toFixed(2).padEnd(7)} | AED ${"0.00".padEnd(5)} | AED ${joshJulyClosing.toFixed(2)}`);
}

verify();
