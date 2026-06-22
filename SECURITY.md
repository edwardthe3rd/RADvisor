# RADvisor Security Practices

## Secrets & environment files

- **Never commit real keys.** `.env`, `.env.local`, and `.env*.local` are gitignored; only `*.env.example` files (with placeholders) belong in git.
- `supabase/seed/.env` — local secret for the operator-discovery scripts (`GOOGLE_PLACES_API_KEY`). Gitignored; read only when running the Places sweep locally.
- `web/.env.local` — Next.js env. Anything prefixed `NEXT_PUBLIC_` is **baked into the browser bundle and public**. Only the Supabase URL and anon key (public by design, protected by RLS) may use that prefix. Server-only keys (e.g. `SUPABASE_SERVICE_ROLE_KEY`) must never get the prefix and must only be read in route handlers / server components.
- If a real key ever lands in a commit, **rotate it immediately** (Google Cloud Console / Supabase dashboard) — deleting the file later does not un-leak it.

## Next.js (web)

- Security headers set globally in `next.config.mjs` (HSTS, nosniff, frame-deny, referrer policy, permissions policy); `X-Powered-By` disabled.
- No consumer accounts in v1 (out of scope per `instructions/00_overview.md` §7) — no session handling on public pages.
- `/admin` is gated by `ADMIN_SECRET` (server env): the login action compares with a constant-time check and issues an `httpOnly`, `secure` (in prod), `SameSite=Lax` cookie containing a hash of the secret, scoped to `/admin`. All admin mutations re-assert the cookie server-side.
- `/admin` is `noindex` and disallowed in robots.txt.

## Supabase

- Row Level Security is enabled on all tables; the anon key only permits the policies defined in `supabase/migrations/`.
- The service-role key bypasses RLS — server-side only, never `NEXT_PUBLIC_`, never committed.

## API key (Google Places)

- Used **locally only** by the operator-discovery scripts in `supabase/seed/`. Never exposed to the browser.
- In Google Cloud Console, restrict the Places key to the Places API only and set a daily quota cap so a leaked key can't run up a bill.

## Checklist for new secrets

1. Add a placeholder line to the relevant `.env.example` with a comment.
2. Put the real value in `.env` / `.env.local` (gitignored) and in the host's env config (Amplify console, docker-compose, etc.).
3. Confirm with `git status` that no env file shows up before committing.
