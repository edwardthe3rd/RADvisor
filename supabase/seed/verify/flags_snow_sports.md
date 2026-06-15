# Snow Sports — flags for manual review

Generated 2026-06-14 from `gather_evidence.mjs snow_sports` (66 active operators)
+ targeted web research. **Nothing here has been applied** — snow data is your
ground truth; these are flagged for your decision.

The system produced **14 hard conflicts**. After web research they sort into:
3 high-confidence real errors, 2 to verify, 9 detection limitations where your
data looks correct. Plus additive proposals (demos / season leases / subcategories).

---

## 1. High-confidence — current data appears wrong (recommend change)

### `coalition-snow` — business CLOSED → deactivate
coalitionsnow.com shows "Coalition has closed… After 12 years, we're saying
goodbye." Currently active + demo-only. **Recommend: `is_active = false`.**
(The "rental" signal the scan saw was a false positive.)
Source: https://www.coalitionsnow.com/

### `powder-house-ski-board-pro-snow` — NOT demo-only; full rental shop
tahoepowderhouse.com: *"the largest and most complete ski rental & snowboard
rental shop in South Lake Tahoe"*, "Reserve your Rentals… online", and lists
**"Ski and Snowboard Season Leases."** Currently flagged demo-only
(`offers_rental=false, offers_demo=true`).
**Recommend: `offers_rental=true, offers_demo=true, offers_season_lease=true`**;
subcats `alpine_ski, snowboard, cross_country_ski, snowshoe, apparel_snow`.
Source: http://www.tahoepowderhouse.com/

### `truenorth-northstar-village` — NOT demo-only; rents AND demos
Northstar's official shop: *"excellent selection of demo skis you can reserve in
advance… apply up to 2 days of demo rental cost towards the purchase"* **and**
*"book ski rentals in advance and save up to 20%, order online and pick up
slopeside."* Currently demo-only.
**Recommend: `offers_rental=true, offers_demo=true`**; subcat `alpine_ski`.
(Note: `truenorth-ritz-carlton` is a separate active listing that also demos.)
Source: https://www.northstarcalifornia.com/explore-the-resort/the-village/shopping/truenorth.aspx

---

## 2. Verify (medium confidence)

### `truckee-boardhouse` — may be retail / tune shop, not rental
Described as a *"year-round core snowboard and skate shop… best gear from our
favorite brands"* + *"in-house tune and repair"* — rentals not mentioned; area
rental shops are listed separately. Currently `offers_rental=true`.
**Action: confirm whether they actually rent, or are retail+tune only.**
Source: https://truckeeboardhouse.com/ · https://www.yelp.com/biz/truckee-boardhouse-truckee-2

### `galena-sports` — no website on file
`website` is null, so it can't be auto-verified and users have no site link.
**Action: add the website (galenasports.com) if it exists, then re-scan.**

---

## 3. Detection limitations — your data looks correct, no change needed

These tripped a conflict only because the site is JS-rendered, down, or the
relevant page wasn't reachable by a plain fetch. Web research confirms current data:

| Slug | Conflict raised | Finding |
|------|------|------|
| `play-it-again-sports` | no rental signal | Confirmed: *"offers rental services for snowboard and skis"* — keep `offers_rental=true`. |
| `west-shore-sports` ×3 (`-qmz5wvbk`, `-sunnyside`) | lease flag but no signal | Confirmed: dedicated **Season Lease Program** page (skis/boots/poles, board/boots/bindings, adult + junior). Keep lease. |
| `tahoe-sports-ltd` | lease flag but no signal | Founder-verified lease; site likely JS — presumed correct. |
| `asc-training-center-formerly-auburn-ski-club` | no rental signal | Site under maintenance — can't scan; presumed correct. |
| `nordic-ski-trails-at-the-lake-tahoe-community-college` | no rental signal | No website on file (trailhead nordic rentals) — presumed correct. |
| `totally-board` | no rental signal | JS site, 1 page rendered — presumed correct. |
| `rmu-truckee-ski-shop` | demo flag but no signal | Handmade-ski brand shop + tune; site doesn't state demo/rental either way — demo-only plausible but **unconfirmed**. |

---

## 4. Additive proposals (the new "rents AND demos" + lease + subcategory data)

Your old model couldn't say "rents **and** demos." The scan found **21 rental
shops that also advertise a demo program** — propose adding `offers_demo=true`
(keeping `offers_rental=true`):

`gondola-ski-sports`, `heavenly-sports-cecils-plaza`, `heavenly-sports-marriott`,
`olympic-valley-ski-bike`, `palisades-tahoe-ski-snowboard-rental`,
`parallel-mountain-sports`, `pyramid-peak-sports-bike-rentals`,
`rip-n-willies-ski-snowboard-rental-shop`, `rock-house-discount-ski-snowboard-rentals`,
`showcase-heavenly`, `showcase-northstar`, `ski-pro`, `sugar-bowl-rental-shop`,
`tahoe-daves-boardshop`, `tahoe-daves-skis-boards`, `tahoe-daves-skis-boards-0wje-6_m`,
`tahoe-sports-hub`, `the-ski-renter`, `truenorth-ritz-carlton`, `village-ski-loft`,
`winter-wonderland-ski-shop`.

**11 shops advertise a season lease** — propose `offers_season_lease=true`
(several Powder House locations, Tahoe Dave's, `bobos-ski-patio`,
`rip-n-willies…`, `sports-ltd-rentals`). West Shore + the existing 4 already flagged.

**Subcategories**: the scan proposes equipment-type tags for all 63 reachable
operators (`alpine_ski`, `snowboard`, `cross_country_ski`, `splitboard`,
`snowshoe`, `sled`, `apparel_snow`) — see the **All operators** table in
`snow_sports_worksheet.md`. These are brand-new (the field was empty) and need a
confirmation pass before applying.

---

### How to apply (once you've decided)
Put confirmed changes into `operator_website_verified.json` keyed by slug, e.g.:
```json
"powder-house-ski-board-pro-snow": {
  "offers_rental": true, "offers_demo": true, "offers_season_lease": true,
  "subcategories": ["alpine_ski","snowboard","cross_country_ski","snowshoe","apparel_snow"],
  "source": "http://www.tahoepowderhouse.com/", "verified_at": "2026-06-14",
  "notes_internal": "founder_verified; full rental shop + season leases + demos"
}
```
then `node supabase/seed/apply_operator_verified.mjs` and
`node supabase/seed/verify/verify_consistency.mjs`.
