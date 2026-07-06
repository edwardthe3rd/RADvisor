#!/usr/bin/env node
// Pass A / Stage 2 — TRIAGE VERDICT APPLIER (mechanical validation + append).
//
//   node supabase/seed/triage_apply.mjs <verdicts.json> [--dry-run]
//
// Validates an LLM's triage verdicts and merges them into sweep_pass_a_triage.json (dedupe by
// place_id / name; existing entries are updated in place). Rejects malformed verdicts so a weaker
// model cannot silently corrupt the output. <verdicts.json> may be a bare array or { results: [...] }.
//
// NOTE: this is Pass A Stage 2 (triage), NOT Pass B deep inventory extraction (§6).

import fs from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const seedDir = dirname(fileURLToPath(import.meta.url));
const P = (f) => join(seedDir, f);
const read = (f) => JSON.parse(fs.readFileSync(P(f), "utf8"));

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const file = args.find((a) => !a.startsWith("--"));
if (!file) { console.error("usage: node triage_apply.mjs <verdicts.json> [--dry-run]"); process.exit(1); }

const VALID_CATEGORIES = new Set([
  "snow_sports", "mountain_biking", "road_cycling", "burning_man_bikes", "water_sports",
  "camping", "camping_vehicles", "off_road", "motorcycles", "rock_climbing", "mountaineering",
  "hunting", "fishing", "disc_golf", "electric_transport", "uncategorized",
]);
const VALID_STATUS = new Set(["triaged", "no_rentals", "out_of_scope", "needs_review"]);

const raw = JSON.parse(fs.readFileSync(file, "utf8"));
const incoming = Array.isArray(raw) ? raw : raw.results || [];

const evidence = read("sweep_pass_a_evidence.json").results || [];
const evByKey = new Map();
for (const r of evidence) evByKey.set(r.place_id || `name:${r.name}`, r);
const evByName = new Map();
const evByNameNoPlace = new Map();
for (const r of evidence) {
  if (!evByName.has(r.name)) evByName.set(r.name, r);
  if (!r.place_id && !evByNameNoPlace.has(r.name)) evByNameNoPlace.set(r.name, r);
}

const triage = fs.existsSync(P("sweep_pass_a_triage.json"))
  ? read("sweep_pass_a_triage.json")
  : { stage: "2 - LLM triage judgment from Stage 1 evidence plus live website review", source: "supabase/seed/sweep_pass_a_evidence.json", results: [] };
triage.results = triage.results || [];
const idx = new Map(triage.results.map((r, i) => [r.place_id || `name:${r.name}`, i]));

const errors = [];
const clean = [];
incoming.forEach((v, n) => {
  const where = `verdict #${n + 1} (${v.name || v.place_id || "?"})`;
  // Resolve the evidence row this verdict refers to.
  const ev = (v.place_id && evByKey.get(v.place_id)) || (!v.place_id && v.name && evByNameNoPlace.get(v.name)) || (v.name && evByName.get(v.name)) || null;
  if (!ev) { errors.push(`${where}: no matching operator in evidence (check place_id/name)`); return; }
  if (typeof v.rents_gear !== "boolean") { errors.push(`${where}: rents_gear must be true/false`); return; }
  if (!VALID_STATUS.has(v.status)) { errors.push(`${where}: status "${v.status}" not in ${[...VALID_STATUS].join("/")}`); return; }
  const cats = Array.isArray(v.categories) ? v.categories : [];
  const badCats = cats.filter((c) => !VALID_CATEGORIES.has(c));
  if (badCats.length) { errors.push(`${where}: invalid category slug(s): ${badCats.join(", ")}`); return; }
  const reviewCats = Array.isArray(v.review_categories) ? v.review_categories : [];
  const badReview = reviewCats.filter((c) => !VALID_CATEGORIES.has(c));
  if (badReview.length) { errors.push(`${where}: invalid review_categories slug(s): ${badReview.join(", ")}`); return; }
  // Consistency checks (enforced to keep the funnel auditable).
  if (v.status === "triaged" && (!v.rents_gear || cats.length === 0)) { errors.push(`${where}: status triaged requires rents_gear=true AND >=1 category`); return; }
  if (v.status === "no_rentals" && v.rents_gear) { errors.push(`${where}: no_rentals requires rents_gear=false`); return; }
  if (v.status === "out_of_scope" && !v.rents_gear) { errors.push(`${where}: out_of_scope requires rents_gear=true (rents, but nothing in-domain)`); return; }
  if (v.status === "triaged" && !(v.evidence_snippet && (v.rental_page_urls?.length || v.checked_urls?.length))) {
    errors.push(`${where}: triaged requires an evidence_snippet and at least one rental_page_urls/checked_urls entry (positive-evidence rule)`); return;
  }
  clean.push({
    rank: ev.rank ?? null,
    source: ev.source || "sweep",
    place_id: ev.place_id || null,
    name: ev.name,
    website: ev.website || null,
    rents_gear: v.rents_gear,
    categories: cats,
    review_categories: reviewCats, // suspected-but-unconfirmed; Pass B should verify these too
    rental_page_urls: v.rental_page_urls || [],
    checked_urls: v.checked_urls || [],
    evidence_snippet: v.evidence_snippet || "",
    status: v.status,
    confidence: v.confidence || "medium",
    note: v.note || "",
    triaged_at: new Date().toISOString().slice(0, 10),
  });
});

if (errors.length) {
  console.error(`REJECTED — ${errors.length} verdict(s) invalid (nothing written):`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}

let added = 0, updated = 0;
for (const c of clean) {
  const k = c.place_id || `name:${c.name}`;
  if (idx.has(k)) { triage.results[idx.get(k)] = c; updated++; }
  else { idx.set(k, triage.results.length); triage.results.push(c); added++; }
}
triage.results.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
triage.ranAt = new Date().toISOString();
triage.count = triage.results.length;

const review = clean.filter((c) => c.review_categories.length).length;
const summary = `applied ${clean.length} verdict(s): ${added} new, ${updated} updated → ${triage.count} total triaged of ${evidence.length}.${review ? ` ${review} carry review_categories for Pass B to verify.` : ""}`;
if (DRY) { console.log("[dry-run] " + summary + " (nothing written)"); }
else { fs.writeFileSync(P("sweep_pass_a_triage.json"), JSON.stringify(triage, null, 2) + "\n"); console.log(summary); }
