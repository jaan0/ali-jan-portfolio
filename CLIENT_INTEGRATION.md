# ForgeCal Integration Guide (Client Copy)

## 1) What you get
ForgeCal provides a scheduling API your site can use to:
- show available dates/times
- create bookings
- cancel bookings
- receive booking updates via webhooks

## 2) Base URL + Auth
- Base URL (prod): `https://forge-cal.vercel.app`
- Auth header (required on all requests):

```http
x-api-key: YOUR_FORGECAL_API_KEY
```

## 3) Endpoints to integrate

### A) Get widget configuration
```http
GET /api/public/widget-config?slug=strategy-call
```

### B) Get availability by date
```http
GET /api/public/availability?slug=strategy-call&date=YYYY-MM-DD
```

### C) Create booking
```http
POST /api/public/bookings
Content-Type: application/json
```

Body:
```json
{
  "slug": "strategy-call",
  "guestName": "John Doe",
  "guestEmail": "john.doe@gmail.com",
  "startTime": "2026-02-18T15:00:00.000Z",
  "timezone": "UTC",
  "guestMessage": "Optional note"
}
```

Note: currently guest email must be `gmail.com` or `googlemail.com`.

### D) Cancel booking
```http
POST /api/public/bookings/BOOKING_ID/cancel
```

## 4) Minimal frontend flow
1. Call `widget-config` once (meeting metadata)
2. User picks date -> call `availability`
3. User picks slot + submits form -> call `bookings`
4. Store returned `bookingId` and `meetingUrl`

## 5) Webhook integration (optional but recommended)
ForgeCal can POST booking events to your backend:
- `booking.created`
- `booking.confirmed`
- `booking.canceled`

Headers sent:
- `x-forgecal-event`
- `x-forgecal-signature` (HMAC SHA256 of raw JSON body)

### Webhook receiver requirements
- Public HTTPS POST endpoint
- Must verify signature using shared secret
- Must return `2xx` quickly

### Node signature verify sample
```ts
import crypto from "crypto";

function verify(rawBody: string, signature: string, secret: string) {
  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}
```

## 6) What client must provide to us
- Their domain(s) calling ForgeCal (for CORS allowlist)
- Webhook URL (if using webhooks)
- Preferred event slug/name/timezone/duration

## 7) Sample cURL tests

```bash
curl -H "x-api-key: YOUR_KEY" "https://forge-cal.vercel.app/api/public/widget-config?slug=strategy-call"
```

```bash
curl -H "x-api-key: YOUR_KEY" "https://forge-cal.vercel.app/api/public/availability?slug=strategy-call&date=2026-02-18"
```

```bash
curl -X POST "https://forge-cal.vercel.app/api/public/bookings" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_KEY" \
  -d '{"slug":"strategy-call","guestName":"John Doe","guestEmail":"john.doe@gmail.com","startTime":"2026-02-18T15:00:00.000Z","timezone":"UTC"}'
```

```bash
curl -X POST "https://forge-cal.vercel.app/api/public/bookings/BOOKING_ID/cancel" \
  -H "x-api-key: YOUR_KEY"
```

## 8) Project implementation notes
This repo uses internal proxy routes so the ForgeCal API key is never exposed to browser code:
- `GET /api/forgecal/widget-config`
- `GET /api/forgecal/availability`
- `POST /api/forgecal/bookings`
- `POST /api/forgecal/bookings/:bookingId/cancel`
- `POST /api/forgecal/webhook`

Preferred configuration location:
- Admin dashboard profile form (`/admin`) stores:
  - ForgeCal API key
  - Event slug
  - Webhook secret
  - Base URL

Optional environment variable fallback:
- `FORGECAL_API_KEY`
- `FORGECAL_EVENT_SLUG` (example: `strategy-call`)
- `FORGECAL_WEBHOOK_SECRET`
- `FORGECAL_BASE_URL` (defaults to `https://forge-cal.vercel.app`)
