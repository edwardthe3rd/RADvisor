# Biking re-tag — Mountain Biking, Wave 1 (verified 2026-06-15)

Edits live in `supabase/seed/operator_website_verified.json` (merged to operators.json via `apply_operator_verified.mjs`). NOT pushed to live DB.

Tag vocabulary: Cross-Country Bike, Trail Bike, Enduro Bike, Downhill Bike, E-MTB, Performance Road Bike, Gravel Bike, E-Bike, Cruiser Bike, Tandem Bike, Kids Bike, Playa Bike.

| Operator | Tags before | Tags after | R/D/L | Category recommendation |
|---|---|---|---|---|
| Big Blue Bike Rentals and Tours | ebike, kids_bike, trail_bike | ebike, cruiser_bike, kids_bike | true/false/false | drop mountain_biking (no MTB; paved-path rentals only) |
| Bike Truckee | ebike, ebike_mtb, kids_bike | trail_bike, ebike_mtb, ebike, cruiser_bike, kids_bike, tandem_bike | true/false/false | keep mountain_biking, road_cycling, electric_transport |
| CyclePaths BikeShop | ebike, e_scooter, ebike_mtb, enduro_bike, trail_bike | trail_bike, ebike_mtb, ebike, cruiser_bike | true/false/false | keep mountain_biking, electric_transport; e_scooter dropped (sales only) |
| Dirt Gypsy Adventures | ebike_mtb, gravel_bike, kids_bike, trail_bike | trail_bike, enduro_bike, ebike_mtb, gravel_bike, ebike | true/false/false | drop off_road (MTB/gravel tours, not powersports) |
| Another Bike Shop Reno | downhill_bike, ebike, ebike_mtb, gravel_bike, kids_bike, trail_bike | ebike_mtb, trail_bike, ebike | true/true/false | drop road_cycling (rental fleet is E-MTB/electric town only) |
| Start Haus Ski & Bike | ebike_mtb, enduro_bike, kids_bike, trail_bike | trail_bike, enduro_bike, ebike_mtb, gravel_bike, ebike, kids_bike | true/true/false | add road_cycling (gravel rentals); keep mountain_biking |
| Ride Tahoe Rentals | ebike, ebike_mtb | ebike_mtb, trail_bike, cruiser_bike, ebike, kids_bike | true/false/false | drop road_cycling (no road/gravel rentals); keep mountain_biking, electric_transport |

## Evidence (rental pages reviewed)
- **Big Blue Bike Rentals and Tours** — https://bigbluebikerentals.com/rentals/
- **Bike Truckee** — https://www.truckeebikerentals.com/rent
- **CyclePaths BikeShop** — https://cyclepaths.com/bike-rentals/
- **Dirt Gypsy Adventures** — https://www.dirtgypsyadventures.com/rentals
- **Another Bike Shop Reno** — https://www.anotherbikeshop.com/articles/rentals-pg148.htm
- **Start Haus Ski & Bike** — https://www.starthaus.com/pages/bike-rental
- **Ride Tahoe Rentals** — https://ridetahoerentals.com/

## Remaining Mountain Biking operators to research (44)
Still pending full-fidelity review (JS-rendered sites flagged for the Chrome tool): Flume Trail Bikes*, High Sierra Cycling*, Tahoe Ebikes (timed out), Olympic Bike Shop, Great Basin Bicycles, Truckee River Bikes, Village Ski Loft, Vista Trail Bikes, Tahoe XC, Shoreline of Tahoe, Tahoe Donner Bikeworks, Sierra Cyclesmith, Sierra Ski & Cycle Works, Powder House (x4), West Shore Sports (x3), evo Tahoe City, REI, Tahoe Sports Hub, Tahoe Sports Ltd., The BackCountry, Sports Ltd., South Shore Bikes, South Lake E-bikes, Velo Reno, Watta Bike, Pacos Truckee, College Cyclery, Kiwanis, Olympic Valley Ski & Bike, Mountain Mike’s, Black Rock Bicycles, Black Tie, Bike Lake Tahoe, Clearly Tahoe, Emerald Bay Bikes, RMU Truckee, Tahoe Paddle Sports (x2), Anderson’s (timed out). (*JS-rendered)
