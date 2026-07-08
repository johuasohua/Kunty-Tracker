import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function find() {
  const { data: people } = await supabase.from("people").select("id, name");
  const { data: categories } = await supabase.from("categories").select("id, name, treat_as");
  const { data: transactions } = await supabase.from("transactions").select("*");

  const kiki = people.find(p => p.name === "Kiki");
  const categoryMap = new Map(categories.map(c => [c.id, c]));
  const treatAsMap = new Map(categories.map(c => [c.id, c.treat_as]));

  const juneStart = new Date("2026-06-01");
  const juneEnd = new Date("2026-06-30");

  const kikiJuneCredit = transactions.filter(t => {
    const txDate = new Date(t.occurred_on);
    return (
      t.person_id === kiki.id &&
      t.type === "expense" &&
      t.payment_method === "credit" &&
      treatAsMap.get(t.category_id) !== "offset" &&
      txDate >= juneStart &&
      txDate <= juneEnd
    );
  });

  console.log(`KIKI JUNE CREDIT (non-offset): ${kikiJuneCredit.length} transactions\n`);
  console.log("Category breakdown:");
  
  const byCategory = {};
  kikiJuneCredit.forEach(t => {
    const cat = categoryMap.get(t.category_id)?.name || "?";
    byCategory[cat] = (byCategory[cat] || 0) + t.amount;
  });
  
  Object.entries(byCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, amount]) => {
    console.log(`  ${cat}: AED ${amount.toFixed(2)}`);
  });
  
  const total = kikiJuneCredit.reduce((sum, t) => sum + t.amount, 0);
  console.log(`\nTotal: AED ${total.toFixed(2)}`);
  console.log(`Expected: AED 9411.00`);
  console.log(`Difference: AED ${(total - 9411).toFixed(2)}`);
}

find();
