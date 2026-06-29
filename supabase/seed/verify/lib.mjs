/**
 * Shared helpers for the operator verification pipeline.
 *
 * - Google Places fetch/classify helpers (extracted from check_google_rental_demo.mjs)
 * - Website fetch + HTML→text
 * - Acquisition (rental/demo/lease) + subcategory (equipment-type) keyword detection
 *
 * The subcategory keyword maps mirror web/lib/config/categories.ts (base
 * subcategories only — `_demo`/`_lease` variants are expressed via flags, not tags).
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const seedDir = dirname(dirname(fileURLToPath(import.meta.url))); // supabase/seed
export const verifyDir = join(seedDir, "verify");
export const operatorsPath = join(seedDir, "operators.json");

// ---------------------------------------------------------------------------
// Google Places
// ---------------------------------------------------------------------------

export function loadApiKey() {
  if (process.env.GOOGLE_PLACES_API_KEY) return process.env.GOOGLE_PLACES_API_KEY;
  const envPath = join(seedDir, ".env");
  if (!existsSync(envPath)) return null;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^GOOGLE_PLACES_API_KEY=(.+)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  return null;
}

export function extractPlaceId(notes) {
  const m = (notes || "").match(/google_place_id:(ChIJ[A-Za-z0-9_-]+)/);
  return m?.[1] ?? null;
}

export async function fetchPlace(apiKey, placeId) {
  const url = `https://places.googleapis.com/v1/places/${placeId}`;
  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": [
          "displayName",
          "websiteUri",
          "primaryType",
          "types",
          "editorialSummary",
          "generativeSummary",
          "reviewSummary",
        ].join(","),
      },
    });
    if (!res.ok) {
      const body = await res.text();
      return { error: `HTTP ${res.status}: ${body.slice(0, 160)}` };
    }
    return { place: await res.json() };
  } catch (e) {
    return { error: `fetch failed: ${e.message}` };
  }
}

export function collectGoogleText(place) {
  const overview = [
    place.displayName?.text,
    place.editorialSummary?.text,
    place.editorialSummary?.overview,
    place.generativeSummary?.overview?.text,
  ]
    .filter(Boolean)
    .join(" ");
  const reviews = place.reviewSummary?.text?.text || "";
  const types = (place.types || []).join(" ");
  return {
    overview,
    reviews,
    types,
    all: `${overview} ${reviews} ${types}`.trim(),
  };
}

// ---------------------------------------------------------------------------
// Website fetch
// ---------------------------------------------------------------------------

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36 RADvisorVerifier/1.0";

const CANDIDATE_PATHS = [
  "",
  "rentals",
  "rental",
  "rent",
  "demo",
  "demos",
  "lease",
  "season-lease",
  "seasonal",
  "pricing",
  "rates",
  "shop",
  "products",
  "services",
];

const LINK_PRIORITY_PATTERNS = [
  /\b(rentals?|rent|demos?|lease|leasing|hire)\b/i,
  /\b(season|pricing|rates?|reservations?|booking|book now|reserve)\b/i,
  /\b(shop|products?|services?)\b/i,
];

export function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchUrlText(url, timeoutMs = 9000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      redirect: "follow",
      signal: ctrl.signal,
    });
    if (!res.ok) return { url, ok: false, status: res.status, html: "" };
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html")) return { url, ok: false, status: res.status, html: "" };
    const html = await res.text();
    return { url, ok: true, status: res.status, html, finalUrl: res.url };
  } catch (e) {
    return { url, ok: false, status: 0, html: "", error: e.name || e.message };
  } finally {
    clearTimeout(t);
  }
}

/** Same-host links from homepage HTML, ranked so explicit rental/demo/lease links win the page budget. */
function relevantLinks(homeHtml, baseUrl) {
  const links = new Map();
  let origin;
  try {
    origin = new URL(baseUrl).origin;
  } catch {
    return [];
  }
  const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(homeHtml))) {
    const href = m[1];
    const anchor = htmlToText(m[2]).toLowerCase();
    const hay = `${href.toLowerCase()} ${anchor}`;
    const priority = LINK_PRIORITY_PATTERNS.findIndex((pattern) => pattern.test(hay));
    if (priority < 0) continue;
    try {
      const abs = new URL(href, baseUrl);
      if (abs.origin !== origin) continue;
      if (/\.(pdf|jpg|jpeg|png|gif|svg|zip|mp4)$/i.test(abs.pathname)) continue;
      const url = abs.href.split("#")[0];
      if (!links.has(url)) links.set(url, { url, priority });
    } catch {
      /* ignore */
    }
  }
  return [...links.values()]
    .sort((a, b) => a.priority - b.priority)
    .map((link) => link.url);
}

/**
 * Fetch a site's homepage + a capped set of rental/demo/lease-relevant pages.
 * Returns combined text, the pages actually read, and whether anything rendered.
 */
export async function fetchWebsiteEvidence(website, maxPages = 6) {
  if (!website) return { text: "", pages: [], reachable: false, note: "no website" };
  let base;
  try {
    base = new URL(website);
  } catch {
    return { text: "", pages: [], reachable: false, note: "bad url" };
  }
  const origin = base.origin;

  const home = await fetchUrlText(origin + base.pathname.replace(/\/$/, "") + "/");
  const pages = [];
  let combined = "";
  if (home.ok) {
    const text = htmlToText(home.html);
    pages.push({ url: home.finalUrl || home.url, chars: text.length, text });
    combined += " " + text;
  }

  // Discovered links from homepage take priority, then fixed candidate paths.
  const discovered = home.ok ? relevantLinks(home.html, home.finalUrl || origin) : [];
  const fixed = CANDIDATE_PATHS.slice(1).map((p) => `${origin}/${p}`);
  const queue = [...new Set([...discovered, ...fixed])].filter(
    (u) => u !== (home.finalUrl || home.url),
  );

  for (const u of queue) {
    if (pages.length >= maxPages) break;
    const r = await fetchUrlText(u);
    if (r.ok) {
      const text = htmlToText(r.html);
      if (text.length > 200) {
        pages.push({ url: r.finalUrl || r.url, chars: text.length, text });
        combined += " " + text;
      }
    }
  }

  combined = combined.replace(/\s+/g, " ").trim();
  return {
    text: combined,
    pages,
    reachable: pages.length > 0,
    note: pages.length === 0 ? "unreachable / no html" : "",
  };
}

// ---------------------------------------------------------------------------
// Acquisition detection
// ---------------------------------------------------------------------------

const RENTAL_RE =
  /\b(rentals?|renting|rent out|rent-a-|rent a |gear rental|equipment rental|for rent|to rent|rent skis?|rent snowboards?|rent bikes?|rent kayaks?|rent a kayak|rental shop|rental fleet|reserve your rental|book a rental|daily rental|weekly rental|hourly rental)\b/i;

// Demo as a *service* (try-the-gear), not retail "demo gear sale" / "ex-demo".
// Broadened beyond ski-only phrasing to catch general gear demos ("demo bike program",
// "demo bikes", "demo our enduro", "test ride"); retail demo-liquidation is excluded by
// NO_DEMO_RE below.
const DEMO_RE =
  /\b(demo (programs?|fleets?|days?|nights?|centers?|centres?|events?|tours?|packages?|bikes?|e[\s-]?bikes?|mtbs?|skis?|snowboards?|boards?|kayaks?|sups?|paddleboards?|gear|equipment)|demo (the|our|a|your) [a-z]|demos? available|on[\s-]?snow demos?|try before you buy|book a demo|schedule a demo|free demos?|demo (and|&|\/) rental|rental (and|&|\/) demo|test (the latest|skis?|boards?|bikes?|gear)|test[\s-]?rides?|tryouts?)\b/i;

// Negatives: explicit "no demos" AND retail demo-liquidation ("ex-demo", "demo bikes
// for sale") which is a sale, not a try-the-gear service.
const NO_DEMO_RE =
  /\b(no demos?|demos? not (available|offered)|don'?t (offer|do) demos?|ex[\s-]?demos?|used demos?|demo (bikes?|e[\s-]?bikes?|skis?|snowboards?|boards?|gear|models?|units?) (for|on) sale|demo sale)\b/i;

const LEASE_RE =
  /\b(season(al)? (ski|snowboard|board|gear|equipment) (lease|leasing|program)|(ski|snowboard|board|junior|youth|kids'?|seasonal|season) lease(s| program)?|lease (your )?(skis?|snowboard|board|gear|equipment) for the season|full[\s-]?season (lease|program)|season lease|seasonal lease|lease packages?)\b/i;

const RETAIL_ONLY_RE =
  /\b(consignment (store|shop|retail)|retail only|new and used gear for sale|we (only )?sell|sales only)\b/i;

// PERMANENT-closure wording only. Google's businessStatus is unreliable (often
// still OPERATIONAL for shut businesses), but seasonal sites say "closed for the
// season / winter hours / closed Mondays" — those must NOT count. These phrases
// are essentially never on a live business's site.
const CLOSED_RE =
  /\b(permanently closed|going out of business|out of business|no longer in business|ceased operations|saying goodbye|closed (its doors )?(for good|permanently)|has closed for good)\b/i;

/** Returns the matched closure phrase, or null. */
export function closedPhrase(text) {
  return (text || "").match(CLOSED_RE)?.[0] ?? null;
}

/** True when website text indicates the business has permanently shut down. */
export function detectClosed(text) {
  return CLOSED_RE.test(text || "");
}

/** Detect acquisition signals in a blob of text. */
export function detectAcquisition(text) {
  const t = text || "";
  return {
    rental: RENTAL_RE.test(t),
    demo: DEMO_RE.test(t) && !NO_DEMO_RE.test(t),
    lease: LEASE_RE.test(t),
    retailOnly: RETAIL_ONLY_RE.test(t),
  };
}

// ---------------------------------------------------------------------------
// Subcategory (equipment-type) detection
// ---------------------------------------------------------------------------

/** category slug → { base subcategory slug → keyword regex } */
export const SUBCATEGORY_KEYWORDS = {
  snow_sports: {
    // Guard against "water ski" / "jet ski" (a water-sports operator).
    alpine_ski: /\b(alpine skis?|downhill skis?|(?<!water )(?<!jet )ski rentals?|skis? and (boots|poles)|demo skis?|(?<!water )(?<!jet )ski (package|rental))\b/i,
    snowboard: /\b(snowboards?|snowboard rentals?|board rentals?)\b/i,
    cross_country_ski: /\b(cross[\s-]?country skis?|nordic skis?|xc skis?|skate skis?|classic skis?|nordic rental)\b/i,
    splitboard: /\b(splitboards?)\b/i,
    snowshoe: /\b(snowshoes?|snowshoeing)\b/i,
    sled: /\b(sleds?|tubes?|tubing|toboggans?|snow tubes?)\b/i,
    apparel_snow: /\b(ski (jackets?|pants|apparel|clothing)|snow (jackets?|pants|apparel)|outerwear rental|jacket and pant rental)\b/i,
  },
  mountain_biking: {
    xc_bike: /\b(cross[\s-]?country (bikes?|mtb)|xc (bikes?|mountain bikes?))\b/i,
    trail_bike: /\b(trail bikes?|all[\s-]?mountain bikes?)\b/i,
    enduro_bike: /\b(enduro bikes?)\b/i,
    downhill_bike: /\b(downhill bikes?|dh bikes?|park bikes?|bike park rentals?)\b/i,
    ebike_mtb: /\b(electric mountain bikes?|e[\s-]?mtb|electric mtb|e[\s-]?bike (mountain|trail))\b/i,
    kids_bike: /\b(kids'? (mountain )?bikes?|youth (mountain )?bikes?|children'?s bikes?)\b/i,
  },
  road_cycling: {
    road_bike: /\b(road bikes?|road bike rentals?)\b/i,
    gravel_bike: /\b(gravel bikes?|adventure bikes?|all[\s-]?road bikes?)\b/i,
    ebike_road: /\b(electric road bikes?|e[\s-]?road bikes?)\b/i,
  },
  burning_man_bikes: {
    playa_bike: /\b(playa bikes?|burning man bikes?|cruiser bikes?|beach cruisers?)\b/i,
  },
  water_sports: {
    kayak: /\b(kayaks?|kayaking)\b/i,
    canoe: /\b(canoes?|canoeing)\b/i,
    paddleboard: /\b(paddle ?boards?|sup\b|stand[\s-]?up paddle)\b/i,
    raft: /\b(rafts?|rafting|whitewater)\b/i,
    jet_ski: /\b(jet ?skis?|pwc|personal watercraft|wave runners?|seadoo|sea[\s-]?doo)\b/i,
    wakeboard: /\b(wakeboards?|water ?skis?|wakesurf|towables?)\b/i,
    wetsuit: /\b(wetsuits?|drysuits?)\b/i,
    boat: /\b(boat rentals?|rent a boat|pontoons?|motorboats?|fishing boats?|deck boats?|ski boats?|patio boats?)\b/i,
  },
  camping: {
    tent: /\b(tents?|backpacking tents?|camping tents?)\b/i,
    sleep_system: /\b(sleeping bags?|sleeping pads?|sleep systems?|air mattress(es)?)\b/i,
    backpack: /\b(backpacks?|backpacking packs?|hiking packs?|daypacks?)\b/i,
    cooking: /\b(camp (stoves?|kitchen)|stoves?|cook(ing|sets?|ware)|jetboil)\b/i,
    camp_furniture: /\b(camp (chairs?|furniture|tables?)|camping chairs?|cots?)\b/i,
    full_kit: /\b(camp(ing)? kits?|complete (camp|camping) (kit|set|package)|car camping package|full camp setup)\b/i,
  },
  off_road: {
    atv: /\b(atvs?|quads?|four[\s-]?wheelers?|all[\s-]?terrain vehicles?)\b/i,
    utv: /\b(utvs?|side[\s-]?by[\s-]?sides?|razors?|rzrs?|sxs\b)\b/i,
    dirt_bike: /\b(dirt ?bikes?|motocross|mx bikes?|trail motorcycles?)\b/i,
    snowmobile: /\b(snowmobiles?|sleds?(?= rental)|snow machines?)\b/i,
  },
  motorcycles: {
    street_moto: /\b(street (motorcycles?|bikes?)|cruisers? motorcycles?|harley|sport bikes?|touring motorcycles?)\b/i,
    adventure_moto: /\b(adventure (motorcycles?|bikes?)|dual[\s-]?sport|adv bikes?|enduro motorcycles?)\b/i,
  },
  rock_climbing: {
    climbing_shoes: /\b(climbing shoes?|rock shoes?)\b/i,
    harness: /\b(harness(es)?)\b/i,
    rope_hardware: /\b(climbing ropes?|ropes?|carabiners?|quickdraws?|belay (device|kit)|hardware)\b/i,
    crash_pad: /\b(crash pads?|bouldering pads?)\b/i,
    full_climbing_kit: /\b(climbing (kits?|packages?)|complete climbing (kit|set)|gym to crag)\b/i,
  },
  electric_transport: {
    e_scooter: /\b(electric scooters?|e[\s-]?scooters?)\b/i,
    e_bike_city: /\b(city e[\s-]?bikes?|electric (city )?bikes?|e[\s-]?bikes?|commuter e[\s-]?bikes?)\b/i,
    onewheel: /\b(onewheels?|one ?wheel|euc|electric unicycles?|esk8)\b/i,
  },
  winter_other: {
    ice_skates: /\b(ice skates?|ice skating)\b/i,
    avalanche_safety: /\b(avalanche (safety|gear|beacons?)|beacons?|probes?|avy gear|transceivers?)\b/i,
  },
  aerial: {
    paraglider: /\b(paraglid(er|ing)|paragliders?)\b/i,
    wingsuit: /\b(wingsuits?|wing ?suit)\b/i,
  },
};

/**
 * Strong, unambiguous anchor term per category. Used to GATE category assignment
 * for fresh intake (where the category is unknown) — a category is only assigned
 * when its anchor appears, which stops cross-category bleed ("water ski" →
 * snow_sports, "bike" → burning_man, "shoes" → climbing, etc.).
 */
export const CATEGORY_ANCHORS = {
  snow_sports:
    /\b(snowboard\w*|alpine ski\w*|downhill ski\w*|cross[\s-]?country ski\w*|nordic ski\w*|ski (?:&|and) (?:snowboard|board)|(?<!water )(?<!jet )ski (?:rental|shop|resort|boots?)|snowshoe\w*|telemark|splitboard\w*)\b/i,
  water_sports:
    /\b(kayak\w*|paddle ?board\w*|stand[\s-]?up paddle|\bsup\b|jet ?ski\w*|wave ?runner\w*|boat rental\w*|pontoon\w*|rafts?|rafting|wakeboard\w*|wetsuit\w*|marina|water ?sports?|canoe\w*)\b/i,
  mountain_biking:
    /\b(mountain bik\w*|\bmtb\b|trail bik\w*|downhill bik\w*|enduro bik\w*|fat bik\w*|e[\s-]?mtb)\b/i,
  road_cycling: /\b(road bik\w*|gravel bik\w*|road cycling)\b/i,
  electric_transport:
    /\b(electric bik\w*|e[\s-]?bikes?|electric scooter\w*|e[\s-]?scooter\w*|onewheel\w*|electric unicycle\w*|\beuc\b)\b/i,
  burning_man_bikes: /\b(playa bik\w*|burning man bik\w*)\b/i,
  camping:
    /\b(camping (?:gear|equipment|rental)|backpacking (?:gear|rental)|sleeping bags?|tent rental\w*|car camping|camp kits?)\b/i,
  off_road:
    /\b(atvs?|utvs?|side[\s-]?by[\s-]?sides?|\brzrs?\b|dirt ?bik\w*|snowmobil\w*|off[\s-]?road (?:rental|vehicle|tour))\b/i,
  motorcycles:
    /\b(motorcycle\w*|harley|adventure (?:bike|motorcycle)|dual[\s-]?sport)\b/i,
  rock_climbing:
    /\b(rock climb\w*|climbing (?:gym|shoes?|gear|rental|harness)|bouldering|crash ?pads?)\b/i,
  winter_other:
    /\b(ice skat\w*|avalanche (?:safety|gear|beacon\w*|transceiver\w*)|avy gear)\b/i,
  aerial: /\b(paraglid\w*|hang ?glid\w*|wingsuit\w*)\b/i,
};

/** Categories whose anchor term appears in the text. */
export function detectAnchorCategories(text) {
  const t = text || "";
  return Object.keys(CATEGORY_ANCHORS).filter((c) => CATEGORY_ANCHORS[c].test(t));
}

// Words that mark rental context — gear named NEAR these is rented, not just mentioned.
const RENTAL_CONTEXT_RE =
  /\b(rent|rents|rental|rentals|renting|demo|demos|lease|leasing|for hire|to hire|hourly|daily rate|half[\s-]?day|full[\s-]?day|per day|reserve|book (?:your|a|online)|rent a)\b/gi;

/**
 * Concatenate ±window-char snippets around every rental-context keyword. Running
 * category/subcategory detection on THIS (instead of the whole page) means gear
 * only counts when it sits next to rental language — killing incidental mentions
 * (footer links, blog posts, "we also sell"). Returns "" when there's no rental
 * context at all (caller should fall back to the full text).
 */
export function rentalContextText(text, window = 140) {
  const t = text || "";
  const out = [];
  let m;
  RENTAL_CONTEXT_RE.lastIndex = 0;
  while ((m = RENTAL_CONTEXT_RE.exec(t)) && out.length < 200) {
    out.push(t.slice(Math.max(0, m.index - window), m.index + window));
  }
  return out.join(" ");
}

/** Detect which base subcategories of `category` the text mentions. */
export function detectSubcategories(text, category) {
  const map = SUBCATEGORY_KEYWORDS[category];
  if (!map) return [];
  const out = [];
  for (const [sub, re] of Object.entries(map)) {
    if (re.test(text)) out.push(sub);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Concurrency
// ---------------------------------------------------------------------------

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function pool(items, fn, limit, delayMs = 0) {
  const out = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
      if (delayMs) await sleep(delayMs);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return out;
}
