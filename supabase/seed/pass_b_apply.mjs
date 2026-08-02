#!/usr/bin/env node
// Pass B — EXTRACTION RESULT APPLIER (mechanical validation + merge).
//
//   node supabase/seed/pass_b_apply.mjs <extraction.json> [--dry-run]
//
// Validates an LLM's operator-at-once Pass B results against each category's bounded
// vocabulary and merges them into pass_b_<category>_results.json. Pass A categories are
// hints, not gates: a locked category discovered during the visit can be extracted now.
// State transitions are validated across every result for an operator before any file writes.
//
// Malformed batches are rejected whole — a weaker model cannot silently corrupt the output.
// Files-first, like Pass A: the Supabase equipment upsert is a separate later step.

import fs from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CATEGORY_ACTIVITIES,
  CATEGORY_VOCAB,
  PASS_B_CATEGORY_SET,
  PRICE_FIELDS,
  deriveActivities,
} from "./pass_b_vocab.mjs";

const seedDir = dirname(fileURLToPath(import.meta.url));

const VALID_ACTIVITIES = new Set([
  "ski_snowboard", "snowshoe", "sled", "snowmobile", "fat_bike", "snow_camp", "ice_skate",
  "winter_mountaineering",
]);
const VALID_OUTCOMES = new Set(["extracted", "category_not_found", "needs_review"]);
const VALID_RETRIAGE_STATUSES = new Set(["no_rentals", "out_of_scope", "needs_review"]);
const VALID_SKILL = new Set(["beginner", "intermediate", "advanced", "all"]);
// PRICE_FIELDS is imported from pass_b_vocab.mjs so the applier and pass_b_report.mjs cannot
// drift apart. price_season was added after the 2026-08-01 pilot: 3 of 8 operators published a
// real per-season figure ($159 Bobo's adult, $599 Quiver unlimited) that no other tier could
// hold, which produced 5 of the 7 "no price on any tier" warnings in that batch.

const args = process.argv.slice(2);
const valueAfter = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
if (args.includes("--test-fixtures")) {
  const { runPassBFixtures } = await import("./pass_b_fixtures.mjs");
  await runPassBFixtures();
  process.exit(0);
}
const DRY = args.includes("--dry-run");
// A calibration pilot runs before every vocabulary is locked, so its visit could not observe
// categories that had no schema yet. Stamping visit_mode:"pilot" keeps these operators eligible
// for a full re-visit later (pass_b_batch treats only "operator_at_once" as a completed visit).
const PILOT = args.includes("--pilot");
const dataDir = valueAfter("--data-dir") || seedDir;
const P = (f) => join(dataDir, f);
const read = (f) => JSON.parse(fs.readFileSync(P(f), "utf8"));
const fixtureVocabFile = valueAfter("--fixture-vocab");
if (fixtureVocabFile) {
  if (process.env.PASS_B_FIXTURE_MODE !== "1" || dataDir === seedDir) {
    console.error("--fixture-vocab is restricted to isolated --test-fixtures runs");
    process.exit(1);
  }
  // A fixture category may carry an `activities` rule list alongside its vocabulary, so tests
  // can exercise the cross-category activity axis without waiting on a real category to lock.
  for (const [category, def] of Object.entries(JSON.parse(fs.readFileSync(fixtureVocabFile, "utf8")))) {
    // `null` UNLOCKS a category for the duration of the fixture run. The self-heal deferral path
    // only exists for a known-but-unlocked vocabulary, so once all 15 categories lock there is no
    // naturally-unlocked slug left to test it with — without this the deferral tests would have
    // to be deleted exactly when the gate finally closes.
    if (def === null) {
      delete CATEGORY_VOCAB[category];
      delete CATEGORY_ACTIVITIES[category];
      continue;
    }
    const { activities, ...vocab } = def;
    CATEGORY_VOCAB[category] = vocab;
    if (activities) CATEGORY_ACTIVITIES[category] = activities;
  }
}
const file = args.find((a, i) =>
  !a.startsWith("--") && !["--data-dir", "--fixture-vocab"].includes(args[i - 1]),
);
if (!file) {
  console.error("usage: node pass_b_apply.mjs <extraction.json> [--dry-run] [--data-dir DIR]");
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(file, "utf8"));
const incoming = Array.isArray(raw) ? raw : raw.results || [];
if (!incoming.length) { console.error("no results in input"); process.exit(1); }

const triage = read("sweep_pass_a_triage.json");
triage.results = triage.results || [];
const rowIdx = new Map(triage.results.map((r, i) => [keyOf(r), i]));
const priorOriginsByCategory = new Map();

function priorCategoryOrigin(category, key) {
  if (!priorOriginsByCategory.has(category)) {
    const file = `pass_b_${category}_results.json`;
    const rows = fs.existsSync(P(file)) ? (read(file).results || []) : [];
    priorOriginsByCategory.set(
      category,
      new Map(rows.map((row) => [row.key || keyOf(row), row.category_origin || null])),
    );
  }
  return priorOriginsByCategory.get(category).get(key) || null;
}

const isUrl = (u) => typeof u === "string" && /^https?:\/\/\S+$/i.test(u);

const errors = [];
const warnings = []; // non-fatal QA flags, printed after validation — never block a write
const clean = [];
incoming.forEach((v, n) => {
  const where = `result #${n + 1} (${v.name || v.place_id || "?"})`;
  const k = v.place_id || (v.name ? `name:${v.name}` : null);
  const idx = k != null ? rowIdx.get(k) : undefined;
  if (idx === undefined) { errors.push(`${where}: no matching operator in sweep_pass_a_triage.json (check place_id/name)`); return; }
  const row = triage.results[idx];
  if (row.status !== "triaged") { errors.push(`${where}: operator status is "${row.status}", not triaged — Pass B only runs on triaged rows`); return; }

  const category = v.category;
  const vocab = CATEGORY_VOCAB[category];
  if (!vocab) { errors.push(`${where}: category "${category}" has no locked vocabulary in pass_b_vocab.mjs (add its CATEGORY_VOCAB + CATEGORY_ACTIVITIES entries when its extraction file locks)`); return; }
  const inCats = (row.categories || []).includes(category);
  const inReview = (row.review_categories || []).includes(category);
  const categoryOrigin = priorCategoryOrigin(category, keyOf(row)) || (
    inCats
      ? "pretagged_confirmed"
      : inReview
        ? "pretagged_review"
        : "pass_b_discovered"
  );

  if (!VALID_OUTCOMES.has(v.outcome)) { errors.push(`${where}: outcome "${v.outcome}" not in ${[...VALID_OUTCOMES].join("/")}`); return; }
  if (!v.note || String(v.note).trim().length < 8) { errors.push(`${where}: note must briefly say what was found (or why not)`); return; }
  if (v.outcome === "needs_review" && !/action/i.test(v.note)) {
    warnings.push(`${where}: needs_review note has no "ACTION: …" — every parked operator should state the one step that resolves it (00_general §5 rule 9)`);
  }

  const requestedActivities = Array.isArray(v.activities) ? v.activities : [];
  const badActs = requestedActivities.filter((a) => !VALID_ACTIVITIES.has(a));
  if (badActs.length) { errors.push(`${where}: invalid activities slug(s): ${badActs.join(", ")}`); return; }

  const selfHealRaw = Array.isArray(v.self_heal_categories) ? v.self_heal_categories : [];
  const selfHeal = [];
  for (const entry of selfHealRaw) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      errors.push(`${where}: self_heal_categories entries must be objects { category, source_url, note }; strings are not enough evidence`);
      return;
    }
    if (!PASS_B_CATEGORY_SET.has(entry.category) || entry.category === category) {
      errors.push(`${where}: invalid self_heal_categories category: ${entry.category}`);
      return;
    }
    if (CATEGORY_VOCAB[entry.category]) {
      errors.push(`${where}: self_heal_categories.${entry.category} has a locked vocabulary — submit it as its own same-visit category result instead`);
      return;
    }
    if (!isUrl(entry.source_url)) {
      errors.push(`${where}: self_heal_categories.${entry.category || "?"} requires source_url`);
      return;
    }
    if (!entry.note || String(entry.note).trim().length < 8) {
      errors.push(`${where}: self_heal_categories.${entry.category} requires an evidence note`);
      return;
    }
    selfHeal.push({
      category: entry.category,
      source_url: entry.source_url,
      note: String(entry.note).trim(),
      disposition: "deferred_unlocked_vocabulary",
    });
  }

  const items = Array.isArray(v.items) ? v.items : [];
  if (v.outcome === "extracted") {
    if (!items.length) { errors.push(`${where}: outcome extracted requires >=1 item`); return; }
  } else {
    if (items.length) { errors.push(`${where}: outcome ${v.outcome} must not carry items`); return; }
    if (v.outcome === "category_not_found" && !isUrl(v.checked_url)) {
      errors.push(`${where}: category_not_found requires checked_url (the live page proving absence — a thin cache is not proof)`); return;
    }
  }

  // Equipment natural-key guard (00_general §9): two items with the same signature would
  // upsert onto each other later — usually a package listed twice or a copy-paste slip.
  const itemSigs = new Set();
  for (let i = 0; i < items.length; i++) {
    const it = items[i] || {};
    const iw = `${where} item #${i + 1} (${it.name || "?"})`;
    const sig = [String(it.name || "").toLowerCase().replace(/\s+/g, " ").trim(), it.subcategory, it.brand || "", it.model || "", it.size || ""].join("|");
    if (itemSigs.has(sig)) { errors.push(`${iw}: duplicate item signature (same name+subcategory+brand/model/size as an earlier item) — merge them or differentiate the rows`); continue; }
    itemSigs.add(sig);
    if (!it.name || typeof it.name !== "string") { errors.push(`${iw}: name is required`); continue; }
    if (!vocab.subcategories.includes(it.subcategory)) { errors.push(`${iw}: subcategory "${it.subcategory}" not in ${category} vocabulary`); continue; }
    if (!isUrl(it.source_url)) { errors.push(`${iw}: source_url (the exact page seen) is required — provenance rule (00_general §8)`); continue; }
    const attrs = it.attributes || {};
    if (!vocab.gear_types.includes(attrs.gear_type)) { errors.push(`${iw}: attributes.gear_type "${attrs.gear_type}" not in ${category} vocabulary`); continue; }
    for (const [key, val] of Object.entries(attrs)) {
      if (!(key in vocab.attributes)) { errors.push(`${iw}: attribute key "${key}" is not in the bounded ${category} set — put it in description or propose via 00_general §11`); continue; }
      const rule = vocab.attributes[key];
      if (rule === "boolean" && typeof val !== "boolean") errors.push(`${iw}: attribute ${key} must be boolean`);
      // water_sports (2026-08-01) introduced the first "number" attributes (capacity_people,
      // wetsuit_thickness_mm). Until then no vocabulary used the rule, so a string slipped
      // through unvalidated — "eight" would have been stored as a capacity.
      else if (rule === "number" && (typeof val !== "number" || !isFinite(val))) errors.push(`${iw}: attribute ${key} must be a number, got ${JSON.stringify(val)}`);
      else if (Array.isArray(rule) && !rule.includes(val)) errors.push(`${iw}: attribute ${key}="${val}" not in [${rule.join(", ")}]`);
    }
    if (it.skill_level != null && !VALID_SKILL.has(it.skill_level)) { errors.push(`${iw}: skill_level "${it.skill_level}" invalid`); }
    let anyPrice = false;
    for (const pf of PRICE_FIELDS) {
      const p = it[pf];
      if (p === undefined || p === null) continue;
      if (typeof p !== "number" || !isFinite(p) || p < 0) { errors.push(`${iw}: ${pf} must be a number or null`); continue; }
      // 0 used to be a hard reject on the belief that "free rental gear is not a thing". That is
      // empirically false: Carson City's municipal Outdoor Gear Library lends a Disc Golf Set at
      // FREE/FREE/FREE alongside priced gear (2026-08-01). Free lending is real, and rejecting it
      // silently loses the most user-valuable rows we have. 0 is now allowed and warned, so the
      // original risk — recording *unknown* pricing as 0 — is still surfaced loudly.
      if (p === 0) { warnings.push(`${iw}: ${pf} is 0 — this must mean the item is genuinely FREE (e.g. a municipal gear library). If the price is merely unpublished, use null instead.`); }
      anyPrice = true;
      // Decimal-slip catcher ($8.50 vs 850): warn, never reject — luxury fleets exist.
      // 0 is skipped: it already got the explicit free-item warning above, and double-warning the
      // same value is noise. The $5 floor also false-positives on genuinely cheap accessory
      // rentals — Gear Hut lends bear canisters at $3/night — so it stays advisory only.
      if (pf !== "deposit" && p !== 0 && (p < 5 || p > 2000)) warnings.push(`${iw}: ${pf}=$${p} is outside the typical $5–2000 range — double-check for a decimal/typo`);
    }
    if (!anyPrice) warnings.push(`${iw}: no price on any tier ("call for pricing" is legitimate, but verify the price really isn't published)`);
    const addons = it.addons === undefined ? [] : it.addons;
    if (!Array.isArray(addons)) { errors.push(`${iw}: addons must be an array`); }
    else {
      for (const ad of addons) {
        if (!ad || typeof ad.name !== "string" || typeof ad.price !== "number" || ad.price < 0) {
          errors.push(`${iw}: each addon must be { name: string, price: number>=0 } (0 = included free)`);
          break;
        }
      }
    }
  }

  const derivedActivities = deriveActivities(category, items);
  const unsupportedActivities = requestedActivities.filter((a) => !derivedActivities.includes(a));
  if (v.outcome === "extracted" && unsupportedActivities.length) {
    errors.push(`${where}: activities not supported by extracted ${category} items: ${unsupportedActivities.join(", ")} (activities are derived from subcategory/gear_type)`);
    return;
  }

  if (v.operator_status != null && !VALID_RETRIAGE_STATUSES.has(v.operator_status)) {
    errors.push(`${where}: operator_status must be no_rentals/out_of_scope/needs_review when supplied`);
    return;
  }

  // `possible_items` is the ITEM-level recall net, and the counterpart to review_categories[] at
  // the category level. Before it, anything an extractor suspected might be inventory but could
  // not confirm — gear in a photo gallery with no rental page, an unpriced "we have paddleboards",
  // a booking widget that would not load, a product that might be retail — simply vanished with
  // no trace. These never enter live equipment data; they are recorded so real inventory is never
  // silently dropped, and so a revisit knows exactly what to look for.
  const possibleRaw = Array.isArray(v.possible_items) ? v.possible_items : [];
  const possibleItems = [];
  for (const [pi, cand] of possibleRaw.entries()) {
    const pw = `${where} possible_item #${pi + 1}`;
    if (!cand || typeof cand !== "object" || Array.isArray(cand)) {
      errors.push(`${pw}: must be an object { name, source_url, why_uncertain, likely_subcategory? }`);
      continue;
    }
    if (!cand.name || typeof cand.name !== "string") { errors.push(`${pw}: name is required`); continue; }
    if (!isUrl(cand.source_url)) { errors.push(`${pw}: source_url (the exact page that raised the suspicion) is required`); continue; }
    if (!cand.why_uncertain || String(cand.why_uncertain).trim().length < 12) {
      errors.push(`${pw}: why_uncertain must say what is missing (no price? rent vs sell unclear? widget failed?) — a bare flag is not actionable on revisit`);
      continue;
    }
    // Optional, but if a guess is offered it must be a real slug so the revisit can be targeted.
    if (cand.likely_subcategory != null && !vocab.subcategories.includes(cand.likely_subcategory)) {
      errors.push(`${pw}: likely_subcategory "${cand.likely_subcategory}" is not in the ${category} vocabulary (omit it if unsure)`);
      continue;
    }
    possibleItems.push({ ...cand });
  }

  // The load-bearing guard: if you saw something that might be inventory, you may NOT also claim
  // the category is absent. Recall-first — "not found" has to mean nothing was seen at all.
  if (v.outcome === "category_not_found" && possibleItems.length) {
    errors.push(
      `${where}: outcome "category_not_found" is invalid alongside ${possibleItems.length} possible_item(s) — ` +
      `if something might be inventory, the category is unresolved, not absent. Use "needs_review" with an ACTION.`,
    );
    return;
  }

  clean.push({
    idx,
    key: keyOf(row),
    row,
    v,
    category,
    categoryOrigin,
    activities: derivedActivities,
    selfHeal,
    items,
    possibleItems,
  });
});

// Validate the combined final state for each operator. This is intentionally separate from
// per-result validation: removing the old last category is valid when another result in the
// same visit extracts a newly discovered category.
const operatorStates = new Map();
for (const c of clean) {
  let state = operatorStates.get(c.key);
  if (!state) {
    state = {
      row: c.row,
      categories: new Set(c.row.categories || []),
      reviewCategories: new Set(c.row.review_categories || []),
      seenCategories: new Set(),
      statuses: new Set(),
      entries: [],
    };
    operatorStates.set(c.key, state);
  }
  if (state.seenCategories.has(c.category)) {
    errors.push(`${c.row.name}: duplicate result for category "${c.category}" in the same batch`);
    continue;
  }
  state.seenCategories.add(c.category);
  state.entries.push(c);
  if (c.v.operator_status != null) state.statuses.add(c.v.operator_status);

  if (c.v.outcome === "extracted") {
    state.categories.add(c.category);
    state.reviewCategories.delete(c.category);
  } else if (c.v.outcome === "category_not_found") {
    state.categories.delete(c.category);
    state.reviewCategories.delete(c.category);
  } else if (!state.categories.has(c.category)) {
    // A newly discovered but unresolved locked category must remain visible for follow-up.
    state.reviewCategories.add(c.category);
  }
  for (const heal of c.selfHeal) {
    if (!state.categories.has(heal.category)) state.reviewCategories.add(heal.category);
  }
}

for (const [key, state] of operatorStates) {
  if (state.statuses.size > 1) {
    errors.push(`${state.row.name}: conflicting operator_status values across one operator batch: ${[...state.statuses].join(", ")}`);
    continue;
  }
  const finalEmpty = state.categories.size === 0 && state.reviewCategories.size === 0;
  const operatorStatus = [...state.statuses][0] || null;
  if (finalEmpty && !operatorStatus) {
    errors.push(`${state.row.name}: combined Pass B results leave this triaged operator with zero categories; include one operator_status no_rentals/out_of_scope/needs_review`);
  } else if (!finalEmpty && operatorStatus) {
    errors.push(`${state.row.name}: operator_status "${operatorStatus}" is invalid because the combined Pass B results still leave categories/review_categories`);
  }
  state.operatorStatus = operatorStatus;
  operatorStates.set(key, state);
}

// A rejected batch used to print and vanish, which threw away the single most useful signal the
// run produces: WHICH real, priced item had nowhere to go. That is the evidence a density
// decision needs (00_general §11) and the reason `surrey`, `sup_bike`, `autocycle` et al. were
// only caught by someone happening to notice. Vocabulary misses are now appended to a gap ledger.
// The hard gate is unchanged — no operator data is written; only the gap record is.
function recordVocabGaps(errs) {
  const KINDS = [
    [/subcategory "([^"]+)" not in (\w+) vocabulary/, "subcategory"],
    [/attributes\.gear_type "([^"]+)" not in (\w+) vocabulary/, "gear_type"],
    [/attribute key "([^"]+)" is not in the bounded (\w+) set/, "attribute_key"],
    [/attribute (\w+)="([^"]+)" not in \[/, "attribute_value"],
  ];
  const found = [];
  for (const e of errs) {
    for (const [re, kind] of KINDS) {
      const m = e.match(re);
      if (!m) continue;
      found.push({ kind, value: m[1], category: m[2] || null, error: e });
      break;
    }
  }
  if (!found.length) return 0;

  const gapFile = P("pass_b_vocab_gaps.json");
  const ledger = fs.existsSync(gapFile)
    ? JSON.parse(fs.readFileSync(gapFile, "utf8"))
    : { note: "Vocabulary gaps hit during Pass B. A repeat count is the density evidence 00_general §11 asks for before promoting anything to a facet. Additive slug gaps (a real item with no home) are safe to fix inline; attribute/facet decisions are not.", gaps: [] };

  const today = new Date().toISOString().slice(0, 10);
  for (const g of found) {
    const existing = ledger.gaps.find(
      (x) => x.kind === g.kind && x.value === g.value && x.category === g.category,
    );
    if (existing) {
      existing.hits += 1;
      existing.last_seen = today;
    } else {
      ledger.gaps.push({ ...g, hits: 1, first_seen: today, last_seen: today, resolved: false });
    }
  }
  ledger.gaps.sort((a, b) => b.hits - a.hits);
  if (!DRY) fs.writeFileSync(gapFile, JSON.stringify(ledger, null, 2) + "\n");
  return found.length;
}

if (errors.length) {
  console.error(`REJECTED — ${errors.length} problem(s) (nothing written):`);
  for (const e of errors) console.error("  - " + e);
  const gaps = recordVocabGaps(errors);
  if (gaps) {
    console.error(
      `\n${gaps} vocabulary gap(s) ${DRY ? "would be" : ""} logged to pass_b_vocab_gaps.json. ` +
      `If a real priced item simply has no home, adding the slug is ADDITIVE and safe to do now. ` +
      `If it is a judgment about whether something deserves to be a filterable facet, leave it and ` +
      `let the hit count accumulate — one operator cannot answer a density question (00_general §11).`,
    );
  }
  process.exit(1);
}

// Group by category so operator-at-once input still produces one auditable result log per
// category. All mutations remain in memory until the complete batch has validated.
const byCategory = new Map();
for (const c of clean) {
  if (!byCategory.has(c.category)) byCategory.set(c.category, []);
  byCategory.get(c.category).push(c);
}

const today = new Date().toISOString().slice(0, 10);
let extracted = 0, notFound = 0, review = 0, itemCount = 0;

for (const [category, entries] of byCategory) {
  const resultsFile = `pass_b_${category}_results.json`;
  const results = fs.existsSync(P(resultsFile))
    ? read(resultsFile)
    : { category, source: "supabase/seed/sweep_pass_a_triage.json", results: [] };
  const resIdx = new Map(results.results.map((r, i) => [r.key, i]));

  for (const c of entries) {
    const rec = {
      key: c.key,
      place_id: c.row.place_id || null,
      name: c.row.name,
      website: c.row.website || null,
      category,
      visit_mode: PILOT ? "pilot" : "operator_at_once",
      category_origin: c.categoryOrigin,
      outcome: c.v.outcome,
      checked_url: c.v.checked_url || null,
      note: String(c.v.note).trim(),
      activities: c.activities,
      offers_demo: c.v.offers_demo === true,
      offers_season_lease: c.v.offers_season_lease === true,
      self_heal_categories: c.selfHeal,
      operator_status: c.v.operator_status || null,
      items: c.items,
      // Never live equipment data — the item-level recall net. Anything here is a candidate a
      // revisit or phone call should resolve, not inventory we are asserting.
      possible_items: c.possibleItems,
      extracted_at: today,
    };
    if (resIdx.has(c.key)) results.results[resIdx.get(c.key)] = rec;
    else { resIdx.set(c.key, results.results.length); results.results.push(rec); }

    // ---- append audit notes + operator-level facts; category state is committed below ----
    const row = c.row;
    // Idempotent note appends: re-applying a corrected batch must not bloat the row note.
    const addNote = (segment) => { if (!(row.note || "").includes(segment)) row.note = `${row.note || ""} ${segment}`.trim(); };
    if (c.v.outcome === "category_not_found") {
      addNote(`Pass B ${today}: ${category} category_not_found (${c.v.checked_url}).`);
      notFound++;
    } else if (c.v.outcome === "extracted") {
      addNote(`Pass B ${today}: ${category} extracted (${c.items.length} item(s); origin ${c.categoryOrigin}).`);
      extracted++; itemCount += c.items.length;
    } else {
      addNote(`Pass B ${today}: ${category} needs_review (origin ${c.categoryOrigin}) — ${String(c.v.note).trim()}`);
      review++;
    }
    for (const heal of c.selfHeal) {
      addNote(`Pass B ${today}: deferred self-heal ${heal.category} (${heal.disposition}; ${heal.source_url}) — ${heal.note}`);
    }
    if (c.activities.length) row.activities = [...new Set([...(row.activities || []), ...c.activities])];
    if (c.v.offers_demo === true) row.offers_demo = true;
    if (c.v.offers_season_lease === true) row.offers_season_lease = true;
  }

  results.ranAt = new Date().toISOString();
  results.count = results.results.length;
  if (!DRY) fs.writeFileSync(P(resultsFile), JSON.stringify(results, null, 2) + "\n");
}

// Commit the already-validated combined operator state only after every category result has
// been processed. This is what makes the zero-category guard operator-wide.
for (const state of operatorStates.values()) {
  const row = state.row;
  row.categories = [...state.categories];
  row.review_categories = [...state.reviewCategories];
  if (state.operatorStatus) {
    row.status = state.operatorStatus;
    if (state.operatorStatus === "no_rentals") row.rents_gear = false;
    if (state.operatorStatus === "out_of_scope") row.rents_gear = true;
    const segment = `Pass B ${today}: operator re-routed to ${state.operatorStatus}.`;
    if (!(row.note || "").includes(segment)) row.note = `${row.note || ""} ${segment}`.trim();
  }
}

if (warnings.length) {
  console.log(`⚠ ${warnings.length} warning(s) — applied anyway, but worth eyeballing:`);
  for (const w of warnings) console.log("  - " + w);
}
const summary = `applied ${clean.length}${PILOT ? " PILOT" : ""} result(s): ${extracted} extracted (${itemCount} items), ${notFound} category_not_found, ${review} needs_review.${PILOT ? " Operators stay eligible for a full re-visit (visit_mode=pilot)." : ""}`;
if (DRY) console.log("[dry-run] " + summary + " (nothing written)");
else {
  fs.writeFileSync(P("sweep_pass_a_triage.json"), JSON.stringify(triage, null, 2) + "\n");
  console.log(summary + ` Updated sweep_pass_a_triage.json + pass_b_<category>_results.json.`);
}

function keyOf(r) { return r.place_id || `name:${r.name}`; }
