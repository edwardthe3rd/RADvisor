# RADvisor

An Airbnb-style mobile marketplace for outdoor adventure equipment rentals, guided experiences, and community.

## Features

- **Equipment Rentals** — List and rent outdoor gear
- **Guided Experiences** — Offer and book guided outdoor adventures
- **Community** — Share trip reports, tips, questions, and events
- **Wishlists** — Save your favorite gear and experiences
- **In-App Messaging** — Coordinate directly with owners and guides
- **AI-Assisted Listings** — Generate descriptions with one tap

## Quick Start

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_dev_data
python manage.py runserver "[::]:8000"
```

### Frontend

```bash
cd mobile
npm install
npx expo start -c
```

### Web app (Next.js 14)

The primary product is the SEO-focused web app in [`web/`](web), a Next.js 14 (App Router) site that renders the Reno/Tahoe outdoor-rental **business directory** on the server (SSR/ISR) for search visibility. It reads the unchanged Django REST API in [`backend/`](backend) and uses an httpOnly-cookie auth BFF (no JWT in client JS).

**Architecture**

- **Public SEO pages** (server-rendered, ISR `revalidate=3600`): `/` (discovery, grouped by category), `/category/[group]`, `/business/[slug]` (with `generateStaticParams` + `LocalBusiness` JSON-LD), `/search`. Plus `app/sitemap.ts`, `app/robots.ts`, and an `opengraph-image`.
- **Auth BFF**: route handlers under [`web/app/api/auth/*`](web/app/api/auth) proxy Django Simple JWT login/refresh into `httpOnly` cookies (`rv_access`, `rv_refresh`). [`web/middleware.ts`](web/middleware.ts) guards `/account` and `/reserve/*`.
- **Reservation flow** (B2C, request-to-reserve, no payment): `/reserve/[slug]` posts to the [`/api/reservations`](web/app/api/reservations) BFF, which forwards to the new Django `ReservationRequest` API (`/api/v1/reservations/`). Requests appear on `/account` and in Django admin.

**Run locally**

```bash
# Terminal 1: Django API (see Backend above), serving http://localhost:8000
cd backend && source .venv/bin/activate && python manage.py runserver 127.0.0.1:8000

# Terminal 2: Next.js web app on http://localhost:3000
cd web
cp .env.example .env.local   # defaults point at http://localhost:8000/api/v1
npm install
npm run dev
```

Populate the directory first by running the business sync on the backend (`python manage.py sync_reno_businesses`); otherwise the discovery page shows an empty state.

**Production build**

```bash
cd web
API_BASE_URL=https://<django-api-host>/api/v1 \
NEXT_PUBLIC_API_BASE_URL=https://<django-api-host>/api/v1 \
NEXT_PUBLIC_SITE_URL=https://<web-host> \
npm run build
```

**Deploy to AWS Amplify Hosting (Next.js SSR).** Create an Amplify app pointed at this repo with monorepo `appRoot` = `web` (build spec: [`web/amplify.yml`](web/amplify.yml)). Amplify detects Next.js and provisions an SSR runtime (do **not** use a static export).

1. Set environment variables: `API_BASE_URL` and `NEXT_PUBLIC_API_BASE_URL` (your deployed Django API, `https://.../api/v1`) and `NEXT_PUBLIC_SITE_URL` (the public web origin).
2. Point your domain (e.g. `radvisor.com`) at the Amplify app. No SPA rewrite is needed — Next.js handles routing server-side.
3. Add the web origin to the API's CORS allowlist. `https://radvisor.com`, `https://www.radvisor.com`, and `https://app.radvisor.com` are in the default `CORS_ALLOWED_ORIGINS` in [`backend/radvisor/settings.py`](backend/radvisor/settings.py); override the `CORS_ALLOWED_ORIGINS` env var for a different domain. (Most traffic is server-side via the BFF and does not need CORS.)

> The legacy Expo app in [`mobile/`](mobile) is retained for the future native release. It is no longer the web target.

### Marketing landing

Static site in `landing/` (hero, synopsis, waitlist form). With the backend running, serve the folder on another port and open `index.html` in the browser:

```bash
# Terminal 1: API (see Backend above)
cd backend && source .venv/bin/activate && python manage.py runserver "[::]:8000"

# Terminal 2: landing
cd landing && python3 -m http.server 5500
```

Then visit `http://localhost:5500`. The form posts to `http://localhost:8000` by default (`data-api-base` on `<body>` in `landing/index.html`). For production, add your marketing site origin to `CORS_ALLOWED_ORIGINS` when `DJANGO_DEBUG` is false. Waitlist signups appear in Django admin under **Waitlist emails**.

> **macOS/Safari note:** bind the dev server to `"[::]:8000"` (IPv6 dual-stack) rather than `0.0.0.0:8000`. `python3 -m http.server` listens on `::`, so Safari resolves `localhost` to `::1`; if Django is IPv4-only, the browser fails the waitlist `fetch()` with `Load failed` (connection refused on `[::1]:8000`).

**Recommended (database + one email):** Leave `data-waitlist-notify-url` unset. The form POSTs to Django `/api/v1/waitlist/` with **full name** and **email**. Set `WAITLIST_NOTIFY_LAMBDA_ARN` to your Lambda’s full ARN (from `sam deploy` output **`WaitlistNotifyFunctionArn`**); Django saves the row and invokes Lambda once. Lambda sends via SES (`NOTIFY_TO`, `FROM_EMAIL` on the function). Grant the Django host `lambda:InvokeFunction` on that ARN. If the ARN is unset, Django uses `send_mail` / SMTP or the console when `DJANGO_DEBUG=True`. The Lambda code is [`infra/lambda/waitlist-notify/handler.py`](infra/lambda/waitlist-notify/handler.py). In the SES **sandbox**, verify sender and recipient; production removes the recipient restriction.

**Optional (browser → API Gateway only):** After `sam deploy`, you can point the landing page at the HTTP API instead of Django by setting **`WaitlistNotifyEndpoint`** on `<body>`:

```html
<body
  data-api-base="https://your-django-host"
  data-waitlist-notify-url="https://abc123.execute-api.us-west-2.amazonaws.com/waitlist/notify"
>
```

You can also set `window.__RADVISOR_WAITLIST_NOTIFY_URL__` before `main.js` loads. The request body is JSON `{"fullName","email"}`. **If `data-waitlist-notify-url` is non-empty, the form does not call Django** — signups are **not** stored in the waitlist table; only the Lambda email runs. Do **not** set both a non-empty Gateway URL and rely on Django for the same submit unless you change the backend: Django would also notify when used, so you could get duplicate emails. For persistence and email together, use **Django only** plus `WAITLIST_NOTIFY_LAMBDA_ARN` as above.

**Deploy the HTTP API (SAM)** — [`infra/lambda/waitlist-notify/template.yaml`](infra/lambda/waitlist-notify/template.yaml) adds **POST** `/waitlist/notify` on the same Lambda. Use the [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html):

```bash
cd infra/lambda/waitlist-notify
sam build
sam deploy --guided
```

Example: `curl -X POST "$WaitlistNotifyEndpoint" -H "Content-Type: application/json" -d '{"fullName":"Test User","email":"test@example.com"}'`. A public Gateway URL can be abused to trigger emails; tighten CORS, add an API key or authorizer, or keep the form on Django-only POST in production.

### Test Accounts

| Email | Password |
|-------|----------|
| alice@example.com | testpass123 |
| bob@example.com | testpass123 |
| cara@example.com | testpass123 |
| dan@example.com | testpass123 |
| emma@example.com | testpass123 |
