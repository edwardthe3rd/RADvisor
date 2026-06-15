/**
 * Validate the intake classifier against the live DB labels.
 *
 *   node supabase/seed/verify/intake/validate.mjs [--errors]
 *
 * Segments operators into:
 *   active            — kept rental operators (should be keep/review, never reject)
 *   non_rental_deact  — deactivated as not-a-rental (should be reject/review, never keep)
 *   other_inactive    — deactivated for geography/duplicate/etc. (informational only)
 *
 * Prints a confusion matrix + the misclassifications to drive tuning. Pass
 * --errors to list every wrong call.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyOperator } from "./classify.mjs";

const intakeDir = dirname(fileURLToPath(import.meta.url));
const ds = JSON.parse(readFileSync(join(intakeDir, "dataset.json"), "utf8")).rows;
const ops = JSON.parse(readFileSync(join(intakeDir, "../../operators.json"), "utf8"));
const notes = Object.fromEntries(ops.map((o) => [o.slug, o.notes_internal || ""]));
const showErrors = process.argv.includes("--errors");

const NEG_RE = /deactivated —|founder review|duplicate of|business closed/i;
function segment(r) {
  if (r.is_active) return "active";
  return NEG_RE.test(notes[r.slug] || "") ? "non_rental_deact" : "other_inactive";
}

const tally = {
  active: { keep: 0, review: 0, reject: 0 },
  non_rental_deact: { keep: 0, review: 0, reject: 0 },
  other_inactive: { keep: 0, review: 0, reject: 0 },
};
const errors = { falseReject: [], falseKeep: [] };

for (const r of ds) {
  const seg = segment(r);
  const c = classifyOperator(r);
  tally[seg][c.decision]++;
  // active wrongly rejected = false reject; negative wrongly kept = false keep
  if (seg === "active" && c.decision === "reject")
    errors.falseReject.push(`${r.slug} :: ${c.reason}`);
  if (seg === "non_rental_deact" && c.decision === "keep")
    errors.falseKeep.push(`${r.slug} :: ${c.reason}`);
}

function pct(n, d) {
  return d ? `${((100 * n) / d).toFixed(0)}%` : "—";
}
function row(seg) {
  const t = tally[seg];
  const tot = t.keep + t.review + t.reject;
  return `${seg.padEnd(18)} keep=${String(t.keep).padStart(3)} review=${String(t.review).padStart(3)} reject=${String(t.reject).padStart(3)}  (n=${tot})`;
}

console.log("=== Intake classifier vs live DB ===\n");
console.log(row("active"));
console.log(row("non_rental_deact"));
console.log(row("other_inactive"));

const a = tally.active, n = tally.non_rental_deact;
console.log("\n--- Key metrics ---");
console.log(`Active wrongly REJECTED (false reject): ${a.reject}/${a.keep + a.review + a.reject} (${pct(a.reject, a.keep + a.review + a.reject)})`);
console.log(`Non-rental wrongly KEPT (false keep):   ${n.keep}/${n.keep + n.review + n.reject} (${pct(n.keep, n.keep + n.review + n.reject)})`);
console.log(`Active auto-kept (no review needed):    ${a.keep}/${a.keep + a.review + a.reject} (${pct(a.keep, a.keep + a.review + a.reject)})`);
console.log(`Non-rental auto-rejected:               ${n.reject}/${n.keep + n.review + n.reject} (${pct(n.reject, n.keep + n.review + n.reject)})`);
const reviewLoad = a.review + n.review + tally.other_inactive.review;
console.log(`Total routed to review:                 ${reviewLoad}/${ds.length} (${pct(reviewLoad, ds.length)})`);

// --- Category accuracy: for active ops with DB categories, compare the
// classifier's anchored categories to the DB categories. ---
let extra = 0, missing = 0, opsExtra = 0, opsExact = 0;
const bleed = {};
const activeLabeled = ds.filter((r) => r.is_active && r.categories.length);
for (const r of activeLabeled) {
  const det = new Set(classifyOperator(r).categories);
  const db = new Set(r.categories);
  const ex = [...det].filter((c) => !db.has(c));
  const mi = [...db].filter((c) => !det.has(c));
  extra += ex.length;
  missing += mi.length;
  if (ex.length) opsExtra++;
  if (ex.length === 0 && mi.length === 0) opsExact++;
  ex.forEach((c) => (bleed[c] = (bleed[c] || 0) + 1));
}
// Usefulness metric: among KEPT operators, do we suggest at least one correct
// category (a usable head-start), and how many get no category at all?
let keptAnyCorrect = 0, keptEmpty = 0, keptLabeled = 0;
for (const r of activeLabeled) {
  const v = classifyOperator(r);
  if (v.decision !== "keep") continue;
  keptLabeled++;
  const det = new Set(v.categories);
  if (!det.size) keptEmpty++;
  else if (r.categories.some((c) => det.has(c))) keptAnyCorrect++;
}
console.log("\n--- Category accuracy (active ops vs DB categories) ---");
console.log(`Exact category match: ${opsExact}/${activeLabeled.length} (${pct(opsExact, activeLabeled.length)})`);
console.log(`Ops with >=1 FALSE category: ${opsExtra}/${activeLabeled.length} (${pct(opsExtra, activeLabeled.length)})`);
console.log(`Total false categories: ${extra} | total missing: ${missing}`);
console.log(`Among KEPT operators: >=1 correct category ${keptAnyCorrect}/${keptLabeled} (${pct(keptAnyCorrect, keptLabeled)}), no category ${keptEmpty}/${keptLabeled} (${pct(keptEmpty, keptLabeled)})`);
if (Object.keys(bleed).length)
  console.log("False categories: " + Object.entries(bleed).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c}=${n}`).join(", "));

if (showErrors) {
  console.log(`\n--- FALSE REJECTS (active marked reject) [${errors.falseReject.length}] ---`);
  errors.falseReject.forEach((e) => console.log("  " + e));
  console.log(`\n--- FALSE KEEPS (non-rental marked keep) [${errors.falseKeep.length}] ---`);
  errors.falseKeep.forEach((e) => console.log("  " + e));
}
