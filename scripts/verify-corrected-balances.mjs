import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verify() {
  const { data: people } = await supabase.from("people").select("id, name");
  const { data: categories } = await supabase.from("categories").select("id, treat_as");
  const { data: transactions } = await supabase.from("transactions").select("*");
  const { data: ccPayments } = await supabase.from("cc_payments").select("*");

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

  function getPaymentForMonth(personId, month) {
    return ccPayments
      .filter(p => p.person_id === personId && p.month === `${month}-01`)
      .reduce((sum, p) => sum + p.amount_paid, 0);
  }

  console.log("=== CREDIT CARD BALANCES (Corrected) ===\n");

  // MAY
  const kikiMaySpend = getCcSpendExcludingOffset(kiki.id, "2026-05");
  const joshMaySpend = getCcSpendExcludingOffset(josh.id, "2026-05");
  const kikiMayPayment = getPaymentForMonth(kiki.id, "2026-05");
  const joshMayPayment = getPaymentForMonth(josh.id, "2026-05");

  console.log("MAY 2026:");
  console.log(`  Kiki: Spend AED ${kikiMaySpend.toFixed(2)} - Payment AED ${kikiMayPayment.toFixed(2)} = Closing AED ${(kikiMaySpend - kikiMayPayment).toFixed(2)}`);
  console.log(`  Josh: Spend AED ${joshMaySpend.toFixed(2)} - Payment AED ${joshMayPayment.toFixed(2)} = Closing AED ${(joshMaySpend - joshMayPayment).toFixed(2)}\n`);

  // JUNE
  const kikiJuneSpend = getCcSpendExcludingOffset(kiki.id, "2026-06");
  const joshJuneSpend = getCcSpendExcludingOffset(josh.id, "2026-06");
  const kikiJunePayment = getPaymentForMonth(kiki.id, "2026-06");
  const joshJunePayment = getPaymentForMonth(josh.id, "2026-06");

  const kikiJuneOpening = kikiMaySpend - kikiMayPayment; // May closing = June opening
  const joshJuneOpening = joshMaySpend - joshMayPayment;

  const kikiJuneClosing = kikiJuneOpening + kikiJuneSpend - kikiJunePayment;
  const joshJuneClosing = joshJuneOpening + joshJuneSpend - joshJunePayment;

  console.log("JUNE 2026:");
  console.log(`  Kiki: Opening AED ${kikiJuneOpening.toFixed(2)} + Spend AED ${kikiJuneSpend.toFixed(2)} - Payment AED ${kikiJunePayment.toFixed(2)} = Closing AED ${kikiJuneClosing.toFixed(2)}`);
  console.log(`  Josh: Opening AED ${joshJuneOpening.toFixed(2)} + Spend AED ${joshJuneSpend.toFixed(2)} - Payment AED ${joshJunePayment.toFixed(2)} = Closing AED ${joshJuneClosing.toFixed(2)}\n`);

  // JULY
  const kikiJulySpend = getCcSpendExcludingOffset(kiki.id, "2026-07");
  const joshJulySpend = getCcSpendExcludingOffset(josh.id, "2026-07");
  const kikiJulyPayment = getPaymentForMonth(kiki.id, "2026-07");
  const joshJulyPayment = getPaymentForMonth(josh.id, "2026-07");

  const kikiJulyClosing = kikiJuneClosing + kikiJulySpend - kikiJulyPayment;
  const joshJulyClosing = joshJuneClosing + joshJulySpend - joshJulyPayment;

  console.log("JULY 2026:");
  console.log(`  Kiki: Opening AED ${kikiJuneClosing.toFixed(2)} + Spend AED ${kikiJulySpend.toFixed(2)} - Payment AED ${kikiJulyPayment.toFixed(2)} = Closing AED ${kikiJulyClosing.toFixed(2)}`);
  console.log(`  Josh: Opening AED ${joshJuneClosing.toFixed(2)} + Spend AED ${joshJulySpend.toFixed(2)} - Payment AED ${joshJulyPayment.toFixed(2)} = Closing AED ${joshJulyClosing.toFixed(2)}\n`);

  console.log("=== SUMMARY TABLE ===\n");
  console.log("Month | Person | Opening      | Spend       | Payment | Closing");
  console.log("------|--------|--------------|-------------|---------|----------");
  console.log(`May   | Kiki   | AED ${"0.00".padEnd(8)} | AED ${kikiMaySpend.toFixed(2).padEnd(7)} | AED ${kikiMayPayment.toFixed(2).padEnd(5)} | AED ${(kikiMaySpend - kikiMayPayment).toFixed(2)}`);
  console.log(`May   | Josh   | AED ${"0.00".padEnd(8)} | AED ${joshMaySpend.toFixed(2).padEnd(7)} | AED ${joshMayPayment.toFixed(2).padEnd(5)} | AED ${(joshMaySpend - joshMayPayment).toFixed(2)}`);
  console.log(`June  | Kiki   | AED ${kikiJuneOpening.toFixed(2).padEnd(8)} | AED ${kikiJuneSpend.toFixed(2).padEnd(7)} | AED ${kikiJunePayment.toFixed(2).padEnd(5)} | AED ${kikiJuneClosing.toFixed(2)}`);
  console.log(`June  | Josh   | AED ${joshJuneOpening.toFixed(2).padEnd(8)} | AED ${joshJuneSpend.toFixed(2).padEnd(7)} | AED ${joshJunePayment.toFixed(2).padEnd(5)} | AED ${joshJuneClosing.toFixed(2)}`);
  console.log(`July  | Kiki   | AED ${kikiJuneClosing.toFixed(2).padEnd(8)} | AED ${kikiJulySpend.toFixed(2).padEnd(7)} | AED ${kikiJulyPayment.toFixed(2).padEnd(5)} | AED ${kikiJulyClosing.toFixed(2)}`);
  console.log(`July  | Josh   | AED ${joshJuneClosing.toFixed(2).padEnd(8)} | AED ${joshJulySpend.toFixed(2).padEnd(7)} | AED ${joshJulyPayment.toFixed(2).padEnd(5)} | AED ${joshJulyClosing.toFixed(2)}`);
}

verify();
