import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data } = await supabase.from("cc_payments").select("*");
console.log("CC Payments in DB:");
data.forEach(p => {
  console.log(`  Person: ${p.person_id.slice(0, 8)}... | Month: ${p.month} | Amount: ${p.amount_paid} | Date: ${p.payment_date}`);
});
