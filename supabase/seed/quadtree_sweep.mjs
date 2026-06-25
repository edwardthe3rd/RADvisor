/**
 * Pass A operator-discovery sweep — Reno/Tahoe basin (v2: adaptive quadtree).
 *
 *   node supabase/seed/quadtree_sweep.mjs              # resumable: skips cached search/detail calls
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
 *   - quadtree_sweep_cache.json      (raw search pairs + place details, for resume / no re-bill)
 *
 * This is DISCOVERY + LIGHT ENRICHMENT ONLY (existence + prominence). It does
 * NOT decide rents_gear or extract inventory — that's Pass A triage (website
 * sweep) and Pass B, per extraction/00_general.md. Every row carries source_url
 * (Google Maps URL) + last_verified per the provenance rule (§2A, §8).
 *
 * Requires GOOGLE_PLACES_API_KEY (env or supabase/seed/.env).
 *
 * COST: Text Search uses a Pro-level discovery mask and runs once per
 * (tile,term,mode), where mode is standard or the targeted service-area pass.
 * Expensive website/phone/rating fields are fetched once per unique place via
 * Place Details, not repeatedly on every overlapping tile/term search response.
 * The versioned resume cache means a rerun only bills calls not already fetched;
 * use --refresh to force a full re-bill.
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SEARCH_CONFIG,
  GRID_CONFIG,
  AOI_RECTS,
  AOI_EXCLUDE,
  QUERIES,
  SERVICE_AREA_TERMS,
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
const FETCH_TIMEOUT_MS = 15000; // fail stuck HTTP requests instead of hanging smoke/full runs

const DISCOVERY_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.googleMapsUri",
  "places.primaryType",
  "places.primaryTypeDisplayName",
  "places.types",
  "places.businessStatus",
  "places.pureServiceAreaBusiness",
  "places.location",
  "places.formattedAddress",
  "nextPageToken",
].join(",");

const DETAILS_FIELD_MASK = [
  "id",
  "displayName",
  "websiteUri",
  "googleMapsUri",
  "primaryType",
  "primaryTypeDisplayName",
  "types",
  "businessStatus",
  "pureServiceAreaBusiness",
  "rating",
  "userRatingCount",
  "location",
  "formattedAddress",
  "nationalPhoneNumber",
].join(",");

// includedType only accepts request-supported Place types. Use this conservative
// set to avoid turning a floor-tile rescue query into invalid-request noise.
// Verified against Google's Table A (place-types doc): only types valid as a
// searchText `includedType` request param belong here. Response-only types
// (e.g. boat_rental, diving_center, archery_range, recreation_center) are NOT
// valid request types and would 400 the slice — keep them out.
const INCLUDED_TYPE_ALLOWLIST = new Set([
  "adventure_sports_center",
  "amusement_center",
  "amusement_park",
  "athletic_field",
  "bicycle_store",
  "campground",
  "community_center",
  "event_venue",
  "fishing_charter",
  "golf_course",
  "hiking_area",
  "ice_skating_rink",
  "marina",
  "national_park",
  "off_roading_area",
  "park",
  "playground",
  "resort_hotel",
  "rv_park",
  "ski_resort",
  "sports_activity_location",
  "sports_club",
  "sports_complex",
  "sporting_goods_store",
  "state_park",
  "tour_agency",
  "tourist_attraction",
  "travel_agency",
  "visitor_center",
  "water_park",
]);

const MAX_TYPE_SLICES = 8; // bound the per-floor-tile fan-out

const hashJson = (v) => createHash("sha256").update(JSON.stringify(v)).digest("hex").slice(0, 12);
const SEARCH_CACHE_VERSION = hashJson({
  kind: "text-search-discovery-v3",
  fieldMask: DISCOVERY_FIELD_MASK,
  searchConfig: SEARCH_CONFIG,
  gridConfig: GRID_CONFIG,
  aoiRects: AOI_RECTS,
  aoiExclude: AOI_EXCLUDE,
  maxTypeSlices: MAX_TYPE_SLICES,
  strictTypeFilteringForSlices: true,
  includedTypeAllowlist: [...INCLUDED_TYPE_ALLOWLIST].sort(),
  terms: QUERIES.map((q) => q.term),
  serviceAreaTerms: [...SERVICE_AREA_TERMS].sort(),
});
const DETAILS_CACHE_VERSION = hashJson({
  kind: "place-details-enrichment-v1",
  fieldMask: DETAILS_FIELD_MASK,
});

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

async function fetchWithTimeout(url, options, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** One Text Search page. Returns { places, nextPageToken } or throws after retries. */
async function searchPage(apiKey, tile, term, includeServiceArea, pageToken, includedType) {
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
  if (includeServiceArea) body.includePureServiceAreaBusinesses = true;
  // includedType slices a floor tile that is STILL at the 60 cap into per-type
  // sub-queries, lifting the per-call ceiling without going below the geographic
  // floor. searchText accepts a single includedType per request.
  if (includedType) {
    body.includedType = includedType;
    body.strictTypeFiltering = true;
  }
  if (pageToken) body.pageToken = pageToken;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let res;
    try {
      res = await fetchWithTimeout("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": DISCOVERY_FIELD_MASK,
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
async function fetchPair(apiKey, tile, term, includeServiceArea, includedType) {
  const collected = [];
  let token = null;
  for (let page = 0; page < SEARCH_CONFIG.maxPages; page++) {
    if (page > 0) await sleep(PAGE_DELAY_MS); // let the pageToken go live
    const { places, nextPageToken } = await searchPage(apiKey, tile, term, includeServiceArea, token, includedType);
    collected.push(...places);
    if (!nextPageToken) break;
    token = nextPageToken;
  }
  return collected;
}

async function fetchPlaceDetails(apiKey, placeId) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let res;
    try {
      res = await fetchWithTimeout(`https://places.googleapis.com/v1/places/${placeId}`, {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": DETAILS_FIELD_MASK,
        },
      });
    } catch (e) {
      if (attempt === MAX_RETRIES) throw new Error(`network: ${e.message}`);
      await sleep(1000 * 2 ** attempt);
      continue;
    }
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) {
      if (attempt === MAX_RETRIES) throw new Error(`HTTP ${res.status} after ${MAX_RETRIES} retries`);
      await sleep(1000 * 2 ** attempt);
      continue;
    }
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
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

// Near-duplicate detection helpers. Google sometimes carries one operator under
// two place_ids (relisted/moved/double-listed), which place_id dedup alone can't
// collapse. We FLAG (never merge) so Pass A triage can review.
const normName = (s) =>
  (s || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();

function hostOf(url) {
  if (!url) return "";
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function distanceKm(aLat, aLng, bLat, bLng) {
  if (aLat == null || aLng == null || bLat == null || bLng == null) return Infinity;
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const la1 = (aLat * Math.PI) / 180;
  const la2 = (bLat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function searchKey(tile, q, includeServiceArea, includedType) {
  const mode = includeServiceArea ? "service-area" : "standard";
  const typeSeg = includedType ? `::type:${includedType}` : "";
  return `${SEARCH_CACHE_VERSION}::${mode}::${tile.id}::${q.term}${typeSeg}`;
}

function detailsKey(placeId) {
  return `${DETAILS_CACHE_VERSION}::${placeId}`;
}

function displaySearchKey(tile, q, includeServiceArea, includedType) {
  return `${tile.id}::${q.term}${includeServiceArea ? "::service-area" : ""}${includedType ? `::type:${includedType}` : ""}`;
}

// Generic Google types that match almost everything — useless as a slice axis.
const GENERIC_TYPES = new Set([
  "point_of_interest",
  "establishment",
  "store",
  "premise",
  "food",
]);

// Lodging PRIMARY types that surface on gear queries because the listing copy
// mentions kayaks/skis, but the place is a home/room/hotel — not a rental operator.
// Matched on PRIMARY type only (lowest false-positive). Deliberately EXCLUDES
// resort_hotel, campground, camping_cabin, and rv_park: those can be legitimate
// operators (ski resorts, campgrounds) and stay in the universe.
const LODGING_NOISE_TYPES = new Set([
  "bed_and_breakfast",
  "budget_japanese_inn",
  "cottage",
  "extended_stay_hotel",
  "farmstay",
  "guest_house",
  "hostel",
  "hotel",
  "inn",
  "japanese_inn",
  "lodging",
  "mobile_home_park",
  "motel",
  "private_guest_room",
]);

// Big-box / unrelated-retail PRIMARY types that match broad terms ("sporting goods
// store", "outdoor equipment rental") on review count but never rent outdoor gear.
// HARD-EXCLUDE the unambiguous non-renters (Walmart, malls, groceries, restaurants,
// car shops) — dropped pre-enrichment, retained in retail_excluded_records.
const RETAIL_EXCLUDE_TYPES = new Set([
  "grocery_store",
  "supermarket",
  "restaurant",
  "cafe",
  "car_repair",
  "gas_station",
  "department_store",
  "shopping_mall",
  "convenience_store",
]);

// Ambiguous retail PRIMARY types — a ski-apparel shop or specialty-vehicle outfit
// could be legit, so FLAG (likely_irrelevant) for triage to deprioritize rather
// than dropping. Kept in the operator list and enriched.
const RETAIL_FLAG_TYPES = new Set([
  "clothing_store",
  "thrift_store",
  "car_rental",
]);

// activity -> a few request-valid includedType axes to ALWAYS try when a cell
// saturates, even if absent from the truncated 60-result sample (so operators
// whose type never appeared in the visible sample still get a slice). Every value
// MUST be in INCLUDED_TYPE_ALLOWLIST or the slice query is rejected as invalid.
const ACTIVITY_TYPE_HINTS = {
  "gear-shop": ["sporting_goods_store"],
  outfitter: ["tour_agency", "sporting_goods_store"],
  kayak: ["marina", "tour_agency"],
  sup: ["marina", "tour_agency"],
  canoe: ["marina", "tour_agency"],
  powerboat: ["marina", "tour_agency"],
  pontoon: ["marina", "tour_agency"],
  pwc: ["marina", "tour_agency"],
  watersports: ["marina", "tour_agency"],
  sailing: ["marina", "tour_agency"],
  windsurf: ["marina", "tour_agency"],
  kiteboard: ["marina", "tour_agency"],
  wakeboard: ["marina", "tour_agency"],
  efoil: ["marina", "tour_agency"],
  "foil-surf": ["marina", "tour_agency"],
  "river-tube": ["tour_agency", "marina"],
  rafting: ["tour_agency", "marina"],
  scuba: ["marina", "tour_agency"],
  "fishing-charter": ["fishing_charter", "marina"],
  "fly-fishing": ["tour_agency", "sporting_goods_store"],
  "fishing-gear": ["sporting_goods_store"],
  hunting: ["tour_agency", "sporting_goods_store"],
  archery: ["sporting_goods_store"],
  mtb: ["bicycle_store"],
  cycling: ["bicycle_store"],
  ebike: ["bicycle_store"],
  "fat-bike": ["bicycle_store"],
  climbing: ["sporting_goods_store", "adventure_sports_center"],
  camping: ["campground", "sporting_goods_store", "rv_park"],
  backpacking: ["sporting_goods_store", "campground"],
  "disc-golf": ["park"],
  atv: ["off_roading_area", "tour_agency"],
  utv: ["off_roading_area", "tour_agency"],
  "offroad-4x4": ["off_roading_area", "tour_agency"],
  dirtbike: ["off_roading_area", "tour_agency"],
  "alpine-ski": ["ski_resort", "sporting_goods_store"],
  snowboard: ["ski_resort", "sporting_goods_store"],
  "nordic-ski": ["ski_resort", "sporting_goods_store"],
  "backcountry-ski": ["ski_resort", "sporting_goods_store"],
  snowshoe: ["ski_resort", "sporting_goods_store"],
  "avy-gear": ["sporting_goods_store"],
  "ice-climb": ["sporting_goods_store", "adventure_sports_center"],
  snowmobile: ["tour_agency"],
  "snow-tube": ["ski_resort"],
  "ice-skate": ["ice_skating_rink"],
};
const DEFAULT_TYPE_HINTS = ["sporting_goods_store"];

/**
 * Candidate includedType slices for a tile that is still at the 60 cap. Slices run
 * with strictTypeFiltering, which matches on a place's PRIMARY type — so the axes
 * are the request-valid PRIMARY types observed in the capped sample (ranked by
 * frequency), plus a few activity-specific HINT types always tried even if missing
 * from the truncated sample. Secondary types are NOT used as axes: under strict
 * filtering a secondary-only slice returns nothing — a wasted call and a wasted
 * slice-budget slot. Response-only types are dropped (searchText rejects them).
 */
function typeSlicesFor(places, q) {
  const counts = new Map();
  for (const p of places) {
    const t = p.primaryType;
    if (!t || GENERIC_TYPES.has(t) || !INCLUDED_TYPE_ALLOWLIST.has(t)) continue;
    counts.set(t, (counts.get(t) || 0) + 1);
  }
  // Seed activity hints at frequency 0 so observed primary types sort ahead of them.
  const hints = (q && ACTIVITY_TYPE_HINTS[q.activity]) || DEFAULT_TYPE_HINTS;
  for (const t of hints) {
    if (INCLUDED_TYPE_ALLOWLIST.has(t) && !counts.has(t)) counts.set(t, 0);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_TYPE_SLICES)
    .map(([t]) => t);
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
  const places = await fetchPair(apiKey, tile, term, false);
  console.log(`Results: ${places.length}${places.length >= GRID_CONFIG.capThreshold ? " (AT CAP — would subdivide)" : ""}`);
  const s = places[0];
  if (s) {
    console.log("\nSample[0] — confirms field mask:");
    console.log("  id:          ", s.id);
    console.log("  name:        ", s.displayName?.text);
    console.log("  source_url:  ", s.googleMapsUri ?? "(none)");
    console.log("  primaryType: ", s.primaryTypeDisplayName?.text ?? s.primaryType);
    console.log("  serviceArea: ", s.pureServiceAreaBusiness ?? false);
    console.log("  status:      ", s.businessStatus);
    console.log("  location:    ", s.location?.latitude, s.location?.longitude);
    console.log("  address:     ", s.formattedAddress);
    const detail = await fetchPlaceDetails(apiKey, s.id);
    console.log("\nEnrichment sample — fetched once per unique place in full runs:");
    console.log("  website:     ", detail.websiteUri ?? "(none)");
    console.log("  rating:      ", detail.rating, "| reviews:", detail.userRatingCount);
    console.log("  phone:       ", detail.nationalPhoneNumber ?? "(none)");
  }
  console.log("\nAll names:", places.map((p) => p.displayName?.text).join(" | "));

  // Probe the SAB-rescue slice path: includePureServiceAreaBusinesses + includedType
  // + strictTypeFiltering on ONE request. This is the combination the full run leans
  // on but the basic smoke above never exercises — confirm it composes (no HTTP 400).
  const sliceType = (ACTIVITY_TYPE_HINTS.kayak || [])[0] ?? "boat_rental";
  console.log(`\nProbe: service-area + includedType="${sliceType}" + strictTypeFiltering …`);
  try {
    const sliced = await fetchPair(apiKey, tile, term, true, sliceType);
    const sab = sliced.filter((p) => p.pureServiceAreaBusiness).length;
    console.log(`  OK — ${sliced.length} results (${sab} pure service-area). Combination composes.`);
  } catch (e) {
    console.log(`  FAILED — ${e.message}`);
    console.log("  (If HTTP 400, the SAB-rescue slice body is rejected — revisit before a full run.)");
  }

  console.log("\nSmoke OK — no files written. Run without --smoke for the full sweep.");
  process.exit(0);
}

// Seed the work queue with one (seedTile, query) item per pair. The queue GROWS
// as dense tiles subdivide into quadrants (the quadtree).
// One seed pair per (tile, query). For SERVICE_AREA_TERMS the single seed pair
// runs with includePureServiceAreaBusinesses=true — that response is a SUPERSET of
// the standard one (same storefronts + pure service-area businesses), so a second
// standard pass would be pure waste. On a cap hit the storefront half is recovered
// by geographic subdivision (children drop the flag); the SAB half is recovered by
// includedType slicing (see worker). The storefront/SAB split is read back from
// each result's pureServiceAreaBusiness field, not from running two queries.
const seeds = seedTiles();
const queue = [];
for (const tile of seeds) {
  for (const q of QUERIES) {
    queue.push({ tile, q, includeServiceArea: SERVICE_AREA_TERMS.has(q.term) });
  }
}
const serviceAreaTermCount = QUERIES.filter((q) => SERVICE_AREA_TERMS.has(q.term)).length;

console.log(
  `Sweep plan: ${seeds.length} seed tiles (${GRID_CONFIG.seedCellKm}km, quadtree floor ${GRID_CONFIG.minCellKm}km) ` +
    `× ${QUERIES.length} queries = ${seeds.length * QUERIES.length} seed pairs over ${AOI_RECTS.length} AOI corridors.`,
);
console.log(
  `Of these, ${serviceAreaTermCount} terms run the MERGED service-area pass (includePureServiceAreaBusinesses) ` +
    `at the seed level; storefront subdivision drops the flag, SAB recall is recovered via includedType slicing.`,
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
  console.log(`Search cache version: ${SEARCH_CACHE_VERSION}; details cache version: ${DETAILS_CACHE_VERSION}.`);
  console.log("Dry run — no API calls made.");
  process.exit(0);
}

// Resume cache: { searchPairs, placeDetails }. Keys include version hashes for
// request shape, field masks, terms, and service-area mode. Old keys simply
// won't be hit after a config change.
let cache = { searchPairs: {}, placeDetails: {} };
if (!REFRESH && existsSync(cachePath)) {
  try {
    const parsed = JSON.parse(readFileSync(cachePath, "utf8"));
    cache = {
      searchPairs: parsed.searchPairs || parsed.pairs || {},
      placeDetails: parsed.placeDetails || {},
    };
  } catch {
    cache = { searchPairs: {}, placeDetails: {} };
  }
}

let done = 0;
let searchBillableCalls = 0;
let detailBillableCalls = 0;
let fromCache = 0;
let detailsFromCache = 0;
let tilesSplit = 0;
let typeSlicedTiles = 0;        // floor tiles that triggered includedType slicing
let typeSlices = 0;             // total typed slice sub-queries enqueued
let closedPermanentlyDropped = 0;
let closedTemporarilySkipped = 0;
let lodgingExcluded = 0;
let retailExcluded = 0;
const closedRecords = [];
const lodgingRecords = [];
const retailRecords = [];
const errors = [];
const detailErrors = [];
const saturatedAtMin = [];
const saturatedServiceArea = []; // service-area pairs at cap (NOT subdivided — see worker)
const claimed = new Set();        // keys dequeued (dedupe), set synchronously
const visited = new Map();        // key -> { tile, q, includeServiceArea } for successful pairs (drives aggregation)

function flushCache() {
  writeFileSync(
    cachePath,
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        versions: {
          search: SEARCH_CACHE_VERSION,
          details: DETAILS_CACHE_VERSION,
        },
        searchPairs: cache.searchPairs,
        placeDetails: cache.placeDetails,
      },
      null,
      2,
    ),
  );
}

// Enqueue an includedType slice per candidate type for a saturated cell, preserving
// the service-area flag. Returns true if any slice was enqueued. Used both at the
// floor (no geographic lever left) and at the seed level for the service-area pass
// (pure SABs don't survive flag-off geographic children, so they're sliced here).
function enqueueTypeSlices(tile, q, includeServiceArea, places) {
  const slices = typeSlicesFor(places, q);
  if (!slices.length) return false;
  typeSlicedTiles++;
  for (const t of slices) {
    queue.push({ tile, q, includeServiceArea, includedType: t });
    typeSlices++;
  }
  return true;
}

const recordSaturation = (tile, q, includeServiceArea, includedType) => {
  const entry = { term: q.term, tile: tile.id };
  if (includedType) entry.includedType = includedType;
  if (includeServiceArea) saturatedServiceArea.push(entry);
  else saturatedAtMin.push({ ...entry, mode: "standard" });
};

const worker = async ({ tile, q, includeServiceArea = false, includedType = null, attempt = 1 }) => {
  const key = searchKey(tile, q, includeServiceArea, includedType);
  if (claimed.has(key)) return; // an equivalent tile was already enqueued
  claimed.add(key);

  let places;
  if (!REFRESH && Array.isArray(cache.searchPairs[key])) {
    places = cache.searchPairs[key];
    fromCache++;
  } else {
    try {
      places = await fetchPair(apiKey, tile, q.term, includeServiceArea, includedType);
      cache.searchPairs[key] = places;
      searchBillableCalls += Math.max(1, Math.ceil(places.length / SEARCH_CONFIG.pageSize));
    } catch (e) {
      claimed.delete(key); // unclaim so the re-enqueue below can run it again
      // 4xx are deterministic (bad request / invalid includedType) — re-issuing the
      // identical request just burns calls, so don't re-enqueue those. Network and
      // 5xx/429-exhausted errors are worth a bounded retry.
      const retryable = !/HTTP 4\d\d/.test(e.message);
      if (retryable && attempt < MAX_PAIR_ATTEMPTS) {
        queue.push({ tile, q, includeServiceArea, includedType, attempt: attempt + 1 }); // bounded in-run retry
      } else {
        errors.push({ key: displaySearchKey(tile, q, includeServiceArea, includedType), error: e.message, attempts: attempt }); // left uncached so a later rerun can retry
      }
      return;
    }
  }
  visited.set(key, { tile, q, includeServiceArea, includedType });
  done++;

  // Cap hit => there is more here than 60. How we open it up depends on the lever
  // still available, in precedence order:
  //
  //  - Already a typed slice (includedType set): that's the finest lever we have,
  //    so a cap here is genuine residual truncation — just record it.
  //  - Above the floor: subdivide into 4 quadrants (the quadtree). Children DROP the
  //    service-area flag — storefronts partition by location, pure SABs don't. The
  //    parent's 60 are kept; children re-cover the same ground and re-return some of
  //    them, harmless under place_id dedup. We can't "subtract" the parent because
  //    the cap hides which 60 of N it returned. For the service-area pass the pure
  //    SABs won't survive the flag-off children, so we ALSO slice this cell by
  //    includedType (flag on) to recover them without a geographic partition.
  //  - At the floor: no geography left, so slice by includedType (preserving the
  //    flag) to lift the per-call ceiling one more way.
  if (places.length >= GRID_CONFIG.capThreshold) {
    if (includedType) {
      recordSaturation(tile, q, includeServiceArea, includedType);
    } else if (tileKm(tile) > GRID_CONFIG.minCellKm) {
      tilesSplit++;
      for (const child of splitTile(tile)) queue.push({ tile: child, q, includeServiceArea: false });
      if (includeServiceArea && !enqueueTypeSlices(tile, q, true, places)) {
        saturatedServiceArea.push({ term: q.term, tile: tile.id });
      }
    } else if (!enqueueTypeSlices(tile, q, includeServiceArea, places)) {
      recordSaturation(tile, q, includeServiceArea, null);
    }
  }

  if (done % CACHE_FLUSH_EVERY === 0) {
    process.stdout.write(
      `\r  processed ${done} pairs (split ${tilesSplit}, search calls ${searchBillableCalls}, cache ${fromCache}, queued ${queue.length})…`,
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

function finalizeRecord(r) {
  const { matched_tiles, ...rest } = r;
  return {
    ...rest,
    matched_activities: [...r.matched_activities].sort(),
    matched_terms: [...r.matched_terms].sort(),
    matched_tile_count: matched_tiles.size,
    matched_tiers: [...r.matched_tiers].sort(),
    matched_modes: [...r.matched_modes].sort(),
    rental_signal: [...r.matched_tiers].some((t) => RENTAL_SIGNAL_TIERS.has(t)),
    likely_irrelevant: RETAIL_FLAG_TYPES.has(r.primary_type_raw), // ambiguous retail — deprioritize in triage
    types: r.types,
  };
}

function applyPlaceFields(rec, p) {
  rec.name = rec.name ?? p.displayName?.text ?? null;
  rec.website = rec.website ?? p.websiteUri ?? null;
  rec.source_url = rec.source_url ?? p.googleMapsUri ?? `https://www.google.com/maps/place/?q=place_id:${rec.place_id}`;
  rec.primary_type = rec.primary_type ?? p.primaryTypeDisplayName?.text ?? p.primaryType ?? null;
  rec.primary_type_raw = rec.primary_type_raw ?? p.primaryType ?? null;
  if ((!rec.types || rec.types.length === 0) && Array.isArray(p.types)) rec.types = p.types;
  rec.business_status = rec.business_status ?? p.businessStatus ?? null;
  rec.rating = rec.rating ?? p.rating ?? null;
  rec.user_rating_count = Math.max(rec.user_rating_count ?? 0, p.userRatingCount ?? 0);
  rec.phone = rec.phone ?? p.nationalPhoneNumber ?? null;
  rec.lat = rec.lat ?? p.location?.latitude ?? null;
  rec.lng = rec.lng ?? p.location?.longitude ?? null;
  rec.address = rec.address ?? p.formattedAddress ?? null;
  rec.pure_service_area_business = rec.pure_service_area_business || Boolean(p.pureServiceAreaBusiness);
}

const ops = new Map(); // place_id -> record
for (const { tile, q, includeServiceArea, includedType } of visited.values()) {
  const places = cache.searchPairs[searchKey(tile, q, includeServiceArea, includedType)] || [];
  for (const p of places) {
    if (!p.id) continue;
    let rec = ops.get(p.id);
    if (!rec) {
      rec = {
        place_id: p.id,
        name: null,
        website: null,
        source_url: null,
        primary_type: null,
        primary_type_raw: null,
        types: [],
        business_status: null,
        rating: null,
        user_rating_count: 0,
        phone: null,
        lat: null,
        lng: null,
        address: null,
        pure_service_area_business: false,
        matched_activities: new Set(),
        matched_terms: new Set(),
        matched_tiles: new Set(),
        matched_tiers: new Set(),
        matched_modes: new Set(),
        match_pairs: 0,
        last_verified: lastVerified,
      };
      ops.set(p.id, rec);
    }
    applyPlaceFields(rec, p);
    const meta = qByTerm.get(q.term);
    rec.matched_activities.add(meta.activity);
    rec.matched_terms.add(q.term);
    rec.matched_tiles.add(tile.id);
    rec.matched_tiers.add(meta.tier);
    // Flag-based, not pass-based: the merged service-area pass returns storefronts
    // too, so only a place Google marks pureServiceAreaBusiness is "service-area".
    rec.matched_modes.add(p.pureServiceAreaBusiness ? "service-area" : "standard");
    rec.match_pairs++;
  }
}

// Closed-business handling (business_status comes from the discovery field mask,
// so it's known before we spend on enrichment):
//   - CLOSED_PERMANENTLY: drop outright — a dead operator is not a Pass A lead,
//     and enriching it wastes a Place Details call.
//   - CLOSED_TEMPORARILY: keep (it may reopen) but skip enrichment; the row still
//     carries its discovery fields and the business_status flag for triage.
// Lodging-noise exclusion (also pre-enrichment): a place whose PRIMARY type is a
// home/room/hotel lodging type is a vacation rental / hotel that surfaced on a gear
// query, not a rental operator. Drop from the operator universe (retained in
// lodging_excluded_records for review) and skip its Place Details call.
for (const [id, rec] of ops) {
  if (rec.business_status === "CLOSED_PERMANENTLY") {
    closedRecords.push(finalizeRecord(rec));
    ops.delete(id);
    closedPermanentlyDropped++;
  } else if (rec.primary_type_raw && LODGING_NOISE_TYPES.has(rec.primary_type_raw)) {
    lodgingRecords.push(finalizeRecord(rec));
    ops.delete(id);
    lodgingExcluded++;
  } else if (rec.primary_type_raw && RETAIL_EXCLUDE_TYPES.has(rec.primary_type_raw)) {
    retailRecords.push(finalizeRecord(rec));
    ops.delete(id);
    retailExcluded++;
  }
}
const detailQueue = [...ops.keys()].filter((id) => {
  if (ops.get(id).business_status === "CLOSED_TEMPORARILY") {
    closedTemporarilySkipped++;
    return false;
  }
  return true;
});
let detailDone = 0;
await drainQueue(
  detailQueue,
  async (placeId) => {
    const key = detailsKey(placeId);
    let detail;
    if (!REFRESH && cache.placeDetails[key]) {
      detail = cache.placeDetails[key];
      detailsFromCache++;
    } else {
      try {
        detail = await fetchPlaceDetails(apiKey, placeId);
        cache.placeDetails[key] = detail;
        detailBillableCalls++;
      } catch (e) {
        detailErrors.push({ place_id: placeId, error: e.message });
        return;
      }
    }
    const rec = ops.get(placeId);
    if (rec) applyPlaceFields(rec, detail);
    detailDone++;
    if (detailDone % 50 === 0) {
      process.stdout.write(
        `\r  enriched ${detailDone}/${ops.size} places (detail calls ${detailBillableCalls}, cache ${detailsFromCache})…`,
      );
      flushCache();
    }
  },
  CONCURRENCY,
);
flushCache();
if (ops.size) console.log("");

const termStats = new Map(QUERIES.map((q) => [
  q.term,
  {
    term: q.term,
    activity: q.activity,
    season: q.season,
    tier: q.tier,
    unique_place_ids: new Set(),
    standard_place_ids: new Set(),
    service_area_place_ids: new Set(),
    service_area_net_new_ids: new Set(),
    appearances: 0,
    standard_pairs: 0,
    service_area_pairs: 0,
  },
]));
for (const { tile, q, includeServiceArea, includedType } of visited.values()) {
  const stat = termStats.get(q.term);
  if (!stat) continue;
  if (includeServiceArea) stat.service_area_pairs++;
  else stat.standard_pairs++;
  const places = cache.searchPairs[searchKey(tile, q, includeServiceArea, includedType)] || [];
  for (const p of places) {
    if (!p.id) continue;
    stat.appearances++;
    stat.unique_place_ids.add(p.id);
    // Cohort by the place's own pureServiceAreaBusiness flag, not by which pass
    // returned it: the merged service-area pass returns both storefronts and SABs,
    // so the flag is the only reliable storefront-vs-mobile split.
    if (p.pureServiceAreaBusiness) stat.service_area_place_ids.add(p.id);
    else stat.standard_place_ids.add(p.id);
  }
}
for (const stat of termStats.values()) {
  // standard/service-area cohorts are now disjoint (flag-based), so every SAB is
  // net-new vs storefronts — kept for output-shape stability.
  for (const id of stat.service_area_place_ids) {
    if (!stat.standard_place_ids.has(id)) stat.service_area_net_new_ids.add(id);
  }
}

// Finalize: sets -> sorted arrays, add triage-priority signal, sort by prominence.
const records = [...ops.values()]
  .map(finalizeRecord)
  .sort(
    (a, b) =>
      Number(b.rental_signal) - Number(a.rental_signal) ||
      b.user_rating_count - a.user_rating_count ||
      (b.rating ?? 0) - (a.rating ?? 0),
  );

// Flag near-duplicates (NOT merge). Walk in prominence order so the most-prominent
// listing becomes the primary and later listings point back to it. A record is a
// possible dup of a prior primary when they share a website host AND (same name OR
// within ~75m), or share a normalized name AND are within ~75m — corroboration on
// two axes keeps franchises (same host, different branch/name/location) from being
// flagged against each other.
const DUP_DISTANCE_KM = 0.075; // ~75m
let possibleDuplicates = 0;
const primariesByHost = new Map();  // host -> [primary]
const primariesByName = new Map();  // normName -> [primary]
for (const r of records) {
  r.possible_duplicate_of = null;
  const host = hostOf(r.website);
  const name = normName(r.name);
  const candidates = new Set([...(primariesByHost.get(host) || []), ...(primariesByName.get(name) || [])]);
  for (const c of candidates) {
    const sameHost = host && c.host === host;
    const sameName = name && c.name === name;
    const near = distanceKm(r.lat, r.lng, c.lat, c.lng) <= DUP_DISTANCE_KM;
    if ((sameHost && (sameName || near)) || (sameName && near)) {
      r.possible_duplicate_of = c.place_id;
      break;
    }
  }
  if (r.possible_duplicate_of) {
    possibleDuplicates++;
    continue; // a flagged dup is not itself a primary target
  }
  const primary = { place_id: r.place_id, host, name, lat: r.lat, lng: r.lng };
  if (host) (primariesByHost.get(host) || primariesByHost.set(host, []).get(host)).push(primary);
  if (name) (primariesByName.get(name) || primariesByName.set(name, []).get(name)).push(primary);
}

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
      service_area_terms: SERVICE_AREA_TERMS.size,
      cache_versions: {
        search: SEARCH_CACHE_VERSION,
        details: DETAILS_CACHE_VERSION,
      },
      field_masks: {
        text_search_discovery: DISCOVERY_FIELD_MASK,
        place_details_enrichment: DETAILS_FIELD_MASK,
      },
      tiles_visited: visited.size,
      tiles_split: tilesSplit,
      type_sliced_tiles: typeSlicedTiles,       // floor tiles re-queried per includedType
      type_slices: typeSlices,                  // total typed slice sub-queries
      saturated_at_min_cell: saturatedAtMin,    // (term,tile[,includedType]) still at 60 at the floor — residual truncation, if any
      saturated_service_area: saturatedServiceArea, // service-area (term,tile) at cap — NOT subdivided (mobile operators have no point to partition)
      closed_permanently_dropped: closedPermanentlyDropped,
      closed_temporarily_skipped: closedTemporarilySkipped,
      closed_records: closedRecords.sort((a, b) => (a.name || "").localeCompare(b.name || "")),
      lodging_excluded: lodgingExcluded, // vacation-rental/hotel noise dropped pre-enrichment (primary-type match)
      lodging_excluded_records: lodgingRecords.sort((a, b) => (a.name || "").localeCompare(b.name || "")),
      retail_excluded: retailExcluded, // big-box/unrelated retail dropped pre-enrichment (primary-type match)
      retail_excluded_records: retailRecords.sort((a, b) => (a.name || "").localeCompare(b.name || "")),
      likely_irrelevant_flagged: records.filter((r) => r.likely_irrelevant).length, // ambiguous retail kept but flagged
      text_search_calls_this_run: searchBillableCalls,
      place_details_calls_this_run: detailBillableCalls,
      search_pairs_from_cache: fromCache,
      place_details_from_cache: detailsFromCache,
      errors,
      detail_errors: detailErrors,
      operator_count: records.length,
      possible_duplicates: possibleDuplicates, // flagged via possible_duplicate_of, not merged
      unique_operator_estimate: records.length - possibleDuplicates,
      term_contribution: [...termStats.values()]
        .map((s) => ({
          term: s.term,
          activity: s.activity,
          season: s.season,
          tier: s.tier,
          search_pairs: s.standard_pairs + s.service_area_pairs,
          standard_pairs: s.standard_pairs,
          service_area_pairs: s.service_area_pairs,
          appearances: s.appearances,
          unique_places: s.unique_place_ids.size,
          service_area_unique_places: s.service_area_place_ids.size,
          service_area_net_new_places: s.service_area_net_new_ids.size,
        }))
        .sort((a, b) => b.unique_places - a.unique_places || b.service_area_net_new_places - a.service_area_net_new_places),
      // Explicit handoff for run_gate_ladder.mjs. The visible operator list is
      // intentionally pre-cleaned for enrichment cost, but the ladder should be
      // able to audit every row the sweep classified or set aside.
      gate_ladder_input_records: [
        ...records.map((r) => ({ ...r, sweep_cohort: "operators" })),
        ...closedRecords.map((r) => ({ ...r, sweep_cohort: "closed_records" })),
        ...lodgingRecords.map((r) => ({ ...r, sweep_cohort: "lodging_excluded_records" })),
      ],
      operators: records,
    },
    null,
    2,
  ),
);

const cols = [
  "place_id", "name", "rental_signal", "matched_tiers", "matched_activities",
  "match_pairs", "rating", "user_rating_count", "business_status", "primary_type",
  "website", "source_url", "phone", "address", "lat", "lng", "pure_service_area_business",
  "matched_tile_count", "matched_terms", "matched_modes", "last_verified",
  "possible_duplicate_of", "likely_irrelevant",
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
const pureServiceArea = records.filter((r) => r.pure_service_area_business).length;
console.log(`Done. ${records.length} operators discovered (${possibleDuplicates} flagged as possible duplicates → ~${records.length - possibleDuplicates} unique).`);
console.log(`  ${visited.size} search pairs visited (${tilesSplit} split on a cap hit, ${typeSlicedTiles} cells type-sliced into ${typeSlices} sub-queries).`);
console.log(`  Text Search calls this run: ${searchBillableCalls} (${fromCache} pairs from cache).`);
console.log(`  Place Details calls this run: ${detailBillableCalls} (${detailsFromCache} details from cache).`);
if (closedPermanentlyDropped || closedTemporarilySkipped) {
  console.log(`  Dropped ${closedPermanentlyDropped} permanently-closed; skipped enrichment on ${closedTemporarilySkipped} temporarily-closed.`);
}
if (lodgingExcluded) {
  console.log(`  Excluded ${lodgingExcluded} lodging/vacation-rental noise (primary-type match; see JSON.lodging_excluded_records).`);
}
if (retailExcluded) {
  console.log(`  Excluded ${retailExcluded} big-box/unrelated retail (primary-type match; see JSON.retail_excluded_records).`);
}
const flaggedIrrelevant = records.filter((r) => r.likely_irrelevant).length;
if (flaggedIrrelevant) {
  console.log(`  Flagged ${flaggedIrrelevant} likely-irrelevant (ambiguous retail kept for triage — see CSV.likely_irrelevant).`);
}
console.log(`  ${withSignal} with a rental-type signal (core/gap) — Pass A triage priority.`);
console.log(`  ${withWebsite} have a website (needed for Pass B).`);
console.log(`  ${pureServiceArea} marked pure service-area by Google (mobile/delivery operators, no storefront).`);
if (saturatedServiceArea.length) {
  console.log(`  ${saturatedServiceArea.length} service-area (term,tile) at the 60 cap — not subdivided (mobile operators have no point to partition); see JSON.saturated_service_area.`);
}
if (saturatedAtMin.length) {
  console.log(`  ${saturatedAtMin.length} (term,tile) still at the 60 cap after type-slicing at the ${GRID_CONFIG.minCellKm}km floor — residual truncation (see JSON.saturated_at_min_cell; lower minCellKm for these cells).`);
}
if (errors.length) console.log(`  ${errors.length} pair(s) errored — rerun to retry, see JSON.errors.`);
if (detailErrors.length) console.log(`  ${detailErrors.length} detail enrichment error(s) — rerun to retry, see JSON.detail_errors.`);
console.log(`\nJSON: ${jsonPath}\nCSV:  ${csvPath}\nCache: ${cachePath}`);
