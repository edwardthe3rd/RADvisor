/**
 * Pass A operator-discovery sweep — Reno/Tahoe basin.
 *
 *   node supabase/seed/anchor_sweep.mjs              # resumable: skips (anchor,term) pairs already cached
 *   node supabase/seed/anchor_sweep.mjs --refresh    # ignore cache, re-fetch everything from Google
 *   node supabase/seed/anchor_sweep.mjs --dry-run     # print the plan (pairs/cost estimate), fetch nothing
 *   node supabase/seed/anchor_sweep.mjs --smoke       # one live pair (~cents), print parsed results, no file writes
 *
 * Wired to ./anchor_sweep_queries.mjs (SEARCH_CONFIG, ANCHORS, QUERIES).
 * Runs Places Text Search (New) for every (anchor × query) pair, paginates to
 * the full 60 results per query, dedups on place_id, and writes:
 *   - anchor_sweep_operators.json  (full records + run metadata)
 *   - anchor_sweep_operators.csv   (one row per operator, prominence-sorted)
 *   - anchor_sweep_cache.json      (raw per-pair results, for resume / no re-bill)
 *
 * This is DISCOVERY ONLY (existence + prominence). It does NOT decide rents_gear
 * or extract inventory — that's Pass A triage (website sweep) and Pass B, per
 * extraction/00_general.md. Every row carries source_url (Google Maps URL) +
 * last_verified per the provenance rule (§2A, §8).
 *
 * Requires GOOGLE_PLACES_API_KEY (env or backend/.env).
 *
 * COST: uses Text Search (New) with websiteUri + rating + userRatingCount in the
 * field mask -> billed on the Text Search Enterprise SKU. website is needed for
 * Pass B triage and rating/userRatingCount are the prominence signal extraction
 * uses to prioritize (§4, §15). The resume cache means a rerun only bills pairs
 * not already fetched; use --refresh to force a full re-bill.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SEARCH_CONFIG, ANCHORS, QUERIES } from "./anchor_sweep_queries.mjs";

const seedDir = dirname(fileURLToPath(import.meta.url));
const jsonPath = join(seedDir, "anchor_sweep_operators.json");
const csvPath = join(seedDir, "anchor_sweep_operators.csv");
const cachePath = join(seedDir, "anchor_sweep_cache.json");

const REFRESH = process.argv.includes("--refresh");
const DRY_RUN = process.argv.includes("--dry-run");
const SMOKE = process.argv.includes("--smoke");

const CONCURRENCY = 5;          // parallel (anchor,term) pairs
const PAIR_DELAY_MS = 100;      // pause between pair starts (politeness)
const PAGE_DELAY_MS = 2200;     // Google needs ~2s before a nextPageToken is valid
const MAX_RETRIES = 4;
const CACHE_FLUSH_EVERY = 25;   // persist cache every N completed pairs

// ---------------------------------------------------------------------------
function loadApiKey() {
  if (process.env.GOOGLE_PLACES_API_KEY) return process.env.GOOGLE_PLACES_API_KEY;
  const envPath = join(seedDir, "../../backend/.env");
  if (!existsSync(envPath)) return null;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^GOOGLE_PLACES_API_KEY=(.+)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.primaryType",
  "places.primaryTypeDisplayName",
  "places.types",
  "places.businessStatus",
  "places.rating",
  "places.userRatingCount",
  "places.location",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "nextPageToken",
].join(",");

/** One Text Search page. Returns { places, nextPageToken } or throws after retries. */
async function searchPage(apiKey, anchor, term, pageToken) {
  const body = {
    textQuery: term,
    pageSize: SEARCH_CONFIG.pageSize,
    rankPreference: SEARCH_CONFIG.rankPreference,
    locationBias: {
      circle: {
        center: { latitude: anchor.lat, longitude: anchor.lng },
        radius: anchor.radius_m,
      },
    },
  };
  if (pageToken) body.pageToken = pageToken;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let res;
    try {
      res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": FIELD_MASK,
        },
        body: JSON.stringify(body),
      });
    } catch (e) {
      if (attempt === MAX_RETRIES) throw new Error(`network: ${e.message}`);
      await sleep(1000 * 2 ** attempt);
      continue;
    }
    if (res.ok) {
      const json = await res.json();
      return { places: json.places || [], nextPageToken: json.nextPageToken || null };
    }
    // Retry on rate limit / server errors; fail fast on 4xx (bad key, bad request).
    if (res.status === 429 || res.status >= 500) {
      if (attempt === MAX_RETRIES) {
        throw new Error(`HTTP ${res.status} after ${MAX_RETRIES} retries`);
      }
      await sleep(1000 * 2 ** attempt);
      continue;
    }
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
}

/** All pages (up to maxPages = 60 results) for one (anchor,term) pair. */
async function fetchPair(apiKey, anchor, term) {
  const collected = [];
  let token = null;
  for (let page = 0; page < SEARCH_CONFIG.maxPages; page++) {
    if (page > 0) await sleep(PAGE_DELAY_MS); // let the pageToken go live
    const { places, nextPageToken } = await searchPage(apiKey, anchor, term, token);
    collected.push(...places);
    if (!nextPageToken) break;
    token = nextPageToken;
  }
  return collected;
}

async function pool(items, fn, limit) {
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx], idx);
      await sleep(PAIR_DELAY_MS);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
}

function csvCell(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// ---------------------------------------------------------------------------
const apiKey = loadApiKey();
if (!apiKey && !DRY_RUN) {
  console.error("GOOGLE_PLACES_API_KEY not found (env or backend/.env).");
  process.exit(1);
}

// --smoke: one live pair, print parsed results, write nothing. Validates the
// request shape, field mask, and pagination against the live API for ~cents.
if (SMOKE) {
  const anchor = ANCHORS.find((a) => a.id === "south-lake-tahoe") ?? ANCHORS[0];
  const term = "kayak rental";
  console.log(`Smoke test: ${anchor.label} × "${term}" (up to ${SEARCH_CONFIG.maxPages} pages)…\n`);
  const places = await fetchPair(apiKey, anchor, term);
  console.log(`Results: ${places.length}`);
  const s = places[0];
  if (s) {
    console.log("\nSample[0] — confirms field mask:");
    console.log("  id:          ", s.id);
    console.log("  name:        ", s.displayName?.text);
    console.log("  website:     ", s.websiteUri ?? "(none)");
    console.log("  source_url:  ", s.googleMapsUri ?? "(none)");
    console.log("  primaryType: ", s.primaryTypeDisplayName?.text ?? s.primaryType);
    console.log("  rating:      ", s.rating, "| reviews:", s.userRatingCount);
    console.log("  phone:       ", s.nationalPhoneNumber ?? "(none)");
    console.log("  status:      ", s.businessStatus);
    console.log("  location:    ", s.location?.latitude, s.location?.longitude);
    console.log("  address:     ", s.formattedAddress);
  }
  console.log("\nAll names:", places.map((p) => p.displayName?.text).join(" | "));
  console.log("\nSmoke OK — no files written. Run without --smoke for the full sweep.");
  process.exit(0);
}

// Build the work list: every (anchor, query) pair, keyed for the resume cache.
const pairs = [];
for (const anchor of ANCHORS) {
  for (const q of QUERIES) {
    pairs.push({ key: `${anchor.id}::${q.term}`, anchor, q });
  }
}

console.log(
  `Sweep plan: ${ANCHORS.length} anchors × ${QUERIES.length} queries = ${pairs.length} pairs, ` +
    `up to ${SEARCH_CONFIG.maxPages} pages (${SEARCH_CONFIG.pageSize * SEARCH_CONFIG.maxPages} results) each.`,
);

if (DRY_RUN) {
  console.log(`Worst case ≈ ${pairs.length * SEARCH_CONFIG.maxPages} Text Search calls (most pairs return 1 page or 0).`);
  console.log("Dry run — no API calls made.");
  process.exit(0);
}

// Resume cache: { "<anchorId>::<term>": [ rawPlace, ... ] }
let cache = {};
if (!REFRESH && existsSync(cachePath)) {
  try {
    cache = JSON.parse(readFileSync(cachePath, "utf8")).pairs || {};
  } catch {
    cache = {};
  }
}
const todo = pairs.filter((p) => REFRESH || !(p.key in cache));
console.log(
  `${pairs.length - todo.length} pairs from cache, ${todo.length} to fetch from Google` +
    `${REFRESH ? " (--refresh: ignoring cache)" : ""}.\n`,
);

let done = 0;
let billedCalls = 0;
const errors = [];

function flushCache() {
  writeFileSync(cachePath, JSON.stringify({ updatedAt: new Date().toISOString(), pairs: cache }, null, 2));
}

await pool(
  todo,
  async ({ key, anchor, q }) => {
    try {
      const places = await fetchPair(apiKey, anchor, q.term);
      cache[key] = places;
      billedCalls += Math.max(1, Math.ceil(places.length / SEARCH_CONFIG.pageSize));
    } catch (e) {
      errors.push({ key, error: e.message });
      cache[key] = cache[key] || []; // mark attempted so a clean rerun can retry just failures via --refresh
    }
    done++;
    if (done % 20 === 0 || done === todo.length) {
      process.stdout.write(`\r  fetched ${done}/${todo.length} pairs (${billedCalls} billable calls)…`);
    }
    if (done % CACHE_FLUSH_EVERY === 0) flushCache();
  },
  CONCURRENCY,
);
flushCache();
console.log("\n");

// ---------------------------------------------------------------------------
// Aggregate from cache -> dedup on place_id, merge attribution across all pairs.
const RENTAL_SIGNAL_TIERS = new Set(["core", "gap"]); // tiers that signal likely-renter for triage priority
const qByTerm = new Map(QUERIES.map((q) => [q.term, q]));
const lastVerified = new Date().toISOString().slice(0, 10);

const ops = new Map(); // place_id -> record
for (const anchor of ANCHORS) {
  for (const q of QUERIES) {
    const places = cache[`${anchor.id}::${q.term}`] || [];
    for (const p of places) {
      if (!p.id) continue;
      let rec = ops.get(p.id);
      if (!rec) {
        rec = {
          place_id: p.id,
          name: p.displayName?.text ?? null,
          website: p.websiteUri ?? null,
          source_url: p.googleMapsUri ?? `https://www.google.com/maps/place/?q=place_id:${p.id}`,
          primary_type: p.primaryTypeDisplayName?.text ?? p.primaryType ?? null,
          types: p.types ?? [],
          business_status: p.businessStatus ?? null,
          rating: p.rating ?? null,
          user_rating_count: p.userRatingCount ?? 0,
          phone: p.nationalPhoneNumber ?? null,
          lat: p.location?.latitude ?? null,
          lng: p.location?.longitude ?? null,
          address: p.formattedAddress ?? null,
          matched_activities: new Set(),
          matched_terms: new Set(),
          matched_anchors: new Set(),
          matched_tiers: new Set(),
          match_pairs: 0,
          last_verified: lastVerified,
        };
        ops.set(p.id, rec);
      }
      const meta = qByTerm.get(q.term);
      rec.matched_activities.add(meta.activity);
      rec.matched_terms.add(q.term);
      rec.matched_anchors.add(anchor.id);
      rec.matched_tiers.add(meta.tier);
      rec.match_pairs++;
      // keep the richest values seen across duplicates
      rec.rating = rec.rating ?? p.rating ?? null;
      rec.user_rating_count = Math.max(rec.user_rating_count, p.userRatingCount ?? 0);
      rec.website = rec.website ?? p.websiteUri ?? null;
    }
  }
}

// Finalize: sets -> sorted arrays, add triage-priority signal, sort by prominence.
const records = [...ops.values()]
  .map((r) => ({
    ...r,
    matched_activities: [...r.matched_activities].sort(),
    matched_terms: [...r.matched_terms].sort(),
    matched_anchors: [...r.matched_anchors].sort(),
    matched_tiers: [...r.matched_tiers].sort(),
    rental_signal: [...r.matched_tiers].some((t) => RENTAL_SIGNAL_TIERS.has(t)),
    types: r.types,
  }))
  .sort(
    (a, b) =>
      Number(b.rental_signal) - Number(a.rental_signal) ||
      b.user_rating_count - a.user_rating_count ||
      (b.rating ?? 0) - (a.rating ?? 0),
  );

writeFileSync(
  jsonPath,
  JSON.stringify(
    {
      sweptAt: new Date().toISOString(),
      anchors: ANCHORS.length,
      queries: QUERIES.length,
      pairs: pairs.length,
      billable_calls_this_run: billedCalls,
      errors,
      operator_count: records.length,
      operators: records,
    },
    null,
    2,
  ),
);

const cols = [
  "place_id", "name", "rental_signal", "matched_tiers", "matched_activities",
  "match_pairs", "rating", "user_rating_count", "business_status", "primary_type",
  "website", "source_url", "phone", "address", "lat", "lng",
  "matched_anchors", "matched_terms", "last_verified",
];
const lines = [cols.join(",")];
for (const r of records) {
  lines.push(
    cols
      .map((c) => {
        const v = r[c];
        if (Array.isArray(v)) return csvCell(v.join("; "));
        return csvCell(v);
      })
      .join(","),
  );
}
writeFileSync(csvPath, lines.join("\n") + "\n");

// ---------------------------------------------------------------------------
const withSignal = records.filter((r) => r.rental_signal).length;
const withWebsite = records.filter((r) => r.website).length;
console.log(`Done. ${records.length} unique operators discovered.`);
console.log(`  ${withSignal} with a rental-type signal (core/gap) — Pass A triage priority.`);
console.log(`  ${withWebsite} have a website (needed for Pass B).`);
if (errors.length) console.log(`  ${errors.length} pair(s) errored — rerun with --refresh to retry, see JSON.errors.`);
console.log(`\nJSON: ${jsonPath}\nCSV:  ${csvPath}\nCache: ${cachePath}`);
