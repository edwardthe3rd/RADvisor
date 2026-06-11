# Waitlist notify Lambda

Browser POST from `/app/waitlist` → API Gateway → Lambda → SES owner notification.

## Deploy / CORS update

After changing `AllowOrigins` in `template.yaml`, redeploy:

```bash
cd infra/lambda/waitlist-notify
sam build && sam deploy
```

Production origins must include `https://theradvisor.com` (and `www`) so the waitlist form on the Next.js app can POST cross-origin.

## SES sender domain

Mail sends from `noreply@theradvisor.com`. Verify the domain in SES (us-west-1) and add the `_amazonses` TXT + three DKIM CNAMEs to the `theradvisor.com` Route 53 hosted zone. `NotifyTo` defaults to a verified personal inbox in `samconfig.toml`.
