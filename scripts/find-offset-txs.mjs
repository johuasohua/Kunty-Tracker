import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function find() {
  const { data: categories } = await supabase.from("categories").select("id, name, treat_as");
  const offsetCats = categories.filter(c => c.treat_as === "offset");
  
  console.log("Offset categories:", offsetCats.map(c => c.name).join(", "));
  
  for (const cat of offsetCats) {
    const { data: txs } = await supabase
      .from("transactions")
      .select("id, category_id, occurred_on, amount, payment_method")
      .eq("category_id", cat.id)
      .order("occurred_on");
    
    console.log(`\n${cat.name} (${cat.id}): ${txs.length} transactions`);
    txs.slice(0, 5).forEach(t => {
      console.log(`  ${t.occurred_on} | ${t.payment_method} | AED ${t.amount}`);
    });
  }
}

find();
