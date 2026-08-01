# Phase 0 — Category scrub report (2026-07-30)

**Done.** 86 bogus category claims removed from 80 operators, zero browsing, no operator left
invalid. Queue: **714 → 628 (operator, category) pairs**; `snow_sports` **206 → 138**.

| | before | after |
|---|---|---|
| triaged operators | 276 | 276 (unchanged — no operator was emptied) |
| total pairs | 714 | 628 |
| snow_sports | 206 | 138 |
| water_sports | 154 | 149 |
| road_cycling | 92 | 90 |
| mountain_biking | 82 | 79 |
| off_road | 36 | 30 |

Artifacts: `scrub_verdicts_2026-07-30.json` (the applied verdicts) ·
`category_scrub_digest.mjs` (new review tool) · ledger in `sweep_pass_a_triage.json`
(`categoryScrub.applied`, 86 entries) · pre-scrub backup kept in the session scratchpad.

## The headline finding: "ski" inside "jet ski" / "water ski"

**68 of the 86 removals were one bug.** Auto-triage matched the substring *ski* inside **jet
ski**, **water ski**, **wake ski**, and the phrase **"Jet Ski Rentals"**, so Tahoe boat rental
companies, marinas, and paddle shops claimed `snow_sports` — North Tahoe Watersports (×3),
Jet Ski Rental Lake Tahoe, Camp Richardson, Tahoe Sports, Obexer's, SWA, Sunnyside Marina,
LS Boat Rentals (×2), Rent A Boat ("Tube, Wakeboard, Skis and Wetsuits"), and ~50 more.

This was invisible to the first-pass review aid, which counted any "ski" as a snow signal and
therefore *recommended keeping* snow on ~15 boat companies. The digest tool was rebuilt with a
**two-tier signal** — STRONG (snowboard/snowshoe/snowmobile/splitboard/nordic/avalanche/ski
boots…) vs WEAK (bare "ski", excluded after jet/water/wake) — which flipped those to removals.

**Verification:** all 68 snow removals were re-checked mechanically against an unambiguous
snow-gear term list. **0 of 68** contained any such term — none of them was a real snow operator.

The trap is now documented in `instructions/extraction/snow_sports.md` §9 so Pass B extraction
never re-introduces it. (Counter-example preserved: Zephyr Cove genuinely rents snowmobiles —
confirm on the gear term, never on the word "ski".)

## Other removal groups

- **Bike/e-bike shops carrying snow_sports** (10): Flume Trail Bikes, High Sierra Cycling,
  Pedego Reno, Pine Nut Ebike, Sierra Cyclesmith, Tahoe Electric Bike Rental, Truckee River
  Bikes, Trek Reno, Dirty Wheel Tahoe, Olympic Bike Shop (also water_sports).
- **Snow operators carrying summer categories** (7 removals): Ski Butlers ×2 (water +
  mountain_biking), Tahoe Dave's ×3 (off_road), Gravity Haus (water), Sierra Ski & Cycle (fishing).
- **Motorized-snow vs off-road/bicycle confusion**: Tahoe Sled School (off_road — its fleet is
  Ski-Doo/Polaris *mountain sleds*), Tahoe Snowbike Rental (off_road + road_cycling — Timbersleds),
  Tahoe Dirt Bikes (road_cycling — "bike" ≠ bicycle).
- **Business-type mismatches**: Reno Fly Shop, Blue Granite Climbing Gym, Tennis Nation, Reno
  Hexayurt, Sierra Diving Center, Wetsuit Outlet, PlumpJack Inn, Trout Creek Outfitters,
  Paradise Pro Shop (bowling alley), Orucase (bike-case retailer), Synergy Wetsuits, Marine
  Specialties.

## Deliberately NOT scrubbed (left for Pass B step 0)

Because Pass B is now **operator-major** (one site visit covers all of an operator's
categories), the scrub no longer saves visits — only bogus extraction attempts. So the review
was deliberately biased to **clear removals only**; everything ambiguous keeps its category and
gets verified live in the single visit it was going to get anyway. Left alone:

- Operators whose *only* category is bogus — removing it would empty the row, which the applier
  correctly refuses. **Rentools, Truckee Rents, Reno-Tahoe Restroom Trailers** are tool/equipment
  rental businesses that will exit via Pass B `category_not_found` + `operator_status:
  out_of_scope`. That path exists precisely for them.
- Thin-fetch rows (≤1 cached page) — a thin snapshot cannot prove absence.
- Retail/consignment shops with unclear rental programs (Gear Hut, Tahoe Sports Ltd, REI,
  evo, The BackCountry): plausible renters, unconfirmed categories → Pass B decides.

## Carry-forward for the next region

1. Run the scrub **before** authoring category files — it changes which categories still matter.
2. Use `category_scrub_digest.mjs` rather than raw page dumps: 34K tokens vs ~320K for the same
   188 operators, and it surfaces cross-category contamination that raw reading hides.
3. Watch for the same substring class elsewhere when new categories come online — e.g. "bike"
   in *dirt bike*/*snowbike* (already bitten us), "board" in *paddleboard* vs *snowboard*,
   "trail" in *trailer*. A two-tier strong/weak signal is the general defense.
