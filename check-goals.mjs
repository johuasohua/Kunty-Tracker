import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

const { data: goals, error } = await supabase
  .from("goals")
  .select("*")
  .eq("is_active", true);

if (error) {
  console.error("Error querying goals:", error);
} else {
  console.log(`Found ${goals.length} active goals`);
  goals.forEach(g => {
    console.log(`  - ${g.name}: ${g.target_amount} (priority ${g.priority_order})`);
  });
}
