#!/usr/bin/env node
// Phase 0 review aid v2: per-(operator,category) evidence digest from CACHED Pass A data.
// v2 fix: two-tier activity signal. STRONG = unambiguous gear/activity terms. WEAK = terms that
// cross-contaminate between categories — above all bare "ski", which matches JET SKI / WATER SKI
// on boat-rental sites and is the single biggest source of bogus snow_sports claims.

import fs from "node:fs";
const SEED = "/Users/echalicki/RADvisor/supabase/seed/";
const read = (f) => JSON.parse(fs.readFileSync(SEED + f, "utf8"));

const TARGETS = ["snow_sports", "water_sports", "mountain_biking", "road_cycling", "electric_transport", "off_road", "fishing"];

// STRONG: seeing this term means the activity itself is really present on the page.
// WEAK: suggestive but cross-contaminating; never enough on its own.
const SIG = {
  snow_sports: {
    strong: /\b(snowboard\w*|snowshoe\w*|snowmobile\w*|snowmachine|snowskate\w*|splitboard\w*|telemark|nordic|cross[- ]country ski\w*|avalanche|toboggan|sledding|ski boots?|ski package\w*|ski rental\w*|ski & snowboard|ski and snowboard|alpine ski\w*|backcountry ski\w*|ski bike\w*|timbersled|snow gear|ski tune|ski shop|season lease)\b/gi,
    // bare ski/skis/skiing, but NOT jet ski / water ski / wake ski / ski boat
    weak: /(?<!\b(?:jet|water|wake|sea[- ]?doo)[- ]?)\bskis?(?:ing)?\b(?![- ]?boat)/gi,
  },
  water_sports: {
    strong: /\b(kayak\w*|paddle ?board\w*|\bsup\b|canoe\w*|jet ?ski\w*|waverunner\w*|pontoon\w*|raft\w*|wakeboard\w*|wakesurf\w*|water ?ski\w*|wetsuit\w*|e-?foil\w*|hydrofoil|snorkel\w*|scuba|parasail\w*|boat rental\w*|watercraft)\b/gi,
    weak: /\b(boat\w*|sail\w*|dive|diving|tube\w*|marina)\b/gi,
  },
  mountain_biking: {
    strong: /\b(mountain bike\w*|\bmtb\b|trail bike\w*|full[- ]suspension|hardtail|downhill bike\w*|enduro|fat ?bike\w*|fat[- ]tire bike\w*)\b/gi,
    weak: /\b(bike\w*|bicycle\w*|cycling)\b/gi,
  },
  road_cycling: {
    strong: /\b(road bike\w*|cruiser\w*|hybrid bike\w*|city bike\w*|comfort bike\w*|tandem\w*|beach cruiser\w*|path bike\w*|kids?'? bike\w*|gravel bike\w*)\b/gi,
    weak: /\b(bike\w*|bicycle\w*|cycling|bike path)\b/gi,
  },
  electric_transport: {
    strong: /\b(e-?bikes?\w*|electric bikes?\w*|e-?scooters?\w*|electric scooters?\w*|pedal[- ]assist|e-?assist|e-?mtb)\b/gi,
    weak: /\belectric\b/gi,
  },
  off_road: {
    strong: /\b(atvs?\b|utvs?\b|side[- ]by[- ]sides?\b|\brzrs?\b|dirt ?bikes?\w*|\bohv\b|razors?\b|quads?\b|polaris|can-?am|slingshot\w*|off[- ]road\w*)\b/gi,
    weak: /\b(4x4|jeep\w*|trail\w*)\b/gi,
  },
  fishing: {
    strong: /\b(fishing rod\w*|rod\w* (and|&) reel\w*|fishing gear|fishing equipment|tackle|fly[- ]fish\w*|fishing charter\w*|fish finder\w*|fishing pole\w*|angling)\b/gi,
    weak: /\b(fishing|fish\w*|reel\w*|trout|bait|angler\w*)\b/gi,
  },
};
const RENTAL = /\b(rent|rents|rental|rentals|renting|demo|demos|lease|leasing|hire|per day|\/day|per hour|\/hr|hourly|half[- ]day|full[- ]day)\b/i;
const RETAIL = /\b(add to cart|checkout|regular price|sale price|sold out|free shipping|shop all|view cart|add to bag)\b/i;
const SERVICE_ONLY = /\b(repair|tune|storage|winteriz|parts? (and|&) accessor|sales? (and|&) service|dealer)\b/i;

const triage = read("sweep_pass_a_triage.json");
const evidence = read("sweep_pass_a_evidence.json").results || [];
const evByKey = new Map(evidence.map((r) => [r.place_id || `name:${r.name}`, r]));
let ops = [];
try { const j = read("quadtree_sweep_operators.json"); ops = j.operators || j.results || j; } catch {}
const typeByPid = new Map(ops.map((o) => [o.place_id, o.primary_type_raw || o.primary_type || ""]));

const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();
const auto = (triage.results || []).filter((r) => r.status === "triaged" && /auto-triaged/i.test(r.note || ""));

function scan(hay, re) {
  const rx = new RegExp(re.source, re.flags);
  let m, hits = 0, rHits = 0; const wins = [];
  while ((m = rx.exec(hay)) !== null) {
    hits++;
    const w = hay.slice(Math.max(0, m.index - 75), m.index + 85);
    if (RENTAL.test(w)) { rHits++; if (wins.length < 2 && !wins.some((x) => Math.abs(x.i - m.index) < 150)) wins.push({ i: m.index, w: clean(w) }); }
    if (hits > 500) break;
  }
  return { hits, rHits, wins };
}

const out = [];
out.push(`# SCRUB DIGEST v2 — ${auto.length} auto-triaged operators (cached evidence only)`);
out.push(`# S=strong-signal hits (Sr=with rental nearby) | W=weak/ambiguous hits (Wr=with rental)`);
out.push(`# Bare "ski" excluded from snow strong-signal: it matches JET SKI / WATER SKI on boat sites.`);
out.push(`# Windows shown only for non-obvious calls. Suggestions are hints — verify against gist.`);
out.push("");

for (const r of auto.sort((a, b) => (a.rank ?? 1e9) - (b.rank ?? 1e9))) {
  const key = r.place_id || `name:${r.name}`;
  const ev = evByKey.get(key);
  const text = clean([(ev?.google_text || ""), ...((ev?.pages || []).map((p) => p.text || ""))].join(" "));
  const hay = text + " " + [...(r.rental_page_urls || []), ...(r.checked_urls || [])].join(" ") + " " + r.name;
  const distinct = new Set((ev?.pages || []).map((p) => p?.url).filter(Boolean));
  const thin = !ev || !ev.reachable || (ev.pages_fetched || 0) <= 1 || distinct.size <= 1;
  const targets = (r.categories || []).filter((c) => TARGETS.includes(c));
  if (!targets.length) continue;

  const flags = [thin ? "⚠THIN" : "", RETAIL.test(text) ? "RETAIL" : "", SERVICE_ONLY.test(text) ? "SVC/REPAIR" : ""].filter(Boolean).join(" ");
  out.push(`### [${r.rank}] ${r.name}`);
  out.push(`pid:${r.place_id || "(none)"} | ${typeByPid.get(r.place_id) || "?"} | ${r.website || "(none)"} | pg:${distinct.size} ${flags}`);
  out.push(`gist: ${clean(ev?.pages?.[0]?.text || r.evidence_snippet || "").slice(0, 230)}`);

  for (const cat of targets) {
    const s = scan(hay, SIG[cat].strong);
    const w = scan(hay, SIG[cat].weak);
    let suggest, showWins;
    if (s.rHits > 0) { suggest = s.rHits >= 4 ? "KEEP" : "KEEP?"; showWins = s.rHits < 4; }
    else if (s.hits > 0) { suggest = "REVIEW?"; showWins = true; }
    else if (w.rHits > 0) { suggest = "AMBIG→weak-signal-only"; showWins = true; }
    else if (thin) { suggest = "REVIEW(thin)"; showWins = false; }
    else { suggest = "REMOVE-CAND"; showWins = false; }
    out.push(`  ${cat.padEnd(19)} S=${String(s.hits).padStart(3)}/Sr=${String(s.rHits).padStart(3)}  W=${String(w.hits).padStart(3)}/Wr=${String(w.rHits).padStart(3)}  ${suggest}`);
    if (showWins) for (const x of (s.wins.length ? s.wins : w.wins)) out.push(`      » ${x.w}`);
  }
  out.push("");
}

fs.writeFileSync(process.argv[2] || "/dev/stdout", out.join("\n"));
console.error(`digest v2: ${auto.length} operators`);
