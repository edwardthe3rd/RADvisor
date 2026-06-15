# Cross-category batch review — non-rental operators

Generated 2026-06-14 from all category scans. **Nothing here is applied** — this is
the consolidated sign-off list. 102 operators were flagged across categories;
below they're grouped by recommended action and confidence.

---

## BUCKET 1 — DEACTIVATE ✅ APPLIED 2026-06-14 (34 operators set is_active=false)
_(high confidence: not a consumer gear-rental business. Reversible — re-activate any via operator_website_verified.json if mis-flagged.)_

### Services / orgs / products (not rentals at all)
| Slug | Why |
|------|-----|
| `clean-up-the-lake-501c3` | Lake-cleanup **nonprofit** |
| `numotion` | **Medical mobility** (wheelchairs/scooters) |
| `technical-equipment-cleaners` | Equipment **cleaning** service |
| `scuba-mask-defog` | A **product**, not an operator location |
| `diverobotix` | Commercial/robotic diving services |
| `infiniti-diving-services` | Commercial diving services |
| `lake-tahoe-diving-environmental-llc` | Environmental diving services |
| `marine-taxonomic-services-ltd-tahoe` | Aquatic research/diving services |
| `cruisers-academy` | Boating **school** |
| `kiwanis-activity-center-and-bike-program` | **Charity** bike program |

### Captained charters / boat clubs (customer never gets the gear)
`baywatch-boat-charters`, `grand-tahoe-charters`, `elevation-surf-charters`,
`elevated-boat-club-lake-tahoe`

### Guided tours / experiences (not equipment rental)
`tahoe-whitewater-tours-truckee-river`, `eagle-ridge-snowmobile-tours`,
`lake-tahoe-jeep-tours`, `lake-tahoe-snowmobile-tours-inc`,
`north-tahoe-winter-adventures`, `pacific-crest-snowcats`,
`virginia-city-off-road-experience`, `high-line-adventures`

### Aerial flight experiences (entire `aerial` category — 0 rentals found)
`hang-gliding-tahoe`, `slide-mountain-hang-glider-landing-zone`,
`north-shore-parasail`, `uprising-paragliding`, `soaring-nv`,
`sport-aviation-center-llc`

### Retail chains (sell, don't rent)
`patagonia`, `patagonia-outlet`, `scheels`, `west-marine`, `camping-world-reno`,
`mark-fore-and-strike`

**Bucket 1 total: 34 operators → `is_active = false`.**

---

## BUCKET 2 — RECATEGORIZE to `motorcycles` (powersports/motorcycle dealers)
These are dealers (sell, mostly don't rent) currently mistagged as e-transport/off-road.
Move to `motorcycles` and verify rental; or deactivate if sales-only.

`kawasaki-yamaha-of-reno`, `reno-harley-davidson`, `anderson-powersports-reno`,
`jr-powersports`, `motorsport-express-truckee`, `street-rider-of-reno`

---

## BUCKET 3 — KEEP (legit rentals the scan missed behind JS booking widgets)
**Do NOT deactivate.** Research/name confirms these rent; they just need subcats added.

- Water: `truckee-river-raft-co`, `truckee-river-raft-co-f995eima`,
  `truckee-river-rafting`, `lake-tahoe-watersports`, `obexers-boat-company`,
  `lakeshore-paddleboard-co`, `paddle-to-you`
- Off-road (UTV/ATV/sled/dirt-bike rental names): `rock-trax-utv`, `utv-addiction`,
  `the-pits`, `tahoe-toys-adventures-llc`, `tahoe-outdoor-dirt-bike-location`,
  `the-sierra-sled-shop`, `custom-concepts-nv`, `moto-tahoe`

---

## BUCKET 4 — VERIFY individually (retail vs rental unknown; medium confidence)
Left as-is. Not in the deactivate batch — check each before deciding.

- **Bike shops** (rent vs retail/repair): `bike-lake-tahoe`, `college-cyclery`,
  `pacos-truckee`, `sierra-cyclesmith-bicycle-shop`, `velo-reno`,
  `clearly-tahoe-bikes`, `mountain-dog-cycling`, `pedal-sports-reno-sparks`,
  `sierra-bicycle-supply`, `the-bike-shop`, `wilderbike`, `reno-bike-project`,
  `bicycle-service-center`
- **Climbing gyms / outfitters / guides**: `high-altitude-fitness`,
  `high-altitude-fitness-truckee`, `alpinistas`, `south-passage-outfitters`,
  `upcycled-adventures`, `tahoe-outdoor-adventures`, `tahoe-family-adventures-vg1ibwz4`,
  `love-your-life-backcountry`, `rock-rat-adventures`, `irie-rafting-company-inc`,
  `advanced-marine`, `sunnyside`, `adrenaline-connection-inc`
- **Ski shops (JS/no-website — presumed rentals)**: `galena-sports` (no site),
  `nordic-ski-trails-at-the-lake-tahoe-community-college` (no site), `totally-board`,
  `truckee-boardhouse`, `quiver-sports`, `heavenly-sports-tamarack-lodge` (no site),
  `heavenly-sports-cecils-plaza`, `asc-training-center-formerly-auburn-ski-club`
  (site down), `play-it-again-sports` (confirmed rents), `donner-ski-shop`

---

### To apply Buckets 1–2 once you sign off
Add `{ "is_active": false, "verified_at": "2026-06-14", "notes_internal": "<reason>" }`
per slug to `operator_website_verified.json` (Bucket 2: `{ "categories": ["motorcycles"], ... }`),
then `apply_operator_verified.mjs` + `verify_consistency.mjs`.
