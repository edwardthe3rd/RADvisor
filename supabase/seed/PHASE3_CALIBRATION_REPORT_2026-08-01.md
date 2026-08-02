# Phase 3 calibration — findings (2026-08-01)

Run after all 15 vocabularies locked, against a **deliberately selected** diverse wave rather than
rank order (which was dominated by single-category `water_sports` shops and would have exercised
three vocabularies at most). Required a new `--select <place_id,...>` flag on `pass_b_batch.mjs`,
which also makes the wave reproducible.

**6 operators extracted, 41 items, 9 `category_not_found`.** Live-calibrated coverage went from
**4/15 to 8/15**: `snow_sports`, `water_sports`, `mountain_biking`, `road_cycling`,
`electric_transport`, `off_road`, `motorcycles`, `camping`.

| Operator | Role in the wave | Outcome |
|---|---|---|
| Battle Born Powersports | pure `off_road` | 3 items; self-guided UTV fleet |
| Rolling Freedom Motorcycles | only `motorcycles` operator in the queue | 11 items across 3 categories; `road_cycling` disproved |
| Lake Tahoe Luxury Boat Rentals | bareboat vs captained charter | 11 items; `fishing` disproved as charter-only |
| Anderson's Bicycle Rental | full-service bike shop | 9 items across 3 cycling categories |
| Gondola Ski + Sports | claimed `rock_climbing` + `off_road` | 4 items; **both** hints disproved |
| Gear Hut | claimed 6 categories | 3 items; **5 of 6 hints disproved** |

---

## The attribute-usage diff

This is the half of Phase 3 that had never been run. Declared vocabulary versus what live
operators actually populate:

| Category | Items | Attributes never populated | Verdict |
|---|---:|---|---|
| `snow_sports` | 68 | `adjustable`, `snowboard_binding_interface`, `crampon_binding` | **Sample is biased**, not conclusive — all 8 were town rental shops; no backcountry/AT specialist was visited |
| `water_sports` | 11 | `is_clear`, `wetsuit_thickness_mm`, `is_kids` | Sample too small; one delivered-fleet operator only |
| `mountain_biking` | 2 | `wheel_size` | Sample too small |
| `road_cycling` | 7 | — (all six used) | **Healthy** |
| `electric_transport` | 6 | `wheel_size`, `is_kids` | `assist_mode` at 33% — close to its 36% predicted density |
| `off_road` | 4 | `is_kids` | **`seat_count` at 75%** — fully validated |
| `motorcycles` | 8 | — | All three used |
| `camping` | 3 | `capacity_people`, `season_rating`, `is_kids` | All 3 items are bear canisters — see below |

**No vocabulary was pruned.** Every "never used" row above sits on a sample of 2–11 items, or (for
snow) on a structurally biased one. That is the pilot's F7 lesson applied: a sample that cannot
support a judgment does not get to make one. What each row *does* buy is a precise target for the
next wave.

### Strongly validated

- **`off_road.seat_count` (75%)** — Battle Born's entire fleet is literally "UTV 2-Seater /
  4-Seater / 6-Seater". The prep plan's proposed `engine_cc` (7% density) would have been an empty
  facet.
- **`water_sports.operation_mode` (73%)** — the bareboat/captained axis is real and load-bearing;
  Lake Tahoe Luxury Boat Rentals runs bareboat rentals *and* Thunder Cloud + fishing charters off
  one site.
- **`suspension` (71–100% in cycling)** — Anderson's publishes "HARD TAIL MOUNTAIN BIKES" as a
  product name.
- **`price_hourly` and `price_half_day` are genuinely first-class in cycling**, exactly as
  `cycling_core §6` predicted from a 27%/27% signal: Anderson's publishes both for every item.
- **`price_weekly` got its first real use** — Gear Hut's $15/week bear canister.

### The one untested rule

`camping.season_rating` was never populated, so the **`snow_camp` activity has never fired from
live data**. It is the only activity rule keyed on an attribute rather than a product class, and it
remains fixture-tested only. A 4-season-tent renter is needed to close it.

---

## Finding 1 — "tour" is not evidence of a guided product

`off_road.md §8` calls guided tours the dominant trap (63% of powersports operators mention
tours). Battle Born shows it cuts **both ways**: its pages headline "Half Day or Full Day
**Tours**" while the FAQ states plainly *"We are currently offering a self guided experience."*
A genuine rental.

The word is marketing vocabulary, not a scope signal, and the answer often lives only in an FAQ or
terms page. Reading the product page alone would have wrongly dropped this operator. Added to
`off_road.md §8` as the worked example.

## Finding 2 — consignment and retail are the biggest false-positive source

**Gear Hut had 5 of its 6 Pass A categories disproved.** It is a used-gear *consignment* shop —
"solely a consignment shop and does not buy outright" — that sells boats, bikes, ski gear and
camping equipment on behalf of their owners. Every one of those reads as rental inventory in page
text.

Its one real rental is **bear canisters**, which is precisely what `camping.md §6` anticipated:
*"do not skip an operator whose entire fleet is bear canisters."* That rule was written from a 27%
density signal and landed exactly on a real operator.

Gondola Ski + Sports independently lost both `rock_climbing` and `off_road` to keyword noise. Of
15 results in this wave, **9 were `category_not_found`** — the disprove-bad-hints path is doing at
least as much work as extraction, and the cross-result guard correctly kept both operators
`triaged` rather than emptying them.

## Finding 3 — `price_multi_day` semantics confirmed correct

Lake Tahoe Luxury Boat Rentals publishes a table headed **"DAILY RATES: 2-4 Days $1,950 | 5-6 Days
$1,850 | 7+ Days $1,750"** — explicit *per-day* rates that step down with duration, with a 2-day
minimum and no single-day option.

This is exactly the shape `00_general §7` was rewritten for after the pilot: `price_multi_day` is a
per-day rate, `price_full_day` is null when no single-day product exists, and the tier table goes in
`description`. First live confirmation that the rewritten rule maps cleanly onto a real rate card.

## Finding 4 — two more vocabulary gaps, both fixed

- **`trike`** — Anderson's rents "ADULT TRIKES — 3-Wheel Bike, $36 half-day / $12 per hour". Upright
  adult three-wheelers are a real accessibility-driven rental product. Added to `road_cycling`.
- **`wheel_size: "16"`** — Anderson's kids bikes come in 16"/20"/24"; the enum started at 20.

Both join `surrey` and `accessory` in the `categories.ts` reconciliation list (`road_cycling.md §6`).

## Finding 5 — the decimal-slip warning has a false-positive floor

Gear Hut's bear canisters rent at **$3/night**, tripping "outside the typical $5–2000 range" on all
three items. The guard is warn-only so nothing was blocked, but cheap accessory rentals (canisters,
poles, locks, chalk bags) legitimately sit under $5. Consider lowering the floor to ~$2, or
exempting accessory-class gear types, if the noise becomes routine.

## Finding 6 — duration blocks, third occurrence

Gear Hut prices **$3/night, $15/week, $35/month**. The monthly rate has no tier. Battle Born sells
2-hour and 4-hour blocks; Rolling Freedom hides rates behind a booking widget entirely; the pilot
found four different multi-day *rules*.

That is now **three independent waves** hitting the same wall, which was the threshold this report
previously set for acting. **Recommend adding `price_monthly`** (cheap, and directly evidenced) and
revisiting a `price_block` + `block_hours` pair only if hour-blocks recur. Not done here — it is a
schema change and EC vetoed nothing yet, but it is the clearest remaining data-loss point.

## Finding 7 — motorcycle pricing is systematically unpublished

All 8 `motorcycles` items carry **zero** price tiers. Rolling Freedom puts every rate behind its
booking widget. If that generalises, the category will be structurally price-poor and the
minimum-viable-item pattern is the norm rather than the exception there.

---

## Remaining gaps

**Cannot be calibrated from this queue at all:**

- `hunting` and `disc_golf` — zero operators, confirmed or review. Nothing to visit.
- `burning_man_bikes` — one review-only row ("Playa E-bike Rentals").
- `mountaineering` — one review-only row (**Alpenglow Sports**), which was selected for this wave
  but not reached. Visiting it would likely resolve `mountaineering` by same-visit discovery and
  take coverage to 9/15.

**Realistically achievable ceiling is 13/15**; `hunting` and `disc_golf` stay paper-only until a
region that has them. That should be written into the acceptance criterion rather than left looking
permanently unfinished.

**Highest-value next visits**, in order:

1. **Alpenglow Sports** — backcountry specialist. Would resolve `mountaineering`, and is the one
   operator likely to populate snow's three unused technical attributes (`crampon_binding` etc.),
   settling whether they are dead or merely unsampled.
2. **A 4-season-tent renter** — the only way to fire `snow_camp` from live data.
3. **`camping_vehicles` and `rock_climbing`** — still zero live items; both vocabularies remain
   taxonomy-derived guesses.
4. **A marina with a real rod counter** — to see `fishing` extract rather than disprove.

```
node supabase/seed/pass_b_batch.mjs 4 --select ChIJfwaAbXZ9mYARDUP7ClnaRuk,ChIJb7h4oHaQmYAR3aCog1QfgtE,ChIJ87kKrIuFmYARPZsnLzFwDFs,ChIJM967AtuRmYARFN3Q1kk8TMQ
```
