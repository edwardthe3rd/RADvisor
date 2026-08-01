# Pass B pilot calibration — findings (2026-08-01)

8 snow-only operators, one live visit each, applied with `--pilot` (all 8 stay queued for a full
re-visit). Result: **6 extracted / 68 items / 2 needs_review**, median 13 items per operator.

Purpose was format validation before authoring 10 more category files — not inventory coverage.
Everything below is evidence from real sites, not hypothesis.

| Operator | Why it was useful |
|---|---|
| Donner Ski Shop | Full rate card; retail-vs-rental on one page; kayak/SUP discovery in an unlocked category |
| CV Sports | 4 locations; consecutive-day rate table with a free 4th day; package vs gear-only tiers |
| The Village Board Shop | Clean 3-tier package card; per-day discount rule |
| Bobo's | Season leases; mixed in-scope/out-of-scope business (patio furniture) |
| Quiver Sports | Two-part tariff ($79/season + $39/day, or $599 unlimited); real brand/model/size data |
| Totally Board | Rentals confirmed, **zero** published pricing |
| ASC Training Center | Site rebuilt; operator-confirmed rentals no longer appear anywhere |
| Galena Sports | No first-party site at all |

---

## The headline number

**Price-tier coverage across 68 items: `price_full_day` 61 (90%). Every other price field: zero.**
No `price_hourly`, `price_half_day`, `price_multi_day`, `price_weekly`, or `deposit` on any item.

That is not laziness in extraction — it is what the sites publish. Breakdown below.

---

## F1 — `price_multi_day` is unusable as specified

All four operators with multi-day pricing express it as a **rule**, never a flat rate, and no two
use the same shape:

| Operator | Multi-day form |
|---|---|
| Donner Ski Shop | daily rate x number of days (no discount at all) |
| CV Sports | consecutive-day table, **4th day free**, 5 days = 4x day rate |
| The Village Board Shop | **$5 off per day** after 3 days |
| Bobo's | **20% off** at 5+ days |

The field is also ambiguous on its face: is it the *total* for a multi-day rental or the *per-day*
rate within one? Nothing in §12 says. **Fix: define it as the discounted per-day rate when one is
published, else null, and require the rule verbatim in `description`.** Same treatment for
`price_weekly`.

`price_half_day` and `price_hourly` being empty is correct and expected — snow shops sell full
days. Keep both; `water_sports` will need them (half-day is the boat anchor tier, PWC is hourly).

## F2 — There is no price field for a season lease *(the one schema change I recommend)*

`rental_type: "season_lease"` is in the bounded vocabulary and `offers_season_lease` is an
operator flag, but no price tier can hold a per-season price. Four items had to be filed with
**every price null** and the real number buried in prose:

- Bobo's — adult $159/season, kids $99 and $139, poles +$20
- Donner — season rentals offered, price only inside a downloadable PDF
- Quiver — $599/season unlimited

**5 of the 7 "no price on any tier" warnings the applier raised trace to exactly this gap.**
Season leases appeared on 3 of 8 pilot operators (38%) — this is not an edge case in snow.

Recommend adding `price_season` to `PRICE_FIELDS` in `pass_b_apply.mjs` and to the §12 contract.
It is a real, comparable, filterable number. Flagging it explicitly because it is the only
finding that changes the item *shape* rather than the docs, and it will carry into the eventual
Supabase equipment upsert.

## F3 — Two-part tariffs have no representation

Quiver charges an **access fee plus a usage fee**: $79/season membership *and* $39/day. Recorded
the $39 as `price_full_day` and described the membership. Low frequency, so documentation is
enough — but §12 should state the rule so it is handled consistently rather than invented twice.

## F4 — "X or Y" price lines are pervasive and must expand *(main granularity answer)*

Rate cards routinely price two or three different products on one line:

- Donner: `Skis or board only 30.00`, `Snowshoes or Ice skates 20.00`,
  `Boots only (ski-board-cross country) 20.00`
- Bobo's: `Daily rentals ski and snowboard $35 a day`
- CV Sports: three "ski / board" package tiers

Because `subcategory` is single-valued, each line **must** expand to one item per subcategory —
otherwise a user filtering "snowboard rentals" silently misses half the market. This is the
single largest driver of item count (it roughly doubles Donner and CV Sports) and it is the
answer to "are packages over-decomposing?": **no — the expansion is required, and 13 items is a
normal, honest size for a full-service shop.**

## F5 — Retail sits next to rental on the same page

Donner lists `Sunscreen, Sleds and snow play toys` under a **Retail** heading, directly beneath
the rental list. Extracting those would have invented rental inventory *and* produced a bogus
`sled` activity on the operator. Tuning, waxing, and Sno-Park permits are services, likewise not
inventory. Needs to be an explicit snow trap.

## F6 — The attribute set is healthy where it was exercised

| Attribute | Density | Verdict |
|---|---|---|
| `gear_type` | 100% | core |
| `rental_type` | 100% | core; all three values used (rental 60, season_lease 4, demo 4) |
| `quality_grade` | 72% | **maps cleanly** to published tiers (Package One/Two/Three, basic/high-performance) |
| `is_kids` | 10% | low but real and browse-relevant |

`quality_grade` and `rental_type` are correctly **orthogonal** — Village Board's demo boards are
both `performance` grade and `demo` type, and that fell out naturally.

## F7 — Three attributes and seven subcategories went unused — this is a SAMPLING artifact

Never populated: `adjustable`, `snowboard_binding_interface`, `crampon_binding`. Never seen:
`backcountry_ski`, `telemark_ski`, `splitboard`, `sled`, `snowmobile`, `timbersled`,
`avalanche_safety`.

**Do not prune any of these on this evidence.** `--pilot` only emits operators whose every hint
is already locked, which by construction means snow-only town rental shops. No backcountry
specialist, powersports outfit, or resort was eligible. The §11 density bar cannot be applied to
a sample that structurally excludes the operators who would populate these fields.

## F8 — Minimum viable item, for a category with no published pricing

Totally Board confirms snowboard rentals and demos in prose and publishes **no rates at all**
(only repair/tune pricing, which is service work). The right shape is one item per confirmed
subcategory with null prices and a description saying pricing is not published. The applier warns
but accepts, which is the correct behavior — the operator still surfaces in browse.

## F9 — Multi-location operators may share one rate card *(hypothesis, disproved cheaply)*

CV Sports runs four Stateline counters. I expected per-location pricing and a missing location
dimension in the schema. Comparing Caesars Republic against Bally's: **rate cards are byte-for-byte
identical.** One item set covers the operator. Rule worth stating: compare at least two location
pages before assuming variance — and only then consider it a gap.

## F10 — "Operator-confirmed but no longer on the site"

ASC Training Center rebuilt its site since the Pass A crawl. The Nordic Center page now covers
trails, hours, night skiing and season passes with **no gear rental anywhere**; the FAQ addresses
waxing, sledding, dogs and race days but never rentals. That directly contradicts EC's 2026-07-05
review ("rents if you also pay for their facility", operator-confirmed).

Human-verified fact vs current-site absence is a **conflict**, not a disproved hint →
`needs_review` with an ACTION, never `category_not_found`. Same shape as Galena Sports, where
rentals are not in doubt but there is no first-party site to extract from.

## F11 — `needs_review` on a *pre-tagged* category is invisible in the operator row

`pass_b_apply.mjs:270` only adds to `review_categories[]` when the category is **not already**
in `categories[]`. So ASC keeps `categories: ["snow_sports"]` and looks fully confirmed; the
unresolved state lives only in the results log and the `pass_b_report` unresolved list.

Defensible under recall-first (an unresolved question should not silently drop an operator out
of browse), and the report does surface it — but note that in the full run such an operator is
marked *done* while still being unresolved. Recording it as known behavior, not fixing it.

## F12 — Doc/code drift in the runbook schema example

`PRICE_FIELDS` in the applier has six entries (`price_hourly`, `price_half_day`, `price_full_day`,
`price_multi_day`, `price_weekly`, `deposit`); the runbook's JSON example shows four and omits
`price_hourly` entirely. Extractors working from the example would never emit an hourly price —
which matters for PWC and other hourly-dominant water rentals.

---

## What changes before Steps 1-6

1. §12 — define `price_multi_day` / `price_weekly` semantics; require the discount rule in
   `description` (F1).
2. §12 + `pass_b_apply.mjs` — add `price_season` (F2). **The one shape change; EC may veto.**
3. §12 — two-part tariff rule (F3).
4. §12 — the "X or Y" line expansion rule, with the Donner examples (F4).
5. §12 — minimum viable item for a confirmed-but-unpriced category (F8).
6. §12 / runbook — compare two location pages before assuming price variance (F9).
7. `snow_sports.md` traps — retail sleds/snow toys next to rentals; services are not inventory (F5).
8. `PASS_B_RUNBOOK.md` — fix the schema example to show all six price fields (F12).

Not changing: the attribute set, the subcategory list, `quality_grade`, or anything else F7
touches — the sample cannot support those judgments.
