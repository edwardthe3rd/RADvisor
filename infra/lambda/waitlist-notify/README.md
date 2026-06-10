# Waitlist notify Lambda

Browser POST from `/app/waitlist` → API Gateway → Lambda → SES owner notification.

## Deploy / CORS update

After changing `AllowOrigins` in `template.yaml`, redeploy:

```bash
cd infra/lambda/waitlist-notify
sam build && sam deploy
```

Production origins must include `https://theradvisor.com` (and `www`) so the waitlist form on the Next.js app can POST cross-origin.
