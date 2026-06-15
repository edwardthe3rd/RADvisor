# off_road — verification worksheet

Generated: 2026-06-14 · 52 active operators

Re-run: `node supabase/seed/verify/gather_evidence.mjs off_road`

Detected = signals scanned from the website + Google Places text. This is a
**proposal for review**, not applied data.

- **Hard conflicts** contradict current data — resolve these first.
- **Proposals** are additive (e.g. a rental shop that also runs demos, or new
  subcategory tags) — confirm before applying.

## Summary

| Signal | Count |
|--------|------:|
| Rental detected | 23 |
| Demo detected | 2 |
| Lease detected | 0 |
| Retail-only suspected | 1 |
| **Hard conflicts** | **28** |
| Proposals (additive) | 30 |
| Needs manual fetch (no html/Google) | 0 |

## Hard conflicts vs current (review first)

| Operator | Slug | Conflict | Detected | Pages | Snippet |
|------|------|------|------|------:|------|
| Adrenaline Connection | `adrenaline-connection-inc` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 0 | Adrenaline Connection, Inc.  car_repair service store point_of_interest establishment |
| Anderson Powersports Reno | `anderson-powersports-reno` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 6 | Anderson Powersports Reno - New & Used Powersports, Parts, and Service in Reno, NV, near Sun Valley and Verdi Skip to main content Reno Search Go Search Reno 775.355.8810 Toggle navigation Home Inventory Showroom All Inv |
| Custom Concepts NV | `custom-concepts-nv` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 0 | Custom Concepts NV  tire_shop sporting_goods_store auto_parts_store car_repair store point_of_interest service establishment |
| Eagle Ridge Snowmobile Tours | `eagle-ridge-snowmobile-tours` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 0 | EAGLE RIDGE SNOWMOBILE TOURS  service point_of_interest establishment |
| High Line Adventures | `high-line-adventures` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 1 | Lake Tahoe Snowmobile Tours: Unleash Winter Thrills with Us! / High Line Adventures Snowmobile Tours |
| JR Powersports | `jr-powersports` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 1 | Home top of page JR Powersports Motorcycles ATV, UTV All Repair Needs All your powersports repairs in one place. ​ ​ 775-241-2530 Call today for an appointment We look forward to talking with you soon!! See our reviews o |
| Kawasaki Yamaha of Reno | `kawasaki-yamaha-of-reno` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 6 | Here are some of the service specials that we’re currently offering: Side by Side basic service: Get your all terrain vehicles ready for the fall/winter season with our basic service starting at, $199. |
| Lake Tahoe Jeep Tours | `lake-tahoe-jeep-tours` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 0 | Lake Tahoe Jeep Tours  travel_agency point_of_interest service establishment |
| Lake Tahoe Snowmobile Tours | `lake-tahoe-snowmobile-tours-inc` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 1 | Come find us at Donner Lake Marina as we get ready to open up for boating season! @ Donnerlakemarina. |
| Love Your Life BackCountry | `love-your-life-backcountry` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 1 | Coming Soon loveyourlifebackcountry.com We re under construction. Please check back for an update soon. |
| Moon Rocks | `moon-rocks` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 0 | Moon Rocks Visitors say this off-roading area offers a variety of trails for all skill levels, including rock crawling, and is a great place for dirt bikes, ATVs, and 4x4s. They also highlight the awesome rock formations |
| Moto Tahoe | `moto-tahoe` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 0 | Moto Tahoe  point_of_interest service establishment |
| Motorsport Express Truckee | `motorsport-express-truckee` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 2 | Motosport Express Truckee / 530.414.3119 Home SERVICES ABOUT LOCATION 530.414.8396 Motorcycles • ATV • Snowmobiles • Watercraft REPAIR MOTORCYCLES SNOWMOBILES ATVS WATERCRAFT STREET BIKES Specializing in maintenance, par |
| North Tahoe Winter Adventures | `north-tahoe-winter-adventures` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 0 | North Tahoe Winter Adventures  service point_of_interest establishment |
| Pacific Crest Snowcats | `pacific-crest-snowcats` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 2 | Only 208 days, 12 hours and 7 minutes until the st We’ve officially wrapped up operations for the sea It’s been a feast or famine type of season here in Our guides got out for some training and a snow co We’ve been taking advantage of some down time to s It’s  |
| Rock Rat Adventures | `rock-rat-adventures` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?); looks retail-only — review for deactivation | retail? | 6 | RockRatAdventures.com is for sale / HugeDomains Skip to main content Search +1-303-893-0552 Home FAQs About us Contact us My account My favorites Shopping cart RockRatAdventures.com Buy now: $1,895 &#9656; Buy now Proces |
| Rock Trax UTV | `rock-trax-utv` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 0 | Rock Trax UTV  store point_of_interest establishment |
| SnoVentures Activity Zone | `snoventures-activity-zone` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 0 | SnoVentures Activity Zone  ski_resort sports_activity_location point_of_interest establishment |
| Street Rider of Reno | `street-rider-of-reno` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 1 | Street Rider of Reno 0 Skip to Content Street Rider of Reno Home About Open Menu Close Menu Street Rider of Reno Home About Open Menu Close Menu Home About View fullsize Street Rider of Reno Our Current Hours Monday - 9: |
| Sunnyside | `sunnyside` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 3 | SEE OUR MENU & HOURS STAY WITH US No matter the season, you’ll find just what you dreamed Tahoe to be in our classic lakeside lodge. |
| Tahoe Family Adventures | `tahoe-family-adventures-vg1ibwz4` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 1 | Site is undergoing maintenance tahoefamilyadventures.com Site is undergoing maintenance Site will be available soon. Thank you for your patience. |
| Tahoe Outdoor Adventures | `tahoe-outdoor-adventures` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 1 | Explore Private Snowboarding Lessons Gain Skills Explore Safe, YEAR-ROUND Activities for all levels Tahoe Outdoor Adventures Offers Year-Round Adventures and Activities! Explore Tahoe with our seasonal tours, ranging from family-friendly outings to advanced, c |
| Tahoe Outdoor Dirt Bike Location | `tahoe-outdoor-dirt-bike-location` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 1 | Explore Private Snowboarding Lessons Gain Skills Explore Safe, YEAR-ROUND Activities for all levels Tahoe Outdoor Adventures Offers Year-Round Adventures and Activities! Explore Tahoe with our seasonal tours, ranging from family-friendly outings to advanced, c |
| Tahoe Toys & Adventures | `tahoe-toys-adventures-llc` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 0 | Tahoe Toys & Adventures LLC  point_of_interest service establishment |
| The Pits | `the-pits` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 0 | The Pits  point_of_interest establishment |
| The Sierra Sled Shop | `the-sierra-sled-shop` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 3 | 6795 SIERRA SLED SHOP POWERSPORTS GARAGE at Stewart's Marine Service SERVICES SERVICES TOP END REBUILDS, CLUTCH SERVICING, & PERFORMANCE Top End Repair, Full Engine Rebuild Service, Clutch Repair/Service, & Performance Tuning REPAIRS & MAINTENANCE Seasonal Mai |
| UTV Addiction | `utv-addiction` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 1 | UTV Addiction - UTV Parts, Service, Installation - Reno, NV 2175 Market St STE A. 89502 775-813-8882 utvaddiction@gmail.com Select Page 775-813-8882 UTV Addiction has moved. Our new location is one half-mile west directl |
| Virginia City off road Experience | `virginia-city-off-road-experience` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 0 | Virginia City off road Experience People say this tourist attraction offers an adventurous off-road experience with beautiful views and opportunities to explore historic sites and mines. They highlight the knowledgeable |

## Proposals — additive, confirm before applying

| Operator | Slug | Proposal | Detected | Snippet |
|------|------|------|------|------|
| Adventure Lake Tahoe | `adventure-lake-tahoe` | propose subcategories: atv | rental | LEARN MORE Electric Hydrofoil Experience the feeling of Flying over Water with Electric Hydrofoil Lessons and rentals! LEARN MORE Lake Tahoe Peak and Beach ELECTRIC Bike Adventure Explore Lake Tahoe the fun and effortless way on this guided e-bike adventure. |
| Anderson Powersports Reno | `anderson-powersports-reno` | propose subcategories: atv, dirt_bike, snowmobile, utv | — | Anderson Powersports Reno - New & Used Powersports, Parts, and Service in Reno, NV, near Sun Valley and Verdi Skip to main content Reno Search Go Search Reno 775.355.8810 Toggle navigation Home Inventory Showroom All Inv |
| Battle Born Powersports | `battle-born-powersports` | propose subcategories: atv, utv | rental | UTV RZR Rentals in S. |
| Coldstream Adventures | `coldstream-adventures-tours` | propose subcategories: snowmobile | rental | What’s Included 🏔️ Snowmobile Rental 🧭 Professional Guide 🪖 Helmet & Goggles 📋 Instruction Provided Winter gear rentals available ✔ No experience required ✔ Easy-to-ride machines ✔ Guides set the pace ✔ Family friendly adventure First time on a snowmobile? |
| Eagle Ridge Snowmobile Tours | `eagle-ridge-snowmobile-tours` | propose subcategories: snowmobile | — | EAGLE RIDGE SNOWMOBILE TOURS  service point_of_interest establishment |
| Full Access Tahoe | `full-access-tahoe` | propose subcategories: snowmobile, utv | rental | Off-Roading UTV Rentals in Lake Tahoe & Carson City / Full Access Tahoe 775-309-8789 Info@fullaccesstahoe. |
| High Line Adventures | `high-line-adventures` | propose subcategories: snowmobile | — | Lake Tahoe Snowmobile Tours: Unleash Winter Thrills with Us! / High Line Adventures Snowmobile Tours |
| JR Powersports | `jr-powersports` | propose subcategories: atv, utv | — | Home top of page JR Powersports Motorcycles ATV, UTV All Repair Needs All your powersports repairs in one place. ​ ​ 775-241-2530 Call today for an appointment We look forward to talking with you soon!! See our reviews o |
| Kawasaki Yamaha of Reno | `kawasaki-yamaha-of-reno` | propose subcategories: atv, dirt_bike, utv | — | Here are some of the service specials that we’re currently offering: Side by Side basic service: Get your all terrain vehicles ready for the fall/winter season with our basic service starting at, $199. |
| Lake Tahoe Adventure OHV Tours | `lake-tahoe-adventure-ohv-tours` | propose subcategories: atv, snowmobile, utv | rental | Get inspired to embark on your own journey through Lake Tahoe's majestic landscapes! Close Modal View Full Video span; cls: uk-animation-slide-bottom-medium; delay: 500;"> Awaken Your Wild Side Learn More Lake tahoe adventures Adventure Awaits Lake Tahoe Tours |
| Lake Tahoe Adventures | `lake-tahoe-adventures` | propose subcategories: atv, snowmobile, utv | rental | Get inspired to embark on your own journey through Lake Tahoe's majestic landscapes! Close Modal View Full Video span; cls: uk-animation-slide-bottom-medium; delay: 500;"> Awaken Your Wild Side Learn More Lake tahoe adventures Adventure Awaits Lake Tahoe Tours |
| Lake Tahoe Snowmobile Tours | `lake-tahoe-snowmobile-tours-inc` | propose subcategories: snowmobile | — | Come find us at Donner Lake Marina as we get ready to open up for boating season! @ Donnerlakemarina. |
| Moon Rocks | `moon-rocks` | propose subcategories: atv, dirt_bike | — | Moon Rocks Visitors say this off-roading area offers a variety of trails for all skill levels, including rock crawling, and is a great place for dirt bikes, ATVs, and 4x4s. They also highlight the awesome rock formations |
| Motorsport Express Truckee | `motorsport-express-truckee` | propose subcategories: atv, dirt_bike, snowmobile, utv | — | Motosport Express Truckee / 530.414.3119 Home SERVICES ABOUT LOCATION 530.414.8396 Motorcycles • ATV • Snowmobiles • Watercraft REPAIR MOTORCYCLES SNOWMOBILES ATVS WATERCRAFT STREET BIKES Specializing in maintenance, par |
| Nevada Adventure Rentals | `nevada-adventure-rentals` | propose subcategories: atv, dirt_bike, utv | rental | Climbing Gear, Outdoor Equipment, Motorcycle Rentals - Reno, NV Skip to content (775) 686-3557 0 items Products search Shop Climbing Gear Accessories Ascenders & Pulleys Belay Devices Big Wall Bouldering Carabiners / Draws / Slings Chalk Chalk Bags Harnesses H |
| Rock Trax UTV | `rock-trax-utv` | propose subcategories: utv | — | Rock Trax UTV  store point_of_interest establishment |
| Rolling Freedom Motorcycles & Lake Tahoe Slingshots | `rolling-freedom-motorcycles-lake-tahoe-slingshots-motorcycles-moped-scooters-e-bike-rentals-eaglerider-tours` | propose subcategories: dirt_bike, utv | rental | Slingshot, Motorcycle, Moped, and E-Bike adventure rentals in Lake Tahoe Rentals Tahoe Rentals Reno Rentals Sales All Inventory for Sale Motorcycles Moped Scooters E-Bikes CanAM Spyder Maps About Us News Contact FAQ BOOK NOW 0 Cart 0 items Total &#36; 0. |
| Sierra Adventures | `sierra-adventures-activities-reno-tahoe-llc` | propose subcategories: atv | rental | Sierra Adventures / Adventures in Reno &#8211; Tahoe Sierra Adventures &#8211; Adventures in Reno &#8211; Tahoe Social Sierra Adventures Adventures in Reno &#8211; Tahoe Menu Skip to content Home About Us Custom Adventure Tours Earth Adventures Wind Adventures |
| Stealth Tahoe | `stealth-tahoe` | propose subcategories: dirt_bike | rental | Stealth Tahoe Skip to content Free Shipping on orders $100+ *Some exclusions apply E-Bikes Super73 E Ride Pro Rad Power Bikes Stealth Electric Bikes Moonbikes Bike Insurance Sno-Go Sno-Go Sno-Go Rental Bike Shop Brakes Disc Brakes Brake Pads Brake Rotors Hoses |
| Tahoe Dirt Bikes | `tahoe-dirt-bikes` | propose subcategories: dirt_bike, snowmobile, utv | rental | Tahoe Dirt Bikes &#8211; Lake Tahoe&#039;s Best Adventure Rental Skip to content Tahoe Dirt Bikes Lake Tahoe&#039;s Best Adventure Rental Rental Options Photos and Testimonials Blog Contact Us FAQ Rental Options Photos and Testimonials Blog Contact Us FAQ Fill |
| Tahoe Family Adventures | `tahoe-family-adventures` | propose subcategories: snowmobile | rental | Site is undergoing maintenance tahoefamilyadventures.com Site is undergoing maintenance Site will be available soon. Thank you for your patience. |
| Tahoe Outdoor Adventures | `tahoe-outdoor-adventures` | propose subcategories: dirt_bike | — | Explore Private Snowboarding Lessons Gain Skills Explore Safe, YEAR-ROUND Activities for all levels Tahoe Outdoor Adventures Offers Year-Round Adventures and Activities! Explore Tahoe with our seasonal tours, ranging from family-friendly outings to advanced, c |
| Tahoe Outdoor Dirt Bike Location | `tahoe-outdoor-dirt-bike-location` | propose subcategories: dirt_bike | — | Explore Private Snowboarding Lessons Gain Skills Explore Safe, YEAR-ROUND Activities for all levels Tahoe Outdoor Adventures Offers Year-Round Adventures and Activities! Explore Tahoe with our seasonal tours, ranging from family-friendly outings to advanced, c |
| Tahoe Sled School | `tahoe-sled-school` | also appears to offer demos → propose offers_demo=true; propose subcategories: snowmobile | rental+demo | Snowmobile Rentals / Tahoe Sled School / United States top of page Home Services Rentals More Use tab to navigate through the menu items. |
| Tahoe Snowbike Rental | `tahoe-snowbike-rental` | propose subcategories: dirt_bike | rental | Timbersled Rental / Tahoe Snowbike Rental / Truckee top of page Home The Stable Pricing Terms and Conditions FAQ Calendar Gift Card Contact Apparel More Use tab to navigate through the menu items. |
| The Biggest Little ATV/UTV Shop | `the-biggest-little-atvutv-shop` | propose subcategories: atv, utv | rental | The Biggest Little ATV Shop The Biggest Little ATV Shop Home Contact Sand Paddle Rentals Photos FAQ Home Contact Sand Paddle Rentals Photos FAQ Top Rated ATV and UTV Repair in the Northern Nevada Area Founded in 2020 by a native Nevadan, The Biggest Little ATV |
| The Sierra Sled Shop | `the-sierra-sled-shop` | propose subcategories: snowmobile | — | 6795 SIERRA SLED SHOP POWERSPORTS GARAGE at Stewart's Marine Service SERVICES SERVICES TOP END REBUILDS, CLUTCH SERVICING, & PERFORMANCE Top End Repair, Full Engine Rebuild Service, Clutch Repair/Service, & Performance Tuning REPAIRS & MAINTENANCE Seasonal Mai |
| Tom's Snowmobile & Service | `toms-snowmobiles-services` | also appears to offer demos → propose offers_demo=true; propose subcategories: atv, snowmobile, utv | demo | Ski-Doo Snowmobile Sales & Service CA / Sierraville, California New & Used Snowmobile Sales & Parts Dealer Toggle navigation Home Showroom All Inventory New Inventory Pre-Owned New Models Can-Am Ski-Doo Lynx Promotions Value Your Trade Schedule A Demo Services |
| UTV Addiction | `utv-addiction` | propose subcategories: utv | — | UTV Addiction - UTV Parts, Service, Installation - Reno, NV 2175 Market St STE A. 89502 775-813-8882 utvaddiction@gmail.com Select Page 775-813-8882 UTV Addiction has moved. Our new location is one half-mile west directl |
| Zephyr Cove Snowmobile Tours | `zephyr-cove-snowmobiling-tours` | propose subcategories: atv, snowmobile, utv | rental | com/ Search Zephyr Cove Resort & Lake Tahoe Cruises,760 Highway 50, Zephyr Cove Nevada theme change summer theme winter theme summer theme icon winter theme icon weather - Tahoe Snowmobiling Experience &#176;F Book Now Plan History Maps & Parking Travel Tips W |

## Needs manual fetch (website + Google both empty)

_None._

## All operators (detected signals + proposed subcategories)

| Operator | Slug | Detected | Subcategories (detected) | Current flags |
|------|------|------|------|------|
| Adrenaline Connection | `adrenaline-connection-inc` | — | — | rental |
| Adventure Lake Tahoe | `adventure-lake-tahoe` | rental | atv | rental |
| Anderson Powersports Reno | `anderson-powersports-reno` | — | atv, dirt_bike, snowmobile, utv | rental |
| Battle Born Powersports | `battle-born-powersports` | rental | atv, utv | rental |
| Coldstream Adventures | `coldstream-adventures-tours` | rental | snowmobile | rental |
| Custom Concepts NV | `custom-concepts-nv` | — | — | rental |
| Dirt Gypsy Adventures | `dirt-gypsy-adventures` | rental | — | rental |
| Doing It Big Rentals | `doing-it-big-rentals` | rental | — | rental |
| Eagle Ridge Snowmobile Tours | `eagle-ridge-snowmobile-tours` | — | snowmobile | rental |
| Full Access Tahoe | `full-access-tahoe` | rental | snowmobile, utv | rental |
| Full Throttle Tahoe | `full-throttle-tahoe` | rental | — | rental |
| High Line Adventures | `high-line-adventures` | — | snowmobile | rental |
| JR Powersports | `jr-powersports` | — | atv, utv | rental |
| Kawasaki Yamaha of Reno | `kawasaki-yamaha-of-reno` | — | atv, dirt_bike, utv | rental |
| Lake Tahoe Adventure OHV Tours | `lake-tahoe-adventure-ohv-tours` | rental | atv, snowmobile, utv | rental |
| Lake Tahoe Adventures | `lake-tahoe-adventures` | rental | atv, snowmobile, utv | rental |
| Lake Tahoe Jeep Tours | `lake-tahoe-jeep-tours` | — | — | rental |
| Lake Tahoe Slingshots | `lake-tahoe-slingshots` | rental | — | rental |
| Lake Tahoe Snowmobile Tours | `lake-tahoe-snowmobile-tours-inc` | — | snowmobile | rental |
| Love Your Life BackCountry | `love-your-life-backcountry` | — | — | rental |
| Moon Rocks | `moon-rocks` | — | atv, dirt_bike | rental |
| Moto Tahoe | `moto-tahoe` | — | — | rental |
| Motorsport Express Truckee | `motorsport-express-truckee` | — | atv, dirt_bike, snowmobile, utv | rental |
| Nevada Adventure Rentals | `nevada-adventure-rentals` | rental | atv, dirt_bike, utv | rental |
| North Tahoe Winter Adventures | `north-tahoe-winter-adventures` | — | — | rental |
| Pacific Crest Snowcats | `pacific-crest-snowcats` | — | — | rental |
| Rock Rat Adventures | `rock-rat-adventures` | retail? | — | rental |
| Rock Trax UTV | `rock-trax-utv` | — | utv | rental |
| Rolling Freedom Motorcycles & Lake Tahoe Slingshots | `rolling-freedom-motorcycles-lake-tahoe-slingshots-motorcycles-moped-scooters-e-bike-rentals-eaglerider-tours` | rental | dirt_bike, utv | rental |
| Sidestreet Boutique | `sidestreet-boutique` | rental | — | rental |
| Sierra Adventures | `sierra-adventures-activities-reno-tahoe-llc` | rental | atv | rental |
| SnoVentures Activity Zone | `snoventures-activity-zone` | — | — | rental |
| Stealth Tahoe | `stealth-tahoe` | rental | dirt_bike | rental |
| Street Rider of Reno | `street-rider-of-reno` | — | — | rental |
| Sunnyside | `sunnyside` | — | — | rental |
| Tahoe Dirt Bikes | `tahoe-dirt-bikes` | rental | dirt_bike, snowmobile, utv | rental |
| Tahoe Family Adventures | `tahoe-family-adventures` | rental | snowmobile | rental |
| Tahoe Family Adventures | `tahoe-family-adventures-vg1ibwz4` | — | — | rental |
| Tahoe Outdoor Adventures | `tahoe-outdoor-adventures` | — | dirt_bike | rental |
| Tahoe Outdoor Adventures and Rentals | `tahoe-outdoor-adventures-and-rentals` | rental | — | rental |
| Tahoe Outdoor Dirt Bike Location | `tahoe-outdoor-dirt-bike-location` | — | dirt_bike | rental |
| Tahoe Sled School | `tahoe-sled-school` | rental+demo | snowmobile | rental |
| Tahoe Snowbike Rental | `tahoe-snowbike-rental` | rental | dirt_bike | rental |
| Tahoe Toys & Adventures | `tahoe-toys-adventures-llc` | — | — | rental |
| The Biggest Little ATV/UTV Shop | `the-biggest-little-atvutv-shop` | rental | atv, utv | rental |
| The Pits | `the-pits` | — | — | rental |
| The Sierra Sled Shop | `the-sierra-sled-shop` | — | snowmobile | rental |
| Tom's Snowmobile & Service | `toms-snowmobiles-services` | demo | atv, snowmobile, utv | rental |
| Truckee Bike Park | `truckee-bike-park` | rental | — | rental |
| UTV Addiction | `utv-addiction` | — | utv | rental |
| Virginia City off road Experience | `virginia-city-off-road-experience` | — | — | rental |
| Zephyr Cove Snowmobile Tours | `zephyr-cove-snowmobiling-tours` | rental | atv, snowmobile, utv | rental |

