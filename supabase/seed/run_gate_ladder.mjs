#!/usr/bin/env node
// RADvisor Gate Ladder (Gates 0-5) per instructions/extraction/00_general.md.
//
// Default mode is no-network and runs Gates 0-4 plus Gate 5 preflight
// (website field present). Add --gate5 to run the live HTTPS/site check.
//
// Outputs:
//   - sweep_gate_results.json
//   - sweep_gate_survivors.csv
//   - sweep_gate_needs_review.csv
//   - sweep_gate_lodging_review.csv
//   - sweep_gate_duplicate_review.csv
//   - sweep_gate_rejects.csv
//
// Recall policy: hard-reject only on strong evidence. Ambiguous rows are routed
// to needs_review so a real rental operator is not silently removed.

import fs from "node:fs";
import {
  AOI_RECTS,
  AOI_EXCLUDE,
  GRID_CONFIG,
  QUERIES,
  seedTiles,
} from "./quadtree_sweep_queries.mjs";

const SEED = new URL(".", import.meta.url).pathname;
const read = (f) => JSON.parse(fs.readFileSync(SEED + f, "utf8"));
const exists = (f) => fs.existsSync(SEED + f);

const RUN_GATE5 = process.argv.includes("--gate5");
const REFRESH_GATE5 = process.argv.includes("--refresh-gate5");
const PREVIEW = process.argv.includes("--preview") || process.argv.includes("--dry-run");
const TEST_FIXTURES = process.argv.includes("--test-fixtures");
const EXPLAIN_PLACE_ID = valueAfter("--explain");

const sweepJson = read("quadtree_sweep_operators.json");
const oldOps = read("operators.json");
const verified = read("operator_website_verified.json");
const gate5CachePath = "sweep_gate5_cache.json";
const fixturesPath = "gate_ladder_fixtures.json";
const gate5Cache = !REFRESH_GATE5 && exists(gate5CachePath) ? read(gate5CachePath) : {};

const AOI_EDGE_REVIEW_M = 2000;
const AOI_FAR_REJECT_M = 10000;
const SITE_TIMEOUT_MS = 10000;

const termMeta = new Map(QUERIES.map((q) => [q.term, q]));
const aoiTiles = seedTiles();

function valueAfter(flag) {
  const idx = process.argv.indexOf(flag);
  return idx >= 0 ? process.argv[idx + 1] : null;
}

const csvCell = (v) => {
  if (v === null || v === undefined) return "";
  const s = Array.isArray(v) ? v.join("; ") : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const writeCsv = (file, rows) => {
  const cols = [
    "rank",
    "status",
    "reason",
    "name",
    "website",
    "primary_type",
    "primary_type_raw",
    "business_status",
    "rating",
    "user_rating_count",
    "rental_signal",
    "matched_activities",
    "matched_terms",
    "matched_tiers",
    "matched_modes",
    "geo_zone",
    "aoi_distance_m",
    "review_lane",
    "dedup_note",
    "site_note",
    "possible_duplicate_of",
    "place_id",
    "source_url",
  ];
  const lines = [cols.join(",")];
  for (const row of rows) lines.push(cols.map((c) => csvCell(row[c])).join(","));
  fs.writeFileSync(SEED + file, lines.join("\n") + "\n");
};

const slugify = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const normNameCompact = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const normNameWords = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const normalizeHost = (host) => {
  if (!host) return null;
  return host.toLowerCase().replace(/^www\./, "");
};

const normDomain = (url) => {
  if (!url) return null;
  try {
    return normalizeHost(new URL(url).hostname);
  } catch {
    return normalizeHost(String(url).replace(/^https?:\/\//i, "").split("/")[0]);
  }
};

const domainMatches = (host, blocked) => host === blocked || host?.endsWith(`.${blocked}`);

const withUrlScheme = (url, scheme = "https") => {
  if (!url) return null;
  const raw = String(url).trim();
  if (!raw) return null;
  return /^https?:\/\//i.test(raw) ? raw : `${scheme}://${raw}`;
};

const haversine = (a, b, c, d) => {
  const R = 6371000;
  const t = Math.PI / 180;
  const dLat = (c - a) * t;
  const dLng = (d - b) * t;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a * t) * Math.cos(c * t) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

const kmPerDegLng = (lat) => 111320 * Math.cos((lat * Math.PI) / 180);

function rectDistanceMeters(lat, lng, rect) {
  const clampedLat = Math.max(rect.low.lat, Math.min(lat, rect.high.lat));
  const clampedLng = Math.max(rect.low.lng, Math.min(lng, rect.high.lng));
  const dLatM = (lat - clampedLat) * 110574;
  const dLngM = (lng - clampedLng) * kmPerDegLng((lat + clampedLat) / 2);
  return Math.sqrt(dLatM ** 2 + dLngM ** 2);
}

const pointInRect = (lat, lng, rect) =>
  lat >= rect.low.lat && lat <= rect.high.lat && lng >= rect.low.lng && lng <= rect.high.lng;

const pointInAny = (lat, lng, rects) => rects.some((rect) => pointInRect(lat, lng, rect));

function nearestAoi(lat, lng) {
  let best = { id: null, label: null, distance_m: Infinity };
  for (const rect of AOI_RECTS) {
    const distance_m = rectDistanceMeters(lat, lng, rect);
    if (distance_m < best.distance_m) {
      best = { id: rect.id, label: rect.label || rect.id, distance_m };
    }
  }
  return best;
}

function classifyAoi(o) {
  // Guard against null/empty coords: Number(null) === 0 (a finite value), which would
  // slip past the no-location check below and get measured against (0,0). Treat
  // null/undefined/"" as missing so such rows correctly route to no-location review.
  const lat = o.lat == null || o.lat === "" ? NaN : Number(o.lat);
  const lng = o.lng == null || o.lng === "" ? NaN : Number(o.lng);
  const serviceArea = Boolean(o.pure_service_area_business) || (o.matched_modes || []).includes("service-area");
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    if (serviceArea) {
      return {
        zone: "service_area_unknown_location",
        distance_m: null,
        reason: "gate0:service_area_no_storefront_location_allowed",
        note: "Pure service-area business; no storefront coordinates are expected, so later gates decide.",
      };
    }
    return {
      zone: "unknown_location",
      distance_m: null,
      status: "needs_review",
      reason: "gate0:no_location",
      note: "No storefront coordinates in Places payload.",
    };
  }

  const tile = aoiTiles.find((t) => pointInRect(lat, lng, t));
  const insideAoi = pointInAny(lat, lng, AOI_RECTS);
  const insideExcluded = pointInAny(lat, lng, AOI_EXCLUDE);
  const nearest = nearestAoi(lat, lng);
  const distance_m = Math.round(nearest.distance_m);

  if (insideAoi) {
    if (insideExcluded) {
      return {
        zone: "aoi_trimmed_margin",
        tile: tile?.id || null,
        nearest_aoi: nearest.id,
        distance_m: 0,
        status: "needs_review",
        reason: "gate0:aoi_trimmed_margin",
        note: "Inside AOI corridor but in a sparse-margin trim box.",
      };
    }

    if (tile) {
      return {
        zone: "covered_tile",
        tile: tile.id,
        nearest_aoi: nearest.id,
        distance_m: 0,
      };
    }

    return {
      zone: "aoi_gap",
      nearest_aoi: nearest.id,
      distance_m: 0,
      status: "needs_review",
      reason: "gate0:aoi_corridor_not_in_seed_tile",
      note: "Inside AOI corridors but outside the billed seed-tile coverage.",
    };
  }

  if (tile) {
    return {
      zone: "seed_tile_outside_aoi",
      tile: tile.id,
      nearest_aoi: nearest.id,
      distance_m,
      status: "needs_review",
      reason: "gate0:seed_tile_outside_aoi",
      note: "Inside a billed seed tile but outside the actual AOI corridor.",
    };
  }

  if (distance_m <= AOI_EDGE_REVIEW_M || serviceArea) {
    return {
      zone: serviceArea ? "service_area_outside_aoi" : "aoi_boundary",
      nearest_aoi: nearest.id,
      distance_m,
      status: "needs_review",
      reason: serviceArea ? "gate0:service_area_outside_aoi" : "gate0:near_aoi_boundary",
      note: `${Math.round(distance_m / 1000)}km outside ${nearest.id}.`,
    };
  }

  if (o.rental_signal && distance_m <= AOI_FAR_REJECT_M) {
    return {
      zone: "outside_aoi_rental_signal",
      nearest_aoi: nearest.id,
      distance_m,
      status: "needs_review",
      reason: "gate0:outside_aoi_rental_signal",
      note: `${Math.round(distance_m / 1000)}km outside ${nearest.id}; rental signal kept for review.`,
    };
  }

  return {
    zone: "far_outside_aoi",
    nearest_aoi: nearest.id,
    distance_m,
    status: "out_of_region",
    reason: "gate0:outside_aoi",
    note: `${Math.round(distance_m / 1000)}km outside ${nearest.id}.`,
  };
}

// HARD blocklist: unambiguous out-of-domain brands / business identities. A name
// match here is decisive on its own — the only thing that can override it is an
// unambiguously recreational Places category (see isRecCategory + gate1Reject).
const STRONG_NAME_BLOCK_HARD = [
  /u-?haul/i,
  /penske/i,
  /budget truck/i,
  /self[-\s]?storage/i,
  /storage unit/i,
  /box truck/i,
  /home depot/i,
  /sunbelt rentals/i,
  /united rentals/i,
  /\bahern\b/i,
  /herc rentals/i,
  /enterprise rent/i,
  /\bhertz\b/i,
  /\bavis\b/i,
  /\bbudget car/i,
  /\bturo\b/i,
  /\balamo\b/i,
  /\bdollar rent/i,
  /thrifty (car|rent)/i,
  /national car/i,
  /\bnumotion\b/i,
  /porta[-\s]?pott/i,
  /portable restroom/i,
  /photo booth/i,
  /bounce house/i,
  /bouncing around/i,
];

// SOFT blocklist: generic words that usually mean out-of-domain but CAN co-occur in a
// real recreation operator's name. A soft hit is downgraded to needs_review (not a hard
// reject) whenever the row carries a positive rec signal — a recreational Places category
// or a rec word in the name. This mirrors the tool/construction escape hatch below.
const STRONG_NAME_BLOCK_SOFT = [
  /scaffold/i,
  /\bbobcat\b/i,
  /\bbackhoe\b/i,
  /excavator/i,
  /skid steer/i,
  /linen/i,
  /catering/i,
  /medical supply/i,
  // NOTE: do NOT block a bare /mobility/ — electric_transport (e-bikes/e-scooters,
  // "personal mobility") is in scope. Only block the medical-mobility sense.
  /medical mobility|mobility (aid|scooter|equipment|solutions|medical)/i,
  /furniture rental/i,
  /appliance rental/i,
  /formalwear/i,
  /tuxedo/i,
  /costume/i,
  /dumpster/i,
];

// Unambiguously recreational Places categories. When Google itself classifies a row as
// one of these, a name-regex guess must NEVER hard-delete it — at most flag for review.
// Google's structured category is far less noisy than a name match. Keep this list to
// categories that are recreation-specific; generic ones ("Services", "Store") are excluded.
const REC_PRIMARY_RAW = new Set([
  "sporting_goods_store",
  "bicycle_store",
  "bicycle_repair_shop",
  "fishing_charter",
  "ski_resort",
  "marina",
  "sports_activity_location",
  "sports_school",
  "sports_club",
  "sports_complex",
  "golf_course",
  "ice_skating_rink",
  "canoe_and_kayak_rental_service",
  "boat_rental_service",
  "ski_rental_shop",
  "dive_shop",
  "surf_shop",
]);
const REC_PRIMARY_DISPLAY = /^(sporting goods store|bicycle (shop|store)|fishing charter|ski resort|marina|sports (activity location|school|club|complex)|golf course|ice skating rink|canoe & kayak rental( service)?|boat rental( service)?|ski rental( shop)?|dive shop|surf shop)$/i;
const isRecCategory = (o) =>
  REC_PRIMARY_RAW.has(o.primary_type_raw) || REC_PRIMARY_DISPLAY.test(o.primary_type || "");

// A genuine gear-rental SHOP name (not a vacation-home lease). Used as a recall safety
// valve so a lodging-categorized row that actually reads like a rental shop is reviewed,
// not auto-rejected.
const RENT_SHOP_NAME = /(ski|bike|board|snowboard|kayak|paddle|sup|boat|gear|equipment|raft)\s+rental|\boutfitter\b|rental shop|\brentals\b\s*(shop|store|co\b)/i;

const TOOL_CONSTRUCTION_RE = /\b(tool|construction|contractor|heavy|industrial|forklift|lift|generator|tractor|equipment)\b/i;
// Phrase-based (not bare single words) so it no longer trips on rec names that merely
// contain "event" or "table" (e.g. "Pool Table Services"), while still catching every
// real party/event-rental shop ("Party Rentals", "Event Rentals", "Tent Rental").
const PARTY_EVENT_RE = /party rental|event rental|tent rental|party suppl|event suppl|\bwedding\b|bounce house|photo booth|\b(tables?\s*(and|&|\/)\s*chairs?|chairs?\s*(and|&|\/)\s*tables?)\b/i;
const PASSENGER_CAR_RE = /\b(rent[-\s]?a[-\s]?car|car rental|passenger car|sedan|suv rental|airport rental)\b/i;
const POWERSPORTS_RE = /powersport|atv|utv|jeep|motorcycle|dirt bike|snowmobile|rzr|side by side|4x4|4wd|off[-\s]?road|overland/i;
const REC_NAME_SIGNAL = /boat|ski|snow|bike|kayak|paddle|watersport|marina|camp|outdoor|trail|climb|raft|atv|utv|jeep|snowmobile|surf|foil|dive|scuba|golf/i;
const FIREARM_NAME = /\b(gun|guns|firearm|firearms|arms|ammo|ammunition)\b/i;
const ARCHERY_NAME = /\b(archery|bows?|crossbows?|compound bow|recurve)\b/i;
const PUBLIC_RECREATION_SITE_NAME = /\b(disc golf course|bike park|trail|trailhead|athletic field|sports field|boat ramp|sno-?park)\b/i;
const DISC_GOLF_COURSE_NAME = /\bdisc golf course\b/i;

const DOMAIN_AGG_BLOCK = [
  "outdoorsy.com",
  "rvshare.com",
  "spinlister.com",
  "getmyboat.com",
  "yelp.com",
  "tripadvisor.com",
  "expedia.com",
  "viator.com",
  "airbnb.com",
  "vrbo.com",
  "booking.com",
  "redawning.com",
  "evolve.com",
];

const BOOKING_PLATFORM_DOMAINS = [
  "fareharbor.com",
  "peek.com",
  "peekpro.com",
  "rezdy.com",
  "checkfront.com",
  "xola.com",
  "bookeo.com",
  "bookwhen.com",
  "exploreorigin.com",
  "trytn.com",
  "trekksoft.com",
  "activitybridge.com",
  "lightspeedvt.com",
];

const AGG_NAME = /chamber of commerce|merchants association|visitor center|visitors bureau|riverwalk merchants/i;
const RENTAL_IN_NAME = /\brent(al|als|s)?\b|\bhire\b|outfitter/i;
const RV_ROADONLY = /\bRV\b|motorhome|class [abc]\b|fifth[-\s]?wheel|travel trailer|\bKOA\b/i;
const RV_OVERLAND = /4x4|4wd|awd|off[-\s]?road|overland|expedition|sportsmobile|storyteller|sprinter/i;
const POI_PRIMARY_RAW = new Set([
  "park",
  "state_park",
  "national_park",
  "tourist_attraction",
  "hiking_area",
  "beach",
  "visitor_center",
]);
const POI_PRIMARY_DISPLAY = /^(park|state park|national park|regional park|natural feature|hiking area|tourist attraction|beach|river|lake|national forest|scenic spot|rest stop)$/i;
const POI_NAME = /trailhead|sno-?park|wilderness|state recreation area|nature trail|staging area|boat ramp|scenic (overlook|view)|\bpeak\b|\bsummit\b(?! (sports|county))/i;
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
const NO_WEBSITE_RETAIL_NOISE_TYPES = new Set([
  "asian_grocery_store",
  "clothing_store",
  "discount_store",
  "gift_shop",
  "ice_cream_shop",
  "shoe_store",
  "thrift_store",
]);

const oldByDomain = new Map();
const oldByNameLoc = [];
for (const old of oldOps) {
  const host = normDomain(old.website);
  const entry = {
    name: old.name,
    nn: normNameCompact(old.name),
    words: normNameWords(old.name),
    lat: old.lat,
    lng: old.lng,
    host,
    slug: old.slug || slugify(old.name),
  };
  if (host) (oldByDomain.get(host) || oldByDomain.set(host, []).get(host)).push(entry);
  if (old.lat && old.lng) oldByNameLoc.push(entry);
}
const verifiedSlugs = new Set(Object.keys(verified));

function dedupMatch(o) {
  const host = normDomain(o.website);
  const slug = slugify(o.name);
  const nn = normNameCompact(o.name);
  const words = normNameWords(o.name);

  for (const old of oldByNameLoc) {
    const near = o.lat && o.lng && haversine(o.lat, o.lng, old.lat, old.lng) < 200;
    if (nn.length >= 8 && old.nn === nn && near) {
      return { level: "duplicate", by: `name+loc:${nn}` };
    }
  }

  if (verifiedSlugs.has(slug)) {
    return {
      level: "review",
      by: `verified-slug:${slug}`,
      note: "Slug was previously verified, but location/domain did not corroborate a same-operator duplicate.",
    };
  }

  const domainMatchesOld = host ? oldByDomain.get(host) || [] : [];
  if (domainMatchesOld.length) {
    for (const old of domainMatchesOld) {
      const sameName = words && old.words === words;
      const near = o.lat && o.lng && old.lat && old.lng && haversine(o.lat, o.lng, old.lat, old.lng) < 300;
      if (sameName || near) {
        return { level: "duplicate", by: `domain+${sameName ? "name" : "loc"}:${host}` };
      }
    }
    return {
      level: "review",
      by: `shared-domain:${host}`,
      note: "Website domain already exists, but name/location did not corroborate a duplicate.",
    };
  }

  return { level: "none" };
}

function loadInputRows() {
  const rows = [];
  const seen = new Set();
  const add = (items, sweep_cohort) => {
    for (const item of items || []) {
      const id = item.place_id || `${item.name}:${item.lat}:${item.lng}:${sweep_cohort}`;
      if (seen.has(id)) continue;
      seen.add(id);
      rows.push({ ...item, sweep_cohort: item.sweep_cohort || sweep_cohort });
    }
  };

  if (Array.isArray(sweepJson.gate_ladder_input_records)) {
    add(sweepJson.gate_ladder_input_records, "gate_ladder_input_records");
  } else {
    add(sweepJson.operators, "operators");
    add(sweepJson.closed_records, "closed_records");
    add(sweepJson.lodging_excluded_records, "lodging_excluded_records");
  }
  return rows;
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SITE_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal, redirect: "follow" });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchSite(url, method) {
  return fetchWithTimeout(url, {
    method,
    headers: {
      "User-Agent": "RADvisor seed gate ladder (+https://theradvisor.com)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
}

async function liveSiteCheck(rawUrl) {
  const firstUrl = withUrlScheme(rawUrl, "https");
  if (!firstUrl) {
    return { outcome: "missing", reason: "gate5:no_website_field", note: "No website field." };
  }
  const cacheKey = normDomain(firstUrl) || firstUrl;
  if (!REFRESH_GATE5 && gate5Cache[cacheKey]) return gate5Cache[cacheKey];

  const attempts = [firstUrl];
  if (!/^https:\/\//i.test(firstUrl)) attempts.unshift(withUrlScheme(rawUrl, "https"));
  if (!attempts.some((u) => /^http:\/\//i.test(u))) attempts.push(withUrlScheme(rawUrl, "http"));

  let lastError = null;
  for (const url of [...new Set(attempts.filter(Boolean))]) {
    try {
      let res = await fetchSite(url, "HEAD");
      if ([405, 403].includes(res.status)) res = await fetchSite(url, "GET");
      if (res.status >= 400) {
        lastError = `HTTP ${res.status}`;
        continue;
      }

      const finalUrl = res.url || url;
      const headStatus = res.status;
      if (!/^https:\/\//i.test(finalUrl)) {
        const result = {
          outcome: "needs_review",
          reason: "gate5:unsecured_site",
          note: `Resolved without HTTPS: ${finalUrl}`,
          final_url: finalUrl,
          http_status: res.status,
        };
        gate5Cache[cacheKey] = result;
        return result;
      }

      let body = "";
      let contentType = res.headers.get("content-type") || "";
      if (res.bodyUsed === false && (!contentType || contentType.includes("text/html"))) {
        try {
          const bodyRes = await fetchSite(finalUrl, "GET");
          if (bodyRes.ok) {
            res = bodyRes;
            contentType = res.headers.get("content-type") || "";
          }
        } catch {
          // HEAD liveness is still useful; body inspection is a best-effort refinement.
        }
      }
      if (res.bodyUsed === false && contentType.includes("text/html")) {
        try {
          body = (await res.text()).slice(0, 50000);
        } catch {
          body = "";
        }
      }
      if (/domain for sale|buy this domain|parkingcrew|hugedomains|sedo|afternic|this domain is parked|coming soon|website coming soon|under construction/i.test(body)) {
        const result = {
          outcome: "needs_review",
          reason: "gate5:placeholder_or_parked_site",
          note: "Site appears parked, under construction, or placeholder-only.",
          final_url: finalUrl,
          http_status: res.status || headStatus,
        };
        gate5Cache[cacheKey] = result;
        return result;
      }

      const result = {
        outcome: "live",
        reason: "gate5:live_https",
        note: `Live HTTPS site (${res.status || headStatus}).`,
        final_url: finalUrl,
        http_status: res.status || headStatus,
      };
      gate5Cache[cacheKey] = result;
      return result;
    } catch (e) {
      lastError = e.message;
    }
  }

  const result = {
    outcome: "needs_review",
    reason: "gate5:no_live_site",
    note: lastError || "Site did not resolve.",
  };
  gate5Cache[cacheKey] = result;
  return result;
}

function baseRecord(o) {
  return {
    place_id: o.place_id,
    name: o.name,
    website: o.website || null,
    source_url: o.source_url || null,
    primary_type: o.primary_type || null,
    primary_type_raw: o.primary_type_raw || null,
    types: o.types || [],
    business_status: o.business_status || null,
    lat: o.lat ?? null,
    lng: o.lng ?? null,
    address: o.address || null,
    phone: o.phone || null,
    rating: o.rating ?? null,
    user_rating_count: o.user_rating_count ?? null,
    rental_signal: Boolean(o.rental_signal),
    matched_activities: o.matched_activities || [],
    matched_terms: o.matched_terms || [],
    matched_tiers: o.matched_tiers || [],
    matched_modes: o.matched_modes || [],
    pure_service_area_business: Boolean(o.pure_service_area_business),
    possible_duplicate_of: o.possible_duplicate_of || null,
    sweep_cohort: o.sweep_cohort || null,
    geo_zone: null,
    aoi_distance_m: null,
    nearest_aoi: null,
    matched_tile: null,
    dedup_note: null,
    site_note: null,
    review_lane: "operator",
    decision_trace: [],
  };
}

function setDecision(rec, status, reason, note) {
  rec.status = status;
  rec.reason = reason;
  if (note) rec.note = note;
}

// Gate 1 recall guard. A name-regex match must never HARD-delete (out_of_scope) a row
// whose Places category is unambiguously recreational; and for SOFT/generic words, it
// must also not delete a row whose name carries a rec word. Those route to needs_review
// instead, so a real operator is flagged for a human rather than silently removed.
function gate1Reject(rec, o, hay, hardReason, { soft = false } = {}) {
  const recCat = isRecCategory(o);
  const recSig = REC_NAME_SIGNAL.test(hay);
  if (recCat || (soft && recSig)) {
    rec.review_lane = "operator";
    setDecision(
      rec,
      "needs_review",
      `${hardReason}_rec_conflict`,
      "Out-of-domain name pattern, but the Places category / rec name signal disagrees; review before excluding.",
    );
  } else {
    setDecision(rec, "out_of_scope", hardReason);
  }
}

async function classify(o) {
  const rec = baseRecord(o);
  const trace = rec.decision_trace;

  const geo = classifyAoi(o);
  rec.geo_zone = geo.zone;
  rec.aoi_distance_m = geo.distance_m;
  rec.nearest_aoi = geo.nearest_aoi;
  rec.matched_tile = geo.tile || null;
  trace.push({ gate: 0, result: geo.status || "pass", reason: geo.reason || "gate0:inside_covered_tile", note: geo.note || null });
  if (geo.status) setDecision(rec, geo.status, geo.reason, geo.note);

  if (!rec.status) {
    const hay = `${o.name || ""} ${o.primary_type || ""} ${o.primary_type_raw || ""}`;
    const matchedActivities = new Set(o.matched_activities || []);
    const inRecActivity = matchedActivities.size > 0;
    const isLodgingHint =
      (o.primary_type_raw && LODGING_NOISE_TYPES.has(o.primary_type_raw)) ||
      /^lodging$/i.test(o.primary_type || "");
    const hasRecNameSignal = REC_NAME_SIGNAL.test(hay);
    if (isLodgingHint) {
      // Let Gate 3 route lodging to needs_review. Vacation-rental titles often
      // contain words like ski, bike, table, or party without being operators.
    } else if (STRONG_NAME_BLOCK_HARD.some((re) => re.test(hay))) {
      gate1Reject(rec, o, hay, "gate1:strong_blocklist", { soft: false });
    } else if (STRONG_NAME_BLOCK_SOFT.some((re) => re.test(hay))) {
      gate1Reject(rec, o, hay, "gate1:soft_blocklist", { soft: true });
    } else if (TOOL_CONSTRUCTION_RE.test(hay) && /rent/i.test(hay)) {
      if (inRecActivity || hasRecNameSignal || isRecCategory(o)) {
        rec.review_lane = "operator";
        setDecision(
          rec,
          "needs_review",
          "gate1:construction_tool_rental_rec_query",
          "Tool/construction rental signal appeared on a recreation query; review before excluding.",
        );
      } else {
        setDecision(rec, "out_of_scope", "gate1:construction_tool_rental");
      }
    } else if (PARTY_EVENT_RE.test(hay) && !hasRecNameSignal) {
      gate1Reject(rec, o, hay, "gate1:party_event_rental", { soft: false });
    } else if (/^car rental agency$/i.test(o.primary_type || "") && !POWERSPORTS_RE.test(hay)) {
      if (PASSENGER_CAR_RE.test(hay)) setDecision(rec, "out_of_scope", "gate1:passenger_car_rental");
      else setDecision(rec, "needs_review", "gate1:ambiguous_car_rental_agency", "Car-rental primary type without a strong passenger-car-only signal.");
    } else if (RV_ROADONLY.test(hay) && !RV_OVERLAND.test(hay) && /rv|motorhome|trailer/i.test(o.name || "")) {
      setDecision(rec, "needs_review", "gate1:rv_roadonly_hint", "Road-only RV signal; website check decides camping-vehicle scope.");
    }
    trace.push({ gate: 1, result: rec.status || "pass", reason: rec.reason || "gate1:passed_domain_relevance" });
  }

  if (!rec.status) {
    const bs = o.business_status;
    if (bs === "CLOSED_PERMANENTLY") setDecision(rec, "out_of_business", "gate2:closed_permanently");
    else if (bs === "CLOSED_TEMPORARILY") setDecision(rec, "needs_review", "gate2:closed_temporarily");
    else if (!bs) setDecision(rec, "needs_review", "gate2:no_business_status");
    trace.push({ gate: 2, result: rec.status || "pass", reason: rec.reason || "gate2:operational" });
  }

  if (!rec.status) {
    const host = normDomain(o.website);
    const agg = DOMAIN_AGG_BLOCK.find((d) => domainMatches(host, d));
    const booking = BOOKING_PLATFORM_DOMAINS.find((d) => domainMatches(host, d));
    const isLodging = o.primary_type_raw && LODGING_NOISE_TYPES.has(o.primary_type_raw);
    const isPoi =
      POI_PRIMARY_RAW.has(o.primary_type_raw) ||
      POI_PRIMARY_DISPLAY.test(o.primary_type || "") ||
      POI_NAME.test(o.name || "");
    const noWebsite = !o.website;
    if (booking) {
      setDecision(
        rec,
        "needs_review",
        `gate3:booking_platform_domain:${booking}`,
        "Booking-platform URL can represent a real operator, but should be reviewed for first-party evidence.",
      );
    } else if (agg) {
      setDecision(rec, "needs_review", `gate3:aggregator_domain:${agg}`, "Marketplace/directory listing; review can recover the first-party operator.");
    } else if (FIREARM_NAME.test(o.name || "") && !ARCHERY_NAME.test(o.name || "")) {
      // hunting.md §0.2: firearms are out of scope, BUT a firearm/"outfitter" business
      // may also rent IN-scope hunting gear (optics, bows, blinds, packs). The spec
      // routes firearm-only -> no_rentals and mixed/unsure -> needs_review, and that
      // determination needs the website (Pass A). So do NOT hard-delete on the name —
      // flag for review so a real hunting-gear renter is never silently excluded.
      setDecision(
        rec,
        "needs_review",
        "gate3:firearm_business_review",
        "Firearm/ammo name. Firearms are out of scope, but a hunting outfitter may also rent in-scope optics/bows/blinds (hunting.md §0.2); review the site before excluding.",
      );
    } else if (
      noWebsite &&
      o.primary_type_raw &&
      NO_WEBSITE_RETAIL_NOISE_TYPES.has(o.primary_type_raw) &&
      !RENT_SHOP_NAME.test(o.name || "") &&
      !REC_NAME_SIGNAL.test(o.name || "")
    ) {
      // Recall guard: a rec name word (ski/board/surf/bike/...) means this could be a real
      // gear shop that Google miscategorized as clothing/shoe/etc — never auto-reject those.
      setDecision(
        rec,
        "out_of_scope",
        "gate3:no_website_retail_noise",
        "Website-less general retail listing with no rental-shop or recreation name signal.",
      );
    } else if (noWebsite && ["athletic_field", "park"].includes(o.primary_type_raw || "") && DISC_GOLF_COURSE_NAME.test(o.name || "")) {
      // Places often returns the course itself for "disc golf rental". A website-less
      // public/private course listing is not a rental operator; a real pro shop/rental
      // desk needs its own commercial listing or website evidence.
      setDecision(
        rec,
        "not_an_operator",
        "gate3:disc_golf_course_no_website",
        "Website-less disc golf course listing surfaced by a rental query; not a rental operator.",
      );
    } else if (noWebsite && ["athletic_field", "park"].includes(o.primary_type_raw || "") && PUBLIC_RECREATION_SITE_NAME.test(o.name || "") && !RENT_SHOP_NAME.test(o.name || "")) {
      // A public course/park/trail venue. But a bike park or course pro-shop CAN rent, so
      // respect the rental signal exactly like the sibling public_poi branch below: only
      // a no-rental-signal venue is auto-rejected; a rental signal routes to review.
      setDecision(
        rec,
        o.rental_signal ? "needs_review" : "not_an_operator",
        o.rental_signal ? "gate3:public_recreation_site_rental_signal" : "gate3:public_recreation_site_no_website",
        o.rental_signal
          ? "Public recreation site/course, but it carries a rental signal (a bike park or pro-shop may rent); review before excluding."
          : "Website-less public recreation site/course with no rental signal; not a rental operator listing.",
      );
    } else if (AGG_NAME.test(o.name || "")) {
      setDecision(rec, o.rental_signal ? "needs_review" : "out_of_scope", "gate3:aggregator_name");
    } else if (isLodging) {
      // The sweep already isolates these as lodging_excluded_records. The data shows the
      // bucket is entirely website-less vacation-rental listings ("2 Mi to Ski Resort",
      // "Condo w/ Pool", "Ski Lease"): 0 of 1061 carry a first-party website. A genuine
      // gear-rental operator does not appear as a website-less lodging row. So:
      //   - WITH a website        -> operator review (a resort site can hide guest gear).
      //   - gear-rental-SHOP name -> review (recall safety valve; ~3 rows, all benign).
      //   - otherwise             -> auto-reject as a vacation-rental listing (not an
      //                              operator), keeping it out of the human review queue.
      if (o.website) {
        rec.review_lane = "operator";
        setDecision(
          rec,
          "needs_review",
          "gate3:lodging_with_website",
          "Lodging primary type WITH a first-party website can still hide guest gear rentals; review instead of reject.",
        );
      } else if (RENT_SHOP_NAME.test(o.name || "")) {
        rec.review_lane = "lodging";
        setDecision(
          rec,
          "needs_review",
          "gate3:lodging_possible_gear_shop",
          "Lodging category but the name reads like a gear-rental shop; kept for review as a recall safeguard.",
        );
      } else {
        setDecision(
          rec,
          "not_an_operator",
          "gate3:vacation_rental_listing",
          "Website-less lodging listing (sweep-excluded vacation rental); auto-rejected — not a rental operator.",
        );
      }
    } else if (!o.website && isPoi && !RENTAL_IN_NAME.test(o.name || "")) {
      setDecision(rec, o.rental_signal ? "needs_review" : "not_an_operator", "gate3:public_poi_no_website");
    }
    trace.push({ gate: 3, result: rec.status || "pass", reason: rec.reason || "gate3:operator_or_reviewable" });
  }

  if (!rec.status) {
    if (o.possible_duplicate_of) {
      rec.review_lane = "duplicate";
      setDecision(
        rec,
        "needs_review",
        "gate4:sweep_possible_duplicate",
        `Sweep flagged this as a possible duplicate of ${o.possible_duplicate_of}; review before skipping.`,
      );
      rec.dedup_note = `possible_duplicate_of:${o.possible_duplicate_of}`;
    } else {
      const dm = dedupMatch(o);
      if (dm.level === "duplicate") {
        setDecision(rec, "duplicate", `gate4:${dm.by}`);
        rec.dedup_note = dm.by;
      } else if (dm.level === "review") {
        if (dm.by.startsWith("shared-domain:") || dm.by.startsWith("verified-slug:")) rec.review_lane = "duplicate";
        setDecision(rec, "needs_review", `gate4:${dm.by}`, dm.note);
        rec.dedup_note = dm.note;
      }
    }
    trace.push({ gate: 4, result: rec.status || "pass", reason: rec.reason || "gate4:no_duplicate", note: rec.dedup_note });
  }

  if (!rec.status) {
    if (RUN_GATE5) {
      const site = await liveSiteCheck(o.website);
      rec.site_note = site.note || null;
      rec.final_url = site.final_url || null;
      rec.http_status = site.http_status || null;
      if (site.outcome === "live") setDecision(rec, "survivor", "cleared_gates_0-5", site.note);
      else setDecision(rec, "needs_review", site.reason, site.note);
      trace.push({ gate: 5, result: rec.status, reason: rec.reason, note: rec.site_note });
    } else if (!o.website) {
      setDecision(rec, "needs_review", "gate5_pre:no_website_field", "No website field; web fallback or manual review needed.");
      trace.push({ gate: 5, result: rec.status, reason: rec.reason, note: rec.note });
    } else {
      setDecision(rec, "survivor", "cleared_gates_0-4", "Gate 5 not run; use --gate5 for live-site check.");
      trace.push({ gate: 5, result: "not_run", reason: "gate5:not_requested" });
    }
  }

  return rec;
}

function priorityScore(r) {
  const tierScore = (r.matched_tiers || []).includes("core")
    ? 60
    : (r.matched_tiers || []).includes("gap")
      ? 40
      : (r.matched_tiers || []).includes("experience")
        ? 15
        : 0;
  const modeScore = (r.matched_modes || []).includes("service-area") ? 10 : 0;
  const rentalScore = r.rental_signal ? 25 : 0;
  const reviewScore = Math.log10((r.user_rating_count || 0) + 1) * 10;
  return tierScore + modeScore + rentalScore + reviewScore;
}

async function runFixtureTests() {
  if (!exists(fixturesPath)) {
    console.error(`${fixturesPath} not found.`);
    return 1;
  }
  const fixtures = read(fixturesPath);
  let failures = 0;
  for (const fixture of fixtures) {
    const rec = await classify(fixture.row || {});
    const errors = [];
    if (fixture.expect_status && rec.status !== fixture.expect_status) {
      errors.push(`expected status ${fixture.expect_status}, got ${rec.status}`);
    }
    if (fixture.allowed_statuses && !fixture.allowed_statuses.includes(rec.status)) {
      errors.push(`status ${rec.status} not in allowed set ${fixture.allowed_statuses.join(",")}`);
    }
    if (fixture.forbidden_statuses && fixture.forbidden_statuses.includes(rec.status)) {
      errors.push(`status ${rec.status} is forbidden`);
    }
    if (fixture.expect_review_lane && rec.review_lane !== fixture.expect_review_lane) {
      errors.push(`expected review_lane ${fixture.expect_review_lane}, got ${rec.review_lane}`);
    }
    if (fixture.reason_prefix && !String(rec.reason || "").startsWith(fixture.reason_prefix)) {
      errors.push(`expected reason prefix ${fixture.reason_prefix}, got ${rec.reason}`);
    }

    if (errors.length) {
      failures++;
      console.log(`FAIL ${fixture.id || fixture.row?.name || "(unnamed)"}: ${errors.join("; ")}`);
      console.log(`  actual: ${rec.status} | ${rec.reason} | lane=${rec.review_lane}`);
    } else {
      console.log(`PASS ${fixture.id || fixture.row?.name || "(unnamed)"}: ${rec.status} | ${rec.reason} | lane=${rec.review_lane}`);
    }
  }
  console.log("--------------------------------------");
  console.log(`${fixtures.length - failures}/${fixtures.length} fixtures passed`);
  return failures ? 1 : 0;
}

if (TEST_FIXTURES) {
  process.exit(await runFixtureTests());
}

const inputRows = loadInputRows();
const results = [];
for (const row of inputRows) {
  const rec = await classify(row);
  if (!EXPLAIN_PLACE_ID || rec.place_id === EXPLAIN_PLACE_ID) results.push(rec);
}

const allResults = results;
const tally = {};
const reasonCounts = {};
for (const r of allResults) {
  tally[r.status] = (tally[r.status] || 0) + 1;
  reasonCounts[r.reason] = (reasonCounts[r.reason] || 0) + 1;
  r.priority_score = Number(priorityScore(r).toFixed(2));
}

const survivors = allResults
  .filter((r) => r.status === "survivor")
  .sort((a, b) => b.priority_score - a.priority_score || (b.user_rating_count || 0) - (a.user_rating_count || 0));
survivors.forEach((r, i) => {
  r.rank = i + 1;
});

const byPriority = (a, b) =>
  b.priority_score - a.priority_score || (b.user_rating_count || 0) - (a.user_rating_count || 0);

// Recall-first lane split: every needs_review row is preserved, but the website-less
// lodging/vacation-rental listings get their own queue so they don't bury the real
// operator candidates a human actually needs to triage.
const allNeedsReview = allResults.filter((r) => r.status === "needs_review");
const needsReview = allNeedsReview.filter((r) => !["lodging", "duplicate"].includes(r.review_lane)).sort(byPriority);
needsReview.forEach((r, i) => {
  r.rank = i + 1;
});

const lodgingReview = allNeedsReview.filter((r) => r.review_lane === "lodging").sort(byPriority);
lodgingReview.forEach((r, i) => {
  r.rank = i + 1;
});

const duplicateReview = allNeedsReview.filter((r) => r.review_lane === "duplicate").sort(byPriority);
duplicateReview.forEach((r, i) => {
  r.rank = i + 1;
});

const rejects = allResults
  .filter((r) => r.status !== "survivor" && r.status !== "needs_review")
  .sort((a, b) => (a.status || "").localeCompare(b.status || "") || (a.name || "").localeCompare(b.name || ""));
rejects.forEach((r, i) => {
  r.rank = i + 1;
});

const termStats = new Map();
for (const r of allResults) {
  for (const term of r.matched_terms || []) {
    const meta = termMeta.get(term) || {};
    let stat = termStats.get(term);
    if (!stat) {
      stat = {
        term,
        activity: meta.activity || null,
        season: meta.season || null,
        tier: meta.tier || null,
        input_ids: new Set(),
        survivor_ids: new Set(),
        needs_review_ids: new Set(),
        pass_a_candidate_ids: new Set(),
        status_ids: new Map(),
      };
      termStats.set(term, stat);
    }
    stat.input_ids.add(r.place_id);
    if (!stat.status_ids.has(r.status)) stat.status_ids.set(r.status, new Set());
    stat.status_ids.get(r.status).add(r.place_id);
    if (r.status === "survivor") stat.survivor_ids.add(r.place_id);
    if (r.status === "needs_review") stat.needs_review_ids.add(r.place_id);
    if (r.status === "survivor" || r.status === "needs_review") stat.pass_a_candidate_ids.add(r.place_id);
  }
}

const term_contribution_after_gates = [...termStats.values()]
  .map((s) => ({
    term: s.term,
    activity: s.activity,
    season: s.season,
    tier: s.tier,
    input_count: s.input_ids.size,
    survivor_count: s.survivor_ids.size,
    needs_review_count: s.needs_review_ids.size,
    pass_a_candidate_count: s.pass_a_candidate_ids.size,
    statuses: Object.fromEntries([...s.status_ids.entries()].map(([status, ids]) => [status, ids.size])),
  }))
  .sort(
    (a, b) =>
      b.pass_a_candidate_count - a.pass_a_candidate_count ||
      b.survivor_count - a.survivor_count ||
      b.input_count - a.input_count,
  );

const output = {
  ranAt: new Date().toISOString(),
  mode: RUN_GATE5 ? "gates_0_5_live_site" : "gates_0_4_no_network",
  recall_policy: "hard-reject only on strong evidence; ambiguous rows route to needs_review",
  input_count: inputRows.length,
  classified_count: allResults.length,
  sweep_input_breakdown: {
    operators: (sweepJson.operators || []).length,
    closed_records: (sweepJson.closed_records || []).length,
    lodging_excluded_records: (sweepJson.lodging_excluded_records || []).length,
    gate_ladder_input_records: (sweepJson.gate_ladder_input_records || []).length,
  },
  aoi: {
    corridors: AOI_RECTS.length,
    excluded_margins: AOI_EXCLUDE.length,
    seed_tiles: aoiTiles.length,
    seed_cell_km: GRID_CONFIG.seedCellKm,
    min_cell_km: GRID_CONFIG.minCellKm,
    edge_review_m: AOI_EDGE_REVIEW_M,
    far_reject_m: AOI_FAR_REJECT_M,
  },
  tally,
  reason_counts: reasonCounts,
  survivor_count: survivors.length,
  needs_review_count: needsReview.length,
  lodging_review_count: lodgingReview.length,
  duplicate_review_count: duplicateReview.length,
  reject_count: rejects.length,
  term_contribution_after_gates,
  results: allResults,
  survivor_queue: survivors,
  needs_review_queue: needsReview,
  lodging_review_queue: lodgingReview,
  duplicate_review_queue: duplicateReview,
  reject_queue: rejects,
};

if (!PREVIEW) {
  fs.writeFileSync(SEED + "sweep_gate_results.json", JSON.stringify(output, null, 2));
  writeCsv("sweep_gate_survivors.csv", survivors);
  writeCsv("sweep_gate_needs_review.csv", needsReview);
  writeCsv("sweep_gate_lodging_review.csv", lodgingReview);
  writeCsv("sweep_gate_duplicate_review.csv", duplicateReview);
  writeCsv("sweep_gate_rejects.csv", rejects);
  if (RUN_GATE5) fs.writeFileSync(SEED + gate5CachePath, JSON.stringify(gate5Cache, null, 2));
}

const order = ["out_of_region", "out_of_scope", "out_of_business", "not_an_operator", "duplicate", "needs_review", "survivor"];
console.log("\n=== GATE LADDER FUNNEL ===");
console.log("mode:", RUN_GATE5 ? "Gates 0-5 with live-site checks" : "Gates 0-4, no network");
if (PREVIEW) console.log("preview: no output files written");
console.log("input rows:", inputRows.length);
for (const s of order) if (tally[s]) console.log(String(tally[s]).padStart(5), s);
const other = Object.keys(tally).filter((k) => !order.includes(k));
for (const s of other) console.log(String(tally[s]).padStart(5), s, "(unexpected)");
console.log("--------------------------------------");
console.log("survivors -> Pass A triage:", survivors.length);
console.log("needs_review (operator lane):", needsReview.length);
console.log("needs_review (lodging lane):", lodgingReview.length);
console.log("needs_review (duplicate lane):", duplicateReview.length);
console.log("rejects/skips:", rejects.length);
if (needsReview.length) {
  const byReason = {};
  for (const r of needsReview) byReason[r.reason] = (byReason[r.reason] || 0) + 1;
  console.log("-- operator-lane review reasons --");
  for (const [reason, n] of Object.entries(byReason).sort((a, b) => b[1] - a[1])) {
    console.log(String(n).padStart(5), reason);
  }
}
console.log(PREVIEW ? "no files written" : "wrote sweep_gate_results.json + CSV queues");
