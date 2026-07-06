#!/usr/bin/env node
// Pass B — DEEP-EXTRACTION BATCH EMITTER (mechanical, no judgment).
//
//   node supabase/seed/pass_b_batch.mjs [N] [--category snow_sports] [--out FILE]
//
// Emits the next N (operator, category) pairs that still need Pass B extraction for the target
// category: operators with status "triaged" whose categories[] OR review_categories[] contain
// the slug, minus pairs already recorded in pass_b_<category>_results.json. Feed the output to
// a capable LLM together with PASS_B_RUNBOOK.md and instructions/extraction/<category>.md; the
// LLM returns extraction JSON, which you apply with pass_b_apply.mjs.
//
// Ordering (calibration-friendly): human-verified / high-confidence rows first, mechanically
// auto-triaged rows last — they are the most likely category_not_found, and by the time they
// come up the extractor is calibrated on real inventory.

import fs from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const seedDir = dirname(fileURLToPath(import.meta.url));
const P = (f) => join(seedDir, f);
const read = (f) => JSON.parse(fs.readFileSync(P(f), "utf8"));

const args = process.argv.slice(2);
const valueAfter = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const N = Number(args.find((a) => /^\d+$/.test(a)) || 10);
const CATEGORY = valueAfter("--category") || "snow_sports";
const OUT = valueAfter("--out");

// Extraction needs more page detail than triage did.
const PAGE_TEXT_CHARS = 4000;
const MAX_PAGES = 8;
const GOOGLE_TEXT_CHARS = 800;

const triage = read("sweep_pass_a_triage.json");
const evidence = read("sweep_pass_a_evidence.json").results || [];
const evByKey = new Map(evidence.map((r) => [keyOf(r), r]));

const resultsFile = `pass_b_${CATEGORY}_results.json`;
const resultRows = fs.existsSync(P(resultsFile)) ? (read(resultsFile).results || []) : [];
const done = new Set(resultRows.map((r) => r.key || keyOf(r)));
const resultCounts = countOutcomes(resultRows);

const eligible = (triage.results || [])
  .filter((r) => r.status === "triaged")
  .filter((r) => (r.categories || []).includes(CATEGORY) || (r.review_categories || []).includes(CATEGORY))
  .filter((r) => !done.has(keyOf(r)));

const isAuto = (r) => /auto-triaged/i.test(r.note || "");
const tier = (r) => (isAuto(r) ? 2 : r.confidence === "high" ? 0 : 1);
eligible.sort((a, b) => tier(a) - tier(b) || (a.rank ?? Infinity) - (b.rank ?? Infinity));
const batch = eligible.slice(0, N);

const trunc = (s, n) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n) + "…[truncated]" : s; };

const lines = [];
lines.push(`# PASS B — DEEP EXTRACTION BATCH OF ${batch.length} OPERATORS (category: ${CATEGORY})`);
lines.push(`# Progress: ${done.size} logged (${formatOutcomeCounts(resultCounts)}), ${eligible.length} unlogged pair(s) remaining for this category.`);
if (resultCounts.needs_review) {
  lines.push(`# ⚠ ${resultCounts.needs_review} logged needs_review result(s) still require human/model follow-up; 0 remaining means no unlogged pairs, not full resolution.`);
}
lines.push(`# Read PASS_B_RUNBOOK.md + instructions/extraction/${CATEGORY}.md before extracting.`);
lines.push(`# NON-NEGOTIABLES (00_general §6):`);
lines.push(`#  - STEP 0: verify the category exists on the site before extracting. No trace of the`);
lines.push(`#    activity's rental gear in any season -> outcome "category_not_found" (cite the URL`);
lines.push(`#    you checked). Do not force-extract; do not park the operator in needs_review for this.`);
lines.push(`#    If this removes the operator's last category, include operator_status to re-route it.`);
lines.push(`#  - OFF-SEASON is not category_not_found: extract the most recent published seasonal`);
lines.push(`#    pricing and note the season/year in the item description.`);
lines.push(`#  - Booking-platform storefronts (Booqable etc.) ARE the operator's first-party inventory.`);
lines.push(`#  - Extract EVERY distinct rental item, not a sample. Re-sweep the live site; the cached`);
lines.push(`#    pages below are hints, not the ceiling.`);
lines.push(`#  - Never invent a price: unknown -> null (never 0). Never invent attribute keys.`);
lines.push(`# Output a JSON array of per-operator extraction objects (schema in PASS_B_RUNBOOK.md),`);
lines.push(`# then apply with:  node supabase/seed/pass_b_apply.mjs <your-extraction.json>`);
lines.push("");

for (const r of batch) {
  const ev = evByKey.get(keyOf(r)) || null;
  const confirmed = (r.categories || []).includes(CATEGORY);
  lines.push(`### [rank ${r.rank}] ${r.name}`);
  lines.push(`place_id: ${r.place_id || "(none)"}`);
  lines.push(`website: ${r.website || "(none)"}`);
  lines.push(`target_category: ${CATEGORY}   (${confirmed ? "CONFIRMED in categories[]" : "UNCONFIRMED — in review_categories[]; verify then extract or category_not_found"})`);
  lines.push(`all_categories: ${(r.categories || []).join(", ") || "(none)"}   review: ${(r.review_categories || []).join(", ") || "(none)"}`);
  lines.push(`triage_confidence: ${r.confidence}${isAuto(r) ? "   ⚠ AUTO-TRIAGED (categories were keyword-derived — verify first)" : ""}`);
  lines.push(`rental_page_urls: ${(r.rental_page_urls || []).join(" ") || "(none)"}`);
  if (r.evidence_snippet) lines.push(`triage_evidence: ${trunc(r.evidence_snippet, 500)}`);
  if (r.note) lines.push(`triage_note: ${trunc(r.note, 400)}`);
  if (ev?.google_text) lines.push(`google_text: ${trunc(ev.google_text, GOOGLE_TEXT_CHARS)}`);
  const seen = new Set();
  const pages = (ev?.pages || []).filter((p) => { if (!p?.url || seen.has(p.url)) return false; seen.add(p.url); return true; }).slice(0, MAX_PAGES);
  for (const p of pages) {
    lines.push(`--- page: ${p.url}`);
    lines.push(trunc(p.text, PAGE_TEXT_CHARS));
  }
  if ((ev?.pages || []).length > pages.length) lines.push(`(+${(ev?.pages || []).length - pages.length} more cached pages not shown — browse the live site regardless)`);
  const thin = !ev || !ev.reachable || (ev.pages_fetched || 0) <= 1 || seen.size <= 1;
  if (thin) lines.push(`⚠ THIN/PARTIAL CACHE (reachable:${ev ? ev.reachable : "no evidence row"}, distinct pages:${seen.size}). The snapshot cannot prove absence — browse the live site before any category_not_found.`);
  lines.push("====");
  lines.push("");
}

const output = lines.join("\n");
if (OUT) { fs.writeFileSync(OUT, output); console.error(`wrote ${batch.length} operators to ${OUT} (${done.size} done, ${eligible.length} remaining for ${CATEGORY})`); }
else process.stdout.write(output);

function keyOf(r) { return r.place_id || `name:${r.name}`; }

function countOutcomes(rows) {
  const counts = { extracted: 0, category_not_found: 0, needs_review: 0, other: 0 };
  for (const row of rows) {
    if (row?.outcome in counts) counts[row.outcome]++;
    else counts.other++;
  }
  return counts;
}

function formatOutcomeCounts(counts) {
  const parts = [
    `${counts.extracted} extracted`,
    `${counts.category_not_found} category_not_found`,
    `${counts.needs_review} needs_review`,
  ];
  if (counts.other) parts.push(`${counts.other} other`);
  return parts.join(", ");
}
