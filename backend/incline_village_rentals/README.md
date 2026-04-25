# Incline Village, NV — Outdoor Adventure Rental Directory

A standalone dataset cataloging every real outdoor-adventure equipment rental
business in Incline Village, NV, along with every gear item listed on each
business's website.

## Contents

| File | Description |
| --- | --- |
| `data.py` | Source of truth: Python literal containing all businesses + gear |
| `gear_images.py` | Curated `image_url` per `(shop slug, gear name)` — Commons + Unsplash |
| `build.py` | Generates the SQLite DB and Excel spreadsheet from `data.py` |
| `incline_village_rentals.db` | Generated SQLite database (two tables) |
| `Incline_Village_Rental_Gear.xlsx` | Generated, formatted Excel spreadsheet |

## Rebuilding

From the `backend/` directory. The project ships with a virtualenv at
`backend/.venv`, so the simplest one-liner is:

```bash
cd backend
.venv/bin/python -m incline_village_rentals.build
```

Or, activate the venv first and use whichever Python name your shell has:

```bash
cd backend
source .venv/bin/activate
python -m incline_village_rentals.build    # or: python3 -m …
```

On macOS the bare `python` command is usually not on PATH — use `python3`
or the venv's `.venv/bin/python` as shown above.

## Loading into the main app (iOS / API)

The Expo app reads **`/api/v1/listings/`**, which uses Django’s default DB
(`db.sqlite3`) and the **`catalog.GearItem`** model — not the standalone
`incline_village_rentals.db` file.

After building the spreadsheet/standalone DB (optional), push catalog rows
into Django:

```bash
cd backend
.venv/bin/python manage.py seed_incline_listings
```

- Creates **five system “shop owner” users** (one per business), email pattern
  `{business-slug}@incline-shops.radvisor.local`, unusable password (display-only
  in the feed; not for login).
- Each **`GearItem`** is keyed by `(owner, title)` so you can re-run safely.
- **`--purge`** first deletes every user whose email ends with
  `@incline-shops.radvisor.local` and their listings (CASCADE), then re-seeds.

Then restart `runserver` if it was already running and pull-to-refresh in the app.

## Businesses included

1. **Village Ski Loft** — 800 Tahoe Blvd · skis/boards + bikes · year-round
2. **Diamond Peak Ski Resort — Rental Shop** — 1210 Ski Way · ski resort · Dec–Apr
3. **Tahoe Multisport** — 797 Southwood Blvd · year-round multisport
4. **Flume Trail Bikes** — behind Tunnel Creek Cafe · MTB + shuttle · May–Nov
5. **All Around Tahoe** — delivery-only · SUP / kayak / bike · summer

## Schema

### `businesses`
`id, slug, name, business_type, address, city, state, zip, phone, email,
website, hours, season, notes, source`

### `gear_items`
`id, business_id, category, name, brand, description, sizes, price, price_unit,
price_weekend, price_peak, price_full_day`

## Excel sheets

1. **Overview** — business directory with hyperlinks
2. **All Gear** — flat, filterable master list (74+ rows)
3. One sheet per business, grouped by gear category with subheader bands
4. **Price Cheat Sheet** — cheapest daily rate in each common category

## Sources

Every business entry cites the public URL it was compiled from
(`businesses.source`). Prices and catalogs were pulled from each company's
official website in April 2026; call ahead to confirm availability.
