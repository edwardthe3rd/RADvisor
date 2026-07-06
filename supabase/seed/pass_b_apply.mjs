#!/usr/bin/env node
// Pass B — EXTRACTION RESULT APPLIER (mechanical validation + merge).
//
//   node supabase/seed/pass_b_apply.mjs <extraction.json> [--dry-run]
//
// Validates an LLM's Pass B extraction results against the category's bounded vocabulary
// (instructions/extraction/<category>.md) and merges them into pass_b_<category>_results.json.
// Also updates sweep_pass_a_triage.json: category_not_found removals, review->confirmed
// promotions, evidenced self-heal category candidates, and operator-level activities /
// offers_demo / offers_season_lease backfill (00_general §6 steps 6-7).
//
// Malformed batches are rejected whole — a weaker model cannot silently corrupt the output.
// Files-first, like Pass A: the Supabase equipment upsert is a separate later step.

import fs from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const seedDir = dirname(fileURLToPath(import.meta.url));
const P = (f) => join(seedDir, f);
const read = (f) => JSON.parse(fs.readFileSync(P(f), "utf8"));

// ---------------------------------------------------------------------------
// Per-category bounded vocabulary. Source of truth: instructions/extraction/<slug>.md.
// Add a key per category as its file locks; the applier refuses categories not defined here.
const CATEGORY_VOCAB = {
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
      "snowshoes", "sled", "saucer", "snowskate", "snow_boots", "ice_skates", "snowmobile",
      "timbersled",
    ],
    // key -> validator; only these keys may appear in attributes.
    attributes: {
      gear_type: null, // enum-checked separately (required)
      quality_grade: ["basic", "standard", "performance"],
      is_kids: "boolean",
      rental_type: ["rental", "demo", "season_lease"],
      adjustable: "boolean",
      snowboard_binding_interface: ["step_on", "standard"],
      crampon_binding: ["strap", "newmatic", "cramp_o_matic"],
    },
  },
};

const VALID_ACTIVITIES = new Set([
  "ski_snowboard", "snowshoe", "sled", "snowmobile", "fat_bike", "snow_camp", "ice_skate",
  "winter_mountaineering",
]);
const VALID_CATEGORIES = new Set([
  "snow_sports", "mountain_biking", "road_cycling", "burning_man_bikes", "water_sports",
  "camping", "camping_vehicles", "off_road", "motorcycles", "rock_climbing", "mountaineering",
  "hunting", "fishing", "disc_golf", "electric_transport",
]);
const VALID_OUTCOMES = new Set(["extracted", "category_not_found", "needs_review"]);
const VALID_RETRIAGE_STATUSES = new Set(["no_rentals", "out_of_scope", "needs_review"]);
const VALID_SKILL = new Set(["beginner", "intermediate", "advanced", "all"]);
const PRICE_FIELDS = ["price_hourly", "price_half_day", "price_full_day", "price_multi_day", "price_weekly", "deposit"];

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const file = args.find((a) => !a.startsWith("--"));
if (!file) { console.error("usage: node pass_b_apply.mjs <extraction.json> [--dry-run]"); process.exit(1); }

const raw = JSON.parse(fs.readFileSync(file, "utf8"));
const incoming = Array.isArray(raw) ? raw : raw.results || [];
if (!incoming.length) { console.error("no results in input"); process.exit(1); }

const triage = read("sweep_pass_a_triage.json");
triage.results = triage.results || [];
const rowIdx = new Map(triage.results.map((r, i) => [keyOf(r), i]));

const isUrl = (u) => typeof u === "string" && /^https?:\/\/\S+$/i.test(u);

const errors = [];
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
  if (!vocab) { errors.push(`${where}: category "${category}" has no locked vocabulary in pass_b_apply.mjs (add it when its extraction file locks)`); return; }
  const inCats = (row.categories || []).includes(category);
  const inReview = (row.review_categories || []).includes(category);
  if (!inCats && !inReview) { errors.push(`${where}: "${category}" is not in this operator's categories[] or review_categories[]`); return; }

  if (!VALID_OUTCOMES.has(v.outcome)) { errors.push(`${where}: outcome "${v.outcome}" not in ${[...VALID_OUTCOMES].join("/")}`); return; }
  if (!v.note || String(v.note).trim().length < 8) { errors.push(`${where}: note must briefly say what was found (or why not)`); return; }

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
    if (!VALID_CATEGORIES.has(entry.category) || entry.category === category) {
      errors.push(`${where}: invalid self_heal_categories category: ${entry.category}`);
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

  for (let i = 0; i < items.length; i++) {
    const it = items[i] || {};
    const iw = `${where} item #${i + 1} (${it.name || "?"})`;
    if (!it.name || typeof it.name !== "string") { errors.push(`${iw}: name is required`); continue; }
    if (!vocab.subcategories.includes(it.subcategory)) { errors.push(`${iw}: subcategory "${it.subcategory}" not in ${category} vocabulary`); continue; }
    if (!isUrl(it.source_url)) { errors.push(`${iw}: source_url (the exact page seen) is required — provenance rule (00_general §8)`); continue; }
    const attrs = it.attributes || {};
    if (!vocab.gear_types.includes(attrs.gear_type)) { errors.push(`${iw}: attributes.gear_type "${attrs.gear_type}" not in ${category} vocabulary`); continue; }
    for (const [key, val] of Object.entries(attrs)) {
      if (!(key in vocab.attributes)) { errors.push(`${iw}: attribute key "${key}" is not in the bounded ${category} set — put it in description or propose via 00_general §11`); continue; }
      const rule = vocab.attributes[key];
      if (rule === "boolean" && typeof val !== "boolean") errors.push(`${iw}: attribute ${key} must be boolean`);
      else if (Array.isArray(rule) && !rule.includes(val)) errors.push(`${iw}: attribute ${key}="${val}" not in [${rule.join(", ")}]`);
    }
    if (it.skill_level != null && !VALID_SKILL.has(it.skill_level)) { errors.push(`${iw}: skill_level "${it.skill_level}" invalid`); }
    for (const pf of PRICE_FIELDS) {
      const p = it[pf];
      if (p === undefined || p === null) continue;
      if (typeof p !== "number" || !isFinite(p) || p < 0) { errors.push(`${iw}: ${pf} must be a number or null`); continue; }
      if (p === 0) errors.push(`${iw}: ${pf} is 0 — unknown pricing is null, never 0 (and free rental gear is not a thing; bundled items go in addons)`);
    }
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

  let operatorStatus = null;
  if (v.outcome === "category_not_found") {
    const remainingCats = new Set(row.categories || []);
    const remainingReview = new Set(row.review_categories || []);
    remainingCats.delete(category);
    remainingReview.delete(category);
    if (remainingCats.size === 0 && remainingReview.size === 0) {
      if (!VALID_RETRIAGE_STATUSES.has(v.operator_status)) {
        errors.push(`${where}: category_not_found would leave this triaged operator with zero categories; include operator_status no_rentals/out_of_scope/needs_review to re-route the whole operator`);
        return;
      }
      operatorStatus = v.operator_status;
    }
  }

  clean.push({ idx, key: keyOf(row), row, v, category, activities: derivedActivities, selfHeal, items, operatorStatus });
});

if (errors.length) {
  console.error(`REJECTED — ${errors.length} problem(s) (nothing written):`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}

// Group by category to write one results file per category (a batch is normally one category).
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
      outcome: c.v.outcome,
      checked_url: c.v.checked_url || null,
      note: String(c.v.note).trim(),
      activities: c.activities,
      offers_demo: c.v.offers_demo === true,
      offers_season_lease: c.v.offers_season_lease === true,
      self_heal_categories: c.selfHeal,
      operator_status: c.operatorStatus,
      items: c.items,
      extracted_at: today,
    };
    if (resIdx.has(c.key)) results.results[resIdx.get(c.key)] = rec;
    else { resIdx.set(c.key, results.results.length); results.results.push(rec); }

    // ---- update the triage row (00_general §6 steps 0, 6, self-heal) ----
    const row = c.row;
    const cats = new Set(row.categories || []);
    const revs = new Set(row.review_categories || []);
    if (c.v.outcome === "category_not_found") {
      cats.delete(category); revs.delete(category);
      row.note = `${row.note || ""} Pass B ${today}: ${category} category_not_found (${c.v.checked_url}).`.trim();
      if (c.operatorStatus) {
        row.status = c.operatorStatus;
        if (c.operatorStatus === "no_rentals") row.rents_gear = false;
        if (c.operatorStatus === "out_of_scope") row.rents_gear = true;
        row.note = `${row.note} Operator re-routed to ${c.operatorStatus}.`.trim();
      }
      notFound++;
    } else if (c.v.outcome === "extracted") {
      cats.add(category); revs.delete(category); // review slug that panned out -> confirmed
      row.note = `${row.note || ""} Pass B ${today}: ${category} extracted (${c.items.length} item(s)).`.trim();
      extracted++; itemCount += c.items.length;
    } else {
      row.note = `${row.note || ""} Pass B ${today}: ${category} needs_review — ${String(c.v.note).trim()}`.trim();
      review++;
    }
    for (const heal of c.selfHeal) {
      if (!cats.has(heal.category)) revs.add(heal.category);
      row.note = `${row.note || ""} Pass B ${today}: self-heal candidate ${heal.category} (${heal.source_url}) — ${heal.note}`.trim();
    }
    row.categories = [...cats];
    row.review_categories = [...revs];
    if (c.activities.length) row.activities = [...new Set([...(row.activities || []), ...c.activities])];
    if (c.v.offers_demo === true) row.offers_demo = true;
    if (c.v.offers_season_lease === true) row.offers_season_lease = true;
  }

  results.ranAt = new Date().toISOString();
  results.count = results.results.length;
  if (!DRY) fs.writeFileSync(P(resultsFile), JSON.stringify(results, null, 2) + "\n");
}

const summary = `applied ${clean.length} result(s): ${extracted} extracted (${itemCount} items), ${notFound} category_not_found, ${review} needs_review.`;
if (DRY) console.log("[dry-run] " + summary + " (nothing written)");
else {
  fs.writeFileSync(P("sweep_pass_a_triage.json"), JSON.stringify(triage, null, 2) + "\n");
  console.log(summary + ` Updated sweep_pass_a_triage.json + pass_b_<category>_results.json.`);
}

function keyOf(r) { return r.place_id || `name:${r.name}`; }

function deriveActivities(category, items) {
  if (category !== "snow_sports") return [];
  const out = new Set();
  for (const item of items) {
    const sub = item?.subcategory;
    const gear = item?.attributes?.gear_type;
    if (["alpine_ski", "backcountry_ski", "telemark_ski", "cross_country_ski", "snowboard", "splitboard"].includes(sub)) {
      out.add("ski_snowboard");
    }
    if (sub === "snowshoe") out.add("snowshoe");
    if (sub === "sled") out.add("sled");
    if (sub === "snowmobile" || sub === "timbersled") out.add("snowmobile");
    if (sub === "ice_skates") out.add("ice_skate");
    if (sub === "backcountry_ski" && ["ice_axe", "crampons", "ski_crampons"].includes(gear)) {
      out.add("winter_mountaineering");
    }
  }
  return [...out];
}
