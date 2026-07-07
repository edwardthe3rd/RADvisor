# Pass A / Stage 2 — Operator Triage Runbook (self-contained)

You are triaging recreational-rental operators for RADvisor. Decide, per operator, **does this
business rent gear/vehicles to its own customers**, and if so, **every** RADvisor category it
serves. This file is everything you need — you need no other context.

> This is **Pass A Stage 2 (triage)** → writes `sweep_pass_a_triage.json`. It is NOT Pass B deep
> inventory extraction (that is a separate later step that writes `equipment` rows).

## The loop

Run all commands from the repo root (`~/RADvisor`). Scratch files live in `supabase/seed/`.

```
# 1. Get the next batch of operators that still need triage (default 25):
node supabase/seed/triage_batch.mjs 25 --out supabase/seed/triage_inbox.txt

# 2. Read supabase/seed/triage_inbox.txt. For each operator, apply the RUBRIC below and produce
#    one verdict object (schema below). Browse the website LIVE for any ambiguous or unreachable
#    operator. Write all verdicts as a JSON array to supabase/seed/triage_verdicts.json.

# 3. Validate + save them (rejects malformed verdicts; writes nothing on error):
node supabase/seed/triage_apply.mjs supabase/seed/triage_verdicts.json

# 4. Repeat until triage_batch.mjs reports 0 remaining.
```

Operators are emitted in priority order (originals first, ranks 1-233, then sweep survivors).
Already-triaged operators are skipped automatically. Run only one batch at a time.

## RUBRIC — classify by the BUSINESS MODEL you actually read, not keywords

A **rental** operator lets customers **take gear/vehicles for a period**. That is the only thing
that makes `rents_gear = true`.

- **Charter / guided tour / lessons / guide service** → `rents_gear: false`, status `no_rentals`.
  They sell a guided *experience*. Supplying gear *during* a guided trip is NOT rental.
  **Worked example: a guided fishing charter is `no_rentals` even if its site says "boat rentals
  nearby."** The word "rent" on a page is not evidence — confirm the operator *itself* rents to
  *its own* customers.
- **Retailer / repair / dealer only** (sells or services gear, no rentals) → `no_rentals`.
- **Rents, but nothing in a RADvisor category** (U-Haul, party tents, medical, road-only RV) →
  `rents_gear: true`, status `out_of_scope`, note what they rent. Do not assign categories.
- **Confirmed renter with ≥1 in-domain category** → `rents_gear: true`, status `triaged`,
  fill `categories[]`.
- **Can't tell** → status `needs_review`. The note MUST state the single action that resolves it
  ("ACTION: call/email operator — confirm X", with phone/email when findable), so the review
  queue reads as a work list, not a re-triage. **Never guess.**

### Decision rules (each settled by a real 2026-07 Tahoe case — apply them verbatim)

1. **Take-away rule (defines `rents_gear`).** A rental means the customer takes gear for
   *independent* use. Gear confined to the operator's venue is NOT a rental: ice-rink skates
   that can't leave the rink, range-only archery gear → `no_rentals`.
2. **Captained-charter rule.** A boat/yacht that comes with a required captain/crew is an
   experience → `no_rentals` — even when the site says "rentals" (Tahoe Jet Boats, Tahoe Yacht
   Charters). A bareboat / drive-it-yourself option, or self-serve jet ski/SUP rentals alongside
   the charters, makes it a renter (Endless Wave, Full Throttle Tahoe) → `triaged`.
3. **Ticket/admission-bundled gear** (sled hills, tubing/activity zones: SnoVentures, Adventure
   Mountain) → `no_rentals`. BUT a **day-use venue/trail fee alongside a real rental counter**
   (nordic centers: ASC Training Center, Kirkwood XC) is still a rental → `triaged`.
4. **Pass/membership-gated demos** (Sky Tavern: season-pass holders only) → `no_rentals`.
   Public paid demo programs (Alpenglow Sports, RMU, Slant Skis) ARE rentals → `triaged`.
5. **Guide-required gear** (gear only obtainable on a guided outing: Alpenglow Expeditions,
   Tahoe Outdoor Adventures "and Rentals") → `no_rentals`. The word "Rentals" in a NAME is not
   evidence.
6. **Ski-resort prior.** Destination ski resorts nearly always run a rental/demo shop (Mt. Rose,
   Diamond Peak were wrongly parked). Hunt /rentals or "tickets-passes-rentals" pages before
   concluding anything else.
7. **Wrong-website check.** If the on-file site looks like a different business (hotel-chain
   page, tahoe.com-style directory listing, dead domain), web-search the operator's real site
   BEFORE judging (Everline → everlineresort.com; Quiver → skiquiver.com). Record the corrected
   URL.
8. **Third-party review evidence counts.** Yelp/TripAdvisor/Google reviews that describe renting
   from the operator are citable positive evidence when the operator has no usable site
   (Moto Tahoe, Hope Valley Outdoors, Lake & Wake Adventures).
9. **Never auto-triage mechanically.** Emitting `triaged` + categories from keyword matches
   (without reading the business model) produced 200+ rows with hallucinated categories
   (charter boats tagged `snow_sports`/`off_road`). Every `triaged` verdict must come from
   reading the site — this is the rule the 2026-07 audit spent the most effort undoing.
   Canonical example: "Donut Shoppe" (a Reno skate/snow *retail* boutique) was auto-triaged
   `snow_sports` because its merch collection URL `/collections/pay-the-rent` contains "rent"
   and its pages list snowboard brands. The token "rent" in a URL or page is NOT evidence — the
   business model (retail, no rental program) is the only thing that decides.

**Positive-evidence rule (most important):** `triaged` REQUIRES a citable rentals page, a
"rent / demo / hire / lease" CTA, or rental pricing on the operator's own site (or a credible
third-party listing of *that* operator). Absence of disqualifiers is NOT confirmation. No citable
evidence → `needs_review`.

### How to read a site (do these in order)
1. Sweep header → dropdowns → body → **footer** (rentals are often only linked in the footer).
2. Hunt the rental signal: rent / rentals / demo / lease / hire / rent-to-own. Click every match.
3. Check disguised tabs: **Services, Shop, Programs, Trips, Pricing, Plan Your Visit.**
4. Capture all distinct rental destinations (bike rentals vs ski rentals are often separate pages).
5. Web fallback: if no rental section on-site, search `operator name + "rentals"/"rent"/"demo"`.
6. Demo/lease programs (e.g. paid bike demos) DO count as rental evidence.

## ⚠️ CATEGORY RECALL — the #1 accuracy priority

**A category you omit here is never extracted by Pass B.** Pass B loops only over the
`categories[]` you produce, so a missed category silently drops that entire activity's inventory —
and it is *not* recoverable downstream. Under-calling categories is the single most damaging error
in this step. So:

- **Enumerate EVERY activity the operator rents, not just the headline one.** A marina may rent
  boats *and* kayaks *and* SUPs *and* wetsuits (all `water_sports`); a shop may rent skis in winter
  *and* bikes in summer (`snow_sports` + `mountain_biking`); a powersports outfit may do ATVs
  (`off_road`) *and* snowmobiles (`snow_sports`).
- **Watch for seasonality.** If you're reading the site off-season, the other season's rentals are
  often demoted to a sub-page or a "coming soon" note — look for them; a site showing only summer
  gear today may rent winter gear too.
- **Bias toward recall.** Over-including a category costs little (Pass B just finds no inventory and
  flags it); omitting one loses real data. When in doubt, include it.
- **Use `review_categories[]` for the unsure ones.** If you see a *signal* of a second activity but
  can't confirm it rents (vs. sells/guides), put that slug in `review_categories[]` rather than
  dropping it. Pass B will verify those too. Never silently omit a plausible category.

## Category slugs (use ONLY these for `categories[]` and `review_categories[]`)

`snow_sports` · `mountain_biking` · `road_cycling` · `burning_man_bikes` · `water_sports` ·
`camping` · `camping_vehicles` · `off_road` · `motorcycles` · `rock_climbing` · `mountaineering` ·
`hunting` · `fishing` · `disc_golf` · `electric_transport`

Notes: snowmobiles/snow bikes = `snow_sports`; ATV/UTV/dirt-quad = `off_road`; street motorcycles =
`motorcycles`; jet skis/boats/kayaks/SUP = `water_sports`; e-bikes/e-scooters = `electric_transport`
(also list `mountain_biking`/`road_cycling` if applicable). Never invent a slug.

## Output schema (one object per operator)

```json
{
  "place_id": "ChIJ...",            // copy from the batch; use null + keep "name" if (none)
  "name": "Exact Operator Name",     // must match the batch entry
  "rents_gear": true,
  "categories": ["mountain_biking"], // ALL confirmed categories; [] unless status is triaged
  "review_categories": ["snow_sports"], // suspected-but-unconfirmed; [] if none. Optional.
  "rental_page_urls": ["https://.../rentals"],
  "checked_urls": ["https://...", "https://.../demo"],
  "evidence_snippet": "1-2 sentences quoting/paraphrasing the rental evidence you saw.",
  "status": "triaged",               // triaged | no_rentals | out_of_scope | needs_review
  "confidence": "high",              // high | medium | low
  "note": "optional one-liner"
}
```

The applier enforces: valid `status` and category slugs (incl. `review_categories`); `triaged` ⇒
`rents_gear:true` + ≥1 category + an evidence_snippet + ≥1 url; `no_rentals` ⇒ `rents_gear:false`;
`out_of_scope` ⇒ `rents_gear:true`. Malformed batches are rejected whole — fix and re-run.

## Examples (real verdicts)

```json
[
  {
    "place_id": "ChIJwSwnjo03mYARYgUbPLXhQS0", "name": "Worldwide Cyclery",
    "rents_gear": true, "categories": ["mountain_biking"], "review_categories": [],
    "rental_page_urls": ["https://worldwidecyclery.com/pages/demo-bike-program"],
    "checked_urls": ["https://www.worldwidecyclery.com/", "https://worldwidecyclery.com/pages/demo-bike-program"],
    "evidence_snippet": "Footer links to a Demo Bike Program; the page lists demo rates and bikes available to demo at the Reno NV location.",
    "status": "triaged", "confidence": "high",
    "note": "Paid demo program counts as rental. Treat as mountain_biking; do not invent a demo category."
  },
  {
    "place_id": "ChIJ97RGLQmQmYARjIJ3oik8M94", "name": "Tahoe Sport Fishing",
    "rents_gear": false, "categories": [], "review_categories": [],
    "rental_page_urls": [], "checked_urls": ["https://tahoesportfishing.com/", "https://tahoesportfishing.com/fishing-charters/"],
    "evidence_snippet": "Sells Lake Tahoe fishing charters; the trip includes rods, tackle, bait, life jackets — gear is provided on a guided trip, not rented.",
    "status": "no_rentals", "confidence": "high",
    "note": "Guided charter, not a gear-rental operator."
  }
]
```

## Picking a model (this task is reading-comprehension-hard)

The accuracy risk is subtle cases: rentals buried in footers/disguised tabs (false negatives),
charters/retailers that say "rent" (false positives), and **missed second/seasonal categories**
(the costliest, because Pass B can't recover them). A strong model handles these; a weaker one will
miss some. **Safe division of labor when using a cheaper model:** bias it toward `needs_review`
(confidence `low`) whenever rents-gear isn't clear, and toward `review_categories[]` whenever a
second activity isn't clearly confirmed — do NOT let it confidently *drop* a category or call an
ambiguous charter a rental. Then have a strong model (or human) review the `needs_review` pile and
all `review_categories`, and spot-check a sample. Calibrate first: run one batch, diff against the
examples above, confirm it flags rather than guesses.
