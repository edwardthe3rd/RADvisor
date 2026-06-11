/**
 * Idempotent Supabase seed importer (instructions/02_database_seeding.md §2).
 *
 * JSON lives in supabase/seed/; this script runs from web/ so dependencies
 * resolve from web/node_modules.
 *
 *   cd web && npm run seed
 *   SUPABASE_SERVICE_ROLE_KEY=... npm run seed
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const seedDir = join(dirname(fileURLToPath(import.meta.url)), "../../supabase/seed");

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://wzngubwctlorewegtbgo.supabase.co";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is required (Supabase dashboard → Settings → API).");
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

async function operatorsTableHasOffersDelivery(): Promise<boolean> {
  const { error } = await db.from("operators").select("offers_delivery").limit(1);
  if (!error) return true;
  if (error.message.includes("offers_delivery")) return false;
  throw new Error(`operators schema probe failed: ${error.message}`);
}

function sanitizeOperatorBatch(
  batch: Record<string, unknown>[],
  includeOffersDelivery: boolean,
): Record<string, unknown>[] {
  if (!includeOffersDelivery) {
    return batch.map(({ offers_delivery: _ignored, ...rest }) => rest);
  }
  return batch.map((row) => ({
    ...row,
    offers_delivery: row.offers_delivery === true,
  }));
}

async function importOperators(): Promise<Map<string, string>> {
  const path = join(seedDir, "operators.json");
  const rows = JSON.parse(readFileSync(path, "utf8"));
  const includeOffersDelivery = await operatorsTableHasOffersDelivery();
  if (!includeOffersDelivery) {
    console.warn(
      "warn: operators.offers_delivery column missing — run `npm run migrate` " +
        "(or paste supabase/migrations/0003_operators_offers_delivery.sql in the " +
        "Supabase SQL editor), then re-seed to import delivery flags.",
    );
  }
  let upserted = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const batch = sanitizeOperatorBatch(
      rows.slice(i, i + 100),
      includeOffersDelivery,
    );
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
  const path = join(seedDir, "equipment.json");
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

async function retireEquipment(operatorIds: Map<string, string>) {
  const path = join(seedDir, "equipment_retired.json");
  if (!existsSync(path)) return;
  const rows: { operator_slug: string; name: string; size?: string | null }[] =
    JSON.parse(readFileSync(path, "utf8"));
  let retired = 0;
  for (const row of rows) {
    const operator_id = operatorIds.get(row.operator_slug);
    if (!operator_id) continue;
    const { error } = await db
      .from("equipment")
      .update({ is_active: false })
      .eq("operator_id", operator_id)
      .eq("name", row.name)
      .is("size", row.size ?? null);
    if (error) throw error;
    retired++;
  }
  console.log(`equipment: ${retired} retired`);
}

async function main() {
  const operatorIds = await importOperators();
  await importEquipment(operatorIds);
  await retireEquipment(operatorIds);
  console.log("seed complete");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
