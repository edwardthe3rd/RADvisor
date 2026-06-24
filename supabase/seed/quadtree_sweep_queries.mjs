/**
 * Pass A — operator-discovery sweep config for the Reno/Tahoe basin.
 *
 * This file is DATA ONLY (no API calls, no cost). It defines:
 *   - SEARCH_CONFIG: pagination (full 60/query) + DISTANCE ranking.
 *   - SERVICE_AREA_TERMS: narrow query set that uses the merged
 *     includePureServiceAreaBusinesses seed pass for mobile/delivery operators.
 *   - AOI_RECTS / GRID_CONFIG / seedTiles() / splitTile() / tileKm(): the v2
 *     coverage geometry — continuous rectangle corridors, one seed grid over
 *     their union, and the adaptive-quadtree split the runner uses on a cap hit.
 *     THIS is what drives the sweep (see the COVERAGE GEOMETRY block below).
 *   - QUERIES: the literal Places Text Search `textQuery` strings, one phrasing
 *     per activity slice. (v1 carried several redundant phrasings per activity to
 *     work around the 60-result cap; the quadtree now beats the cap geometrically,
 *     so those were pruned — subdivide space, don't multiply phrasings.)
 *
 * GOAL: maximum recall with no region bleed. Cost is NOT the primary constraint
 * (this sweep runs rarely), so preview coverage.geojson and check --dry-run
 * before a live run.
 *
 * Intended use (Pass A = operator existence + prominence only; gear inventory
 * comes from Pass B deep extraction off the live sites):
 *   for (tile of seedTiles())
 *     for (q of QUERIES)
 *       Places Text Search {
 *         textQuery: q.term,
 *         pageSize: SEARCH_CONFIG.pageSize,            // 20 = API max per page
 *         rankPreference: "DISTANCE",
 *         locationRestriction: { rectangle: { low: tile.low, high: tile.high } },
 *       }
 *       -> while (nextPageToken && page < SEARCH_CONFIG.maxPages) refetch with
 *          { pageToken: nextPageToken }   // 3 pages × 20 = 60, Google's ceiling
 *       -> on a 60 cap hit, splitTile(tile) into 4 quadrants and recurse until
 *          under the cap or below GRID_CONFIG.minCellKm
 *       -> DEDUP ON place_id (overlapping tiles WILL return the same operator
 *          many times — one operator, one row).
 */

// ---------------------------------------------------------------------------
// Pagination — get the full 60 per query, not just the first page of 20.
// Text Search (New) returns max 20 results/page and up to 3 pages (60 total)
// via nextPageToken. The runner MUST loop pageToken up to maxPages.
// ---------------------------------------------------------------------------
export const SEARCH_CONFIG = {
  pageSize: 20,          // Places Text Search (New) hard max per page
  maxPages: 3,           // 3 × 20 = 60 = Google's hard per-query ceiling
  // DISTANCE (not RELEVANCE): paired with a rectangle locationRestriction, this
  // returns the 60 NEAREST within the tile, so any tile holding < 60 matches
  // yields ALL of them. RELEVANCE would instead cut the obscure local long tail.
  rankPreference: "DISTANCE",
};

// Targeted terms for businesses that serve/deliver to customers but may not
// expose a storefront location. Each term here uses the merged
// includePureServiceAreaBusinesses seed query instead of a separate standard
// seed query; storefront subdivision later drops the flag.
export const SERVICE_AREA_TERMS = new Set([
  "kayak rental",
  "paddleboard rental",
  "canoe rental",
  "boat rental",
  "motorboat rental",
  "pontoon rental",
  "jet ski rental",
  "waverunner rental",
  "personal watercraft rental",
  "watersports rental",
  "efoil rental",
  "foil board rental",
  "river tubing rental",
  "river float rental",
  "mountain bike rental",
  "bike rental",
  "ebike rental",
  "camping gear rental",
  "tent rental",
  "backpacking gear rental",
  "atv rental",
  "quad rental",
  "utv rental",
  "side by side rental",
  "rzr rental",
  "off road jeep rental",
  "4x4 rental",
  "overland vehicle rental",
  "dirt bike rental",
  "ski rental",
  "snowboard rental",
  "cross country ski rental",
  "backcountry ski rental",
  "alpine touring ski rental",
  "splitboard rental",
  "snowshoe rental",
  "avalanche safety gear rental",
  "snowmobile rental",
  "fat bike rental",
  "ice skate rental",
  "mountaineering gear rental",
]);

// ---------------------------------------------------------------------------
// Query terms — MULTIPLE phrasings per activity for maximum recall.
// activity = canonical slug (carry onto each result row so you know which
//            activity surfaced the operator; same slug repeats across phrasings).
// season   = "summer" | "winter" | "all"
// tier     = "core" (rental shops) | "gap" (previously-missed: foil, hunting,
//            fishing, avy, fat bike) | "experience" (guided/charter — kept in
//            Pass A for a complete universe, flagged in Pass B as not-gear-rental)
// ---------------------------------------------------------------------------
export const QUERIES = [
  // ---- CATCH-ALL SHOP TERMS -----------------------------------------------
  { term: "outdoor gear rental",            activity: "gear-shop",   season: "all",    tier: "core" },
  { term: "outdoor equipment rental",       activity: "gear-shop",   season: "all",    tier: "core" },
  { term: "sporting goods store",           activity: "gear-shop",   season: "all",    tier: "core" },
  { term: "adventure outfitter",            activity: "outfitter",   season: "all",    tier: "core" },
  { term: "guide service outfitter",        activity: "outfitter",   season: "all",    tier: "core" },

  // ---- SUMMER · LAKE & FLATWATER ------------------------------------------
  { term: "kayak rental",                   activity: "kayak",       season: "summer", tier: "core" },
  { term: "kayak tours",                    activity: "kayak",       season: "summer", tier: "core" },
  { term: "paddleboard rental",             activity: "sup",         season: "summer", tier: "core" },
  { term: "canoe rental",                   activity: "canoe",       season: "summer", tier: "core" },
  { term: "boat rental",                    activity: "powerboat",   season: "summer", tier: "core" },
  { term: "motorboat rental",               activity: "powerboat",   season: "summer", tier: "core" },
  { term: "boat charter",                   activity: "powerboat",   season: "summer", tier: "core" },
  { term: "pontoon rental",                 activity: "pontoon",     season: "summer", tier: "core" },
  { term: "jet ski rental",                 activity: "pwc",         season: "summer", tier: "core" },
  { term: "waverunner rental",              activity: "pwc",         season: "summer", tier: "core" },
  { term: "personal watercraft rental",     activity: "pwc",         season: "summer", tier: "core" },
  { term: "watersports rental",             activity: "watersports", season: "summer", tier: "core" },
  { term: "lake toy rental",                activity: "watersports", season: "summer", tier: "core" },
  { term: "sailboat rental",                activity: "sailing",     season: "summer", tier: "core" },
  { term: "catamaran rental",               activity: "sailing",     season: "summer", tier: "core" },
  { term: "windsurfing rental",             activity: "windsurf",    season: "summer", tier: "core" },
  { term: "kiteboarding rental",            activity: "kiteboard",   season: "summer", tier: "core" },
  { term: "scuba diving",                   activity: "scuba",       season: "summer", tier: "experience" },
  { term: "dive shop",                      activity: "scuba",       season: "summer", tier: "core" },
  { term: "wakeboard boat rental",          activity: "wakeboard",   season: "summer", tier: "core" },
  { term: "ski boat rental",                activity: "wakeboard",   season: "summer", tier: "core" },

  // ---- SUMMER · FOIL (flagged gap) ----------------------------------------
  { term: "efoil rental",                   activity: "efoil",       season: "summer", tier: "gap" },
  { term: "foil board rental",              activity: "foil-surf",   season: "summer", tier: "gap" },

  // ---- SUMMER · RIVER ------------------------------------------------------
  { term: "whitewater rafting",             activity: "rafting",     season: "summer", tier: "experience" },
  { term: "river tubing rental",            activity: "river-tube",  season: "summer", tier: "core" },
  { term: "river float rental",             activity: "river-tube",  season: "summer", tier: "core" },

  // ---- SUMMER · LAND (human powered) --------------------------------------
  { term: "mountain bike rental",           activity: "mtb",         season: "summer", tier: "core" },
  { term: "downhill bike park rental",      activity: "mtb",         season: "summer", tier: "core" },
  { term: "bike rental",                    activity: "cycling",     season: "summer", tier: "core" },
  { term: "bike shop",                      activity: "cycling",     season: "summer", tier: "core" },
  { term: "ebike rental",                   activity: "ebike",       season: "summer", tier: "core" },
  { term: "climbing gear rental",           activity: "climbing",    season: "summer", tier: "core" },
  { term: "camping gear rental",            activity: "camping",     season: "summer", tier: "core" },
  { term: "tent rental",                    activity: "camping",     season: "summer", tier: "core" },
  { term: "backpacking gear rental",        activity: "backpacking", season: "summer", tier: "core" },
  { term: "disc golf rental",               activity: "disc-golf",   season: "summer", tier: "core" },

  // ---- SUMMER · MOTORIZED / OFF-ROAD --------------------------------------
  { term: "atv rental",                     activity: "atv",         season: "summer", tier: "core" },
  { term: "quad rental",                    activity: "atv",         season: "summer", tier: "core" },
  { term: "utv rental",                     activity: "utv",         season: "summer", tier: "core" },
  { term: "side by side rental",            activity: "utv",         season: "summer", tier: "core" },
  { term: "rzr rental",                     activity: "utv",         season: "summer", tier: "core" },
  { term: "off road jeep rental",           activity: "offroad-4x4", season: "summer", tier: "core" },
  { term: "4x4 rental",                     activity: "offroad-4x4", season: "summer", tier: "core" },
  { term: "overland vehicle rental",        activity: "offroad-4x4", season: "summer", tier: "core" },
  { term: "dirt bike rental",               activity: "dirtbike",    season: "summer", tier: "core" },
  { term: "motocross bike rental",          activity: "dirtbike",    season: "summer", tier: "core" },

  // ---- FISHING (flagged gap) ----------------------------------------------
  { term: "fly fishing outfitter",          activity: "fly-fishing",     season: "all",    tier: "gap" },
  { term: "fishing charter",                activity: "fishing-charter", season: "all",    tier: "gap" },
  { term: "fishing bait and tackle shop",   activity: "fishing-gear",    season: "all",    tier: "gap" },

  // ---- HUNTING (flagged gap) ----------------------------------------------
  { term: "hunting guide outfitter",        activity: "hunting",      season: "all",    tier: "gap" },
  { term: "archery pro shop",               activity: "archery",      season: "all",    tier: "gap" },
  { term: "archery range",                  activity: "archery",      season: "all",    tier: "gap" },

  // ---- WINTER · SNOW -------------------------------------------------------
  { term: "ski rental",                     activity: "alpine-ski",      season: "winter", tier: "core" },
  { term: "ski shop",                       activity: "alpine-ski",      season: "winter", tier: "core" },
  { term: "snowboard rental",               activity: "snowboard",       season: "winter", tier: "core" },
  { term: "snowboard shop",                 activity: "snowboard",       season: "winter", tier: "core" },
  { term: "cross country ski rental",       activity: "nordic-ski",      season: "winter", tier: "core" },
  { term: "nordic ski center",              activity: "nordic-ski",      season: "winter", tier: "core" },
  { term: "backcountry ski rental",         activity: "backcountry-ski", season: "winter", tier: "core" },
  { term: "alpine touring ski rental",      activity: "backcountry-ski", season: "winter", tier: "core" },
  { term: "splitboard rental",              activity: "backcountry-ski", season: "winter", tier: "core" },
  { term: "snowshoe rental",                activity: "snowshoe",        season: "winter", tier: "core" },
  { term: "avalanche safety gear rental",   activity: "avy-gear",        season: "winter", tier: "gap"  },
  { term: "snowmobile rental",              activity: "snowmobile",      season: "winter", tier: "core" },
  { term: "snow tube rental",               activity: "snow-tube",       season: "winter", tier: "experience" },
  { term: "sled rental",                    activity: "snow-tube",       season: "winter", tier: "experience" },
  { term: "fat bike rental",                activity: "fat-bike",        season: "winter", tier: "gap"  },
  { term: "ice skate rental",               activity: "ice-skate",       season: "winter", tier: "core" },
  { term: "mountaineering gear rental",     activity: "ice-climb",       season: "winter", tier: "core" },
];

// ===========================================================================
// COVERAGE GEOMETRY (Pass A v2 — rectangle restriction + adaptive quadtree)
//
// Each query is HARD-RESTRICTED to a rectangle (Places Text Search New only
// supports `rectangle` for locationRestriction) and ranked by DISTANCE, so a tile
// holding < 60 matches returns ALL of them — no region bleed (v1's circle
// locationBias is what pulled in Las Vegas / LAX). AOI_RECTS define continuous coverage
// corridors (no gaps between them by construction); seedTiles() lays a single
// grid over their union; splitTile() is the quadtree step the runner uses when a
// (tile, term) hits the 60 cap. This block is DATA ONLY — no API calls, no cost.
// ===========================================================================

// Continuous coverage corridors over the Reno-Tahoe basin. Each is a lat/lng
// box {low:SW, high:NE}. They overlap on purpose so the union has NO interior
// gaps, spanning every operator cluster plus the connective terrain between them.
export const AOI_RECTS = [
  // Reno / Carson / Minden US-395 spine (+ Virginia City, Carson Valley east insurance)
  { id: "spine-395",   label: "Reno-Carson-Minden spine", low: { lat: 38.85, lng: -120.11 }, high: { lat: 39.86, lng: -119.34 } },
  // Lake Tahoe basin + Truckee / Donner
  { id: "tahoe-basin", label: "Tahoe basin + Truckee",    low: { lat: 38.85, lng: -120.44 }, high: { lat: 39.45, lng: -119.86 } },
  // Hwy 88 south spur (Kirkwood / Hope Valley)
  { id: "hwy88-south", label: "Hwy 88 south spur",        low: { lat: 38.61, lng: -120.16 }, high: { lat: 38.89, lng: -119.78 } },
];

// ---------------------------------------------------------------------------
// AOI_EXCLUDE — sparse-margin trims (added 2026-06-22 from map review). A seed
// tile whose CENTER lands in any of these boxes is dropped before billing, to
// cut cost on low-supply periphery. Dense cells are deliberately preserved (the
// bands skip the Truckee/Donner row and the Tahoe/Reno core).
// Edit these boxes to widen/narrow the trim; preview via quadtree_sweep_coverage.mjs.
//   trim-north       : drop the two northernmost rows above the Reno cluster
//                      (Reno North + Spanish Springs).
//   trim-east        : drop the eastern desert columns (Stagecoach / Carson
//                      Valley E-fringe).
//   trim-nw-col2     : drop the NW corner cells above Reno / NW of Verdi (col2, rows 7-9).
//   trim-sw-low      : drop the SW forest below Tahoe City (col0-1, rows 2-3).
//   trim-w-col0      : drop the far-west forest beside Tahoe City (col0 only, rows 4-5);
//                      col1 here is KEPT (lake/west-shore approach).
//   trim-west-upper  : drop the western forest above Tahoe City — band stops short
//                      of Truckee's row so Truckee + Donner Summit stay in.
//   trim-markleeville: drop the S tip of the Hwy-88 spur (Markleeville, col4 row0).
//   trim-spur-col3   : drop the spur cell right of Kirkwood (col3, row0).
//   trim-spur-col4   : drop the spur cell above Markleeville (col4, row1). Kirkwood
//                      + Hope Valley core stay in.
// ---------------------------------------------------------------------------
export const AOI_EXCLUDE = [
  { id: "trim-north",        low: { lat: 39.6952, lng: -120.45 },  high: { lat: 39.86,   lng: -119.33 } },
  { id: "trim-east",         low: { lat: 38.80,   lng: -119.605 }, high: { lat: 39.6952, lng: -119.33 } },
  { id: "trim-nw-col2",      low: { lat: 39.3697, lng: -120.1617 }, high: { lat: 39.6952, lng: -120.0225 } },
  { id: "trim-sw-low",       low: { lat: 38.80,   lng: -120.45 },  high: { lat: 39.044,  lng: -120.1617 } },
  { id: "trim-w-col0",       low: { lat: 39.044,  lng: -120.45 },  high: { lat: 39.262,  lng: -120.3008 } },
  { id: "trim-west-upper",   low: { lat: 39.3697, lng: -120.45 },  high: { lat: 39.4782, lng: -120.1617 } },
  { id: "trim-markleeville", low: { lat: 38.61,   lng: -119.8833 }, high: { lat: 38.7185, lng: -119.7441 } },
  { id: "trim-spur-col3",    low: { lat: 38.61,   lng: -120.0225 }, high: { lat: 38.7185, lng: -119.8833 } },
  { id: "trim-spur-col4",    low: { lat: 38.7185, lng: -119.8833 }, high: { lat: 38.827,  lng: -119.7441 } },
];

export const GRID_CONFIG = {
  seedCellKm: 12,    // edge length of the initial (coarse) grid cells
  minCellKm: 0.75,   // quadtree floor — stop subdividing below this even if still at cap
  capThreshold: 60,  // Google's hard per-query ceiling; hitting it == "there is more here"
};

const KM_PER_DEG_LAT = 110.574;
const kmPerDegLng = (lat) => 111.320 * Math.cos((lat * Math.PI) / 180);

const rectsIntersect = (aS, aN, aW, aE, bS, bN, bW, bE) =>
  aS < bN && aN > bS && aW < bE && aE > bW;

/**
 * Lay ONE grid (cellKm edge) over the bounding box of `rects`, keeping only the
 * cells that intersect at least one corridor. Returns rectangle tiles:
 *   { id, low:{lat,lng}, high:{lat,lng} }
 * One coherent grid (not per-corridor) so overlap zones don't double-tile.
 */
export function seedTiles(rects = AOI_RECTS, cellKm = GRID_CONFIG.seedCellKm) {
  const latS = Math.min(...rects.map((r) => r.low.lat));
  const latN = Math.max(...rects.map((r) => r.high.lat));
  const lngW = Math.min(...rects.map((r) => r.low.lng));
  const lngE = Math.max(...rects.map((r) => r.high.lng));

  const dLat = cellKm / KM_PER_DEG_LAT;
  const dLng = cellKm / kmPerDegLng((latS + latN) / 2);

  const tiles = [];
  for (let i = 0; latS + i * dLat < latN; i++) {
    const cs = latS + i * dLat;
    const cn = Math.min(cs + dLat, latN);
    for (let j = 0; lngW + j * dLng < lngE; j++) {
      const cw = lngW + j * dLng;
      const ce = Math.min(cw + dLng, lngE);
      const hit = rects.some((r) =>
        rectsIntersect(cs, cn, cw, ce, r.low.lat, r.high.lat, r.low.lng, r.high.lng),
      );
      if (!hit) continue;
      // Sparse-margin trim: drop the cell if its center lands in an exclude box.
      const cLat = (cs + cn) / 2;
      const cLng = (cw + ce) / 2;
      const trimmed = AOI_EXCLUDE.some(
        (e) => cLat >= e.low.lat && cLat <= e.high.lat && cLng >= e.low.lng && cLng <= e.high.lng,
      );
      if (trimmed) continue;
      tiles.push({
        id: `${cs.toFixed(4)}_${cw.toFixed(4)}_${cn.toFixed(4)}_${ce.toFixed(4)}`,
        low: { lat: cs, lng: cw },
        high: { lat: cn, lng: ce },
      });
    }
  }
  return tiles;
}

/** Quadtree step: split a tile into its 4 quadrants (used when a query hits the cap). */
export function splitTile(t) {
  const midLat = (t.low.lat + t.high.lat) / 2;
  const midLng = (t.low.lng + t.high.lng) / 2;
  const mk = (low, high) => ({
    id: `${low.lat.toFixed(4)}_${low.lng.toFixed(4)}_${high.lat.toFixed(4)}_${high.lng.toFixed(4)}`,
    low,
    high,
  });
  return [
    mk({ lat: t.low.lat, lng: t.low.lng }, { lat: midLat, lng: midLng }),         // SW
    mk({ lat: t.low.lat, lng: midLng }, { lat: midLat, lng: t.high.lng }),        // SE
    mk({ lat: midLat, lng: t.low.lng }, { lat: t.high.lat, lng: midLng }),        // NW
    mk({ lat: midLat, lng: midLng }, { lat: t.high.lat, lng: t.high.lng }),       // NE
  ];
}

/** Edge length (km) of a tile's latitude span — the quadtree floor check. */
export function tileKm(t) {
  return (t.high.lat - t.low.lat) * KM_PER_DEG_LAT;
}
