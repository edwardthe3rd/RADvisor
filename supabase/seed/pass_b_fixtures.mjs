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

const fatBikeItem = (overrides = {}) => ({
  name: "Fixture Fat Bike",
  subcategory: "fat_bike",
  brand: null,
  model: null,
  size: null,
  skill_level: "all",
  price_full_day: 65,
  attributes: { gear_type: "bike" },
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

function runCase(name, results, { ok, message, inspect, reapply = false, applyArgs = [] }) {
  const dir = fs.mkdtempSync(join(os.tmpdir(), "radvisor-pass-b-fixture-"));
  const input = join(dir, "input.json");
  const vocab = join(dir, "fixture-vocab.json");
  fs.writeFileSync(join(dir, "sweep_pass_a_triage.json"), JSON.stringify(fixture.triage, null, 2));
  fs.writeFileSync(input, JSON.stringify(results, null, 2));
  fs.writeFileSync(vocab, JSON.stringify(fixture.test_vocab, null, 2));
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
    { ok: false, message: "has no locked vocabulary" },
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
    [extracted("fixture-bike-only", "mountain_biking", [fatBikeItem({ subcategory: "trail_bike" })], { activities: ["fat_bike"] })],
    { ok: false, message: "activities not supported" },
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
