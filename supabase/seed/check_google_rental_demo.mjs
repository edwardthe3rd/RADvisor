/**
 * Cross-check active operators against Google Places for rent vs demo signals.
 *
 *   node supabase/seed/check_google_rental_demo.mjs
 *
 * Requires GOOGLE_PLACES_API_KEY (backend/.env or env). Reads operators.json,
 * fetches Place Details for each google_place_id, and writes google_rental_demo_report.json.
 *
 * Classification is heuristic on Google editorial/generative/review summaries +
 * display name. Review the report before applying changes.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const seedDir = dirname(fileURLToPath(import.meta.url));
const operatorsPath = join(seedDir, "operators.json");
const reportPath = join(seedDir, "google_rental_demo_report.json");

const CONCURRENCY = 6;
const DELAY_MS = 120;

function loadApiKey() {
  if (process.env.GOOGLE_PLACES_API_KEY) return process.env.GOOGLE_PLACES_API_KEY;
  const envPath = join(seedDir, "../../backend/.env");
  if (!existsSync(envPath)) return null;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^GOOGLE_PLACES_API_KEY=(.+)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  return null;
}

function extractPlaceId(notes) {
  const m = (notes || "").match(/google_place_id:(ChIJ[A-Za-z0-9_-]+)/);
  return m?.[1] ?? null;
}

function collectText(place) {
  const overview = [
    place.displayName?.text,
    place.editorialSummary?.text,
    place.editorialSummary?.overview,
    place.generativeSummary?.overview?.text,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const reviews = (place.reviewSummary?.text?.text || "").toLowerCase();
  return { overview, reviews, all: `${overview} ${reviews}`.trim() };
}

function classifyGoogleText({ overview, reviews, all }) {
  const rental =
    /\b(rentals?|renting|rent out|rent-a-|rent a |gear rental|equipment rental|for rent|to rent|hire|rent skis|rent bikes|rent kayaks|rental shop|rental firm|rental outfitter|rental spot)\b/i.test(
      all,
    );
  // Demo signals: prefer Google-authored summaries over review aggregates.
  const demoSource = overview || reviews;
  const demo =
    /\b(demos?|demo program|demo center|demo ski|demo board|demo and|try before you buy|boot-fitting services)\b/i.test(
      demoSource,
    ) && !/\b(no rental|rentals? not|does not rent)\b/i.test(demoSource);
  const retail =
    /\b(buy,? sell|consignment store|consignment retail|retail only)\b/i.test(overview) &&
    !rental &&
    !/\b(also (offers|rents|renting)|plus rentals|with rentals|rental shop)\b/i.test(all);
  if (rental && demo) return "rental_and_demo";
  if (rental) return "rental";
  if (demo) return "demo";
  if (retail) return "retail_only";
  return "unknown";
}

function currentOffering(op) {
  if (op.name?.includes("(Demo Only)")) return "demo_only_labeled";
  if ((op.categories || []).length > 0) return "rental_labeled";
  return "unlabeled";
}

async function fetchPlace(apiKey, placeId) {
  const url = `https://places.googleapis.com/v1/places/${placeId}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "displayName",
        "websiteUri",
        "primaryType",
        "types",
        "editorialSummary",
        "generativeSummary",
        "reviewSummary",
      ].join(","),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    return { error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
  }
  return { place: await res.json() };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function pool(items, fn, limit) {
  const out = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
      await sleep(DELAY_MS);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return out;
}

const apiKey = loadApiKey();
if (!apiKey) {
  console.error("GOOGLE_PLACES_API_KEY not found (backend/.env or env).");
  process.exit(1);
}

const operators = JSON.parse(readFileSync(operatorsPath, "utf8"));
const active = operators.filter((o) => o.is_active !== false);
const toCheck = active
  .map((op) => ({ op, placeId: extractPlaceId(op.notes_internal) }))
  .filter((x) => x.placeId);

console.log(`Checking ${toCheck.length} active operators with Google place IDs…`);

const results = await pool(
  toCheck,
  async ({ op, placeId }) => {
    const { place, error } = await fetchPlace(apiKey, placeId);
    if (error) {
      return { slug: op.slug, name: op.name, placeId, fetchError: error, current: currentOffering(op) };
    }
    const googleText = collectText(place);
    const googleOffering = classifyGoogleText(googleText);
    const current = currentOffering(op);
    const mismatch =
      (current === "demo_only_labeled" && googleOffering === "rental") ||
      (current === "demo_only_labeled" && googleOffering === "unknown") ||
      (current === "rental_labeled" && googleOffering === "demo") ||
      (current === "rental_labeled" && googleOffering === "retail_only") ||
      (current === "rental_labeled" && googleOffering === "unknown" && op.name.includes("Sports"));

    return {
      slug: op.slug,
      name: op.name,
      placeId,
      website: op.website,
      googleName: place.displayName?.text,
      googleWebsite: place.websiteUri,
      googlePrimaryType: place.primaryType,
      googleOffering,
      currentOffering: current,
      mismatch,
      googleSnippet: googleText.all.slice(0, 400),
      editorialSummary: place.editorialSummary?.text ?? place.editorialSummary?.overview ?? null,
      generativeOverview: place.generativeSummary?.overview?.text ?? null,
    };
  },
  CONCURRENCY,
);

const mismatches = results.filter((r) => r.mismatch);
const demos = results.filter((r) => r.googleOffering === "demo" || r.googleOffering === "rental_and_demo");
const unknowns = results.filter((r) => r.googleOffering === "unknown" && !r.fetchError);

writeFileSync(
  reportPath,
  JSON.stringify({ checkedAt: new Date().toISOString(), mismatches, demos, unknowns, all: results }, null, 2),
);

const reviewMdPath = join(seedDir, "google_rental_demo_review.md");
const buckets = {
  rental: results.filter((r) => r.googleOffering === "rental"),
  rental_and_demo: results.filter((r) => r.googleOffering === "rental_and_demo"),
  demo: results.filter((r) => r.googleOffering === "demo"),
  retail_only: results.filter((r) => r.googleOffering === "retail_only"),
  unknown: results.filter((r) => r.googleOffering === "unknown" && !r.fetchError),
  fetch_error: results.filter((r) => r.fetchError),
};

function mdTable(rows) {
  if (!rows.length) return "_None_\n";
  let out = "| Name | Slug | Google says | Current | Snippet |\n|------|------|-------------|---------|--------|\n";
  for (const r of rows) {
    const snip = (r.generativeOverview || r.editorialSummary || r.googleSnippet || "—")
      .replace(/\|/g, "/")
      .slice(0, 120);
    out += `| ${r.name} | \`${r.slug}\` | ${r.googleOffering} | ${r.currentOffering} | ${snip} |\n`;
  }
  return out + "\n";
}

writeFileSync(
  reviewMdPath,
  `# Google rent vs demo cross-check

Generated: ${new Date().toISOString().slice(0, 10)}

Run \`node supabase/seed/check_google_rental_demo.mjs\` to refresh (requires \`GOOGLE_PLACES_API_KEY\` in \`backend/.env\`).

Uses Google Places **editorialSummary**, **generativeSummary**, and **reviewSummary** when available (~half of listings). When Google returns no summary (e.g. RMU Truckee), check Maps manually — structured "Services" are not always in the API.

## Summary

| Google signal | Count |
|---------------|------:|
| Rental | ${buckets.rental.length} |
| Rental + demo | ${buckets.rental_and_demo.length} |
| Demo only | ${buckets.demo.length} |
| Retail only | ${buckets.retail_only.length} |
| Unknown (no summary text) | ${buckets.unknown.length} |
| Fetch errors | ${buckets.fetch_error.length} |
| **Mismatches vs current label** | **${mismatches.length}** |

## Demo only (Google)

${mdTable(buckets.demo)}

## Rental + demo (Google — treat as full rental)

${mdTable(buckets.rental_and_demo)}

## Retail only (Google — review for deactivation)

${mdTable(buckets.retail_only)}

## Mismatches (review first)

${mdTable(mismatches)}

## Unknown — no Google summary text (${buckets.unknown.length})

These need website or manual Maps review. See \`google_rental_demo_report.json\` → \`unknowns\`.

`,
);

console.log(`Review: ${reviewMdPath}`);

console.log(`\nDone. ${results.length} checked, ${mismatches.length} mismatches, ${unknowns.length} unknown.`);
console.log(`Report: ${reportPath}\n`);
console.log("Mismatches:");
for (const r of mismatches) {
  console.log(`  ${r.slug}: current=${r.currentOffering} google=${r.googleOffering}`);
  if (r.generativeOverview) console.log(`    Google: ${r.generativeOverview.slice(0, 120)}…`);
}
console.log("\nGoogle demo signals:");
for (const r of demos.slice(0, 25)) {
  console.log(`  ${r.slug} (${r.googleOffering}): ${(r.generativeOverview || r.editorialSummary || r.googleSnippet).slice(0, 100)}`);
}
