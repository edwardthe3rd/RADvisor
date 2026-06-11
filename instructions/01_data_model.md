# RADvisor — Data Model

**What this file covers:** The complete Supabase/Postgres schema. This is the **single source of truth** for all data structures.
**Input:** None — this is foundational.
**Output:** SQL migration file at `/supabase/migrations/0001_initial_schema.sql` and generated TypeScript types at `/lib/supabase/types.ts`.
**Sprint:** 1 | Status: Build first, before anything else.

---

## 1. Design Principles

- **Operators have many equipment items.** One-to-many is the core relationship.
- **Categories and subcategories are stable enums/slugs**, defined once in config and referenced by slug everywhere.
- **Pricing is tiered** (half-day / full-day / multi-day-per-day / weekly) because rental pricing is rarely a single number.
- **Nullable until known.** We launch with incomplete data. Most fields are nullable; we fill them in over time. `last_verified` tells users (and us) how stale a record is.
- **Soft-delete via `is_active`**, never hard-delete operators or gear.

---

## 2. Enums

```sql
create type inventory_sync_type as enum ('manual', 'api', 'scrape', 'none');
create type skill_level as enum ('beginner', 'intermediate', 'advanced', 'all');
create type equipment_condition as enum ('new', 'excellent', 'good', 'fair');
```

---

## 3. Tables

### `operators`
The rental businesses.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` |
| name | text | Business name. Required. |
| slug | text | Unique, URL-safe. Required. |
| description | text | Short blurb about the business |
| address | text | Street address |
| city | text | |
| state | text | Default 'NV' |
| zip | text | |
| lat | float8 | For geo/map/distance queries |
| lng | float8 | |
| phone | text | |
| email | text | |
| website | text | |
| booking_url | text | Direct link to their booking page if any |
| hours | jsonb | `{ "mon": "9-5", ... }`, nullable |
| categories | text[] | Category slugs this operator serves |
| logo_url | text | Supabase Storage path |
| photos | text[] | Storage paths |
| rating_external | numeric | Google/Yelp rating if known (display only) |
| rating_external_count | int | # of external reviews |
| inventory_sync_type | inventory_sync_type | Default 'manual' |
| notes_internal | text | Private ops notes, never shown to users |
| is_active | boolean | Default true |
| last_verified | date | When we last confirmed the business info |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Default `now()` |

Indexes: unique on `slug`; GIN index on `categories`; index on `(lat, lng)`.

---

### `equipment`
Individual rentable items (or item types) offered by an operator.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| operator_id | uuid | FK → operators.id, on delete cascade |
| category | text | Category slug. Required. |
| subcategory | text | Subcategory slug |
| name | text | Display name, e.g. "Full-Day Powder Ski Package" |
| brand | text | |
| model | text | |
| size | text | Free text: "165cm", "L", "Size 10", nullable |
| description | text | |
| skill_level | skill_level | Default 'all' |
| condition | equipment_condition | Nullable |
| price_hourly | numeric | Nullable |
| price_half_day | numeric | Nullable |
| price_full_day | numeric | The primary price most ops quote |
| price_multi_day | numeric | Per-day rate for multi-day rentals |
| price_weekly | numeric | Nullable |
| deposit | numeric | Security deposit if any |
| quantity_total | int | Total units they own, nullable |
| quantity_available | int | Live count — null until sync exists |
| image_url | text | |
| is_popular | boolean | Default false — drives discovery page features |
| is_active | boolean | Default true |
| last_verified | date | When pricing/availability was last confirmed |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Default `now()` |

Indexes: index on `operator_id`; index on `category`; index on `(category, skill_level)`; index on `price_full_day`.

---

### `categories` (reference table — optional, can also be static config)
Recommend keeping this as **static config** in `/lib/config/categories.ts` rather than a DB table, since it changes rarely and the frontend needs it for navigation. Structure:

```typescript
export const CATEGORIES = [
  {
    slug: 'snow_sports',
    label: 'Snow Sports',
    icon: 'snowflake',
    subcategories: [
      { slug: 'alpine_ski', label: 'Alpine Skis' },
      { slug: 'alpine_ski_demo', label: 'Alpine Ski Demo' },
      { slug: 'snowboard', label: 'Snowboards' },
      { slug: 'cross_country_ski', label: 'Cross-Country Skis' },
      { slug: 'splitboard', label: 'Splitboards' },
      { slug: 'snowshoe', label: 'Snowshoes' },
      { slug: 'sled', label: 'Sleds & Tubes' },
      { slug: 'apparel_snow', label: 'Snow Apparel' },
    ],
  },
  {
    slug: 'mountain_biking',
    label: 'Mountain Biking',
    icon: 'bike',
    subcategories: [
      { slug: 'xc_bike', label: 'Cross-Country Bikes' },
      { slug: 'trail_bike', label: 'Trail Bikes' },
      { slug: 'enduro_bike', label: 'Enduro Bikes' },
      { slug: 'downhill_bike', label: 'Downhill Bikes' },
      { slug: 'ebike_mtb', label: 'Electric MTBs' },
      { slug: 'kids_bike', label: 'Kids Bikes' },
    ],
  },
  {
    slug: 'road_cycling',
    label: 'Road & Gravel Cycling',
    icon: 'bike',
    subcategories: [
      { slug: 'road_bike', label: 'Road Bikes' },
      { slug: 'gravel_bike', label: 'Gravel Bikes' },
      { slug: 'ebike_road', label: 'Electric Road Bikes' },
    ],
  },
  {
    slug: 'water_sports',
    label: 'Water Sports',
    icon: 'waves',
    subcategories: [
      { slug: 'kayak', label: 'Kayaks' },
      { slug: 'canoe', label: 'Canoes' },
      { slug: 'paddleboard', label: 'Paddleboards (SUP)' },
      { slug: 'raft', label: 'Rafts' },
      { slug: 'jet_ski', label: 'Jet Skis / PWC' },
      { slug: 'wakeboard', label: 'Wakeboards & Water Skis' },
      { slug: 'wetsuit', label: 'Wetsuits & Gear' },
      { slug: 'boat', label: 'Boats' },
    ],
  },
  {
    slug: 'camping',
    label: 'Camping & Backpacking',
    icon: 'tent',
    subcategories: [
      { slug: 'tent', label: 'Tents' },
      { slug: 'sleep_system', label: 'Sleeping Bags & Pads' },
      { slug: 'backpack', label: 'Backpacks' },
      { slug: 'cooking', label: 'Camp Kitchen & Stoves' },
      { slug: 'camp_furniture', label: 'Camp Furniture' },
      { slug: 'full_kit', label: 'Complete Camp Kits' },
    ],
  },
  {
    slug: 'camping_vehicles',
    label: 'Camper Vans & RVs',
    icon: 'caravan',
    subcategories: [
      { slug: 'camper_van', label: 'Camper Vans' },
      { slug: 'rv', label: 'RVs & Motorhomes' },
      { slug: 'travel_trailer', label: 'Travel Trailers' },
      { slug: 'rooftop_tent', label: 'Rooftop Tents & Overland' },
    ],
  },
  {
    slug: 'off_road',
    label: 'Off-Road & Powersports',
    icon: 'mountain',
    subcategories: [
      { slug: 'atv', label: 'ATVs' },
      { slug: 'utv', label: 'UTVs / Side-by-Sides' },
      { slug: 'dirt_bike', label: 'Dirt Bikes' },
      { slug: 'snowmobile', label: 'Snowmobiles' },
    ],
  },
  {
    slug: 'motorcycles',
    label: 'Motorcycles',
    icon: 'bike',
    subcategories: [
      { slug: 'street_moto', label: 'Street Motorcycles' },
      { slug: 'adventure_moto', label: 'Adventure / Dual-Sport' },
    ],
  },
  {
    slug: 'rock_climbing',
    label: 'Rock Climbing',
    icon: 'mountain',
    subcategories: [
      { slug: 'climbing_shoes', label: 'Climbing Shoes' },
      { slug: 'harness', label: 'Harnesses' },
      { slug: 'rope_hardware', label: 'Ropes & Hardware' },
      { slug: 'crash_pad', label: 'Crash Pads' },
      { slug: 'full_climbing_kit', label: 'Complete Climbing Kits' },
    ],
  },
  {
    slug: 'electric_transport',
    label: 'Electric Transportation',
    icon: 'zap',
    subcategories: [
      { slug: 'e_scooter', label: 'Electric Scooters' },
      { slug: 'e_bike_city', label: 'City E-Bikes' },
      { slug: 'onewheel', label: 'Onewheels / EUC' },
    ],
  },
  {
    slug: 'winter_other',
    label: 'Other Winter',
    icon: 'snowflake',
    subcategories: [
      { slug: 'ice_skates', label: 'Ice Skates' },
      { slug: 'avalanche_safety', label: 'Avalanche Safety Gear' },
    ],
  },
  {
    slug: 'aerial',
    label: 'Aerial Adventures',
    icon: 'wind',
    subcategories: [
      { slug: 'paraglider', label: 'Paragliding Gear' },
      { slug: 'wingsuit', label: 'Wingsuits' },
    ],
  },
] as const;
```

> Adjust categories to match what your seed data actually contains. Don't show empty categories on the discovery page — hide any with zero active equipment.

---

## 4. Relationships Diagram

```
operators (1) ──────< (many) equipment
     │
     └── categories[]  (array of slugs, denormalized for fast filtering)

categories (static config) ── referenced by slug in operators.categories
                                              and equipment.category
```

---

## 5. `updated_at` Trigger

Add a trigger so `updated_at` auto-updates on every row change:

```sql
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger operators_updated_at before update on operators
  for each row execute function set_updated_at();
create trigger equipment_updated_at before update on equipment
  for each row execute function set_updated_at();
```

---

## 6. Row-Level Security (RLS)

For v1, consumer pages read public data. Enable RLS with a public read policy on active rows:

```sql
alter table operators enable row level security;
alter table equipment enable row level security;

create policy "public read active operators" on operators
  for select using (is_active = true);
create policy "public read active equipment" on equipment
  for select using (is_active = true);
```

Writes happen only through the admin dashboard using the service role key (server-side only — **never expose the service role key to the client**). Sprint 2 adds per-operator write policies.

---

## 7. Generating Types

After every schema change, regenerate types so Cursor stays accurate:

```bash
supabase gen types typescript --local > lib/supabase/types.ts
```

---

## 8. Known Gaps

- `quantity_available` stays null until an operator sync exists. UI must treat null as "availability unknown — contact to confirm," never as zero.
- External ratings (`rating_external`) are display-only and must be clearly attributed to their source (Google/Yelp) to avoid implying they're RADvisor reviews.
