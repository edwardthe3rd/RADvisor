/**
 * Intake classifier — decide whether a Google Places business is a gear-rental
 * operator, and if so, categorize it. Pure function over the signal bundle that
 * build_dataset.mjs / classify_batch.mjs produce.
 *
 * Tuned against the live DB (see validate.mjs). Outcomes:
 *   keep    — confident gear-rental operator (with categories/subcats/flags)
 *   reject  — confident NOT a rental operator (tour/charter/dealer/retail/etc.)
 *   review  — ambiguous; needs a human (no signal either way, possibly closed)
 *
 * Thresholds chosen so confident decisions are high-precision and the residue
 * goes to review rather than being guessed.
 */

import { detectAcquisition, SUBCATEGORY_KEYWORDS } from "../lib.mjs";

// primaryTypes with ZERO active operators in the DB → safe hard reject.
const HARD_REJECT_TYPES = new Set([
  "association_or_organization",
  "educational_institution",
  "sports_school",
  "gym",
  "airport",
  "consultant",
  "car_dealer",
  "sportswear_store",
]);

// Soft-reject types: present on both sides — reject only without a rental signal.
const SOFT_REJECT_TYPES = new Set(["clothing_store", "car_repair", "school"]);

// Name patterns with ZERO active hits → hard reject.
const AERIAL_RE = /\b(paraglid\w*|hang[\s-]?glid\w*|parasail\w*|soaring|skydiv\w*|aviation)\b/i;
const ORG_RE = /\b(501\(?c\)?\s?3?|non[\s-]?profit|bike co-?op|clean[\s-]?up the|conservancy)\b/i;

// Name/summary patterns that signal a non-rental business model.
const DEALER_RE = /\b(powersports?|motorsports?|harley|yamaha|kawasaki|ducati|polaris dealer|dealership)\b/i;
const TOUR_RE = /\b(charters?|guided tours?|guide service|expeditions?|snowcat tours?|jeep tours?|whitewater tours?|snowmobile tours?)\b/i;
const SCHOOL_RE = /\b(academy|driving school|flight school|\bschool of\b)\b/i;
const SERVICE_RE = /\b(diving services|environmental (services|llc)|taxonomic|robotix|equipment cleaners?|consulting)\b/i;
// Only summary phrases with ZERO active operators (empirically verified).
const SUMMARY_REJECT_RE =
  /\b(dealership|boat charter|adventure tour offers|tourist attraction offers)\b/i;

// Rental intent in name (strong keep regardless of model).
const NAME_RENTAL_RE = /\brent(als?|ing)?\b/i;
const KEEP_TYPES = new Set(["adventure_sports_center"]);

// Coarse category hints from Google primaryType (used when keyword detection is thin).
const TYPE_CATEGORY_HINT = {
  bicycle_store: ["mountain_biking", "road_cycling"],
  marina: ["water_sports"],
  boat_rental_service: ["water_sports"],
  ski_resort: ["snow_sports"],
};

// Each category belongs to an activity domain; a strongly-typed business can't
// cross domains (a marina is never snow). Generic types impose no constraint.
const CATEGORY_DOMAIN = {
  snow_sports: "snow",
  winter_other: "snow",
  water_sports: "water",
  mountain_biking: "cyc",
  road_cycling: "cyc",
  electric_transport: "cyc",
  burning_man_bikes: "cyc",
  motorcycles: "moto",
  off_road: "moto",
  rock_climbing: "climb",
  camping: "camp",
  aerial: "air",
};
const TYPE_ALLOWED_DOMAINS = {
  bicycle_store: ["cyc"],
  marina: ["water"],
  ski_resort: ["snow"],
};

// Name tokens that pin a business to one activity domain. Only used to gate when
// the name names exactly ONE domain (multi-domain names like "BlueZone Sports"
// stay ungated). Conservative — avoids dropping real categories.
const NAME_DOMAIN_TOKENS = {
  water: /\b(watersports?|marina|boat rentals?|paddle ?boards?|kayaks?|wakeboard|jet ?ski|parasail)\b/i,
  snow: /\b(ski (?:shop|resort|rentals?|haus)|snowboard|nordic|snow sports?|telemark)\b/i,
  cyc: /\b(bikes?|bicycles?|cyclery|cycling|e-?bike)\b/i,
  moto: /\b(powersports?|motorsports?|\batv\b|\butv\b|off[\s-]?road|motorcycle)\b/i,
  climb: /\b(climbing|bouldering)\b/i,
};

function nameDomains(name) {
  const n = name || "";
  const ds = Object.keys(NAME_DOMAIN_TOKENS).filter((d) => NAME_DOMAIN_TOKENS[d].test(n));
  return ds.length === 1 ? ds : null; // only gate on an unambiguous single-domain name
}

function gateByDomain(categories, primaryType, name) {
  const allowed = TYPE_ALLOWED_DOMAINS[primaryType] || nameDomains(name);
  if (!allowed) return categories;
  return categories.filter((c) => allowed.includes(CATEGORY_DOMAIN[c]));
}

function detectedCategories(subcatsByCat) {
  return Object.keys(subcatsByCat || {});
}

function unionSubcats(subcatsByCat, categories) {
  const out = new Set();
  for (const c of categories) for (const s of subcatsByCat?.[c] || []) out.add(s);
  return [...out].sort();
}

/**
 * @param {object} row signal bundle: { name, primaryType, types[], summary,
 *   webReachable, webRental, webDemo, webLease, webRetailOnly, subcatsByCat }
 */
export function classifyOperator(row) {
  const name = (row.name || "").toLowerCase();
  const summary = (row.summary || "").toLowerCase();
  const pt = row.primaryType || "";
  const text = `${name} ${summary}`;

  const rentalSignal =
    row.webRental === true ||
    NAME_RENTAL_RE.test(name) ||
    detectAcquisition(text).rental;

  const reasons = [];

  // --- Closed business: Google often still reports OPERATIONAL, so trust the
  // website's own "closed / going out of business" wording. ---
  if (row.webClosed) {
    return decision("reject", 0.85, "business appears closed (website)", row);
  }

  // --- Hard rejects: signals with ZERO active operators → auto-reject even past
  // a weak rental keyword (these business models don't rent gear to consumers). ---
  let hardReject = null;
  if (HARD_REJECT_TYPES.has(pt)) hardReject = `type:${pt}`;
  else if (AERIAL_RE.test(name)) hardReject = "aerial flight (name)";
  else if (ORG_RE.test(name)) hardReject = "nonprofit/co-op (name)";
  else if (SERVICE_RE.test(text)) hardReject = "commercial service (name/summary)";
  else if (SUMMARY_REJECT_RE.test(summary)) hardReject = "non-rental business (summary)";

  if (hardReject) {
    return decision("reject", 0.9, `not a rental operator — ${hardReject}`, row);
  }

  // --- Soft markers: each has some active members, so one alone is only
  // suspicious → review; two independent markers → confident reject. ---
  if (DEALER_RE.test(text)) reasons.push("dealer");
  if (TOUR_RE.test(text)) reasons.push("tour/charter/guide");
  if (SCHOOL_RE.test(name)) reasons.push("school/academy");
  if (SOFT_REJECT_TYPES.has(pt)) reasons.push(`type:${pt}`);
  if (row.webRetailOnly) reasons.push("retail-only");

  const keep = rentalSignal || KEEP_TYPES.has(pt);

  if (keep) {
    if (reasons.length === 0)
      return decision("keep", row.webRental ? 0.85 : 0.7, "rental signal present", row);
    // Rental signal AND a non-rental marker → human call.
    return decision("review", 0.5, `rental signal but also: ${reasons.join(", ")}`, row);
  }

  // No rental signal:
  if (reasons.length >= 2)
    return decision("reject", 0.8, `likely not rental — ${reasons.join(", ")}`, row);
  if (reasons.length === 1)
    return decision("review", 0.45, `possible non-rental (${reasons[0]}) — no rental signal found`, row);

  // Nothing either way — often a JS-only site, missing summary, or closed business.
  return decision("review", 0.4, "no rental signal and no clear model — verify (site may be JS-only or closed)", row);
}

function decision(outcome, confidence, reason, row) {
  let categories = [];
  let subcategories = [];
  if (outcome === "keep" || outcome === "review") {
    categories = gateByDomain(detectedCategories(row.subcatsByCat), row.primaryType, row.name);
    if (!categories.length && TYPE_CATEGORY_HINT[row.primaryType]) {
      categories = [...TYPE_CATEGORY_HINT[row.primaryType]];
    }
    subcategories = unionSubcats(row.subcatsByCat, categories);
  }
  return {
    decision: outcome,
    confidence,
    reason,
    categories,
    subcategories,
    offers_rental: outcome === "keep" ? true : undefined,
    offers_demo: row.webDemo === true || undefined,
    offers_season_lease: row.webLease === true || undefined,
  };
}

export const CLASSIFIER_VERSION = "1.0.0";
