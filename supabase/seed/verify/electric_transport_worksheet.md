# electric_transport — verification worksheet

Generated: 2026-06-14 · 66 active operators

Re-run: `node supabase/seed/verify/gather_evidence.mjs electric_transport`

Detected = signals scanned from the website + Google Places text. This is a
**proposal for review**, not applied data.

- **Hard conflicts** contradict current data — resolve these first.
- **Proposals** are additive (e.g. a rental shop that also runs demos, or new
  subcategory tags) — confirm before applying.

## Summary

| Signal | Count |
|--------|------:|
| Rental detected | 54 |
| Demo detected | 4 |
| Lease detected | 2 |
| Retail-only suspected | 1 |
| **Hard conflicts** | **16** |
| Proposals (additive) | 53 |
| Needs manual fetch (no html/Google) | 0 |

## Hard conflicts vs current (review first)

| Operator | Slug | Conflict | Detected | Pages | Snippet |
|------|------|------|------|------:|------|
| Bike Lake Tahoe | `bike-lake-tahoe` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 1 | Bike Lake Tahoe  bicycle_store sporting_goods_store manufacturer store point_of_interest service establishment |
| College Cyclery | `college-cyclery` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 6 | College Cyclery / Reno, NV / Bike Shop Skip to main content Free Parking in the Rear! Use the back lot and rear entrance for easy access! Toggle navigation Search Search Store Menu x Store Store Shop Bikes Bikes Road/Gra |
| Kawasaki Yamaha of Reno | `kawasaki-yamaha-of-reno` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 6 | Here are some of the service specials that we’re currently offering: Side by Side basic service: Get your all terrain vehicles ready for the fall/winter season with our basic service starting at, $199. |
| Kiwanis Activity Center and Bike Program | `kiwanis-activity-center-and-bike-program` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 1 | Kiwanis Bike Program - Kiwanis Bike Program Home Kiwanis Bike Program Home Bikes Bike Clinics Bike Sales Clubs Rodeos Learn to repair Bike Donations Bike Consignments Bike Swaps Burning Man Bike Sales Bike Volunteer Earn |
| Numotion | `numotion` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 4 | Numotion Reno, NV / Numotion (800) 500-9150 (starts a phone call) Resources myNumotion App Pay your bill, track your order, get live support and more For Medical Professionals Access classes and scholarly articles from t |
| Pacos Truckee | `pacos-truckee` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 6 | Specialized S-Works Demo 11 $11,000. |
| Reno Bike Project | `reno-bike-project` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?); looks retail-only — review for deactivation | retail? | 5 | This workshop runs once per season, and will be announced as the date approaches. |
| Reno Harley Davidson | `reno-harley-davidson` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 6 | Reno Harley Davidson / New & Used Harley Dealer Serving Reno, Sparks & Lake Tahoe, NV Immediate Pre-Ordering Available Now! Click here to learn more! X Main 775-473-9613 Call Us Service & Parts 775-473-9618 Call Us 2315 |
| Sierra Bicycle Supply | `sierra-bicycle-supply` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 6 | Specialized / Bikes / eBikes / MTB / Road / Gravel / Commuter / Gear Sierra Bicycle Supply Skip to content LIVE Inventory - FREE shipping on orders over $99 in the US Lower 48 - Questions? Call or Text 775-355-0655 Home |
| Sierra Cyclesmith Bicycle Shop | `sierra-cyclesmith-bicycle-shop` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 6 | Sierra Cyclesmith / Reno, NV Skip to main content Mon - Fri: 11:00am - 6:00pm Sat: 10:00am - 5:00pm Sun: Closed Store Store Account Account Cart Cart (0) Subtotal : $ 0.00 Checkout Cart Toggle navigation Search Search Me |
| Tahoe Sports Ltd. | `tahoe-sports-ltd` | offers_season_lease=true but no lease signal found | rental | 6 | - Tahoe Sports ltd Select your language English (US) USD USD CAD Login View all results (0) No products found 0 Cart You have no items in your shopping cart Home Shop SKI Cross Country XC Skis Boots Backcountry Boots Bindings Poles Skins Alpine Ski Skis Boots  |
| Velo Reno | `velo-reno` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 2 | Save Money Join our mailing list to find out first about our shop's seasonal sales! Clean & Easy Velo Reno has a large inventory on nutrition, tools, riding accessories and clothing. |
| West Shore Sports | `west-shore-sports` | offers_season_lease=true but no lease signal found | rental | 6 | Home Summer - West Shore Sports a Summer Rentals for the Whole family With 3 Locations on Tahoe’s West Shore view rentals Summer Rentals *All rentals are first come first served and require a credit or debit card deposit Kayaks view rentals Bicycle view rental |
| West Shore Sports | `west-shore-sports-qmz5wvbk` | offers_season_lease=true but no lease signal found | rental | 6 | Home Summer - West Shore Sports a Summer Rentals for the Whole family With 3 Locations on Tahoe’s West Shore view rentals Summer Rentals *All rentals are first come first served and require a credit or debit card deposit Kayaks view rentals Bicycle view rental |
| West Shore Sports | `west-shore-sports-sunnyside` | offers_season_lease=true but no lease signal found | rental | 6 | Home Summer - West Shore Sports a Summer Rentals for the Whole family With 3 Locations on Tahoe’s West Shore view rentals Summer Rentals *All rentals are first come first served and require a credit or debit card deposit Kayaks view rentals Bicycle view rental |
| Wilderbike | `wilderbike` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 0 | Wilderbike  bicycle_store sporting_goods_store manufacturer store point_of_interest establishment |

## Proposals — additive, confirm before applying

| Operator | Slug | Proposal | Detected | Snippet |
|------|------|------|------|------|
| Anderson's Bicycle Rental | `andersons-bicycle-rental` | propose subcategories: e_bike_city | rental | Home - Anderson&#039;s Bicycle Rental Bikes Are First Come, First Served Basis Only Best of Tahoe 2025 Winner Sports and Recreation ~ Best Summer Activity Anderson&#039;s Bicycle Rental Home About Us Bicycles &#038; Rates Group Reservations FAQ Activities Guid |
| Another Bike Shop Reno | `another-bike-shop-reno` | propose subcategories: e_bike_city | rental | Santa Cruz Bicycles Smith Optics Specialized Shop All Specialized Bikes Frames Apparel & Acccessories Components Thule Transition Bikes Troy Lee Designs Rentals Services Bike Repair Suspension Service Gear Selection Financing Mini Service Classes About Careers |
| Big Blue Bike Rentals and Tours | `big-blue-bike-rentals-and-tours` | propose subcategories: e_bike_city | rental | Lake Tahoe Bike Rentals with Big Blue Bike Rentals Skip to content Book Now Bike Rentals Rides East Shore Trail Flume Trail Blog Things to Do Visit Us in SF Contact Us Contact Us Group Rentals About Us Bike Rentals Rides East Shore Trail Flume Trail Things to  |
| Big Daddy's Bike & Brew | `big-daddys-bike-brew` | propose subcategories: e_bike_city | rental | From local favorites to our very own " DIPADADDY ", Big Daddy's pours a variety of seasonal suds to soothe the soul. |
| Bike Truckee | `bike-truckee` | propose subcategories: e_bike_city | rental | HOME / Bike Truckee / eBike Retailer / Bike Rentals top of page OFFERING BIKE SERVICE AND REPAIRS YEAR ROUND BOOK YOUR BIKE NOW A minimum of 24 hours' advance booking is required Walk-ins are welcome 530. |
| Pedego Electric Bikes Reno | `bikepath-e-bike-rentals` | propose subcategories: e_bike_city | rental | We are the region's foremost electric bike experts offering sales, rentals, accessories, and service. |
| Black Tie Bike Rentals North Tahoe | `black-tie-adventure-rentals-north-tahoe` | propose subcategories: e_bike_city | rental | North Tahoe - Black Tie Bike Rentals Summer Winter Call Us: 866. |
| BlueZone Sports - Carson City | `bluezone-sports-carson-city` | propose subcategories: e_bike_city | rental | 6486 / Email Us Use Code TRAIL for 30% Off Sitewide* FREE Shipping on Orders over $75!* The Zone My Account Manage Your Account Address Book Order History Wish List Sign In Locations SOUTH LAKE TAHOE TRUCKEE ROSEVILLE CARSON CITY TAHOE CITY ALL STORES Search W |
| BlueZone Sports - South Lake Tahoe | `bluezone-sports-south-lake-tahoe` | propose subcategories: e_bike_city | rental | 6486 / Email Us Use Code TRAIL for 30% Off Sitewide* FREE Shipping on Orders over $75!* The Zone My Account Manage Your Account Address Book Order History Wish List Sign In Locations SOUTH LAKE TAHOE TRUCKEE ROSEVILLE CARSON CITY TAHOE CITY ALL STORES Search W |
| BlueZone Sports - Tahoe City | `bluezone-sports-tahoe-city` | propose subcategories: e_bike_city | rental | 6486 / Email Us Use Code TRAIL for 30% Off Sitewide* FREE Shipping on Orders over $75!* The Zone My Account Manage Your Account Address Book Order History Wish List Sign In Locations SOUTH LAKE TAHOE TRUCKEE ROSEVILLE CARSON CITY TAHOE CITY ALL STORES Search W |
| Cloud of Goods Reno | `cloud-of-goods-reno` | propose subcategories: e_bike_city, e_scooter | rental | Reno Mobility Scooter & Wheelchair Rentals Delivered / Cloud of Goods Cloud of Goods logo Stylized white text logo on transparent background Sign in Account & orders Your cart is empty. |
| College Cyclery | `college-cyclery` | propose subcategories: e_bike_city | — | College Cyclery / Reno, NV / Bike Shop Skip to main content Free Parking in the Rear! Use the back lot and rear entrance for easy access! Toggle navigation Search Search Store Menu x Store Store Shop Bikes Bikes Road/Gra |
| CyclePaths BikeShop | `cyclepaths-bikeshop` | propose subcategories: e_bike_city, e_scooter | rental | 00 HOME SHOP Amflow eMTB Deviate Marin Bikes Murf Electric Bikes Rocky Mountain Santa Cruz Segway E-Bikes &#038; E-Scooters BIKE RENTALS SERVICE APPOINTMENT TRAIL INFO ABOUT About Us Events Refunds &#038; Returns CONTACT HOME SHOP Amflow eMTB Deviate Marin Bik |
| E-Bike Hub | `e-bike-hub` | propose subcategories: e_bike_city | rental | E-Bike Hub / Discover E-Biking Today Ride More! Skip to Content Open Menu Close Menu Service Shop Rentals Playa Bike Sale Login Account 0 0 Service Shop Rentals Playa Bike Sale Login Account 0 0 Open Menu Close Menu Service Shop Rentals Playa Bike Sale Login A |
| Tahoe Multisport — East Shore | `east-shore-e-bikes-tours-rentals` | propose subcategories: e_bike_city | rental | East Shore Ebikes &#8211; Tahoe Multisport Skip to content Tahoe Multisport Now offering E BIKE RENTALS Menu expanded collapsed Grab & Go Lake Tahoe Beach Sauna Tours, Rentals, and More Tours Clear Kayak Tours E-BIKE Rentals Rates Rental Delivery Retail Items  |
| Eastlake Ebike Rentals | `eastlake-ebike-rentals` | propose subcategories: e_bike_city | rental | Eastlake Ebike Rentals  service point_of_interest establishment |
| Emerald Bay Bikes | `emerald-bay-bikes` | propose subcategories: e_bike_city | rental | Family owned and operated Welcome to Emerald Bay Bikes! Founded in 2025 by a father-son duo, started as a eBike rental shop with a simple belief: eBikes are a fun and adventurous way for everyone to explore. |
| Flume Trail Bikes | `flume-trail-bikes` | propose subcategories: e_bike_city | rental | Flume Trail Bikes 0 Skip to Content Mountain Bike Rentals 2026 Shuttles Path Bike Rentals How to Get Here About Us Contact Open Menu Close Menu Mountain Bike Rentals 2026 Shuttles Path Bike Rentals How to Get Here About Us Contact Open Menu Close Menu Mountain |
| Gondola Ski + Sports | `gondola-ski-sports` | also appears to offer demos → propose offers_demo=true; propose subcategories: e_bike_city | rental+demo | Home - Gondola Ski Tahoe Home Rental Reservations Bike Rentals Snowboards Skis Employment Blog Select Page Gondola Ski & Sports South Lake Tahoe Located on the Heavenly Plaza under the gondola we have the gear you need to enjoy the mountains. |
| Granite Chief Powered by BlueZone Sports | `granite-chief-powered-by-bluezone-sports` | propose subcategories: e_bike_city | rental | 6486 / Email Us Use Code TRAIL for 30% Off Sitewide* FREE Shipping on Orders over $75!* The Zone My Account Manage Your Account Address Book Order History Wish List Sign In Locations SOUTH LAKE TAHOE TRUCKEE ROSEVILLE CARSON CITY TAHOE CITY ALL STORES Search W |
| High Sierra Cycling | `high-sierra-cycling` | propose subcategories: e_bike_city | rental | High Sierra Cycling 0 Skip to Content Home Bikes Mountain Bikes Road & Gravel Bikes E-bikes Services Service & Tune-Ups Rental Bikes Events & Rides About About Us Ride & Rider Photos Open Menu Close Menu Home Bikes Mountain Bikes Road & Gravel Bikes E-bikes Se |
| Powder House — Lake Tahoe Bike Rentals | `lake-tahoe-bike-rentals` | appears to offer a season lease → propose offers_season_lease=true; propose subcategories: e_bike_city | rental+lease | South Lake Tahoe Ski Rentals & Snowboard Rentals Rates Heavenly Village Mini Golf Ski and Snowboard Season Leases Ski Rental Rates Snowboard Rental Rates Snowshoes Rental Rates Ski Clothing Rental Rates Reservations Ski and Snowboard Sales View all Ski & Snowb |
| Olympic Bike Shop | `olympic-bike-shop` | propose subcategories: e_bike_city | rental | Olympic Bike Shop / North Lake Tahoe Skip to main content Toggle navigation Store Store Account Account Shop Menu has items Bikes Bikes Road Gravel Mountain Commuter/Urban Comfort Cruiser Fitness Hybrid Children's Other Electric Electric Bikes Wheels Wheels Pa |
| Pacos Truckee | `pacos-truckee` | propose subcategories: e_bike_city | — | Specialized S-Works Demo 11 $11,000. |
| Pedego Electric Bikes Reno | `pedego-electric-bikes-reno` | also appears to offer demos → propose offers_demo=true; propose subcategories: e_bike_city | rental+demo | We are the region's foremost electric bike experts offering sales, rentals, accessories, and service. |
| Pine Nut Ebike Rentals South Lake Tahoe | `pine-nut-ebike-rentals-south-lake-tahoe` | propose subcategories: e_bike_city, e_scooter | rental | E-bike Rentals South Lake Tahoe - Best Rates and Biggest Fleet 0 Skip to Content Rates Store Info Contact About Blog book now Open Menu Close Menu book now Rates Store Info Contact About Blog Open Menu Close Menu Rates Store Folder: Info Back Contact About Blo |
| REI Bike Shop | `rei-bike-shop` | propose subcategories: e_bike_city | rental | com Home Page Shop Clear Search Search Cancel My REI Find your store Sign In Cart Open menu Close menu My Account - Sign in or Register Camp & Hike All Camp & Hike Camp & Hike All Camp & Hike Hiking Hiking All Hiking Footwear Jackets Shirts Pants Shorts Socks  |
| Ride Tahoe Rentals | `ride-tahoe-rentals` | propose subcategories: e_bike_city | rental | Ride Tahoe Rentals - High Performance MTB and E-MTB Rentals Skip to content Rentals Repairs &#038; Tuneups Trails Faqs Social Media Book Now Main Menu Rentals Repars &#038; Tuneups Trails Faqs Social Media Book Now info@ridetahoerentals. |
| Rolling Freedom Motorcycles & Lake Tahoe Slingshots | `rolling-freedom-motorcycles-lake-tahoe-slingshots-motorcycles-moped-scooters-e-bike-rentals-eaglerider-tours` | propose subcategories: e_bike_city, e_scooter | rental | Slingshot, Motorcycle, Moped, and E-Bike adventure rentals in Lake Tahoe Rentals Tahoe Rentals Reno Rentals Sales All Inventory for Sale Motorcycles Moped Scooters E-Bikes CanAM Spyder Maps About Us News Contact FAQ BOOK NOW 0 Cart 0 items Total &#36; 0. |
| Sierra Bicycle Supply | `sierra-bicycle-supply` | propose subcategories: e_bike_city | — | Specialized / Bikes / eBikes / MTB / Road / Gravel / Commuter / Gear Sierra Bicycle Supply Skip to content LIVE Inventory - FREE shipping on orders over $99 in the US Lower 48 - Questions? Call or Text 775-355-0655 Home |
| Sierra Cyclesmith Bicycle Shop | `sierra-cyclesmith-bicycle-shop` | propose subcategories: e_bike_city | — | Sierra Cyclesmith / Reno, NV Skip to main content Mon - Fri: 11:00am - 6:00pm Sat: 10:00am - 5:00pm Sun: Closed Store Store Account Account Cart Cart (0) Subtotal : $ 0.00 Checkout Cart Toggle navigation Search Search Me |
| Sierra Ski & Cycle Works | `sierra-ski-cycle-works` | propose subcategories: e_bike_city | rental | 1980 Skip to main content Menu Home About Bike Ski Spoke Junkie Contact facebook Close Search Tahoe Original Since 1980 Sierra Ski & Cycle Works specializes in service, repairs, sales and rentals. |
| South Lake E-bikes | `south-lake-e-bikes` | propose subcategories: e_bike_city | rental | Lake Tahoe E-Bike Rentals / South Lake E-Bikes Home Make A Reservation Our E-Bikes FAQ Repair Contact Home Make A Reservation Our E-Bikes FAQ Repair Contact Reserve eBike South Lake E-Bikes offers the best Lake Tahoe e-bike rentals for exploring Emerald Bay an |
| South Shore Bikes | `south-shore-bikes` | propose subcategories: e_bike_city | rental | Home Page - South Shore Bikes Tahoe Skip to content 2025 Voted Tahoe's Best Bike Shop! (530) 544-7433 RIDE - OPEN 10 AM to 6 PM Home Bike Trails About Us Rentals Store Winter &#038; Snow Toggle website search Menu Close Home Bike Trails About Us Rentals Store  |
| South Tahoe Ebike Rentals - Margaritaville | `south-tahoe-ebike-rentals-margaritaville` | propose subcategories: e_bike_city | rental | South Tahoe EBike Rentals 0 Skip to Content Open Menu Close Menu Open Menu Close Menu RIDE EASY EXPLORE MORE Explore South Lake Tahoe in Style with South Tahoe Ebike Rentals! Cruise through paradise with ease—South Tahoe Ebike Rentals is your go-to spot for ad |
| Sports Ltd. Rentals | `sports-ltd-rentals` | appears to offer a season lease → propose offers_season_lease=true; propose subcategories: e_bike_city | rental+lease | - Sports Ltd Rentals E-Bike, Ski, Snowboard, E-Mtn Bike, Camping, & Backcountry Skip to content Sports Ltd Rentals Outdoor Equipment Rental Rentals &#038; Demos Winter Rentals Summer Rentals Book Now Demo Skis 25/26 Demo Ski Program Contact Us Trail Info &#038 |
| Stealth Tahoe | `stealth-tahoe` | propose subcategories: e_bike_city, onewheel | rental | Stealth Tahoe Skip to content Free Shipping on orders $100+ *Some exclusions apply E-Bikes Super73 E Ride Pro Rad Power Bikes Stealth Electric Bikes Moonbikes Bike Insurance Sno-Go Sno-Go Sno-Go Rental Bike Shop Brakes Disc Brakes Brake Pads Brake Rotors Hoses |
| Tahoe Bike Company | `tahoe-bike-company` | propose subcategories: e_bike_city | rental | Bike & E-Bike Rentals in South Lake Tahoe / Tahoe Bike Company Rentals Shop & Repair About Contact FAQs Book Now Book Now New Aventon Bikes Sales & Rentals New Aventon Bikes Sales & Rentals New Aventon Bikes Sales & Rentals New Aventon Bikes Sales & Rentals Ne |
| Tahoe Donner Bikeworks | `tahoe-donner-bikeworks` | propose subcategories: e_bike_city | rental | Bikeworks / Tahoe Donner Search site: Community Amenities Members News + Events Ski Resort XC Ski ShopTD Member Portal Bikeworks Equestrian Center Golf Course Community General About Us Vision + Mission Location Welcome FAQs General FAQs Tahoe Donner Amenities |
| Tahoe Ebikes | `tahoe-ebikes` | propose subcategories: e_bike_city | rental | Home / Tahoe Ebikes top of page Tahoe eBikes Home Used eBike Sale New Inventory Rental Rates The Mountain Fleet The Pavement Fleet Repair Disc Golf About Us Contact Us YouTube Channel More. |
| Tahoe Electric Bike Rental | `tahoe-electric-bike-rental` | propose subcategories: e_bike_city | rental | Tahoe Electric Bike Rental / Lake Tahoe, Reno & Carson City Ebikes Skip to content Tahoe Electric Bike Rental Brought to you by Racer Menu Home About Burning Man Bike Rentals Electric Bike Styles FAQs Recommended Trails Contact Blog Scroll down to content Home |
| Tahoe Multisport | `tahoe-multisport-e-bike-kayak-stand-up-paddle-board-rentals-tours` | propose subcategories: e_bike_city | rental | Tahoe Multisport &#8211; Now offering E BIKE RENTALS Skip to content Tahoe Multisport Now offering E BIKE RENTALS Menu expanded collapsed Grab & Go Lake Tahoe Beach Sauna Tours, Rentals, and More Tours Clear Kayak Tours E-BIKE Rentals Rates Rental Delivery Ret |
| Tahoe Sports Hub | `tahoe-sports-hub` | also appears to offer demos → propose offers_demo=true; propose subcategories: e_bike_city | rental+demo | Tahoe Sports Hub is Truckee's ski snowboard rental and demo shop. |
| Tahoe Sports Ltd. | `tahoe-sports-ltd` | propose subcategories: e_bike_city, onewheel | rental | - Tahoe Sports ltd Select your language English (US) USD USD CAD Login View all results (0) No products found 0 Cart You have no items in your shopping cart Home Shop SKI Cross Country XC Skis Boots Backcountry Boots Bindings Poles Skins Alpine Ski Skis Boots  |
| The BackCountry | `the-backcountry` | propose subcategories: e_bike_city | rental | The BackCountry Shop / The BackCountry in Truckee, CA - The BackCountry Open Daily 8a-6p / 530-582-0909 / [email&#160;protected] Account Wish List Compare Go to account settings Cart 0 items Submit View all results ( ) Products Back Products SALE Back SALE All |
| Truckee River Bikes | `truckee-river-bikes` | propose subcategories: e_bike_city | rental | Olympic Valley and North Tahoe&#039;s Best Bike Rentals - Truckee River Bikes Skip to content Call Us! (530) 581-3399 Toggle Navigation Home Bike Rentals Bike Rental Info E-Bikes Reservations Bike Sales Bike Service Local Rides Trail Map Blog Contact Call Us!  |
| Velo Reno | `velo-reno` | propose subcategories: e_bike_city | — | Save Money Join our mailing list to find out first about our shop's seasonal sales! Clean & Easy Velo Reno has a large inventory on nutrition, tools, riding accessories and clothing. |
| Village Ski Loft | `village-ski-loft` | also appears to offer demos → propose offers_demo=true; propose subcategories: e_bike_city | rental+demo | Village Ski Loft Lake Tahoe top of page The Village Ski Loft Incline Village, NV - Lake Tahoe 775-831-3537 HOME RENT NOW Bike Rentals Skis & Boards Nordic, Snowshoes, Sleds Where to Ski & Ride WINTER SERVICES Expert Boot Fitting Services Overnight Tuning and R |
| Vista Trail Bikes | `vista-trail-bikes` | propose subcategories: e_bike_city | rental | Lake Tahoe Bike Rentals - Vista Trail Bikes Skip to content 1 (775) 298-7431 rides@vistatrailbikes. |
| West Shore Sports | `west-shore-sports` | propose subcategories: e_bike_city | rental | Home Summer - West Shore Sports a Summer Rentals for the Whole family With 3 Locations on Tahoe’s West Shore view rentals Summer Rentals *All rentals are first come first served and require a credit or debit card deposit Kayaks view rentals Bicycle view rental |
| West Shore Sports | `west-shore-sports-qmz5wvbk` | propose subcategories: e_bike_city | rental | Home Summer - West Shore Sports a Summer Rentals for the Whole family With 3 Locations on Tahoe’s West Shore view rentals Summer Rentals *All rentals are first come first served and require a credit or debit card deposit Kayaks view rentals Bicycle view rental |
| West Shore Sports | `west-shore-sports-sunnyside` | propose subcategories: e_bike_city | rental | Home Summer - West Shore Sports a Summer Rentals for the Whole family With 3 Locations on Tahoe’s West Shore view rentals Summer Rentals *All rentals are first come first served and require a credit or debit card deposit Kayaks view rentals Bicycle view rental |
| evo Tahoe City | `evo-tahoe-city` | propose subcategories: e_bike_city | rental | evo Tahoe City People say this store offers a wide selection of ski boots, clothes, and e-bikes, and provides repair kits and helmets with rentals. |

## Needs manual fetch (website + Google both empty)

_None._

## All operators (detected signals + proposed subcategories)

| Operator | Slug | Detected | Subcategories (detected) | Current flags |
|------|------|------|------|------|
| Anderson's Bicycle Rental | `andersons-bicycle-rental` | rental | e_bike_city | rental |
| Another Bike Shop Reno | `another-bike-shop-reno` | rental | e_bike_city | rental |
| Big Blue Bike Rentals and Tours | `big-blue-bike-rentals-and-tours` | rental | e_bike_city | rental |
| Big Daddy's Bike & Brew | `big-daddys-bike-brew` | rental | e_bike_city | rental |
| Bike Lake Tahoe | `bike-lake-tahoe` | — | — | rental |
| Bike Truckee | `bike-truckee` | rental | e_bike_city | rental |
| Pedego Electric Bikes Reno | `bikepath-e-bike-rentals` | rental | e_bike_city | rental |
| Black Tie Bike Rentals North Tahoe | `black-tie-adventure-rentals-north-tahoe` | rental | e_bike_city | rental |
| BlueZone Sports - Carson City | `bluezone-sports-carson-city` | rental | e_bike_city | rental |
| BlueZone Sports - South Lake Tahoe | `bluezone-sports-south-lake-tahoe` | rental | e_bike_city | rental |
| BlueZone Sports - Tahoe City | `bluezone-sports-tahoe-city` | rental | e_bike_city | rental |
| Cloud of Goods Reno | `cloud-of-goods-reno` | rental | e_bike_city, e_scooter | rental |
| College Cyclery | `college-cyclery` | — | e_bike_city | rental |
| CyclePaths BikeShop | `cyclepaths-bikeshop` | rental | e_bike_city, e_scooter | rental |
| E-Bike Hub | `e-bike-hub` | rental | e_bike_city | rental |
| Tahoe Multisport — East Shore | `east-shore-e-bikes-tours-rentals` | rental | e_bike_city | rental |
| Eastlake Ebike Rentals | `eastlake-ebike-rentals` | rental | e_bike_city | rental |
| Emerald Bay Bikes | `emerald-bay-bikes` | rental | e_bike_city | rental |
| Flume Trail Bikes | `flume-trail-bikes` | rental | e_bike_city | rental |
| Gondola Ski + Sports | `gondola-ski-sports` | rental+demo | e_bike_city | rental |
| Granite Chief Powered by BlueZone Sports | `granite-chief-powered-by-bluezone-sports` | rental | e_bike_city | rental |
| Great Basin Bicycles | `great-basin-bicycles` | rental | — | rental |
| High Sierra Cycling | `high-sierra-cycling` | rental | e_bike_city | rental |
| Kawasaki Yamaha of Reno | `kawasaki-yamaha-of-reno` | — | — | rental |
| Kiwanis Activity Center and Bike Program | `kiwanis-activity-center-and-bike-program` | — | — | rental |
| Knee Walker Rental Reno | `knee-walker-rental-reno` | rental | — | rental |
| Knee Walker Rental Sparks | `knee-walker-rental-sparks` | rental | — | rental |
| Powder House — Lake Tahoe Bike Rentals | `lake-tahoe-bike-rentals` | rental+lease | e_bike_city | rental |
| Lake Tahoe Slingshots | `lake-tahoe-slingshots` | rental | — | rental |
| Medtech Services | `medtech-services` | rental | — | rental |
| Numotion | `numotion` | — | — | rental |
| Olympic Bike Shop | `olympic-bike-shop` | rental | e_bike_city | rental |
| Pacos Truckee | `pacos-truckee` | — | e_bike_city | rental |
| Pedego Electric Bikes Reno | `pedego-electric-bikes-reno` | rental+demo | e_bike_city | rental |
| Pine Nut Ebike Rentals South Lake Tahoe | `pine-nut-ebike-rentals-south-lake-tahoe` | rental | e_bike_city, e_scooter | rental |
| REI Bike Shop | `rei-bike-shop` | rental | e_bike_city | rental |
| Reno Bike Project | `reno-bike-project` | retail? | — | rental |
| Reno Harley Davidson | `reno-harley-davidson` | — | — | rental |
| Ride Tahoe Rentals | `ride-tahoe-rentals` | rental | e_bike_city | rental |
| Rolling Freedom Motorcycles & Lake Tahoe Slingshots | `rolling-freedom-motorcycles-lake-tahoe-slingshots-motorcycles-moped-scooters-e-bike-rentals-eaglerider-tours` | rental | e_bike_city, e_scooter | rental |
| Sierra Bicycle Supply | `sierra-bicycle-supply` | — | e_bike_city | rental |
| Sierra Cyclesmith Bicycle Shop | `sierra-cyclesmith-bicycle-shop` | — | e_bike_city | rental |
| Sierra Ski & Cycle Works | `sierra-ski-cycle-works` | rental | e_bike_city | rental |
| South Lake E-bikes | `south-lake-e-bikes` | rental | e_bike_city | rental |
| South Shore Bikes | `south-shore-bikes` | rental | e_bike_city | rental |
| South Tahoe Ebike Rentals - Margaritaville | `south-tahoe-ebike-rentals-margaritaville` | rental | e_bike_city | rental |
| Sports Ltd. Rentals | `sports-ltd-rentals` | rental+lease | e_bike_city | rental |
| Stealth Tahoe | `stealth-tahoe` | rental | e_bike_city, onewheel | rental |
| Tahoe Bike Company | `tahoe-bike-company` | rental | e_bike_city | rental |
| Tahoe Donner Bikeworks | `tahoe-donner-bikeworks` | rental | e_bike_city | rental |
| Tahoe Ebikes | `tahoe-ebikes` | rental | e_bike_city | rental |
| Tahoe Electric Bike Rental | `tahoe-electric-bike-rental` | rental | e_bike_city | rental |
| Tahoe Multisport | `tahoe-multisport-e-bike-kayak-stand-up-paddle-board-rentals-tours` | rental | e_bike_city | rental |
| Tahoe Snowbike Rental | `tahoe-snowbike-rental` | rental | — | rental |
| Tahoe Sports Hub | `tahoe-sports-hub` | rental+demo | e_bike_city | rental |
| Tahoe Sports Ltd. | `tahoe-sports-ltd` | rental | e_bike_city, onewheel | rental+lease |
| The BackCountry | `the-backcountry` | rental | e_bike_city | rental |
| Truckee River Bikes | `truckee-river-bikes` | rental | e_bike_city | rental |
| Velo Reno | `velo-reno` | — | e_bike_city | rental |
| Village Ski Loft | `village-ski-loft` | rental+demo | e_bike_city | rental |
| Vista Trail Bikes | `vista-trail-bikes` | rental | e_bike_city | rental |
| West Shore Sports | `west-shore-sports` | rental | e_bike_city | rental+lease |
| West Shore Sports | `west-shore-sports-qmz5wvbk` | rental | e_bike_city | rental+lease |
| West Shore Sports | `west-shore-sports-sunnyside` | rental | e_bike_city | rental+lease |
| Wilderbike | `wilderbike` | — | — | rental |
| evo Tahoe City | `evo-tahoe-city` | rental | e_bike_city | rental |

