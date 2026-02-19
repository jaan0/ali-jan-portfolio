## Setup

1. Install dependencies:
```bash
npm install
```
2. Copy env file and fill values:
```bash
cp .env.example .env
```
3. Run app:
```bash
npm run dev
```

## Required Env Vars

- `DATABASE_URL`: Postgres connection string for Prisma
- `FORGECAL_API_KEY`: API key used for ForgeCal API calls
- `FORGECAL_EVENT_SLUG`: default meeting slug (example: `strategy-call`)
- `FORGECAL_WEBHOOK_SECRET`: shared secret used to verify ForgeCal webhook signature
- `FORGECAL_BASE_URL`: ForgeCal API base URL
- `SMTP_HOST`: SMTP server hostname
- `SMTP_PORT`: SMTP server port (example: `587`)
- `SMTP_SECURE`: `true` for SMTPS (465), otherwise `false`
- `SMTP_USER`: SMTP username
- `SMTP_PASS`: SMTP password/app password
- `SMTP_FROM`: sender identity used for outgoing meeting emails
- `CRON_SECRET`: bearer/header secret for cron endpoint auth

## ForgeCal Webhook Integration

- Endpoint path: `/api/forgecal/webhook`
- Expected headers:
  - `x-forgecal-event`
  - `x-forgecal-signature`
- Signature algorithm:
  - HMAC SHA256 over **raw request body**
  - secret: `FORGECAL_WEBHOOK_SECRET`
- Supported events:
  - `booking.created`
  - `booking.confirmed`
  - `booking.canceled`
- On `booking.confirmed`:
  - sends branded confirmation email via SMTP
  - schedules DB-backed reminder jobs (24h and 1h before start)
- On `booking.canceled`:
  - sends cancellation email
  - cancels pending reminder jobs

### Register in ForgeCal Dashboard

1. Deploy app and copy public webhook URL:
   - `https://YOUR_DOMAIN/api/forgecal/webhook`
2. In ForgeCal dashboard, open webhook settings.
3. Add the URL above.
4. Set the same webhook secret value as `FORGECAL_WEBHOOK_SECRET`.
5. Enable booking events.

## Webhook Tests

Run:

```bash
npm run test:webhook
```

## Reminder Cron Queue

- Queue storage: `ReminderJob` table (Prisma)
- Cron endpoint: `/api/cron/reminders`
- Auth:
  - `Authorization: Bearer <CRON_SECRET>`
  - or `x-cron-secret: <CRON_SECRET>`
- Vercel cron config is in `vercel.json` and runs every 10 minutes.

Manual trigger example:

```bash
curl -X POST "http://localhost:3000/api/cron/reminders" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Local Webhook cURL Example

PowerShell:

```powershell
$body = '{"booking":{"id":"bk_test_123","guestEmail":"john@example.com"}}'
$secret = "replace-with-shared-webhook-secret"
$event = "booking.confirmed"
$signature = (node -e "const c=require('crypto');const body=process.argv[1];const secret=process.argv[2];console.log(c.createHmac('sha256', secret).update(body).digest('hex'))" "$body" "$secret")

curl -X POST "http://localhost:3000/api/forgecal/webhook" `
  -H "content-type: application/json" `
  -H "x-forgecal-event: $event" `
  -H "x-forgecal-signature: $signature" `
  -d $body
```
