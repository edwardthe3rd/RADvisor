/**
 * Apply curated website-verified corrections to operators.json.
 *
 *   node supabase/seed/apply_operator_verified.mjs
 *
 * Source of truth: operator_website_verified.json (instructions/02 §9).
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const seedDir = dirname(fileURLToPath(import.meta.url));
const operatorsPath = join(seedDir, "operators.json");
const verifiedPath = join(seedDir, "operator_website_verified.json");

const verified = JSON.parse(readFileSync(verifiedPath, "utf8"));
const operators = JSON.parse(readFileSync(operatorsPath, "utf8"));
const today = new Date().toISOString().slice(0, 10);

function mergeNotesInternal(existing, patch) {
  const placeMatch = (existing || "").match(/google_place_id:(ChIJ[A-Za-z0-9_-]+)/);
  const placeId = placeMatch?.[0];
  const extra = (patch || "").trim();
  if (!extra) return existing;
  if (!placeId) return extra;
  if (extra.includes("google_place_id:")) return extra;
  return `${placeId}; ${extra}`;
}

let applied = 0;
for (const op of operators) {
  const patch = verified[op.slug];
  if (!patch) continue;

  let changed = false;
  for (const [key, value] of Object.entries(patch)) {
    if (key === "verified_at" || key === "source") continue;
    if (key === "name") {
      // Demo status is expressed via offers_demo/offers_rental, never a name suffix.
      const clean = String(value).replace(/\s*\(Demo Only\)\s*$/i, "");
      if (clean !== op.name) {
        op.name = clean;
        changed = true;
      }
      continue;
    }
    if (key === "notes_internal") {
      const merged = mergeNotesInternal(op.notes_internal, value);
      if (merged !== op.notes_internal) {
        op.notes_internal = merged;
        changed = true;
      }
      continue;
    }
    if (JSON.stringify(op[key]) !== JSON.stringify(value)) {
      op[key] = value;
      changed = true;
    }
  }
  if (changed) {
    op.last_verified = patch.verified_at ?? today;
    applied++;
    console.log(`  ${op.slug}`);
  }
}

writeFileSync(operatorsPath, JSON.stringify(operators, null, 1));
console.log(`Applied ${applied} website-verified corrections to operators.json`);
