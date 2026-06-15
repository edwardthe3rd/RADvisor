# road_cycling — verification worksheet

Generated: 2026-06-14 · 56 active operators

Re-run: `node supabase/seed/verify/gather_evidence.mjs road_cycling`

Detected = signals scanned from the website + Google Places text. This is a
**proposal for review**, not applied data.

- **Hard conflicts** contradict current data — resolve these first.
- **Proposals** are additive (e.g. a rental shop that also runs demos, or new
  subcategory tags) — confirm before applying.

## Summary

| Signal | Count |
|--------|------:|
| Rental detected | 46 |
| Demo detected | 3 |
| Lease detected | 5 |
| Retail-only suspected | 0 |
| **Hard conflicts** | **14** |
| Proposals (additive) | 35 |
| Needs manual fetch (no html/Google) | 0 |

## Hard conflicts vs current (review first)

| Operator | Slug | Conflict | Detected | Pages | Snippet |
|------|------|------|------|------:|------|
| Bike Lake Tahoe | `bike-lake-tahoe` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 1 | Bike Lake Tahoe  bicycle_store sporting_goods_store manufacturer store point_of_interest service establishment |
| Clearly Tahoe Bikes | `clearly-tahoe-bikes` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 1 | Clearly Tahoe Bikes  point_of_interest service establishment |
| College Cyclery | `college-cyclery` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 6 | College Cyclery / Reno, NV / Bike Shop Skip to main content Free Parking in the Rear! Use the back lot and rear entrance for easy access! Toggle navigation Search Search Store Menu x Store Store Shop Bikes Bikes Road/Gra |
| Kiwanis Activity Center and Bike Program | `kiwanis-activity-center-and-bike-program` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 1 | Kiwanis Bike Program - Kiwanis Bike Program Home Kiwanis Bike Program Home Bikes Bike Clinics Bike Sales Clubs Rodeos Learn to repair Bike Donations Bike Consignments Bike Swaps Burning Man Bike Sales Bike Volunteer Earn |
| Mountain Dog Cycling | `mountain-dog-cycling` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 6 | The Altitude Alloy is purpose-built to go fast and demolish steep trails. |
| Pacos Truckee | `pacos-truckee` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 6 | Specialized S-Works Demo 11 $11,000. |
| Pedal Sports Reno-Sparks | `pedal-sports-reno-sparks` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 6 | 99 Shop More Pedal Sports Reno Sparks Your all-season specialty shop, providing a full range of bicycles and service. |
| Sierra Cyclesmith Bicycle Shop | `sierra-cyclesmith-bicycle-shop` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 6 | 00 Renthal Fatbar Carbon Riser $184. |
| Tahoe Sports Ltd. | `tahoe-sports-ltd` | offers_season_lease=true but no lease signal found | rental | 6 | - Tahoe Sports ltd Select your language English (US) USD USD CAD Login View all results (0) No products found 0 Cart You have no items in your shopping cart Home Shop SKI Cross Country XC Skis Boots Backcountry Boots Bindings Poles Skins Alpine Ski Skis Boots  |
| The Bike Shop | `the-bike-shop` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 0 | The Bike Shop  bicycle_store manufacturer sporting_goods_store store point_of_interest establishment |
| Velo Reno | `velo-reno` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 2 | Save Money Join our mailing list to find out first about our shop's seasonal sales! Clean & Easy Velo Reno has a large inventory on nutrition, tools, riding accessories and clothing. |
| West Shore Sports | `west-shore-sports` | offers_season_lease=true but no lease signal found | rental | 6 | Home Summer - West Shore Sports a Summer Rentals for the Whole family With 3 Locations on Tahoe’s West Shore view rentals Summer Rentals *All rentals are first come first served and require a credit or debit card deposit Kayaks view rentals Bicycle view rental |
| West Shore Sports | `west-shore-sports-qmz5wvbk` | offers_season_lease=true but no lease signal found | rental | 6 | Home Summer - West Shore Sports a Summer Rentals for the Whole family With 3 Locations on Tahoe’s West Shore view rentals Summer Rentals *All rentals are first come first served and require a credit or debit card deposit Kayaks view rentals Bicycle view rental |
| West Shore Sports | `west-shore-sports-sunnyside` | offers_season_lease=true but no lease signal found | rental | 6 | Home Summer - West Shore Sports a Summer Rentals for the Whole family With 3 Locations on Tahoe’s West Shore view rentals Summer Rentals *All rentals are first come first served and require a credit or debit card deposit Kayaks view rentals Bicycle view rental |

## Proposals — additive, confirm before applying

| Operator | Slug | Proposal | Detected | Snippet |
|------|------|------|------|------|
| Another Bike Shop Reno | `another-bike-shop-reno` | propose subcategories: gravel_bike | rental | Santa Cruz Bicycles Smith Optics Specialized Shop All Specialized Bikes Frames Apparel & Acccessories Components Thule Transition Bikes Troy Lee Designs Rentals Services Bike Repair Suspension Service Gear Selection Financing Mini Service Classes About Careers |
| BlueZone Sports - Carson City | `bluezone-sports-carson-city` | propose subcategories: gravel_bike, road_bike | rental | 6486 / Email Us Use Code TRAIL for 30% Off Sitewide* FREE Shipping on Orders over $75!* The Zone My Account Manage Your Account Address Book Order History Wish List Sign In Locations SOUTH LAKE TAHOE TRUCKEE ROSEVILLE CARSON CITY TAHOE CITY ALL STORES Search W |
| BlueZone Sports - South Lake Tahoe | `bluezone-sports-south-lake-tahoe` | propose subcategories: gravel_bike, road_bike | rental | 6486 / Email Us Use Code TRAIL for 30% Off Sitewide* FREE Shipping on Orders over $75!* The Zone My Account Manage Your Account Address Book Order History Wish List Sign In Locations SOUTH LAKE TAHOE TRUCKEE ROSEVILLE CARSON CITY TAHOE CITY ALL STORES Search W |
| BlueZone Sports - Tahoe City | `bluezone-sports-tahoe-city` | propose subcategories: gravel_bike, road_bike | rental | 6486 / Email Us Use Code TRAIL for 30% Off Sitewide* FREE Shipping on Orders over $75!* The Zone My Account Manage Your Account Address Book Order History Wish List Sign In Locations SOUTH LAKE TAHOE TRUCKEE ROSEVILLE CARSON CITY TAHOE CITY ALL STORES Search W |
| College Cyclery | `college-cyclery` | propose subcategories: gravel_bike, road_bike | — | College Cyclery / Reno, NV / Bike Shop Skip to main content Free Parking in the Rear! Use the back lot and rear entrance for easy access! Toggle navigation Search Search Store Menu x Store Store Shop Bikes Bikes Road/Gra |
| Dirt Gypsy Adventures | `dirt-gypsy-adventures` | propose subcategories: gravel_bike | rental | Dirt Gypsy Adventures - Mountain & Gravel Bike Tours, Rentals, Trailhead Shuttles & Skills Clinics - 11410 Deerfield Dive, Truckee, CA top of page Schedule A Call Contact Us 530-580-7447 TOURS Mountain Gravel One-Day MTB One-Day Gravel Multi-Day RENTALS SHUTTL |
| Gondola Ski + Sports | `gondola-ski-sports` | also appears to offer demos → propose offers_demo=true | rental+demo | Home - Gondola Ski Tahoe Home Rental Reservations Bike Rentals Snowboards Skis Employment Blog Select Page Gondola Ski & Sports South Lake Tahoe Located on the Heavenly Plaza under the gondola we have the gear you need to enjoy the mountains. |
| Granite Chief Powered by BlueZone Sports | `granite-chief-powered-by-bluezone-sports` | propose subcategories: gravel_bike, road_bike | rental | 6486 / Email Us Use Code TRAIL for 30% Off Sitewide* FREE Shipping on Orders over $75!* The Zone My Account Manage Your Account Address Book Order History Wish List Sign In Locations SOUTH LAKE TAHOE TRUCKEE ROSEVILLE CARSON CITY TAHOE CITY ALL STORES Search W |
| Great Basin Bicycles | `great-basin-bicycles` | propose subcategories: gravel_bike, road_bike | rental | Rental of garmin Vector 3 pedals Follow this link for more info! 775-825-8258 8048 S Virginia St Reno, NV 89511 (behind the Human Bean coffee kiosk) Store Hours: M-F 10:00a – 6:00p Sat 10:00a – 5:00p Sun Closed We are open Monday through Saturday year round. |
| High Sierra Cycling | `high-sierra-cycling` | propose subcategories: gravel_bike, road_bike | rental | High Sierra Cycling 0 Skip to Content Home Bikes Mountain Bikes Road & Gravel Bikes E-bikes Services Service & Tune-Ups Rental Bikes Events & Rides About About Us Ride & Rider Photos Open Menu Close Menu Home Bikes Mountain Bikes Road & Gravel Bikes E-bikes Se |
| Powder House — Lake Tahoe Bike Rentals | `lake-tahoe-bike-rentals` | appears to offer a season lease → propose offers_season_lease=true | rental+lease | South Lake Tahoe Ski Rentals & Snowboard Rentals Rates Heavenly Village Mini Golf Ski and Snowboard Season Leases Ski Rental Rates Snowboard Rental Rates Snowshoes Rental Rates Ski Clothing Rental Rates Reservations Ski and Snowboard Sales View all Ski & Snowb |
| Mountain Dog Cycling | `mountain-dog-cycling` | propose subcategories: gravel_bike | — | The Altitude Alloy is purpose-built to go fast and demolish steep trails. |
| Olympic Bike Shop | `olympic-bike-shop` | propose subcategories: gravel_bike, road_bike | rental | Olympic Bike Shop / North Lake Tahoe Skip to main content Toggle navigation Store Store Account Account Shop Menu has items Bikes Bikes Road Gravel Mountain Commuter/Urban Comfort Cruiser Fitness Hybrid Children's Other Electric Electric Bikes Wheels Wheels Pa |
| Olympic Valley Ski & Bike | `olympic-valley-ski-bike` | also appears to offer demos → propose offers_demo=true | rental+demo | 4707 / A full service Rental, Demo and Tuning Ski Shop 530. |
| Pacos Truckee | `pacos-truckee` | propose subcategories: gravel_bike, road_bike | — | Specialized S-Works Demo 11 $11,000. |
| Pedal Sports Reno-Sparks | `pedal-sports-reno-sparks` | propose subcategories: gravel_bike, road_bike | — | 99 Shop More Pedal Sports Reno Sparks Your all-season specialty shop, providing a full range of bicycles and service. |
| Powder House Ski and Snowboard At The Gondola | `powder-house-ski-and-snowboard-at-the-gondola` | appears to offer a season lease → propose offers_season_lease=true | rental+lease | Powder House at the Gondola - Tahoe Powder House Rates Heavenly Village Mini Golf Ski and Snowboard Season Leases Ski Rental Rates Snowboard Rental Rates Snowshoes Rental Rates Ski Clothing Rental Rates Reservations Ski and Snowboard Sales View all Ski & Snowb |
| Powder House Ski and Snowboard Main Store | `powder-house-ski-and-snowboard-main-store` | appears to offer a season lease → propose offers_season_lease=true | rental+lease | Powder House Main Store - Tahoe Powder House Rates Heavenly Village Mini Golf Ski and Snowboard Season Leases Ski Rental Rates Snowboard Rental Rates Snowshoes Rental Rates Ski Clothing Rental Rates Reservations Ski and Snowboard Sales View all Ski & Snowboard |
| Powder House Express | `powder-house-express` | appears to offer a season lease → propose offers_season_lease=true | rental+lease | Powder House Express - Tahoe Powder House Rates Heavenly Village Mini Golf Ski and Snowboard Season Leases Ski Rental Rates Snowboard Rental Rates Snowshoes Rental Rates Ski Clothing Rental Rates Reservations Ski and Snowboard Sales View all Ski & Snowboards S |
| REI Bike Shop | `rei-bike-shop` | propose subcategories: gravel_bike | rental | com Home Page Shop Clear Search Search Cancel My REI Find your store Sign In Cart Open menu Close menu My Account - Sign in or Register Camp & Hike All Camp & Hike Camp & Hike All Camp & Hike Hiking Hiking All Hiking Footwear Jackets Shirts Pants Shorts Socks  |
| Shoreline of Tahoe | `shoreline-of-tahoe` | propose subcategories: road_bike | rental | Parts/Tools Rentals Expand submenu Collapse submenu Rentals Bike Rentals Ski Rentals Snowboard Rentals Snowshoes Rental Brands Gift card Tech Shop Search Log in Search LOGIN Shoreline Tahoe Snowboard Snowboards Men's Snowboards Women's Snowboards Youth Snowboa |
| Sierra Cyclesmith Bicycle Shop | `sierra-cyclesmith-bicycle-shop` | propose subcategories: gravel_bike, road_bike | — | 00 Renthal Fatbar Carbon Riser $184. |
| Sierra Ski & Cycle Works | `sierra-ski-cycle-works` | propose subcategories: road_bike | rental | 1980 Skip to main content Menu Home About Bike Ski Spoke Junkie Contact facebook Close Search Tahoe Original Since 1980 Sierra Ski & Cycle Works specializes in service, repairs, sales and rentals. |
| South Shore Bikes | `south-shore-bikes` | propose subcategories: road_bike | rental | Home Page - South Shore Bikes Tahoe Skip to content 2025 Voted Tahoe's Best Bike Shop! (530) 544-7433 RIDE - OPEN 10 AM to 6 PM Home Bike Trails About Us Rentals Store Winter &#038; Snow Toggle website search Menu Close Home Bike Trails About Us Rentals Store  |
| Sports Ltd. Rentals | `sports-ltd-rentals` | appears to offer a season lease → propose offers_season_lease=true; propose subcategories: road_bike | rental+lease | - Sports Ltd Rentals E-Bike, Ski, Snowboard, E-Mtn Bike, Camping, & Backcountry Skip to content Sports Ltd Rentals Outdoor Equipment Rental Rentals &#038; Demos Winter Rentals Summer Rentals Book Now Demo Skis 25/26 Demo Ski Program Contact Us Trail Info &#038 |
| Stealth Tahoe | `stealth-tahoe` | propose subcategories: gravel_bike, road_bike | rental | Stealth Tahoe Skip to content Free Shipping on orders $100+ *Some exclusions apply E-Bikes Super73 E Ride Pro Rad Power Bikes Stealth Electric Bikes Moonbikes Bike Insurance Sno-Go Sno-Go Sno-Go Rental Bike Shop Brakes Disc Brakes Brake Pads Brake Rotors Hoses |
| Tahoe Bike Company | `tahoe-bike-company` | propose subcategories: road_bike | rental | Bike & E-Bike Rentals in South Lake Tahoe / Tahoe Bike Company Rentals Shop & Repair About Contact FAQs Book Now Book Now New Aventon Bikes Sales & Rentals New Aventon Bikes Sales & Rentals New Aventon Bikes Sales & Rentals New Aventon Bikes Sales & Rentals Ne |
| Tahoe Donner Bikeworks | `tahoe-donner-bikeworks` | propose subcategories: gravel_bike, road_bike | rental | Bikeworks / Tahoe Donner Search site: Community Amenities Members News + Events Ski Resort XC Ski ShopTD Member Portal Bikeworks Equestrian Center Golf Course Community General About Us Vision + Mission Location Welcome FAQs General FAQs Tahoe Donner Amenities |
| Tahoe Sports Ltd. | `tahoe-sports-ltd` | propose subcategories: gravel_bike, road_bike | rental | - Tahoe Sports ltd Select your language English (US) USD USD CAD Login View all results (0) No products found 0 Cart You have no items in your shopping cart Home Shop SKI Cross Country XC Skis Boots Backcountry Boots Bindings Poles Skins Alpine Ski Skis Boots  |
| Velo Reno | `velo-reno` | propose subcategories: road_bike | — | Save Money Join our mailing list to find out first about our shop's seasonal sales! Clean & Easy Velo Reno has a large inventory on nutrition, tools, riding accessories and clothing. |
| Village Ski Loft | `village-ski-loft` | also appears to offer demos → propose offers_demo=true; propose subcategories: road_bike | rental+demo | Village Ski Loft Lake Tahoe top of page The Village Ski Loft Incline Village, NV - Lake Tahoe 775-831-3537 HOME RENT NOW Bike Rentals Skis & Boards Nordic, Snowshoes, Sleds Where to Ski & Ride WINTER SERVICES Expert Boot Fitting Services Overnight Tuning and R |
| Vista Trail Bikes | `vista-trail-bikes` | propose subcategories: road_bike | rental | Lake Tahoe Bike Rentals - Vista Trail Bikes Skip to content 1 (775) 298-7431 rides@vistatrailbikes. |
| West Shore Sports | `west-shore-sports` | propose subcategories: road_bike | rental | Home Summer - West Shore Sports a Summer Rentals for the Whole family With 3 Locations on Tahoe’s West Shore view rentals Summer Rentals *All rentals are first come first served and require a credit or debit card deposit Kayaks view rentals Bicycle view rental |
| West Shore Sports | `west-shore-sports-qmz5wvbk` | propose subcategories: road_bike | rental | Home Summer - West Shore Sports a Summer Rentals for the Whole family With 3 Locations on Tahoe’s West Shore view rentals Summer Rentals *All rentals are first come first served and require a credit or debit card deposit Kayaks view rentals Bicycle view rental |
| West Shore Sports | `west-shore-sports-sunnyside` | propose subcategories: road_bike | rental | Home Summer - West Shore Sports a Summer Rentals for the Whole family With 3 Locations on Tahoe’s West Shore view rentals Summer Rentals *All rentals are first come first served and require a credit or debit card deposit Kayaks view rentals Bicycle view rental |

## Needs manual fetch (website + Google both empty)

_None._

## All operators (detected signals + proposed subcategories)

| Operator | Slug | Detected | Subcategories (detected) | Current flags |
|------|------|------|------|------|
| Anderson's Bicycle Rental | `andersons-bicycle-rental` | rental | — | rental |
| Another Bike Shop Reno | `another-bike-shop-reno` | rental | gravel_bike | rental |
| Big Daddy's Bike & Brew | `big-daddys-bike-brew` | rental | — | rental |
| Bike Lake Tahoe | `bike-lake-tahoe` | — | — | rental |
| Bike Truckee | `bike-truckee` | rental | — | rental |
| Black Tie Bike Rentals North Tahoe | `black-tie-adventure-rentals-north-tahoe` | rental | — | rental |
| BlueZone Sports - Carson City | `bluezone-sports-carson-city` | rental | gravel_bike, road_bike | rental |
| BlueZone Sports - South Lake Tahoe | `bluezone-sports-south-lake-tahoe` | rental | gravel_bike, road_bike | rental |
| BlueZone Sports - Tahoe City | `bluezone-sports-tahoe-city` | rental | gravel_bike, road_bike | rental |
| Clearly Tahoe Bikes | `clearly-tahoe-bikes` | — | — | rental |
| College Cyclery | `college-cyclery` | — | gravel_bike, road_bike | rental |
| Dirt Gypsy Adventures | `dirt-gypsy-adventures` | rental | gravel_bike | rental |
| Eastlake Ebike Rentals | `eastlake-ebike-rentals` | rental | — | rental |
| Emerald Bay Bikes | `emerald-bay-bikes` | rental | — | rental |
| Flume Trail Bikes | `flume-trail-bikes` | rental | — | rental |
| Gondola Ski + Sports | `gondola-ski-sports` | rental+demo | — | rental |
| Granite Chief Powered by BlueZone Sports | `granite-chief-powered-by-bluezone-sports` | rental | gravel_bike, road_bike | rental |
| Great Basin Bicycles | `great-basin-bicycles` | rental | gravel_bike, road_bike | rental |
| High Sierra Cycling | `high-sierra-cycling` | rental | gravel_bike, road_bike | rental |
| Kiwanis Activity Center and Bike Program | `kiwanis-activity-center-and-bike-program` | — | — | rental |
| Powder House — Lake Tahoe Bike Rentals | `lake-tahoe-bike-rentals` | rental+lease | — | rental |
| Mountain Dog Cycling | `mountain-dog-cycling` | — | gravel_bike | rental |
| Olympic Bike Shop | `olympic-bike-shop` | rental | gravel_bike, road_bike | rental |
| Olympic Valley Ski & Bike | `olympic-valley-ski-bike` | rental+demo | — | rental |
| Pacos Truckee | `pacos-truckee` | — | gravel_bike, road_bike | rental |
| Pedal Sports Reno-Sparks | `pedal-sports-reno-sparks` | — | gravel_bike, road_bike | rental |
| Pine Nut Ebike Rentals South Lake Tahoe | `pine-nut-ebike-rentals-south-lake-tahoe` | rental | — | rental |
| Powder House Ski and Snowboard At The Gondola | `powder-house-ski-and-snowboard-at-the-gondola` | rental+lease | — | rental |
| Powder House Ski and Snowboard Main Store | `powder-house-ski-and-snowboard-main-store` | rental+lease | — | rental |
| Powder House Express | `powder-house-express` | rental+lease | — | rental |
| REI Bike Shop | `rei-bike-shop` | rental | gravel_bike | rental |
| Reno Brew Bike | `reno-brew-bike` | rental | — | rental |
| Ride Tahoe Rentals | `ride-tahoe-rentals` | rental | — | rental |
| Shoreline of Tahoe | `shoreline-of-tahoe` | rental | road_bike | rental |
| Sierra Cyclesmith Bicycle Shop | `sierra-cyclesmith-bicycle-shop` | — | gravel_bike, road_bike | rental |
| Sierra Ski & Cycle Works | `sierra-ski-cycle-works` | rental | road_bike | rental |
| South Lake E-bikes | `south-lake-e-bikes` | rental | — | rental |
| South Shore Bikes | `south-shore-bikes` | rental | road_bike | rental |
| South Tahoe Ebike Rentals - Margaritaville | `south-tahoe-ebike-rentals-margaritaville` | rental | — | rental |
| Sports Ltd. Rentals | `sports-ltd-rentals` | rental+lease | road_bike | rental |
| Stealth Tahoe | `stealth-tahoe` | rental | gravel_bike, road_bike | rental |
| Tahoe Bike Company | `tahoe-bike-company` | rental | road_bike | rental |
| Tahoe Donner Bikeworks | `tahoe-donner-bikeworks` | rental | gravel_bike, road_bike | rental |
| Tahoe Ebikes | `tahoe-ebikes` | rental | — | rental |
| Tahoe Sports Ltd. | `tahoe-sports-ltd` | rental | gravel_bike, road_bike | rental+lease |
| The BackCountry | `the-backcountry` | rental | — | rental |
| The Bike Shop | `the-bike-shop` | — | — | rental |
| Truckee River Bikes | `truckee-river-bikes` | rental | — | rental |
| Velo Reno | `velo-reno` | — | road_bike | rental |
| Village Ski Loft | `village-ski-loft` | rental+demo | road_bike | rental |
| Vista Trail Bikes | `vista-trail-bikes` | rental | road_bike | rental |
| Watta Bike Shop | `watta-bike-shop` | rental | — | rental |
| West Shore Sports | `west-shore-sports` | rental | road_bike | rental+lease |
| West Shore Sports | `west-shore-sports-qmz5wvbk` | rental | road_bike | rental+lease |
| West Shore Sports | `west-shore-sports-sunnyside` | rental | road_bike | rental+lease |
| evo Tahoe City | `evo-tahoe-city` | rental | — | rental |

