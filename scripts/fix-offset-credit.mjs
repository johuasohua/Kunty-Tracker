import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fix() {
  const offsetCatId = "7ccffd22-26bf-4ce9-88fd-b2ff69c4b595";
  
  // Get the three credit offset txs from June 1
  const { data: txs } = await supabase
    .from("transactions")
    .select("id, occurred_on, amount, payment_method")
    .eq("category_id", offsetCatId)
    .eq("payment_method", "credit")
    .eq("occurred_on", "2026-06-01");

  console.log(`Found ${txs.length} offset transactions to fix:\n`);
  txs.forEach(t => {
    console.log(`  ${t.occurred_on} | ${t.payment_method} | AED ${t.amount}`);
  });

  const total = txs.reduce((sum, t) => sum + t.amount, 0);
  console.log(`\nTotal to change from credit to debit: AED ${total}\n`);

  for (const tx of txs) {
    const { error } = await supabase
      .from("transactions")
      .update({ payment_method: "debit" })
      .eq("id", tx.id);
    
    if (error) {
      console.error(`❌ Error fixing ${tx.id}:`, error);
    } else {
      console.log(`✓ Fixed ${tx.id}: AED ${tx.amount}`);
    }
  }

  console.log("\n✅ Complete! Offset transfers now marked as debit payment method");
}

fix();
