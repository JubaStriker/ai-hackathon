# Telegram Automation Bot — Starter Kit

This project is a minimal **Node.js** Telegram bot that:
- Runs a **daily scheduled task** at a specific time (with timezone support)
- **Sends email via Gmail** using OAuth2 (no “less secure apps”)
- **Books meetings on Google Calendar**
- Can respond to Telegram commands

> Default timezone is taken from `.env` (e.g., `Asia/Dhaka`).

---

## Quick Start

1) **Install Node.js 18+**.

2) **Create a Telegram bot token**
   - In Telegram, talk to **@BotFather**
   - `/newbot` → follow prompts → copy the **token**
   - Put it in `.env` as `TELEGRAM_BOT_TOKEN`

3) **Create Google OAuth credentials & enable APIs**
   - Go to **Google Cloud Console** → create a Project
   - Enable **Gmail API** and **Google Calendar API**
   - **Create OAuth 2.0 Client ID** (type “Web application” is fine for local dev)
   - Add an authorized redirect URI: `http://localhost:3000/oauth2callback`
   - Copy **Client ID** and **Client Secret**

4) **Get a Refresh Token (one-time)**
   - Create `.env` from `.env.example` and fill:
     - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
   - Run:
     ```bash
     npm install
     npm run get-google-tokens
     ```
   - Open the printed **Auth URL**, approve Gmail & Calendar scopes
   - You’ll be redirected to `http://localhost:3000/oauth2callback`
   - The script will print a **Refresh Token** in the console. Copy it to `.env` as `GOOGLE_REFRESH_TOKEN`

   > For personal Gmail, use this OAuth flow. For Google Workspace, you can optionally use a Service Account with domain‑wide delegation (not covered in this starter).

5) **Finish `.env`**
   - Set `GMAIL_SENDER` to the Gmail address you’ll send from
   - Optionally set `TELEGRAM_NOTIFY_CHAT_ID` (a chat ID to receive scheduled notifications)
   - Adjust `DEFAULT_DAILY_TIME` and `TIMEZONE`

6) **Run it**
   ```bash
   npm start
   ```
   - The bot uses **long polling** by default (no webhook needed for dev)
   - In Telegram, send `/start` then try `/ping` or `/schedule_demo`

---

## Commands

- `/start` — say hi
- `/ping` — health check
- `/schedule_demo` — immediately runs the “daily task” to demonstrate Gmail + Calendar + Telegram notification

---

## Scheduling

- Daily job runs at `DEFAULT_DAILY_TIME` (HH:mm, 24h), in `TIMEZONE` (e.g., `Asia/Dhaka`).
- Internally uses `node-cron` with timezone support.

> Bangladesh Time (Asia/Dhaka) currently has **no daylight saving time**, so your schedule will be stable year‑round.

---

## Where to add your automation

Edit `src/api.js` → `runDailyAutomation()`.
Put your business logic there (call external APIs, compute tasks, etc.).
The daily job then:
- calls your automation function,
- sends a summary email,
- (optionally) creates a Calendar event,
- and posts a Telegram message.

---

## Webhooks (optional, prod)

- Expose an HTTPS URL and set it via BotFather or Telegram’s `setWebhook` method.
- For hobby deployments check: Render, Railway, Fly.io, or a small VPS. For serverless, ensure the process can also run scheduled jobs (or use platform cron like **Vercel Cron**, **Cloudflare Cron Triggers**, **AWS EventBridge**, **GCP Cloud Scheduler**).

---

## Environment

Create `.env` from `.env.example`:

```
TELEGRAM_BOT_TOKEN=123:abc
TELEGRAM_NOTIFY_CHAT_ID=
TIMEZONE=Asia/Dhaka
DEFAULT_DAILY_TIME=09:00

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback
GOOGLE_REFRESH_TOKEN=
GMAIL_SENDER=youraddress@gmail.com
GOOGLE_CALENDAR_ID=primary
```

> `GOOGLE_REFRESH_TOKEN` can be shared for both Gmail + Calendar in this starter.

---

## Notes

- If you need **per-user schedules**, swap the in-memory schedule for a DB (Postgres/Mongo) and create one cron job per user/time or a queue that checks due tasks each minute.
- For bulk email, respect Gmail sending limits and consider a dedicated ESP.
- Store secrets securely (never commit `.env`).

Happy building!
