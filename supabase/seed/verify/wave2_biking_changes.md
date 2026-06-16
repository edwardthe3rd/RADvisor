# Biking re-tag — Mountain Biking, Wave 2 (verified 2026-06-16)

Edits live in `supabase/seed/operator_website_verified.json` (merged to operators.json
via `apply_operator_verified.mjs`). NOT pushed to live DB.

Tag vocabulary: Cross-Country Bike, Trail Bike, Enduro Bike, Downhill Bike, E-MTB,
Performance Road Bike, Gravel Bike, E-Bike, Cruiser Bike, Tandem Bike, Kids Bike, Playa Bike.
Demo/lease captured via `offers_demo` / `offers_season_lease` + base tag (suffix-derived filters).

## Operators changed this wave

| Operator | Slug | R/D/L | Tags after | Category change |
|---|---|---|---|---|
| Pacos Truckee | `pacos-truckee` | true/false/false | trail_bike, road_bike, ebike | keep mountain_biking, road_cycling, electric_transport |
| Black Rock Bicycles | `black-rock-bicycles` | true/false/false | playa_bike, cruiser_bike | **drop mountain_biking → burning_man_bikes** (MTB is retail; rentals are playa fat/cruiser bikes) |
| Clearly Tahoe | `clearly-tahoe-bikes` | true/false/false | ebike_mtb, ebike, cruiser_bike, kids_bike | keep electric_transport, mountain_biking, road_cycling, water_sports |
| Sierra Cyclesmith | `sierra-cyclesmith-bicycle-shop` | false/**true**/false | trail_bike, enduro_bike, ebike_mtb, road_bike, gravel_bike | keep (demo-only; founder-verified no rentals) |
| Powder House — Gondola | `powder-house-ski-and-snowboard-at-the-gondola` | true/—/— | xc_bike, cruiser_bike, ebike | **+electric_transport** (keep mtb/road/snow) |
| Powder House — Main | `powder-house-ski-and-snowboard-main-store` | true/—/— | xc_bike, cruiser_bike, ebike | **+electric_transport** (keep mtb/road/snow) |
| Powder House — Express | `powder-house-express` | true/—/— | xc_bike, cruiser_bike, ebike | **+electric_transport** (keep mtb/road/snow) |
| Watta Bike Shop | `watta-bike-shop` | false/false/false | (none — sales/service) | keep; **MERGE CANDIDATE** w/ ride-tahoe-rentals |

## Already resolved before this wave (no change — confirmed correct)
- `college-cyclery` — deactivated (founder review: retail/service, summer demo bikes only).
- `velo-reno` — deactivated (founder review: retail/service/fitting, no rentals).
- `bike-lake-tahoe` — deactivated, duplicate of `clearly-tahoe-bikes` (same shop, same site).
- `kiwanis-activity-center-and-bike-program` — deactivated (charity bike program — sales/donations, not rentals).

## Decisions for EC
1. **Watta Bike Shop** — co-located with Ride Tahoe Rentals (2025); rentals at that
   address are Ride Tahoe's fleet. Left active as sales/service with offers_rental=false.
   Merge into `ride-tahoe-rentals`, keep separate, or deactivate? (reversible either way)
2. **Bike season-lease filter chips** — no operator in the dataset yet leases bikes
   seasonally, so I added demo filter variants to the taxonomy but **not** lease ones
   (a lease chip with zero operators would be a dead filter). `offers_season_lease`
   still captures it per-operator the moment one is confirmed. Add anyway?
3. **Pacos** rental claim is from Yelp/SierraSun/tahoe.com, not the retail site —
   worth a 2-min founder/phone confirm on fleet + sizes.

## Evidence (pages reviewed)
- Pacos — https://www.pacoscalifornia.com/ ; Yelp; SierraSun "Meet Your Merchant"; tahoe.com
- Black Rock — https://www.blackrockbicycles.com/ (RENTAL glow-package fat/cruiser bikes; Aventon dealer)
- Clearly Tahoe — https://clearlytahoe.com/bike-lake-tahoe/ ; visitlaketahoe.com (Turbo Levo e-MTB, e-/std cruisers, kids)
- Sierra Cyclesmith — https://www.sierracyclesmith.com/ ; pivotcycles.com demo tour
- Powder House — https://tahoepowderhouse.com/bike-rentals/ ; rentals.tahoepowderhouse.com
- Watta Bike — https://wattabike.com/ ; southtahoenow.com (Ride Tahoe co-location, 2025)
- College Cyclery / Velo Reno — retail/service confirmed (SmartEtailing sites, no rental nav)

## Remaining Mountain Biking operators to research
None pending in MTB — Wave 1 (7) + auto-tagged signals (26) + Wave 2 (8) + prior
deactivations cover the active MTB set. Next: Road & Gravel Cycling, then Electric Transportation.
