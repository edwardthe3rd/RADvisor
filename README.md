# RADvisor

Marketplace for outdoor adventure equipment rentals, guided experiences, and community — with a public rental-business directory for Reno & Lake Tahoe.

## Repo

| Path | What |
|------|------|
| [`backend/`](backend/) | Django REST API |
| [`web/`](web/) | Next.js directory site ([theradvisor.com](https://theradvisor.com)) |
| [`mobile/`](mobile/) | Expo app (iOS, Android, web) |
| [`landing/`](landing/) | Marketing site and waitlist |

## Quick start

**API** — from `backend/`:

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add GOOGLE_PLACES_API_KEY
python manage.py migrate
python manage.py runserver "[::]:8000"
```

**Web directory** — from `web/` (API must be running on port 8000):

```bash
npm install && npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Mobile** — from `mobile/`:

```bash
npm install && npx expo start
```

To populate the rental directory locally, see [instructions/01_local_dev.md](instructions/01_local_dev.md).

## Documentation

Detailed setup, sync workflow, production deploy, and Amplify notes live in [`instructions/`](instructions/):

| Doc | Contents |
|-----|----------|
| [00_overview.md](instructions/00_overview.md) | Architecture, phases, repo map |
| [01_local_dev.md](instructions/01_local_dev.md) | Env, Google sync, prune, local apps |
| [02_production_directory.md](instructions/02_production_directory.md) | Live site, API deploy, troubleshooting |
| [03_amplify_and_landing.md](instructions/03_amplify_and_landing.md) | Amplify monorepo, waitlist |

**Cursor / AI agents:** project instructions are in [`.cursorrules`](.cursorrules) and `instructions/` — not in this README.

## Test accounts

| Email | Password |
|-------|----------|
| alice@example.com | testpass123 |
| bob@example.com | testpass123 |
| cara@example.com | testpass123 |
| dan@example.com | testpass123 |
| emma@example.com | testpass123 |
