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

### Test Accounts

| Email | Password |
|-------|----------|
| alice@example.com | testpass123 |
| bob@example.com | testpass123 |
| cara@example.com | testpass123 |
| dan@example.com | testpass123 |
| emma@example.com | testpass123 |
