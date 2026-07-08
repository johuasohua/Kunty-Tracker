import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: categories } = await supabase.from("categories").select("id, name, treat_as");
  
  console.log("All categories:");
  categories.forEach(c => {
    console.log(`  ${c.name}: treat_as=${c.treat_as}`);
  });
  
  const offsetCat = categories.find(c => c.treat_as === "offset");
  console.log(`\nOffset category: ${offsetCat?.name} (${offsetCat?.id})`);
  
  if (offsetCat) {
    const { data: offsetTxs } = await supabase
      .from("transactions")
      .select("id, occurred_on, amount, payment_method, category_id")
      .eq("category_id", offsetCat.id);
    
    console.log(`\nOffset transactions (${offsetTxs.length} total):`);
    offsetTxs.slice(0, 10).forEach(t => {
      console.log(`  ${t.occurred_on} | ${t.payment_method} | AED ${t.amount}`);
    });
  }
}

check();
