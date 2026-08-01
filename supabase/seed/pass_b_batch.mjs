#!/usr/bin/env node
// Pass B — OPERATOR-MAJOR DEEP-EXTRACTION BATCH EMITTER (mechanical, no judgment).
//
//   node supabase/seed/pass_b_batch.mjs [N] [--out FILE] [--data-dir DIR]
//
// Emits the next N triaged operators that have not completed one whole-site Pass B visit.
// Pass A categories/review_categories are inclusive hints, never a filter or permission gate.
// Before any real batch can emit, every in-scope category must have a locked extraction file
// and CATEGORY_VOCAB entry so a same-visit discovery can always be captured immediately.

import fs from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CATEGORY_VOCAB,
  PASS_B_CATEGORIES,
  isPassBReady,
  lockedCategories,
  vocabReadiness,
} from "./pass_b_vocab.mjs";

// A calibration pilot is deliberately small: it exists to validate the attribute format on real
// operators BEFORE the remaining category files are authored, not to produce bulk output.
const PILOT_MAX = 12;

const seedDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(seedDir, "../..");
const args = process.argv.slice(2);
const valueAfter = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const consumed = new Set([valueAfter("--out"), valueAfter("--data-dir")].filter(Boolean));
const N = Number(args.find((a) => /^\d+$/.test(a) && !consumed.has(a)) || 10);
const OUT = valueAfter("--out");
const dataDir = valueAfter("--data-dir") || seedDir;
const P = (f) => join(dataDir, f);
const read = (f) => JSON.parse(fs.readFileSync(P(f), "utf8"));

const PILOT = args.includes("--pilot");
const REPAIR = args.includes("--repair");
const repairCategory = valueAfter("--category");

if (args.includes("--category") && !REPAIR) {
  console.error("Pass B is operator-major; --category only applies to a repair pass. Use --repair --category <slug> to re-extract one category for operators already visited.");
  process.exit(1);
}
if (REPAIR && !repairCategory) {
  console.error("--repair requires --category <slug>");
  process.exit(1);
}
if (PILOT && REPAIR) {
  console.error("--pilot and --repair are different workflows; run them separately");
  process.exit(1);
}
if (!Number.isInteger(N) || N < 1) {
  console.error("batch size must be a positive integer");
  process.exit(1);
}
if (PILOT && N > PILOT_MAX) {
  console.error(`--pilot is a calibration path, capped at ${PILOT_MAX} operators (asked for ${N}). Lock the remaining vocabularies and run the full gate for bulk extraction.`);
  process.exit(1);
}

const extractionDir = join(repoRoot, "instructions/extraction");
const readiness = vocabReadiness((category) =>
  fs.existsSync(join(extractionDir, `${category}.md`)),
);
const locked = lockedCategories();
if (REPAIR && !locked.includes(repairCategory)) {
  console.error(`--repair --category ${repairCategory}: that category has no locked vocabulary yet (locked: ${locked.join(", ") || "none"})`);
  process.exit(1);
}
if (!isPassBReady(readiness) && !PILOT && !REPAIR) {
  console.error("PASS B GLOBAL VOCAB GATE CLOSED — no operator batch emitted.");
  if (readiness.missing_vocab.length) {
    console.error(`Missing locked CATEGORY_VOCAB entries: ${readiness.missing_vocab.join(", ")}`);
  }
  if (readiness.missing_files.length) {
    console.error(`Missing extraction files: ${readiness.missing_files.join(", ")}`);
  }
  if (readiness.unexpected_vocab.length) {
    console.error(`Unexpected CATEGORY_VOCAB entries: ${readiness.unexpected_vocab.join(", ")}`);
  }
  console.error(`Locked now: ${Object.keys(CATEGORY_VOCAB).join(", ") || "none"}. Tags are untrusted, so all ${PASS_B_CATEGORIES.length} in-scope categories must be recordable before the first visit.`);
  process.exit(1);
}

// Extraction needs more page detail than triage did.
const PAGE_TEXT_CHARS = 4000;
const MAX_PAGES = 8;
const GOOGLE_TEXT_CHARS = 800;

const triage = read("sweep_pass_a_triage.json");
const evidence = read("sweep_pass_a_evidence.json").results || [];
const evByKey = new Map(evidence.map((r) => [keyOf(r), r]));

// Aggregate every category log. A logged needs_review counts as a completed visit outcome but
// remains visible in the unresolved total and prior-outcome lines.
const loggedByOperator = new Map();
let unresolvedReview = 0;
for (const category of PASS_B_CATEGORIES) {
  const resultsFile = `pass_b_${category}_results.json`;
  if (!fs.existsSync(P(resultsFile))) continue;
  const rows = read(resultsFile).results || [];
  for (const row of rows) {
    const key = row.key || keyOf(row);
    if (!loggedByOperator.has(key)) loggedByOperator.set(key, new Map());
    loggedByOperator.get(key).set(category, row);
    if (row.outcome === "needs_review") unresolvedReview++;
  }
}

const triaged = (triage.results || []).filter((r) => r.status === "triaged");
const withProgress = triaged.map((row) => {
  const key = keyOf(row);
  const prior = loggedByOperator.get(key) || new Map();
  const hints = [...new Set([...(row.categories || []), ...(row.review_categories || [])])];
  const pendingHints = hints.filter((category) =>
    prior.get(category)?.visit_mode !== "operator_at_once",
  );
  // A valid triaged row always has a hint. Keep a malformed zero-hint row eligible so the
  // operator is surfaced for correction instead of silently disappearing.
  const visitComplete = hints.length > 0 && pendingHints.length === 0;
  return { row, key, prior, hints, pendingHints, visitComplete };
});

// True queue state, measured BEFORE any pilot/repair narrowing so progress never misreports
// held-back operators as completed.
const outstanding = withProgress.filter((entry) => !entry.visitComplete);
const completedVisits = withProgress.length - outstanding.length;
let eligible = outstanding;
let skippedUnlocked = 0;
if (PILOT) {
  // Only operators whose every incoming hint is already extractable. Anything else would need a
  // vocabulary that does not exist yet, so its visit could not be completed in one pass.
  const lockedSet = new Set(locked);
  const before = eligible.length;
  eligible = eligible.filter((entry) => entry.hints.length > 0 && entry.hints.every((c) => lockedSet.has(c)));
  skippedUnlocked = before - eligible.length;
}
if (REPAIR) {
  // Only operators already logged for the target category — a repair re-extracts, it does not
  // discover. Ignore visitComplete: a completed visit is exactly what we are repairing.
  eligible = withProgress.filter((entry) => entry.prior.has(repairCategory));
}
const isAuto = (r) => /auto-triaged/i.test(r.note || "");
const tier = (r) => (isAuto(r) ? 2 : r.confidence === "high" ? 0 : 1);
eligible.sort((a, b) =>
  tier(a.row) - tier(b.row) || (a.row.rank ?? Infinity) - (b.row.rank ?? Infinity),
);
const batch = eligible.slice(0, N);

const trunc = (s, n, tail = false) => {
  s = String(s || "").replace(/\s+/g, " ").trim();
  if (s.length <= n) return s;
  return tail ? `…[truncated]${s.slice(-n)}` : `${s.slice(0, n)}…[truncated]`;
};

const lines = [];
if (PILOT) {
  lines.push(`# ⚠ PASS B CALIBRATION PILOT — NOT THE PRODUCTION RUN — BATCH OF ${batch.length}`);
  lines.push(`# The global vocab gate is BYPASSED. Locked categories: ${locked.join(", ")}.`);
  lines.push(`# Still unlocked: ${readiness.missing_vocab.filter((c) => !locked.includes(c)).join(", ") || "none"}.`);
  lines.push(`# Only operators whose every incoming hint is already locked are emitted`);
  lines.push(`#   (${skippedUnlocked} eligible operator(s) held back because they need an unlocked vocabulary).`);
  lines.push(`# If you discover a category with NO locked vocabulary, do NOT guess a schema for it:`);
  lines.push(`#   record it in self_heal_categories (it will be deferred and picked up later).`);
  lines.push(`# APPLY WITH:  node supabase/seed/pass_b_apply.mjs <results.json> --pilot`);
  lines.push(`#   --pilot stamps visit_mode:"pilot" so these operators are RE-VISITED in the full run`);
  lines.push(`#   (this visit could not see categories whose vocabulary did not exist yet).`);
  lines.push(`# Purpose: validate the attribute vocabulary against real sites BEFORE authoring the`);
  lines.push(`#   remaining category files. Feed findings back into the category docs, then re-lock.`);
} else if (REPAIR) {
  lines.push(`# PASS B REPAIR PASS — ${repairCategory} ONLY — BATCH OF ${batch.length}`);
  lines.push(`# These operators were already visited; re-extract ONLY ${repairCategory} (e.g. after a`);
  lines.push(`#   vocabulary revision). Do not re-derive the operator's other categories.`);
  lines.push(`# Return one result object per operator for ${repairCategory}; the applier upserts it.`);
} else {
  lines.push(`# PASS B — OPERATOR-AT-ONCE BATCH OF ${batch.length}`);
}
lines.push(`# Progress: ${completedVisits} completed operator visit(s), ${outstanding.length} operator visit(s) remaining, ${unresolvedReview} logged needs_review outcome(s).`);
if (PILOT) lines.push(`# Of those remaining, ${eligible.length} are pilot-eligible (all hints locked); ${skippedUnlocked} need an unlocked vocabulary.`);
if (REPAIR) lines.push(`# Repair scope: ${eligible.length} operator(s) already logged for ${repairCategory}.`);
lines.push(`# Read PASS_B_RUNBOOK.md + instructions/extraction/00_general.md before extracting.`);
lines.push(`# TAGS ARE HINTS, NOT GATES:`);
lines.push(`#  - Visit each operator once and inspect the whole live first-party site across all seasons.`);
lines.push(`#  - Verify every likely/review hint, but extract EVERY in-scope rental category you find.`);
lines.push(`#  - Return one normal result object per category found, even when it was not pre-tagged.`);
lines.push(`#  - Return category_not_found for disproved incoming hints. Missing tags are the expensive`);
lines.push(`#    error; over-tagging only costs a cheap verification during the visit.`);
lines.push(`#  - self_heal_categories is only for a known category with no locked vocabulary. The global`);
lines.push(`#    gate makes that exceptional; a locked discovery MUST be extracted in this visit.`);
lines.push(`# NON-NEGOTIABLES:`);
lines.push(`#  - Off-season is not category_not_found; use the most recent published seasonal data.`);
lines.push(`#  - Booking-platform storefronts are first-party inventory. Extract every distinct item.`);
lines.push(`#  - Unknown price is null, never 0. Never invent attribute keys. Every item needs source_url.`);
lines.push(`# Output a JSON array with one result object per category outcome, grouped by operator, then`);
lines.push(`# apply it with pass_b_apply.mjs. The applier validates each operator's combined final state.`);
lines.push("");

for (const { row: r, prior, hints, pendingHints } of batch) {
  const ev = evByKey.get(keyOf(r)) || null;
  lines.push(`### [rank ${r.rank}] ${r.name}`);
  lines.push(`place_id: ${r.place_id || "(none)"}`);
  lines.push(`website: ${r.website || "(none)"}`);
  lines.push(`likely_categories (hints only): ${(r.categories || []).join(", ") || "(none)"}`);
  lines.push(`review_categories (hints only): ${(r.review_categories || []).join(", ") || "(none)"}`);
  lines.push(`unlogged incoming hints: ${pendingHints.join(", ") || "(none — inspect full site; this row may need state repair)"}`);
  if (prior.size) {
    lines.push(`prior Pass B outcomes: ${[...prior.entries()].map(([category, result]) => `${category}=${result.outcome}${result.visit_mode === "operator_at_once" ? "" : " (legacy/partial)"}`).join(", ")}`);
  }
  if (!hints.length) lines.push(`⚠ TRIAGED WITH ZERO CATEGORY HINTS — inspect and return discovered categories or re-route the operator.`);
  lines.push(`triage_confidence: ${r.confidence}${isAuto(r) ? "   ⚠ AUTO-TRIAGED (tags were keyword-derived)" : ""}`);
  lines.push(`rental_page_urls: ${(r.rental_page_urls || []).join(" ") || "(none)"}`);
  if (r.evidence_snippet) lines.push(`triage_evidence: ${trunc(r.evidence_snippet, 500)}`);
  if (r.note) lines.push(`triage_note_tail: ${trunc(r.note, 600, true)}`);
  if (ev?.google_text) lines.push(`google_text: ${trunc(ev.google_text, GOOGLE_TEXT_CHARS)}`);
  const seen = new Set();
  const pages = (ev?.pages || [])
    .filter((p) => { if (!p?.url || seen.has(p.url)) return false; seen.add(p.url); return true; })
    .slice(0, MAX_PAGES);
  for (const p of pages) {
    lines.push(`--- page: ${p.url}`);
    lines.push(trunc(p.text, PAGE_TEXT_CHARS));
  }
  if ((ev?.pages || []).length > pages.length) {
    lines.push(`(+${(ev?.pages || []).length - pages.length} more cached pages not shown — browse the live site regardless)`);
  }
  const thin = !ev || !ev.reachable || (ev.pages_fetched || 0) <= 1 || seen.size <= 1;
  if (thin) lines.push(`⚠ THIN/PARTIAL CACHE (reachable:${ev ? ev.reachable : "no evidence row"}, distinct pages:${seen.size}). Browse live; cache absence proves nothing.`);
  lines.push("====");
  lines.push("");
}

const output = lines.join("\n");
if (OUT) {
  fs.writeFileSync(OUT, output);
  console.error(`wrote ${batch.length} operator visit(s) to ${OUT} (${completedVisits} complete, ${eligible.length} remaining)`);
} else {
  process.stdout.write(output);
}

function keyOf(r) { return r.place_id || `name:${r.name}`; }
