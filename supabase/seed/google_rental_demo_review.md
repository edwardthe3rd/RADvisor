# Google rent vs demo cross-check

Generated: 2026-06-14

Run `node supabase/seed/check_google_rental_demo.mjs` to refresh (requires `GOOGLE_PLACES_API_KEY` in `supabase/seed/.env`).

Uses Google Places **editorialSummary**, **generativeSummary**, and **reviewSummary** when available (~half of listings). When Google returns no summary (e.g. RMU Truckee), check Maps manually — structured "Services" are not always in the API.

## Summary

| Google signal | Count |
|---------------|------:|
| Rental | 129 |
| Rental + demo | 0 |
| Demo only | 1 |
| Retail only | 1 |
| Unknown (no summary text) | 177 |
| Fetch errors | 0 |
| **Mismatches vs current label** | **24** |

## Demo only (Google)

| Name | Slug | Google says | Current | Snippet |
|------|------|-------------|---------|--------|
| Moment Skis (Demo Only) | `moment-skis` | demo | demo_only_labeled | Ski shop with a factory where handmade skis are produced, plus demo and boot-fitting services. |



## Rental + demo (Google — treat as full rental)

_None_


## Retail only (Google — review for deactivation)

| Name | Slug | Google says | Current | Snippet |
|------|------|-------------|---------|--------|
| Gear Hut | `gear-hut` | retail_only | rental_labeled | Affordable consignment store for gently used outdoor gear and clothing. |



## Mismatches (review first)

| Name | Slug | Google says | Current | Snippet |
|------|------|-------------|---------|--------|
| Alpenglow Sports (Demo Only) | `alpenglow-sports` | unknown | demo_only_labeled | Friendly, knowledgeable sporting-goods store for mountaineering, plus biking, hiking, trail running and skiing. |
| BlueZone Sports - Carson City | `bluezone-sports-carson-city` | unknown | rental_labeled | Outdoor store and bike shop, stocking gear for skiing, along with clothing and snowshoes. |
| BlueZone Sports - South Lake Tahoe | `bluezone-sports-south-lake-tahoe` | unknown | rental_labeled | Outdoor sports outfitter selling new and used gear for skiing, snowboarding, biking, kayaking and wakeboarding, among ot |
| BlueZone Sports - Tahoe City | `bluezone-sports-tahoe-city` | unknown | rental_labeled | bluezone sports - tahoe city |
| CV Sports | `cv-sports` | unknown | rental_labeled | cv sports |
| Coalition Snow (Demo Only) | `coalition-snow` | unknown | demo_only_labeled | coalition snow |
| Donner Lake Water Sports | `donner-lake-water-sports` | unknown | rental_labeled | donner lake water sports |
| Gear Hut | `gear-hut` | retail_only | rental_labeled | Affordable consignment store for gently used outdoor gear and clothing. |
| Gondola Ski + Sports | `gondola-ski-sports` | unknown | rental_labeled | Friendly store featuring equipment for skiing and snowboarding, plus bicycles. |
| Granite Chief Powered by BlueZone Sports | `granite-chief-powered-by-bluezone-sports` | unknown | rental_labeled | granite chief powered by bluezone sports visitors say this ski shop offers a great selection of gear and a wide variety  |
| Heavenly Sports - Cecil's Plaza | `heavenly-sports-cecils-plaza` | unknown | rental_labeled | heavenly sports - cecil's plaza |
| Heavenly Sports - Tamarack Lodge | `heavenly-sports-tamarack-lodge` | unknown | rental_labeled | heavenly sports - tamarack lodge |
| Mountain Hardware & Sports | `mountain-hardware-sports` | unknown | rental_labeled | Full-service hardware store offering paint and sporting goods such as fishing gear and camping supplies. |
| Parallel Mountain Sports | `parallel-mountain-sports` | unknown | rental_labeled | Place to shop for skis and other equipment, like boots and gloves, with helpful staff. |
| Pedal Sports Reno-Sparks | `pedal-sports-reno-sparks` | unknown | rental_labeled | Bicycle sales and repairs. Staff is friendly and helpful. |
| Powder House Ski & Board: Pro Snow (Demo Only) | `powder-house-ski-board-pro-snow` | unknown | demo_only_labeled | powder house ski & board: pro snow |
| Quiver Sports | `quiver-sports` | unknown | rental_labeled | quiver sports |
| RMU Truckee Ski Shop (Demo Only) | `rmu-truckee-ski-shop` | unknown | demo_only_labeled | rmu truckee ski shop |
| Tahoe Mountain Sports | `tahoe-mountain-sports` | unknown | rental_labeled | Locally owned shop for hiking, camping, skiing, running, and other outdoor sports apparel and footwear. |
| Tahoe Paddle Sports — Sand Harbor | `tahoe-paddle-sports-sand-harbor-clear-kayaking` | unknown | rental_labeled | tahoe paddle sports - sand harbor clear kayaking |
| Tahoe Paddle Sports | `tahoe-paddle-sports-clear-kayak-adventures-near-south-lake-tahoe-ca` | unknown | rental_labeled | Guided kayak tours of Lake Tahoe using clear-bottomed watercraft. |
| Tahoe Sports Ltd. | `tahoe-sports-ltd` | unknown | rental_labeled | Sporting-goods establishment carrying boots for snowboarding, skiing, and hiking, plus bikes. |
| Tahoe Sports Ltd. Kayak & Fish | `tahoe-sports-ltd-kayak-fish` | unknown | rental_labeled | tahoe sports ltd. kayak & fish |
| West Shore Sports | `west-shore-sports-qmz5wvbk` | unknown | rental_labeled | west shore sports |



## Unknown — no Google summary text (177)

These need website or manual Maps review. See `google_rental_demo_report.json` → `unknowns`.

