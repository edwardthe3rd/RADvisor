# RADvisor

Discovery platform connecting outdoor enthusiasts with gear-rental operators in the Reno–Tahoe region — every rental operator within 50 miles of Reno, browsable by category, guided quiz, and search.

## Repo

| Path | What |
|------|------|
| [`web/`](web/) | Next.js 14 + Supabase app ([theradvisor.com](https://theradvisor.com)) — **all product code lives here**; waitlist at `/app/waitlist` |
| [`supabase/`](supabase/) | SQL migrations (schema source of truth) and seed scripts |
| [`instructions/`](instructions/) | Product specs — scope, data model, feature contracts |
| [`backend/`](backend/) | Legacy Django API — transitional; used only as the Google Places sync pipeline |
| [`landing/`](landing/) | **Deprecated** — static waitlist; superseded by `web/app/app/waitlist/` |
| [`mobile/`](mobile/) | Expo app (parked; Phase 2+) |

## Quick start

From `web/`:

```bash
npm install
cp .env.example .env.local   # add Supabase keys (dashboard → Settings → API)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No other services required — data comes from Supabase.

Waitlist page (local): [http://localhost:3000/app/waitlist](http://localhost:3000/app/waitlist). Set `NEXT_PUBLIC_WAITLIST_NOTIFY_URL` in `.env.local` for production-style form submits.

### Admin dashboard

Set `ADMIN_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` in `web/.env.local`, then visit `/admin`.

### Re-seeding operators

The operator directory was seeded from the legacy Django sync. To refresh:

```bash
cd backend && .venv/bin/python ../supabase/seed/export_django.py   # Django DB → operators.json
cd ../web && SUPABASE_SERVICE_ROLE_KEY=... npx tsx ../supabase/seed/import.ts
```

## Waitlist domain cutover (radvisor.com → theradvisor.com)

The waitlist lives at **`https://theradvisor.com/app/waitlist`** in the `web/` Amplify app.

1. Set Amplify env on the **web** app: `NEXT_PUBLIC_SITE_URL=https://theradvisor.com`, `NEXT_PUBLIC_WAITLIST_NOTIFY_URL=<API Gateway /waitlist/notify URL>`.
2. Deploy `web/` and smoke-test the form at `/app/waitlist`.
3. Redeploy the waitlist Lambda so CORS allows `theradvisor.com` — see [`infra/lambda/waitlist-notify/README.md`](infra/lambda/waitlist-notify/README.md).
4. **301 redirect** `radvisor.com` and `www.radvisor.com` → `https://theradvisor.com/app/waitlist` (Amplify domain redirects or Route 53).
5. Decommission the separate **landing** Amplify app once redirects are verified.

## Documentation

The product is specified in [`instructions/`](instructions/) — read `00_overview.md` first. `01_data_model.md` is the single source of truth for the schema. Security practices are in [SECURITY.md](SECURITY.md).

**Cursor / AI agents:** project instructions are in [`.cursorrules`](.cursorrules) and `instructions/` — not in this README.
