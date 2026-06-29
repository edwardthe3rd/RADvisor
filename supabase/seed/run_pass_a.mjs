#!/usr/bin/env node
// Pass A — Stage 1 evidence gatherer, per instructions/extraction/00_general.md §5.1.
//
// MECHANICAL ONLY — makes NO claims. For each Gate 5 survivor it fetches the homepage,
// the rental/demo/lease/Services/Shop/Pricing pages linked from it, and the Google Places
// summary, and records the raw text + links as an evidence bundle. It deliberately does
// NOT assign categories, guess rents-gear, or emit a "rental cue": per §5.1 any such guess
// anchors and misguides the Stage-2 judge (keyword detection can't tell a guided fishing
// charter that says "boat rentals nearby" from an actual rental operator). The Stage-2 LLM
// reads this bundle AND browses live, then makes the §5 verdict.
//
//   node supabase/seed/run_pass_a.mjs [--limit N] [--refresh] [--no-google]
//
// Reads sweep_gate_results.json (survivor_queue). Writes:
//   sweep_pass_a_evidence.json     raw per-operator evidence bundles (Stage-2 input)
//   sweep_pass_a_queue.csv         neutral checklist (operator, website, pages, reachable)
//   pass_a_evidence_cache.json     resumable cache keyed by place_id

import fs from "node:fs";
import { join } from "node:path";
import { seedDir, loadApiKey, fetchPlace, collectGoogleText, fetchWebsiteEvidence, pool } from "./verify/lib.mjs";

// run_pass_a.mjs --with-originals prepends the prioritized originals from pass_a_originals.json
// (built by build_pass_a_originals.mjs) ahead of the sweep survivors, re-ranking originals first.

const args = process.argv.slice(2);
const hasFlag = (f) => args.includes(f);
const valueAfter = (f) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : null;
};
const LIMIT = Number(valueAfter("--limit") || Infinity);
const REFRESH = hasFlag("--refresh");
const USE_GOOGLE = !hasFlag("--no-google");
const WITH_ORIGINALS = hasFlag("--with-originals");
const CACHE_VERSION = 3; // bumped: output is now a claim-free evidence bundle
const MAX_PAGE_CHARS = 8000;

const P = (f) => join(seedDir, f);
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const exists = (p) => fs.existsSync(p);
const normDomain = (url) => {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
};

const csvCell = (v) => {
  if (v === null || v === undefined) return "";
  const s = Array.isArray(v) ? v.join("; ") : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const CSV_COLS = ["rank", "source", "name", "website", "reachable", "pages_fetched", "place_id"];
const writeCsv = (file, rows) => {
  const lines = [CSV_COLS.join(",")];
  for (const r of rows) lines.push(CSV_COLS.map((c) => csvCell(r[c])).join(","));
  fs.writeFileSync(P(file), lines.join("\n") + "\n");
};

const gate = read(P("sweep_gate_results.json"));
let survivors = gate.survivor_queue || (gate.results || []).filter((r) => r.status === "survivor");
survivors = survivors
  .slice()
  .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity))
  .map((r) => ({ ...r, source: r.source || "sweep" }));

// --with-originals: prepend the prioritized originals (pass_a_originals.json) ahead of the
// sweep survivors so they are gathered/triaged first, then re-rank the combined list 1..N.
if (WITH_ORIGINALS) {
  if (!exists(P("pass_a_originals.json"))) {
    console.error("error: --with-originals set but pass_a_originals.json missing. Run build_pass_a_originals.mjs first.");
    process.exit(1);
  }
  const originals = read(P("pass_a_originals.json")).rows || [];
  const have = new Set(survivors.map((s) => s.place_id).filter(Boolean));
  const newOriginals = originals.filter((o) => !o.place_id || !have.has(o.place_id));
  survivors = [...newOriginals, ...survivors];
  console.log(`--with-originals: prepended ${newOriginals.length} originals (of ${originals.length}) ahead of ${survivors.length - newOriginals.length} sweep survivors.`);
}

survivors = survivors
  .map((r, i) => ({ ...r, rank: i + 1 }))
  .slice(0, LIMIT);

const gate5Cache = exists(P("sweep_gate5_cache.json")) ? read(P("sweep_gate5_cache.json")) : {};
const cacheRaw = !REFRESH && exists(P("pass_a_evidence_cache.json")) ? read(P("pass_a_evidence_cache.json")) : {};
const cache = cacheRaw.__schema === CACHE_VERSION ? cacheRaw : { __schema: CACHE_VERSION };
cache.__schema = CACHE_VERSION;

const apiKey = USE_GOOGLE ? loadApiKey() : null;
if (USE_GOOGLE && !apiKey) console.warn("warn: GOOGLE_PLACES_API_KEY not found — website-only evidence.");

let completed = 0;
const flush = () => fs.writeFileSync(P("pass_a_evidence_cache.json"), JSON.stringify(cache, null, 2) + "\n");

async function gather(row) {
  const placeId = row.place_id;
  // Cache holds the gathered evidence (keyed by place_id), but rank/source are per-run
  // (re-ranking with --with-originals shifts them), so overlay the current row's values.
  if (!REFRESH && placeId && cache[placeId]) {
    return { ...cache[placeId], rank: row.rank ?? null, source: row.source || "sweep" };
  }

  let web = row.website
    ? await fetchWebsiteEvidence(row.website)
    : { text: "", pages: [], reachable: false };

  // Resilience only (a mechanical fact, not a claim): if the live fetch failed but Gate 5
  // already cached live text for this domain, reuse it so a transient failure isn't logged
  // as "unreachable."
  let usedCacheText = false;
  if (!web.reachable && row.website) {
    const dom = normDomain(row.final_url || row.website);
    const hit = dom && gate5Cache[dom];
    if (hit && hit.outcome === "live" && (hit.text || hit.meta)) {
      const t = `${hit.text || ""} ${hit.meta || ""}`.replace(/\s+/g, " ").trim();
      web = { text: t, pages: hit.final_url ? [{ url: hit.final_url, text: t }] : [], reachable: true };
      usedCacheText = true;
    }
  }

  let googleText = "";
  let googleOverview = "";
  if (apiKey && placeId) {
    const { place, error } = await fetchPlace(apiKey, placeId);
    if (!error && place) {
      const g = collectGoogleText(place);
      googleText = (g.all || "").slice(0, 4000);
      googleOverview = (g.overview || "").slice(0, 400);
    }
  }

  const out = {
    rank: row.rank ?? null,
    source: row.source || "sweep",
    place_id: placeId,
    name: row.name,
    website: row.website || null,
    reachable: web.reachable,
    pages_fetched: web.pages.length,
    // Raw gathered evidence for the Stage-2 judge — NO categories, cues, or verdicts.
    pages: web.pages.map((p) => ({ url: p.url, text: (p.text || "").slice(0, MAX_PAGE_CHARS) })),
    google_overview: googleOverview || null,
    google_text: googleText || null,
    used_cache_text: usedCacheText,
    gathered_at: new Date().toISOString().slice(0, 10),
  };

  if (placeId) {
    cache[placeId] = out;
    if (++completed % 10 === 0) flush();
  }
  return out;
}

console.log(`Pass A Stage 1 (evidence gather) over ${survivors.length} survivors…`);
const results = await pool(survivors, gather, 6, 120);
flush();

fs.writeFileSync(
  P("sweep_pass_a_evidence.json"),
  JSON.stringify(
    {
      ranAt: new Date().toISOString(),
      stage: "1 — gather only (no claims); the Stage-2 LLM judges per 00_general.md §5",
      source: "sweep_gate_results.json (survivor_queue)",
      count: results.length,
      reachable: results.filter((r) => r.reachable).length,
      needs_web_fallback: results.filter((r) => !r.reachable).length,
      results,
    },
    null,
    2,
  ) + "\n",
);
writeCsv("sweep_pass_a_queue.csv", results);

console.log("\n=== PASS A — STAGE 1 (gather, no claims) ===");
console.log(`survivors:          ${results.length}`);
console.log(`reachable:          ${results.filter((r) => r.reachable).length}`);
console.log(`needs web-fallback: ${results.filter((r) => !r.reachable).length}`);
console.log("wrote sweep_pass_a_evidence.json + sweep_pass_a_queue.csv");
console.log("Stage 2: an LLM judges each operator per 00_general.md §5.1/§5.2 (rents-gear, categories, evidence).");
