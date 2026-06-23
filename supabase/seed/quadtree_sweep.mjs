/**
 * Pass A operator-discovery sweep — Reno/Tahoe basin (v2: adaptive quadtree).
 *
 *   node supabase/seed/quadtree_sweep.mjs              # resumable: skips (tile,term) pairs already cached
 *   node supabase/seed/quadtree_sweep.mjs --refresh    # ignore cache, re-fetch everything from Google
 *   node supabase/seed/quadtree_sweep.mjs --dry-run    # print the plan (tiles/cost estimate), fetch nothing
 *   node supabase/seed/quadtree_sweep.mjs --smoke      # one live tile (~cents), print parsed results, no file writes
 *
 * Wired to ./quadtree_sweep_queries.mjs (SEARCH_CONFIG, AOI_RECTS, GRID_CONFIG,
 * QUERIES, seedTiles, splitTile, tileKm). For every (tile × query) it runs Places
 * Text Search (New) with a RECTANGLE locationRestriction + DISTANCE ranking, so
 * results outside the tile are excluded (no out-of-region bleed) and a tile with
 * < 60 matches returns ALL of them. When a (tile,term) hits Google's 60 cap, the
 * tile is split into 4 quadrants and each is re-queried (quadtree), recursing
 * until every cell is under the cap or hits the GRID_CONFIG.minCellKm floor.
 * Dedups on place_id and writes:
 *   - quadtree_sweep_operators.json  (full records + run metadata + saturation report)
 *   - quadtree_sweep_operators.csv   (one row per operator, prominence-sorted)
 *   - quadtree_sweep_cache.json      (raw per-(tile,term) results, for resume / no re-bill)
 *
 * This is DISCOVERY ONLY (existence + prominence). It does NOT decide rents_gear
 * or extract inventory — that's Pass A triage (website sweep) and Pass B, per
 * extraction/00_general.md. Every row carries source_url (Google Maps URL) +
 * last_verified per the provenance rule (§2A, §8).
 *
 * Requires GOOGLE_PLACES_API_KEY (env or supabase/seed/.env).
 *
 * COST: uses Text Search (New) with websiteUri + rating + userRatingCount in the
 * field mask -> billed on the Text Search Enterprise SKU. website is needed for
 * Pass B triage and rating/userRatingCount are the prominence signal extraction
 * uses to prioritize (§4, §15). The resume cache means a rerun only bills (tile,term)
 * pairs not already fetched; use --refresh to force a full re-bill.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SEARCH_CONFIG,
  GRID_CONFIG,
  AOI_RECTS,
  QUERIES,
  seedTiles,
  splitTile,
  tileKm,
} from "./quadtree_sweep_queries.mjs";

const seedDir = dirname(fileURLToPath(import.meta.url));
const jsonPath = join(seedDir, "quadtree_sweep_operators.json");
const csvPath = join(seedDir, "quadtree_sweep_operators.csv");
const cachePath = join(seedDir, "quadtree_sweep_cache.json");

const REFRESH = process.argv.includes("--refresh");
const DRY_RUN = process.argv.includes("--dry-run");
const SMOKE = process.argv.includes("--smoke");

const CONCURRENCY = 5;          // parallel (tile,term) pairs
const PAIR_DELAY_MS = 100;      // pause between pair starts (politeness)
const PAGE_DELAY_MS = 2200;     // Google needs ~2s before a nextPageToken is valid
const MAX_RETRIES = 4;          // network retries inside one fetchPair call
const MAX_PAIR_ATTEMPTS = 3;    // whole-pair re-enqueues after fetchPair gives up (bounded, can't spin)
const CACHE_FLUSH_EVERY = 25;   // persist cache every N completed pairs

// ---------------------------------------------------------------------------
function loadApiKey() {
  if (process.env.GOOGLE_PLACES_API_KEY) return process.env.GOOGLE_PLACES_API_KEY;
  const envPath = join(seedDir, ".env");
  if (!existsSync(envPath)) return null;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^GOOGLE_PLACES_API_KEY=(.+)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.primaryType",
  "places.primaryTypeDisplayName",
  "places.types",
  "places.businessStatus",
  "places.rating",
  "places.userRatingCount",
  "places.location",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "nextPageToken",
].join(",");

/** One Text Search page. Returns { places, nextPageToken } or throws after retries. */
async function searchPage(apiKey, tile, term, pageToken) {
  const body = {
    textQuery: term,
    pageSize: SEARCH_CONFIG.pageSize,
    rankPreference: SEARCH_CONFIG.rankPreference,
    // RECTANGLE restriction (the only shape searchText restriction supports):
    // results outside the tile are dropped, so each tile is a true partition.
    locationRestriction: {
      rectangle: {
        low: { latitude: tile.low.lat, longitude: tile.low.lng },
        high: { latitude: tile.high.lat, longitude: tile.high.lng },
      },
    },
  };
  if (pageToken) body.pageToken = pageToken;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let res;
    try {
      res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": FIELD_MASK,
        },
        body: JSON.stringify(body),
      });
    } catch (e) {
      if (attempt === MAX_RETRIES) throw new Error(`network: ${e.message}`);
      await sleep(1000 * 2 ** attempt);
      continue;
    }
    if (res.ok) {
      const json = await res.json();
      return { places: json.places || [], nextPageToken: json.nextPageToken || null };
    }
    // Retry on rate limit / server errors; fail fast on 4xx (bad key, bad request).
    if (res.status === 429 || res.status >= 500) {
      if (attempt === MAX_RETRIES) {
        throw new Error(`HTTP ${res.status} after ${MAX_RETRIES} retries`);
      }
      await sleep(1000 * 2 ** attempt);
      continue;
    }
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
}

/** All pages (up to maxPages = 60 results) for one (tile,term) pair. */
async function fetchPair(apiKey, tile, term) {
  const collected = [];
  let token = null;
  for (let page = 0; page < SEARCH_CONFIG.maxPages; page++) {
    if (page > 0) await sleep(PAGE_DELAY_MS); // let the pageToken go live
    const { places, nextPageToken } = await searchPage(apiKey, tile, term, token);
    collected.push(...places);
    if (!nextPageToken) break;
    token = nextPageToken;
  }
  return collected;
}

/**
 * Dynamic worker pool over a queue that GROWS as tiles subdivide. `worker(item)`
 * may push new items onto `queue` (the quadtree children); workers keep draining
 * until the queue is empty and nothing is in flight.
 */
async function drainQueue(queue, worker, limit) {
  let active = 0;
  await new Promise((resolve, reject) => {
    let settled = false;
    const fail = (e) => { if (!settled) { settled = true; reject(e); } };
    const pump = () => {
      if (settled) return;
      if (queue.length === 0 && active === 0) { settled = true; resolve(); return; }
      while (active < limit && queue.length > 0) {
        const item = queue.shift();
        active++;
        Promise.resolve()
          .then(() => worker(item))
          .then(() => sleep(PAIR_DELAY_MS))
          .then(() => { active--; pump(); })
          .catch(fail);
      }
    };
    pump();
  });
}

function csvCell(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// ---------------------------------------------------------------------------
const apiKey = loadApiKey();
if (!apiKey && !DRY_RUN) {
  console.error("GOOGLE_PLACES_API_KEY not found (env or supabase/seed/.env).");
  process.exit(1);
}

// --smoke: one live tile, print parsed results, write nothing. Validates the
// rectangle restriction, DISTANCE ranking, field mask, and pagination for ~cents.
if (SMOKE) {
  // Pick the seed tile that contains South Lake Tahoe (dense kayak cluster).
  const SLT = { lat: 38.9399, lng: -119.9772 };
  const tiles = seedTiles();
  const tile =
    tiles.find(
      (t) => SLT.lat >= t.low.lat && SLT.lat <= t.high.lat && SLT.lng >= t.low.lng && SLT.lng <= t.high.lng,
    ) ?? tiles[0];
  const term = "kayak rental";
  console.log(
    `Smoke test: tile ${tile.id} (${tileKm(tile).toFixed(1)}km) × "${term}" ` +
      `[restriction=rectangle, rank=${SEARCH_CONFIG.rankPreference}]…\n`,
  );
  const places = await fetchPair(apiKey, tile, term);
  console.log(`Results: ${places.length}${places.length >= GRID_CONFIG.capThreshold ? " (AT CAP — would subdivide)" : ""}`);
  const s = places[0];
  if (s) {
    console.log("\nSample[0] — confirms field mask:");
    console.log("  id:          ", s.id);
    console.log("  name:        ", s.displayName?.text);
    console.log("  website:     ", s.websiteUri ?? "(none)");
    console.log("  source_url:  ", s.googleMapsUri ?? "(none)");
    console.log("  primaryType: ", s.primaryTypeDisplayName?.text ?? s.primaryType);
    console.log("  rating:      ", s.rating, "| reviews:", s.userRatingCount);
    console.log("  phone:       ", s.nationalPhoneNumber ?? "(none)");
    console.log("  status:      ", s.businessStatus);
    console.log("  location:    ", s.location?.latitude, s.location?.longitude);
    console.log("  address:     ", s.formattedAddress);
  }
  console.log("\nAll names:", places.map((p) => p.displayName?.text).join(" | "));
  console.log("\nSmoke OK — no files written. Run without --smoke for the full sweep.");
  process.exit(0);
}

// Seed the work queue with one (seedTile, query) item per pair. The queue GROWS
// as dense tiles subdivide into quadrants (the quadtree).
const seeds = seedTiles();
const queue = [];
for (const tile of seeds) for (const q of QUERIES) queue.push({ tile, q });

console.log(
  `Sweep plan: ${seeds.length} seed tiles (${GRID_CONFIG.seedCellKm}km, quadtree floor ${GRID_CONFIG.minCellKm}km) ` +
    `× ${QUERIES.length} queries = ${seeds.length * QUERIES.length} seed pairs over ${AOI_RECTS.length} AOI corridors.`,
);
console.log(
  `Per pair: rectangle restriction + ${SEARCH_CONFIG.rankPreference} ranking, up to ${SEARCH_CONFIG.maxPages} pages ` +
    `(${SEARCH_CONFIG.pageSize * SEARCH_CONFIG.maxPages} results); cap hits (${GRID_CONFIG.capThreshold}) split into 4 and recurse.`,
);

if (DRY_RUN) {
  console.log(
    `Baseline ≈ ${(seeds.length * QUERIES.length).toLocaleString()} query-series before subdivision ` +
      `(each is 1–3 Text Search calls). Dense tiles add ~+4 series per cap hit, deepening only where supply is real.`,
  );
  console.log("Dry run — no API calls made.");
  process.exit(0);
}

// Resume cache: { "<tileId>::<term>": [ rawPlace, ... ] }. Keys from a prior run
// with different geometry simply won't be hit (those pairs re-fetch); aggregation
// only reads the tiles actually visited this run, so stale keys can't pollute it.
let cache = {};
if (!REFRESH && existsSync(cachePath)) {
  try {
    cache = JSON.parse(readFileSync(cachePath, "utf8")).pairs || {};
  } catch {
    cache = {};
  }
}

let done = 0;
let billedCalls = 0;
let fromCache = 0;
let tilesSplit = 0;
const errors = [];
const saturatedAtMin = [];
const claimed = new Set();        // keys dequeued (dedupe), set synchronously
const visited = new Map();        // key -> { tile, q } for successful pairs (drives aggregation)

function flushCache() {
  writeFileSync(cachePath, JSON.stringify({ updatedAt: new Date().toISOString(), pairs: cache }, null, 2));
}

const worker = async ({ tile, q, attempt = 1 }) => {
  const key = `${tile.id}::${q.term}`;
  if (claimed.has(key)) return; // an equivalent tile was already enqueued
  claimed.add(key);

  let places;
  if (!REFRESH && Array.isArray(cache[key])) {
    places = cache[key];
    fromCache++;
  } else {
    try {
      places = await fetchPair(apiKey, tile, q.term);
      cache[key] = places;
      billedCalls += Math.max(1, Math.ceil(places.length / SEARCH_CONFIG.pageSize));
    } catch (e) {
      claimed.delete(key); // unclaim so the re-enqueue below can run it again
      if (attempt < MAX_PAIR_ATTEMPTS) {
        queue.push({ tile, q, attempt: attempt + 1 }); // bounded in-run retry
      } else {
        errors.push({ key, error: e.message, attempts: attempt }); // gave up — left uncached so a later rerun can retry
      }
      return;
    }
  }
  visited.set(key, { tile, q });
  done++;

  // Cap hit => there is more here than 60. Subdivide unless we've hit the floor.
  // The parent's 60 are kept (already cached/visited); children re-cover the same
  // ground and WILL re-return some of them — that overlap is intentional and made
  // harmless by the place_id dedup in aggregation. Don't try to "subtract" the
  // parent: the cap means we can't know which 60 of N it returned.
  if (places.length >= GRID_CONFIG.capThreshold) {
    if (tileKm(tile) > GRID_CONFIG.minCellKm) {
      tilesSplit++;
      for (const child of splitTile(tile)) queue.push({ tile: child, q });
    } else {
      saturatedAtMin.push({ term: q.term, tile: tile.id });
    }
  }

  if (done % 25 === 0) {
    process.stdout.write(
      `\r  processed ${done} pairs (split ${tilesSplit}, billed ${billedCalls}, cache ${fromCache}, queued ${queue.length})…`,
    );
    flushCache();
  }
};

await drainQueue(queue, worker, CONCURRENCY);
flushCache();
console.log("\n");

// ---------------------------------------------------------------------------
// Aggregate from cache -> dedup on place_id, merge attribution across all pairs.
const RENTAL_SIGNAL_TIERS = new Set(["core", "gap"]); // tiers that signal likely-renter for triage priority
const qByTerm = new Map(QUERIES.map((q) => [q.term, q]));
const lastVerified = new Date().toISOString().slice(0, 10);

const ops = new Map(); // place_id -> record
for (const { tile, q } of visited.values()) {
  const places = cache[`${tile.id}::${q.term}`] || [];
  for (const p of places) {
    if (!p.id) continue;
    let rec = ops.get(p.id);
    if (!rec) {
      rec = {
        place_id: p.id,
        name: p.displayName?.text ?? null,
        website: p.websiteUri ?? null,
        source_url: p.googleMapsUri ?? `https://www.google.com/maps/place/?q=place_id:${p.id}`,
        primary_type: p.primaryTypeDisplayName?.text ?? p.primaryType ?? null,
        types: p.types ?? [],
        business_status: p.businessStatus ?? null,
        rating: p.rating ?? null,
        user_rating_count: p.userRatingCount ?? 0,
        phone: p.nationalPhoneNumber ?? null,
        lat: p.location?.latitude ?? null,
        lng: p.location?.longitude ?? null,
        address: p.formattedAddress ?? null,
        matched_activities: new Set(),
        matched_terms: new Set(),
        matched_tiles: new Set(),
        matched_tiers: new Set(),
        match_pairs: 0,
        last_verified: lastVerified,
      };
      ops.set(p.id, rec);
    }
    const meta = qByTerm.get(q.term);
    rec.matched_activities.add(meta.activity);
    rec.matched_terms.add(q.term);
    rec.matched_tiles.add(tile.id);
    rec.matched_tiers.add(meta.tier);
    rec.match_pairs++;
    // keep the richest values seen across duplicates
    rec.rating = rec.rating ?? p.rating ?? null;
    rec.user_rating_count = Math.max(rec.user_rating_count, p.userRatingCount ?? 0);
    rec.website = rec.website ?? p.websiteUri ?? null;
  }
}

// Finalize: sets -> sorted arrays, add triage-priority signal, sort by prominence.
const records = [...ops.values()]
  .map((r) => {
    const { matched_tiles, ...rest } = r;
    return {
      ...rest,
      matched_activities: [...r.matched_activities].sort(),
      matched_terms: [...r.matched_terms].sort(),
      matched_tile_count: matched_tiles.size, // how many tiles surfaced this operator
      matched_tiers: [...r.matched_tiers].sort(),
      rental_signal: [...r.matched_tiers].some((t) => RENTAL_SIGNAL_TIERS.has(t)),
      types: r.types,
    };
  })
  .sort(
    (a, b) =>
      Number(b.rental_signal) - Number(a.rental_signal) ||
      b.user_rating_count - a.user_rating_count ||
      (b.rating ?? 0) - (a.rating ?? 0),
  );

writeFileSync(
  jsonPath,
  JSON.stringify(
    {
      sweptAt: new Date().toISOString(),
      aoi_corridors: AOI_RECTS.length,
      seed_tiles: seeds.length,
      seed_cell_km: GRID_CONFIG.seedCellKm,
      min_cell_km: GRID_CONFIG.minCellKm,
      queries: QUERIES.length,
      tiles_visited: visited.size,
      tiles_split: tilesSplit,
      saturated_at_min_cell: saturatedAtMin, // (term,tile) still at 60 at the floor — residual truncation, if any
      billable_calls_this_run: billedCalls,
      pairs_from_cache: fromCache,
      errors,
      operator_count: records.length,
      operators: records,
    },
    null,
    2,
  ),
);

const cols = [
  "place_id", "name", "rental_signal", "matched_tiers", "matched_activities",
  "match_pairs", "rating", "user_rating_count", "business_status", "primary_type",
  "website", "source_url", "phone", "address", "lat", "lng",
  "matched_tile_count", "matched_terms", "last_verified",
];
const lines = [cols.join(",")];
for (const r of records) {
  lines.push(
    cols
      .map((c) => {
        const v = r[c];
        if (Array.isArray(v)) return csvCell(v.join("; "));
        return csvCell(v);
      })
      .join(","),
  );
}
writeFileSync(csvPath, lines.join("\n") + "\n");

// ---------------------------------------------------------------------------
const withSignal = records.filter((r) => r.rental_signal).length;
const withWebsite = records.filter((r) => r.website).length;
console.log(`Done. ${records.length} unique operators discovered.`);
console.log(`  ${visited.size} tiles visited (${tilesSplit} split on a cap hit), ${billedCalls} billable calls.`);
console.log(`  ${withSignal} with a rental-type signal (core/gap) — Pass A triage priority.`);
console.log(`  ${withWebsite} have a website (needed for Pass B).`);
if (saturatedAtMin.length) {
  console.log(`  ${saturatedAtMin.length} (term,tile) still at the 60 cap at the ${GRID_CONFIG.minCellKm}km floor — residual truncation (see JSON.saturated_at_min_cell; lower minCellKm or add includedType slicing).`);
}
if (errors.length) console.log(`  ${errors.length} pair(s) errored — rerun to retry, see JSON.errors.`);
console.log(`\nJSON: ${jsonPath}\nCSV:  ${csvPath}\nCache: ${cachePath}`);
