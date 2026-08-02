# Duplicate operators in the triaged queue — found 2026-08-01

Found while selecting a diverse Phase 3 calibration set. **8 duplicate-name groups among the 276
triaged operators**, accounting for roughly 9 redundant rows. Not merged — merging operators is
destructive and several cases need a judgment call. Flagged for EC.

**Why it matters now:** every duplicate is a wasted Pass B site visit in Phase 4 and a duplicate
row in the eventual Supabase upsert. Cheapest to fix before the run, not after.

## Unambiguous — same site, differing only by scheme or `www`

`00_general §9` already specifies the operator natural key as the **`website` domain**. These
differ only in ways domain normalisation should erase (lowercase, strip scheme, strip `www.`,
strip trailing slash):

| Operator | Rows |
|---|---|
| Tahoe Dave's Skis & Boards | `https://www.tahoedaves.com/` · `http://www.tahoedaves.com/` |
| North Tahoe Watersports | `https://northtahoewatersports.com/` · `https://www.northtahoewatersports.com/` |
| Tahoe Adventure Rentals | `http://tahoeadventurerentals.com/` · `https://tahoeadventurerentals.com/` |
| Tahoe Family Adventures | `http://tahoefamilyadventures.com/` · `http://tahoefamilyadventures.com/` (**byte-identical**) |
| West Shore Sports | `http://www.westshoresports.com/` ×2 (one with `place_id: null`) · `http://westshoresports.com/` |

**Merge rule if EC approves:** keep the row with a non-null `place_id` and the richer evidence,
take the **union** of `categories[]` and `review_categories[]` (recall-first — never intersect),
concatenate notes. Tahoe Adventure Rentals matters most here: one row carries
`water_sports+snow_sports+off_road` and the other only `water_sports+off_road`, so an intersection
would silently drop `snow_sports`.

## RESOLVED by EC, 2026-08-01

- **Pedego Electric Bikes Reno — does not rent, and the two rows are the same business.**
  EC verdict: it is a Pedego *dealer* (sales and service). The two rows are its own site
  (`pedegoreno.com`) and the manufacturer's dealer-directory page
  (`pedegoelectricbikes.com/dealers/reno/`) — different hosts, so the domain-keyed dedup could
  never have matched them. Merged to one row and re-routed to `no_rentals`.
- **`bikelaketahoe.com` is a sibling brand, not a duplicate.** Clearly Tahoe is its parent
  company; the bike arm runs on its own domain. Kept as its own operator under the §9 domain
  natural key, renamed off the Google label to **"Bike Lake Tahoe (Clearly Tahoe)"**.
- **…and that site is not served over HTTPS.** `00_general §10` is unambiguous: do not enter, do
  not extract, flag for review. Moved to `needs_review` with its five category claims parked in
  `review_categories` and an ACTION note — either confirm TLS was since enabled, or extract that
  fleet from the secure `clearlytahoe.com` parent site instead. **Being insecure says nothing
  about whether they rent**, so it was not demoted to `no_rentals`.

  > ⚠️ **The recorded URL was `https://bikelaketahoe.com/`.** A stored `https://` prefix is not
  > evidence of working TLS, and **116 of 257 triaged operators carry a bare `http://` URL** —
  > mostly harmless pre-redirect forms, but the §10 check can only be made at visit time, per
  > operator. Treat the scheme in this ledger as untrustworthy metadata in both directions.

## Needs a judgment call

- **Clearly Tahoe (3 rows).** `clearlytahoe.com` and `clearlytahoe.com/incline-village/` are
  **probably NOT duplicates** — `00_general §9` says different towns each get their own operator
  page, and Incline Village is a distinct town. The third row is `bikelaketahoe.com` with a
  narrower category set: likely a sibling brand or a rebrand. Needs a look.
- **Pedego Electric Bikes Reno (2 rows).** `pedegoreno.com` versus
  `pedegoelectricbikes.com/dealers/reno/` — same business, one being the manufacturer's dealer
  page. Different domains, so domain normalisation will not catch it. Category sets differ
  (`road_cycling+electric_transport` vs `off_road+mountain_biking+electric_transport`), so the
  union matters.
- **Tahoe XC (2 rows).** One has `place_id: null`, the other has no website. Likely the same
  nordic centre recorded twice by different paths.

## Not duplicates — leave alone

- **BlueZone Sports** — Carson City, South Lake Tahoe, and Tahoe City. Three genuinely different
  towns; `00_general §9` explicitly gives each its own operator page.
- **Black Tie Ski Rentals / Black Tie Bike Rentals North Tahoe** — different service lines.

## Suggested fix

Domain normalisation belongs in the Gate 4 dedup in `run_gate_ladder.mjs` (which already has
`intraBatchDuplicate()`), so the next region's sweep never creates these. A one-off merge script
would clean the current queue. Both are out of the approved Phase 1 scope — recorded, not done.
