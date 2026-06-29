#!/usr/bin/env node
// Builder — produces pass_a_originals.json: the prioritized set of ORIGINAL operators to
// re-run from scratch through Pass A / Pass B, ahead of the quadtree sweep survivors.
//
//   node supabase/seed/build_pass_a_originals.mjs
//
// Target = active operators in operators.json that EITHER (a) were matched by the quadtree
// (gate-4 reverse dedup: name+location <=200 m OR shared website domain) OR (b) are in the
// explicit NAMED include-list (rentals the sweep dropped but we trust). This excludes the
// confirmed non-rental no-match originals. The set lands in an inspectable artifact with
// per-row provenance; run_pass_a.mjs --with-originals reads it and prepends it to the queue.

import fs from "node:fs";
import { join } from "node:path";
import { seedDir, extractPlaceId } from "./verify/lib.mjs";

const P = (f) => join(seedDir, f);
const read = (f) => JSON.parse(fs.readFileSync(P(f), "utf8"));

// Rentals the quadtree dropped (Google mis-typed / closed listing) but that we want re-run.
const NAMED = new Set([
  "Tahoe XC",
  "UTV Addiction",
  "The Biggest Little ATV/UTV Shop",
  "Tahoe Paradise Boat Rentals",
  "Tahoe Outdoor Adventures and Rentals",
]);

// --- compact dedup helpers (pure; mirror run_gate_ladder.mjs:111-159) ---------------------
const slugify = (s) =>
  (s || "").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
const normNameCompact = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const normNameWords = (s) =>
  (s || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
const normDomain = (url) => {
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return String(url).replace(/^https?:\/\//i, "").split("/")[0].toLowerCase().replace(/^www\./, "");
  }
};
const haversine = (a, b, c, d) => {
  const R = 6371000, t = Math.PI / 180;
  const dLat = (c - a) * t, dLng = (d - b) * t;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a * t) * Math.cos(c * t) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

// --- load inputs --------------------------------------------------------------------------
const oldOps = read("operators.json").filter((o) => o.is_active);
const sweepJson = read("quadtree_sweep_operators.json");

// Sweep candidate rows, same selection run_gate_ladder uses for its dedup input.
const sweepRows = [];
const seen = new Set();
const add = (items) => {
  for (const it of items || []) {
    const id = it.place_id || `${it.name}:${it.lat}:${it.lng}`;
    if (seen.has(id)) continue;
    seen.add(id);
    sweepRows.push(it);
  }
};
if (Array.isArray(sweepJson.gate_ladder_input_records)) {
  add(sweepJson.gate_ladder_input_records);
} else {
  add(sweepJson.operators);
  add(sweepJson.closed_records);
  add(sweepJson.lodging_excluded_records);
}

// Index sweep rows by domain and by name+location for cheap lookups.
const byDomain = new Map();
const byNameLoc = [];
for (const s of sweepRows) {
  const host = normDomain(s.website);
  const entry = { nn: normNameCompact(s.name), words: normNameWords(s.name), lat: s.lat, lng: s.lng, host };
  if (host) (byDomain.get(host) || byDomain.set(host, []).get(host)).push(entry);
  if (s.lat && s.lng) byNameLoc.push(entry);
}

// Reverse dedup: does any sweep row match this original? (name+loc <=200 m, or shared domain.)
function matchedByQuadtree(o) {
  const nn = normNameCompact(o.name);
  if (o.lat && o.lng && nn.length >= 8) {
    for (const s of byNameLoc) {
      if (s.nn === nn && haversine(o.lat, o.lng, s.lat, s.lng) < 200) return true;
    }
  }
  const host = normDomain(o.website);
  if (host && byDomain.has(host)) return true;
  return false;
}

// --- compute target set -------------------------------------------------------------------
const rows = [];
for (const o of oldOps) {
  const named = NAMED.has(o.name);
  const matched = matchedByQuadtree(o);
  if (!named && !matched) continue;
  rows.push({
    place_id: extractPlaceId(o.notes_internal),
    name: o.name,
    website: o.website || null,
    source: "original",
    match_type: matched ? "quadtree-dedup" : "named",
  });
}

const namedCount = rows.filter((r) => r.match_type === "named").length;
const matchedCount = rows.filter((r) => r.match_type === "quadtree-dedup").length;
const withPid = rows.filter((r) => r.place_id).length;
const withSite = rows.filter((r) => r.website).length;
const ungatherable = rows.filter((r) => !r.place_id && !r.website);

const out = {
  generatedAt: new Date().toISOString(),
  source: "operators.json (is_active) matched against quadtree_sweep_operators.json + NAMED list",
  count: rows.length,
  matched: matchedCount,
  named: namedCount,
  named_list: [...NAMED],
  rows,
};
fs.writeFileSync(P("pass_a_originals.json"), JSON.stringify(out, null, 2) + "\n");

console.log("=== build_pass_a_originals ===");
console.log(`active originals scanned: ${oldOps.length}`);
console.log(`target set:               ${rows.length}  (quadtree-dedup ${matchedCount} + named ${namedCount})`);
console.log(`  with place_id:          ${withPid}`);
console.log(`  with website:           ${withSite}`);
if (ungatherable.length) console.log(`  WARNING ungatherable (no place_id, no website): ${ungatherable.map((r) => r.name).join(", ")}`);
console.log("wrote pass_a_originals.json");
