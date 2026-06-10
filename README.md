# RADvisor

Discovery platform connecting outdoor enthusiasts with gear-rental operators in the Reno–Tahoe region — every rental operator within 50 miles of Reno, browsable by category, guided quiz, and search.

## Repo

| Path | What |
|------|------|
| [`web/`](web/) | Next.js 14 + Supabase app ([theradvisor.com](https://theradvisor.com)) — **all product code lives here** |
| [`supabase/`](supabase/) | SQL migrations (schema source of truth) and seed scripts |
| [`instructions/`](instructions/) | Product specs — scope, data model, feature contracts |
| [`backend/`](backend/) | Legacy Django API — transitional; used only as the Google Places sync pipeline |
| [`landing/`](landing/) | Static marketing site and waitlist |
| [`mobile/`](mobile/) | Expo app (parked; Phase 2+) |

## Quick start

From `web/`:

```bash
npm install
cp .env.example .env.local   # add Supabase keys (dashboard → Settings → API)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No other services required — data comes from Supabase.

### Admin dashboard

Set `ADMIN_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` in `web/.env.local`, then visit `/admin`.

### Re-seeding operators

The operator directory was seeded from the legacy Django sync. To refresh:

```bash
cd backend && .venv/bin/python ../supabase/seed/export_django.py   # Django DB → operators.json
cd ../web && SUPABASE_SERVICE_ROLE_KEY=... npx tsx ../supabase/seed/import.ts
```

## Documentation

The product is specified in [`instructions/`](instructions/) — read `00_overview.md` first. `01_data_model.md` is the single source of truth for the schema. Security practices are in [SECURITY.md](SECURITY.md).

**Cursor / AI agents:** project instructions are in [`.cursorrules`](.cursorrules) and `instructions/` — not in this README.
