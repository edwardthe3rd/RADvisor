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
const AUDIT_OVERRIDES = process.argv.includes("--audit-overrides");
const EXPLAIN_PLACE_ID = valueAfter("--explain");

const sweepJson = read("quadtree_sweep_operators.json");
const oldOps = read("operators.json");
const verified = read("operator_website_verified.json");
const gate5CachePath = "sweep_gate5_cache.json";
const fixturesPath = "gate_ladder_fixtures.json";
const gate5RelevanceFixturesPath = "gate5_relevance_fixtures.json";
const manualReviewOverridesPath = "manual_gate_review_overrides.json";
// Bump when Gate 5 probe/relevance logic changes so stale verdicts auto-invalidate
// without requiring an explicit --refresh-gate5.
const GATE5_CACHE_VERSION = 5;
const gate5CacheRaw = !REFRESH_GATE5 && exists(gate5CachePath) ? read(gate5CachePath) : {};
const gate5Cache =
  gate5CacheRaw.__schema === GATE5_CACHE_VERSION ? gate5CacheRaw : { __schema: GATE5_CACHE_VERSION };
gate5Cache.__schema = GATE5_CACHE_VERSION;

const AOI_EDGE_REVIEW_M = 2000;
const AOI_FAR_REJECT_M = 10000;
const SITE_TIMEOUT_MS = 10000;

const termMeta = new Map(QUERIES.map((q) => [q.term, q]));
const aoiTiles = seedTiles();
const manualReviewData = exists(manualReviewOverridesPath)
  ? read(manualReviewOverridesPath)
  : { overrides: [] };
const manualReviewByPlaceId = new Map(
  (manualReviewData.overrides || []).map((o) => [o.place_id, o]),
);

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
    "manual_review_label",
    "pre_manual_review_reason",
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
    "site_relevance",
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
const RENT_SHOP_NAME = /(ski|bike|board|snowboard|kayak|canoe|paddle|sup|boat|watersports?|jet\s?ski|snowmobile|gear|equipment|raft)\s+rental|\boutfitters?\b|rental shop|\brentals\b\s*(shop|store|co\b)/i;

const TOOL_CONSTRUCTION_RE = /\b(tool|construction|contractor|heavy|industrial|forklift|lift|generator|tractor|equipment)\b/i;
// Phrase-based (not bare single words) so it no longer trips on rec names that merely
// contain "event" or "table" (e.g. "Pool Table Services"), while still catching every
// real party/event-rental shop ("Party Rentals", "Event Rentals", "Tent Rental").
const PARTY_EVENT_RE = /party rental|event rental|tent rental|party suppl|event suppl|\bwedding\b|bounce house|\bbouncers?\b|bouncin|\bbounce\b|photo booth|\bevents?\b|celebrations?|\bfiesta\b|\b(tables?\s*(and|&|\/)\s*chairs?|chairs?\s*(and|&|\/)\s*tables?)\b/i;
const PASSENGER_CAR_RE = /\b(rent[-\s]?a[-\s]?car|car rental|passenger car|sedan|suv rental|airport rental)\b/i;
const POWERSPORTS_RE = /powersport|atv|utv|jeep|motorcycle|dirt bike|snowmobile|rzr|side by side|4x4|4wd|off[-\s]?road|overland/i;
const REC_NAME_SIGNAL = /boat|ski|snow|bike|kayak|paddle|watersport|marina|camp|outdoor|trail|climb|raft|atv|utv|jeep|snowmobile|surf|foil|dive|scuba|golf/i;
const FIREARM_NAME = /\b(gun|guns|firearm|firearms|arms|ammo|ammunition|armory|gunsmith)\b/i;
const ARCHERY_NAME = /\b(archery|bows?|crossbows?|compound bow|recurve)\b/i;
// In-scope hunting gear a firearm/outfitter business might also rent (hunting.md §0.2):
// keep these out of the hard firearm reject and route to review instead.
const HUNTING_GEAR_NAME = /\b(optics?|scopes?|binoculars?|rangefinders?|blinds?|tree ?stands?|outfitters?|pack station)\b/i;
const PUBLIC_RECREATION_SITE_NAME = /\b(disc golf course|bike park|trail|trailhead|athletic field|sports field|boat ramp|sno-?park)\b/i;
const DISC_GOLF_COURSE_NAME = /\bdisc golf course\b/i;
// Public/venue facilities that are never a rental operator listing (a venue, not a
// shop). Unlike "bike park"/"disc golf course" (which can host a renting pro-shop),
// these are pure infrastructure. Respect rental_signal -> review as a safety valve.
const FACILITY_ONLY_NAME = /\b(boat ramp|boat launch|bike ?way|snow ?play|snowplay|bikeway|trailhead)\b/i;
// Venue/club operations that are not rental operators even WITH a live website:
// member ski clubs, ice rinks (skates never leave the rink), archery/shooting ranges,
// ticketed activity zones / sledding hills, and state SNO-Parks (websites live on
// ohv.parks.ca.gov). 2026-07-05 review: Donner Summit & Blackwood SNO-Parks, Viking
// Ski Club, Carson City archery range, Northstar ice rink, SnoVentures Activity Zone
// all reached Pass A triage. A rental signal or rental-shop name still routes to
// review (a venue CAN host a real rental concession — e.g. a state-park watersport
// concession).
const VENUE_CLUB_NAME =
  /\b(sno-?parks?|ski club|ice (?:skating )?rink|skating rink|archery range|shooting range|gun club|activity zone|sledding hill)\b/i;
const GOV_PARKS_HOST_RE = /(^|\.)(parks\.ca\.gov|nps\.gov|fs\.usda\.gov|blm\.gov)$/i;

// Tier-1 out-of-scope businesses (validated against 195 human review labels, zero
// collisions with confirmed operators). These bypass the rec-category recall guard
// because a North Face store / gun shop / thrift store carries a "recreational" Places
// category yet never rents adventure gear. Only an explicit gear-rental NAME cue
// (RENT_SHOP_NAME) escapes the reject -> review.
const OUT_OF_SCOPE_BUSINESS = [
  { re: /\b(thrift|consignment|antiques?|goodwill|salvation army|second[\s-]?hand|\bseconds\b)\b/i, reason: "thrift_used_goods" },
  { re: /\b(supermarket|grocery|asian market|\bmarket\b|\bdeli\b|butcher)\b/i, reason: "grocery_market" },
  { re: /\b(smoke shop|vape|vapor room|\bhemp\b|cannabis|dispensary|\bcbd\b)\b/i, reason: "smoke_vape_cannabis" },
  { re: /\b(collectibles?|sports cards?|trading cards?|trading post|memorabilia)\b/i, reason: "collectibles" },
  { re: /\b(dental|dentist|orthodont|medical clinic|\bhospital\b|hospice|pharmacy|chiropract)\b/i, reason: "medical_dental" },
  { re: /\b(propeller|fabrication|machine shop|racing products?|custom rods?|boat canvas|upholstery|log works|cover warehouse|manufacturing)\b/i, reason: "manufacturer_parts" },
  { re: /\b(outlet store|\bapparel\b|footwear|shoe store|clothing exchange|screen printing|embroidery|\buniforms?\b|formalwear|tuxedo|jewelry)\b/i, reason: "apparel_footwear_retail" },
  { re: /\b(pawn|\bvape\b|computers?\b)\b/i, reason: "non_recreational_retail" },
];

// Narrow false-positive shapes observed in the final survivor queue. These are
// type/name combinations, not broad category-family rejects, and they keep the
// RENT_SHOP_NAME escape hatch below.
const OBVIOUS_NON_RENTAL_PRIMARY_RAW = new Set([
  "clothing_store",
  "shoe_store",
  "coffee_shop",
  "dog_cafe",
]);
const OBVIOUS_NON_RENTAL_NAME =
  /\b(coffee|coffeebar|starbucks|apparel|clothing|shirt|sweatsedo|uniforms?|screen printing|embroidery|pawn|jewelry|vape|vapory)\b/i;
const VACATION_RENTAL_TRAVEL_NAME =
  /\b(vacation rentals?|ski[-\s]?in\/ski[-\s]?out|condos?|cabins?|cottages?|retreats?|property management|brockway springs rentals|donner summit rentals)\b/i;

// Known national retail / brand chains that are never a local rental operator. Curated
// (not generic) so a real dealer that also rents is not caught. "trek inc" matches the
// manufacturer, not a "Trek Bicycle Store" dealer.
const RETAIL_BRAND_NAMES =
  /\b(the north face|north face|adidas|under armour|lululemon|oakley|helly hansen|famous footwear|jd sports|\btillys\b|columbia sportswear|big 5|big r\b|sportsman'?s warehouse|dick'?s sporting|trek inc|\bleatt\b|hawley usa|salomon store|cabela'?s|bass pro|cycle gear|\bburlington\b|nike (factory )?store)\b/i;

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
  // Regional visitor directories: a Places "website" pointing at a destination-guide
  // listing is not the operator's own site (2026-07-05 review: Cabin Fever surfaced
  // via a tahoe.com listing page). When porting to a new region, add that region's
  // visitor-guide domains here.
  "tahoe.com",
  "visitlaketahoe.com",
  "visitrenotahoe.com",
  "gotahoenorth.com",
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

// Intra-batch dedup (Gate 4): the old-DB checks below cannot see two rows of the SAME
// sweep batch that are one operator under two place_ids. 2026-07-05 review: Truckee
// River Raft Co. (2x), Tahoe Jet Boats (3x), North Tahoe Watersports (2x) all reached
// triage as same-domain+same-name duplicates. Key = normalized domain + compact name,
// so multi-location brands with distinct storefront names (Powder House Main Store vs
// Express) are NOT collapsed.
const intraBatchSeen = new Map();
function intraBatchDuplicate(o) {
  const host = normDomain(o.website);
  const nn = normNameCompact(o.name);
  if (!host || !nn || nn.length < 6) return null;
  const key = `${host}|${nn}`;
  if (intraBatchSeen.has(key)) return { key, first: intraBatchSeen.get(key) };
  intraBatchSeen.set(key, o.place_id || o.name);
  return null;
}

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

// --- Gate 5 tuning knobs -------------------------------------------------
const FETCH_RETRIES = 2; // total attempts per request = 1 + FETCH_RETRIES
const RETRY_BASE_MS = 500; // linear backoff: 500ms, 1000ms, ...
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Hosts that are social/aggregator pages, not an operator's own site. A
// "website" pointing here cannot be auto-promoted to survivor; route to review.
const SOCIAL_HOSTS = [
  "facebook.com",
  "fb.com",
  "m.facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
  "youtube.com",
  "youtu.be",
  "linkedin.com",
  "linktr.ee",
  "linktree.com",
  "yelp.com",
  "tripadvisor.com",
  "google.com",
  "goo.gl",
  "maps.app.goo.gl",
  "business.google.com",
];

// Third-party marketplaces / booking listings. A "website" that is (or redirects
// to) one of these is the operator's listing on a platform, not their own
// first-party site, so it cannot be auto-promoted to survivor. Deliberately
// excludes site builders (wixsite.com, business.site, square.site, etc.) and
// embedded booking widgets, which DO represent an operator's own site.
const AGGREGATOR_HOSTS = [
  "getmyboat.com",
  "outdoorsy.com",
  "rvshare.com",
  "hipcamp.com",
  "campspot.com",
  "airbnb.com",
  "vrbo.com",
  "booking.com",
  "expedia.com",
  "viator.com",
  "getyourguide.com",
  "peerspace.com",
  "thumbtack.com",
  "boatsetter.com",
  "babyquip.com",
  "spinlister.com",
  "getaround.com",
  "turo.com",
  "fareharbor.com",
];

// Parked / placeholder / default-host fingerprints. Curated to avoid matching
// legitimate operator copy (e.g. "boats for sale" stays clear).
const PARKED_RE = new RegExp(
  [
    "domain for sale",
    "buy this domain",
    "this domain is (?:for sale|parked)",
    "domain is parked",
    "domain may be for sale",
    "parkingcrew",
    "hugedomains",
    "afternic",
    "\\bsedo\\b",
    "dan\\.com",
    "porkbun",
    "future home of",
    "account suspended",
    "default web page",
    "web hosting provider",
    "site not published",
    "coming soon",
    "website coming soon",
    "under construction",
  ].join("|"),
  "i",
);

const IN_DOMAIN_ACTIVITY_SITE_RE =
  /\b(ski|snowboard|bike|bicycle|kayak|canoe|paddleboard|sup|boat|pontoon|jet ski|waverunner|marina|wakeboard|fishing|fly fishing|camp(?:ing)?|backpack|snowshoe|sled|tube|climb|rafting|atv|utv|4x4|off[-\s]?road|overland|archery|disc golf|ice skat(?:e|ing))\b/i;

const RENTAL_BOOKING_CUE_RE =
  /\b(rent|rental|rentals|demo|demos|lease|hire|book(?:ing)?|reserve|reservation|tour|tours|guided|guide|outfitter|charter|lesson|lessons|excursion|trip|trips|fleet)\b/i;

// Strong out-of-domain page fingerprints. These do not hard-delete a row from
// Gate 5; they prevent auto-promotion so Pass A/manual review can make the
// final call with the site in view.
const OUT_OF_DOMAIN_SITE_RE =
  /\b(party rentals?|event rentals?|wedding rentals?|bounce house|inflatable rentals?|photo booth|tables?\s*(and|&|\/)\s*chairs?|chairs?\s*(and|&|\/)\s*tables?|linen rentals?|table linens?|portable restroom|porta[-\s]?pott|dumpster rentals?|storage container|self[-\s]?storage|moving truck|box truck|cargo van|scissor lifts?|forklifts?|passenger car rental|airport car rental|medical equipment|mobility scooter|costume rentals?|tuxedo rentals?|formalwear|furniture rentals?|appliance rentals?)\b/i;

// SaaS vendors that SELL rental-management software to operators (not operators
// themselves) and peer-to-peer marketplace copy. A first-party operator site does
// not pitch "rental software" or call the reader a "rental shop owner".
const RENTAL_SOFTWARE_SITE_RE =
  /\b(rental (software|management software|booking software|management system|platform for)|software for (your )?rental|rental shop owner|grow your rental business|list your (boat|rv|gear|equipment) (for rent|and earn)|peer[-\s]?to[-\s]?peer rental)\b/i;

// Name words too generic to confirm a domain belongs to a specific operator.
const GENERIC_NAME_WORDS = new Set([
  "rental", "rentals", "rent", "hire", "the", "and", "llc", "inc", "co",
  "company", "adventure", "adventures", "outfitter", "outfitters", "tour",
  "tours", "center", "centre", "shop", "store", "service", "services",
  "sport", "sports", "outdoor", "outdoors", "guide", "guides", "equipment",
  "gear", "boat", "boats", "bike", "bikes", "kayak", "ski", "snow",
]);

const pageTokenSet = (s) =>
  new Set(
    String(s || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter(Boolean),
  );

const meaningfulNameTokens = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !GENERIC_NAME_WORDS.has(w));

// Common multi-label public suffixes so we extract the registrable brand label
// rather than a subdomain (e.g. shop.acme.com -> "acme", book.acme.co.uk -> "acme").
const MULTI_PART_TLDS = new Set([
  "co.uk", "org.uk", "me.uk", "ac.uk", "gov.uk",
  "com.au", "net.au", "org.au", "co.nz", "co.za",
  "com.br", "com.mx", "co.in", "co.jp",
]);

const brandLabel = (host) => {
  if (!host) return null;
  const labels = host.split(".").filter(Boolean);
  if (labels.length < 2) return labels[0] || null;
  const lastTwo = labels.slice(-2).join(".");
  const suffixLen = MULTI_PART_TLDS.has(lastTwo) ? 2 : 1;
  const brandIdx = labels.length - suffixLen - 1;
  return brandIdx >= 0 ? labels[brandIdx] : labels[0];
};

const meaningfulDomainTokens = (url) => {
  const brand = brandLabel(normDomain(url));
  if (!brand) return [];
  return brand
    .replace(/\d+/g, " ")
    .split(/[^a-z]+/i)
    .map((w) => w.toLowerCase())
    .filter((w) => w.length >= 4 && !GENERIC_NAME_WORDS.has(w));
};

// Offline first-party check: does the registrable domain brand correspond to the
// operator name without reading the page? This is what rescues a JS-rendered /
// unreadable site whose domain itself is the operator brand. Conservative on
// purpose: require whole-name containment or >=2 meaningful name tokens in the
// brand, so a lone generic token (e.g. "mountain") cannot manufacture a match.
const domainNameCorroborates = (rawUrl, finalUrl, name) => {
  const nameC = normNameCompact(name);
  if (nameC.length < 4) return false;
  const nameToks = meaningfulNameTokens(name);
  for (const u of [rawUrl, finalUrl]) {
    const brand = brandLabel(normDomain(u));
    if (!brand) continue;
    const brandC = normNameCompact(brand);
    if (brandC.length < 4) continue;
    if (brandC.includes(nameC) || nameC.includes(brandC)) return true;
    if (nameToks.filter((w) => brandC.includes(w)).length >= 2) return true;
  }
  return false;
};

const stripHtmlText = (html) =>
  String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// High-signal text that survives JS-rendered (SPA) pages: <title>, og:site_name,
// meta description, and JSON-LD name/description/@type. This rescues first-party
// confirmation for Wix/Squarespace/React sites whose visible body is script-built.
const extractStructured = (html) => {
  if (!html) return "";
  const out = [];
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (title) out.push(stripHtmlText(title[1]));
  const metaRe = /<meta[^>]+(?:property|name)=["'](?:og:site_name|og:title|description|application-name)["'][^>]*content=["']([^"']+)["']/gi;
  for (const m of html.matchAll(metaRe)) out.push(m[1]);
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const json = JSON.parse(m[1]);
      const nodes = Array.isArray(json) ? json : json["@graph"] ? json["@graph"] : [json];
      for (const node of nodes) {
        for (const key of ["name", "legalName", "description", "@type", "telephone"]) {
          const v = node?.[key];
          if (typeof v === "string") out.push(v);
        }
        const addr = node?.address;
        if (addr && typeof addr === "object") {
          for (const key of ["streetAddress", "addressLocality", "postalCode"]) {
            if (typeof addr[key] === "string") out.push(addr[key]);
          }
        }
      }
    } catch {
      // best-effort; malformed JSON-LD is ignored
    }
  }
  return out.join(" ").replace(/\s+/g, " ").trim();
};

const digitsOf = (s) => String(s || "").replace(/\D+/g, "");

// Phone is a strong first-party signal: match the last 7 digits (subscriber
// number) so country/area-code formatting differences do not block a match.
const phoneOnPage = (phone, digitsHaystack) => {
  const d = digitsOf(phone);
  if (d.length < 7) return false;
  return digitsHaystack.includes(d.slice(-7));
};

// Address corroboration: require the street number plus its first street word.
const addressOnPage = (address, corpusLower, digitsHaystack) => {
  const num = String(address || "").match(/\b(\d{1,6})\b/);
  if (!num) return false;
  if (!digitsHaystack.includes(num[1])) return false;
  const street = String(address || "")
    .replace(/^\s*\d{1,6}\s+/, "")
    .toLowerCase()
    .split(/[^a-z]+/)
    .find((w) => w.length >= 4);
  return Boolean(street) && corpusLower.includes(street);
};

const errCode = (e) => e?.cause?.code || e?.code || null;
// Transient: worth a retry and never strong "dead" evidence.
const isTransientError = (e) => {
  if (e?.name === "AbortError") return true; // timeout
  return [
    "ECONNRESET", "ETIMEDOUT", "EAI_AGAIN", "ECONNABORTED",
    "UND_ERR_CONNECT_TIMEOUT", "UND_ERR_SOCKET", "UND_ERR_HEADERS_TIMEOUT",
  ].includes(errCode(e));
};
// Dead: strong evidence the host does not exist (DNS NXDOMAIN, refused).
const isDeadHost = (e) => ["ENOTFOUND", "ECONNREFUSED"].includes(errCode(e));

const hostInList = (host, list) => {
  if (!host) return false;
  const h = normalizeHost(host);
  return list.some((s) => h === s || h.endsWith("." + s));
};
const isSocialHost = (host) => hostInList(host, SOCIAL_HOSTS);
const isAggregatorHost = (host) => hostInList(host, AGGREGATOR_HOSTS);

// Soft 404: HTTP 200 but the page content is a "not found" page. Anchored to
// strong phrases (and checked only near the top of the page) so ordinary copy
// that happens to contain "not found" does not trip it.
const SOFT_404_RE =
  /(page\s+not\s+found|error\s*404|404\s+error|404\s*[-–—:|]\s*not\s+found|not\s+found\s*[-–—:|]\s*404|page\s+(?:you\s+(?:requested|are\s+looking\s+for)\s+)?(?:was\s+|is\s+)?not\s+found|page\s+does\s*n.?t\s+exist|page\s+no\s+longer\s+(?:exists?|available)|this\s+page\s+(?:isn.?t|is\s+not)\s+available)/i;
const looksSoft404 = (body, meta) => {
  if (!body) return null;
  const head = `${meta || ""} ${stripHtmlText(body).slice(0, 800)}`;
  return SOFT_404_RE.test(head)
    ? "Page returned HTTP 200 but its content is a 'not found' / 404 page."
    : null;
};

// Treat blocked/transient server statuses as retryable; surface the rest.
async function fetchSiteWithRetry(url, method) {
  let lastError = null;
  for (let attempt = 0; attempt <= FETCH_RETRIES; attempt++) {
    try {
      const res = await fetchSite(url, method);
      if ([429, 502, 503, 504].includes(res.status) && attempt < FETCH_RETRIES) {
        lastError = `HTTP ${res.status}`;
        await sleep(RETRY_BASE_MS * (attempt + 1));
        continue;
      }
      return { res };
    } catch (e) {
      lastError = e;
      if (isTransientError(e) && attempt < FETCH_RETRIES) {
        await sleep(RETRY_BASE_MS * (attempt + 1));
        continue;
      }
      return { error: e };
    }
  }
  return { error: lastError instanceof Error ? lastError : new Error(String(lastError)) };
}

const looksParked = (body) => {
  if (!body) return null;
  if (PARKED_RE.test(body)) return "Site appears parked, under construction, or placeholder-only.";
  const meta = body.match(
    /<meta[^>]+http-equiv=["']?refresh["']?[^>]*content=["'][^"']*url=([^"'>\s]+)/i,
  );
  if (meta) return `Page is a meta-refresh redirect to ${meta[1]}.`;
  const text = stripHtmlText(body);
  if (text.length < 48 && !/<img|<video|<iframe/i.test(body)) {
    return "Page body is essentially empty (placeholder).";
  }
  return null;
};

// Decide whether a live site's text actually corroborates a first-party,
// in-domain operator site. Ambiguous sites route to needs_review; they are not
// hard-rejected.
const relevanceVerdict = (net, context = {}) => {
  // Combine visible body text with structured metadata (title/og/JSON-LD) so a
  // JS-rendered page with an empty static body can still be corroborated.
  const corpus = `${net.text || ""} ${net.meta || ""}`.replace(/\s+/g, " ").trim();
  const t = corpus.toLowerCase();
  const tokens = pageTokenSet(t);
  const digitsHaystack = digitsOf(corpus);
  const readable = t.length >= 24 || tokens.size >= 4;

  const hasInDomainActivitySignal = IN_DOMAIN_ACTIVITY_SITE_RE.test(t);
  // A rental-software vendor or P2P marketplace is not a first-party operator,
  // regardless of any rec activity it lists as an example. Block promotion.
  if (readable && RENTAL_SOFTWARE_SITE_RE.test(t)) {
    return {
      confirmed: false,
      reason: "gate5:rental_software_or_marketplace",
      by: "rental_software_or_marketplace_terms",
      note: "page text reads like a rental-software vendor or peer-to-peer marketplace, not a first-party operator",
    };
  }
  // Out-of-domain page text blocks auto-promotion even with a prior sweep signal:
  // the page itself is the strongest evidence of what the business actually does.
  if (readable && OUT_OF_DOMAIN_SITE_RE.test(t) && !hasInDomainActivitySignal) {
    return {
      confirmed: false,
      reason: "gate5:out_of_domain_site",
      by: "out_of_domain_page_terms",
      note: "page text looks like an out-of-domain rental business",
    };
  }

  const nameTokens = meaningfulNameTokens(context.name);
  if (nameTokens.some((w) => tokens.has(w))) {
    return { confirmed: true, by: "operator_name_match", note: "operator name appears on the page" };
  }

  const domainTokens = [
    ...meaningfulDomainTokens(context.rawUrl),
    ...meaningfulDomainTokens(context.finalUrl),
  ];
  if (domainTokens.some((w) => tokens.has(w))) {
    return { confirmed: true, by: "domain_brand_match", note: "domain brand appears on the page" };
  }

  // Offline domain<->name corroboration. Works even when the page is unreadable,
  // so a JS-rendered site whose domain is the operator brand is not sent to review.
  if (domainNameCorroborates(context.rawUrl, context.finalUrl, context.name)) {
    return {
      confirmed: true,
      by: "domain_matches_operator_name",
      note: "the registrable domain corresponds to the operator name",
    };
  }

  if (phoneOnPage(context.phone, digitsHaystack)) {
    return { confirmed: true, by: "phone_match", note: "operator phone number appears on the page" };
  }
  if (addressOnPage(context.address, t, digitsHaystack)) {
    return { confirmed: true, by: "address_match", note: "operator street address appears on the page" };
  }

  const matchedTerms = (context.matchedTerms || [])
    .map((s) => String(s).toLowerCase())
    .filter((s) => s.length >= 4);
  const matchedTerm = matchedTerms.find((term) => t.includes(term));
  if (matchedTerm) {
    if (RENTAL_BOOKING_CUE_RE.test(matchedTerm) || RENTAL_BOOKING_CUE_RE.test(t)) {
      return {
        confirmed: true,
        by: "matched_search_term_with_booking_cue",
        note: "matched search term appears on the page with rental/booking language",
      };
    }
  }
  if (readable && hasInDomainActivitySignal && RENTAL_BOOKING_CUE_RE.test(t)) {
    return {
      confirmed: true,
      by: "recreation_site_terms_with_booking_cue",
      note: "page includes in-domain activity language plus a rental/booking cue",
    };
  }

  // No page-level corroboration. Unreadable pages are reviewable, not promoted:
  // Gate 5 is where we verify first-party liveness/relevance before Pass A.
  if (!readable) {
    return {
      confirmed: false,
      reason: "gate5:live_unreadable",
      by: "no_readable_page_text",
      note: "the automated check could not read page text or metadata",
    };
  }
  return {
    confirmed: false,
    reason: "gate5:live_unconfirmed",
    by: "no_first_party_or_recreation_corroboration",
    note: "page text did not corroborate the operator name, domain brand, phone/address, or in-domain activity plus rental/booking terms",
  };
};

// Network-level probe. Result is domain-keyed and cacheable; relevance (which
// is row-specific) is layered on top later by liveSiteCheck.
async function networkProbe(rawUrl) {
  const firstUrl = withUrlScheme(rawUrl, "https");
  if (!firstUrl) {
    return { outcome: "missing", reason: "gate5:no_website_field", note: "No website field." };
  }
  const cacheKey = normDomain(firstUrl) || firstUrl;
  if (!REFRESH_GATE5 && gate5Cache[cacheKey]) return gate5Cache[cacheKey];

  const store = (result) => {
    gate5Cache[cacheKey] = result;
    return result;
  };

  if (isSocialHost(normDomain(firstUrl))) {
    return store({
      outcome: "social",
      reason: "gate5:social_only_site",
      note: `Website is a social/aggregator page (${normDomain(firstUrl)}); needs the operator's own site.`,
    });
  }
  if (isAggregatorHost(normDomain(firstUrl))) {
    return store({
      outcome: "aggregator",
      reason: "gate5:third_party_listing",
      note: `Website is a third-party marketplace/booking listing (${normDomain(firstUrl)}), not the operator's own site.`,
    });
  }

  const attempts = [firstUrl];
  if (!/^https:\/\//i.test(firstUrl)) attempts.unshift(withUrlScheme(rawUrl, "https"));
  if (!attempts.some((u) => /^http:\/\//i.test(u))) attempts.push(withUrlScheme(rawUrl, "http"));

  let lastError = null;
  let blockStatus = null;
  let deadEvidence = false;

  for (const url of [...new Set(attempts.filter(Boolean))]) {
    const probe = await fetchSiteWithRetry(url, "HEAD");
    if (probe.error) {
      lastError = probe.error.message;
      if (isDeadHost(probe.error)) deadEvidence = true;
      continue;
    }
    let res = probe.res;
    if ([405, 403].includes(res.status)) {
      const getProbe = await fetchSiteWithRetry(url, "GET");
      if (getProbe.res) res = getProbe.res;
      else {
        lastError = getProbe.error?.message || lastError;
        if (getProbe.error && isDeadHost(getProbe.error)) deadEvidence = true;
      }
    }
    if (res.status >= 400) {
      if ([401, 403, 429, 451, 503].includes(res.status)) blockStatus = res.status;
      lastError = `HTTP ${res.status}`;
      continue;
    }

    const finalUrl = res.url || url;
    const headStatus = res.status;
    if (isSocialHost(normDomain(finalUrl))) {
      return store({
        outcome: "social",
        reason: "gate5:social_only_site",
        note: `Redirects to a social/aggregator page (${normDomain(finalUrl)}).`,
        final_url: finalUrl,
        http_status: headStatus,
      });
    }
    if (isAggregatorHost(normDomain(finalUrl))) {
      return store({
        outcome: "aggregator",
        reason: "gate5:third_party_listing",
        note: `Redirects to a third-party marketplace/booking listing (${normDomain(finalUrl)}), not the operator's own site.`,
        final_url: finalUrl,
        http_status: headStatus,
      });
    }
    if (!/^https:\/\//i.test(finalUrl)) {
      return store({
        outcome: "unsecured",
        reason: "gate5:unsecured_site",
        note: `Resolved without HTTPS: ${finalUrl}`,
        final_url: finalUrl,
        http_status: headStatus,
      });
    }

    let body = "";
    let contentType = res.headers.get("content-type") || "";
    if (res.bodyUsed === false && (!contentType || contentType.includes("text/html"))) {
      const bodyProbe = await fetchSiteWithRetry(finalUrl, "GET");
      if (bodyProbe.res && bodyProbe.res.ok) {
        res = bodyProbe.res;
        contentType = res.headers.get("content-type") || "";
      }
    }
    if (res.bodyUsed === false && contentType.includes("text/html")) {
      try {
        body = (await res.text()).slice(0, 50000);
      } catch {
        body = "";
      }
    }

    const parked = looksParked(body);
    if (parked) {
      return store({
        outcome: "parked",
        reason: "gate5:placeholder_or_parked_site",
        note: parked,
        final_url: finalUrl,
        http_status: res.status || headStatus,
      });
    }

    const meta = extractStructured(body);
    const soft404 = looksSoft404(body, meta);
    if (soft404) {
      return store({
        outcome: "soft_404",
        reason: "gate5:soft_404",
        note: soft404,
        final_url: finalUrl,
        http_status: res.status || headStatus,
      });
    }

    return store({
      outcome: "live",
      reason: "gate5:live_https",
      note: `Live HTTPS site (${res.status || headStatus}).`,
      final_url: finalUrl,
      http_status: res.status || headStatus,
      text: stripHtmlText(body).slice(0, 4000),
      meta: meta.slice(0, 2000),
    });
  }

  if (blockStatus) {
    return store({
      outcome: "blocked",
      reason: "gate5:site_blocked",
      note: `Server reachable but blocked the automated check (HTTP ${blockStatus}); verify manually.`,
      http_status: blockStatus,
    });
  }
  return store({
    outcome: deadEvidence ? "dead" : "unreachable",
    reason: "gate5:no_live_site",
    note: lastError || (deadEvidence ? "Domain did not resolve (DNS)." : "Site did not resolve."),
  });
}

async function liveSiteCheck(rawUrl, context = {}) {
  const net = await networkProbe(rawUrl);
  if (net.outcome !== "live") return net;
  const rel = relevanceVerdict(net, { ...context, rawUrl, finalUrl: net.final_url });
  if (rel.confirmed) {
    return {
      ...net,
      site_relevance: rel.by,
      note: `${net.note} First-party check: ${rel.note}.`,
    };
  }
  return {
    ...net,
    outcome: "live_unconfirmed",
    reason: rel.reason || "gate5:live_unconfirmed",
    site_relevance: rel.by,
    note: `Live HTTPS site, but ${rel.note} (${net.final_url || rawUrl}). Confirm this is the operator's own site before triage.`,
  };
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
    site_relevance: null,
    manual_review_label: null,
    pre_manual_review_reason: null,
    pre_manual_review_status: null,
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
    // A SPECIFIC in-domain activity (ski/kayak/climbing/…) — as opposed to the
    // generic "gear-shop" catch-all — is strong evidence the sweep found a real
    // gear operator, even if Google miscategorized it (e.g. a SUP-rental cafe
    // tagged coffee_shop, a ski shop tagged clothing_store). Such rows must not be
    // hard-rejected on Places category alone; let them fall through to Gate 5.
    const GENERIC_ACTIVITY_SLUGS = new Set(["gear-shop", "sporting-goods", "sporting_goods"]);
    const hasSpecificRecActivity = [...matchedActivities].some((a) => !GENERIC_ACTIVITY_SLUGS.has(a));
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
    } else if (
      (OUT_OF_SCOPE_BUSINESS.some((b) => b.re.test(hay)) || RETAIL_BRAND_NAMES.test(hay)) &&
      !RENT_SHOP_NAME.test(o.name || "")
    ) {
      // Tier-1 out-of-scope business. Categorically not an adventure-rental operator,
      // so reject regardless of Places category. Escape hatch: an explicit gear-rental
      // shop name (handled by the guard above) keeps it in the pipeline for review.
      const match = OUT_OF_SCOPE_BUSINESS.find((b) => b.re.test(hay));
      setDecision(rec, "out_of_scope", `gate1:${match ? match.reason : "retail_brand"}`);
    } else if (
      !RENT_SHOP_NAME.test(o.name || "") &&
      !hasSpecificRecActivity &&
      o.website &&
      (OBVIOUS_NON_RENTAL_PRIMARY_RAW.has(o.primary_type_raw) ||
        OBVIOUS_NON_RENTAL_NAME.test(hay))
    ) {
      // Recall guard (hasSpecificRecActivity above): a clothing_store/coffee_shop
      // the sweep matched on a specific rec activity is likely a miscategorized
      // gear operator — don't hard-reject; it falls through to Gate 5.
      setDecision(rec, "out_of_scope", "gate1:obvious_non_rental_retail_or_cafe");
    } else if (
      !RENT_SHOP_NAME.test(o.name || "") &&
      (o.primary_type_raw === "travel_agency" || LODGING_NOISE_TYPES.has(o.primary_type_raw)) &&
      VACATION_RENTAL_TRAVEL_NAME.test(hay)
    ) {
      setDecision(rec, "not_an_operator", "gate3:vacation_rental_listing");
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
      // hunting.md §0.2: firearms are out of scope. A firearm/"outfitter" business CAN
      // also rent in-scope hunting gear (optics, bows, blinds, packs) or be a gear-rental
      // shop, so an explicit hunting-gear/rental NAME cue routes to review; a plain
      // gun/ammo business is out of scope (these dominate the review queue otherwise).
      if (HUNTING_GEAR_NAME.test(o.name || "") || RENT_SHOP_NAME.test(o.name || "")) {
        setDecision(
          rec,
          "needs_review",
          "gate3:firearm_business_review",
          "Firearm/ammo name but with an in-scope hunting-gear or rental cue (optics/bows/blinds/outfitter); review the site before excluding (hunting.md §0.2).",
        );
      } else {
        setDecision(
          rec,
          "out_of_scope",
          "gate3:firearm_business",
          "Firearm/ammo business with no in-scope hunting-gear or rental name cue; out of scope (hunting.md §0.2).",
        );
      }
    } else if (
      (VENUE_CLUB_NAME.test(o.name || "") || GOV_PARKS_HOST_RE.test(host || "")) &&
      !RENT_SHOP_NAME.test(o.name || "")
    ) {
      // Venue/club/SNO-Park — not a rental operator even with a live website. A rental
      // signal still routes to review in case a concession operates at the venue.
      setDecision(
        rec,
        o.rental_signal ? "needs_review" : "not_an_operator",
        o.rental_signal ? "gate3:venue_club_rental_signal" : "gate3:venue_club_site",
        o.rental_signal
          ? "Venue/club/SNO-Park name carrying a rental signal; review before excluding (a concession may rent here)."
          : "Venue/club/SNO-Park listing (ski club, rink, range, activity zone, SNO-Park); not a rental operator.",
      );
    } else if (FACILITY_ONLY_NAME.test(o.name || "") && !RENT_SHOP_NAME.test(o.name || "")) {
      // Pure infrastructure/venue (boat ramp, bikeway, snow play area) — not a shop.
      // A rental signal still routes to review in case a concession operates there.
      setDecision(
        rec,
        o.rental_signal ? "needs_review" : "not_an_operator",
        o.rental_signal ? "gate3:facility_only_rental_signal" : "gate3:facility_only_site",
        o.rental_signal
          ? "Facility/venue name (boat ramp/bikeway/snow play) carrying a rental signal; review before excluding."
          : "Facility/venue listing (boat ramp/bikeway/snow play); not a rental operator.",
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
      const ib = intraBatchDuplicate(o);
      if (ib) {
        setDecision(rec, "duplicate", `gate4:intra_batch_domain_name:${ib.key}`, `Same website domain + normalized name as ${ib.first} earlier in this batch.`);
        rec.dedup_note = `intra_batch_duplicate_of:${ib.first}`;
      }
      const dm = rec.status ? { level: "none" } : dedupMatch(o);
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
      const site = await liveSiteCheck(o.website, {
        name: o.name,
        phone: o.phone,
        address: o.address,
        matchedTerms: o.matched_terms || [],
      });
      rec.site_note = site.note || null;
      rec.site_relevance = site.site_relevance || null;
      rec.final_url = site.final_url || null;
      rec.http_status = site.http_status || null;
      // Reasons that mean "live first-party site, relevance just not auto-confirmed."
      // Pass A is cheap and a better judge than a human glance, so these enter Pass A
      // as survivors rather than the human review queue. Clear non-first-party signals
      // (out-of-domain, rental-software/marketplace) and all non-live outcomes stay in
      // review.
      const PASS_A_INCONCLUSIVE = new Set(["gate5:live_unconfirmed", "gate5:live_unreadable"]);
      if (site.outcome === "live") {
        setDecision(rec, "survivor", "cleared_gates_0-5", site.note);
      } else if (PASS_A_INCONCLUSIVE.has(site.reason)) {
        setDecision(rec, "survivor", "cleared_gates_0-5_unconfirmed", site.note);
      } else {
        setDecision(rec, "needs_review", site.reason, site.note);
      }
      trace.push({ gate: 5, result: rec.status, reason: rec.reason, note: rec.site_note });
    } else if (!o.website) {
      setDecision(rec, "needs_review", "gate5_pre:no_website_field", "No website field; web fallback or manual review needed.");
      trace.push({ gate: 5, result: rec.status, reason: rec.reason, note: rec.note });
    } else {
      setDecision(rec, "survivor", "cleared_gates_0-4", "Gate 5 not run; use --gate5 for live-site check.");
      trace.push({ gate: 5, result: "not_run", reason: "gate5:not_requested" });
    }
  }

  const manualReview = manualReviewByPlaceId.get(rec.place_id);
  // Apply the human verdict to any non-rejected outcome (needs_review OR survivor): a
  // human "no" must win even when the gates passed the row to survivor, or it leaks
  // into Pass A.
  if (manualReview && (rec.status === "needs_review" || rec.status === "survivor")) {
    rec.pre_manual_review_status = rec.status;
    rec.pre_manual_review_reason = rec.reason || null;
    rec.manual_review_label = manualReview.label || null;
    rec.review_lane = "operator";
    const isNo = manualReview.label === "no";
    const isDemoOnly = manualReview.label === "demo_only";
    const reason = isNo
      ? "manual_review:not_in_scope_or_no_gear_rental"
      : isDemoOnly
      ? "manual_review:demo_only_for_pass_a"
      : "manual_review:in_scope_rents_gear_for_pass_a";
    const note = isNo
      ? "Quick human review marked this row as not in-scope and renting gear; reject instead of keeping it in review."
      : isDemoOnly
      ? "Quick human review marked this row as demo only; route to Pass A for deeper confirmation before seeding."
      : "Quick human review marked this row as possibly in-scope and renting gear; route to Pass A for deeper confirmation before seeding.";
    setDecision(rec, isNo ? "out_of_scope" : "survivor", reason, note);
    trace.push({
      gate: "manual_review",
      result: rec.status,
      reason,
      note,
      previous_status: rec.pre_manual_review_status,
      previous_reason: rec.pre_manual_review_reason,
      source: manualReviewData.source || manualReviewOverridesPath,
    });
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

  if (!exists(gate5RelevanceFixturesPath)) {
    console.error(`${gate5RelevanceFixturesPath} not found.`);
    return 1;
  }
  const gate5Fixtures = read(gate5RelevanceFixturesPath);
  let gate5Failures = 0;
  for (const fixture of gate5Fixtures) {
    const verdict = relevanceVerdict(fixture.net || {}, fixture.context || {});
    const errors = [];
    if (typeof fixture.expect_confirmed === "boolean" && verdict.confirmed !== fixture.expect_confirmed) {
      errors.push(`expected confirmed ${fixture.expect_confirmed}, got ${verdict.confirmed}`);
    }
    if (fixture.expect_by && verdict.by !== fixture.expect_by) {
      errors.push(`expected by ${fixture.expect_by}, got ${verdict.by}`);
    }
    if (fixture.reason_prefix && !String(verdict.reason || "").startsWith(fixture.reason_prefix)) {
      errors.push(`expected reason prefix ${fixture.reason_prefix}, got ${verdict.reason}`);
    }
    if (fixture.forbidden_by && fixture.forbidden_by.includes(verdict.by)) {
      errors.push(`by ${verdict.by} is forbidden`);
    }

    if (errors.length) {
      gate5Failures++;
      console.log(`FAIL ${fixture.id || "(gate5 unnamed)"}: ${errors.join("; ")}`);
      console.log(`  actual: confirmed=${verdict.confirmed} | by=${verdict.by} | reason=${verdict.reason || ""}`);
    } else {
      console.log(`PASS ${fixture.id || "(gate5 unnamed)"}: confirmed=${verdict.confirmed} | by=${verdict.by}`);
    }
  }
  console.log("--------------------------------------");
  console.log(`${gate5Fixtures.length - gate5Failures}/${gate5Fixtures.length} Gate 5 relevance fixtures passed`);

  // Network-level probe detectors (third-party listings + soft 404). These run
  // inside networkProbe, so cover them as pure-function assertions (no network).
  const detectorChecks = [
    ["aggregator-host-getmyboat", isAggregatorHost("www.getmyboat.com") === true],
    ["aggregator-host-outdoorsy-sub", isAggregatorHost("listings.outdoorsy.com") === true],
    ["aggregator-host-boatsetter", isAggregatorHost("boatsetter.com") === true],
    ["aggregator-host-babyquip", isAggregatorHost("www.babyquip.com") === true],
    ["aggregator-host-site-builder-not-flagged", isAggregatorHost("acme-kayaks.wixsite.com") === false],
    ["aggregator-host-own-domain-not-flagged", isAggregatorHost("tahoekayak.com") === false],
    ["soft404-page-not-found", Boolean(looksSoft404("<title>Page Not Found</title><body>oops</body>", "Page Not Found"))],
    ["soft404-error-404", Boolean(looksSoft404("<body>Error 404 - this page doesn't exist</body>", ""))],
    ["soft404-clean-page-not-flagged", looksSoft404("<body>Welcome to our kayak rental shop on the lake.</body>", "Tahoe Kayak") === null],
  ];
  let detectorFailures = 0;
  for (const [id, ok] of detectorChecks) {
    if (ok) {
      console.log(`PASS ${id}`);
    } else {
      detectorFailures++;
      console.log(`FAIL ${id}`);
    }
  }
  console.log("--------------------------------------");
  console.log(`${detectorChecks.length - detectorFailures}/${detectorChecks.length} Gate 5 detector checks passed`);

  return failures || gate5Failures || detectorFailures ? 1 : 0;
}

if (TEST_FIXTURES) {
  process.exit(await runFixtureTests());
}

// Regression audit against human review labels. Re-classifies every labeled row with
// the CURRENT gate logic and checks: (1) no confirmed operator ("yes") is rejected,
// (2) how many rejected non-operators ("no") are now filtered upstream vs still review.
async function runOverrideAudit() {
  const overridesPath = "manual_gate_review_overrides.json";
  if (!exists(overridesPath)) {
    console.error(`${overridesPath} not found.`);
    return 1;
  }
  const overrides = read(overridesPath).overrides || [];
  if (!exists("sweep_gate_results.json")) {
    console.error("sweep_gate_results.json not found — run the gate ladder first.");
    return 1;
  }
  const byId = new Map((read("sweep_gate_results.json").results || []).map((r) => [r.place_id, r]));
  const REJECT = new Set(["out_of_scope", "out_of_business", "not_an_operator", "duplicate"]);

  const yesRejected = [];
  const noRemaining = [];
  const noByReason = {};
  let noRejected = 0;
  let missing = 0;

  for (const ov of overrides) {
    const rec0 = byId.get(ov.place_id);
    if (!rec0) {
      missing++;
      continue;
    }
    const rec = await classify(rec0);
    const rejected = REJECT.has(rec.status);
    if (ov.label === "yes" || ov.label === "demo_only") {
      if (rejected) yesRejected.push(`${ov.name} -> ${rec.status} | ${rec.reason}`);
    } else if (ov.label === "no") {
      if (rejected) {
        noRejected++;
        noByReason[rec.reason] = (noByReason[rec.reason] || 0) + 1;
      } else {
        noRemaining.push(`${ov.name} -> ${rec.status} | ${rec.reason || "(survivor)"}`);
      }
    }
  }

  const noTotal = overrides.filter((o) => o.label === "no").length;
  const yesTotal = overrides.filter((o) => o.label === "yes" || o.label === "demo_only").length;

  console.log("\n=== OVERRIDE REGRESSION AUDIT ===");
  console.log(`labeled rows: ${overrides.length} (missing from results: ${missing})`);
  console.log(`confirmed operators ("yes"/"demo_only"): ${yesTotal} — wrongly rejected: ${yesRejected.length}`);
  for (const line of yesRejected) console.log(`  FAIL keep-rejected: ${line}`);
  console.log(
    `non-operators ("no"): ${noTotal} — now filtered upstream: ${noRejected} (${noTotal ? Math.round((noRejected / noTotal) * 100) : 0}%), still in review/survivor: ${noRemaining.length}`,
  );
  console.log("-- filtered-by-reason --");
  for (const [reason, n] of Object.entries(noByReason).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(3)} ${reason}`);
  }
  if (process.argv.includes("--verbose")) {
    console.log("-- still in review/survivor (ambiguous, expected) --");
    for (const line of noRemaining) console.log(`  ${line}`);
  }
  console.log("--------------------------------------");
  if (yesRejected.length) {
    console.log(`RESULT: FAIL — ${yesRejected.length} confirmed operator(s) would be rejected.`);
    return 1;
  }
  console.log("RESULT: PASS — no confirmed operator is rejected by the current gates.");
  return 0;
}

if (AUDIT_OVERRIDES) {
  process.exit(await runOverrideAudit());
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
