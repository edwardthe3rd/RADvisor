/**
 * Website-first evidence gatherer for operator acquisition + equipment types.
 *
 *   node supabase/seed/verify/gather_evidence.mjs <category|all> [--limit N]
 *
 * For each active operator in the category it fetches the website (homepage +
 * rental/demo/lease pages) and the Google Places summary, scans both for
 * acquisition signals (rental / demo / season-lease) and equipment-type
 * subcategories, then writes:
 *   verify/evidence/<category>.json   raw signals + snippets (machine-readable)
 *   verify/<category>_worksheet.md    current-vs-detected for human/agent review
 *
 * Requires GOOGLE_PLACES_API_KEY (supabase/seed/.env). Network access required.
 * This proposes; it never edits operators.json. Conflicts are reviewed by the
 * agent/founder before anything is applied.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  seedDir,
  verifyDir,
  operatorsPath,
  loadApiKey,
  extractPlaceId,
  fetchPlace,
  collectGoogleText,
  fetchWebsiteEvidence,
  detectAcquisition,
  detectSubcategories,
  SUBCATEGORY_KEYWORDS,
  pool,
} from "./lib.mjs";

const args = process.argv.slice(2);
const category = args.find((a) => !a.startsWith("--")) ?? "all";
const limitArg = args.indexOf("--limit");
const limit = limitArg >= 0 ? Number(args[limitArg + 1]) : Infinity;

if (category !== "all" && !SUBCATEGORY_KEYWORDS[category]) {
  console.error(
    `Unknown category "${category}". Known: ${Object.keys(SUBCATEGORY_KEYWORDS).join(", ")}, or "all".`,
  );
  process.exit(1);
}

const apiKey = loadApiKey();
if (!apiKey) console.warn("warn: GOOGLE_PLACES_API_KEY not found — website-only signals.");

const operators = JSON.parse(readFileSync(operatorsPath, "utf8"));
const active = operators.filter((o) => o.is_active !== false);
const targets = active
  .filter((o) => category === "all" || (o.categories || []).includes(category))
  .slice(0, limit);

console.log(
  `Gathering evidence for ${targets.length} active operators in "${category}"…`,
);

function currentState(op) {
  return {
    categories: op.categories || [],
    subcategories: op.subcategories || [],
    offers_rental: op.offers_rental !== false, // DB/seed default true
    offers_demo: op.offers_demo === true,
    offers_season_lease: op.offers_season_lease === true,
  };
}

/**
 * Hard conflicts contradict verified data and need a human decision.
 * Soft proposals are additive (new field / the new "rents AND demos" capability)
 * and are surfaced for confirmation, not treated as errors.
 */
function classify(cur, det, reachable, allowedBase) {
  const conflicts = [];
  const proposals = [];
  const demoOnly = cur.offers_demo && !cur.offers_rental;

  // --- Hard conflicts ---
  if (demoOnly && det.rental)
    conflicts.push("marked demo-only but a rental signal was found");
  if (cur.offers_rental && !det.rental && !det.demo && reachable)
    conflicts.push("offers_rental=true but no rental signal (retail/tours/maintenance/JS site?)");
  if (cur.offers_demo && !det.demo && reachable)
    conflicts.push("offers_demo=true but no demo signal found");
  if (cur.offers_season_lease && !det.lease && reachable)
    conflicts.push("offers_season_lease=true but no lease signal found");
  if (det.retailOnly)
    conflicts.push("looks retail-only — review for deactivation");
  // Tagged subcategories not corroborated — only check tags that belong to THIS
  // category's taxonomy (subcategories is operator-wide and spans all categories).
  if (cur.subcategories.length && allowedBase) {
    const detSet = new Set(det.subcategories);
    const missing = cur.subcategories.filter(
      (s) => allowedBase.has(s) && !detSet.has(s),
    );
    if (missing.length)
      conflicts.push(`tagged subcats not found on site: ${missing.join(", ")}`);
  }

  // --- Soft proposals (additive) ---
  if (det.demo && !cur.offers_demo && cur.offers_rental)
    proposals.push("also appears to offer demos → propose offers_demo=true");
  if (det.lease && !cur.offers_season_lease)
    proposals.push("appears to offer a season lease → propose offers_season_lease=true");
  const curSubs = new Set(cur.subcategories);
  const newSubs = det.subcategories.filter((s) => !curSubs.has(s));
  if (newSubs.length)
    proposals.push(`propose subcategories: ${newSubs.join(", ")}`);

  return { conflicts, proposals };
}

const results = await pool(
  targets,
  async (op) => {
    const cat = category === "all" ? (op.categories || [])[0] : category;
    const web = await fetchWebsiteEvidence(op.website);
    const webAcq = detectAcquisition(web.text);
    const webSubs = detectSubcategories(web.text, cat);

    let google = { all: "", overview: "", reviews: "" };
    let googleAcq = { rental: false, demo: false, lease: false, retailOnly: false };
    let googleSubs = [];
    const placeId = extractPlaceId(op.notes_internal);
    if (apiKey && placeId) {
      const { place, error } = await fetchPlace(apiKey, placeId);
      if (!error && place) {
        google = collectGoogleText(place);
        googleAcq = detectAcquisition(google.all);
        googleSubs = detectSubcategories(google.all, cat);
      }
    }

    const detected = {
      rental: webAcq.rental || googleAcq.rental,
      demo: webAcq.demo || googleAcq.demo,
      lease: webAcq.lease || googleAcq.lease,
      retailOnly: (webAcq.retailOnly || googleAcq.retailOnly) &&
        !(webAcq.rental || googleAcq.rental),
      subcategories: [...new Set([...webSubs, ...googleSubs])].sort(),
    };

    const cur = currentState(op);
    const reachable = web.reachable || google.all.length > 0;
    const needsAgentFetch = !reachable;
    const allowedBase = new Set(Object.keys(SUBCATEGORY_KEYWORDS[cat] || {}));
    const { conflicts, proposals } = classify(cur, detected, reachable, allowedBase);

    // Snippet: a window around the first acquisition keyword for quick review.
    const snippetSource = web.text || google.all;
    const km = snippetSource.match(
      /[^.]*\b(rental|rent|demo|lease|season)[^.]*\./i,
    );
    const snippet = (km?.[0] || snippetSource.slice(0, 220)).trim().slice(0, 260);

    return {
      slug: op.slug,
      name: op.name,
      website: op.website,
      category: cat,
      current: cur,
      detected,
      signals: { website: webAcq, google: googleAcq },
      pages: web.pages.map((p) => p.url),
      googleOverview: google.overview?.slice(0, 240) || null,
      snippet,
      reachable,
      needsAgentFetch,
      conflicts,
      proposals,
    };
  },
  6,
  100,
);

// ---------------------------------------------------------------------------
// Write outputs
// ---------------------------------------------------------------------------

mkdirSync(join(verifyDir, "evidence"), { recursive: true });
const evidencePath = join(verifyDir, "evidence", `${category}.json`);
writeFileSync(
  evidencePath,
  JSON.stringify({ category, gatheredAt: new Date().toISOString(), results }, null, 2),
);

const conflicts = results.filter((r) => r.conflicts.length);
const proposals = results.filter((r) => r.proposals.length);
const needsFetch = results.filter((r) => r.needsAgentFetch);

function flagSummary(r) {
  const f = [];
  if (r.detected.rental) f.push("rental");
  if (r.detected.demo) f.push("demo");
  if (r.detected.lease) f.push("lease");
  if (r.detected.retailOnly) f.push("retail?");
  return f.join("+") || "—";
}

function mdEscape(s) {
  return (s || "").replace(/\|/g, "/").replace(/\n/g, " ");
}

let md = `# ${category} — verification worksheet

Generated: ${new Date().toISOString().slice(0, 10)} · ${results.length} active operators

Re-run: \`node supabase/seed/verify/gather_evidence.mjs ${category}\`

Detected = signals scanned from the website + Google Places text. This is a
**proposal for review**, not applied data.

- **Hard conflicts** contradict current data — resolve these first.
- **Proposals** are additive (e.g. a rental shop that also runs demos, or new
  subcategory tags) — confirm before applying.

## Summary

| Signal | Count |
|--------|------:|
| Rental detected | ${results.filter((r) => r.detected.rental).length} |
| Demo detected | ${results.filter((r) => r.detected.demo).length} |
| Lease detected | ${results.filter((r) => r.detected.lease).length} |
| Retail-only suspected | ${results.filter((r) => r.detected.retailOnly).length} |
| **Hard conflicts** | **${conflicts.length}** |
| Proposals (additive) | ${proposals.length} |
| Needs manual fetch (no html/Google) | ${needsFetch.length} |

## Hard conflicts vs current (review first)

`;

if (!conflicts.length) {
  md += "_None — detected signals are consistent with current data._\n\n";
} else {
  md += "| Operator | Slug | Conflict | Detected | Pages | Snippet |\n|------|------|------|------|------:|------|\n";
  for (const r of conflicts) {
    md += `| ${mdEscape(r.name)} | \`${r.slug}\` | ${mdEscape(r.conflicts.join("; "))} | ${flagSummary(r)} | ${r.pages.length} | ${mdEscape(r.snippet)} |\n`;
  }
  md += "\n";
}

md += `## Proposals — additive, confirm before applying

`;
if (!proposals.length) {
  md += "_None._\n\n";
} else {
  md += "| Operator | Slug | Proposal | Detected | Snippet |\n|------|------|------|------|------|\n";
  for (const r of proposals) {
    md += `| ${mdEscape(r.name)} | \`${r.slug}\` | ${mdEscape(r.proposals.join("; "))} | ${flagSummary(r)} | ${mdEscape(r.snippet)} |\n`;
  }
  md += "\n";
}

md += `## Needs manual fetch (website + Google both empty)

`;
if (!needsFetch.length) {
  md += "_None._\n\n";
} else {
  md += "| Operator | Slug | Website |\n|------|------|------|\n";
  for (const r of needsFetch) {
    md += `| ${mdEscape(r.name)} | \`${r.slug}\` | ${r.website || "—"} |\n`;
  }
  md += "\n";
}

md += `## All operators (detected signals + proposed subcategories)

| Operator | Slug | Detected | Subcategories (detected) | Current flags |
|------|------|------|------|------|
`;
for (const r of results) {
  const curFlags = [
    r.current.offers_rental ? "rental" : null,
    r.current.offers_demo ? "demo" : null,
    r.current.offers_season_lease ? "lease" : null,
  ]
    .filter(Boolean)
    .join("+");
  md += `| ${mdEscape(r.name)} | \`${r.slug}\` | ${flagSummary(r)} | ${r.detected.subcategories.join(", ") || "—"} | ${curFlags || "—"} |\n`;
}
md += "\n";

const worksheetPath = join(verifyDir, `${category}_worksheet.md`);
writeFileSync(worksheetPath, md);

console.log(`\nDone. ${results.length} operators.`);
console.log(
  `  hard conflicts: ${conflicts.length}, proposals: ${proposals.length}, needs manual fetch: ${needsFetch.length}`,
);
console.log(`Evidence: ${evidencePath}`);
console.log(`Worksheet: ${worksheetPath}`);
