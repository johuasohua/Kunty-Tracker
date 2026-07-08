import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: people } = await supabase.from("people").select("id, name");
const { data: categories } = await supabase.from("categories").select("id, treat_as");
const { data: transactions } = await supabase.from("transactions").select("*");
const { data: ccPayments } = await supabase.from("cc_payments").select("*");
const { data: openingBalances } = await supabase.from("opening_cc_balances").select("*");

const treatAs = new Map(categories.map(c => [c.id, c.treat_as]));

function spend(pid, m) {
  const s = new Date(`${m}-01`), e = new Date(s.getFullYear(), s.getMonth()+1, 0);
  return transactions.filter(t => t.person_id===pid && t.type==="expense" && t.payment_method==="credit"
    && treatAs.get(t.category_id)!=="offset" && new Date(t.occurred_on)>=s && new Date(t.occurred_on)<=e)
    .reduce((a,t)=>a+t.amount,0);
}
function paid(pid, m) {
  return ccPayments.filter(p => p.person_id===pid && p.month===`${m}-01`).reduce((a,p)=>a+p.amount_paid,0);
}

for (const person of people) {
  const open = openingBalances.find(b=>b.person_id===person.id)?.balance ?? 0;
  console.log(`\n=== ${person.name} (June opening: AED ${open}) ===`);
  let running = open;
  for (const m of ["2026-06","2026-07"]) {
    const sp = spend(person.id, m), pd = paid(person.id, m);
    const carry = running, closing = carry + sp - pd;
    console.log(`  ${m}: Carry ${carry.toFixed(2)} + Spend ${sp.toFixed(2)} - Paid ${pd.toFixed(2)} = Closing ${closing.toFixed(2)}`);
    running = closing;
  }
}
