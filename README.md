# RADvisor

Discovery platform connecting outdoor enthusiasts with gear-rental operators in the Reno–Tahoe region — every rental operator within 50 miles of Reno, browsable by category, guided quiz, and search.

## Repo

| Path | What |
|------|------|
| [`web/`](web/) | Next.js 14 + Supabase app ([theradvisor.com](https://theradvisor.com)) — **all product code lives here** |
| [`supabase/`](supabase/) | SQL migrations (schema source of truth) and seed scripts |
| [`instructions/`](instructions/) | Product specs — scope, data model, feature contracts |
| [`mobile/`](mobile/) | Expo app (parked; Phase 2+) |

## Quick start

From `web/`:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Keep `npm run dev` running in that terminal, then open [http://localhost:3000](http://localhost:3000). No other services required — data comes from Supabase.

## Troubleshooting

### Git index lock file

If Git reports that `.git/index.lock` already exists, first make sure no Git command is currently running and close any editor Git panels that may be refreshing the repo in the background.

Then run this from the repo root, `~/RADvisor`:

```bash
rm -f .git/index.lock
```

After that, retry the original Git command. If the lock file comes back repeatedly, quit Cursor or any other app that may be checking Git status in the background, then remove the lock file again.

## Operator data pipeline

Operator discovery runs entirely from `supabase/seed/` against **Google Places API (New)** — no server required.

**Prerequisites:** Enable **Places API (New)** in Google Cloud, restrict your key, and put `GOOGLE_PLACES_API_KEY` in `supabase/seed/.env` (see `supabase/seed/.env.example`).

```bash
# Discovery sweep: rectangle-restricted tiles over the Reno–Tahoe AOI × query terms,
# DISTANCE-ranked, adaptive quadtree (cap hits subdivide), dedup on place_id.
# Resumable + cached — a rerun only bills new (tile × query) pairs.
node supabase/seed/quadtree_sweep_coverage.mjs    # write coverage.geojson; preview the AOI in geojson.io first
node supabase/seed/quadtree_sweep.mjs --dry-run   # print the plan + cost estimate, fetch nothing
node supabase/seed/quadtree_sweep.mjs             # run it
```

This writes the raw operator pool to `supabase/seed/quadtree_sweep_operators.{json,csv}`. From there, triage and inventory extraction follow the gate ladder in [`instructions/extraction/00_general.md`](instructions/extraction/00_general.md) — locality, domain-relevance, and rental-evidence gates decide which operators become rows in `supabase/seed/operators.json`.

Push the curated master into Supabase for the web app:

```bash
cd web
npm run seed   # upserts supabase/seed/operators.json into the live DB
```

See [SECURITY.md](SECURITY.md) for API key restrictions and quota guidance.

## Documentation

The product is specified in [`instructions/`](instructions/) — read `00_overview.md` first. `01_data_model.md` is the single source of truth for the schema. Security practices are in [SECURITY.md](SECURITY.md).

### ⚠️ The spec docs live in a SEPARATE git repo

The `instructions/` folder you see here is **symlinks** pointing into a different git repository:

```
/Users/echalicki/Documents/Business/RADvisor/RADvisor Instructions
```

Editing a doc in Cursor edits the real file — but **committing this code repo does NOT save doc changes.** The docs have their own repo, so they need their own commit, in their own folder. This is the #1 reason a doc edit looks "lost": it was never committed, because the commit happened in the wrong repo.

**Check what changed in the docs repo:**

```bash
cd "/Users/echalicki/Documents/Business/RADvisor/RADvisor Instructions"
git status     # "working tree clean" = everything committed; a list = uncommitted doc edits
```

**Commit doc changes:**

```bash
cd "/Users/echalicki/Documents/Business/RADvisor/RADvisor Instructions"
git add -A instructions/          # stages both edited and brand-new doc files
git commit -m "Update specs: <what changed>"
```

After committing, `git status` should say **"nothing to commit, working tree clean."** That clean message is the proof it saved — if files still show in red/green, it didn't go through.

**Branch:** the docs repo stays on `main` — commit straight to it. There's no `Testing` branch here and you don't need one; docs don't deploy, so there's nothing to test before promoting. The `Testing` → `main` flow is **only** for *this* code repo (see [SYNC.md](SYNC.md)), because that's what protects the live site.
