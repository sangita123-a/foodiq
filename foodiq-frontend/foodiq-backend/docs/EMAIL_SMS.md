# Foodiq Email & SMS Notification System

Production-ready transactional email and SMS with provider abstraction, HTML templates, PDF invoices, preference controls, OTP rate limiting, and delivery logging.

## Architecture

```
createNotification() / notify()
        │
        ├── DB notification + Socket.IO + FCM (existing)
        └── dispatchEmailSms()  →  emailService / smsService
                                      └── email_logs / sms_logs
```

Auth flows (welcome, password reset OTP) and invoice PDF emails call the services directly when needed.

| Layer | Path |
|-------|------|
| Templates | `services/emailTemplates.js` |
| Email providers | `services/emailService.js` (`mock` \| `smtp` \| `resend` \| `sendgrid`) |
| SMS providers | `services/smsService.js` (`mock` \| `twilio` \| `msg91` \| `fast2sms`) |
| OTP | `services/otpService.js` |
| Channel prefs | `services/commsService.js` |
| PDF invoice | `services/invoiceService.js` |
| Reports | `services/reportEmailService.js` |
| APIs | `/api/messaging/*` |

## Environment

```env
# Email — default mock (logs to console + email_logs)
EMAIL_PROVIDER=mock
# EMAIL_PROVIDER=smtp|resend|sendgrid
EMAIL_FROM=Foodiq <noreply@yourdomain.com>
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
RESEND_API_KEY=
SENDGRID_API_KEY=
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME=Foodiq

# SMS — default mock
SMS_PROVIDER=mock
# SMS_PROVIDER=twilio|msg91|fast2sms
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
MSG91_AUTH_KEY=
MSG91_SENDER_ID=FOODIQ
MSG91_TEMPLATE_ID=
FAST2SMS_API_KEY=

# OTP
OTP_TTL_MINUTES=10
OTP_MAX_ATTEMPTS=5
OTP_RATE_WINDOW_MIN=15
OTP_RATE_MAX=5
# OTP_EXPOSE_CODE=true   # only for local debugging
```

Leave providers on `mock` for local development — no credentials required.

## APIs

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/messaging/email` | JWT | Send email (admin any; user self-test) |
| POST | `/api/messaging/sms` | JWT | Send SMS |
| POST | `/api/messaging/otp/send` | Public/JWT | Issue OTP (rate limited) |
| POST | `/api/messaging/otp/verify` | Public | Verify OTP |
| GET/PUT | `/api/messaging/preferences` | JWT | Email/SMS/marketing prefs |
| POST | `/api/messaging/invoice` | JWT | Generate PDF (`payment_id`, optional `send_email`) |
| GET | `/api/payments/:id/invoice` | JWT | Download invoice (`?format=pdf` default, `html` fallback) |
| GET | `/api/messaging/logs/email` | Admin | Email delivery logs |
| GET | `/api/messaging/logs/sms` | Admin | SMS delivery logs |
| POST | `/api/messaging/reports/run` | Admin | `{ type: daily_platform \| restaurant_daily \| … }` |
| POST | `/api/messaging/promo` | Admin | Promotional email (respects marketing pref) |

Password reset:

- `POST /api/auth/forgot-password` → emails/SMS OTP
- `POST /api/auth/reset-password` → `{ email, reset_code, new_password }`
- In mock email mode, legacy code `FOODIQ` still works for demos

## Preferences

Stored on `user_settings`:

- `email_notifications`
- `sms_notifications`
- `marketing_emails`
- `notify_order_updates`
- `notify_orders` / `notify_offers` / `notify_rewards`
- `push_notifications`

UI: `/notification-preferences` and Settings → Notification Preferences.

Transactional security messages (OTP, password reset) bypass marketing opt-out.

## Automatic triggers

| Event | Channels |
|-------|----------|
| Register | Welcome email |
| Password reset | OTP email (+ SMS if phone) |
| Order placed | Customer + restaurant email/SMS |
| Payment success | Email + SMS + PDF invoice attachment |
| Payment failed | Customer + admin |
| Order status / out for delivery / delivered | Email + SMS (prefs) |
| New delivery request | Partner email/SMS |
| Refund | Customer email/SMS |
| Restaurant approve/suspend | Owner email |
| Delivery partner approved | Partner email |

Admin can run daily/weekly sales and earnings reports via `/api/messaging/reports/run`.

## Logging & anti-spam

- Every send writes `email_logs` / `sms_logs` (status, provider id, attempts, error, order id)
- OTP rate limit per destination+purpose
- Duplicate channel sends suppressed within 5 minutes for same user/type/order
- Notification `dedupe_key` still applies to in-app/push

## Cron suggestion

```bash
# Daily 8am — platform report to admins
curl -X POST "$API/api/messaging/reports/run" \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"type":"daily_platform"}'
```

## Security

- SMTP/API keys only via environment variables
- OTP codes stored as SHA-256 hashes
- Admin-only log and report endpoints
- Users cannot spoof emails/SMS to other recipients
