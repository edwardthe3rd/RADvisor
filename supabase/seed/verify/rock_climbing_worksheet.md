# rock_climbing — verification worksheet

Generated: 2026-06-14 · 18 active operators

Re-run: `node supabase/seed/verify/gather_evidence.mjs rock_climbing`

Detected = signals scanned from the website + Google Places text. This is a
**proposal for review**, not applied data.

- **Hard conflicts** contradict current data — resolve these first.
- **Proposals** are additive (e.g. a rental shop that also runs demos, or new
  subcategory tags) — confirm before applying.

## Summary

| Signal | Count |
|--------|------:|
| Rental detected | 9 |
| Demo detected | 1 |
| Lease detected | 1 |
| Retail-only suspected | 0 |
| **Hard conflicts** | **10** |
| Proposals (additive) | 10 |
| Needs manual fetch (no html/Google) | 0 |

## Hard conflicts vs current (review first)

| Operator | Slug | Conflict | Detected | Pages | Snippet |
|------|------|------|------|------:|------|
| Alpenglow Expeditions | `alpenglow-expeditions` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 6 | All Stories Everest Coverage: Summits begin, will chaos ensue? With the 2026 Everest season hitting its most critical stretch, Sam and Adrian are back for their third installment of armchair mountaineering coverage. |
| Alpinistas | `alpinistas` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 6 | Filter 11 products Sort Featured Most relevant Best selling Alphabetically, A-Z Alphabetically, Z-A Price, low to high Price, high to low Date, old to new Date, new to old Sort Large Small List Quick shop Add to cart Alpinistas Good Vibes Tee $34 99 Quick shop |
| High Altitude Fitness | `high-altitude-fitness` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 1 | High Altitude Fitness 0 Skip to Content Climbing Climbing Walls Climbing FAQ Youth Climbing Programs Summer Camps Truckee Location Summer Camps Incline Village Location Special Events/Groups/Private Lessons Fitness Class |
| High Altitude Fitness Truckee | `high-altitude-fitness-truckee` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 1 | High Altitude Fitness 0 Skip to Content Climbing Climbing Walls Climbing FAQ Youth Climbing Programs Summer Camps Truckee Location Summer Camps Incline Village Location Special Events/Groups/Private Lessons Fitness Class |
| Patagonia Outlet | `patagonia-outlet` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 6 | Here you’ll find both current- and past-season clothing for skiing and boarding, climbing, trail running, travel, camping and just hanging out—most at outlet prices. |
| Scheels | `scheels` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 0 | Scheels Chain with apparel, shoes & gear for sports & outdoor recreation, plus merchandise with team logos. Visitors say this sporting goods store offers an unbeatable selection of gear for various sports and outdoor act |
| Tahoe Outdoor Adventures | `tahoe-outdoor-adventures` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 1 | Explore Private Snowboarding Lessons Gain Skills Explore Safe, YEAR-ROUND Activities for all levels Tahoe Outdoor Adventures Offers Year-Round Adventures and Activities! Explore Tahoe with our seasonal tours, ranging from family-friendly outings to advanced, c |
| Tahoe Sports Ltd. | `tahoe-sports-ltd` | offers_season_lease=true but no lease signal found | rental | 6 | - Tahoe Sports ltd Select your language English (US) USD USD CAD Login View all results (0) No products found 0 Cart You have no items in your shopping cart Home Shop SKI Cross Country XC Skis Boots Backcountry Boots Bindings Poles Skins Alpine Ski Skis Boots  |
| Tahoe Via Ferrata | `tahoe-via-ferrata` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 6 | The Tahoe Via Ferrata operates seasonally, typically opening in late spring and running through late fall until winter snow and conditions require closure. |
| Upcycled Adventures | `upcycled-adventures` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 1 | Used Outdoor Gear in Truckee / Upcycled Adventures |

## Proposals — additive, confirm before applying

| Operator | Slug | Proposal | Detected | Snippet |
|------|------|------|------|------|
| Alpenglow Expeditions | `alpenglow-expeditions` | propose subcategories: rope_hardware | — | All Stories Everest Coverage: Summits begin, will chaos ensue? With the 2026 Everest season hitting its most critical stretch, Sam and Adrian are back for their third installment of armchair mountaineering coverage. |
| Alpinistas | `alpinistas` | propose subcategories: climbing_shoes, harness, rope_hardware | — | Filter 11 products Sort Featured Most relevant Best selling Alphabetically, A-Z Alphabetically, Z-A Price, low to high Price, high to low Date, old to new Date, new to old Sort Large Small List Quick shop Add to cart Alpinistas Good Vibes Tee $34 99 Quick shop |
| Nevada Adventure Rentals | `nevada-adventure-rentals` | propose subcategories: harness, rope_hardware | rental | Climbing Gear, Outdoor Equipment, Motorcycle Rentals - Reno, NV Skip to content (775) 686-3557 0 items Products search Shop Climbing Gear Accessories Ascenders & Pulleys Belay Devices Big Wall Bouldering Carabiners / Draws / Slings Chalk Chalk Bags Harnesses H |
| REI | `rei` | propose subcategories: climbing_shoes, crash_pad, harness, rope_hardware | rental | com Home Page Shop Clear Search Search Cancel My REI Find your store Sign In Cart Open menu Close menu My Account - Sign in or Register Camp & Hike All Camp & Hike Camp & Hike All Camp & Hike Hiking Hiking All Hiking Footwear Jackets Shirts Pants Shorts Socks  |
| Sports Ltd. Rentals | `sports-ltd-rentals` | appears to offer a season lease → propose offers_season_lease=true; propose subcategories: climbing_shoes, crash_pad, rope_hardware | rental+lease | - Sports Ltd Rentals E-Bike, Ski, Snowboard, E-Mtn Bike, Camping, & Backcountry Skip to content Sports Ltd Rentals Outdoor Equipment Rental Rentals &#038; Demos Winter Rentals Summer Rentals Book Now Demo Skis 25/26 Demo Ski Program Contact Us Trail Info &#038 |
| Tahoe Mountain Sports | `tahoe-mountain-sports` | propose subcategories: harness, rope_hardware | rental | Shop Our Winter Sale! Tahoe Mountain Sports Shop Men's Shirts Pants Shorts Swimwear Jackets Ski Pants Base Layers Women's Shirts Pants Shorts Swimwear Jackets Ski Pants Base Layers Kid's Footwear Men's Shoes Women's Shoes Winter Boots Socks Accessories Luggage |
| Tahoe Sports Hub | `tahoe-sports-hub` | also appears to offer demos → propose offers_demo=true | rental+demo | Tahoe Sports Hub is Truckee's ski snowboard rental and demo shop. |
| Tahoe Sports Ltd. | `tahoe-sports-ltd` | propose subcategories: climbing_shoes, crash_pad, harness, rope_hardware | rental | - Tahoe Sports ltd Select your language English (US) USD USD CAD Login View all results (0) No products found 0 Cart You have no items in your shopping cart Home Shop SKI Cross Country XC Skis Boots Backcountry Boots Bindings Poles Skins Alpine Ski Skis Boots  |
| Tahoe Via Ferrata | `tahoe-via-ferrata` | propose subcategories: harness, rope_hardware | — | The Tahoe Via Ferrata operates seasonally, typically opening in late spring and running through late fall until winter snow and conditions require closure. |
| The Home Depot | `the-home-depot` | propose subcategories: rope_hardware | rental | The Home Depot Chain home improvement retailer for tools, appliances & other products (some offer truck rentals). |

## Needs manual fetch (website + Google both empty)

_None._

## All operators (detected signals + proposed subcategories)

| Operator | Slug | Detected | Subcategories (detected) | Current flags |
|------|------|------|------|------|
| Alpenglow Expeditions | `alpenglow-expeditions` | — | rope_hardware | rental |
| Alpinistas | `alpinistas` | — | climbing_shoes, harness, rope_hardware | rental |
| High Altitude Fitness | `high-altitude-fitness` | — | — | rental |
| High Altitude Fitness Truckee | `high-altitude-fitness-truckee` | — | — | rental |
| Mesa Rim Climbing Center | `mesa-rim-climbing-center` | rental | — | rental |
| Nevada Adventure Rentals | `nevada-adventure-rentals` | rental | harness, rope_hardware | rental |
| Patagonia Outlet | `patagonia-outlet` | — | — | rental |
| REI | `rei` | rental | climbing_shoes, crash_pad, harness, rope_hardware | rental |
| Scheels | `scheels` | — | — | rental |
| Sierra Adventures | `sierra-adventures-activities-reno-tahoe-llc` | rental | — | rental |
| Sports Ltd. Rentals | `sports-ltd-rentals` | rental+lease | climbing_shoes, crash_pad, rope_hardware | rental |
| Tahoe Mountain Sports | `tahoe-mountain-sports` | rental | harness, rope_hardware | rental |
| Tahoe Outdoor Adventures | `tahoe-outdoor-adventures` | — | — | rental |
| Tahoe Sports Hub | `tahoe-sports-hub` | rental+demo | — | rental |
| Tahoe Sports Ltd. | `tahoe-sports-ltd` | rental | climbing_shoes, crash_pad, harness, rope_hardware | rental+lease |
| Tahoe Via Ferrata | `tahoe-via-ferrata` | — | harness, rope_hardware | rental |
| The Home Depot | `the-home-depot` | rental | rope_hardware | rental |
| Upcycled Adventures | `upcycled-adventures` | — | — | rental |

