#!/usr/bin/env node
// Pass B preflight — category scrub batch emitter.
//
//   node supabase/seed/category_scrub_batch.mjs [N] [--category snow_sports] [--category road_cycling] [--out FILE]
//
// Emits auto-triaged rows whose target categories came from keyword matches rather than site
// reading. The reviewer decides whether each target category should stay confirmed, move to
// review_categories, or be removed before Pass B spends crawl time on it.

import fs from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const seedDir = dirname(fileURLToPath(import.meta.url));
const P = (f) => join(seedDir, f);
const read = (f) => JSON.parse(fs.readFileSync(P(f), "utf8"));

const VALID_CATEGORIES = new Set([
  "snow_sports", "mountain_biking", "road_cycling", "burning_man_bikes", "water_sports",
  "camping", "camping_vehicles", "off_road", "motorcycles", "rock_climbing", "mountaineering",
  "hunting", "fishing", "disc_golf", "electric_transport",
]);

const args = process.argv.slice(2);
const N = Number(args.find((a) => /^\d+$/.test(a)) || 25);
const OUT = valueAfter("--out");
const categories = valuesAfter("--category");
const TARGET_CATEGORIES = categories.length ? categories : ["snow_sports", "road_cycling"];

for (const c of TARGET_CATEGORIES) {
  if (!VALID_CATEGORIES.has(c)) {
    console.error(`invalid --category "${c}"`);
    process.exit(1);
  }
}

const triage = read("sweep_pass_a_triage.json");
const evidence = read("sweep_pass_a_evidence.json").results || [];
const evByKey = new Map(evidence.map((r) => [keyOf(r), r]));
const scrubbedKeys = new Set((triage.categoryScrub?.applied || []).map((r) => `${keyOf(r)}:${r.category}`));

const rows = (triage.results || [])
  .filter((r) => r.status === "triaged")
  .filter((r) => /auto-triaged/i.test(r.note || ""))
  .map((r) => {
    const currentTargets = (r.categories || []).filter((c) => TARGET_CATEGORIES.includes(c));
    const pendingTargets = currentTargets.filter((c) => !scrubbedKeys.has(`${keyOf(r)}:${c}`));
    return { row: r, currentTargets, pendingTargets, evidence: evByKey.get(keyOf(r)) || null };
  })
  .filter((r) => r.pendingTargets.length)
  .sort((a, b) => (a.row.rank ?? Infinity) - (b.row.rank ?? Infinity))
  .slice(0, N);

const lines = [];
lines.push(`# PASS B PREFLIGHT — CATEGORY SCRUB BATCH OF ${rows.length} OPERATORS`);
lines.push(`# Target categories: ${TARGET_CATEGORIES.join(", ")}`);
lines.push(`# Goal: before Pass B, demote keyword-inflated categories that were never confirmed by site reading.`);
lines.push(`# Decide only the target categories listed for each operator.`);
lines.push(`# Output JSON and apply with:`);
lines.push(`#   node supabase/seed/category_scrub_apply.mjs <your-scrub-verdicts.json>`);
lines.push("");
lines.push(`Schema per operator:`);
lines.push("```json");
lines.push(`{`);
lines.push(`  "place_id": "copy from batch, or null",`);
lines.push(`  "name": "Exact Operator Name",`);
lines.push(`  "keep_categories": ["snow_sports"],`);
lines.push(`  "review_categories": ["road_cycling"],`);
lines.push(`  "remove_categories": [],`);
lines.push(`  "note": "one-line evidence-based reason"`);
lines.push(`}`);
lines.push("```");
lines.push("");
lines.push(`Rules (recall beats precision — a wrongly removed category is unrecoverable):`);
lines.push(`- keep_categories = target categories with citable rental evidence for that activity.`);
lines.push(`- review_categories = target categories with a plausible signal but not enough evidence to`);
lines.push(`  confirm. THIS IS THE DEFAULT for a real gear operator whose slug is merely unconfirmed —`);
lines.push(`  Pass B still verifies review categories, so nothing is lost by parking one here.`);
lines.push(`- remove_categories = ONLY when the pairing is absurd on its face (no plausible connection`);
lines.push(`  between the business and the slug — a dessert shop tagged snow_sports). The evidence below`);
lines.push(`  is a CACHED snapshot: absence from a thin/partial fetch is NOT absence (the same trap that`);
lines.push(`  caused Pass A's false no_rentals). If unsure, browse live or use review — never remove.`);
lines.push(`- A scrub may not empty a row's categories[]: keep at least one, or send the operator through`);
lines.push(`  normal triage review (triage_apply.mjs) with a full status verdict instead.`);
lines.push(`- The same category may appear in exactly one of those three arrays.`);
lines.push(`- Do not add brand-new categories here; Pass B self-heal handles newly discovered categories.`);
lines.push("");

for (const { row, pendingTargets, evidence: ev } of rows) {
  const pages = distinctPages(ev?.pages || []).slice(0, 8);
  lines.push(`### [rank ${row.rank}] ${row.name}`);
  lines.push(`place_id: ${row.place_id || "(none)"}`);
  lines.push(`website: ${row.website || "(none)"}`);
  lines.push(`target_categories_to_scrub: ${pendingTargets.join(", ")}`);
  lines.push(`current_categories: ${(row.categories || []).join(", ") || "(none)"}`);
  lines.push(`current_review_categories: ${(row.review_categories || []).join(", ") || "(none)"}`);
  lines.push(`rental_page_urls: ${(row.rental_page_urls || []).join(" ") || "(none)"}`);
  lines.push(`checked_urls: ${(row.checked_urls || []).join(" ") || "(none)"}`);
  if (row.evidence_snippet) lines.push(`triage_evidence: ${trim(row.evidence_snippet, 1200)}`);
  if (row.note) lines.push(`triage_note: ${trim(row.note, 600)}`);
  if (ev?.google_overview) lines.push(`google_overview: ${trim(ev.google_overview, 500)}`);
  if (ev?.google_text) lines.push(`google_text: ${trim(ev.google_text, 1200)}`);
  for (const p of pages) {
    lines.push(`--- page: ${p.url}`);
    lines.push(trim(p.text, 1800));
  }
  if ((ev?.pages || []).length > pages.length) lines.push(`(+${(ev?.pages || []).length - pages.length} more fetched pages not shown)`);
  const distinct = new Set((ev?.pages || []).map((p) => p?.url).filter(Boolean));
  const thin = !ev || !ev.reachable || (ev.pages_fetched || 0) <= 1 || distinct.size <= 1;
  if (thin) lines.push(`⚠ THIN/PARTIAL FETCH (reachable:${ev ? ev.reachable : "no evidence row"}, distinct pages:${distinct.size}). Absence of the category above is NOT evidence it isn't rented — browse the site live before deciding; if still unsure, use review_categories, never remove.`);
  lines.push("====");
  lines.push("");
}

const output = lines.join("\n");
if (OUT) {
  fs.writeFileSync(OUT, output);
  console.error(`wrote ${rows.length} category-scrub rows to ${OUT}`);
} else {
  process.stdout.write(output);
}

function valueAfter(flag) {
  const idx = args.indexOf(flag);
  return idx >= 0 ? args[idx + 1] : null;
}

function valuesAfter(flag) {
  const vals = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === flag && args[i + 1]) vals.push(args[i + 1]);
  }
  return vals;
}

function keyOf(r) {
  return r.place_id || `name:${r.name}`;
}

function trim(s, n) {
  s = String(s || "").replace(/\s+/g, " ").trim();
  return s.length > n ? `${s.slice(0, n)}...[truncated]` : s;
}

function distinctPages(pages) {
  const seen = new Set();
  const out = [];
  for (const p of pages) {
    if (!p?.url || seen.has(p.url)) continue;
    seen.add(p.url);
    out.push(p);
  }
  return out;
}
