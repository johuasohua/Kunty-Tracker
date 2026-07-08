import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fix() {
  const { data: categories } = await supabase.from("categories").select("id, treat_as");
  const offsetCatId = categories.find(c => c.treat_as === "offset").id;

  // Get all offset transactions with payment_method="credit"
  const { data: offsetTxs } = await supabase
    .from("transactions")
    .select("id, occurred_on, amount, payment_method")
    .eq("category_id", offsetCatId)
    .eq("payment_method", "credit");

  console.log(`Found ${offsetTxs.length} offset transactions with payment_method="credit"`);
  
  if (offsetTxs.length === 0) {
    console.log("Nothing to fix!");
    return;
  }

  console.log("\nTransactions to fix:");
  offsetTxs.forEach(t => {
    console.log(`  ${t.occurred_on} | AED ${t.amount}`);
  });

  // Update them to debit
  for (const tx of offsetTxs) {
    const { error } = await supabase
      .from("transactions")
      .update({ payment_method: "debit" })
      .eq("id", tx.id);
    
    if (error) {
      console.error(`Error updating ${tx.id}:`, error);
    } else {
      console.log(`✓ Fixed ${tx.id}`);
    }
  }

  console.log("\n✅ All offset transactions updated to payment_method=debit");
}

fix();
