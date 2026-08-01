#!/usr/bin/env node
// Pass B — QA / CALIBRATION REPORT (read-only).
//
//   node supabase/seed/pass_b_report.mjs [--category snow_sports]
//
// Summarizes pass_b_<category>_results.json so the calibration step in PASS_B_RUNBOOK.md is
// mechanical: outcome counts, items-per-operator, subcategory / gear_type / attribute
// histograms, price-tier coverage, and QA flags (all-price-null operators, unresolved
// needs_review). Run it after the first (calibration) batch to diff actual attribute usage
// against the category file's §2 vocabulary, and between waves to spot drift.

import fs from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PRICE_FIELDS } from "./pass_b_vocab.mjs";

const seedDir = dirname(fileURLToPath(import.meta.url));
const P = (f) => join(seedDir, f);

const args = process.argv.slice(2);
const valueAfter = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const CATEGORY = valueAfter("--category") || "snow_sports";

const file = P(`pass_b_${CATEGORY}_results.json`);
if (!fs.existsSync(file)) { console.error(`${file} not found — run pass_b_apply.mjs first.`); process.exit(1); }
const results = JSON.parse(fs.readFileSync(file, "utf8")).results || [];
if (!results.length) { console.error("results file is empty"); process.exit(1); }

const bump = (map, key) => map.set(key, (map.get(key) || 0) + 1);
const printHist = (title, map, total) => {
  console.log(`\n${title}`);
  for (const [k, v] of [...map.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(v).padStart(4)}  ${k}${total ? `  (${Math.round((100 * v) / total)}%)` : ""}`);
  }
};

const outcomes = new Map();
const subcats = new Map();
const gearTypes = new Map();
const attrKeys = new Map();
const attrVals = new Map();
const activities = new Map();
const priceCover = new Map(); // tier -> count of items carrying it
const itemsPerOp = [];
const allNullPriceOps = [];
const needsReviewOps = [];
// Shared with the applier via pass_b_vocab.mjs — do not re-declare a local copy here.

let totalItems = 0, demoFlagged = 0, leaseFlagged = 0, addonCount = 0;
for (const r of results) {
  bump(outcomes, r.outcome);
  if (r.outcome === "needs_review") needsReviewOps.push(`${r.name} — ${r.note}`);
  for (const a of r.activities || []) bump(activities, a);
  if (r.offers_demo) demoFlagged++;
  if (r.offers_season_lease) leaseFlagged++;
  const items = r.items || [];
  if (r.outcome === "extracted") {
    itemsPerOp.push(items.length);
    if (items.length && items.every((it) => PRICE_FIELDS.every((pf) => it[pf] == null))) allNullPriceOps.push(r.name);
  }
  for (const it of items) {
    totalItems++;
    bump(subcats, it.subcategory);
    addonCount += (it.addons || []).length;
    for (const [k, v] of Object.entries(it.attributes || {})) {
      bump(attrKeys, k);
      if (k === "gear_type") bump(gearTypes, v);
      else if (typeof v !== "boolean") bump(attrVals, `${k}=${v}`);
      else if (v === true) bump(attrVals, `${k}=true`);
    }
    for (const pf of PRICE_FIELDS) if (it[pf] != null) bump(priceCover, pf);
  }
}

console.log(`PASS B REPORT — ${CATEGORY} (${results.length} operators logged, ${totalItems} items)`);
printHist("Outcomes:", outcomes, results.length);
if (itemsPerOp.length) {
  const sorted = [...itemsPerOp].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  console.log(`\nItems per extracted operator: min ${sorted[0]}, median ${median}, max ${sorted[sorted.length - 1]}`);
}
printHist("Subcategories (items):", subcats, totalItems);
printHist("gear_type (items):", gearTypes, totalItems);
printHist("Attribute keys used (items):", attrKeys, totalItems);
printHist("Attribute values (non-gear_type):", attrVals);
printHist("Price-tier coverage (items carrying the tier):", priceCover, totalItems);
printHist("Derived activities (operators):", activities, results.length);
console.log(`\nOperator flags: offers_demo ${demoFlagged}, offers_season_lease ${leaseFlagged}; addons recorded: ${addonCount}`);

if (allNullPriceOps.length) {
  console.log(`\n⚠ Extracted operators with NO price on any item (${allNullPriceOps.length}) — verify prices truly aren't published:`);
  for (const n of allNullPriceOps) console.log("  - " + n);
}
if (needsReviewOps.length) {
  console.log(`\n⚠ Unresolved needs_review (${needsReviewOps.length}):`);
  for (const n of needsReviewOps) console.log("  - " + n);
}
