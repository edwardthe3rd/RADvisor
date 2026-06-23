/**
 * Classify a NEW batch of operators from raw Google Places data.
 *
 *   node supabase/seed/verify/intake/classify_batch.mjs --input new_batch.json
 *
 * Input JSON: an array of either
 *   - place_id strings ("ChIJ…"), or
 *   - objects { place_id | google_place_id, name?, website?, notes_internal? }
 *     (notes_internal may embed "google_place_id:ChIJ…", same as operators.json)
 *
 * For each, it fetches Google Place Details + the website, runs the classifier,
 * and writes:
 *   intake/out/<basename>.classified.json  full results
 *   intake/out/<basename>.review.md         keep / review / reject, grouped
 *   intake/out/<basename>.keep.seed.json     operators.json-shaped rows for KEEP
 *
 * Requires GOOGLE_PLACES_API_KEY (supabase/seed/.env) + network.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadApiKey, extractPlaceId, pool } from "../lib.mjs";
import { buildSignalBundle } from "./signals.mjs";
import { classifyOperator, CLASSIFIER_VERSION } from "./classify.mjs";

const intakeDir = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const inIdx = args.indexOf("--input");
if (inIdx < 0) {
  console.error("usage: classify_batch.mjs --input <batch.json>");
  process.exit(1);
}
const inputPath = args[inIdx + 1];

const apiKey = loadApiKey();
if (!apiKey) {
  console.error("GOOGLE_PLACES_API_KEY required (supabase/seed/.env).");
  process.exit(1);
}

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Normalize input entries to { placeId, name, website }.
const raw = JSON.parse(readFileSync(inputPath, "utf8"));
const entries = raw
  .map((e) => {
    if (typeof e === "string") return { placeId: e };
    const placeId =
      e.place_id ||
      e.google_place_id ||
      extractPlaceId(e.notes_internal) ||
      null;
    return { placeId, name: e.name || null, website: e.website || null };
  })
  .filter((e) => e.placeId);

console.log(`Classifying ${entries.length} operators (classifier v${CLASSIFIER_VERSION})…`);

const results = await pool(
  entries,
  async (e) => {
    const signals = await buildSignalBundle(apiKey, e);
    const verdict = classifyOperator(signals);
    return { ...verdict, name: signals.name, website: signals.website, placeId: e.placeId, signals };
  },
  6,
  100,
);

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------
const outDir = join(intakeDir, "out");
mkdirSync(outDir, { recursive: true });
const base = basename(inputPath).replace(/\.json$/, "");

writeFileSync(
  join(outDir, `${base}.classified.json`),
  JSON.stringify({ classifierVersion: CLASSIFIER_VERSION, classifiedAt: new Date().toISOString(), results }, null, 2),
);

const keep = results.filter((r) => r.decision === "keep");
const review = results.filter((r) => r.decision === "review");
const reject = results.filter((r) => r.decision === "reject");

// operators.json-shaped rows for the confident KEEPs (ready to merge + seed).
const keepSeed = keep.map((r) => ({
  name: r.name,
  slug: slugify(r.name),
  website: r.website,
  categories: r.categories,
  subcategories: r.subcategories,
  offers_rental: true,
  offers_demo: r.offers_demo === true,
  offers_season_lease: r.offers_season_lease === true,
  inventory_sync_type: "manual",
  notes_internal: `google_place_id:${r.placeId}; intake_classified v${CLASSIFIER_VERSION}`,
  is_active: true,
  last_verified: new Date().toISOString().slice(0, 10),
}));
writeFileSync(join(outDir, `${base}.keep.seed.json`), JSON.stringify(keepSeed, null, 1));

function table(rows) {
  if (!rows.length) return "_none_\n";
  let md = "| Name | Decision | Conf | Categories | Subcategories | Reason |\n|------|------|--:|------|------|------|\n";
  for (const r of rows) {
    md += `| ${(r.name || "").replace(/\|/g, "/")} | ${r.decision} | ${r.confidence} | ${r.categories.join(", ") || "—"} | ${r.subcategories.join(", ") || "—"} | ${r.reason} |\n`;
  }
  return md + "\n";
}

const md = `# Intake classification — ${base}

Classifier v${CLASSIFIER_VERSION} · ${results.length} operators · ${new Date().toISOString().slice(0, 10)}

| Outcome | Count |
|---------|------:|
| keep (auto-add) | ${keep.length} |
| review (manual) | ${review.length} |
| reject (not a rental operator) | ${reject.length} |

Confident KEEPs are written to \`out/${base}.keep.seed.json\` (operators.json-shaped).
Work the **review** list by hand; **reject** list is for spot-checking only.

## review — needs a human
${table(review)}
## keep — confident rental operators
${table(keep)}
## reject — not a rental operator
${table(reject)}
`;
writeFileSync(join(outDir, `${base}.review.md`), md);

console.log(`\nDone. keep=${keep.length} review=${review.length} reject=${reject.length}`);
console.log(`  out/${base}.review.md`);
console.log(`  out/${base}.keep.seed.json`);
console.log(`  out/${base}.classified.json`);
