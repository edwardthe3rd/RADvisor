# Plan — locate every institutional / government gear-rental operator and get it into the ledger

**Status:** proposed, not started. **Written:** 2026-08-02.
**Origin:** `GEAR_LIBRARY_FINDING_2026-08-01.md` (Carson City Outdoor Gear Library).

---

## 0. Scope — what "government outdoor rentals" actually means here

The trigger case was a city department, but the operator class is defined by **institution, not by
TLD**. Restricting the work to `.gov` would miss most of it. In scope:

| Sub-class | Example host shape | Reno/Tahoe instances already visible in the data |
|---|---|---|
| Municipal / county parks & rec | `carsoncity.gov`, `reno.gov`, `washoecounty.gov` | Carson City (the trigger), Reno, Washoe County |
| Special recreation districts | `tdrpd.org`, `ntpud.org` | Truckee Donner Rec & Park District, North Tahoe PUD |
| County community services | `communityservices.douglascountynv.gov` | Douglas County |
| University outdoor programs | `unr.edu`, `sierranevada.edu` | none found — expected to exist |
| Library "library of things" | `washoecountylibrary.us`, `carsoncitylibrary.org` | none found |
| State / federal concessions | `parks.nv.gov`, `fs.usda.gov` | Sand Harbor, sno-parks (concession-operated) |
| Nonprofit lending co-ops | `.org` | ASC Training Center, Tahoe XC (already triaged) |

Out of scope, explicitly: **facility rental** (pavilions, meeting rooms, ball fields, senior-center
halls). This is the dominant meaning of "rental" on a municipal site and is the primary source of
false positives — see §1.2.

---

## 1. Why the pipeline misses them — three independent failures

Each was verified against the current data, not assumed. **All three must be fixed**; fixing only
the discovery layer produces operators that then die in the crawl.

### 1.1 Discovery: the institution is not a rental-category POI

Of **936** operators returned by the whole Pass A sweep, **9** have a `.gov` or `.edu` website, and
every one of them is a *facility* — a park, a boat ramp, a sno-park, a whitewater park. **Zero** are
a recreation department, university program, or gear library.

```
Sun Valley Regional Park · Sierra Vista Park · Fannette Island Tea House · Hope Valley Sno-Park
Sand Harbor Boat Ramp · Donner Summit SNO-Park · Kahle Park · Blackwood Canyon SNO-PARK
Truckee River Whitewater Park
```

This is not a coverage problem and no amount of AOI refinement fixes it. A department is a
`local_government_office` POI named "Carson City Parks and Recreation"; the 74 terms in `QUERIES`
all ask for the *gear* ("kayak rental", "ski rental"), so the department never ranks. The
department is a different POI from the park it operates, and only the park surfaces.

**Confirms the finding:** `carsoncity.gov` was never blocked by `GOV_PARKS_HOST_RE` — that regex
only matches `parks.ca.gov`, `nps.gov`, `fs.usda.gov`, `blm.gov`. It was never found.

### 1.2 Crawl: a one-hop homepage crawl cannot reach the rate card, and "rental" means the wrong thing

`fetchWebsiteEvidence()` (`verify/lib.mjs:191`) fetches the homepage, follows **one hop** of
priority-filtered homepage links, tries a fixed `/rentals`, `/rates`, `/pricing` guess list, and
stops at **6 pages**. On a municipal portal the gear page is three or four clicks deep
(Home → Departments → Parks Recreation & Open Space → Recreation → Outdoor Equipment Rental) and
`origin + "/rentals"` does not exist.

Worse, the link filter matches the word "rental", which on these sites means facilities. The
Kahle Park evidence row is the proof — 6 pages fetched, budget entirely consumed by noise:

```
communityservices.douglascountynv.gov/cms/one.aspx/
.../recreation/douglas_county_community_senior_center/facility_rentals
douglascountynv.hosted.civiclive.com/cms/One.aspx?portalId=...
.../parks/reservation_information
.../parks/online_services
.../parks/weed-control/weed-control-services
```

Six pages, zero gear, one weed-control page. Triage correctly read that evidence and returned
`no_rentals`. **The judgment was right; the evidence was wrong.**

Two further mechanical gaps on this class: `relevantLinks()` skips `.pdf`
(`verify/lib.mjs:175`) and municipal rate cards are very often PDFs; and these sites are frequently
CivicPlus/CivicLive tenants where the real content lives on a second hostname
(`douglascountynv.hosted.civiclive.com` above), which the same-origin check drops.

### 1.3 Ledger: insertion needs an evidence row, not just a `place_id`

The finding said `pass_b_apply.mjs` keys on `place_id`. It is slightly softer than that —
`keyOf()` (`pass_b_apply.mjs:420`) falls back to `name:${name}`, so a row with a null `place_id`
can be addressed. But the chain upstream is real:

```
sweep operators -> run_gate_ladder -> survivors -> run_pass_a (evidence)
   -> sweep_pass_a_evidence.json -> triage verdicts -> triage_apply -> sweep_pass_a_triage.json -> Pass B
```

`triage_apply.mjs:56` rejects any verdict with no matching row in `sweep_pass_a_evidence.json`.
So a hand-added operator needs an **evidence row first**. There is currently no supported script
for that — this is the actual blocker, and it is one phase of work (§G5).

---

## 2. Cost constraint that shapes the whole plan

**Adding a single term to `QUERIES` re-bills the entire sweep.** `SEARCH_CACHE_VERSION`
(`quadtree_sweep.mjs:142`) hashes `terms: QUERIES.map(q => q.term)`, and that hash is the first
segment of every cache key. Change the term list, every key misses.

Current cache: **2,776 search pairs** and **994 place details**. At up to 3 Text Search calls per
pair that is roughly 3,500 billable Text Search calls plus 994 Place Details calls to re-fetch
something already on disk.

The invalidation is unnecessary. The key is already fully qualified:

```
3b75ca691288::standard::38.6100_-120.1617_38.7185_-120.0225::outdoor gear rental
   ^version      ^mode              ^tile                          ^term
```

Term and mode are both already in the key. Hashing them into the version as well means the version
is doing nothing except forcing a full re-bill on any term edit. **Fix this first (§G0)** — it turns
this plan from a ~$100+ re-sweep into a ~$10 incremental one, and it permanently unblocks adding
terms later.

---

## Phase G0 — Make term additions incremental (prerequisite, no API cost)

Remove `terms` and `serviceAreaTerms` from the `SEARCH_CACHE_VERSION` hash in
`quadtree_sweep.mjs`. Leave every geometry/field-mask input in place — those genuinely do
invalidate cached results.

Guard against the one regression this could hide: if a term is *removed* from `QUERIES`, its
cached pairs become orphans. Harmless (aggregation iterates `QUERIES`, not cache keys), but add a
line to the run summary reporting orphaned cache keys so the drift is visible.

**Verify before spending anything.** From `~/RADvisor`:

```bash
node supabase/seed/quadtree_sweep.mjs --dry-run
```

Acceptance: after adding the §G1 terms, the dry run reports the ~2,776 existing pairs as cache
hits and only the new (tile × new-term) pairs as billable. If it reports a full re-bill, G0 is
not done and **do not proceed** to a live run.

---

## Phase G1 — Ask for the institution, not the gear

Add a fourth `tier` value, `institution`, to `QUERIES` in `quadtree_sweep_queries.mjs`. Keep it a
distinct tier so its recall can be measured separately and so the gate ladder can treat it
differently (§G4).

Proposed terms (activity `institution`, season `all`, tier `institution`):

```
gear library                        outdoor equipment rental
equipment checkout                  outdoor recreation program
parks and recreation department     recreation department
university outdoor program          outdoor adventures program
library of things                   community center recreation
```

Note `outdoor equipment rental` already exists as a `gear-shop` term — keep the single existing
entry rather than duplicating it, and let the institution terms cover the rest.

Pair with `includedType` axes already valid in `INCLUDED_TYPE_ALLOWLIST` — `community_center`,
`sports_complex`, `visitor_center`. `local_government_office`, `library`, and `university` are
**not** currently in that allowlist; verify each against Google Table A as a request-valid
`includedType` before adding, because an invalid type 400s the slice (the comment at
`quadtree_sweep.mjs:100` is explicit about this).

**Cost:** 36 seed tiles × ~10 new terms = ~360 new seed pairs. These terms will rarely hit the
60-result cap, so quadtree subdivision should be near zero. Expect roughly 400 Text Search calls
plus details for whatever new places appear — order **$15–25**, versus $100+ without G0.

**Acceptance:** the sweep returns at least one `local_government_office` / `community_center`
primary-type POI per major jurisdiction in the AOI (Reno, Sparks, Carson City, Douglas County,
Washoe County, Truckee, Incline Village, South Lake Tahoe).

---

## Phase G2 — Directory-driven enumeration (this is the "all" in the request)

G1 improves recall but cannot guarantee completeness, because **the program may have no POI at
all**. "Carson City Outdoor Gear Library" is a page on a city website, not a business Google has
a listing for. Any Places-only approach has an unknowable ceiling here.

To claim *all*, enumerate the institutions directly — the set is small, closed, and knowable:

1. **Build a jurisdiction roster for the AOI.** Every incorporated city, county, recreation/park
   district, PUD, public library system, and college whose boundary intersects `AOI_RECTS`.
   For Reno/Tahoe this is on the order of **20–30 entities**, not thousands. This is a
   one-time, hand-checkable list — write it as `institutions_roster.json`.
2. **For each, resolve the official host** and probe a fixed path vocabulary
   (`/parks-recreation`, `/recreation`, `/outdoor`, `/gear`, `/equipment-rental`,
   `/outdoor-recreation`, `/rentals`) plus a site-scoped search where the site exposes one.
3. **Record a verdict per institution**, including the negatives. A negative needs to be recorded
   as *checked and none found*, or the next region repeats the work.

This is the portable artifact. For a new region, step 1 is the only manual work — steps 2 and 3
are mechanical. Recommend writing it as `institution_sweep.mjs` with its own cache file, kept
**separate from** `quadtree_sweep_cache.json` so the two discovery channels can be re-run
independently.

**Open question for EC:** step 1 needs a source for the jurisdiction roster. Census place/county
boundary files are authoritative and free but need a geo join; a hand-built list is faster and
adequate for one region but is the part that does not port. Recommend hand-built for Reno/Tahoe
now, with the schema designed so a boundary-file loader can populate it later.

---

## Phase G3 — Fix the evidence crawl for institutional hosts

Without this, G1 and G2 deliver operators that get judged `no_rentals` on weed-control pages.

Add an institutional-host mode to `fetchWebsiteEvidence()`, triggered by host shape
(`.gov`, `.edu`, known district `.org`) or by the `institution` tier:

- **Two hops instead of one**, and raise `maxPages` from 6 to ~15 for this class only. These are
  a couple of dozen sites, not the whole 936 — the cost is negligible and bounded.
- **Rank gear links above facility links.** Add a negative pattern that demotes
  `facility_rental`, `pavilion`, `meeting room`, `senior center`, `ball field`, `reservation`,
  `weed`. Add a positive pattern for `equipment`, `gear`, `checkout`, `outdoor program`,
  `gear library`. The Kahle Park trace is the regression fixture.
- **Follow PDFs** for this class and extract text. Municipal rate cards are PDFs; the current
  skip at `verify/lib.mjs:175` silently drops the exact artifact being sought.
- **Allow the CMS sibling host.** Permit `*.hosted.civiclive.com` and equivalent CivicPlus
  hostnames when reached from an in-scope institutional origin, rather than dropping them on the
  same-origin check.

**Acceptance:** re-running evidence collection on Kahle Park, TDRPD, and Carson City reaches a
page containing a gear rate card, or reports a clean *checked, no gear program* negative.

---

## Phase G4 — Gate ladder review (audit, likely small changes)

I traced a hypothetical "Carson City Parks and Recreation" row against the gates: it matches
none of `RENT_SHOP_NAME`, `VENUE_CLUB_NAME`, `FACILITY_ONLY_NAME`, `PUBLIC_RECREATION_SITE_NAME`,
or `AGG_NAME`, so it survives to review. **No gate change appears necessary**, which matches the
finding. Two cautions:

- **Do not broaden `GOV_PARKS_HOST_RE`.** It exists to kill state-park and sno-park *facility*
  listings and it is doing that correctly. Widening it to `.gov` would block exactly the operators
  this plan is trying to find.
- **Re-examine the existing `.gov`/district rows** rather than assuming they were judged
  correctly. Their verdicts rest on the broken evidence of §1.2. Priority re-checks: Kahle Park
  (Douglas County Community Services), Truckee Ice Rink and Riverview Sports Park (both resolve
  to `tdrpd.org/205/Rentals` — a rec district with a rentals page, currently `out_of_scope` and
  `no_rentals`), Sun Valley Regional Park (Washoe County), and Truckee River Whitewater Park
  (`reno.gov`). Five rows, cheap to re-check once G3 lands.

Per the standing preference to favour recall — route ambiguous institutional rows to
`needs_review`, never to `out_of_scope`.

---

## Phase G5 — A supported manual-insertion path

Needed for Carson City and for anything G2 finds that has no Places POI.

Write `insert_operator.mjs` that takes a small hand-authored JSON record and writes a
well-formed row into `sweep_pass_a_evidence.json` so `triage_apply.mjs` will accept a verdict for
it. Requirements:

- Look up the Google `place_id` when one exists (keeps the row consistent with sweep-discovered
  rows and preserves dedup on re-sweep); allow `place_id: null` and fall back to the `name:` key
  that `keyOf()` already supports.
- Stamp a provenance field — `source: "institution_sweep"` or `"manual"` — so these rows are
  distinguishable from sweep-discovered ones in every downstream report. Without it, the next
  audit cannot tell the channels apart.
- Refuse to overwrite an existing row unless passed an explicit flag.
- Support `--dry-run`, matching every other applier in this directory.

---

## Phase G6 — Extract the backlog through Pass B

Once G5 exists, Carson City is unblocked. From `GEAR_LIBRARY_FINDING_2026-08-01.md`: ~32 items
across `water_sports`, `camping`, `snow_sports`, `disc_golf`.

- Carson City is the **only** `disc_golf` operator known anywhere in the queue. Adding it is the
  sole path to calibrating that category from this region and takes live coverage to **9 of 15**.
  Note this raises the Phase 3 ceiling recorded in `PASS_B_PREP_PLAN.md` from 13/15 to 14/15 —
  `hunting` remains uncalibratable from Tahoe/Reno.
- The free Disc Golf Set already applies correctly: `0` applies and warns, `null` stays unknown,
  negative still rejects. 41 fixtures green.
- The Snowmaker has no `gear_type` in the taxonomy — needs a vocabulary decision.

### Schema decision required before extraction — `price_weekend`

Carson City publishes DAY / WEEKEND / WEEK. `weekend` is the fourth independent shape the six
duration tiers cannot model, after multi-day rules (4 variants), 2-and-4-hour blocks, and
`$35/month`. Extracting this operator without `price_weekend` silently discards one full column
of published prices.

Recommendation, in order: **`price_weekend`** first (dense, trivially comparable, the single most
common recreational rental window), then `price_monthly` (evidenced twice), and a generic
`price_block` + `block_hours` pair only if hour-blocks recur beyond the current two occurrences.

This touches the eventual Supabase equipment table, so **it is EC's call** — but it gates clean
extraction of the trigger operator, so it should be decided before G6 rather than after.

---

## Sequencing

```
G0 (cache fix, free)  ->  G1 (terms, ~$20)  ->  G3 (crawl fix)  ->  G4 (re-check 5 rows)
                          G2 (roster+probe) ->  G5 (insertion)   ->  G6 (Pass B extraction)
```

G0 is a hard prerequisite for G1 on cost grounds. G3 is a hard prerequisite for G4 and for any
useful triage of G1/G2 output. G2 can be built in parallel with G1 — different channels, and G2
is where completeness actually comes from. G5 blocks G6.

## Acceptance for the plan as a whole

- [ ] Adding a `QUERIES` term costs only the new (tile × term) pairs. Verified by `--dry-run`.
- [ ] Every jurisdiction in the AOI roster has a recorded verdict, negatives included.
- [ ] The Kahle Park crawl trace no longer spends its page budget on facility/weed pages.
- [ ] The five existing `.gov`/district rows are re-judged against repaired evidence.
- [ ] Carson City Outdoor Gear Library is in `sweep_pass_a_triage.json` with `disc_golf`.
- [ ] `price_weekend` is decided (accepted or explicitly deferred with the loss acknowledged).
- [ ] The roster + probe scripts carry no Reno/Tahoe-specific logic outside their data files.

## What this plan deliberately does not do

- It does not broaden `GOV_PARKS_HOST_RE`, which would suppress the target class.
- It does not add facility/venue rental to scope.
- It does not attempt federal concessionaire enumeration (`recreation.gov` operators). That is a
  separate data source with its own API and should be its own plan if EC wants it.
