# Water Sports — flags for manual review

Generated 2026-06-14 from `gather_evidence.mjs water_sports` (137 active operators)
+ targeted research.

**Already applied** (clear cases): subcategory tags for the **95** operators with a
confirmed rental signal + detected gear types (see `water_sports_worksheet.md` →
All operators). No flags were changed; `offers_rental` stays true for those.

Below are the **37 hard conflicts** that need your decision. The big theme: many
imported water-sports listings are **guided tours, captained charters, diving
services, or non-operators** — not consumer gear rentals. None changed automatically.

---

## A. Legit rental — scan missed it (JS booking site). Recommend: keep, add subcats.
The rental keyword sits behind a booking widget so the text scan didn't see it, but
these do rent. Suggested subcats in brackets.

- `truckee-river-raft-co`, `truckee-river-raft-co-f995eima`, `truckee-river-rafting` — **self-guided raft rentals** ($40–65/pp, 2–8 person rafts) [`raft`]
- `lake-tahoe-watersports` — boat / wakeboard rentals [`boat, wakeboard, wetsuit`]
- `obexers-boat-company` — jet-ski rentals + lessons + charters [`jet_ski, boat`]
- `lakeshore-paddleboard-co`, `paddle-to-you`, `tahoe-outdoor-adventures` — SUP/kayak rentals [`paddleboard, kayak`]

## B. Guided tours / charters / club / school — NOT equipment rental. Recommend: `offers_rental=false` or recategorize (experiences, not gear).
- `baywatch-boat-charters`, `grand-tahoe-charters`, `elevation-surf-charters` — captained charters (you don't get the boat)
- `tahoe-whitewater-tours-truckee-river`, `irie-rafting-company-inc` — guided whitewater trips
- `elevated-boat-club-lake-tahoe` — membership boat club
- `cruisers-academy` — boating school

## C. Marine/diving services & non-operators — review for DEACTIVATION (don't belong in a rental directory).
- `clean-up-the-lake-501c3` — environmental nonprofit (lake cleanup), not a rental business
- `diverobotix`, `infiniti-diving-services`, `lake-tahoe-diving-environmental-llc`, `marine-taxonomic-services-ltd-tahoe` — commercial/scientific diving services
- `scuba-mask-defog` — appears to be a product, not an operator location

## D. Retail — verify whether they actually rent or only sell.
- `west-marine` — boating retail chain (likely sell-only)
- `scheels` — big-box sporting goods
- `quiver-sports` — ski shop (JS site; may rent SUP/kayak in summer)
- `donner-ski-shop` — ski shop, water_sports gated to `serene-lakes` location (JS site)
- `advanced-marine` — boat dealer/marina/service (rentals unclear)

## E. No website / JS-only — needs a manual look (can't auto-verify).
- No website on file: `adrenaline-connection-inc`, `just-so-scuba`, `scuba`, `tahoeparadiseboatrental`
- JS-rendered, 0 pages scraped: `lake-tahoe-floats`, `pyramid-lake-marina-store`, `sparks-marina-paddle`

## F. Lease flag — cross-category false alarm, NO ACTION.
`tahoe-sports-ltd`, `west-shore-sports`, `west-shore-sports-qmz5wvbk`, `west-shore-sports-sunnyside`
have `offers_season_lease=true`. That flag is operator-wide and correct for their
**snow** gear lease; it just can't be validated from their water-sports pages.

---

### Data-quality note
Buckets B + C are ~13 listings that are probably not gear-rental operators at all.
That's a broader import-quality signal (matches the original Django bulk import). If
you confirm, I can deactivate them or set `offers_rental=false` in a batch.

To apply any decisions: add to `operator_website_verified.json` and run
`apply_operator_verified.mjs` + `verify_consistency.mjs`.
