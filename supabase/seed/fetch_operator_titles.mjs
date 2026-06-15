/**
 * Fetch page titles for all active operators with websites.
 * Outputs title candidates for manual review → operator_website_verified.json
 *
 *   node supabase/seed/fetch_operator_titles.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const seedDir = dirname(fileURLToPath(import.meta.url));
const operatorsPath = join(seedDir, "operators.json");
const outPath = join(seedDir, "website_titles.json");

const CONCURRENCY = 10;
const TIMEOUT = 12_000;

function decodeEntities(s) {
  return (s || "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanTitle(raw) {
  if (!raw) return null;
  let t = decodeEntities(raw.trim());
  t = t.split(/\s*[|–—]\s*/)[0]?.trim() ?? t;
  t = t.replace(/\s*:\s*.+$/, "").trim();
  if (/^(home|cart|welcome|404|error|loading|redirect)/i.test(t)) return null;
  if (t.length < 3 || t.length > 90) return null;
  return t;
}

function extractTitle(html) {
  const og =
    html.match(/property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i)?.[1]
    ?? html.match(/content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i)?.[1];
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  return cleanTitle(og) ?? cleanTitle(title);
}

function normalize(s) {
  return decodeEntities(s).toLowerCase().replace(/[^\w\s&]/g, " ").replace(/\s+/g, " ").trim();
}

function likelyMismatch(current, title) {
  const a = normalize(current);
  const b = normalize(title);
  if (a === b) return false;
  if (a.includes(b) || b.includes(a)) return false;
  const stop = new Set(["the", "llc", "inc", "rental", "rentals", "shop", "store", "at", "and", "of"]);
  const tok = (s) => new Set(s.split(" ").filter((t) => t.length > 2 && !stop.has(t)));
  const ta = tok(a), tb = tok(b);
  if (!ta.size || !tb.size) return false;
  let overlap = 0;
  for (const t of ta) if (tb.has(t)) overlap++;
  return overlap / Math.min(ta.size, tb.size) < 0.5;
}

async function fetchTitle(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "RADvisor-SeedVerify/1.0", Accept: "text/html" },
      redirect: "follow",
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const html = await res.text();
    return { title: extractTitle(html.slice(0, 150_000)) };
  } catch (e) {
    return { error: e.message };
  } finally {
    clearTimeout(timer);
  }
}

async function pool(items, fn, n) {
  const out = [];
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }));
  return out;
}

const operators = JSON.parse(readFileSync(operatorsPath, "utf8"));
const verified = JSON.parse(
  readFileSync(join(seedDir, "operator_website_verified.json"), "utf8"),
);
const toFetch = operators.filter(
  (o) => o.website && o.is_active !== false && !verified[o.slug],
);

console.log(`Fetching titles for ${toFetch.length} operators…`);
const results = await pool(
  toFetch,
  async (op) => {
    const { title, error } = await fetchTitle(op.website);
    const entry = {
      slug: op.slug,
      currentName: op.name,
      website: op.website,
      pageTitle: title,
      fetchError: error,
    };
    if (title && likelyMismatch(op.name, title)) entry.needsReview = true;
    return entry;
  },
  CONCURRENCY,
);

const needsReview = results.filter((r) => r.needsReview);
writeFileSync(outPath, JSON.stringify({ needsReview, all: results }, null, 2));
console.log(`Needs review: ${needsReview.length} → ${outPath}`);
needsReview.slice(0, 40).forEach((r) =>
  console.log(`  ${r.slug}: "${r.currentName}" ← "${r.pageTitle}"`),
);
