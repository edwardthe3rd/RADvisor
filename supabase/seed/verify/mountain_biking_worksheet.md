# mountain_biking — verification worksheet

Generated: 2026-06-14 · 51 active operators

Re-run: `node supabase/seed/verify/gather_evidence.mjs mountain_biking`

Detected = signals scanned from the website + Google Places text. This is a
**proposal for review**, not applied data.

- **Hard conflicts** contradict current data — resolve these first.
- **Proposals** are additive (e.g. a rental shop that also runs demos, or new
  subcategory tags) — confirm before applying.

## Summary

| Signal | Count |
|--------|------:|
| Rental detected | 44 |
| Demo detected | 4 |
| Lease detected | 5 |
| Retail-only suspected | 0 |
| **Hard conflicts** | **11** |
| Proposals (additive) | 36 |
| Needs manual fetch (no html/Google) | 0 |

## Hard conflicts vs current (review first)

| Operator | Slug | Conflict | Detected | Pages | Snippet |
|------|------|------|------|------:|------|
| Bike Lake Tahoe | `bike-lake-tahoe` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 1 | Bike Lake Tahoe  bicycle_store sporting_goods_store manufacturer store point_of_interest service establishment |
| College Cyclery | `college-cyclery` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 6 | College Cyclery / Reno, NV / Bike Shop Skip to main content Free Parking in the Rear! Use the back lot and rear entrance for easy access! Toggle navigation Search Search Store Menu x Store Store Shop Bikes Bikes Road/Gra |
| Kiwanis Activity Center and Bike Program | `kiwanis-activity-center-and-bike-program` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 1 | Kiwanis Bike Program - Kiwanis Bike Program Home Kiwanis Bike Program Home Bikes Bike Clinics Bike Sales Clubs Rodeos Learn to repair Bike Donations Bike Consignments Bike Swaps Burning Man Bike Sales Bike Volunteer Earn |
| Pacos Truckee | `pacos-truckee` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 6 | Specialized S-Works Demo 11 $11,000. |
| RMU Truckee Ski Shop | `rmu-truckee-ski-shop` | offers_demo=true but no demo signal found | — | 6 | RMU Truckee High Quality Handmade Skis, full service tune shop, Packs, Bar and Food Skip to content Pause slideshow Play slideshow NIGHTTRAIN - Mercury Colorway now available! FREE SHIPPING IN NORTH AMERICA icon-X Close menu BIKE NIGHTTRAIN Mercury NIGHTTRAIN  |
| Sierra Cyclesmith Bicycle Shop | `sierra-cyclesmith-bicycle-shop` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 6 | Sierra Cyclesmith / Reno, NV Skip to main content Mon - Fri: 11:00am - 6:00pm Sat: 10:00am - 5:00pm Sun: Closed Store Store Account Account Cart Cart (0) Subtotal : $ 0.00 Checkout Cart Toggle navigation Search Search Me |
| Tahoe Sports Ltd. | `tahoe-sports-ltd` | offers_season_lease=true but no lease signal found | rental | 6 | - Tahoe Sports ltd Select your language English (US) USD USD CAD Login View all results (0) No products found 0 Cart You have no items in your shopping cart Home Shop SKI Cross Country XC Skis Boots Backcountry Boots Bindings Poles Skins Alpine Ski Skis Boots  |
| Velo Reno | `velo-reno` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 2 | Save Money Join our mailing list to find out first about our shop's seasonal sales! Clean & Easy Velo Reno has a large inventory on nutrition, tools, riding accessories and clothing. |
| West Shore Sports | `west-shore-sports` | offers_season_lease=true but no lease signal found | rental | 6 | Home Summer - West Shore Sports a Summer Rentals for the Whole family With 3 Locations on Tahoe’s West Shore view rentals Summer Rentals *All rentals are first come first served and require a credit or debit card deposit Kayaks view rentals Bicycle view rental |
| West Shore Sports | `west-shore-sports-qmz5wvbk` | offers_season_lease=true but no lease signal found | rental | 6 | Home Summer - West Shore Sports a Summer Rentals for the Whole family With 3 Locations on Tahoe’s West Shore view rentals Summer Rentals *All rentals are first come first served and require a credit or debit card deposit Kayaks view rentals Bicycle view rental |
| West Shore Sports | `west-shore-sports-sunnyside` | offers_season_lease=true but no lease signal found | rental | 6 | Home Summer - West Shore Sports a Summer Rentals for the Whole family With 3 Locations on Tahoe’s West Shore view rentals Summer Rentals *All rentals are first come first served and require a credit or debit card deposit Kayaks view rentals Bicycle view rental |

## Proposals — additive, confirm before applying

| Operator | Slug | Proposal | Detected | Snippet |
|------|------|------|------|------|
| Anderson's Bicycle Rental | `andersons-bicycle-rental` | propose subcategories: kids_bike | rental | Home - Anderson&#039;s Bicycle Rental Bikes Are First Come, First Served Basis Only Best of Tahoe 2025 Winner Sports and Recreation ~ Best Summer Activity Anderson&#039;s Bicycle Rental Home About Us Bicycles &#038; Rates Group Reservations FAQ Activities Guid |
| Another Bike Shop Reno | `another-bike-shop-reno` | propose subcategories: downhill_bike, ebike_mtb, kids_bike, trail_bike | rental | Santa Cruz Bicycles Smith Optics Specialized Shop All Specialized Bikes Frames Apparel & Acccessories Components Thule Transition Bikes Troy Lee Designs Rentals Services Bike Repair Suspension Service Gear Selection Financing Mini Service Classes About Careers |
| Big Blue Bike Rentals and Tours | `big-blue-bike-rentals-and-tours` | propose subcategories: kids_bike, trail_bike | rental | Lake Tahoe Bike Rentals with Big Blue Bike Rentals Skip to content Book Now Bike Rentals Rides East Shore Trail Flume Trail Blog Things to Do Visit Us in SF Contact Us Contact Us Group Rentals About Us Bike Rentals Rides East Shore Trail Flume Trail Things to  |
| Bike Truckee | `bike-truckee` | propose subcategories: ebike_mtb, kids_bike | rental | HOME / Bike Truckee / eBike Retailer / Bike Rentals top of page OFFERING BIKE SERVICE AND REPAIRS YEAR ROUND BOOK YOUR BIKE NOW A minimum of 24 hours' advance booking is required Walk-ins are welcome 530. |
| College Cyclery | `college-cyclery` | propose subcategories: ebike_mtb, trail_bike | — | College Cyclery / Reno, NV / Bike Shop Skip to main content Free Parking in the Rear! Use the back lot and rear entrance for easy access! Toggle navigation Search Search Store Menu x Store Store Shop Bikes Bikes Road/Gra |
| CyclePaths BikeShop | `cyclepaths-bikeshop` | propose subcategories: ebike_mtb, enduro_bike, trail_bike | rental | 00 HOME SHOP Amflow eMTB Deviate Marin Bikes Murf Electric Bikes Rocky Mountain Santa Cruz Segway E-Bikes &#038; E-Scooters BIKE RENTALS SERVICE APPOINTMENT TRAIL INFO ABOUT About Us Events Refunds &#038; Returns CONTACT HOME SHOP Amflow eMTB Deviate Marin Bik |
| Dirt Gypsy Adventures | `dirt-gypsy-adventures` | propose subcategories: ebike_mtb, kids_bike, trail_bike | rental | Dirt Gypsy Adventures - Mountain & Gravel Bike Tours, Rentals, Trailhead Shuttles & Skills Clinics - 11410 Deerfield Dive, Truckee, CA top of page Schedule A Call Contact Us 530-580-7447 TOURS Mountain Gravel One-Day MTB One-Day Gravel Multi-Day RENTALS SHUTTL |
| Flume Trail Bikes | `flume-trail-bikes` | propose subcategories: ebike_mtb, kids_bike, trail_bike, xc_bike | rental | Flume Trail Bikes 0 Skip to Content Mountain Bike Rentals 2026 Shuttles Path Bike Rentals How to Get Here About Us Contact Open Menu Close Menu Mountain Bike Rentals 2026 Shuttles Path Bike Rentals How to Get Here About Us Contact Open Menu Close Menu Mountain |
| Great Basin Bicycles | `great-basin-bicycles` | propose subcategories: enduro_bike | rental | Rental of garmin Vector 3 pedals Follow this link for more info! 775-825-8258 8048 S Virginia St Reno, NV 89511 (behind the Human Bean coffee kiosk) Store Hours: M-F 10:00a – 6:00p Sat 10:00a – 5:00p Sun Closed We are open Monday through Saturday year round. |
| Powder House — Lake Tahoe Bike Rentals | `lake-tahoe-bike-rentals` | appears to offer a season lease → propose offers_season_lease=true | rental+lease | South Lake Tahoe Ski Rentals & Snowboard Rentals Rates Heavenly Village Mini Golf Ski and Snowboard Season Leases Ski Rental Rates Snowboard Rental Rates Snowshoes Rental Rates Ski Clothing Rental Rates Reservations Ski and Snowboard Sales View all Ski & Snowb |
| Olympic Bike Shop | `olympic-bike-shop` | propose subcategories: downhill_bike, kids_bike, trail_bike | rental | Olympic Bike Shop / North Lake Tahoe Skip to main content Toggle navigation Store Store Account Account Shop Menu has items Bikes Bikes Road Gravel Mountain Commuter/Urban Comfort Cruiser Fitness Hybrid Children's Other Electric Electric Bikes Wheels Wheels Pa |
| Olympic Valley Ski & Bike | `olympic-valley-ski-bike` | also appears to offer demos → propose offers_demo=true; propose subcategories: kids_bike | rental+demo | 4707 / A full service Rental, Demo and Tuning Ski Shop 530. |
| Pacos Truckee | `pacos-truckee` | propose subcategories: ebike_mtb, trail_bike, xc_bike | — | Specialized S-Works Demo 11 $11,000. |
| Pine Nut Ebike Rentals South Lake Tahoe | `pine-nut-ebike-rentals-south-lake-tahoe` | propose subcategories: ebike_mtb, kids_bike | rental | E-bike Rentals South Lake Tahoe - Best Rates and Biggest Fleet 0 Skip to Content Rates Store Info Contact About Blog book now Open Menu Close Menu book now Rates Store Info Contact About Blog Open Menu Close Menu Rates Store Folder: Info Back Contact About Blo |
| Powder House Ski and Snowboard At The Gondola | `powder-house-ski-and-snowboard-at-the-gondola` | appears to offer a season lease → propose offers_season_lease=true | rental+lease | Powder House at the Gondola - Tahoe Powder House Rates Heavenly Village Mini Golf Ski and Snowboard Season Leases Ski Rental Rates Snowboard Rental Rates Snowshoes Rental Rates Ski Clothing Rental Rates Reservations Ski and Snowboard Sales View all Ski & Snowb |
| Powder House Ski and Snowboard Main Store | `powder-house-ski-and-snowboard-main-store` | appears to offer a season lease → propose offers_season_lease=true | rental+lease | Powder House Main Store - Tahoe Powder House Rates Heavenly Village Mini Golf Ski and Snowboard Season Leases Ski Rental Rates Snowboard Rental Rates Snowshoes Rental Rates Ski Clothing Rental Rates Reservations Ski and Snowboard Sales View all Ski & Snowboard |
| Powder House Express | `powder-house-express` | appears to offer a season lease → propose offers_season_lease=true | rental+lease | Powder House Express - Tahoe Powder House Rates Heavenly Village Mini Golf Ski and Snowboard Season Leases Ski Rental Rates Snowboard Rental Rates Snowshoes Rental Rates Ski Clothing Rental Rates Reservations Ski and Snowboard Sales View all Ski & Snowboards S |
| REI Bike Shop | `rei-bike-shop` | propose subcategories: ebike_mtb, kids_bike | rental | com Home Page Shop Clear Search Search Cancel My REI Find your store Sign In Cart Open menu Close menu My Account - Sign in or Register Camp & Hike All Camp & Hike Camp & Hike All Camp & Hike Hiking Hiking All Hiking Footwear Jackets Shirts Pants Shorts Socks  |
| RMU Truckee Ski Shop | `rmu-truckee-ski-shop` | propose subcategories: ebike_mtb, enduro_bike | — | RMU Truckee High Quality Handmade Skis, full service tune shop, Packs, Bar and Food Skip to content Pause slideshow Play slideshow NIGHTTRAIN - Mercury Colorway now available! FREE SHIPPING IN NORTH AMERICA icon-X Close menu BIKE NIGHTTRAIN Mercury NIGHTTRAIN  |
| Ride Tahoe Rentals | `ride-tahoe-rentals` | propose subcategories: ebike_mtb | rental | Ride Tahoe Rentals - High Performance MTB and E-MTB Rentals Skip to content Rentals Repairs &#038; Tuneups Trails Faqs Social Media Book Now Main Menu Rentals Repars &#038; Tuneups Trails Faqs Social Media Book Now info@ridetahoerentals. |
| Shoreline of Tahoe | `shoreline-of-tahoe` | propose subcategories: kids_bike | rental | Parts/Tools Rentals Expand submenu Collapse submenu Rentals Bike Rentals Ski Rentals Snowboard Rentals Snowshoes Rental Brands Gift card Tech Shop Search Log in Search LOGIN Shoreline Tahoe Snowboard Snowboards Men's Snowboards Women's Snowboards Youth Snowboa |
| Sierra Cyclesmith Bicycle Shop | `sierra-cyclesmith-bicycle-shop` | propose subcategories: ebike_mtb, kids_bike, trail_bike | — | Sierra Cyclesmith / Reno, NV Skip to main content Mon - Fri: 11:00am - 6:00pm Sat: 10:00am - 5:00pm Sun: Closed Store Store Account Account Cart Cart (0) Subtotal : $ 0.00 Checkout Cart Toggle navigation Search Search Me |
| Sierra Ski & Cycle Works | `sierra-ski-cycle-works` | propose subcategories: xc_bike | rental | 1980 Skip to main content Menu Home About Bike Ski Spoke Junkie Contact facebook Close Search Tahoe Original Since 1980 Sierra Ski & Cycle Works specializes in service, repairs, sales and rentals. |
| Sports Ltd. Rentals | `sports-ltd-rentals` | appears to offer a season lease → propose offers_season_lease=true | rental+lease | - Sports Ltd Rentals E-Bike, Ski, Snowboard, E-Mtn Bike, Camping, & Backcountry Skip to content Sports Ltd Rentals Outdoor Equipment Rental Rentals &#038; Demos Winter Rentals Summer Rentals Book Now Demo Skis 25/26 Demo Ski Program Contact Us Trail Info &#038 |
| Start Haus Ski & Bike | `start-haus-ski-bike` | also appears to offer demos → propose offers_demo=true; propose subcategories: ebike_mtb, enduro_bike, kids_bike, trail_bike | rental+demo | Start Haus Truckee Ski & Bike Sales and Service in North Lake Tahoe Skip to content Rent a Bike! FREE SHIPPING OVER $50* (530) 582-5781 My Account Login Create Account Bikes Full Suspension Hardtail E-Bikes Gravel Road Bikes Junior Bikes Women's Bikes Bike Acc |
| Tahoe Donner Bikeworks | `tahoe-donner-bikeworks` | propose subcategories: ebike_mtb | rental | Bikeworks / Tahoe Donner Search site: Community Amenities Members News + Events Ski Resort XC Ski ShopTD Member Portal Bikeworks Equestrian Center Golf Course Community General About Us Vision + Mission Location Welcome FAQs General FAQs Tahoe Donner Amenities |
| Tahoe Ebikes | `tahoe-ebikes` | propose subcategories: ebike_mtb | rental | Home / Tahoe Ebikes top of page Tahoe eBikes Home Used eBike Sale New Inventory Rental Rates The Mountain Fleet The Pavement Fleet Repair Disc Golf About Us Contact Us YouTube Channel More. |
| Tahoe Sports Hub | `tahoe-sports-hub` | also appears to offer demos → propose offers_demo=true | rental+demo | Tahoe Sports Hub is Truckee's ski snowboard rental and demo shop. |
| Tahoe Sports Ltd. | `tahoe-sports-ltd` | propose subcategories: kids_bike | rental | - Tahoe Sports ltd Select your language English (US) USD USD CAD Login View all results (0) No products found 0 Cart You have no items in your shopping cart Home Shop SKI Cross Country XC Skis Boots Backcountry Boots Bindings Poles Skins Alpine Ski Skis Boots  |
| The BackCountry | `the-backcountry` | propose subcategories: ebike_mtb, kids_bike | rental | The BackCountry Shop / The BackCountry in Truckee, CA - The BackCountry Open Daily 8a-6p / 530-582-0909 / [email&#160;protected] Account Wish List Compare Go to account settings Cart 0 items Submit View all results ( ) Products Back Products SALE Back SALE All |
| Truckee River Bikes | `truckee-river-bikes` | propose subcategories: kids_bike | rental | Olympic Valley and North Tahoe&#039;s Best Bike Rentals - Truckee River Bikes Skip to content Call Us! (530) 581-3399 Toggle Navigation Home Bike Rentals Bike Rental Info E-Bikes Reservations Bike Sales Bike Service Local Rides Trail Map Blog Contact Call Us!  |
| Village Ski Loft | `village-ski-loft` | also appears to offer demos → propose offers_demo=true; propose subcategories: ebike_mtb, kids_bike, trail_bike | rental+demo | Village Ski Loft Lake Tahoe top of page The Village Ski Loft Incline Village, NV - Lake Tahoe 775-831-3537 HOME RENT NOW Bike Rentals Skis & Boards Nordic, Snowshoes, Sleds Where to Ski & Ride WINTER SERVICES Expert Boot Fitting Services Overnight Tuning and R |
| Vista Trail Bikes | `vista-trail-bikes` | propose subcategories: kids_bike, trail_bike | rental | Lake Tahoe Bike Rentals - Vista Trail Bikes Skip to content 1 (775) 298-7431 rides@vistatrailbikes. |
| West Shore Sports | `west-shore-sports` | propose subcategories: kids_bike | rental | Home Summer - West Shore Sports a Summer Rentals for the Whole family With 3 Locations on Tahoe’s West Shore view rentals Summer Rentals *All rentals are first come first served and require a credit or debit card deposit Kayaks view rentals Bicycle view rental |
| West Shore Sports | `west-shore-sports-qmz5wvbk` | propose subcategories: kids_bike | rental | Home Summer - West Shore Sports a Summer Rentals for the Whole family With 3 Locations on Tahoe’s West Shore view rentals Summer Rentals *All rentals are first come first served and require a credit or debit card deposit Kayaks view rentals Bicycle view rental |
| West Shore Sports | `west-shore-sports-sunnyside` | propose subcategories: kids_bike | rental | Home Summer - West Shore Sports a Summer Rentals for the Whole family With 3 Locations on Tahoe’s West Shore view rentals Summer Rentals *All rentals are first come first served and require a credit or debit card deposit Kayaks view rentals Bicycle view rental |

## Needs manual fetch (website + Google both empty)

_None._

## All operators (detected signals + proposed subcategories)

| Operator | Slug | Detected | Subcategories (detected) | Current flags |
|------|------|------|------|------|
| Anderson's Bicycle Rental | `andersons-bicycle-rental` | rental | kids_bike | rental |
| Another Bike Shop Reno | `another-bike-shop-reno` | rental | downhill_bike, ebike_mtb, kids_bike, trail_bike | rental |
| Big Blue Bike Rentals and Tours | `big-blue-bike-rentals-and-tours` | rental | kids_bike, trail_bike | rental |
| Bike Lake Tahoe | `bike-lake-tahoe` | — | — | rental |
| Bike Truckee | `bike-truckee` | rental | ebike_mtb, kids_bike | rental |
| Black Rock Bicycles | `black-rock-bicycles` | rental | — | rental |
| Black Tie Bike Rentals North Tahoe | `black-tie-adventure-rentals-north-tahoe` | rental | — | rental |
| College Cyclery | `college-cyclery` | — | ebike_mtb, trail_bike | rental |
| CyclePaths BikeShop | `cyclepaths-bikeshop` | rental | ebike_mtb, enduro_bike, trail_bike | rental |
| Dirt Gypsy Adventures | `dirt-gypsy-adventures` | rental | ebike_mtb, kids_bike, trail_bike | rental |
| Emerald Bay Bikes | `emerald-bay-bikes` | rental | — | rental |
| Flume Trail Bikes | `flume-trail-bikes` | rental | ebike_mtb, kids_bike, trail_bike, xc_bike | rental |
| Great Basin Bicycles | `great-basin-bicycles` | rental | enduro_bike | rental |
| High Sierra Cycling | `high-sierra-cycling` | rental | — | rental |
| Kiwanis Activity Center and Bike Program | `kiwanis-activity-center-and-bike-program` | — | — | rental |
| Powder House — Lake Tahoe Bike Rentals | `lake-tahoe-bike-rentals` | rental+lease | — | rental |
| Olympic Bike Shop | `olympic-bike-shop` | rental | downhill_bike, kids_bike, trail_bike | rental |
| Olympic Valley Ski & Bike | `olympic-valley-ski-bike` | rental+demo | kids_bike | rental |
| Pacos Truckee | `pacos-truckee` | — | ebike_mtb, trail_bike, xc_bike | rental |
| Pine Nut Ebike Rentals South Lake Tahoe | `pine-nut-ebike-rentals-south-lake-tahoe` | rental | ebike_mtb, kids_bike | rental |
| Powder House Ski and Snowboard At The Gondola | `powder-house-ski-and-snowboard-at-the-gondola` | rental+lease | — | rental |
| Powder House Ski and Snowboard Main Store | `powder-house-ski-and-snowboard-main-store` | rental+lease | — | rental |
| Powder House Express | `powder-house-express` | rental+lease | — | rental |
| REI Bike Shop | `rei-bike-shop` | rental | ebike_mtb, kids_bike | rental |
| RMU Truckee Ski Shop | `rmu-truckee-ski-shop` | — | ebike_mtb, enduro_bike | demo |
| Ride Tahoe Rentals | `ride-tahoe-rentals` | rental | ebike_mtb | rental |
| Shoreline of Tahoe | `shoreline-of-tahoe` | rental | kids_bike | rental |
| Sierra Cyclesmith Bicycle Shop | `sierra-cyclesmith-bicycle-shop` | — | ebike_mtb, kids_bike, trail_bike | rental |
| Sierra Ski & Cycle Works | `sierra-ski-cycle-works` | rental | xc_bike | rental |
| South Lake E-bikes | `south-lake-e-bikes` | rental | — | rental |
| South Shore Bikes | `south-shore-bikes` | rental | — | rental |
| Sports Ltd. Rentals | `sports-ltd-rentals` | rental+lease | — | rental |
| Start Haus Ski & Bike | `start-haus-ski-bike` | rental+demo | ebike_mtb, enduro_bike, kids_bike, trail_bike | rental |
| Tahoe Bike Company | `tahoe-bike-company` | rental | — | rental |
| Tahoe Donner Bikeworks | `tahoe-donner-bikeworks` | rental | ebike_mtb | rental |
| Tahoe Ebikes | `tahoe-ebikes` | rental | ebike_mtb | rental |
| Tahoe XC | `tahoe-xc` | rental | — | rental |
| Tahoe Paddle Sports — Sand Harbor | `tahoe-paddle-sports-sand-harbor-clear-kayaking` | rental | — | rental |
| Tahoe Paddle Sports | `tahoe-paddle-sports-clear-kayak-adventures-near-south-lake-tahoe-ca` | rental | — | rental |
| Tahoe Sports Hub | `tahoe-sports-hub` | rental+demo | — | rental |
| Tahoe Sports Ltd. | `tahoe-sports-ltd` | rental | kids_bike | rental+lease |
| The BackCountry | `the-backcountry` | rental | ebike_mtb, kids_bike | rental |
| Truckee River Bikes | `truckee-river-bikes` | rental | kids_bike | rental |
| Velo Reno | `velo-reno` | — | — | rental |
| Village Ski Loft | `village-ski-loft` | rental+demo | ebike_mtb, kids_bike, trail_bike | rental |
| Vista Trail Bikes | `vista-trail-bikes` | rental | kids_bike, trail_bike | rental |
| Watta Bike Shop | `watta-bike-shop` | rental | — | rental |
| West Shore Sports | `west-shore-sports` | rental | kids_bike | rental+lease |
| West Shore Sports | `west-shore-sports-qmz5wvbk` | rental | kids_bike | rental+lease |
| West Shore Sports | `west-shore-sports-sunnyside` | rental | kids_bike | rental+lease |
| evo Tahoe City | `evo-tahoe-city` | rental | — | rental |

