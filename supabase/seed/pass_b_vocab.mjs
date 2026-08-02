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
  // price_weekend and price_monthly added 2026-08-01 after FOUR independent waves lost published
  // prices to prose. Weekend: Carson City's gear library prints DAY/WEEKEND/WEEK columns — a
  // weekend is the most common recreational rental window and had nowhere to go. Monthly: Gear Hut
  // prices bear canisters $3/night, $15/week, $35/month. Both are directly evidenced, trivially
  // comparable, and cheaper than continuing to bury real numbers in `description`.
  "price_weekend",
  "price_weekly",
  "price_monthly",
  "price_season",
  "deposit",
];

// The attribute set shared by all four cycling categories (instructions/extraction/cycling_core.md
// §2). Spread into each entry rather than retyped, for the same reason PRICE_FIELDS moved here:
// four hand-maintained copies drift. Deltas add keys; nothing removes them.
// The four pre-existing compact files (mountaineering, hunting, fishing, disc_golf) each document
// `rental_type: rental | package`, while every category authored during Phase 1 uses
// `rental | demo | season_lease`. Widening to the union keeps each file's documented intent AND
// lets a cross-category filter ("show me demo gear") work, without editing four locked contracts.
// `package` is arguably redundant with the full_kit / disc_set / full_climbing_kit subcategories —
// a cleanup to consider at calibration, not a change to make silently now.
const RENTAL_TYPES = ["rental", "demo", "season_lease", "package"];

const CYCLING_CORE_ATTRIBUTES = {
  gear_type: null,
  // "16" added 2026-08-01 from a live rate card: Anderson's rents kids bikes in 16"/20"/24".
  wheel_size: ["16", "20", "24", "26", "27.5", "29", "650b", "700c"],
  suspension: ["rigid", "hardtail", "full"],
  quality_grade: ["basic", "standard", "performance"],
  rental_type: ["rental", "demo", "season_lease"],
  is_kids: "boolean",
};

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

  // Locked 2026-08-01. Attribute set derived from cached evidence for 134 of the 148 queue
  // operators (the 00_general §12 calibration pass) — see instructions/extraction/water_sports.md
  // §2 for per-key density, and §2.1 for the keys deliberately rejected below the bar
  // (weight_capacity_lbs 8%, delivery_available 7%, fuel_included 4%, length_ft -> `size`).
  water_sports: {
    subcategories: [
      "kayak", "canoe", "paddleboard", "raft", "jet_ski", "wakeboard", "foil", "efoil",
      "wetsuit", "boat",
    ],
    gear_types: [
      "kayak", "canoe", "paddleboard", "raft", "towable_tube",
      "jet_ski",
      "wakeboard", "wakesurf_board", "water_skis", "kneeboard", "tow_rope",
      "foilboard", "foil_wing", "efoil",
      "pontoon", "bowrider", "wakesurf_boat", "ski_boat", "sailboat", "pedal_boat",
      // Added 2026-08-01 from Action Watersports' live rate card: a pedal-driven bike on a SUP
      // hull ($55/hr) and a motorised SUP ($65/hr). Both are real priced SKUs and neither is a
      // paddleboard or an efoil. Filed under the `paddleboard` subcategory.
      "sup_bike", "sup_e_scooter",
      "wetsuit", "drysuit", "pfd", "paddle", "dry_bag", "water_helmet",
      "scuba_bcd", "regulator", "dive_tank", "mask_fins_snorkel",
    ],
    attributes: {
      gear_type: null,
      capacity_people: "number",
      hull_type: ["inflatable", "hard_shell"],
      // captain_required exists to record the option on operators who ALSO offer bareboat; an
      // item that is only available with a required captain is a charter, not a rental (§8).
      operation_mode: ["bareboat", "captain_optional", "captain_required"],
      is_clear: "boolean",
      wetsuit_thickness_mm: "number",
      quality_grade: ["basic", "standard", "performance"],
      rental_type: ["rental", "demo", "season_lease"],
      is_kids: "boolean",
    },
  },

  // --- Cycling cluster, locked 2026-08-01. Shared core: instructions/extraction/cycling_core.md.
  // ROUTING (EC decision, cycling_core.md §1): power source is the primary axis. Every
  // battery-powered rideable belongs to electric_transport, which is why mountain_biking has no
  // `ebike_mtb` and road_cycling has no `ebike` — the bounded vocabulary is what enforces the
  // routing rule, so a mis-filed e-bike is rejected instead of landing in the wrong browse bucket.
  // `accessory` is a cluster-wide subcategory for small gear an operator prices as a STANDALONE
  // rental rather than a bundled add-on (helmet, lock, spare battery, repair kit, child seat).
  // Added 2026-08-01 after a paper extraction: Tahoe Bike Company sells "Child Seat $3/hr,
  // $10/half, $12/day" as its own line, which had no home. It does not drive browse membership.
  mountain_biking: {
    subcategories: ["mountain_bike", "fat_bike", "accessory"],
    gear_types: ["mountain_bike", "fat_bike", "helmet", "lock", "bike_rack", "bike_trailer", "repair_kit"],
    attributes: { ...CYCLING_CORE_ATTRIBUTES },
  },

  road_cycling: {
    subcategories: [
      "road_bike", "gravel_bike", "cruiser_bike", "tandem_bike", "kids_bike",
      // `surrey` = pedal-powered multi-seat quadricycle (2-pedal / 4-pedal); `trike` = upright
      // adult three-wheeler. Both are real, separately-priced Tahoe rental products with no slug
      // in categories.ts — see road_cycling.md §6.
      "surrey", "trike",
      "bike_trailer", "bike_rack", "accessory",
    ],
    gear_types: [
      "road_bike", "gravel_bike", "cruiser_bike", "tandem_bike", "kids_bike", "surrey", "trike",
      "helmet", "lock", "bike_rack", "bike_trailer", "child_seat", "repair_kit",
    ],
    attributes: { ...CYCLING_CORE_ATTRIBUTES },
  },

  electric_transport: {
    subcategories: ["ebike", "ebike_mtb", "e_scooter", "onewheel", "euc", "segway", "accessory"],
    gear_types: [
      "ebike", "ebike_mtb", "fat_ebike", "e_scooter", "onewheel", "euc", "segway",
      "helmet", "lock", "spare_battery", "bike_rack", "bike_trailer",
    ],
    attributes: {
      ...CYCLING_CORE_ATTRIBUTES,
      // 36% within this category — the e-bike distinction operators actually publish.
      // e_assist_class (5%) is deliberately description-only; see electric_transport.md §3.
      assist_mode: ["pedal_assist", "throttle", "both"],
    },
  },

  burning_man_bikes: {
    subcategories: ["playa_bike", "accessory"],
    gear_types: ["playa_bike", "helmet", "lock", "bike_rack"],
    attributes: { ...CYCLING_CORE_ATTRIBUTES },
  },

  // --- Powersports pair, locked 2026-08-01 (off_road.md, motorcycles.md).
  // off_road is the SUMMER category: snowmobiles/timbersleds stay in snow_sports. A TRACKED UTV
  // stays off_road per snow_sports.md §9 but still reaches winter browse via the activity axis.
  off_road: {
    subcategories: ["atv", "utv", "dirt_bike"],
    gear_types: ["atv", "utv", "tracked_utv", "dirt_bike", "helmet", "goggles", "riding_gear", "trailer", "gas_can"],
    attributes: {
      gear_type: null,
      // 30% — the UTV buying question (2-seat RZR vs 6-seat Ranger). Same role capacity_people
      // plays in water_sports. engine_cc (7%) and street_legal (7%) failed the bar → description.
      seat_count: "number",
      quality_grade: ["basic", "standard", "performance"],
      rental_type: ["rental", "demo", "season_lease"],
      is_kids: "boolean",
    },
  },

  motorcycles: {
    // autocycle + moped_scooter added 2026-08-01: licence-free road vehicles (Polaris Slingshot,
    // Can-Am Spyder, Honda Ruckus) had no home in the taxonomy and were being dropped entirely.
    // The dividing line from off_road is street-legality; from electric_transport, power source.
    subcategories: ["street_moto", "adventure_moto", "autocycle", "moped_scooter"],
    gear_types: [
      "street_moto", "adventure_moto", "autocycle", "moped_scooter",
      "helmet", "riding_gear", "luggage", "trailer",
    ],
    attributes: {
      gear_type: null,
      quality_grade: ["basic", "standard", "performance"],
      rental_type: ["rental", "demo", "season_lease"],
      // is_kids deliberately absent: every subcategory is a licensed road vehicle with a minimum
      // driving age — a guaranteed empty facet (motorcycles.md §3.1).
    },
  },

  // --- Camping pair, locked 2026-08-01. NOTE: taxonomy-derived, not density-measured — only 4
  // and 3 queue operators respectively, with 0% signal for overland/camper-van terms. Both files
  // say so explicitly and flag the first real extraction as their calibration pass.
  camping: {
    subcategories: ["tent", "sleep_system", "backpack", "cooking", "camp_furniture", "full_kit"],
    gear_types: [
      "tent", "tarp", "bivy", "sleeping_bag", "sleeping_pad", "cot", "quilt",
      "backpack", "daypack", "stove", "cookset", "cooler", "water_filter", "lantern", "headlamp",
      "camp_chair", "camp_table", "shade_shelter", "bear_canister", "trekking_poles", "full_kit",
    ],
    attributes: {
      gear_type: null,
      capacity_people: "number",
      // Load-bearing for the snow_camp activity, not merely a facet — see camping.md §4.
      season_rating: ["3_season", "4_season"],
      quality_grade: ["basic", "standard", "performance"],
      rental_type: ["rental", "demo", "season_lease"],
      is_kids: "boolean",
    },
  },

  camping_vehicles: {
    subcategories: ["overland_rig", "camper_van", "rooftop_tent", "overland_trailer", "moto_overland", "vehicle_accessories"],
    gear_types: [
      "overland_rig", "camper_van", "rooftop_tent", "overland_trailer", "moto_overland_kit",
      "awning", "recovery_gear", "fridge_12v", "roof_rack", "dual_battery", "water_tank", "ground_tent",
    ],
    attributes: {
      gear_type: null,
      // `sleeps` rather than capacity_people: a rig's sleeping and seating capacity differ.
      sleeps: "number",
      drivetrain: ["4x4", "awd", "2wd"],
      quality_grade: ["basic", "standard", "performance"],
      rental_type: ["rental", "demo", "season_lease"],
    },
  },

  rock_climbing: {
    subcategories: ["climbing_shoes", "harness", "rope_hardware", "crash_pad", "full_climbing_kit"],
    gear_types: [
      "climbing_shoes", "harness", "helmet", "rope_dynamic", "rope_static", "belay_device",
      "quickdraw", "carabiner", "sling_runner", "cam", "nut_set", "chalk_bag", "crash_pad",
      "approach_shoes", "full_climbing_kit",
    ],
    attributes: {
      gear_type: null,
      discipline: ["sport", "trad", "boulder", "gym"],
      quality_grade: ["basic", "standard", "performance"],
      rental_type: RENTAL_TYPES,
      is_kids: "boolean",
    },
  },

  // --- The four pre-existing compact files, locked 2026-08-01 from their own documented
  // vocabularies. Their attribute sets are taken verbatim from the .md files rather than
  // redesigned; only rental_type was widened (see RENTAL_TYPES above).
  mountaineering: {
    subcategories: ["mountaineering_boots", "ice_axe", "crampons", "rope_hardware", "helmet", "full_kit"],
    gear_types: [
      "boots_single", "boots_double", "ice_axe_walking", "ice_axe_technical",
      "crampons_strap", "crampons_step_in", "crampons_technical",
      "rope_dynamic", "rope_static", "harness", "helmet", "ice_screw", "picket",
      "crevasse_rescue_kit", "belay_device", "carabiner", "sling_runner", "glacier_kit",
    ],
    attributes: {
      gear_type: null,
      is_kids: "boolean",
      rental_type: RENTAL_TYPES,
      boot_rating: ["B1", "B2", "B3"],
      crampon_rating: ["C1", "C2", "C3"],
      rope_length_m: "number",
      rope_diameter_mm: "number",
    },
  },

  hunting: {
    subcategories: ["optics", "blind_treestand", "game_cart_pack", "archery", "accessories"],
    gear_types: [
      "binoculars", "spotting_scope", "rangefinder", "tripod", "thermal_optic", "night_vision",
      "ground_blind", "popup_blind", "tree_stand", "saddle", "climbing_sticks",
      "game_cart", "hauling_pack", "cooler",
      "compound_bow", "recurve_bow", "traditional_bow", "crossbow", "release", "target",
      "trail_camera", "decoy", "game_call",
    ],
    attributes: {
      gear_type: null,
      rental_type: RENTAL_TYPES,
      optic_magnification: null,
      bow_hand: ["right", "left"],
      draw_weight_lb: "number",
      blind_capacity: "number",
    },
  },

  fishing: {
    subcategories: ["fly_fishing", "spin_conventional", "ice_fishing", "float_tube", "waders", "accessories"],
    gear_types: [
      "fly_rod", "fly_reel", "fly_combo", "spin_rod", "spin_reel", "spin_combo",
      "casting_rod", "conventional_reel", "ice_rod",
      "auger_hand", "auger_gas", "auger_electric", "ice_shelter", "flasher",
      "float_tube", "kick_boat", "personal_pontoon", "fins",
      "waders", "wading_boots", "net", "vest_pack", "fish_finder", "cooler",
    ],
    attributes: {
      gear_type: null,
      is_kids: "boolean",
      rental_type: RENTAL_TYPES,
      water_type: ["freshwater", "saltwater"],
      line_weight: null,
      rod_length: null,
    },
  },

  disc_golf: {
    subcategories: ["disc_set", "basket"],
    gear_types: ["disc_driver", "disc_midrange", "disc_putter", "disc_set", "basket_portable", "bag"],
    attributes: {
      gear_type: null,
      is_kids: "boolean",
      rental_type: RENTAL_TYPES,
      set_count: "number",
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
  // The activity axis is the cross-category WINTER browse grouping, so a summer-only category
  // maps to nothing. An explicit [] is a LOCKED value, not a missing one — vocabReadiness()
  // treats an absent key as not-locked and holds the global gate closed.
  water_sports: [],

  // Cycling cluster. A fat bike surfaces in WINTER browse while staying a summer-category item —
  // this is the clearest case for the axis spanning categories. Because e-bikes route to
  // electric_transport by power source, the e-fat-bike rule has to live there too, and it matches
  // on gear_type rather than subcategory: a plain ebike_mtb is not a winter fat bike.
  mountain_biking: [{ activity: "fat_bike", subcategories: ["fat_bike"] }],
  electric_transport: [{ activity: "fat_bike", gear_types: ["fat_ebike"] }],
  road_cycling: [],
  burning_man_bikes: [],

  // A tracked UTV keeps its correct summer CATEGORY while reaching winter browse through the
  // activity axis — same split as the e-fat-bike. Keyed on gear_type so an ordinary RZR fires
  // nothing. This does not contradict snow_sports.md §9: that rule governs category, this browse.
  off_road: [{ activity: "snowmobile", gear_types: ["tracked_utv"] }],
  motorcycles: [],

  // The ONLY activity rule keyed on a non-gear_type attribute: winter-capability is a property of
  // the gear rather than a product class, so a 4-season tent and a winter bag are different
  // gear_types serving one activity (camping.md §4). deriveActivities matches subcategories and
  // gear_types only, so this rule needs the `attributes` matcher added alongside it.
  camping: [{ activity: "snow_camp", attributes: { season_rating: "4_season" } }],
  camping_vehicles: [],

  rock_climbing: [],
  // Alpine/ice gear is what makes an operator a winter-mountaineering option. Boot crampons and
  // ice axes live here rather than in rock_climbing per the shared-gear rule (mountaineering.md
  // §1), so this is the only place the activity can fire from in that pair.
  mountaineering: [{
    activity: "winter_mountaineering",
    gear_types: [
      "ice_axe_walking", "ice_axe_technical",
      "crampons_strap", "crampons_step_in", "crampons_technical",
      "glacier_kit",
    ],
  }],
  hunting: [],
  fishing: [],
  disc_golf: [],
  // Add one entry per category as it locks (camping -> snow_camp on 4-season gear,
  // mountaineering -> winter_mountaineering, ...).
};

const ACTIVITY_MATCHERS = ["subcategories", "gear_types", "attributes"];

export function deriveActivities(category, items) {
  const rules = CATEGORY_ACTIVITIES[category];
  if (!rules) return [];
  const out = new Set();
  for (const item of items || []) {
    const sub = item?.subcategory;
    const attrs = item?.attributes || {};
    for (const rule of rules) {
      // A rule with NO matcher would fire on every item in the category. That is never intended
      // and is silent when it happens, so it is treated as a no-match rather than a match —
      // caught while adding camping's attribute-keyed snow_camp rule (2026-08-01).
      if (!ACTIVITY_MATCHERS.some((k) => rule[k])) continue;
      if (rule.subcategories && !rule.subcategories.includes(sub)) continue;
      if (rule.gear_types && !rule.gear_types.includes(attrs.gear_type)) continue;
      // Attribute matcher: every listed key must equal the item's value. Enables activities keyed
      // on a gear PROPERTY rather than a product class (camping.md §4 — season_rating 4_season).
      if (rule.attributes && !Object.entries(rule.attributes).every(([k, v]) => attrs[k] === v)) continue;
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
