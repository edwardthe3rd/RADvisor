// Pass B category universe + locked extraction vocabularies.
//
// PASS_B_CATEGORIES is the complete set of real inventory categories. It mirrors
// web/lib/config/categories.ts, excluding the synthetic `uncategorized` browse bucket.
// A category is ready for Pass B only when it has BOTH an extraction document and an
// entry in CATEGORY_VOCAB. The batch emitter enforces that readiness globally because
// incoming Pass A tags are hints: any operator may reveal any in-scope category.

export const PASS_B_CATEGORIES = [
  "snow_sports",
  "mountain_biking",
  "road_cycling",
  "burning_man_bikes",
  "water_sports",
  "camping",
  "camping_vehicles",
  "off_road",
  "motorcycles",
  "rock_climbing",
  "mountaineering",
  "hunting",
  "fishing",
  "disc_golf",
  "electric_transport",
];

export const PASS_B_CATEGORY_SET = new Set(PASS_B_CATEGORIES);

// The item price tiers, shared by the applier (validation) and the report (coverage stats) so
// the two cannot drift apart — they previously held separate copies and the report silently
// stopped counting a tier the applier had already accepted.
// `price_season` holds a whole-season lease/membership price (rental_type "season_lease").
export const PRICE_FIELDS = [
  "price_hourly",
  "price_half_day",
  "price_full_day",
  "price_multi_day",
  "price_weekly",
  "price_season",
  "deposit",
];

// Add a key only after the matching instructions/extraction/<slug>.md file is locked.
// Presence here means the vocabulary is production-ready, not merely drafted.
export const CATEGORY_VOCAB = {
  snow_sports: {
    subcategories: [
      "alpine_ski", "backcountry_ski", "telemark_ski", "cross_country_ski", "snowboard",
      "splitboard", "snowshoe", "sled", "snowmobile", "timbersled", "apparel_snow",
      "avalanche_safety", "ice_skates",
    ],
    gear_types: [
      "ski", "snowblade", "snowboard", "splitboard", "boots", "poles", "bindings", "helmet",
      "jacket", "pants", "goggles", "beacon", "shovel", "probe", "airbag_canister",
      "climbing_skins", "backpack", "airbag_backpack", "ice_axe", "crampons", "ski_crampons",
      "snowshoes", "sled", "saucer", "snowskate", "ski_bike", "snow_boots", "ice_skates",
      "snowmobile", "timbersled",
    ],
    attributes: {
      gear_type: null,
      quality_grade: ["basic", "standard", "performance"],
      is_kids: "boolean",
      rental_type: ["rental", "demo", "season_lease"],
      adjustable: "boolean",
      snowboard_binding_interface: ["step_on", "standard"],
      crampon_binding: ["strap", "newmatic", "cramp_o_matic"],
    },
  },
};

// Activity derivation (the cross-category winter/browse axis — snow_sports.md §1a).
// Activities are DERIVED from extracted items, never trusted from the extractor, so a claim
// that no item supports is rejected. The axis deliberately spans categories: `fat_bike` comes
// from mountain_biking, `snow_camp` from camping, `winter_mountaineering` from mountaineering
// as well as snow_sports. Every category MUST get an entry here when its vocabulary locks —
// without one, any correct activity claim on that category is rejected and the operator's
// activities[] can never be populated from it.
//
// Each rule: { activity, subcategories?: [...], gear_types?: [...] }. A rule fires for an item
// when its subcategory is listed (when `subcategories` is present) AND its gear_type is listed
// (when `gear_types` is present).
export const CATEGORY_ACTIVITIES = {
  snow_sports: [
    { activity: "ski_snowboard", subcategories: ["alpine_ski", "backcountry_ski", "telemark_ski", "cross_country_ski", "snowboard", "splitboard"] },
    { activity: "snowshoe", subcategories: ["snowshoe"] },
    { activity: "sled", subcategories: ["sled"] },
    { activity: "snowmobile", subcategories: ["snowmobile", "timbersled"] },
    { activity: "ice_skate", subcategories: ["ice_skates"] },
    { activity: "winter_mountaineering", subcategories: ["backcountry_ski"], gear_types: ["ice_axe", "crampons", "ski_crampons"] },
  ],
  // Add one entry per category as it locks (mountain_biking -> fat_bike on fat-tire gear,
  // camping -> snow_camp on 4-season gear, mountaineering -> winter_mountaineering, ...).
};

export function deriveActivities(category, items) {
  const rules = CATEGORY_ACTIVITIES[category];
  if (!rules) return [];
  const out = new Set();
  for (const item of items || []) {
    const sub = item?.subcategory;
    const gear = item?.attributes?.gear_type;
    for (const rule of rules) {
      if (rule.subcategories && !rule.subcategories.includes(sub)) continue;
      if (rule.gear_types && !rule.gear_types.includes(gear)) continue;
      out.add(rule.activity);
    }
  }
  return [...out];
}

// A locked vocabulary without an activity rule silently breaks the activities axis for that
// category, so readiness treats it as not-locked (see vocabReadiness.missing_activities).
export function vocabReadiness(extractionFileExists = () => true) {
  const locked = new Set(Object.keys(CATEGORY_VOCAB));
  return {
    missing_vocab: PASS_B_CATEGORIES.filter((category) => !locked.has(category)),
    missing_files: PASS_B_CATEGORIES.filter((category) => !extractionFileExists(category)),
    unexpected_vocab: [...locked].filter((category) => !PASS_B_CATEGORY_SET.has(category)),
    // A vocabulary is only truly locked once its activity derivation exists (§1a).
    missing_activities: [...locked].filter((category) => !CATEGORY_ACTIVITIES[category]),
  };
}

export function isPassBReady(readiness) {
  return (
    readiness.missing_vocab.length === 0 &&
    readiness.missing_files.length === 0 &&
    readiness.unexpected_vocab.length === 0 &&
    readiness.missing_activities.length === 0
  );
}

// Categories that are fully ready to extract right now (vocabulary + activity rules).
// Used by the pilot path, which runs before the global gate can open.
export function lockedCategories() {
  return Object.keys(CATEGORY_VOCAB).filter((category) => CATEGORY_ACTIVITIES[category]);
}
