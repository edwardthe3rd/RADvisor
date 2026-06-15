/**
 * Website verification for operator names and rental categories.
 *
 *   node supabase/seed/verify_operators.mjs
 *
 * Triage helper only — high false-positive rate. Curated corrections belong in
 * operator_website_verified.json (instructions/02 §9); apply with
 * apply_operator_verified.mjs. Do NOT pass --apply without manual review.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const seedDir = dirname(fileURLToPath(import.meta.url));
const operatorsPath = join(seedDir, "operators.json");
const reportPath = join(seedDir, "verify_report.json");

const APPLY = process.argv.includes("--apply");
const CONCURRENCY = 8;
const FETCH_TIMEOUT_MS = 12_000;

/** Top-level category slugs → rental keywords (matched in page text). */
const CATEGORY_KEYWORDS = {
  snow_sports: [
    "ski rental",
    "ski & snowboard",
    "ski and snowboard",
    "snowboard rental",
    "snowshoe",
    "cross-country ski",
    "cross country ski",
    "nordic ski",
    "telemark",
    "alpine ski",
    "snow skate",
    "snowskate",
    "demo ski",
    "ski demo",
  ],
  mountain_biking: [
    "mountain bike",
    "mtb rental",
    "trail bike",
    "downhill bike",
    "enduro bike",
  ],
  road_cycling: [
    "road bike",
    "gravel bike",
    "cruiser bike",
    "bike rental",
    "bicycle rental",
    "cycling rental",
  ],
  water_sports: [
    "kayak",
    "paddleboard",
    "stand up paddle",
    "stand-up paddle",
    "sup rental",
    "boat rental",
    "jet ski",
    "wakeboard",
    "waterski",
    "water ski",
    "raft",
    "canoe",
    "pontoon",
    "scuba",
    "efoil",
    "e-foil",
    "parasail",
  ],
  camping: [
    "camping gear",
    "backpack rental",
    "tent rental",
    "sleeping bag",
    "camp kit",
  ],
  off_road: [
    "atv",
    "utv",
    "dirt bike",
    "snowmobile",
    "ohv",
    "side-by-side",
    "side by side",
  ],
  rock_climbing: [
    "climbing gear",
    "via ferrata",
    "bouldering",
    "climbing rental",
  ],
  aerial: [
    "hang glid",
    "paraglid",
    "parasail",
    "tandem flight",
  ],
  electric_transport: [
    "e-bike",
    "ebike",
    "electric bike",
    "pedego",
    "e-scooter",
    "slingshot",
  ],
};

/** Domains whose category mix is founder-verified — skip category diffs. */
const CATEGORY_OVERRIDE_SLUGS = new Set([
  "bluezone-sports-carson-city",
  "bluezone-sports-south-lake-tahoe",
  "bluezone-sports-tahoe-city",
  "granite-chief-powered-by-bluezone-sports",
  "donner-ski-shop",
  "gondola-ski-sports",
  "praxis-skis",
  "powder-house-ski-board-pro-snow",
  "powder-house-stateline-at-zalanta",
]);

function normalizeName(s) {
  return (s || "")
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/[^\w\s&]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function namesSimilar(a, b) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return true;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  // Token overlap — ignore generic words
  const stop = new Set(["the", "llc", "inc", "rental", "rentals", "shop", "store", "at", "and"]);
  const tokensA = new Set(na.split(" ").filter((t) => t.length > 2 && !stop.has(t)));
  const tokensB = new Set(nb.split(" ").filter((t) => t.length > 2 && !stop.has(t)));
  if (tokensA.size === 0 || tokensB.size === 0) return true;
  let overlap = 0;
  for (const t of tokensA) if (tokensB.has(t)) overlap++;
  const ratio = overlap / Math.min(tokensA.size, tokensB.size);
  return ratio >= 0.6;
}

function extractNameFromHtml(html) {
  const title =
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? "";
  const ogSite =
    html.match(/property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i)?.[1]
    ?? html.match(/content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i)?.[1]
    ?? "";
  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim() ?? "";

  const candidates = [ogSite, title, h1].filter(Boolean);
  for (const raw of candidates) {
    let name = raw
      .replace(/\s*[|–—-]\s*.+$/, "")
      .replace(/\s*:\s*.+$/, "")
      .trim();
    if (name.length >= 3 && name.length <= 80) return name;
  }
  return candidates[0]?.split(/[|–—-]/)[0]?.trim() ?? null;
}

function detectCategories(text) {
  const lower = text.toLowerCase();
  const found = [];
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) found.push(cat);
  }
  // road_cycling vs mountain_biking: generic "bike rental" alone → both if MTB not found
  if (found.includes("road_cycling") && !found.includes("mountain_biking")) {
    if (/\b(mountain|mtb|trail|downhill|enduro)\b/i.test(lower)) {
      found.push("mountain_biking");
    }
  }
  return [...new Set(found)].sort();
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "RADvisor-SeedVerify/1.0 (+https://theradvisor.com)",
        Accept: "text/html",
      },
      redirect: "follow",
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const html = await res.text();
    return { html: html.slice(0, 200_000) };
  } catch (err) {
    return { error: err.message ?? String(err) };
  } finally {
    clearTimeout(timer);
  }
}

async function verifyOperator(op) {
  if (!op.website) return { slug: op.slug, skipped: "no website" };
  const { html, error } = await fetchHtml(op.website);
  if (error) return { slug: op.slug, skipped: error };

  const websiteName = extractNameFromHtml(html);
  const detected = detectCategories(html.replace(/<[^>]+>/g, " "));
  const current = [...(op.categories || [])].sort();

  const result = {
    slug: op.slug,
    currentName: op.name,
    websiteName,
    currentCategories: current,
    detectedCategories: detected,
    website: op.website,
  };

  if (websiteName && !namesSimilar(op.name, websiteName)) {
    result.nameMismatch = true;
    result.suggestedName = websiteName;
  }

  if (
    !CATEGORY_OVERRIDE_SLUGS.has(op.slug)
    && current.length > 0
    && detected.length > 0
    && !arraysEqual(current, detected)
  ) {
    const missing = detected.filter((c) => !current.includes(c));
    const extra = current.filter((c) => !detected.includes(c));
    if (missing.length || extra.length) {
      result.categoryMismatch = true;
      result.missingCategories = missing;
      result.extraCategories = extra;
      result.suggestedCategories = detected;
    }
  }

  return result;
}

async function pool(items, fn, limit) {
  const results = [];
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

async function main() {
  const operators = JSON.parse(readFileSync(operatorsPath, "utf8"));
  const toVerify = operators.filter(
    (op) => op.website && op.is_active !== false && (op.categories?.length ?? 0) > 0,
  );
  console.log(`Verifying ${toVerify.length} active operators with websites and categories…`);

  const results = await pool(toVerify, verifyOperator, CONCURRENCY);
  const nameFixes = results.filter((r) => r.nameMismatch);
  const catFixes = results.filter((r) => r.categoryMismatch);
  const fetchErrors = results.filter((r) => r.skipped);

  console.log(`\nName mismatches: ${nameFixes.length}`);
  for (const r of nameFixes.slice(0, 30)) {
    console.log(`  ${r.slug}: "${r.currentName}" → "${r.suggestedName}"`);
  }
  if (nameFixes.length > 30) console.log(`  … and ${nameFixes.length - 30} more`);

  console.log(`\nCategory mismatches: ${catFixes.length}`);
  for (const r of catFixes.slice(0, 20)) {
    console.log(
      `  ${r.slug}: [${r.currentCategories}] → [${r.suggestedCategories}] (+${r.missingCategories}/-${r.extraCategories})`,
    );
  }
  if (catFixes.length > 20) console.log(`  … and ${catFixes.length - 20} more`);

  console.log(`\nFetch errors: ${fetchErrors.length}`);

  writeFileSync(reportPath, JSON.stringify({ nameFixes, catFixes, fetchErrors, all: results }, null, 2));
  console.log(`Report written to ${reportPath}`);

  if (APPLY) {
    const nameBySlug = new Map(nameFixes.map((r) => [r.slug, r.suggestedName]));
    const catBySlug = new Map(
      catFixes
        .filter((r) => r.suggestedCategories?.length)
        .map((r) => [r.slug, r.suggestedCategories]),
    );
    let applied = 0;
    for (const op of operators) {
      let changed = false;
      if (nameBySlug.has(op.slug)) {
        op.name = nameBySlug.get(op.slug);
        changed = true;
      }
      if (catBySlug.has(op.slug)) {
        op.categories = catBySlug.get(op.slug);
        changed = true;
      }
      if (changed) {
        op.last_verified = new Date().toISOString().slice(0, 10);
        applied++;
      }
    }
    writeFileSync(operatorsPath, JSON.stringify(operators, null, 1));
    console.log(`Applied ${applied} fixes to operators.json`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
