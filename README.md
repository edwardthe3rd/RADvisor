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

Then visit `http://localhost:5500`. The form posts to `http://localhost:8000` by default (`data-api-base` on `<body>` in `landing/index.html`). For production, add your marketing site origin to `CORS_ALLOWED_ORIGINS` when `DJANGO_DEBUG` is false. Waitlist signups appear in Django admin under **Waitlist emails**.

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
