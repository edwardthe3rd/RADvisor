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
python manage.py runserver 0.0.0.0:8000
```

### Frontend

```bash
cd mobile
npm install
npx expo start -c
```

### Marketing landing

Static site in `landing/` (hero, synopsis, waitlist form). With the backend running, serve the folder on another port and open `index.html` in the browser:

```bash
# Terminal 1: API (see Backend above)
cd backend && source .venv/bin/activate && python manage.py runserver 0.0.0.0:8000

# Terminal 2: landing
cd landing && python3 -m http.server 5500
```

Then visit `http://localhost:5500`. The form posts to `http://localhost:8000` by default (`data-api-base` on `<body>` in `landing/index.html`). For production, add your marketing site origin to `CORS_ALLOWED_ORIGINS` when `DJANGO_DEBUG` is false. Waitlist emails appear in Django admin under **Waitlist emails**.

New waitlist signups trigger a notification to `WAITLIST_NOTIFY_EMAIL` (default `halickiec@gmail.com`). With `DJANGO_DEBUG=True`, messages are printed to the API console (`EMAIL_BACKEND` console). For real email in production, set `DJANGO_DEBUG=False`, `EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend`, and SMTP variables (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL`).

### Test Accounts

| Email | Password |
|-------|----------|
| alice@example.com | testpass123 |
| bob@example.com | testpass123 |
| cara@example.com | testpass123 |
| dan@example.com | testpass123 |
| emma@example.com | testpass123 |
