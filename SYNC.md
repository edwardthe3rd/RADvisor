# RADvisor — Sync & Deploy Cheat-Sheet

The #1 source of confusion: **GitHub stores files, Supabase stores the live database, and
the two never talk to each other unless you run a script.** Keep that in mind and the rest
falls into place.

- `supabase/seed/operators.json` = the **master copy** of operator data (lives in git).
- The Supabase `operators` table = the **live deployment** of that data (what the website reads).

---

## Two credentials (both in `web/.env.local`, never committed — it's gitignored)

| Credential | Used by | Notes |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | `npm run seed` (Supabase **API**) | Already set. NOT affected by resetting the DB password. |
| `SUPABASE_DB_URL` | `npm run migrate` (direct **Postgres**) | Optional. Only needed for schema changes. |

These are different things: the service key is for the API; the DB URL is a full Postgres
connection string (with the DB password in it). That's why `seed` can work while `migrate` fails.

---

## Everyday workflow

**1. Push files → GitHub** (in the repo folder, or use Cursor's Source Control panel):
```
git status                          # see what changed
git add <files you mean to commit>  # stage specific files (keeps your edits separate from others')
git commit -m "message"
git push origin Testing
```
This moves files only. The live site does not change.

**2. Push data → Supabase** (this is what updates the live site):
```
cd web
npm run seed        # upserts supabase/seed/operators.json into the live DB (uses the service key)
```

---

## Which change goes where

| Change | GitHub | Supabase |
|---|---|---|
| App code (`web/`, `landing/`) | ✅ commit/push | — |
| `supabase/migrations/*.sql` | ✅ commit/push | applied via `npm run migrate` |
| `supabase/seed/*.json` | ✅ commit/push | pushed via `npm run seed` |
| Live operator/equipment rows | mirror in `operators.json` | ✅ this is the live data |

**Golden rule:** edit data in `operators.json` → commit to GitHub → `npm run seed` to deploy.
That keeps the file and the database in lockstep.

---

## "Supabase → GitHub" (capturing live data back into a file)

You don't push a database to GitHub — you **export it to a file, then commit the file.**
If you always follow the golden rule above, you rarely need this. If a change was ever made
*directly* in the Supabase dashboard, regenerate `operators.json` from the DB (or run
`supabase db dump` for a full SQL snapshot) and commit that.

---

## `migrate` (optional — only for new schema migrations)

Needs `SUPABASE_DB_URL`. Get it from Supabase Dashboard → **Connect** → **Session pooler**,
then replace `[YOUR-PASSWORD]` with your DB password — **delete the `[ ]` brackets too**.
If it keeps fighting you, skip it: paste the new migration's SQL into the Supabase **SQL Editor**,
or hand the `.sql` file to Claude to apply. Nothing is blocked by `migrate` not running.

---

## Common errors & fixes

- **"Another git process seems to be running… index.lock"** — a leftover lock from an
  interrupted commit. Fix: `rm -f .git/index.lock` (quit any hung git GUI first).
- **migrate: "tenant/user … not found"** — wrong host. Copy the exact URI from the dashboard;
  don't hand-type it. (us-west-1 pooler host is `aws-1-us-west-1.pooler.supabase.com`.)
- **migrate: "password authentication failed (28P01)"** — bad password *in the URL*. Usual causes:
  leftover `[ ]` brackets around it, special characters that need URL-encoding, or a copy slip.
  Easiest: reset to an **alphanumeric-only** password.
- **migrate: ENOTFOUND on `db.<ref>.supabase.co`** — the direct connection is IPv6-only on the
  free plan; use the **pooler** URI instead.
- **Cursor says "file changed on disk"** — Claude edited a file you have open with unsaved changes.
  Save/close before letting Claude edit it, or reload from disk after.

---

## Project facts

- Repo: `github.com/edwardthe3rd/RADvisor` · working branch: `Testing`
- Local path: `/Users/echalicki/Documents/Business/RADvisor/GitHub 2/RADvisor`
- Supabase project ref: `wzngubwctlorewegtbgo` · region: `us-west-1`
- Don't run git in two tools at once, and commit from one place — that's what causes the lock files.
