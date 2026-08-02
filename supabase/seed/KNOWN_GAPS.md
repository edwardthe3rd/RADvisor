# Known gaps — Pass B, as of 2026-08-01

Everything blocking Pass B is cleared (`isPassBReady: true`, gate open, 263 visits queued). This
is the register of what is **knowingly** imperfect, so nothing gets rediscovered as a surprise
mid-run. Ordered by consequence.

---

## A. Coverage gaps — categories never calibrated against a live site

Live-calibrated: **8 of 15**. Paper extractions from cached evidence during authoring are not the
same thing as a real visit. (Action Watersports deepened `water_sports` rather than adding a new
category — it went from one atypical operator to two, one of them representative.)

| Category | Queue | State | Can it be fixed here? |
|---|---:|---|---|
| `fishing` | 26 | **0 extractions.** The captained-charter rule has only ever *disproved* a category, never extracted one | Yes — needs a marina with a rod counter |
| `rock_climbing` | 7 | 0 extractions; Gondola's hint was disproved, so the true count is likely below 7 | Yes, but thin |
| `camping_vehicles` | 3 | 0 extractions. Vocabulary is **taxonomy-derived, not measured** — the probe returned 0% for overland/camper-van terms | Barely — 3 operators |
| `burning_man_bikes` | 0 (+1 review) | Locked only because the global gate demands it | No |
| `mountaineering` | 0 (+1 review) | Alpenglow Sports is the one candidate, via review | Only through discovery |
| `hunting` | 0 | Nothing in the queue at all | **No** |
| `disc_golf` | 0 | Nothing in the queue — Carson City's gear library is the only known operator anywhere and is not in the ledger (see §C) | Only via Pass A |

**`camping` is calibrated but barely** — all 3 live items are bear canisters from one consignment
shop. `camping.season_rating` has never been populated, so the **`snow_camp` activity has never
fired from real data**; it is the only activity rule keyed on an attribute rather than a product
class, and remains fixture-tested only.

## A2. Season timing — the largest accuracy lever still available

Today is **2026-08-02**: peak summer, deep snow off-season. That is not neutral for a run of 267
operators.

| | Count | Implication |
|---|---:|---|
| Summer-only operators | **138** | **Best possible time to visit.** Fleets are live, priced, and on the front page |
| Mixed snow + summer | 83 | Summer half is accurate now; winter half will be stale or hidden |
| Snow-only | **46** | **Worst possible time.** Sites are closed-for-season, flipped to summer, or showing last season's rate card |

The off-season rule (`00_general §6`) keeps these extractable — take the most recent published
season and state the year in `description` — and the pilot proved it works (Donner Ski Shop was
"closed for the summer" yet published a complete 2025-26 rate card). But "extractable" is not
"as accurate as it will ever be": winter inventory in August is last season's, and any shop that
rotated stock or changed pricing will be wrong until it reopens.

**Recommendation: sequence the run by season rather than by rank.** Take the 138 summer-only
operators now while their fleets are live, then the 83 mixed ones, and hold the 46 snow-only
operators until the winter sites go up (typically Oct–Nov). `--select` makes this trivial to
target. The cost of waiting is nothing; the cost of not waiting is 46 operators captured at their
least accurate, needing a full re-visit later anyway.

## B. Missing operator rows (locations that exist but have no ledger entry)

- **Clearly Tahoe — Zephyr Cove.** EC reports 5 locations; the ledger has 4 and none points at
  `clearlytahoe.com/zephyr-cove/`. That is where the entire bike fleet physically is
  (212 Elks Point Road). The corporate row is *probably* this shop but there is no address or
  lat/lng in the ledger to confirm.
- **Action Watersports — Round Hill Pines Marina.** A fourth marina with its own published (and
  genuinely different) rate card. Ledger has Lakeside, Timber Cove, and Camp Richardson only.

Both need a Pass A row with a real `place_id` — `pass_b_apply.mjs` keys on it.

## C. Pass A recall gap — gear libraries are structurally invisible

`GEAR_LIBRARY_FINDING_2026-08-01.md`. Carson City's municipal Outdoor Gear Library rents four
categories at published rates and **is not in the ledger** — never rejected, never found. A Parks
& Rec department is a `local_government_office` POI and will not surface for "kayak rental"
category searches.

Generalises to municipal gear libraries, university outdoor programs, library-of-things branches,
and ranger-station counters. **Every region will miss them the same way**, which bears directly on
the portability goal. Fix belongs in `quadtree_sweep_queries.mjs` (search the institution, not the
gear), not in Pass B.

## D. Unresolved duplicates and status conflicts

- **Tahoe XC** — two rows; one has `tahoexc.org` but no `place_id`, the other a `place_id` but no
  website. Keyable by neither domain nor Google ID, so `dedup_operators.mjs` cannot touch it.
- **Clearly Tahoe** — 4 rows across 3 paths on `clearlytahoe.com` plus `clearlytahoerentals.com`
  (Sand Harbor). The path-based ones are correct under §9; the fourth domain may be another arm
  like Bike Lake Tahoe was.
- **Action Watersports at Timber Cove** — the site says the location is closed while the same
  pages still publish a complete rate card. Parked as `needs_review`, not demoted.
- **Tahoe Paradise Boat Rentals** — merged on EC's verdict, which **reversed** the 2026-07-05
  audit's finding that it was a distinct same-named captained 82ft-yacht operation. Recorded in
  the row note; revisit if that audit was right.

## E. Suspect category hints (do not trust without verification)

- **`snow_sports` on the Clearly Tahoe rows** is very likely keyword noise from *"Snowflake
  Winter"* / *"Polar Paddle"* **kayak** tours — structurally the same error as the `jet ski` →
  `ski` bug that Phase 0 removed 68 rows for.
- **Cycling hints on non-Zephyr-Cove Clearly Tahoe locations** are inherited from the shared
  domain; the live site places bikes at Zephyr Cove only.

## F. Taxonomy items with nowhere to go

- **Snowmaker** (Carson City, $30/$48/$96) — no `gear_type` anywhere in the taxonomy.
- Resolved this session and listed only so the pattern is visible: `surrey`, `trike`, `accessory`,
  `autocycle`, `moped_scooter`, `sup_bike`, `sup_e_scooter`, `price_weekend`, `price_monthly`,
  `price_season`. **Ten vocabulary gaps found by visiting ~12 operators.** Expect more across 263.

## G. Schema shapes still lossy

- **Duration blocks.** Battle Born sells 2-hour and 4-hour blocks; Rolling Freedom hides all rates
  behind a booking widget. `price_weekend` and `price_monthly` closed two of four observed shapes;
  hour-blocks remain unmodelled. Revisit `price_block` + `block_hours` if it recurs.
- **Per-location price variance is real.** Action Watersports charges $5/hr less at Round Hill
  Pines than at Lakeside, and CV Sports' four counters were identical — both patterns occur, so
  the "compare two location pages before assuming" rule in `00_general §6` must actually be
  followed rather than short-cut.
- **`needs_review` on a pre-tagged category is invisible in the operator row**
  (`pass_b_apply.mjs:270`) — surfaced only in the results log and `pass_b_report`. Defensible under
  recall-first, but such an operator can be marked *done* while still unresolved.

## H. Human actions outstanding

Six phone calls, all with numbers in their row notes: Doing It Big Rentals, Love Your Life
BackCountry, Paddle To You, Tallac Boat Rentals, ASC Training Center, Galena Sports.

Plus the one-off `git rm --cached` for the scrape caches (`PASS_B_PREP_PLAN.md`).
