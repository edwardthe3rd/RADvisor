#!/usr/bin/env node
// Pass A / Stage 2 — TRIAGE BATCH EMITTER (mechanical, no judgment).
//
//   node supabase/seed/triage_batch.mjs [N] [--source original|sweep] [--out FILE]
//
// Prints the next N operators that still need triage (not yet in sweep_pass_a_triage.json),
// ordered by rank (originals 1-233 first, then sweep), with their Stage-1 evidence trimmed to a
// token-economical size. Feed the output to ANY capable LLM together with TRIAGE_RUNBOOK.md; the
// LLM returns verdict JSON, which you apply with triage_apply.mjs. Default N = 25.
//
// NOTE: this is Pass A Stage 2 (the rents-gear / categories triage → sweep_pass_a_triage.json),
// NOT Pass B deep inventory extraction (§6).

import fs from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const seedDir = dirname(fileURLToPath(import.meta.url));
const P = (f) => join(seedDir, f);
const read = (f) => JSON.parse(fs.readFileSync(P(f), "utf8"));

const args = process.argv.slice(2);
const valueAfter = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const N = Number(args.find((a) => /^\d+$/.test(a)) || 25);
const SOURCE = valueAfter("--source"); // optional: "original" | "sweep"
const OUT = valueAfter("--out");

const GOOGLE_TEXT_CHARS = 1200;
// Budget raised (was 1500 / 3 pages): rental pages often sit past the homepage (e.g. /bike-rentals/,
// /gear-rentals), so a tight window hid them and drove false no_rentals verdicts. Show more, deduped.
const PAGE_TEXT_CHARS = 2600;
const MAX_PAGES = 6;

const evidence = read("sweep_pass_a_evidence.json").results || [];
const triage = fs.existsSync(P("sweep_pass_a_triage.json")) ? read("sweep_pass_a_triage.json") : { results: [] };

// A verdict's identity key: place_id when present, else the operator name (stable, unique here).
const keyOf = (r) => r.place_id || `name:${r.name}`;
const done = new Set((triage.results || []).map(keyOf));

let pending = evidence.filter((r) => !done.has(keyOf(r)));
if (SOURCE) pending = pending.filter((r) => (r.source || "sweep") === SOURCE);
pending.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
const batch = pending.slice(0, N);

const trunc = (s, n) => { s = (s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n) + "…[truncated]" : s; };

const lines = [];
lines.push(`# PASS A / STAGE 2 — TRIAGE BATCH OF ${batch.length} OPERATORS`);
lines.push(`# Progress: ${done.size} triaged, ${pending.length} remaining${SOURCE ? ` (source=${SOURCE})` : ""}, ${evidence.length} total.`);
lines.push(`# Read TRIAGE_RUNBOOK.md for the rubric, category slugs, output schema, and examples.`);
lines.push(`# For each operator below, emit ONE verdict object. Browse the website live for any`);
lines.push(`# ambiguous or unreachable case before deciding.`);
lines.push(`# CATEGORY RECALL IS CRITICAL: list EVERY activity the operator rents in categories[],`);
lines.push(`#   not just the obvious one (watch for seasonal/second activities). A category you omit`);
lines.push(`#   is never extracted by Pass B. If unsure about a second activity, add it to`);
lines.push(`#   review_categories[] — never silently drop it.`);
lines.push(`# THIN-FETCH RULE: for any operator flagged "⚠ THIN/PARTIAL FETCH" below (unreachable or ≤1`);
lines.push(`#   distinct page), missing rental wording is NOT evidence of no rentals. Browse the site`);
lines.push(`#   live, or return needs_review — never emit a confident no_rentals from a thin snapshot.`);
lines.push(`# Output a JSON array of verdicts, then apply with:`);
lines.push(`#   node supabase/seed/triage_apply.mjs <your-verdicts.json>`);
lines.push("");

for (const r of batch) {
  lines.push(`### [rank ${r.rank}] ${r.name}   (source: ${r.source || "sweep"})`);
  lines.push(`place_id: ${r.place_id || "(none)"}`);
  lines.push(`website: ${r.website || "(none)"}`);
  lines.push(`reachable: ${r.reachable}   pages_fetched: ${r.pages_fetched}`);
  if (r.google_overview) lines.push(`google_overview: ${trunc(r.google_overview, 400)}`);
  if (r.google_text) lines.push(`google_text: ${trunc(r.google_text, GOOGLE_TEXT_CHARS)}`);
  // Dedupe pages by URL (some fetches capture the same homepage N times) so the budget shows
  // distinct pages, and flag thin/partial snapshots that can't disprove rentals.
  const distinctUrls = new Set((r.pages || []).map((p) => p.url));
  const thin = !r.reachable || (r.pages_fetched || 0) <= 1 || distinctUrls.size <= 1;
  const seenUrls = new Set();
  const pages = (r.pages || []).filter((p) => { if (seenUrls.has(p.url)) return false; seenUrls.add(p.url); return true; }).slice(0, MAX_PAGES);
  for (const p of pages) {
    lines.push(`--- page: ${p.url}`);
    lines.push(trunc(p.text, PAGE_TEXT_CHARS));
  }
  if (distinctUrls.size > MAX_PAGES) lines.push(`(+${distinctUrls.size - MAX_PAGES} more pages not shown — browse the site live if needed)`);
  if (thin) lines.push(`⚠ THIN/PARTIAL FETCH (reachable:${r.reachable}, distinct pages:${distinctUrls.size}, pages_fetched:${r.pages_fetched}). Absence of rental wording above is NOT proof of no rentals — browse live (or search "${r.name}" + "rentals"/"demo"); if unconfirmed, return needs_review, never a guessed no_rentals.`);
  lines.push("====");
  lines.push("");
}

const output = lines.join("\n");
if (OUT) { fs.writeFileSync(OUT, output); console.error(`wrote ${batch.length} operators to ${OUT} (${done.size} done, ${pending.length} remaining)`); }
else process.stdout.write(output);
