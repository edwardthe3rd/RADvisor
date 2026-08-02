# Phase 3 calibration — findings (2026-08-01)

Run immediately after all 15 vocabularies locked, against a **deliberately selected** diverse wave
rather than rank order (which was dominated by single-category `water_sports` shops and would have
exercised three vocabularies at most). Required a new `--select <place_id,...>` flag on
`pass_b_batch.mjs`, which also makes the wave reproducible.

**Selected 8** covering 12 of 15 vocabularies: Tahoe Sports Ltd. (7 categories incl.
`camping_vehicles`), Gondola Ski + Sports (`rock_climbing`), Gear Hut (`camping`), Battle Born
Powersports (`off_road`), Rolling Freedom (`motorcycles` — the only such operator in the queue),
Alpenglow Sports (demo-only), Camp Richardson Marina, Palisades Tahoe.

**Completed 2 in depth** — Battle Born and Rolling Freedom, chosen first because `off_road` and
`motorcycles` were the newest untested vocabularies. **14 items, 4 extracted, 1
category_not_found.** The remaining six stay queued and unvisited.

---

## What the new vocabularies got right

- **`seat_count` is exactly the right `off_road` key.** Battle Born's entire fleet is organised by
  it — the nav is literally "UTV 2-Seater / 4-Seater / 6-Seater". The prep plan's proposed
  `engine_cc` (7% density) would have been an empty facet; seat count is the whole product line.
- **Every `motorcycles.md §7` pricing prediction held.** Rolling Freedom publishes a 400-mile
  daily cap with unlimited mileage at 3+ days, required insurance at $35.00/day, and an M-endorsement
  gate — mileage caps, insurance-as-addon, and licence-as-booking-condition all landed where the
  file said they would.
- **The `deposit` range exemption was correct.** Battle Born holds **$3,000 per machine**, which
  would have tripped the $5–2000 decimal-slip warning had `deposit` not been exempted.
- **The plates-not-terrain rule resolved a real case.** A KTM 890 Adventure R (plated) went to
  `motorcycles`/`adventure_moto` and a KTM 500 EXC-F (unplated) to `off_road`/`dirt_bike`, from the
  same operator, same storefront.
- **The cross-result combined-state guard did its job on a live operator.** Rolling Freedom's
  `road_cycling` hint was disproved while three other categories were confirmed in the same visit;
  the operator correctly stayed `triaged` rather than demanding an `operator_status`.

## Finding 1 — "tour" is not evidence of a guided product

`off_road.md §8` calls guided tours the dominant trap (63% of powersports operators mention
tours). Battle Born shows the trap cuts **both ways**: its pages say "Half Day or Full Day
**Tours**" while the FAQ states plainly *"We are currently offering a self guided experience."*
It is a genuine rental.

**The word is marketing vocabulary, not a scope signal.** The test remains the take-away rule —
does the customer operate the machine unaccompanied — and it is often answered only in an FAQ or
terms page, not on the product page. Reading the product page alone would have wrongly dropped
this operator. No file change needed; `off_road.md §8` already frames the test correctly, and this
is now cited there as the worked example.

## Finding 2 — `fat_ebike` meant the wrong thing *(design fix applied)*

`electric_transport`'s `fat_ebike` gear_type fires the winter `fat_bike` activity. Rolling Freedom
rents Juiced Scorpion and Scrambler moto-style e-bikes — **fat tyres, zero winter intent**. Filing
them by tyre width would have pushed summer cruisers into winter browse.

Fixed in `electric_transport.md §4`: `fat_ebike` means **winter-capable**, not "has fat tyres",
matching how `categories.ts` scopes the `fat_bike` subcategory to fat-tire *snow bikes*. Default to
`gear_type: "ebike"` and describe the tyres. Both bikes were extracted that way.

## Finding 3 — licence-free road vehicles have no home *(taxonomy proposal logged)*

Rolling Freedom's headline products cannot be filed anywhere:

| Product | Why nothing fits |
|---|---|
| **Polaris Slingshot** (3+ units) | Three-wheeled autocycle. Street-legal so not `off_road`; not a motorcycle, and explicitly advertised as needing **no specialised licence** — which is what separates it from `street_moto` |
| **Honda Ruckus mopeds** | Sit-down gas 50cc. `e_scooter` is the electric standing kind |
| **Can-Am Spyder** | Three-wheeled but licensed and sold under motorcycle rentals — filed `street_moto` with a note; defensible, imprecise |

These are real, priced, take-away rentals being dropped. Logged as an open proposal in
`00_general §11` rather than invented unilaterally (that section's process, working as designed).
Likely resolution: a `street_moto` sibling pair (`autocycle` / `moped_scooter`) or a new
licence-free-road-vehicle category. **Worth deciding before a full Tahoe run** — Slingshot rental
is a visible local product and this operator is not the only one.

## Finding 4 — published duration blocks still don't map to price tiers

Battle Born rentals are sold in ~2-hour and ~4-hour blocks with only a fleet-wide "STARTING AT
$299" published, and Rolling Freedom's rates sit entirely behind a booking widget. Neither could
assert a tier honestly, so both used the pilot's minimum-viable-item pattern (null prices, terms in
`description`, `deposit` recorded where known).

This is the same shape as the pilot's F1 multi-day finding: **operators publish durations and rules
the six tiers do not model.** Two independent waves have now hit it. It is not worth another schema
field yet — but if a third wave hits it, a `price_block` + `block_hours` pair should be considered
rather than continuing to lose the numbers to prose.

## Not concluded

Six of the eight selected operators remain unvisited, so `camping`, `camping_vehicles`,
`rock_climbing`, and the cycling cluster have **not** been calibrated against a live site — only
against paper extractions from cached evidence during authoring. Those four should be the first
wave when Phase 4 begins, and `--select` makes that easy to target:

```
node supabase/seed/pass_b_batch.mjs 6 --select ChIJb7h4oHaQmYAR3aCog1QfgtE,ChIJy9ppqHeQmYARudCSM07YImA,ChIJOZet7oxBmYARFkEseucIW5Q,ChIJfwaAbXZ9mYARDUP7ClnaRuk,ChIJ87kKrIuFmYARPZsnLzFwDFs,ChIJN83rWezZm4ARtHEgfKt-QPs
```
