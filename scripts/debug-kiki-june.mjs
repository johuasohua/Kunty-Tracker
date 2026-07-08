import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debug() {
  const { data: people } = await supabase.from("people").select("id, name");
  const { data: categories } = await supabase.from("categories").select("id, name, treat_as");
  const { data: transactions } = await supabase.from("transactions").select("*");

  const kiki = people.find(p => p.name === "Kiki");
  const categoryMap = new Map(categories.map(c => [c.id, c]));

  const juneStart = new Date("2026-06-01");
  const juneEnd = new Date("2026-06-30");

  const kikiJuneCredit = transactions.filter(t => {
    const txDate = new Date(t.occurred_on);
    return (
      t.person_id === kiki.id &&
      t.type === "expense" &&
      t.payment_method === "credit" &&
      txDate >= juneStart &&
      txDate <= juneEnd
    );
  });

  console.log("=== KIKI JUNE CREDIT TRANSACTIONS ===\n");
  console.log(`Total transactions: ${kikiJuneCredit.length}\n`);
  
  let total = 0;
  kikiJuneCredit.forEach(t => {
    const cat = categoryMap.get(t.category_id);
    console.log(`${t.occurred_on} | ${cat?.name || "?"} (${cat?.treat_as || "?"}) | AED ${t.amount}`);
    total += t.amount;
  });
  
  console.log(`\nTotal CC spend: AED ${total.toFixed(2)}`);
}

debug();
