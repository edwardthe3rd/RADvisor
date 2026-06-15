/**
 * Build the labeled dataset for the intake classifier.
 *
 *   node supabase/seed/verify/intake/build_dataset.mjs
 *
 * For every operator with a google_place_id, joins the live DB label
 * (is_active + categories + flags) with the exact classifier feature bundle
 * (signals.mjs → buildSignalBundle). Output: intake/dataset.json — the ground
 * truth validate.mjs tunes against. Network + GOOGLE_PLACES_API_KEY required.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadApiKey, extractPlaceId, pool } from "../lib.mjs";
import { buildSignalBundle } from "./signals.mjs";

const intakeDir = dirname(fileURLToPath(import.meta.url));
const operatorsPath = join(intakeDir, "../../operators.json");

const apiKey = loadApiKey();
if (!apiKey) {
  console.error("GOOGLE_PLACES_API_KEY required (backend/.env).");
  process.exit(1);
}

const operators = JSON.parse(readFileSync(operatorsPath, "utf8"));
const withId = operators
  .map((op) => ({ op, placeId: extractPlaceId(op.notes_internal) }))
  .filter((x) => x.placeId);

console.log(`Fetching signals for ${withId.length} operators…`);

const rows = await pool(
  withId,
  async ({ op, placeId }) => {
    const signals = await buildSignalBundle(apiKey, {
      placeId,
      name: op.name,
      website: op.website,
    });
    return {
      // DB label (ground truth)
      slug: op.slug,
      is_active: op.is_active !== false,
      categories: op.categories || [],
      subcategories: op.subcategories || [],
      offers_rental: op.offers_rental !== false,
      offers_demo: op.offers_demo === true,
      offers_season_lease: op.offers_season_lease === true,
      // classifier features
      ...signals,
    };
  },
  6,
  100,
);

mkdirSync(intakeDir, { recursive: true });
const out = join(intakeDir, "dataset.json");
writeFileSync(out, JSON.stringify({ builtAt: new Date().toISOString(), rows }, null, 2));

const active = rows.filter((r) => r.is_active).length;
const errs = rows.filter((r) => r.googleError).length;
console.log(`\nDone. ${rows.length} rows (${active} active, ${rows.length - active} inactive), ${errs} fetch errors.`);
console.log(`Dataset: ${out}`);
