# RADvisor

Discovery platform connecting outdoor enthusiasts with gear-rental operators in the Reno–Tahoe region — every rental operator within 50 miles of Reno, browsable by category, guided quiz, and search.

## Repo

| Path | What |
|------|------|
| [`web/`](web/) | Next.js 14 + Supabase app ([theradvisor.com](https://theradvisor.com)) — **all product code lives here** |
| [`supabase/`](supabase/) | SQL migrations (schema source of truth) and seed scripts |
| [`instructions/`](instructions/) | Product specs — scope, data model, feature contracts |
| [`backend/`](backend/) | Legacy Django API — transitional; used only as the Google Places sync pipeline |
| [`mobile/`](mobile/) | Expo app (parked; Phase 2+) |

## Quick start

From `web/`:

```bash
npm install
cp .env.example .env.local   # add Supabase keys (dashboard → Settings → API)
npm run dev
```

Keep `npm run dev` running in that terminal, then open [http://localhost:3000](http://localhost:3000). No other services required — data comes from Supabase.

## Google Places sync (operator pipeline)

The [`backend/`](backend/) Django app pulls rental businesses from **Google Places API (New)**, then filters out hotels, retail-only shops, out-of-region results, and other non-rental listings. Filtering lives in `backend/apps/catalog/business_filters.py` and `rental_taxonomy.py`; the ingest command is `sync_reno_businesses`.

**Prerequisites:** Enable **Places API (New)** in Google Cloud, restrict your key, and set `GOOGLE_PLACES_API_KEY` in `backend/.env` (see `backend/.env.example`).

From `backend/`:

```bash
python3 -m venv .venv && source .venv/bin/activate   # first time
pip install -r requirements.txt

# Preview: calls Google, applies filters, prints accepted/rejected — no DB writes
python manage.py sync_reno_businesses --dry-run

# Write accepted businesses to local SQLite (default)
python manage.py seed_categories   # once, if categories are missing
python manage.py sync_reno_businesses

# Re-apply filters to rows already in the DB
python manage.py prune_reno_businesses --dry-run
```

Push refreshed data into Supabase for the web app:

```bash
python ../supabase/seed/export_django.py
cd ../web && SUPABASE_SERVICE_ROLE_KEY=... npx tsx ../supabase/seed/import.ts
```

See [SECURITY.md](SECURITY.md) for API key restrictions and quota guidance.

## Documentation

The product is specified in [`instructions/`](instructions/) — read `00_overview.md` first. `01_data_model.md` is the single source of truth for the schema. Security practices are in [SECURITY.md](SECURITY.md).

