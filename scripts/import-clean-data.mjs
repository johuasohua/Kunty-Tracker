import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

function parseCSV(csvContent) {
  const lines = csvContent.trim().split("\n");
  const headers = lines[0].split(",");
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    const record = {};
    headers.forEach((header, index) => {
      record[header.trim()] = values[index] ? values[index].trim() : "";
    });
    records.push(record);
  }

  return records;
}

async function deleteExistingTransactions() {
  console.log("🗑️  Deleting existing transactions...");

  const { data: allTransactions, error: fetchError } = await supabase
    .from("transactions")
    .select("id");

  if (fetchError) {
    console.error("Error fetching transactions:", fetchError);
    throw fetchError;
  }

  if (allTransactions && allTransactions.length > 0) {
    const ids = allTransactions.map((t) => t.id);

    // Delete in batches
    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100);
      const { error } = await supabase
        .from("transactions")
        .delete()
        .in("id", batch);

      if (error) {
        console.error("Error deleting batch:", error);
        throw error;
      }
    }
  }

  console.log("✓ All existing transactions deleted");
}

async function importTransactions(csvPath, monthName) {
  console.log(`\n📥 Importing ${monthName} transactions...`);

  // Fetch categories and people
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("id, name");

  if (catError) {
    console.error("Error fetching categories:", catError);
    throw catError;
  }

  const { data: people, error: peopleError } = await supabase
    .from("people")
    .select("id, name");

  if (peopleError) {
    console.error("Error fetching people:", peopleError);
    throw peopleError;
  }

  // Create lookup maps
  const categoryMap = new Map(categories.map((c) => [c.name, c.id]));
  const personMap = new Map(people.map((p) => [p.name, p.id]));

  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const records = parseCSV(csvContent);

  console.log(`  Found ${records.length} records to import`);

  // Map CSV columns to DB columns, skip header
  const transactions = records
    .filter((row) => row.date && row.date !== "date")
    .map((row) => {
      const categoryId = categoryMap.get(row.category);
      const personId = personMap.get(row.person);

      if (!categoryId) {
        console.warn(`  ⚠️  Unknown category: ${row.category}`);
        return null;
      }
      if (!personId) {
        console.warn(`  ⚠️  Unknown person: ${row.person}`);
        return null;
      }

      return {
        occurred_on: row.date,
        person_id: personId,
        category_id: categoryId,
        amount: parseFloat(row.amount),
        payment_method: row.payment_method.toLowerCase(),
        type: row.type.toLowerCase(),
        note: row.note || null,
        source: "import",
        raw_capture_text: null,
        created_by_person_id: null,
      };
    })
    .filter((t) => t !== null);

  console.log(`  Mapped ${transactions.length} valid transactions`);

  // Insert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);
    const { error } = await supabase.from("transactions").insert(batch);

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
      throw error;
    }
    console.log(
      `  ✓ Inserted ${Math.min(batchSize, transactions.length - i)} records`
    );
  }

  console.log(`✓ ${monthName} import complete`);
}

async function main() {
  try {
    // Delete existing
    await deleteExistingTransactions();

    // Import June
    await importTransactions(
      "/tmp/claude-0/-home-user-Kunty-Tracker/792b08b1-5cb5-56ca-be8f-9505f448ef0f/scratchpad/june_transactions_cleaned.csv",
      "JUNE"
    );

    // Import July
    await importTransactions(
      "/tmp/claude-0/-home-user-Kunty-Tracker/792b08b1-5cb5-56ca-be8f-9505f448ef0f/scratchpad/july_transactions_cleaned.csv",
      "JULY"
    );

    // Verify import
    console.log("\n✅ Verifying import...");
    const { data, error } = await supabase
      .from("transactions")
      .select("count", { count: "exact" });

    if (error) {
      console.error("Error verifying:", error);
      throw error;
    }

    console.log(
      `\n✅ Import successful! Total transactions in database: ${data?.[0]?.count || 0}`
    );
  } catch (err) {
    console.error("\n❌ Import failed:", err);
    process.exit(1);
  }
}

main();
