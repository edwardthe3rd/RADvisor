# RADvisor Security Practices

## Secrets & environment files

- **Never commit real keys.** `.env`, `.env.local`, and `.env*.local` are gitignored; only `*.env.example` files (with placeholders) belong in git.
- `backend/.env` — Django server-side secrets (`DJANGO_SECRET_KEY`, `GOOGLE_PLACES_API_KEY`, `OPENAI_API_KEY`, SES/Lambda config). Auto-loaded by `settings.py` for local runs; real environment variables (docker-compose, Amplify, EC2) always take precedence.
- `web/.env.local` — Next.js env. Anything prefixed `NEXT_PUBLIC_` is **baked into the browser bundle and public**. Only the Supabase URL and anon key (public by design, protected by RLS) may use that prefix. Server-only keys (e.g. `SUPABASE_SERVICE_ROLE_KEY`) must never get the prefix and must only be read in route handlers / server components.
- If a real key ever lands in a commit, **rotate it immediately** (Google Cloud Console / Supabase dashboard) — deleting the file later does not un-leak it.

## Django (backend)

- `DJANGO_DEBUG` defaults to **off**. Local dev sets `DJANGO_DEBUG=True` in `backend/.env`.
- With DEBUG off, startup **fails loudly** unless `DJANGO_SECRET_KEY` (strong, unique) and `DJANGO_ALLOWED_HOSTS` are set.
- Production (DEBUG off) automatically enables: HTTPS redirect (`SECURE_SSL_REDIRECT`, proxy-aware via `X-Forwarded-Proto`), HSTS (30 days), secure session/CSRF cookies.
- All environments send `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`.
- API rate limits (DRF throttling): anonymous 100/min, authenticated 300/min, waitlist signups 10/hour per IP. Tune with `THROTTLE_ANON` / `THROTTLE_USER` / `THROTTLE_WAITLIST`.
- CORS: allow-all only when DEBUG; production uses the explicit allowlist in `CORS_ALLOWED_ORIGINS`.
- Run `python manage.py check --deploy` with `DJANGO_DEBUG=False` before each production deploy.

## Next.js (web)

- Security headers set globally in `next.config.mjs` (HSTS, nosniff, frame-deny, referrer policy, permissions policy); `X-Powered-By` disabled.
- No consumer accounts in v1 (out of scope per `instructions/00_overview.md` §7) — no session handling on public pages.
- `/admin` is gated by `ADMIN_SECRET` (server env): the login action compares with a constant-time check and issues an `httpOnly`, `secure` (in prod), `SameSite=Lax` cookie containing a hash of the secret, scoped to `/admin`. All admin mutations re-assert the cookie server-side.
- `/admin` is `noindex` and disallowed in robots.txt.

## Supabase

- Row Level Security is enabled on all tables; the anon key only permits the policies defined in `supabase/migrations/`.
- The service-role key bypasses RLS — server-side only, never `NEXT_PUBLIC_`, never committed.

## API keys (Google Places, OpenAI)

- Used **server-side only** (Django management commands / views). Never expose to the browser.
- In Google Cloud Console, restrict the Places key to the Places API only and set a daily quota cap so a leaked key can't run up a bill.

## Checklist for new secrets

1. Add a placeholder line to the relevant `.env.example` with a comment.
2. Put the real value in `.env` / `.env.local` (gitignored) and in the host's env config (Amplify console, docker-compose, etc.).
3. Confirm with `git status` that no env file shows up before committing.
