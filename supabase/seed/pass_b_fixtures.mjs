import fs from "node:fs";
import os from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const seedDir = dirname(fileURLToPath(import.meta.url));
const applyScript = join(seedDir, "pass_b_apply.mjs");
const fixturePath = join(seedDir, "pass_b_fixtures.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

const snowItem = (overrides = {}) => ({
  name: "Fixture Ski Package",
  subcategory: "alpine_ski",
  brand: null,
  model: null,
  size: null,
  skill_level: "all",
  price_full_day: 50,
  attributes: { gear_type: "ski", quality_grade: "standard" },
  addons: [],
  source_url: "https://example.com/snow-rentals",
  description: "Fixture item.",
  ...overrides,
});

// water_sports is exercised against the REAL locked vocabulary (pass_b_vocab.mjs), not a
// synthetic stand-in — the fixture file deliberately no longer overrides it, so these cases
// break if the shipped water_sports enums regress.
const waterItem = (overrides = {}) => ({
  name: "Fixture Kayak",
  subcategory: "kayak",
  brand: null,
  model: null,
  size: null,
  skill_level: "all",
  price_full_day: 40,
  attributes: { gear_type: "kayak" },
  addons: [],
  source_url: "https://example.com/water-rentals",
  description: "Fixture item.",
  ...overrides,
});

const boatItem = (overrides = {}) => ({
  name: "Fixture Pontoon",
  subcategory: "boat",
  brand: null,
  model: null,
  size: "25 ft",
  skill_level: "all",
  price_half_day: 599,
  price_full_day: 999,
  attributes: {
    gear_type: "pontoon",
    capacity_people: 12,
    operation_mode: "bareboat",
    quality_grade: "standard",
  },
  addons: [{ name: "Captain (per hour)", price: 50 }],
  source_url: "https://example.com/boat-rentals",
  description: "Fixture item. Fuel not included.",
  ...overrides,
});

// Cycling fixtures run against the REAL locked vocabularies (pass_b_vocab.mjs) — the fixture
// file no longer overrides mountain_biking, so these break if the shipped enums regress.
const fatBikeItem = (overrides = {}) => ({
  name: "Fixture Fat Bike",
  subcategory: "fat_bike",
  brand: null,
  model: null,
  size: "L",
  skill_level: "all",
  price_full_day: 65,
  attributes: { gear_type: "fat_bike", suspension: "hardtail", wheel_size: "27.5" },
  addons: [],
  source_url: "https://example.com/bike-rentals",
  description: "Fixture item.",
  ...overrides,
});

const seasonLeaseItem = (overrides = {}) => ({
  name: "Fixture Season Lease Package",
  subcategory: "alpine_ski",
  brand: null,
  model: null,
  size: null,
  skill_level: "all",
  price_season: 599,
  attributes: { gear_type: "ski", rental_type: "season_lease" },
  addons: [],
  source_url: "https://example.com/season-lease",
  description: "Fixture item.",
  ...overrides,
});

const cruiserItem = (overrides = {}) => ({
  name: "Fixture Comfort Cruiser",
  subcategory: "cruiser_bike",
  brand: null,
  model: null,
  size: "M",
  skill_level: "beginner",
  price_hourly: 18,
  price_half_day: 33,
  price_full_day: 44,
  attributes: { gear_type: "cruiser_bike", suspension: "rigid", wheel_size: "26", quality_grade: "basic" },
  addons: [{ name: "Helmet", price: 0 }],
  source_url: "https://example.com/bike-rentals",
  description: "Fixture item.",
  ...overrides,
});

const eBikeItem = (overrides = {}) => ({
  name: "Fixture Comfort E-Bike",
  subcategory: "ebike",
  brand: null,
  model: null,
  size: "L",
  skill_level: "all",
  price_hourly: 29,
  price_full_day: 64,
  attributes: { gear_type: "ebike", assist_mode: "pedal_assist", suspension: "rigid" },
  addons: [],
  source_url: "https://example.com/ebike-rentals",
  description: "Fixture item.",
  ...overrides,
});

const extracted = (place_id, category, items, extra = {}) => ({
  place_id,
  category,
  outcome: "extracted",
  note: `Extracted fixture ${category} inventory.`,
  activities: category === "snow_sports" ? ["ski_snowboard"] : [],
  items,
  ...extra,
});

const notFound = (place_id, category, extra = {}) => ({
  place_id,
  category,
  outcome: "category_not_found",
  checked_url: `https://example.com/${category}-check`,
  note: `Checked fixture site; ${category} was not offered.`,
  items: [],
  ...extra,
});

// `unlock` forces a category to behave as though its vocabulary were never locked, for the one
// case that has to exercise the deferral path. It is PER-CASE because once all 15 categories are
// locked there is no naturally-unlocked category left to test with — a global `null` override in
// pass_b_fixtures.json would instead break every real test of that category.
function runCase(name, results, { ok, message, inspect, reapply = false, applyArgs = [], unlock = [] }) {
  const dir = fs.mkdtempSync(join(os.tmpdir(), "radvisor-pass-b-fixture-"));
  const input = join(dir, "input.json");
  const vocab = join(dir, "fixture-vocab.json");
  const testVocab = { ...fixture.test_vocab };
  for (const category of unlock) testVocab[category] = null;
  fs.writeFileSync(join(dir, "sweep_pass_a_triage.json"), JSON.stringify(fixture.triage, null, 2));
  fs.writeFileSync(input, JSON.stringify(results, null, 2));
  fs.writeFileSync(vocab, JSON.stringify(testVocab, null, 2));
  const argv = [applyScript, input, "--data-dir", dir, "--fixture-vocab", vocab, ...applyArgs];
  let output = "";
  let succeeded = true;
  try {
    output = execFileSync(process.execPath, argv, {
      encoding: "utf8",
      env: { ...process.env, PASS_B_FIXTURE_MODE: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (reapply) {
      execFileSync(process.execPath, argv, {
        encoding: "utf8",
        env: { ...process.env, PASS_B_FIXTURE_MODE: "1" },
        stdio: ["ignore", "pipe", "pipe"],
      });
    }
  } catch (error) {
    succeeded = false;
    output = `${error.stdout || ""}${error.stderr || ""}`;
  }
  if (succeeded !== ok) throw new Error(`${name}: expected ok=${ok}, got ok=${succeeded}\n${output}`);
  if (message && !output.includes(message)) throw new Error(`${name}: missing expected message "${message}"\n${output}`);
  if (succeeded && inspect) {
    const triage = JSON.parse(fs.readFileSync(join(dir, "sweep_pass_a_triage.json"), "utf8"));
    inspect({ dir, triage });
  }
  console.log(`✓ ${name}`);
}

function row(triage, placeId) {
  return triage.results.find((entry) => entry.place_id === placeId);
}

export async function runPassBFixtures() {
  runCase(
    "untagged locked extraction is accepted and confirmed",
    [extracted("fixture-water-only", "snow_sports", [snowItem()])],
    {
      ok: true,
      inspect: ({ dir, triage }) => {
        const operator = row(triage, "fixture-water-only");
        if (!operator.categories.includes("snow_sports")) throw new Error("discovered snow_sports was not confirmed");
        const log = JSON.parse(fs.readFileSync(join(dir, "pass_b_snow_sports_results.json"), "utf8"));
        if (log.results[0].category_origin !== "pass_b_discovered") throw new Error("discovery origin was not audited");
      },
    },
  );

  runCase(
    "untagged locked needs_review enters the review queue",
    [{
      place_id: "fixture-water-only",
      category: "snow_sports",
      outcome: "needs_review",
      note: "ACTION: inspect the inaccessible winter booking widget.",
      items: [],
    }],
    {
      ok: true,
      inspect: ({ triage }) => {
        if (!row(triage, "fixture-water-only").review_categories.includes("snow_sports")) {
          throw new Error("discovered needs_review category was lost");
        }
      },
    },
  );

  runCase(
    "locked self-heal requires its own same-visit result",
    [extracted("fixture-snow-only", "snow_sports", [snowItem()], {
      self_heal_categories: [{
        category: "water_sports",
        source_url: "https://example.com/water-rentals",
        note: "The same site also lists kayak rentals.",
      }],
    })],
    { ok: false, message: "submit it as its own same-visit category result" },
  );

  runCase(
    "unlocked self-heal is deferred with an audit disposition",
    [extracted("fixture-snow-only", "snow_sports", [snowItem()], {
      self_heal_categories: [{
        category: "camping",
        source_url: "https://example.com/camping-rentals",
        note: "The site lists take-away tent rentals.",
      }],
    })],
    {
      ok: true,
      unlock: ["camping"],
      inspect: ({ dir, triage }) => {
        if (!row(triage, "fixture-snow-only").review_categories.includes("camping")) {
          throw new Error("unlocked self-heal was not deferred");
        }
        const log = JSON.parse(fs.readFileSync(join(dir, "pass_b_snow_sports_results.json"), "utf8"));
        if (log.results[0].self_heal_categories[0].disposition !== "deferred_unlocked_vocabulary") {
          throw new Error("deferred self-heal disposition missing");
        }
      },
    },
  );

  runCase(
    "direct result without locked vocabulary rejects",
    [extracted("fixture-snow-only", "camping", [waterItem()])],
    { ok: false, message: "has no locked vocabulary", unlock: ["camping"] },
  );

  runCase(
    "combined removal plus discovered extraction preserves the operator",
    [
      notFound("fixture-snow-only", "snow_sports"),
      extracted("fixture-snow-only", "water_sports", [waterItem()]),
    ],
    {
      ok: true,
      inspect: ({ triage }) => {
        const operator = row(triage, "fixture-snow-only");
        if (operator.categories.join(",") !== "water_sports" || operator.status !== "triaged") {
          throw new Error("combined operator state was not applied correctly");
        }
      },
    },
  );

  runCase(
    "combined removals require an operator status",
    [
      notFound("fixture-two-categories", "snow_sports"),
      notFound("fixture-two-categories", "water_sports"),
    ],
    { ok: false, message: "combined Pass B results leave this triaged operator with zero categories" },
  );

  runCase(
    "combined removals with one operator status re-route atomically",
    [
      notFound("fixture-two-categories", "snow_sports", { operator_status: "out_of_scope" }),
      notFound("fixture-two-categories", "water_sports"),
    ],
    {
      ok: true,
      inspect: ({ triage }) => {
        const operator = row(triage, "fixture-two-categories");
        if (operator.categories.length || operator.review_categories.length || operator.status !== "out_of_scope") {
          throw new Error("operator was not re-routed from the combined final state");
        }
      },
    },
  );

  for (const [name, item, message] of [
    ["bad gear_type rejects", snowItem({ attributes: { gear_type: "surfboard" } }), "gear_type"],
    ["unknown attribute rejects", snowItem({ attributes: { gear_type: "ski", invented: true } }), "attribute key"],
    ["zero price rejects", snowItem({ price_full_day: 0 }), "price_full_day is 0"],
  ]) {
    runCase(name, [extracted("fixture-snow-only", "snow_sports", [item])], { ok: false, message });
  }

  // --- water_sports, against the real locked vocabulary (see waterItem/boatItem note above) ---

  runCase(
    "water_sports boat with capacity/operation_mode applies",
    [extracted("fixture-water-only", "water_sports", [boatItem()])],
    {
      ok: true,
      inspect: ({ dir }) => {
        const log = JSON.parse(fs.readFileSync(join(dir, "pass_b_water_sports_results.json"), "utf8"));
        const a = log.results[0].items[0].attributes;
        if (a.capacity_people !== 12 || a.operation_mode !== "bareboat") {
          throw new Error(`water_sports attributes not persisted: ${JSON.stringify(a)}`);
        }
      },
    },
  );

  // Guards the "number" rule branch, which had NO validation until water_sports introduced the
  // first numeric attributes — a string capacity used to be stored verbatim.
  runCase(
    "non-numeric capacity_people rejects",
    [extracted("fixture-water-only", "water_sports", [boatItem({
      attributes: { gear_type: "pontoon", capacity_people: "eight", operation_mode: "bareboat" },
    })])],
    { ok: false, message: "must be a number" },
  );

  runCase(
    "out-of-vocabulary operation_mode rejects",
    [extracted("fixture-water-only", "water_sports", [boatItem({
      attributes: { gear_type: "pontoon", capacity_people: 8, operation_mode: "skippered" },
    })])],
    { ok: false, message: "operation_mode" },
  );

  // A snow gear_type must not be accepted on a water item just because both vocabularies are
  // locked — the jet ski / water ski substring family is the reason this guard exists.
  runCase(
    "snow gear_type on a water_sports item rejects",
    [extracted("fixture-water-only", "water_sports", [waterItem({ attributes: { gear_type: "ski" } })])],
    { ok: false, message: "not in water_sports vocabulary" },
  );

  // price_season was added after the 2026-08-01 pilot, where season leases and memberships had
  // no tier to land in and were filed with every price null. Guards both halves: the field is
  // accepted, and it counts as a real price (so it must NOT trip the no-price-on-any-tier warning).
  runCase(
    "season lease price applies and counts as a priced item",
    [extracted("fixture-snow-only", "snow_sports", [seasonLeaseItem()])],
    {
      ok: true,
      inspect: ({ dir }) => {
        const log = JSON.parse(fs.readFileSync(join(dir, "pass_b_snow_sports_results.json"), "utf8"));
        const item = log.results[0].items[0];
        if (item.price_season !== 599) throw new Error(`price_season not persisted, got ${item.price_season}`);
      },
    },
  );

  runCase(
    "zero price_season rejects like any other tier",
    [extracted("fixture-snow-only", "snow_sports", [seasonLeaseItem({ price_season: 0 })])],
    { ok: false, message: "price_season is 0" },
  );

  runCase(
    "duplicate item signature rejects",
    [extracted("fixture-snow-only", "snow_sports", [snowItem(), snowItem()])],
    { ok: false, message: "duplicate item signature" },
  );

  runCase(
    "unsupported activity rejects",
    [extracted("fixture-snow-only", "snow_sports", [snowItem()], { activities: ["snowshoe"] })],
    { ok: false, message: "activities not supported" },
  );

  // Regression guard: the activity axis is cross-category (snow_sports.md §1a). Before the
  // derivation moved into pass_b_vocab.mjs, ANY activity on a non-snow category was rejected
  // and operators.activities[] could never receive fat_bike / snow_camp.
  runCase(
    "valid non-snow activity applies and reaches the operator",
    [extracted("fixture-bike-only", "mountain_biking", [fatBikeItem()], { activities: ["fat_bike"] })],
    {
      ok: true,
      inspect: ({ triage }) => {
        const operator = row(triage, "fixture-bike-only");
        if (!(operator.activities || []).includes("fat_bike")) {
          throw new Error("cross-category activity was not derived onto the operator");
        }
      },
    },
  );

  runCase(
    "non-snow activity unsupported by the extracted items still rejects",
    [extracted("fixture-bike-only", "mountain_biking", [fatBikeItem({ subcategory: "mountain_bike", attributes: { gear_type: "mountain_bike" } })], { activities: ["fat_bike"] })],
    { ok: false, message: "activities not supported" },
  );

  // --- cycling cluster routing (cycling_core.md §1), against the real locked vocabularies ---
  // The bounded vocabulary IS the enforcement mechanism for the power-source routing decision,
  // so these two rejections are the rule working rather than incidental validation.
  runCase(
    "e-bike mis-routed to road_cycling rejects",
    [extracted("fixture-bike-only", "road_cycling", [eBikeItem()])],
    { ok: false, message: "not in road_cycling vocabulary" },
  );

  runCase(
    "e-MTB mis-routed to mountain_biking rejects",
    [extracted("fixture-bike-only", "mountain_biking", [eBikeItem({ subcategory: "ebike_mtb", attributes: { gear_type: "ebike_mtb" } })])],
    { ok: false, message: "not in mountain_biking vocabulary" },
  );

  runCase(
    "human-powered cruiser applies to road_cycling with hourly pricing",
    [extracted("fixture-bike-only", "road_cycling", [cruiserItem()])],
    {
      ok: true,
      inspect: ({ dir }) => {
        const log = JSON.parse(fs.readFileSync(join(dir, "pass_b_road_cycling_results.json"), "utf8"));
        const it = log.results[0].items[0];
        if (it.price_hourly !== 18 || it.attributes.suspension !== "rigid") {
          throw new Error(`cruiser not persisted correctly: ${JSON.stringify(it)}`);
        }
      },
    },
  );

  // An e-fat-bike lives in electric_transport by power source, so the winter fat_bike activity
  // has to fire from THERE — and it matches on gear_type, not subcategory.
  runCase(
    "e-fat-bike derives the fat_bike activity from electric_transport",
    [extracted("fixture-bike-only", "electric_transport", [eBikeItem({
      name: "Fixture E-Fat Bike",
      subcategory: "ebike_mtb",
      attributes: { gear_type: "fat_ebike", assist_mode: "both" },
    })], { activities: ["fat_bike"] })],
    {
      ok: true,
      inspect: ({ triage }) => {
        const op = row(triage, "fixture-bike-only");
        if (!(op.activities || []).includes("fat_bike")) {
          throw new Error("fat_bike activity did not derive from electric_transport");
        }
      },
    },
  );

  runCase(
    "plain e-MTB does NOT derive the fat_bike activity",
    [extracted("fixture-bike-only", "electric_transport", [eBikeItem({
      subcategory: "ebike_mtb", attributes: { gear_type: "ebike_mtb", assist_mode: "pedal_assist" },
    })], { activities: ["fat_bike"] })],
    { ok: false, message: "activities not supported" },
  );

  // --- powersports: the tracked-UTV split (off_road.md §4) ---
  // The category rule (snow_sports.md §9) and the browse rule pull in opposite directions here,
  // and they are resolved on different axes. Both directions are asserted.
  runCase(
    "tracked UTV stays off_road and derives the snowmobile activity",
    [extracted("fixture-bike-only", "off_road", [{
      name: "Fixture Tracked RZR",
      subcategory: "utv",
      brand: null, model: null, size: "RZR XP 4 1000", skill_level: "intermediate",
      price_full_day: 450,
      attributes: { gear_type: "tracked_utv", seat_count: 4 },
      addons: [{ name: "Damage waiver", price: 45 }],
      source_url: "https://example.com/utv-rentals",
      description: "Fixture item.",
    }], { activities: ["snowmobile"] })],
    {
      ok: true,
      inspect: ({ triage }) => {
        const op = row(triage, "fixture-bike-only");
        if (!(op.activities || []).includes("snowmobile")) {
          throw new Error("tracked UTV did not derive the snowmobile activity");
        }
        if ((op.categories || []).includes("snow_sports")) {
          throw new Error("tracked UTV wrongly landed in snow_sports");
        }
      },
    },
  );

  runCase(
    "untracked UTV does NOT derive the snowmobile activity",
    [extracted("fixture-bike-only", "off_road", [{
      name: "Fixture Ranger 570",
      subcategory: "utv",
      brand: null, model: null, size: "Ranger 570", skill_level: "beginner",
      price_full_day: 350,
      attributes: { gear_type: "utv", seat_count: 2 },
      addons: [],
      source_url: "https://example.com/utv-rentals",
      description: "Fixture item.",
    }], { activities: ["snowmobile"] })],
    { ok: false, message: "activities not supported" },
  );

  runCase(
    "non-numeric seat_count rejects",
    [extracted("fixture-bike-only", "off_road", [{
      name: "Fixture Four Seater",
      subcategory: "utv",
      brand: null, model: null, size: null, skill_level: "all",
      price_full_day: 400,
      attributes: { gear_type: "utv", seat_count: "four" },
      addons: [],
      source_url: "https://example.com/utv-rentals",
      description: "Fixture item.",
    }])],
    { ok: false, message: "seat_count must be a number" },
  );

  // is_kids is deliberately absent from the motorcycles vocabulary (motorcycles.md §3.1) —
  // this asserts the omission is enforced rather than merely documented.
  runCase(
    "is_kids on a motorcycles item rejects",
    [extracted("fixture-bike-only", "motorcycles", [{
      name: "Fixture Adventure Bike",
      subcategory: "adventure_moto",
      brand: null, model: null, size: "R 1250 GS", skill_level: "advanced",
      price_full_day: 225,
      attributes: { gear_type: "adventure_moto", is_kids: false },
      addons: [{ name: "Panniers", price: 0 }],
      source_url: "https://example.com/moto-rentals",
      description: "Fixture item.",
    }])],
    { ok: false, message: "attribute key \"is_kids\"" },
  );

  // --- camping: the only attribute-keyed activity rule (camping.md §4) ---
  // Guards the derivation change that made `attributes` a matcher. Before it, a rule with no
  // recognised matcher fired on EVERY item in the category, so snow_camp would have been claimed
  // for a 3-season tent.
  const campItem = (overrides = {}) => ({
    name: "Fixture 4-Season Tent",
    subcategory: "tent",
    brand: null, model: null, size: "2P", skill_level: "all",
    price_full_day: 45,
    attributes: { gear_type: "tent", capacity_people: 2, season_rating: "4_season" },
    addons: [],
    source_url: "https://example.com/camp-rentals",
    description: "Fixture item.",
    ...overrides,
  });

  runCase(
    "4-season gear derives the snow_camp activity",
    [extracted("fixture-bike-only", "camping", [campItem()], { activities: ["snow_camp"] })],
    {
      ok: true,
      inspect: ({ triage }) => {
        const op = row(triage, "fixture-bike-only");
        if (!(op.activities || []).includes("snow_camp")) {
          throw new Error("snow_camp did not derive from season_rating");
        }
      },
    },
  );

  runCase(
    "3-season gear does NOT derive snow_camp",
    [extracted("fixture-bike-only", "camping", [campItem({
      name: "Fixture 3-Season Tent",
      attributes: { gear_type: "tent", capacity_people: 2, season_rating: "3_season" },
    })], { activities: ["snow_camp"] })],
    { ok: false, message: "activities not supported" },
  );

  // --- the four pre-existing compact files, locked from their own documented vocabularies ---
  // `package` came from those files; `demo` came from the Phase 1 standard. RENTAL_TYPES is the
  // union, so both must be accepted on the same category or the widening silently failed.
  runCase(
    "compact-file rental_type accepts both `package` and `demo`",
    [extracted("fixture-bike-only", "mountaineering", [
      {
        name: "Fixture Glacier Kit",
        subcategory: "full_kit",
        brand: null, model: null, size: null, skill_level: "advanced",
        price_full_day: 95,
        attributes: { gear_type: "glacier_kit", rental_type: "package" },
        addons: [], source_url: "https://example.com/mtn", description: "Fixture item.",
      },
      {
        name: "Fixture Demo Ice Tools",
        subcategory: "ice_axe",
        brand: null, model: null, size: null, skill_level: "advanced",
        price_full_day: 40,
        attributes: { gear_type: "ice_axe_technical", rental_type: "demo" },
        addons: [], source_url: "https://example.com/mtn", description: "Fixture item.",
      },
    ], { activities: ["winter_mountaineering"] })],
    {
      ok: true,
      inspect: ({ triage }) => {
        const op = row(triage, "fixture-bike-only");
        if (!(op.activities || []).includes("winter_mountaineering")) {
          throw new Error("winter_mountaineering did not derive from alpine gear");
        }
      },
    },
  );

  runCase(
    "free-text attribute (line_weight) accepts a string",
    [extracted("fixture-bike-only", "fishing", [{
      name: "Fixture 5wt Fly Combo",
      subcategory: "fly_fishing",
      brand: null, model: null, size: "9ft", skill_level: "all",
      price_full_day: 35,
      attributes: { gear_type: "fly_combo", line_weight: "5wt", water_type: "freshwater" },
      addons: [], source_url: "https://example.com/fly", description: "Fixture item.",
    }])],
    { ok: true },
  );

  runCase(
    "rock_climbing discipline enum is enforced",
    [extracted("fixture-bike-only", "rock_climbing", [{
      name: "Fixture Crash Pad",
      subcategory: "crash_pad",
      brand: null, model: null, size: null, skill_level: "all",
      price_full_day: 20,
      attributes: { gear_type: "crash_pad", discipline: "aid" },
      addons: [], source_url: "https://example.com/climb", description: "Fixture item.",
    }])],
    { ok: false, message: "discipline" },
  );

  // Crampons belong to mountaineering, never rock_climbing (rock_climbing.md §2 / the
  // mountaineering.md §1 shared-gear rule). The bounded vocabulary is what enforces that.
  runCase(
    "crampons on a rock_climbing item rejects (shared-gear split)",
    [extracted("fixture-bike-only", "rock_climbing", [{
      name: "Fixture Crampons",
      subcategory: "rope_hardware",
      brand: null, model: null, size: null, skill_level: "advanced",
      price_full_day: 25,
      attributes: { gear_type: "crampons_technical" },
      addons: [], source_url: "https://example.com/climb", description: "Fixture item.",
    }])],
    { ok: false, message: "not in rock_climbing vocabulary" },
  );

  runCase(
    "out-of-vocabulary assist_mode rejects",
    [extracted("fixture-bike-only", "electric_transport", [eBikeItem({ attributes: { gear_type: "ebike", assist_mode: "turbo" } })])],
    { ok: false, message: "assist_mode" },
  );

  // A pilot runs before every vocabulary is locked, so its visit could not observe categories
  // that had no schema yet. The stamp is what keeps the operator queued for a full re-visit —
  // without it, a pilot-visited operator would be silently treated as finished.
  runCase(
    "pilot results are stamped so the operator is re-visited later",
    [extracted("fixture-snow-only", "snow_sports", [snowItem()])],
    {
      ok: true,
      applyArgs: ["--pilot"],
      inspect: ({ dir }) => {
        const log = JSON.parse(fs.readFileSync(join(dir, "pass_b_snow_sports_results.json"), "utf8"));
        if (log.results[0].visit_mode !== "pilot") {
          throw new Error(`expected visit_mode "pilot", got "${log.results[0].visit_mode}"`);
        }
      },
    },
  );

  runCase(
    "a normal apply marks the visit complete",
    [extracted("fixture-snow-only", "snow_sports", [snowItem()])],
    {
      ok: true,
      inspect: ({ dir }) => {
        const log = JSON.parse(fs.readFileSync(join(dir, "pass_b_snow_sports_results.json"), "utf8"));
        if (log.results[0].visit_mode !== "operator_at_once") {
          throw new Error(`expected visit_mode "operator_at_once", got "${log.results[0].visit_mode}"`);
        }
      },
    },
  );

  runCase(
    "reapplying a valid batch is idempotent",
    [extracted("fixture-water-only", "snow_sports", [snowItem()])],
    {
      ok: true,
      reapply: true,
      inspect: ({ dir, triage }) => {
        const operator = row(triage, "fixture-water-only");
        const marker = "snow_sports extracted";
        if (operator.note.split(marker).length - 1 !== 1) throw new Error("operator note duplicated on reapply");
        const log = JSON.parse(fs.readFileSync(join(dir, "pass_b_snow_sports_results.json"), "utf8"));
        if (log.results.length !== 1) throw new Error("result log duplicated on reapply");
      },
    },
  );

  console.log("Pass B fixtures: all green");
}
