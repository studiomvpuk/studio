# StudioMVP — System Map & Plan

How every part of the app connects, from a stranger on the marketing site to a
paid, completed project. Nothing in the product UI is mock data — every number
and row comes from Postgres, with graceful empty states when there's nothing yet.

---

## 1. The spine (end-to-end flow)

```
 Visitor
   │  fills the brief form on the site  →  POST /api/leads
   ▼
 LEAD  (leads.status = new)                         ── event: lead.created → confirmation email
   │  admin reviews in Pipeline, books a call
   ▼
 PROPOSAL  (admin builds in /admin/new-proposal)    ── event: proposal.sent → review-&-sign email
   │  client opens /proposal/[token], signs
   ▼
 CONTRACT  (POST /api/proposals/[token]/sign)        ── event: contract.signed
   │  signing AUTO-CREATES: a project, its phases, and the first invoice
   ▼
 PROJECT  (projects.status = signed → active)
   │  ├─ Payments:   deposit + balance invoices  →  Stripe Checkout  →  webhook marks paid
   │  ├─ Phases:     admin advances phase by phase (Discovery → … → Launch)
   │  ├─ Approvals:  admin requests sign-off; client approves / asks for changes
   │  └─ Messages:   shared live thread, client ⇄ team
   ▼
 COMPLETED  (projects.status = completed)            ── event: project.completed → handover email
```

Each arrow is a real API call. Each `event:` is recorded in the `events` table
and visible in **Admin → Automations**.

---

## 2. Roles & auth

Passwordless **magic links** (`jose` JWT in an httpOnly cookie). No passwords.

| Role | Gets | Set how |
|------|------|---------|
| `prospect` | created automatically on first magic-link sign-in | default |
| `client` | the Client Portal (`/dashboard/*`), scoped to their own project | promoted in `users` table |
| `admin` | the Admin Portal (`/admin/*`) | seeded as `officialstudiomvp@gmail.com` on boot |

`middleware.ts` guards `/admin` (admin only) and `/dashboard` (signed-in). In
demo mode (no `DATABASE_URL`) the guards relax so the UI is still browsable.

---

## 3. Data model (Postgres)

```
users ──< projects ──< phases
  │           ├──< invoices      (deposit / balance / full ; due → paid)
  │           ├──< approvals     (pending → approved / changes)
  │           └──< messages      (author: client | team)
leads ──< proposals ──< contracts >── projects   (sign creates the project)
events            (append-only audit + automation log)
magic_tokens      (one-time sign-in tokens)
```

Defined in `lib/schema.sql`, applied automatically on boot by
`instrumentation.ts → lib/migrate.ts` (no manual `db:setup` needed).

---

## 4. Routes

**Public site** (`app/(site)`): `/`, `/work`, `/services`, `/approach`,
`/about`, `/contact`, `/start` (brief form), `/pay`.
Plus `/proposal/[token]` (client reviews & signs), `/login`, `/spec`.

**Client Portal** (`app/dashboard/(portal)`) — shared shell + active-nav sidebar:
`/dashboard` (Overview) · `/timeline` · `/payments` · `/documents` ·
`/approvals` · `/messages`.

**Admin Portal** (`app/admin/(portal)`) — shared shell + active-nav sidebar:
`/admin` (Dashboard) · `/pipeline` · `/projects` · `/projects/[id]` (detail) ·
`/contracts` · `/payments` · `/automations` · `/templates` · `/settings`.
Plus `/admin/new-proposal` (own layout).

**API** (`app/api`): `auth/magic`, `auth/callback`, `auth/logout` ·
`leads` · `proposals`, `proposals/[token]/sign` · `projects/terms`,
`projects/advance` · `approvals` · `messages` (GET thread + POST) ·
`checkout` (Stripe) · `stripe/webhook`.

---

## 5. Where the data comes from (`lib/data.ts`)

Every portal page is a server component calling one of these — all real queries,
all returning empty/zero shapes when there's no data (no demo fallbacks):

- `getAdminData()` — dashboard stats, active projects, recent leads
- `getPipeline()` — kanban from leads + proposals + projects
- `getProjects()` / `getProjectDetail(id)` — list + full project view
- `getContracts()` — proposals + signed contracts
- `getPayments()` — invoices + collected/outstanding totals
- `getEvents()` — automation event log
- `getClientData(clientId)` — the client's project, phases, invoices, approvals,
  documents, and message thread

---

## 6. Messaging (live)

- Shared component `app/components/MessageThread.tsx`, used by **both** the
  client (`me="client"`) and admin project detail (`me="team"`).
- `GET /api/messages?projectId=` returns the auth-scoped thread; clients can
  only read/post to their own project.
- Send is optimistic, then re-syncs from the server; the thread also polls every
  12s so each side sees the other's replies without a refresh.

---

## 7. Payments (Stripe)

`PayBalanceButton` → `POST /api/checkout` (creates a Checkout Session for a
specific invoice) → Stripe-hosted page → `POST /api/stripe/webhook`
(signature-verified) marks the invoice `paid` and fires `invoice.paid`.
Disabled cleanly until `STRIPE_SECRET_KEY` is set.

---

## 8. Environment & deploy

Hosted on **Railway** (app + Postgres). Every env var is optional — the app
degrades to a demo/empty mode rather than crashing.

| Var | Purpose | Absent → |
|-----|---------|----------|
| `DATABASE_URL` | Postgres | demo mode, empty data |
| `SESSION_SECRET` | sign session JWTs | dev default |
| `NEXT_PUBLIC_BASE_URL` | magic-link / Stripe redirects | request origin |
| `RESEND_API_KEY` / `EMAIL_FROM` | real emails | logged to console |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | checkout | pay disabled |
| `ADMIN_EMAIL` | seeded admin | `officialstudiomvp@gmail.com` |

System status is visible live in **Admin → Settings**.

---

## 9. Status

**Live now:** lead capture, magic-link auth + roles, proposal → sign →
auto project/invoice, Stripe checkout + webhook, phase advancement, approvals,
two-way messaging, automation/event engine, full admin + client portals on real
data with empty states.

**Stubbed (honest empty states, no fake data):** document storage (shows the
signed agreement + proposal; no file uploads yet) and saved proposal templates.
