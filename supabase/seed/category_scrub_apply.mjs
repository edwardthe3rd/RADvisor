#!/usr/bin/env node
// Pass B preflight — category scrub verdict applier.
//
//   node supabase/seed/category_scrub_apply.mjs <verdicts.json> [--dry-run]
//
// Applies validated keep/review/remove decisions from category_scrub_batch.mjs to
// sweep_pass_a_triage.json. Only categories currently present in categories[] can be scrubbed.

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
const DRY = args.includes("--dry-run");
const file = args.find((a) => !a.startsWith("--"));
if (!file) {
  console.error("usage: node category_scrub_apply.mjs <verdicts.json> [--dry-run]");
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(file, "utf8"));
const incoming = Array.isArray(raw) ? raw : raw.results || [];
const triage = read("sweep_pass_a_triage.json");
triage.results = triage.results || [];
const idx = new Map(triage.results.map((r, i) => [keyOf(r), i]));

const errors = [];
const clean = [];
incoming.forEach((v, n) => {
  const where = `scrub verdict #${n + 1} (${v.name || v.place_id || "?"})`;
  const k = v.place_id || `name:${v.name}`;
  const rowIdx = idx.get(k);
  if (rowIdx === undefined) {
    errors.push(`${where}: no matching row in sweep_pass_a_triage.json`);
    return;
  }
  const row = triage.results[rowIdx];
  if (row.status !== "triaged") {
    errors.push(`${where}: only triaged rows can be category-scrubbed`);
    return;
  }
  if (!/auto-triaged/i.test(row.note || "")) {
    errors.push(`${where}: row is not marked auto-triaged; use normal triage review instead`);
    return;
  }

  const keep = arrayOfStrings(v.keep_categories);
  const review = arrayOfStrings(v.review_categories);
  const remove = arrayOfStrings(v.remove_categories);
  const all = [...keep, ...review, ...remove];
  const bad = all.filter((c) => !VALID_CATEGORIES.has(c));
  if (bad.length) {
    errors.push(`${where}: invalid category slug(s): ${bad.join(", ")}`);
    return;
  }
  const duplicateBuckets = all.filter((c, i) => all.indexOf(c) !== i);
  if (duplicateBuckets.length) {
    errors.push(`${where}: category appears in more than one decision bucket: ${[...new Set(duplicateBuckets)].join(", ")}`);
    return;
  }
  const current = new Set(row.categories || []);
  const notCurrent = all.filter((c) => !current.has(c));
  if (notCurrent.length) {
    errors.push(`${where}: can only scrub categories currently in categories[]: ${notCurrent.join(", ")}`);
    return;
  }
  if (!all.length) {
    errors.push(`${where}: must include at least one category decision`);
    return;
  }
  if (!v.note || String(v.note).trim().length < 8) {
    errors.push(`${where}: note must briefly explain the evidence basis`);
    return;
  }
  // Invariant guard: a scrub may never leave a triaged row with zero confirmed categories
  // (triage_apply enforces triaged => >=1 category; an emptied row can't be routed by Pass B).
  // Simulate the post-scrub state during validation so the whole batch rejects before any write.
  const resulting = new Set(row.categories || []);
  for (const c of review) resulting.delete(c);
  for (const c of remove) resulting.delete(c);
  for (const c of keep) resulting.add(c);
  if (resulting.size === 0) {
    errors.push(`${where}: scrub would leave a triaged row with zero confirmed categories — keep at least one, or re-route the operator through triage_apply.mjs with a full status verdict instead`);
    return;
  }
  clean.push({ rowIdx, key: keyOf(row), name: row.name, keep, review, remove, note: String(v.note).trim() });
});

if (errors.length) {
  console.error(`REJECTED - ${errors.length} scrub verdict(s) invalid (nothing written):`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}

let reviewed = 0;
let movedToReview = 0;
let removed = 0;
for (const v of clean) {
  const row = triage.results[v.rowIdx];
  const reviewSet = new Set(row.review_categories || []);
  const categorySet = new Set(row.categories || []);

  for (const c of v.review) {
    categorySet.delete(c);
    reviewSet.add(c);
    movedToReview++;
  }
  for (const c of v.remove) {
    categorySet.delete(c);
    reviewSet.delete(c);
    removed++;
  }
  for (const c of v.keep) {
    categorySet.add(c);
    reviewSet.delete(c);
  }

  row.categories = [...categorySet];
  row.review_categories = [...reviewSet];
  row.note = appendScrubNote(row.note, v);
  reviewed += v.keep.length + v.review.length + v.remove.length;
}

triage.categoryScrub = triage.categoryScrub || { applied: [] };
const today = new Date().toISOString().slice(0, 10);
for (const v of clean) {
  for (const category of [...v.keep, ...v.review, ...v.remove]) {
    triage.categoryScrub.applied.push({
      key: v.key,
      name: v.name,
      category,
      decision: v.keep.includes(category) ? "keep" : v.review.includes(category) ? "review" : "remove",
      note: v.note,
      scrubbed_at: today,
    });
  }
}
triage.categoryScrub.updatedAt = new Date().toISOString();

const summary = `category scrubbed ${reviewed} category decision(s): ${movedToReview} moved to review, ${removed} removed`;
if (DRY) {
  console.log("[dry-run] " + summary + " (nothing written)");
} else {
  fs.writeFileSync(P("sweep_pass_a_triage.json"), JSON.stringify(triage, null, 2) + "\n");
  console.log(summary);
}

function keyOf(r) {
  return r.place_id || `name:${r.name}`;
}

function arrayOfStrings(v) {
  return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
}

function appendScrubNote(note, verdict) {
  const pieces = [];
  if (verdict.keep.length) pieces.push(`kept ${verdict.keep.join("/")}`);
  if (verdict.review.length) pieces.push(`moved ${verdict.review.join("/")} to review`);
  if (verdict.remove.length) pieces.push(`removed ${verdict.remove.join("/")}`);
  return `${note || ""} Category scrub: ${pieces.join(", ")} - ${verdict.note}`.trim();
}
