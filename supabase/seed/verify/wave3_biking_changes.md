# Biking re-tag — Mountain Biking, Wave 3 (verified 2026-06-16)

Fixes the under-tagged bike shops surfaced when category↔gear-tag sync was added.
Rule applied (EC, 2026-06-16): **any operator offering a mountain bike — any variation,
incl. "MTB", "e-MTB", hardtail/trail/enduro/downhill/XC, full-suspension — gets the
Mountain Biking category + the matching gear tag.** E-MTB → `ebike_mtb` (sits in both
Mountain Biking and Electric Transportation). Same logic for every category; flag
ambiguous cases for EC.

Edits in `operator_website_verified.json`; applied to operators.json and pushed to prod DB.

## Tagged this wave (gear verified via site / web)
| Operator | MTB gear added | Other tags | Notes |
|---|---|---|---|
| Tahoe Bike Company | trail_bike | cruiser_bike, tandem_bike | performance MTB + cruisers + tandems |
| Sports Ltd. Rentals | trail_bike, ebike_mtb | — | Specialized Stumpjumper + Gen 4 Levo |
| Tahoe Sports Ltd. | trail_bike, ebike_mtb | — | same fleet (Stumpjumper + Levo) |
| Shoreline of Tahoe | xc_bike | cruiser_bike, +demos | mountain + comfort + cruiser + demo bikes |
| Olympic Valley Ski & Bike | trail_bike | ebike, cruiser_bike, +demos | Pivot/Yeti/Scott MTB + e-bikes + path cruisers |
| South Shore Bikes | trail_bike | cruiser_bike, kids_bike | Pivot/Transition MTB + backcountry shuttle |
| West Shore Sports ×3 | xc_bike | cruiser_bike | cruisers → mountain → road bikes |
| Tahoe Sports Hub | trail_bike, ebike_mtb, xc_bike | — | full-sus MTB + E-MTB + standard; rent+demo |
| Truckee River Bikes | xc_bike | cruiser_bike, tandem_bike | comfort/off-road MTB + cruisers + tandems |
| evo Tahoe City | trail_bike, ebike_mtb | +demos | full-sus MTB + e-MTB; **dropped Road & Gravel** (no road bikes) |
| Black Tie North Tahoe | trail_bike | — | delivery MTB + e-bikes; **dropped Road & Gravel**; also SUP/kayak → add water_sports in water wave |

## Resolution of the 6 flagged (2026-06-16, EC-directed)
ROOT CAUSE of the misses: rentals were under a **Services** tab, not a "Rentals" nav — the scan/searches missed them. Always check Services / `/rentals-services` / `/rentalbikes` / booking subdomains.

- `tahoe-xc` — WRONG earlier call. Rents **mountain bikes** + XC ski gear + snowshoes (`/rentals-services`). → tags `xc_bike, cross_country_ski, snowshoe`; rental=true. Stays in Mountain Biking.
- `high-sierra-cycling` — WRONG earlier call. Full rental fleet under Services>`/rentalbikes`: full-sus + hardtail MTB, performance E-MTB, road (alu/carbon/Ti), hybrid e-bike; demos too. → `trail_bike, xc_bike, ebike_mtb, road_bike, gravel_bike, ebike`; rental=true, demo=true.
- `rmu-truckee-ski-shop` — **demo only** (EC): demos own RMU Nighttrain enduro + e-MTB. → `enduro_bike, ebike_mtb`; rental=false, demo=true. EC to phone-confirm.
- `south-lake-e-bikes`, `emerald-bay-bikes`, `lake-tahoe-bike-rentals` — confirmed correct: **dropped Mountain Biking** (e-bike / paved-path rentals, no MTB).

All Mountain Biking operators now resolved. NEXT: Road & Gravel Cycling, then Electric Transportation (apply the Services-tab check to every operator).

## State after wave 3
42 active Mountain Biking operators · 36 now carry an MTB gear chip · 6 flagged above.
NEXT: resolve the 6, then move to Road & Gravel Cycling, then Electric Transportation.
