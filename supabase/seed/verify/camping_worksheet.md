# camping — verification worksheet

Generated: 2026-06-14 · 25 active operators

Re-run: `node supabase/seed/verify/gather_evidence.mjs camping`

Detected = signals scanned from the website + Google Places text. This is a
**proposal for review**, not applied data.

- **Hard conflicts** contradict current data — resolve these first.
- **Proposals** are additive (e.g. a rental shop that also runs demos, or new
  subcategory tags) — confirm before applying.

## Summary

| Signal | Count |
|--------|------:|
| Rental detected | 15 |
| Demo detected | 1 |
| Lease detected | 1 |
| Retail-only suspected | 1 |
| **Hard conflicts** | **11** |
| Proposals (additive) | 14 |
| Needs manual fetch (no html/Google) | 0 |

## Hard conflicts vs current (review first)

| Operator | Slug | Conflict | Detected | Pages | Snippet |
|------|------|------|------|------:|------|
| Alpinistas | `alpinistas` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 6 | Filter 11 products Sort Featured Most relevant Best selling Alphabetically, A-Z Alphabetically, Z-A Price, low to high Price, high to low Date, old to new Date, new to old Sort Large Small List Quick shop Add to cart Alpinistas Good Vibes Tee $34 99 Quick shop |
| Camping World - Reno | `camping-world-reno` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 6 | ; MS – A Document/Service Fee is not an official fee and is not required by law, however, it may be charged to a buyer for the preparation, handling and processing of documents and the performance of services related to the sale or lease of a motor vehicle and |
| Heavenly Sports - Tamarack Lodge | `heavenly-sports-tamarack-lodge` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 0 | Heavenly Sports - Tamarack Lodge  ski_resort sporting_goods_store sports_activity_location store point_of_interest establishment |
| Mark Fore and Strike | `mark-fore-and-strike` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?); looks retail-only — review for deactivation | retail? | 3 | Mark Fore and Strike - Reno Gun Shop and Outdoor Sporting Goods 775-322-9559 info@markforestrike.com Facebook Facebook Reno&#8217;s Best Outdoor Sporting Goods Home Products About Us Contact Select Page Hunting, Fishing |
| Patagonia | `patagonia` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 6 | Shop Food & Beer A group of climbing friends—including Tommy Caldwell, Sonnie Trotter and their families—gather between vans for an end-of-season potluck dinner in Yosemite National Park, California. |
| Patagonia Outlet | `patagonia-outlet` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 6 | Here you’ll find both current- and past-season clothing for skiing and boarding, climbing, trail running, travel, camping and just hanging out—most at outlet prices. |
| Scheels | `scheels` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 0 | Scheels Chain with apparel, shoes & gear for sports & outdoor recreation, plus merchandise with team logos. Visitors say this sporting goods store offers an unbeatable selection of gear for various sports and outdoor act |
| South Passage Outfitters | `south-passage-outfitters` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 0 | South Passage Outfitters  point_of_interest service establishment |
| Tahoe Sports Ltd. | `tahoe-sports-ltd` | offers_season_lease=true but no lease signal found | rental | 6 | - Tahoe Sports ltd Select your language English (US) USD USD CAD Login View all results (0) No products found 0 Cart You have no items in your shopping cart Home Shop SKI Cross Country XC Skis Boots Backcountry Boots Bindings Poles Skins Alpine Ski Skis Boots  |
| Technical Equipment Cleaners | `technical-equipment-cleaners` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 3 | Outdoor Gear Cleaning / Technical Equipment Cleaners / Truckee top of page Keeping it clean since 2006! Home About Us Shop Policy Pricing & Services Drop Offs & Remote Repairs Contact Us More... Use tab to navigate throu |
| Upcycled Adventures | `upcycled-adventures` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 1 | Used Outdoor Gear in Truckee / Upcycled Adventures |

## Proposals — additive, confirm before applying

| Operator | Slug | Proposal | Detected | Snippet |
|------|------|------|------|------|
| Alpinistas | `alpinistas` | propose subcategories: backpack, sleep_system, tent | — | Filter 11 products Sort Featured Most relevant Best selling Alphabetically, A-Z Alphabetically, Z-A Price, low to high Price, high to low Date, old to new Date, new to old Sort Large Small List Quick shop Add to cart Alpinistas Good Vibes Tee $34 99 Quick shop |
| Gear Hut | `gear-hut` | propose subcategories: backpack, camp_furniture, cooking, sleep_system, tent | rental | Used Outdoor Gear and Consignment / Gear Hut / Reno top of page The Biggest Little Gear Shop Consignor Login Request A Check 775-219-4612 Home HOW IT WORKS Selling Options Consignment What We Take Non Profits Featured Items About Us FAQ Services Bear Can Renta |
| Mountain Vibes Specialty Rentals | `mountain-vibes-specialty-rentals` | propose subcategories: tent | rental | Mountain Vibes Specialty Rentals &#8211; Specialty Event Rentals Serving the Lake Tahoe Region Contact us BLOG Phone: (775) 742-4282 Phone: (775) 742-4282 Any questions mountainvibesrentals@gmail. |
| Nevada Adventure Rentals | `nevada-adventure-rentals` | propose subcategories: cooking, sleep_system, tent | rental | Climbing Gear, Outdoor Equipment, Motorcycle Rentals - Reno, NV Skip to content (775) 686-3557 0 items Products search Shop Climbing Gear Accessories Ascenders & Pulleys Belay Devices Big Wall Bouldering Carabiners / Draws / Slings Chalk Chalk Bags Harnesses H |
| Patagonia | `patagonia` | propose subcategories: backpack | — | Shop Food & Beer A group of climbing friends—including Tommy Caldwell, Sonnie Trotter and their families—gather between vans for an end-of-season potluck dinner in Yosemite National Park, California. |
| Patagonia Outlet | `patagonia-outlet` | propose subcategories: backpack | — | Here you’ll find both current- and past-season clothing for skiing and boarding, climbing, trail running, travel, camping and just hanging out—most at outlet prices. |
| REI | `rei` | propose subcategories: backpack, camp_furniture, cooking, sleep_system, tent | rental | com Home Page Shop Clear Search Search Cancel My REI Find your store Sign In Cart Open menu Close menu My Account - Sign in or Register Camp & Hike All Camp & Hike Camp & Hike All Camp & Hike Hiking Hiking All Hiking Footwear Jackets Shirts Pants Shorts Socks  |
| REI Bike Shop | `rei-bike-shop` | propose subcategories: backpack, camp_furniture, cooking, sleep_system, tent | rental | com Home Page Shop Clear Search Search Cancel My REI Find your store Sign In Cart Open menu Close menu My Account - Sign in or Register Camp & Hike All Camp & Hike Camp & Hike All Camp & Hike Hiking Hiking All Hiking Footwear Jackets Shirts Pants Shorts Socks  |
| Reno Hexayurt | `reno-hexayurt` | propose subcategories: camp_furniture, cooking, full_kit, tent | rental | Hexayurt Shelter for Events & Festivals Reno Hexayurt Skip to content 2026 WE WILL BE PROVIDING OSS AT BURNING MAN Buy Buy Hexayurt Original Generator USED Generator OSS Rental OSS Rental H10 Hybrid (OSS) H12 Original (OSS) H15 Tall Original (OSS) Generator (O |
| Sports Ltd. Rentals | `sports-ltd-rentals` | appears to offer a season lease → propose offers_season_lease=true; propose subcategories: backpack, camp_furniture, cooking, sleep_system, tent | rental+lease | - Sports Ltd Rentals E-Bike, Ski, Snowboard, E-Mtn Bike, Camping, & Backcountry Skip to content Sports Ltd Rentals Outdoor Equipment Rental Rentals &#038; Demos Winter Rentals Summer Rentals Book Now Demo Skis 25/26 Demo Ski Program Contact Us Trail Info &#038 |
| Tahoe Mountain Sports | `tahoe-mountain-sports` | propose subcategories: backpack, cooking, sleep_system, tent | rental | Shop Our Winter Sale! Tahoe Mountain Sports Shop Men's Shirts Pants Shorts Swimwear Jackets Ski Pants Base Layers Women's Shirts Pants Shorts Swimwear Jackets Ski Pants Base Layers Kid's Footwear Men's Shoes Women's Shoes Winter Boots Socks Accessories Luggage |
| Tahoe Sports Hub | `tahoe-sports-hub` | also appears to offer demos → propose offers_demo=true | rental+demo | Tahoe Sports Hub is Truckee's ski snowboard rental and demo shop. |
| Tahoe Sports Ltd. | `tahoe-sports-ltd` | propose subcategories: cooking, tent | rental | - Tahoe Sports ltd Select your language English (US) USD USD CAD Login View all results (0) No products found 0 Cart You have no items in your shopping cart Home Shop SKI Cross Country XC Skis Boots Backcountry Boots Bindings Poles Skins Alpine Ski Skis Boots  |
| Technical Equipment Cleaners | `technical-equipment-cleaners` | propose subcategories: backpack, sleep_system, tent | — | Outdoor Gear Cleaning / Technical Equipment Cleaners / Truckee top of page Keeping it clean since 2006! Home About Us Shop Policy Pricing & Services Drop Offs & Remote Repairs Contact Us More... Use tab to navigate throu |

## Needs manual fetch (website + Google both empty)

_None._

## All operators (detected signals + proposed subcategories)

| Operator | Slug | Detected | Subcategories (detected) | Current flags |
|------|------|------|------|------|
| AZCO Rustic Designs and Rentals | `azco-rustic-designs-and-rentals` | rental | — | rental |
| Alpinistas | `alpinistas` | — | backpack, sleep_system, tent | rental |
| Camping World - Reno | `camping-world-reno` | — | — | rental |
| Emerald Bay Bikes | `emerald-bay-bikes` | rental | — | rental |
| Gear Hut | `gear-hut` | rental | backpack, camp_furniture, cooking, sleep_system, tent | rental |
| Heavenly Sports - Tamarack Lodge | `heavenly-sports-tamarack-lodge` | — | — | rental |
| Mark Fore and Strike | `mark-fore-and-strike` | retail? | — | rental |
| Mountain Vibes Specialty Rentals | `mountain-vibes-specialty-rentals` | rental | tent | rental |
| Nevada Adventure Rentals | `nevada-adventure-rentals` | rental | cooking, sleep_system, tent | rental |
| Patagonia | `patagonia` | — | backpack | rental |
| Patagonia Outlet | `patagonia-outlet` | — | backpack | rental |
| REI | `rei` | rental | backpack, camp_furniture, cooking, sleep_system, tent | rental |
| REI Bike Shop | `rei-bike-shop` | rental | backpack, camp_furniture, cooking, sleep_system, tent | rental |
| Reno Hexayurt | `reno-hexayurt` | rental | camp_furniture, cooking, full_kit, tent | rental |
| Rentools | `rentools` | rental | — | rental |
| Scheels | `scheels` | — | — | rental |
| Sierra Adventures | `sierra-adventures-activities-reno-tahoe-llc` | rental | — | rental |
| South Passage Outfitters | `south-passage-outfitters` | — | — | rental |
| Sports Ltd. Rentals | `sports-ltd-rentals` | rental+lease | backpack, camp_furniture, cooking, sleep_system, tent | rental |
| Tahoe Mountain Sports | `tahoe-mountain-sports` | rental | backpack, cooking, sleep_system, tent | rental |
| Tahoe Sports Hub | `tahoe-sports-hub` | rental+demo | — | rental |
| Tahoe Sports Ltd. | `tahoe-sports-ltd` | rental | cooking, tent | rental+lease |
| Technical Equipment Cleaners | `technical-equipment-cleaners` | — | backpack, sleep_system, tent | rental |
| Upcycled Adventures | `upcycled-adventures` | — | — | rental |
| evo Tahoe City | `evo-tahoe-city` | rental | — | rental |

