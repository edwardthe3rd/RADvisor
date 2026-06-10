/**
 * Idempotent Supabase seed importer (instructions/02_database_seeding.md §2).
 *
 * Reads operators.json (and equipment.json when present) from this directory
 * and upserts via the service-role client. Upsert keys: operators on `slug`,
 * equipment on the composite natural key `operator_id + name + size`.
 *
 * Run from web/ (it has the dependencies):
 *   cd web && SUPABASE_SERVICE_ROLE_KEY=... npx tsx ../supabase/seed/import.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://wzngubwctlorewegtbgo.supabase.co";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is required (Supabase dashboard → Settings → API).");
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });
const here = new URL(".", import.meta.url).pathname;

async function importOperators(): Promise<Map<string, string>> {
  const path = join(here, "operators.json");
  const rows = JSON.parse(readFileSync(path, "utf8"));
  let upserted = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const { error } = await db
      .from("operators")
      .upsert(batch, { onConflict: "slug" });
    if (error) throw new Error(`operators batch ${i}: ${error.message}`);
    upserted += batch.length;
  }
  console.log(`operators: ${upserted} upserted`);

  const { data, error } = await db.from("operators").select("id, slug");
  if (error) throw error;
  return new Map(data.map((o) => [o.slug, o.id]));
}

async function importEquipment(operatorIds: Map<string, string>) {
  const path = join(here, "equipment.json");
  if (!existsSync(path)) {
    console.log("equipment.json not present — skipping (expected until SKU data exists)");
    return;
  }
  const rows = JSON.parse(readFileSync(path, "utf8"));
  const resolved = [];
  const warnings: string[] = [];
  for (const row of rows) {
    const { operator_slug, ...rest } = row;
    const operator_id = operatorIds.get(operator_slug);
    if (!operator_id) {
      warnings.push(`no operator for slug "${operator_slug}" — skipped "${rest.name}"`);
      continue;
    }
    if (!rest.category || !rest.name) {
      warnings.push(`missing category/name — skipped row for ${operator_slug}`);
      continue;
    }
    resolved.push({ ...rest, operator_id });
  }
  // Composite-key idempotency: delete-then-insert per operator would lose ids,
  // so match on the natural key and update in place.
  let inserted = 0;
  let updated = 0;
  for (const item of resolved) {
    const { data: existing } = await db
      .from("equipment")
      .select("id")
      .eq("operator_id", item.operator_id)
      .eq("name", item.name)
      .is("size", item.size ?? null)
      .maybeSingle();
    if (existing) {
      const { error } = await db.from("equipment").update(item).eq("id", existing.id);
      if (error) throw error;
      updated++;
    } else {
      const { error } = await db.from("equipment").insert(item);
      if (error) throw error;
      inserted++;
    }
  }
  console.log(`equipment: ${inserted} inserted, ${updated} updated`);
  for (const w of warnings) console.warn(`  warn: ${w}`);
}

const operatorIds = await importOperators();
await importEquipment(operatorIds);
console.log("seed complete");
