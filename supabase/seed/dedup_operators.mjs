#!/usr/bin/env node
// Merge duplicate operator rows in sweep_pass_a_triage.json.
//
//   node supabase/seed/dedup_operators.mjs [--apply] [--data-dir DIR]
//
// Dry-run by default. Written 2026-08-01 after the Phase 3 calibration wave surfaced 8
// duplicate-name groups (DEDUP_FINDING_2026-08-01.md) — mostly http/https/www normalisation
// failures that would each burn a redundant Pass B site visit and create a duplicate DB row.
//
// MERGE RULE (deliberately conservative — 00_general §9):
//   Two rows merge only when their normalised website key (host without scheme/`www.`, plus
//   pathname without trailing slash) is IDENTICAL *and* their normalised names match.
//
//   Keeping the PATH in the key is what protects the multi-location rule: clearlytahoe.com and
//   clearlytahoe.com/incline-village/ are different towns and stay separate operators.
//
//   Rows differing by domain (pedegoreno.com vs pedegoelectricbikes.com/dealers/reno) or missing
//   a website entirely (Tahoe XC) are REPORTED, never merged — those need a human.
//
// MERGE SEMANTICS: keep the survivor with a non-null place_id and the most evidence; take the
// UNION of categories[] and review_categories[] (recall-first — intersecting would silently drop
// snow_sports from Tahoe Adventure Rentals); concatenate distinct notes.

import fs from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const seedDir = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const valueAfter = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const APPLY = args.includes("--apply");
const dataDir = valueAfter("--data-dir") || seedDir;
const file = join(dataDir, "sweep_pass_a_triage.json");

const data = JSON.parse(fs.readFileSync(file, "utf8"));

const normName = (n) => String(n || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
function siteKey(website) {
  if (!website) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(website) ? website : `http://${website}`);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    const path = u.pathname.replace(/\/+$/, "");
    return host + path;
  } catch { return null; }
}

// Group only rows that can be keyed by site AND name.
const groups = new Map();
const unkeyed = [];
for (const row of data.results) {
  const key = siteKey(row.website);
  if (!key) { unkeyed.push(row); continue; }
  const k = `${key}||${normName(row.name)}`;
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(row);
}

const evidenceScore = (r) =>
  (r.place_id ? 1000 : 0) +
  (r.categories || []).length * 10 +
  (r.review_categories || []).length * 5 +
  String(r.note || "").length / 100;

const merges = [];
const mixedStatus = [];
for (const [k, rows] of groups) {
  if (rows.length < 2) continue;
  // Never merge across triage statuses. Every group in the 2026-08-01 queue was internally
  // consistent, but a triaged row swallowed into a no_rentals survivor (or vice versa) would
  // produce a row whose status contradicts its categories. That needs a human, not a heuristic.
  if (new Set(rows.map((r) => r.status)).size > 1) { mixedStatus.push(rows); continue; }
  const sorted = [...rows].sort((a, b) => evidenceScore(b) - evidenceScore(a));
  const [survivor, ...losers] = sorted;
  const cats = new Set(survivor.categories || []);
  const revs = new Set(survivor.review_categories || []);
  for (const l of losers) {
    for (const c of l.categories || []) cats.add(c);
    for (const c of l.review_categories || []) revs.add(c);
  }
  // A category confirmed on any row outranks a review flag on another.
  for (const c of cats) revs.delete(c);
  merges.push({ key: k, survivor, losers, cats: [...cats], revs: [...revs] });
}

console.log(`Duplicate groups merged by identical site key + name: ${merges.length}\n`);
for (const m of merges) {
  const gained = m.cats.filter((c) => !(m.survivor.categories || []).includes(c));
  console.log(`• ${m.survivor.name}  (${m.losers.length + 1} rows -> 1)`);
  console.log(`    keep   ${m.survivor.place_id || "(no place_id)"}  ${m.survivor.website}`);
  for (const l of m.losers) console.log(`    drop   ${l.place_id || "(no place_id)"}  ${l.website}`);
  console.log(`    categories: ${m.cats.join("+") || "(none)"}${gained.length ? `   [+${gained.join(",")} recovered from a dropped row]` : ""}`);
  if (m.revs.length) console.log(`    review:     ${m.revs.join("+")}`);
}

if (mixedStatus.length) {
  console.log(`\n⚠ Same site + name but DIFFERENT triage status — not merged, needs a human:`);
  for (const rows of mixedStatus) {
    console.log(`• ${rows[0].name}`);
    for (const r of rows) console.log(`    ${r.status.padEnd(12)} ${(r.categories || []).join("+") || "(no categories)"}`);
  }
}

// Report near-duplicates the rule deliberately will NOT merge.
const byName = new Map();
for (const row of data.results) {
  const n = normName(row.name);
  if (!byName.has(n)) byName.set(n, []);
  byName.get(n).push(row);
}
const merged = new Set(merges.flatMap((m) => [m.survivor, ...m.losers]));
const flagged = [...byName.values()].filter(
  (rows) => rows.length > 1 && rows.some((r) => !merged.has(r)),
);
if (flagged.length) {
  console.log(`\nSame name, NOT merged (need a human — different domain, missing website, or a genuine second location):`);
  for (const rows of flagged) {
    console.log(`• ${rows[0].name}`);
    for (const r of rows) console.log(`    ${r.status.padEnd(12)} ${r.place_id || "(no place_id)"}  ${r.website || "(no website)"}`);
  }
}

if (!merges.length) { console.log("\nNothing to merge."); process.exit(0); }

if (!APPLY) {
  console.log(`\n[dry-run] nothing written. Re-run with --apply to merge ${merges.length} group(s).`);
  process.exit(0);
}

const drop = new Set();
for (const m of merges) {
  m.survivor.categories = m.cats;
  m.survivor.review_categories = m.revs;
  const notes = [m.survivor.note, ...m.losers.map((l) => l.note)]
    .map((n) => String(n || "").trim())
    .filter(Boolean);
  const seen = new Set();
  const distinct = notes.filter((n) => (seen.has(n) ? false : (seen.add(n), true)));
  m.survivor.note = `${distinct.join(" | ")} | DEDUP 2026-08-01: merged ${m.losers.length} duplicate row(s) (${m.losers.map((l) => l.place_id || "no place_id").join(", ")}); categories are the union.`;
  for (const l of m.losers) drop.add(l);
}
const before = data.results.length;
data.results = data.results.filter((r) => !drop.has(r));
fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
console.log(`\napplied: ${before} -> ${data.results.length} rows (removed ${drop.size}).`);
