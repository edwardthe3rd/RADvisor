# Off-Road & Powersports — flags for manual review

Generated 2026-06-14 from `gather_evidence.mjs off_road` (52 active operators).

**Already applied:** subcategory tags (`atv` / `utv` / `dirt_bike` / `snowmobile`)
for **16** operators with a confirmed rental signal. No flags changed.

**28 hard conflicts (54% — high).** Off-road has the weakest auto-detection: most
rental sites are JS booking platforms (no scrapable text) and many listings are
guided tours or dealers. Buckets below are best-guess from name + Google; **all need
manual confirmation.**

## A. Likely legit rental — JS booking site, scan missed (confirm + add subcats)
`rock-trax-utv`, `utv-addiction`, `the-pits`, `tahoe-toys-adventures-llc`,
`custom-concepts-nv`, `moto-tahoe`, `tahoe-outdoor-dirt-bike-location`,
`the-sierra-sled-shop` — names strongly indicate UTV/ATV/dirt-bike/snowmobile rental.

## B. Guided tours / experiences — NOT equipment rental (review `offers_rental=false`)
`eagle-ridge-snowmobile-tours`, `lake-tahoe-jeep-tours`,
`lake-tahoe-snowmobile-tours-inc`, `north-tahoe-winter-adventures`,
`pacific-crest-snowcats`, `high-line-adventures`, `snoventures-activity-zone`,
`virginia-city-off-road-experience`, `love-your-life-backcountry`,
`tahoe-family-adventures-vg1ibwz4`, `tahoe-outdoor-adventures`, `moon-rocks`
— guided rides / snowcat / jeep tours. Some snowmobile-tour ops also rent sleds —
verify case by case.

## C. Powersports dealers — verify rent vs sell only
`anderson-powersports-reno`, `jr-powersports`, `kawasaki-yamaha-of-reno`,
`motorsport-express-truckee`, `street-rider-of-reno`. (Kawasaki/Yamaha + Harley also
surfaced under e-transport — recategorize to `motorcycles` if they don't rent.)

## D. Review / no website
`rock-rat-adventures` (flagged retail-only), `sunnyside` (looks like a resort/marina —
miscategorized?), `adrenaline-connection-inc` (no website, recurring), `the-pits`,
`moon-rocks`, `the-pits` no-website cases.
