# needs_review resolution + full-file audit — 2026-07-05

Input: 53 needs_review operators (EC's manual review notes) + audit of the other 461 verdicts.
Result: **513 operators total (1 duplicate removed) — 281 triaged · 212 no_rentals · 16 out_of_scope · 4 needs_review (call list).**
`triage_batch.mjs` reports 0 remaining. Patches applied: `triage_patch8-11.json`.

## Call list (the only 4 operators still in review)

| Operator | Call | Ask |
|---|---|---|
| Doing It Big Rentals (Gardnerville) | (408) 780-6320 | What do they rent — adventure gear or party equipment? Site fails SSL. Also listed under a 2nd place_id in the raw sweep. |
| Love Your Life BackCountry (Truckee) | (530) 412-0833 | Do they rent backcountry ski gear for independent use, or guide only? Site is under construction. |
| PADDLE TO YOU (Tahoe Vista) | (530) 280-7099 | Still operating? Do they rent/deliver SUPs or kayaks? Site serves an empty page. |
| Tallac Boat Rentals (SLT) | (530) 290-1998 | Does the business exist and rent boats bareboat? No site, no reviews. |

(Tahoe Blue Adventures was on the call list but Yelp confirmed a jet ski/boat/SUP/kayak rental fleet → triaged without a call.)

## What the review + audit changed

- **Group 2 (25 verdicts):** all set per EC's notes. Cabin Fever (gift shop) and Bearry Sweet (dessert shop) rent nothing so they're `no_rentals` with an out-of-scope note; Home Depot and High Desert Camping Co are `out_of_scope` (they do rent, nothing in-domain). Eastlake Ebike was real but is defunct (dead domain) → `no_rentals`.
- **Duplicate removed:** Truckee River Raft Co. rank-215 row deleted from triage + evidence files.
- **Group 3 (22 verdicts → triaged):** all featured per EC's notes with live-verified evidence and categories. Website corrections written into `sweep_pass_a_evidence.json`: Lake Tahoe Floats, Quiver (skiquiver.com), RMU (rmumtnculture.com), Everline (everlineresort.com), Mt. Rose (skirose.com), Diamond Peak, plus first-party URLs found for Moto Tahoe, tahoe skibikes, Just So Scuba, Lake & Wake.
- **Just So Scuba** (in no group) → triaged `water_sports`, medium confidence — dive-gear rental exists but in a charter context; Pass B should verify standalone rental.
- **Truckee Watersports conflict:** EC says rents boats; current site shows captain-included only. Kept triaged (low confidence) — Pass B must verify a bareboat option or demote.
- **Audit demotions (triaged → no_rentals, verified live):** Lake Level Surf Charters, Tahoe Jet Boats (×3 duplicate rows), North Tahoe Wakesurf and Charter, The Water Traveler, Tahoe Lake Tours, Discover Tahoe Chartered Cruises (all captained-only), High Desert Archery Reno (class-bundled gear only).
- **Audit rescue (no_rentals → triaged):** Truckee River Rafting — "self-guided rafting trips… commercial-grade rafts", same model as Truckee River Raft Co.
- **Category fixes (kept triaged):** Endless Wave Charters, Full Throttle Tahoe, Boat Tahoe, Tahoe Paradise Boat Rentals → water_sports only (hallucinated snow_sports/off_road/road_cycling/fishing removed).

## ⚠ Known residual risk: mechanically auto-triaged categories

**~200 of the 281 triaged rows carry the note "Auto-triaged from positive rental evidence and category terms"** — their `categories[]` came from keyword matches, not from reading the site (e.g. 209 rows claim snow_sports; many boat operators carry it wrongly). The audit fixed the rows whose *status* was wrong; the surviving rows rent *something* in-domain, but their category lists are noisy. Options before Pass B:
1. Accept it — Pass B verifies each category and flags empties (costs wasted crawls per bogus category), or
2. Run a cheap category-scrub batch over the auto-triaged rows first (recommended for snow_sports/road_cycling, the most inflated slugs).

Same-domain multi-location brands (Powder House ×6, Heavenly Sports/Epic ×6, BlueZone ×4, etc.) were left as distinct rows on purpose. Same-name pairs worth an eyeball at import: Pedego Reno (2), Clearly Tahoe (2 of 3), Tahoe Adventure Rentals (2), North Tahoe Watersports (2), Tahoe Dave's (2), Tahoe Family Adventures (2), Tahoe XC (2), West Shore Sports (2 + 1 null-id).

## Pipeline changes for the next region

- `run_gate_ladder.mjs`: regional visitor directories (tahoe.com etc.) added to the aggregator blocklist; new Gate 3 venue/club branch (SNO-Parks, ski clubs, rinks, ranges, activity zones — even with a live site, gov-parks domains included); Gate 4 now dedups same domain+name *within* the batch; rental-shop escape hatch widened (watersport/canoe/jet ski/snowmobile). Self-tests: 39/39 fixtures, 8 new.
- `TRIAGE_RUNBOOK.md` + `instructions/extraction/00_general.md`: 9 verbatim decision rules (take-away, captained charter, admission-bundled, pass-gated demos, guide-required, ski-resort prior, wrong-website check, third-party review evidence, actionable needs_review) + explicit "never auto-triage mechanically".
- `00_general.md` §4: **every input runs the gate ladder — no bypass lane.** The Home Depot leak happened because "originals" (pre-existing DB rows) skipped gates 1–4.
- `00_general.md` §11: open proposal for a `sledding`/ski-bike category (tahoe skibikes) — decide before Pass B.
