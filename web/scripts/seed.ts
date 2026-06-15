/**
 * Idempotent Supabase seed importer (instructions/02_database_seeding.md §2).
 *
 * JSON lives in supabase/seed/; this script runs from web/ so dependencies
 * resolve from web/node_modules.
 *
 *   cd web
 *   SUPABASE_SERVICE_ROLE_KEY='your-key-from-.env.local' npm run seed
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvLocal } from "./load-env-local";

loadEnvLocal();

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

async function operatorsTableHasColumn(column: string): Promise<boolean> {
  const { error } = await db.from("operators").select(column).limit(1);
  if (!error) return true;
  if (error.message.includes(column)) return false;
  throw new Error(`operators schema probe failed: ${error.message}`);
}

function sanitizeOperatorBatch(
  batch: Record<string, unknown>[],
  columns: {
    offersDelivery: boolean;
    offersSeasonLease: boolean;
    offersRental: boolean;
    offersDemo: boolean;
    subcategories: boolean;
  },
): Record<string, unknown>[] {
  return batch.map((row) => {
    const next = { ...row };
    if (!columns.offersDelivery) delete next.offers_delivery;
    else next.offers_delivery = row.offers_delivery === true;
    if (!columns.offersSeasonLease) delete next.offers_season_lease;
    else next.offers_season_lease = row.offers_season_lease === true;
    // offers_rental defaults to true in the DB, so only override when explicitly set.
    if (!columns.offersRental) delete next.offers_rental;
    else next.offers_rental = row.offers_rental !== false;
    if (!columns.offersDemo) delete next.offers_demo;
    else next.offers_demo = row.offers_demo === true;
    if (!columns.subcategories) delete next.subcategories;
    else next.subcategories = Array.isArray(row.subcategories)
      ? row.subcategories
      : [];
    return next;
  });
}

async function importOperators(): Promise<Map<string, string>> {
  const path = join(seedDir, "operators.json");
  const rows = JSON.parse(readFileSync(path, "utf8"));
  const includeOffersDelivery = await operatorsTableHasColumn("offers_delivery");
  const includeOffersSeasonLease = await operatorsTableHasColumn("offers_season_lease");
  const includeOffersRental = await operatorsTableHasColumn("offers_rental");
  const includeOffersDemo = await operatorsTableHasColumn("offers_demo");
  const includeSubcategories = await operatorsTableHasColumn("subcategories");
  if (!includeOffersDelivery) {
    console.warn(
      "warn: operators.offers_delivery column missing — run `npm run migrate` " +
        "(or paste supabase/migrations/0003_operators_offers_delivery.sql in the " +
        "Supabase SQL editor), then re-seed to import delivery flags.",
    );
  }
  if (!includeOffersSeasonLease) {
    console.warn(
      "warn: operators.offers_season_lease column missing — run `npm run migrate` " +
        "(or paste supabase/migrations/0004_operators_offers_season_lease.sql in the " +
        "Supabase SQL editor), then re-seed to import season lease flags.",
    );
  }
  if (!includeOffersRental || !includeOffersDemo || !includeSubcategories) {
    console.warn(
      "warn: operators.offers_rental/offers_demo/subcategories column(s) missing — " +
        "run `npm run migrate` (or paste " +
        "supabase/migrations/0005_operators_acquisition_subcategories.sql in the " +
        "Supabase SQL editor), then re-seed to import acquisition flags + subcategories.",
    );
  }
  let upserted = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const batch = sanitizeOperatorBatch(rows.slice(i, i + 100), {
      offersDelivery: includeOffersDelivery,
      offersSeasonLease: includeOffersSeasonLease,
      offersRental: includeOffersRental,
      offersDemo: includeOffersDemo,
      subcategories: includeSubcategories,
    });
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
