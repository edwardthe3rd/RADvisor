#!/usr/bin/env node
/**
 * Term-overlap probe — answers "does `sporting goods store` surface renting
 * stores that the normal rental terms miss, or is it pure retail noise?"
 *
 *   node supabase/seed/term_overlap_probe.mjs
 *
 * Runs the SAME request shape as the sweep (rectangle locationRestriction +
 * DISTANCE ranking) on two dense tiles, then for `sporting goods store` lists
 * the results that appear under NO rental term (the net-new). Eyeball those:
 * genuine renters (named "X Sports", a local shop with a real storefront) argue
 * for KEEPING the term; national chains (Big 5, Dick's, Sportsman's Warehouse)
 * are the noise the downstream gate rejects and argue for CUTTING it.
 *
 * Cost: ~15-25 Text Search calls total (a few cents). Needs GOOGLE_PLACES_API_KEY
 * in supabase/seed/.env (same key the sweep uses).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const seedDir = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(join(seedDir, ".env"), "utf8");
const KEY = (env.match(/GOOGLE_PLACES_API_KEY=(.+)/) || [])[1]?.trim();
if (!KEY) { console.error("No GOOGLE_PLACES_API_KEY in supabase/seed/.env"); process.exit(1); }

const TILES = [
  { name: "South Lake Tahoe (rental-dense)", low: { lat: 38.9356, lng: -120.0225 }, high: { lat: 39.0441, lng: -119.8833 } },
  { name: "Reno (chain-dense)",              low: { lat: 39.4782, lng: -119.8833 }, high: { lat: 39.5867, lng: -119.7441 } },
];
const RENTAL_TERMS = [
  "outdoor gear rental", "outdoor equipment rental", "ski rental", "ski shop",
  "kayak rental", "paddleboard rental", "bike rental", "snowboard rental", "camping gear rental",
];
const PROBE = "sporting goods store";
const FIELDS = "places.id,places.displayName,places.websiteUri,places.primaryTypeDisplayName,places.types,places.businessStatus";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function searchPage(tile, term, token) {
  const body = {
    textQuery: term, pageSize: 20, rankPreference: "DISTANCE",
    locationRestriction: { rectangle: {
      low: { latitude: tile.low.lat, longitude: tile.low.lng },
      high: { latitude: tile.high.lat, longitude: tile.high.lng } } },
  };
  if (token) body.pageToken = token;
  const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": KEY, "X-Goog-FieldMask": FIELDS + ",nextPageToken" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
}
async function fetchAll(tile, term) {
  const out = []; let token = null;
  for (let p = 0; p < 3; p++) {
    if (p > 0) await sleep(2200);
    const j = await searchPage(tile, term, token);
    (j.places || []).forEach((x) => out.push(x));
    if (!j.nextPageToken) break; token = j.nextPageToken;
  }
  return out;
}

let calls = 0;
for (const tile of TILES) {
  console.log(`\n===== ${tile.name} =====`);
  const rentalUnion = new Map();
  for (const t of RENTAL_TERMS) {
    const res = await fetchAll(tile, t); calls += Math.max(1, Math.ceil(res.length / 20));
    res.forEach((p) => rentalUnion.set(p.id, p.displayName?.text));
    await sleep(300);
  }
  const sg = await fetchAll(tile, PROBE); calls += Math.max(1, Math.ceil(sg.length / 20));
  const net = sg.filter((p) => !rentalUnion.has(p.id));
  console.log(`rental-union distinct operators: ${rentalUnion.size}`);
  console.log(`"${PROBE}": ${sg.length} results, ${sg.length - net.length} already in rental union, ${net.length} NET-NEW`);
  console.log(`NET-NEW (judge: renter vs chain):`);
  for (const p of net) {
    console.log(`  - ${p.displayName?.text} | ${p.primaryTypeDisplayName?.text || p.types?.[0]} | ${p.websiteUri ? "web" : "no-web"} | ${p.businessStatus || ""}`);
  }
}
console.log(`\napprox billable calls: ${calls}`);
