/**
 * Pass A — operator-discovery sweep config for the Reno/Tahoe basin.
 *
 * This file is DATA ONLY (no API calls, no cost). It defines:
 *   - SEARCH_CONFIG: pagination settings so every query pulls the full 60.
 *   - ANCHORS: 16 geographic search circles covering the red-circle AOI,
 *     sized so dense clusters stay under Google's 60-result-per-query cap.
 *   - QUERIES: the literal Places Text Search `textQuery` strings. Each
 *     recreational activity gets MULTIPLE phrasings on purpose — Google caps
 *     a single query at 60 results and ranks by relevance, so "ski rental",
 *     "ski shop", and "demo skis" each surface an overlapping-but-different
 *     slice of operators. More phrasings = more unique operators recovered.
 *
 * GOAL: maximum recall. Cost is explicitly NOT a constraint here (this sweep
 * runs rarely). Pull all 3 pages on every query, run every phrasing against
 * every anchor, then DEDUP ON place_id.
 *
 * Intended use (Pass A = operator existence + prominence only; gear inventory
 * comes from Pass B deep extraction off the live sites):
 *   for (anchor of ANCHORS)
 *     for (q of QUERIES)
 *       Places Text Search {
 *         textQuery: q.term,
 *         pageSize: SEARCH_CONFIG.pageSize,            // 20 = API max per page
 *         locationBias: { circle: { center:{anchor.lat,anchor.lng},
 *                                   radius: anchor.radius_m } },
 *       }
 *       -> while (nextPageToken && page < SEARCH_CONFIG.maxPages) refetch with
 *          { pageToken: nextPageToken }   // 3 pages × 20 = 60, Google's ceiling
 *       -> DEDUP ON place_id (overlapping radii AND overlapping phrasings WILL
 *          return the same operator many times — one operator, one row).
 */

// ---------------------------------------------------------------------------
// Pagination — get the full 60 per query, not just the first page of 20.
// Text Search (New) returns max 20 results/page and up to 3 pages (60 total)
// via nextPageToken. The runner MUST loop pageToken up to maxPages.
// ---------------------------------------------------------------------------
export const SEARCH_CONFIG = {
  pageSize: 20,          // Places Text Search (New) hard max per page
  maxPages: 3,           // 3 × 20 = 60 = Google's hard per-query ceiling
  rankPreference: "RELEVANCE", // RELEVANCE (not DISTANCE) so prominence ranks
};

// ---------------------------------------------------------------------------
// 16 anchors (lat, lng, radius). radius_m kept tight in dense clusters so a
// single query stays under the 60-result cap; wide only where supply is ~zero.
// ---------------------------------------------------------------------------
export const ANCHORS = [
  // Tier 1 — dense operator clusters (tight radius, cap protection)
  { id: "reno",            label: "Reno",                  lat: 39.5296, lng: -119.8138, radius_m: 12000, tier: 1 },
  { id: "sparks",          label: "Sparks",                lat: 39.5349, lng: -119.7527, radius_m: 10000, tier: 1 },
  { id: "verdi",           label: "Verdi",                 lat: 39.5180, lng: -120.0090, radius_m:  8000, tier: 1 },
  { id: "carson-city",     label: "Carson City",           lat: 39.1638, lng: -119.7674, radius_m: 10000, tier: 1 },
  { id: "gardnerville",    label: "Gardnerville/Minden",   lat: 38.9407, lng: -119.7513, radius_m:  9000, tier: 1 },
  { id: "south-lake-tahoe",label: "South Lake Tahoe",      lat: 38.9399, lng: -119.9772, radius_m: 10000, tier: 1 },
  { id: "tahoe-city",      label: "Tahoe City",            lat: 39.1677, lng: -120.1445, radius_m: 10000, tier: 1 },
  { id: "truckee",         label: "Truckee",               lat: 39.3280, lng: -120.1833, radius_m: 12000, tier: 1 },
  { id: "incline-village", label: "Incline Village",       lat: 39.2497, lng: -119.9527, radius_m:  8000, tier: 1 },
  { id: "kings-beach",     label: "Kings Beach",           lat: 39.2380, lng: -120.0263, radius_m:  6000, tier: 1 },
  // Tier 2 — resort / sparse corners (small anchors so they aren't dropped)
  { id: "donner-summit",   label: "Donner Summit",         lat: 39.3128, lng: -120.3303, radius_m:  8000, tier: 2 },
  { id: "kirkwood",        label: "Kirkwood",              lat: 38.6850, lng: -120.0656, radius_m:  8000, tier: 2 },
  { id: "zephyr-cove",     label: "Zephyr Cove/Stateline", lat: 39.0030, lng: -119.9430, radius_m:  6000, tier: 2 },
  { id: "virginia-city",   label: "Virginia City",         lat: 39.3097, lng: -119.6502, radius_m:  6000, tier: 2 },
  // Tier 3 — empty-zone sweeps (wide radius, rare-category insurance only)
  { id: "carson-valley-e", label: "Carson Valley/E fringe", lat: 39.1500, lng: -119.5500, radius_m: 18000, tier: 3 },
  { id: "hope-valley-s",   label: "Hope Valley/Hwy 88 S",   lat: 38.7800, lng: -119.9200, radius_m: 12000, tier: 3 },
];

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
  { term: "kayak rentals",                  activity: "kayak",       season: "summer", tier: "core" },
  { term: "kayak tours",                    activity: "kayak",       season: "summer", tier: "core" },
  { term: "paddleboard rental",             activity: "sup",         season: "summer", tier: "core" },
  { term: "stand up paddleboard rental",    activity: "sup",         season: "summer", tier: "core" },
  { term: "SUP rental",                     activity: "sup",         season: "summer", tier: "core" },
  { term: "canoe rental",                   activity: "canoe",       season: "summer", tier: "core" },
  { term: "boat rental",                    activity: "powerboat",   season: "summer", tier: "core" },
  { term: "motorboat rental",               activity: "powerboat",   season: "summer", tier: "core" },
  { term: "boat charter",                   activity: "powerboat",   season: "summer", tier: "core" },
  { term: "pontoon boat rental",            activity: "pontoon",     season: "summer", tier: "core" },
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
  { term: "wing foil rental",               activity: "wing-foil",   season: "summer", tier: "gap" },
  { term: "wing foiling lessons",           activity: "wing-foil",   season: "summer", tier: "gap" },
  { term: "wingsurf rental",                activity: "wing-foil",   season: "summer", tier: "gap" },
  { term: "efoil rental",                   activity: "efoil",       season: "summer", tier: "gap" },
  { term: "efoil lessons",                  activity: "efoil",       season: "summer", tier: "gap" },
  { term: "electric hydrofoil rental",      activity: "efoil",       season: "summer", tier: "gap" },
  { term: "foil board rental",              activity: "foil-surf",   season: "summer", tier: "gap" },
  { term: "hydrofoil surf lessons",         activity: "foil-surf",   season: "summer", tier: "gap" },

  // ---- SUMMER · RIVER ------------------------------------------------------
  { term: "whitewater rafting",             activity: "rafting",     season: "summer", tier: "experience" },
  { term: "river tubing rental",            activity: "river-tube",  season: "summer", tier: "core" },
  { term: "river float rental",             activity: "river-tube",  season: "summer", tier: "core" },

  // ---- SUMMER · LAND (human powered) --------------------------------------
  { term: "mountain bike rental",           activity: "mtb",         season: "summer", tier: "core" },
  { term: "mountain bike rentals",          activity: "mtb",         season: "summer", tier: "core" },
  { term: "downhill bike park rental",      activity: "mtb",         season: "summer", tier: "core" },
  { term: "bike rental",                    activity: "cycling",     season: "summer", tier: "core" },
  { term: "bicycle rental",                 activity: "cycling",     season: "summer", tier: "core" },
  { term: "bike shop",                      activity: "cycling",     season: "summer", tier: "core" },
  { term: "ebike rental",                   activity: "ebike",       season: "summer", tier: "core" },
  { term: "electric bike rental",           activity: "ebike",       season: "summer", tier: "core" },
  { term: "climbing gear rental",           activity: "climbing",    season: "summer", tier: "core" },
  { term: "guided rock climbing",           activity: "climbing",    season: "summer", tier: "experience" },
  { term: "camping gear rental",            activity: "camping",     season: "summer", tier: "core" },
  { term: "camping equipment rental",       activity: "camping",     season: "summer", tier: "core" },
  { term: "tent rental",                    activity: "camping",     season: "summer", tier: "core" },
  { term: "backpacking gear rental",        activity: "backpacking", season: "summer", tier: "core" },
  { term: "disc golf rental",               activity: "disc-golf",   season: "summer", tier: "core" },
  { term: "disc golf shop",                 activity: "disc-golf",   season: "summer", tier: "core" },

  // ---- SUMMER · MOTORIZED / OFF-ROAD --------------------------------------
  { term: "atv rental",                     activity: "atv",         season: "summer", tier: "core" },
  { term: "atv tours",                      activity: "atv",         season: "summer", tier: "experience" },
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
  { term: "fly fishing guide",              activity: "fly-fishing",     season: "all",    tier: "gap" },
  { term: "fly fishing outfitter",          activity: "fly-fishing",     season: "all",    tier: "gap" },
  { term: "fishing guide",                  activity: "fly-fishing",     season: "all",    tier: "gap" },
  { term: "fishing charter",                activity: "fishing-charter", season: "all",    tier: "gap" },
  { term: "lake fishing charter",           activity: "fishing-charter", season: "summer", tier: "gap" },
  { term: "fishing tackle shop",            activity: "fishing-gear",    season: "all",    tier: "gap" },
  { term: "bait and tackle shop",           activity: "fishing-gear",    season: "all",    tier: "gap" },
  { term: "ice fishing guide",              activity: "ice-fishing",     season: "winter", tier: "gap" },

  // ---- HUNTING (flagged gap) ----------------------------------------------
  { term: "hunting guide outfitter",        activity: "hunting",      season: "all",    tier: "gap" },
  { term: "guided hunts",                   activity: "hunting",      season: "all",    tier: "gap" },
  { term: "upland bird hunting guide",      activity: "bird-hunting", season: "all",    tier: "gap" },
  { term: "waterfowl hunting guide",        activity: "bird-hunting", season: "all",    tier: "gap" },
  { term: "archery pro shop",               activity: "archery",      season: "all",    tier: "gap" },
  { term: "archery range",                  activity: "archery",      season: "all",    tier: "gap" },

  // ---- WINTER · SNOW -------------------------------------------------------
  { term: "ski rental",                     activity: "alpine-ski",      season: "winter", tier: "core" },
  { term: "ski rentals",                    activity: "alpine-ski",      season: "winter", tier: "core" },
  { term: "ski shop",                       activity: "alpine-ski",      season: "winter", tier: "core" },
  { term: "demo ski rental",                activity: "alpine-ski",      season: "winter", tier: "core" },
  { term: "snowboard rental",               activity: "snowboard",       season: "winter", tier: "core" },
  { term: "snowboard rentals",              activity: "snowboard",       season: "winter", tier: "core" },
  { term: "snowboard shop",                 activity: "snowboard",       season: "winter", tier: "core" },
  { term: "cross country ski rental",       activity: "nordic-ski",      season: "winter", tier: "core" },
  { term: "nordic ski center",              activity: "nordic-ski",      season: "winter", tier: "core" },
  { term: "backcountry ski rental",         activity: "backcountry-ski", season: "winter", tier: "core" },
  { term: "alpine touring ski rental",      activity: "backcountry-ski", season: "winter", tier: "core" },
  { term: "splitboard rental",              activity: "backcountry-ski", season: "winter", tier: "core" },
  { term: "snowshoe rental",                activity: "snowshoe",        season: "winter", tier: "core" },
  { term: "snowshoe rentals",               activity: "snowshoe",        season: "winter", tier: "core" },
  { term: "avalanche safety gear rental",   activity: "avy-gear",        season: "winter", tier: "gap"  },
  { term: "avalanche beacon rental",        activity: "avy-gear",        season: "winter", tier: "gap"  },
  { term: "snowmobile rental",              activity: "snowmobile",      season: "winter", tier: "core" },
  { term: "snowmobile tours",               activity: "snowmobile",      season: "winter", tier: "experience" },
  { term: "snow tubing",                    activity: "snow-tube",       season: "winter", tier: "experience" },
  { term: "sledding hill",                  activity: "snow-tube",       season: "winter", tier: "experience" },
  { term: "fat bike rental",                activity: "fat-bike",        season: "winter", tier: "gap"  },
  { term: "ice skating rink",               activity: "ice-skate",       season: "winter", tier: "experience" },
  { term: "ice skate rental",               activity: "ice-skate",       season: "winter", tier: "core" },
  { term: "ice climbing guide",             activity: "ice-climb",       season: "winter", tier: "experience" },
];

export const QUERY_TERMS = QUERIES.map((q) => q.term);
