# StudioMVP

Product-studio marketing site **+ client portal core spine** (auth, payments, dashboards).

Built with **Next.js 15 (App Router) + React 19 + TypeScript**, **Postgres (Railway)**, **Stripe**, magic-link auth.

## Routes

| Route | What |
|---|---|
| `/` | Marketing site (dark/light, showcase, work filters, count-up, live clock) |
| `/start` | Lead-capture form → `POST /api/leads` |
| `/login` | Magic-link sign-in |
| `/admin` | Admin portal (pipeline, projects, payment-terms config) — admin role |
| `/dashboard` | Client portal (overview, timeline, payments, approvals) — client role |
| `/spec` | System specification doc |

API: `/api/auth/{magic,callback,logout}` · `/api/leads` · `/api/checkout` · `/api/stripe/webhook`

## Demo mode (no setup)

```bash
npm install
npm run dev
```

With no `DATABASE_URL`/Stripe keys the app runs on **demo data**: dashboards are open and show the mock content, lead form accepts (not stored), checkout/login show "not configured". This is what deploys before you wire services.

## Go live

1. **Database — Railway**
   - Create a Postgres service on Railway → copy the **Postgres Connection URL**.
   - Add it to `.env.local` as `DATABASE_URL=...`
   - Apply schema + demo seed: `npm run db:setup`
   - Seeds an admin (`admin@studiomvp.co.uk`) and a client (`amara@example.com`) + a demo project.

2. **Auth**
   - `SESSION_SECRET` — `openssl rand -base64 48`
   - `NEXT_PUBLIC_BASE_URL` — your deployed URL (e.g. `https://studiomvp.co.uk`)
   - Email (optional): `RESEND_API_KEY` + `EMAIL_FROM`. Without it, magic links are logged to the server console in dev.

3. **Stripe**
   - `STRIPE_SECRET_KEY`
   - Webhook → point Stripe at `/api/stripe/webhook` for `checkout.session.completed`, set `STRIPE_WEBHOOK_SECRET`.

Copy `.env.example` → `.env.local` and fill in. Once `DATABASE_URL` is set, the dashboards become role-guarded (middleware) and data-driven.

## Data model

`lib/schema.sql` — users · magic_tokens · leads · projects · phases · invoices · approvals · messages · events. See `/spec` for the full system design.

## Project layout

```
app/
├── page.tsx                 marketing (.mvp scoped)
├── start/ login/            lead form + magic-link sign-in
├── admin/ dashboard/ spec/  portals + spec (each CSS scoped under a root class)
├── api/                     auth · leads · checkout · stripe/webhook
└── components/              ClientEffects · Showcase · WorkFilters · PayCard
lib/                         db · auth · stripe · data · schema.sql
middleware.ts                role guards (bypassed in demo mode)
scripts/db-setup.mjs         apply schema + seed
```
