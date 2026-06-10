# RADvisor — Database Seeding

**What this file covers:** How to get operator and equipment data into Supabase, and the rules for keeping it clean.
**Input:** The existing operator Excel workbook (~45 operators, 155+ SKUs) plus ongoing manual research.
**Output:** Seed scripts in `/supabase/seed/` and a populated database.
**Sprint:** 1 | Status: Build right after the schema.

---

## 1. Data Sources, in Priority Order

1. **Existing Excel workbook** — the founder's researched list of regional operators and SKUs. Primary source for initial seed.
2. **Operator websites** — fill gaps in pricing, brands, hours, contact info.
3. **Google Maps / Yelp** — addresses, coordinates, phone, external ratings, hours.
4. **Direct outreach** — phone/email to confirm and enrich. The most accurate source; use for the operators you intend to pre-sell.

---

## 2. Seed Pipeline

```
Excel (.xlsx)
   │  parse → normalize → validate
   ▼
seed/operators.json   seed/equipment.json
   │
   ▼  upsert via Supabase service-role client (server-side script)
Supabase tables
```

Build a Node/TypeScript script `seed/import.ts` that:
1. Reads cleaned JSON files.
2. Upserts operators first (so equipment FKs resolve).
3. Upserts equipment, linking to operators by a stable key (use `slug` or a temp external id).
4. Logs a summary: rows inserted, rows updated, validation warnings.

Make the script **idempotent** — running it twice should not create duplicates. Upsert on `slug` for operators and on a composite natural key for equipment (e.g. `operator_id + name + size`).

---

## 3. Normalization Rules

Apply these during the Excel → JSON step:

- **Slugs:** lowercase, hyphenated, ASCII only. `"Tahoe Sports Ltd."` → `tahoe-sports-ltd`. Ensure uniqueness; append `-2` on collision.
- **Categories:** map free-text from the spreadsheet to the canonical slugs in `01_data_model.md`. Maintain a mapping table in the script (`"skis" → "snow_sports/alpine_ski"`). **Reject anything that doesn't map** and log it for manual review rather than guessing.
- **Prices:** strip `$`, commas; parse to numeric. Blank → null, never 0. If a sheet lists only one price with no tier label, put it in `price_full_day`.
- **Phone:** normalize to `(775) 555-1234` format.
- **Coordinates:** if missing, geocode the address (see §5).
- **Sizes:** keep as free text; don't try to standardize across categories (a ski "165cm" and a shoe "10.5" can't share a schema).

---

## 4. Data Quality Standard

Every operator row at launch must have, at minimum:
- `name`, `slug`, `city`, at least one of `phone`/`website`, and `categories` (non-empty).

Every equipment row must have:
- `operator_id`, `category`, `name`, and at least one price field populated.
- `last_verified` set to the date you confirmed it (the import date is acceptable for the initial seed).

Flag — but still import — rows missing the "nice to have" fields (brand, model, size, photos). Partial data is fine; the admin dashboard (`06`) is where gaps get filled in over time.

---

## 5. Geocoding

For operators missing lat/lng, geocode the address once at seed time and store the result — don't geocode at request time. Options: a one-off script using a geocoding API, or manual lookup for ~45 rows (entirely feasible at this volume). Store coordinates so the 50-mile radius filter and any future map view work without external calls.

---

## 6. Defining the 50-Mile Radius

The launch geography is everything within 50 miles of downtown Reno (approx `39.5296, -119.8138`). During seeding, compute each operator's distance from that center and **exclude or flag** anything outside the radius. Keep the center point and radius in `/lib/config/geo.ts` so it's a single source of truth and easy to expand later.

```typescript
export const REGION_CENTER = { lat: 39.5296, lng: -119.8138 };
export const REGION_RADIUS_MILES = 50;
```

---

## 7. Marking Popular Items

The discovery page features `is_popular = true` equipment. For launch, set this manually/heuristically:
- The most-rented categories in the region (skis, snowboards, paddleboards, mountain bikes, camper vans).
- One or two flagship items per major operator.

Later this can be driven by real view/booking data. For now, a human picks them. Aim for enough popular items to fill each category's discovery row (~6 per category).

---

## 8. Known Gaps

- **Inventory counts are not in the seed.** `quantity_available` stays null until sync (see `07_api_strategy.md`).
- **Brands/models will be incomplete** for many SKUs initially. That's acceptable; track completeness as a metric in the admin dashboard.
- **Hours may be stale.** Pull from Google at seed time but mark `last_verified` honestly.
