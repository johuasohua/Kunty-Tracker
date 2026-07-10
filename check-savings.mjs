import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

const { data: savings, error } = await supabase
  .from("savings_periods")
  .select("period_month, closing_balance")
  .order("period_month", { ascending: false })
  .limit(5);

if (error) {
  console.error("Error:", error);
} else {
  console.log("Latest 5 savings months:");
  savings.forEach(s => {
    console.log(`  ${s.period_month}: ${s.closing_balance}`);
  });
  if (savings.length > 0) {
    console.log(`\nLatest balance: ${savings[0].closing_balance}`);
    console.log(`Goals threshold: 200000`);
    console.log(`Available for goals: ${Math.max(0, savings[0].closing_balance - 200000)}`);
  }
}
