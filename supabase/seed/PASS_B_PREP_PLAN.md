# Pass B Preparation Plan — operator-at-once extraction

Goal: finish everything needed to run Pass B **once per operator** (single site visit, all
categories extracted together), maximizing accuracy (bounded vocabularies, validating applier,
calibration before scale) and efficiency (shared vocab files, one visit per operator: 276 visits,
not a workload measured in category pairs).

Current state (2026-08-01): 276 triaged operators. Phase 0 reduced the hint ledger from 714 to
628 (operator,category) pairs, but those pair counts are **authoring-priority signals only**;
the real Pass B workload remains 276 operator visits. The operator-major emitter/applier,
global vocabulary gate, combined-state guard, fixture harness, and runbook are implemented.
Only `snow_sports` is locked in `CATEGORY_VOCAB`, so the gate remains closed until Phase 1.

**"Prep complete" acceptance criteria**
- [x] Phase 0 scrub stopped after the verified 86 removals; no further scrubbing.
- [x] EC decision recorded 2026-08-01: **no `sledding` category** — ski bikes stay `snow_sports`
      subcategory `sled` + gear_type `ski_bike`; sledding remains a facet via the `sled`
      subcategory/activity. Recorded in `00_general §11`; snow_sports vocabulary is unblocked.
- [x] Pilot calibration wave run 2026-08-01 (8 operators, 68 items) — see
      `PILOT_CALIBRATION_REPORT_2026-08-01.md`. Produced one schema change (`price_season`) and
      six contract rules, all landed before category authoring began.
- [x] **All 15 in-scope category files locked 2026-08-01**; enums in `CATEGORY_VOCAB`;
      `CATEGORY_ACTIVITIES` complete; 40 applier fixtures green. `isPassBReady()` returns true and
      the global vocabulary gate is **OPEN**.
- [x] Operator-major retool done (global gate + inclusive tags + cross-result guard) with
      isolated fixtures green.
- [~] Calibration wave **partially done 2026-08-01** — see
      `PHASE3_CALIBRATION_REPORT_2026-08-01.md`. 8 operators selected (new `--select` flag), 2
      extracted in depth (`off_road`, `motorcycles` — the newest vocabularies). Produced one design
      fix (`fat_ebike` means winter-capable, not fat-tyred) and one taxonomy proposal
      (Slingshot / moped / autocycle have no home — `00_general §11`).
      **Outstanding: 6 selected operators still unvisited**, so `camping`, `camping_vehicles`,
      `rock_climbing` and the cycling cluster are calibrated only on paper, never against a live
      site. Run them as the first Phase 4 wave — the report carries the exact `--select` command.
- [x] PASS_B_RUNBOOK rewritten for operator-major flow.
- [ ] EC commits the app repo and `instructions/` repo separately at each phase end.

---

## Phase 0 — Scrub the queue ✅ DONE 2026-07-30 (see `PHASE0_SCRUB_REPORT_2026-07-30.md`)

**Result: 714 → 628 pairs; snow_sports 206 → 138.** 86 removals across 80 operators, zero
browsing, no operator emptied. 68 of the 86 were one systematic bug — the substring "ski"
inside *jet ski* / *water ski* / "Jet Ski Rentals" made boat operators claim snow_sports; all
68 verified to contain no real snow-gear term. New reusable tool: `category_scrub_digest.mjs`
(two-tier strong/weak signal; 34K tokens vs ~320K of raw page dumps). Trap documented in
`snow_sports.md` §9. Ambiguous cases were deliberately left for Pass B step 0, since
operator-major Pass B visits each site once regardless.

### Retrospective — why Phase 0 stops here

The scrub's original workload claim was wrong once operator-major Pass B became the design:
fewer tag pairs do not mean fewer browser visits. Its durable value was discovering the
`ski` substring failure inside `jet ski` / `water ski` and removing 86 category claims that
were individually verified wrong. It also made the relative category sizes useful for choosing
which vocabularies to author first, but **628 pairs is not the Pass B workload**.

There will be **no further category scrubbing** and the 86 removals will not be restored. Tags
are now inclusive hints rather than gates: if a removed category is actually present, Pass B
can validate and re-add it during the single operator visit.

<details><summary>Original Phase 0 plan (for reference / next region)</summary>

The scrub reads only cached Pass A evidence, so it is the cheapest token spend in the pipeline
and it changes the shape of every later phase (which categories still matter, which operators
are multi-category, who belongs in calibration). Do not pick calibration operators or finalize
cluster priorities until this lands.

1. Run the emitter across ALL inflated slugs at once (operator-major — each operator appears
   once with every suspect category):
   `node supabase/seed/category_scrub_batch.mjs 25 --category snow_sports --category water_sports --category road_cycling --category electric_transport --category mountain_biking --category off_road --category fishing --out supabase/seed/scrub_inbox.txt`
   (fishing included — 31 pairs, many keyword-derived on marinas/charters; repeat batches until
   0 remaining; ~170 auto-triaged operators total)
2. Strong model reviews each batch against the emitter's rules (recall-safe: remove only
   absurd-on-its-face; thin-fetch rows → review, never remove; a scrub may never empty a row).
3. Apply with `category_scrub_apply.mjs` (dry-run first, every batch).
4. Re-measure: pairs per category, multi-category distribution. Expected: 714 → ~350–450.
   Historical only; low hint counts no longer remove a category from Phase 1 because tags are
   not trusted for recall.

</details>

**Phase 1 authoring priority, re-measured after the scrub** (supersedes the pre-scrub order
below): water_sports **149** · road_cycling **90** · electric_transport **85** ·
mountain_biking **79** · off_road **30** · camping **7** · rock_climbing **8** ·
motorcycles **7** · camping_vehicles **3** · burning_man_bikes **1** · mountaineering **1**.
The cycling cluster (road + electric + mtb + burning_man = 255 pairs combined) is now clearly
the biggest single win after water_sports, reinforcing the shared-core approach.

## Phase 1 — Lock every category file and vocabulary (the remaining long pole)

Seed every file from: `web/lib/config/categories.ts` (subcategory taxonomy), the §12 template
contract, and `snow_sports.md` as the structural model (fishing.md as the compact model). Each
file needs: subcategory table with tell-them-apart cues, bounded `attributes` vocabulary
(gear_type enum + graded/boolean keys), chip/tag crosswalk, add-ons, sizing, skill cues,
pricing quirks, differentiators, traps (import the settled global rules!), terminology, DoD.

Authoring order (by post-scrub pair count, re-check after Phase 0):

1. **water_sports** (~154 pairs pre-scrub; the biggest and most trap-dense). Must encode the
   settled rules as traps: captained-charter (bareboat vs skippered), guide-required, marina
   slip/storage/service ≠ rental, delivery/beach-setup operators, PWC hourly-dominant pricing,
   wetsuit/safety-gear add-ons, half-day as the anchor tier for boats, seasonal concessions.
2. **Cycling core + thin files: mountain_biking, road_cycling, electric_transport,
   burning_man_bikes.** One shared `cycling_core.md` (frame/wheel sizing, e-assist class 1/2/3,
   suspension, kids bikes, helmet/lock add-ons, demo programs, repair-shop-≠-renter trap,
   fat-bike winter crossover to `snow_sports`) + four thin per-category files holding only
   deltas. Amend §12 with one line permitting a shared-core include (saves run-time reading on
   the most common multi-category combo: mtb+road+elec). burning_man_bikes is a paragraph-thin
   delta (playa fleet, dust prep, Gerlach/Reno pickup — 1 queue pair).
3. **off_road + motorcycles** (powersports pair): engine-cc/seat sizing, UTV/RZR tracked-winter
   trap (already in snow_sports §9 — cross-reference), guided-UTV-tour ≠ rental (Zephyr Cove
   pattern), damage deposit/insurance add-ons, street-legal vs trail-only, trailer add-ons.
4. **camping + camping_vehicles**: take-away vs delivered/set-up trap (High Desert lesson —
   delivered glamping = out_of_scope), rough-terrain rule for vehicles (00_general §4.1 —
   cross-reference, don't duplicate), sleep-capacity sizing, bear-canister add-ons.
5. **rock_climbing**: thin; leans on mountaineering.md (shoes/harness/crampon overlap —
   cross-reference the crampon-binding distinction from snow_sports §9).

Also in this phase:
- **fishing.md rules refresh** (31 pairs): it predates the July decision rules — add the
  captained-charter and guide-required traps (a fishing charter is `no_rentals`; only standalone
  rod/boat rental counts) and the third-party-review evidence rule. Verify against 2–3 queue
  operators.
- **Lock the existing hunting / disc_golf / mountaineering files too.** They can stay compact,
  but none may be deferred: an operator can reveal a category that Pass A never tagged, and the
  global gate must guarantee it is recordable during the one visit.
- **EC decision point (before snow vocab locks): the `sledding`/ski-bike category** (§11 open
  proposal). If approved, snow_sports moves `sled`-subcategory items + `ski_bike` gear to the
  new category and CATEGORY_VOCAB gains it; if declined, the interim mapping (subcategory
  `sled`, gear_type `ski_bike`) stands. Deciding later = re-mapping extracted rows.

**Ground every vocabulary in the queue, not in hypothetical completeness.** Draft each file's
attribute set FROM the cached evidence of that category's real queue operators (what they
actually rent and how they describe it), then generalize — an attribute no queue operator
would populate is an empty facet that costs calibration churn (the `00_general §11` density
bar, applied at authoring time).

**ALL 15 LOCKED (2026-08-01). The global vocabulary gate is OPEN** — `pass_b_batch.mjs` emits
without `--pilot`. `snow_sports` · `water_sports` · the cycling cluster (`mountain_biking`,
`road_cycling`, `electric_transport`, `burning_man_bikes`, sharing `cycling_core.md` and a
`CYCLING_CORE_ATTRIBUTES` const) · `off_road` · `motorcycles` · `camping` · `camping_vehicles` ·
`rock_climbing` · and the four pre-existing compact files (`mountaineering`, `hunting`, `fishing`,
`disc_golf`) locked from their own documented vocabularies.

EC decision 2026-08-01: e-bikes route by **power source** to `electric_transport` (with browse
aliasing), enforced mechanically by the bounded vocabularies.

### Open items carried into Phase 4

1. **`categories.ts` divergence.** `surrey` and `accessory` (cycling) were added to the extraction
   vocabulary from real priced SKUs. `web/lib/config/categories.ts` needs matching entries before
   they can surface as browse chips — `road_cycling.md §6`.
2. **Taxonomy proposal: licence-free road vehicles.** Polaris Slingshots, mopeds/scooters, and
   arguably the Can-Am Spyder have no home in the taxonomy — `00_general §11`. Real priced rentals
   are being dropped. Decide before a full Tahoe run.
3. **8 duplicate operator groups in the queue** — `DEDUP_FINDING_2026-08-01.md`. Mostly
   `http`/`https`/`www` normalisation failures; ~9 wasted Phase 4 visits if not merged first.
4. **4 needs_review call-list operators** await EC's phone calls (independent of this plan), plus
   ASC Training Center and Galena Sports from the pilot.
5. **`price_block` / `block_hours`** — two independent waves have now hit operators publishing
   duration blocks the six price tiers can't model. Consider on a third occurrence.

**Per-file lock checklist** (a category is not "locked" until all four are done):
1. Dry-write 2–3 paper extractions from real cached evidence and check every item lands in the
   vocabulary.
2. Add the enums to `CATEGORY_VOCAB` in `pass_b_vocab.mjs`.
3. Add a `CATEGORY_ACTIVITIES` entry — the activity rules (snow_sports.md §1a), or an explicit
   `[]` when the category maps to no winter activity. **Without this, every correct `activities`
   claim on that category is rejected** and `operators.activities[]` can never be populated from
   it (this exact gap was caught by fixture review before Phase 1 started). `vocabReadiness`
   enforces it, so a vocabulary without activity rules keeps the global gate closed.
4. Add fixture items — including one asserting a *valid* activity derives onto the operator, not
   only the rejection cases.

A category with no current hint still needs a conservative bounded vocabulary derived from its
taxonomy and category contract.

**Calibrate before authoring the rest.** Once `snow_sports` is locked, run
`pass_b_batch.mjs 8 --pilot` (45 operators are currently pilot-eligible) and apply with
`pass_b_apply.mjs … --pilot`. This validates the attribute format against real sites *before*
the remaining 9 files are written, instead of discovering a structural flaw after they all
exist. Pilot results are stamped `visit_mode: "pilot"` and those operators are automatically
re-visited in the full run.

## Phase 2 — Retool Pass B to operator-major + guard fix + fixtures harness

`pass_b_batch.mjs`:
- Emit **one entry per operator**. Confirmed/review categories appear as likely hints only;
  they never filter which categories the extractor may return. Verified-first ordering stays.
- **Global vocab gate:** emit no operators until every one of the 15 in-scope categories has a
  locked file, `CATEGORY_VOCAB` entry, and `CATEGORY_ACTIVITIES` entry. Print every missing
  piece. Because tags are untrusted, a per-operator tag gate would still allow an unrecordable
  discovery. Two narrow, explicit exceptions exist: `--pilot` (calibration, ≤12 operators, only
  fully-locked hints, results stamped for re-visit) and `--repair --category <slug>`
  (re-extract one category for already-logged operators after a vocabulary revision).
- Done-tracking aggregates across ALL `pass_b_*_results.json`: an operator is done only when
  every current category hint has an `operator_at_once` result. Legacy/partial category logs do
  not falsely mark a whole-site visit complete; partially-done operators re-emit with the
  remaining categories (resumability).
- Replace the per-category LAST CATEGORY flag with combined-state instructions: supply
  `operator_status` only when all removals and discoveries together leave zero categories.
- Show the **tail** of the operator note (Pass B findings append at the end; the current
  head-truncation hides them), and show prior logged outcomes for partially-done operators.

`pass_b_apply.mjs`:
- Accept a normal result for any category with locked vocabulary, whether pre-tagged or found
  during Pass B. `extracted` confirms it now; untagged `needs_review` enters the review queue.
- Reserve `self_heal_categories` for known-but-unlocked vocabularies. Reject locked categories
  placed there and require a same-visit result. Store the deferred disposition for audit.
- **Cross-result zero-category guard (bug fix):** validate the COMBINED effect of all results
  for the same operator within a batch — two `category_not_found` results that together empty
  the row must demand `operator_status`, even though each alone would not.
- `CATEGORY_VOCAB` filled per locked file in shared `pass_b_vocab.mjs` (Phase 1 output).
- **New `--test-fixtures` mode** (mirrors `run_gate_ladder.mjs`): a checked-in
  `pass_b_fixtures.json` with, per category, one valid item batch and the known invalid shapes
  (bad gear_type, unknown attribute key, price 0, duplicate signature, cross-result guard case,
  unsupported activity claim). Run it after every vocab addition — this makes the ad-hoc
  scratch tests from July permanent and locks each vocabulary mechanically.

`PASS_B_RUNBOOK.md`: operator-major loop and schema example (one browse → one result object per
category), fold in: bareboat verifications owed on specific operators
(Truckee Watersports, Just So Scuba, Birkholm's, Lake Tahoe Sailing — their row notes carry
the ask), snowmobile-tour rule, calibration section update.

Verification: `node --check` all scripts; `--test-fixtures` green; scratch-dir integration test
(multi-category operator applied twice → idempotent notes, correct per-category results files,
cross-result guard fires when it should); gate-ladder fixtures still green (regression).

## Phase 3 — Calibration wave (8–10 multi-category operators, then lock)

Pick AFTER the scrub, deliberately diverse so each browse exercises multiple new vocabularies:
a full-service marina (water + fishing claims), a bike shop (mtb + road + electric), a
powersports outfit (off_road + motorcycles), a resort (snow + summer), a delivery-only
operator, a Booqable-storefront operator, one off-season site, one auto-triaged suspect
(expected category_not_found + operator_status), plus Mt. Rose or Diamond Peak as the known-
good snow baseline. Extract → `pass_b_report.mjs` per category → diff attribute usage against
each file's vocabulary → adjust files + CATEGORY_VOCAB + fixtures → re-lock. Only then scale.

## Phase 4 — Full run (for completeness; not "prep")

Waves of ~5 operators (multi-category batches are token-heavy); `pass_b_report` between waves
for drift; strong model for step-0 judgment and package decomposition, cheaper model allowed
for mechanical re-checks only; needs_review outcomes carry ACTION notes. After the run: the
Supabase equipment upsert is the next milestone (files-first output is already upsert-ready via
the natural-key/dup-signature guard) — design it then, not now.

---

## Standing rules (all phases)
- Recall beats precision: ambiguous → triaged/review with a note, never a guessed removal.
- Dry-run every applier invocation first; whole-batch reject is the safety net, don't bypass it.
- New page caches: gitignored + token-scrubbed (`(sk|pk)\.eyJ…` — the Mapbox lesson).
- No git from Cowork sessions; EC commits app repo + `instructions/` repo at each phase end.
- The 4 needs_review call-list operators are independent of this plan — EC calls when ready.
