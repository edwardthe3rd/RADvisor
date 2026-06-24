#!/usr/bin/env node
// RADvisor — Gate Ladder (Gates 0–4) per /extraction/00_general.md §4
// Runs on the UNFILTERED sweep (quadtree_sweep_operators.json), dedups against the
// OLD sifted set (operators.json + operator_website_verified.json) WITHOUT modifying them.
// Gates 0–4 are no-network (Places payload only). Gate 5 (liveness) + Pass A are done later via web.
// Output: sweep_gate_results.json (every row + decision) and console funnel.
// Principle (§4.1): keep the blocklist CONSERVATIVE — reject only on strong signals; when in doubt, pass down.

import fs from "node:fs";
import { QUERIES } from "./quadtree_sweep_queries.mjs";

const SEED = new URL(".", import.meta.url).pathname;
const read = (f) => JSON.parse(fs.readFileSync(SEED + f, "utf8"));

const sweep = read("quadtree_sweep_operators.json").operators;
const oldOps = read("operators.json");                       // 443 curated (canonical seed)
const verified = read("operator_website_verified.json");      // keyed by slug

// ---- Locality reference points (id, center, radius in m) — used ONLY by the
// Gate 0 nearest-point/slack check below to score how far a row sits from the
// covered basin. NOT a discovery input (the sweep is driven by AOI_RECTS in
// quadtree_sweep_queries.mjs). Edit these to retune Gate 0's region cutoff. ----
const ANCHORS = [
  { id: "reno",             lat: 39.5296, lng: -119.8138, r: 12000 },
  { id: "sparks",           lat: 39.5349, lng: -119.7527, r: 10000 },
  { id: "verdi",            lat: 39.5180, lng: -120.0090, r:  8000 },
  { id: "carson-city",      lat: 39.1638, lng: -119.7674, r: 10000 },
  { id: "gardnerville",     lat: 38.9407, lng: -119.7513, r:  9000 },
  { id: "south-lake-tahoe", lat: 38.9399, lng: -119.9772, r: 10000 },
  { id: "tahoe-city",       lat: 39.1677, lng: -120.1445, r: 10000 },
  { id: "truckee",          lat: 39.3280, lng: -120.1833, r: 12000 },
  { id: "incline-village",  lat: 39.2497, lng: -119.9527, r:  8000 },
  { id: "kings-beach",      lat: 39.2380, lng: -120.0263, r:  6000 },
  { id: "donner-summit",    lat: 39.3128, lng: -120.3303, r:  8000 },
  { id: "kirkwood",         lat: 38.6850, lng: -120.0656, r:  8000 },
  { id: "zephyr-cove",      lat: 39.0030, lng: -119.9430, r:  6000 },
  { id: "virginia-city",    lat: 39.3097, lng: -119.6502, r:  6000 },
  { id: "carson-valley-e",  lat: 39.1500, lng: -119.5500, r: 18000 },
  { id: "hope-valley-s",    lat: 38.7800, lng: -119.9200, r: 12000 },
  { id: "reno-north",       lat: 39.7400, lng: -119.9100, r: 13000 },
  { id: "spanish-springs",  lat: 39.7200, lng: -119.7350, r: 13000 },
  { id: "washoe-valley",    lat: 39.3000, lng: -119.8000, r: 12000 },
  { id: "tahoe-west-shore", lat: 39.0200, lng: -120.1400, r: 13000 },
];

const haversine = (a, b, c, d) => {
  const R = 6371000, t = Math.PI / 180;
  const dLat = (c - a) * t, dLng = (d - b) * t;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a * t) * Math.cos(c * t) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};
const nearestAnchor = (lat, lng) => {
  let best = { id: null, dist: Infinity, slack: Infinity };
  for (const an of ANCHORS) {
    const dist = haversine(lat, lng, an.lat, an.lng);
    const slack = dist - an.r; // <=0 means inside
    if (slack < best.slack) best = { id: an.id, dist, slack, r: an.r };
  }
  return best;
};

const normDomain = (url) => {
  if (!url) return null;
  try {
    let h = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return h;
  } catch { return String(url).toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] || null; }
};
const slugify = (s) => (s || "").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
const normName = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

// ---- Gate 1 blocklists (STRONG signals only) ----
const NAME_BLOCK = [
  // moving / utility
  /u-?haul/i, /penske/i, /budget truck/i, /self[-\s]?storage/i, /storage unit/i, /box truck/i,
  // tool / construction equipment
  /home depot/i, /sunbelt rentals/i, /united rentals/i, /\bahern\b/i, /herc rentals/i, /tool rental/i,
  /equipment rental/i, /scaffold/i, /\bbobcat\b/i, /\bbackhoe\b/i, /excavator/i, /skid steer/i,
  // car / passenger rental brands
  /enterprise rent/i, /\bhertz\b/i, /\bavis\b/i, /\bbudget car/i, /\bturo\b/i, /\balamo\b/i, /\bdollar rent/i, /\bthrifty\b/i, /national car/i,
  // party / event
  /party rental/i, /event rental/i, /bounce house/i, /bouncing around/i, /tent rental/i, /linen/i, /photo booth/i, /porta[-\s]?pott/i, /portable restroom/i, /catering/i,
  // other non-rec rental
  /medical supply/i, /mobility/i, /\bnumotion\b/i, /furniture rental/i, /appliance rental/i, /formalwear/i, /tuxedo/i, /costume/i, /dumpster/i,
];
// Booking platforms / directories ONLY. NOT facebook/instagram — a social page is often a
// small operator's only web presence, so those route to review (web-fallback), never out_of_scope.
const DOMAIN_AGG_BLOCK = [
  "outdoorsy.com", "rvshare.com", "spinlister.com", "getmyboat.com", "yelp.com",
  "tripadvisor.com", "expedia.com", "viator.com", "airbnb.com", "vrbo.com",
  "booking.com", "redawning.com", "evolve.com",
];
const AGG_NAME = /chamber of commerce|merchants association|visitor center|visitors bureau|riverwalk merchants/i;
const RENTAL_IN_NAME = /\brent(al|als|s)?\b|\bhire\b|outfitter/i;

// road-only RV signal (camping_vehicles rough-terrain rule, Gate 1) — only a *hint*; Pass A resolves
const RV_ROADONLY = /\bRV\b|motorhome|class [abc]\b|fifth[-\s]?wheel|travel trailer|\bKOA\b/i;
const RV_OVERLAND = /4x4|4wd|awd|off[-\s]?road|overland|expedition|sportsmobile|storyteller|sprinter/i;

// POI geographic types (Gate 3a) — reject only if NO website (do NOT use the types[] array:
// "point_of_interest"/"establishment" appear on nearly every row and over-reject real shops).
const POI_PRIMARY = /^(park|state park|national park|regional park|natural feature|hiking area|tourist attraction|beach|river|lake|national forest|scenic spot|rest stop)$/i;
const POI_NAME = /trailhead|sno-?park|wilderness|state recreation area|nature trail|staging area|boat ramp|scenic (overlook|view)|\bpeak\b|\bsummit\b(?! (sports|county))/i;

// ---- Build OLD-set dedup index ----
const oldDomains = new Set();
const oldNameLoc = []; // {nn, lat, lng}
for (const o of oldOps) {
  const d = normDomain(o.website); if (d) oldDomains.add(d);
  if (o.lat && o.lng) oldNameLoc.push({ nn: normName(o.name), lat: o.lat, lng: o.lng });
}
const verifiedSlugs = new Set(Object.keys(verified));

const dedupMatch = (o) => {
  const d = normDomain(o.website);
  if (d && oldDomains.has(d)) return { hit: true, by: "domain:" + d };
  const slug = slugify(o.name);
  if (verifiedSlugs.has(slug)) return { hit: true, by: "verified-slug:" + slug };
  const nn = normName(o.name);
  // require >=8 chars to avoid generic short-token collisions (e.g. "scuba")
  if (nn.length >= 8) for (const c of oldNameLoc) {
    if (c.nn === nn && o.lat && o.lng && haversine(o.lat, o.lng, c.lat, c.lng) < 200)
      return { hit: true, by: "name+loc:" + nn };
  }
  return { hit: false };
};

// ---- Run the ladder ----
const out = [];
const tally = {};
const bump = (s) => (tally[s] = (tally[s] || 0) + 1);
const termMeta = new Map(QUERIES.map((q) => [q.term, q]));

for (const o of sweep) {
  const rec = { place_id: o.place_id, name: o.name, website: o.website || null,
                primary_type: o.primary_type, lat: o.lat, lng: o.lng,
                rating: o.rating, user_rating_count: o.user_rating_count,
                rental_signal: o.rental_signal, matched_activities: o.matched_activities,
                matched_terms: o.matched_terms || [], matched_tiers: o.matched_tiers || [],
                pure_service_area_business: Boolean(o.pure_service_area_business),
                matched_modes: o.matched_modes || [] };
  let status = null, reason = null, note = null;

  // Gate 0 — Locality. Per EC: maximize recall — add a 50km buffer to every anchor edge and keep
  // everything inside it as a plausible operator. Only drop truly other-region rows (Vegas, Utah,
  // Bay Area, Sacramento). geo_zone records where each kept row sits so the AOI can be tightened later.
  const GEO_BUFFER_M = 50000, GEO_FRINGE_M = 65000;
  if (!Number.isFinite(o.lat) || !Number.isFinite(o.lng)) {
    rec.nearest_anchor = null; rec.anchor_slack_m = null;
    rec.geo_zone = o.pure_service_area_business || rec.matched_modes.includes("service-area")
      ? "service_area_unknown_location"
      : "unknown_location";
    if (!o.pure_service_area_business && !rec.matched_modes.includes("service-area")) {
      status = "needs_review"; reason = "gate0:no_location";
    }
  } else {
    const na = nearestAnchor(o.lat, o.lng);
    rec.nearest_anchor = na.id; rec.anchor_slack_m = Math.round(na.slack);
    rec.geo_zone = na.slack <= 0 ? "in_circle" : (na.slack <= GEO_BUFFER_M ? "buffer_50km" : (na.slack <= GEO_FRINGE_M ? "fringe" : "far"));
    if (na.slack > GEO_FRINGE_M) {
      status = "out_of_region"; reason = "gate0:beyond_buffer"; note = `${Math.round(na.dist/1000)}km to nearest ${na.id} (other region)`;
    } else if (na.slack > GEO_BUFFER_M && o.rental_signal) {
      // 50-65km fringe with a rental signal routes to review, not a silent drop.
      status = "needs_review"; reason = "gate0:fringe_rental_signal"; note = `${Math.round(na.slack/1000)}km past ${na.id} edge`;
    } else if (na.slack > GEO_BUFFER_M) {
      status = "out_of_region"; reason = "gate0:beyond_50km_buffer"; note = `${Math.round(na.dist/1000)}km to nearest ${na.id}`;
    }
  }

  // Gate 1 — Domain relevance (test name + primary_type only; types[] is too noisy)
  if (!status) {
    const hay = `${o.name} ${o.primary_type || ""}`;
    if (NAME_BLOCK.some((re) => re.test(hay))) { status = "out_of_scope"; reason = "gate1:blocklist"; }
    else if (/^car rental agency$/i.test(o.primary_type || "") && !RV_OVERLAND.test(hay) && !/powersport|atv|utv|jeep|motorcycle|snowmobile/i.test(hay)) {
      status = "out_of_scope"; reason = "gate1:car_rental_agency";
    } else if (RV_ROADONLY.test(hay) && !RV_OVERLAND.test(hay) && /rv|motorhome|trailer/i.test(o.name || "")) {
      // road-only RV hint in the NAME itself — soft, send to review (Pass A applies rough-terrain rule)
      status = "needs_review"; reason = "gate1:rv_roadonly_hint";
    }
  }

  // Gate 2 — Operational status
  if (!status) {
    const bs = o.business_status;
    if (bs === "CLOSED_PERMANENTLY") { status = "out_of_business"; reason = "gate2:closed_permanently"; }
    else if (bs === "CLOSED_TEMPORARILY") { status = "needs_review"; reason = "gate2:closed_temporarily"; }
    else if (!bs) { status = "needs_review"; reason = "gate2:no_business_status"; }
  }

  // Gate 3 — Real operator, not POI/marketplace
  if (!status) {
    const d = normDomain(o.website);
    if (d && DOMAIN_AGG_BLOCK.includes(d)) { status = "out_of_scope"; reason = "gate3:aggregator_domain:" + d; }
    else if (AGG_NAME.test(o.name || "")) { status = "out_of_scope"; reason = "gate3:aggregator_name"; }
    else if (!o.website && (POI_PRIMARY.test(o.primary_type || "") || POI_NAME.test(o.name || ""))
             && !RENTAL_IN_NAME.test(o.name || "")) {
      // rental signal in the NAME overrides POI classification → preserve for web-fallback review
      status = "not_an_operator"; reason = "gate3:public_poi_no_website";
    }
  }

  // Gate 4 — Dedup
  if (!status) {
    const dm = dedupMatch(o);
    if (dm.hit) { status = "duplicate"; reason = "gate4:" + dm.by; }
  }

  // Survivor
  if (!status) {
    if (!o.website) { status = "needs_review"; reason = "gate5_pre:no_website_field"; }
    else { status = "survivor"; reason = "cleared_gates_0-4"; }
  }

  rec.status = status; rec.reason = reason; if (note) rec.note = note;
  out.push(rec);
  bump(status);
}

// Prioritize survivors (ordering only): rental_signal, then review count
const survivors = out.filter((r) => r.status === "survivor")
  .sort((a, b) => (Number(b.rental_signal) - Number(a.rental_signal)) || ((b.user_rating_count||0) - (a.user_rating_count||0)));

const termStats = new Map();
for (const r of out) {
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

fs.writeFileSync(SEED + "sweep_gate_results.json", JSON.stringify({
  ranAt: new Date().toISOString(),
  input_count: sweep.length,
  tally,
  survivor_count: survivors.length,
  term_contribution_after_gates,
  results: out,
  survivor_queue: survivors.map((r,i)=>({ rank:i+1, ...r })),
}, null, 2));

// ---- Funnel ----
const order = ["out_of_region","out_of_scope","out_of_business","not_an_operator","duplicate","needs_review","survivor"];
console.log("\n=== GATE LADDER FUNNEL (Gates 0–4) ===");
console.log("input rows:", sweep.length);
for (const s of order) if (tally[s]) console.log(String(tally[s]).padStart(5), s);
const other = Object.keys(tally).filter(k=>!order.includes(k));
for (const s of other) console.log(String(tally[s]).padStart(5), s, "(unexpected)");
console.log("--------------------------------------");
console.log("survivors → Pass A queue:", survivors.length);
console.log("needs_review (human glance):", tally.needs_review || 0);
console.log("wrote sweep_gate_results.json");
