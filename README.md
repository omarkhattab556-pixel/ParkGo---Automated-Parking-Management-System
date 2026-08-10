<div align="center">

# 🚗 ParkGo

**Automated Valet Parking Management System**

*Drop off, reserve, and retrieve your car from a fully automated parking facility — no attendant walk-through, no lost tickets, no guesswork.*

[![Stack](https://img.shields.io/badge/stack-React_19_%2B_Express_5-3b82f6)](#-technology-stack)
[![Database](https://img.shields.io/badge/database-Supabase_PostgreSQL-3ecf8e)](https://supabase.com)
[![AI](https://img.shields.io/badge/assistant-Gemini-8b5cf6)](#-ai-assistant)
[![License](https://img.shields.io/badge/license-ISC-64748b)](#-license)

[User Guide](USER_GUIDE.md) · [Architecture](#-architecture) · [API Reference](#-api-reference) · [Getting Started](#-getting-started)

</div>

---

## 📖 Overview

ParkGo is a full-stack management system for an **automated (robotic) parking facility** —
the kind where the driver never parks the car themselves. A subscriber hands the vehicle
over at the entrance bay, a robotic *installer* moves it to an allocated space, and the
car is returned on demand against a 6-digit confirmation code.

The system owns the whole lifecycle around that mechanism: who may park, which space they
get, how long they may keep it, what happens when they are late, what the facility earns,
and what the operator must fix.

**What makes it more than a CRUD app:**

| Concern | How ParkGo handles it |
|---|---|
| **Concurrency** | Robotic installers are a finite, contended resource. Claims are atomic (conditional `UPDATE`), so two simultaneous drop-offs can never seize the same machine. |
| **Space allocation** | Spaces are assigned by *time-window overlap*, not a boolean flag — a space booked for 14:00–18:00 is still bookable at 09:00. |
| **Fairness** | A reservation guardrail refuses bookings that would starve walk-in traffic (configurable minimum free capacity). |
| **Self-healing** | Cron jobs release orphaned installers, cancel no-shows, and record late-return strikes without operator input. |
| **Accountability** | Three late returns automatically suspend a subscription; every strike emails the subscriber. |
| **Economics** | Monthly P&L with income breakdown, editable expenses, and a computed break-even point. |

### 👥 Roles

| Role | Hebrew | Scope |
|------|--------|-------|
| **Subscriber** | מנוי | Reserve a space, drop off / retrieve a car, extend a session, view history and monthly billing |
| **Attendant** | סדרן | Register subscribers, monitor live occupancy and load, report faults, call maintenance |
| **Manager** | מנהל | Build the facility (floors / spaces / installers), manage staff, run reports, control expenses |

---

## ✨ Features

### For subscribers
- **Reservations** — book 24 hours to 7 days ahead; the system allocates the space closest to the entrance and emails a confirmation code.
- **Walk-in drop-off** — arrive without a booking and receive a space and code on the spot, subject to live availability.
- **Live parking timer** — real-time countdown with overtime tracking.
- **Session extension** — add time up to a configurable cap, automatically capped short if another reservation claims the space next.
- **Lost code recovery** — re-sends the active session's code by email.
- **Monthly billing statement** — hourly charges, extension costs, late fines, and subscription fee.

### For attendants
- **Subscriber registration** with Israeli phone and license-plate validation.
- **Live facility status** — per-space state, occupancy, and installer availability.
- **Load-level monitoring** with hourly occupancy trends.
- **Fault reporting & maintenance dispatch** — flag a space as blocked or under maintenance and call a technician.

### For managers
- **Data-driven facility setup** — create floors with per-floor capacity; nothing about the layout is hard-coded.
- **Installer fleet management** — add or retire robotic units.
- **Staff management** — provision attendant accounts.
- **Four analytics reports** — occupancy (with hour-of-day heatmap), subscriber behavior, reservations, and financial P&L.
- **CSV export** for every report.
- **Editable expense model** — salaries, electricity, upkeep, technician fees feed the break-even calculation.

### Platform-wide
- 🤖 **AI assistant** — a Gemini-powered chatbot with role-aware tool calling (see [below](#-ai-assistant)).
- 🧭 **Interactive 3D lot map** rendered with React Three Fiber, showing live occupancy.
- 🔐 **Brute-force protection** — dual-track account + IP lockout with exponential backoff and owner alert emails.
- 📧 **Transactional email** for codes, reservations, cancellations, late returns, and security alerts.
- 🕒 **Israel timezone (Asia/Jerusalem)** rendering throughout.

---

## 🏛 Architecture

```
┌──────────────────────────┐         ┌───────────────────────────┐
│   React 19 SPA (Vite)    │  HTTPS  │   Express 5 REST API      │
│                          │ ──────► │                           │
│  • Role-based routing    │   JWT   │  • JWT auth + RBAC        │
│  • TanStack Query cache  │         │  • Zod validation         │
│  • Zustand auth store    │ ◄────── │  • Helmet / CORS allowlist│
│  • R3F 3D lot · Recharts │  JSON   │  • In-memory rate limits  │
└──────────────────────────┘         └─────────────┬─────────────┘
                                                   │
                          ┌────────────────────────┼────────────────────────┐
                          │                        │                        │
                 ┌────────▼────────┐     ┌─────────▼────────┐    ┌──────────▼────────┐
                 │    Supabase     │     │   node-cron      │    │  External APIs    │
                 │   PostgreSQL    │     │                  │    │                   │
                 │                 │     │ • free installers│    │ • Gemini (chat)   │
                 │ user·subscriber │     │   every 5s       │    │ • Brevo (email)   │
                 │ parking_space   │     │ • cancel no-shows│    │                   │
                 │ reservation     │     │   every 1m       │    └───────────────────┘
                 │ parking·installer│    │ • late returns   │
                 └─────────────────┘     │   every 5m       │
                                         └──────────────────┘
```

### Core domain model

| Table | Purpose |
|---|---|
| `user` | Identity and role (`subscriber` / `attendant` / `manager`), bcrypt password hash |
| `subscriber` | Subscription state, `delay_count` strikes, license plate |
| `parking_space` | Space inventory — `location` (floor/zone) and lifecycle `status` |
| `reservation` | Future booking; `reservation_end` is a generated column (`start + 4h`) |
| `parking` | Live or historical session; open while `retrieval_time IS NULL` |
| `installer` | Robotic bay unit with `is_free` / `busy_until` |

> **Design note — spaces are never hard-deleted.** `parking` and `reservation` hold
> foreign keys onto `space_number`, so a space carrying history is *decommissioned*
> rather than dropped, preserving referential integrity and audit trails.

### Key mechanisms

<details>
<summary><b>Installer acquisition (atomic claim)</b></summary>

Every drop-off and pick-up must occupy a physical robot. The claim is a conditional
update — `SET is_free = false WHERE installer_id = ? AND is_free = true` — so under
concurrent load only one request wins each unit. If no unit is free, the API returns
`503 NO_FREE_INSTALLER` with live queue depth rather than silently queueing.

A unit is held for `INSTALLER_OPERATION_SECONDS` to model the mechanical cycle, then
released. A 5-second cron sweeps units whose `busy_until` has elapsed but were never
released — the safety net for a mid-operation crash.
</details>

<details>
<summary><b>Time-window space allocation</b></summary>

A space is *taken* for a requested window only when an existing reservation or an active
parking session genuinely overlaps it: `A.start < B.end AND A.end > B.start`. Among the
free candidates the system picks the **lowest space number** — spaces are numbered outward
from the entrance, so the lowest is the shortest robotic travel.
</details>

<details>
<summary><b>Reservation guardrail</b></summary>

Before a booking is accepted the system projects occupancy at the requested window. If
fewer than `MIN_FREE_PERCENT` (default 40%) of active spaces would remain free, the
reservation is refused with `409 INSUFFICIENT_AVAILABILITY`. This deliberately reserves
headroom for walk-in traffic — walk-ins bypass this rule since they consume capacity
that already exists.
</details>

<details>
<summary><b>Extension vs. reservation priority</b></summary>

Extending a session never overruns a booking. The API looks ahead for the next active
reservation on the same space; if the requested extension would cross its start time, the
extension is trimmed to end exactly at that boundary (`capped_by_reservation: true`), or
refused with `409 BLOCKED_BY_RESERVATION` when no room remains.
</details>

<details>
<summary><b>Brute-force protection</b></summary>

Two independent tracks guard `POST /api/auth/login`:

- **Per-account** — 3 consecutive failures lock the email; each repeat lockout doubles the
  duration (15 min → capped at 2 h) and emails the owner a security alert.
- **Per-IP** — a looser 15-attempt threshold catches credential stuffing that sprays many
  accounts and so never trips a single account's counter.

Unknown emails and wrong passwords return an identical response and increment the same
counter, so the endpoint cannot be used to enumerate registered addresses. The gate runs
*before* the database and bcrypt are touched, so a locked-out attacker costs nothing.
</details>

---

## 🤖 AI Assistant

An in-app chatbot backed by **Google Gemini** with server-side function calling.

- **Role-aware tools** — the tool set exposed to the model is filtered by the caller's
  role, so a subscriber's assistant cannot reach manager data.
- **Server-held history** — conversation state is keyed by user on the backend and never
  trusted from the client, so prior turns cannot be forged.
- **Action proposals** — the model can propose a structured action (e.g. *reserve a space*),
  which the UI renders as a confirmation card; the user always confirms before anything is
  committed.
- **Rate limited** — 20 messages/minute per user.
- **Optional** — with no `GEMINI_API_KEY` configured the endpoint returns a friendly 503
  and the rest of the app runs untouched.

---

## 🛠 Technology Stack

**Frontend** — React 19 · TypeScript · Vite · TailwindCSS 4 · TanStack Query · Zustand ·
React Router 7 · React Hook Form + Zod · Framer Motion · React Three Fiber + drei ·
Recharts · Radix UI · date-fns

**Backend** — Node.js · Express 5 · Supabase (PostgreSQL) · JWT · bcryptjs · Zod ·
node-cron · Helmet · Morgan · Google Generative AI · Brevo (transactional email)

---

## 📁 Project Structure

```
parkgo/
├── parkgo-frontend/               # React + Vite SPA
│   └── src/
│       ├── api/                   # Axios clients (auth, parking, facility, reports, chat)
│       ├── components/
│       │   ├── 3d/                # React Three Fiber lot visualisation
│       │   ├── charts/            # Recharts: heatmap, occupancy, gauges
│       │   ├── chat/              # AI assistant widget
│       │   ├── common/            # Code display, installer animation, skeletons
│       │   ├── layout/            # Dashboard shell, sidebar, protected routes
│       │   └── ui/                # Design-system primitives
│       ├── hooks/                 # useAuth, useParking, useCountdown
│       ├── pages/                 # subscriber / attendant / manager modules
│       ├── store/                 # Zustand auth store
│       └── utils/                 # formatters, validators, constants
│
├── parkgo-backend/                # Express API
│   └── src/
│       ├── config/                # supabase, constants (business rules, pricing, security)
│       ├── controllers/           # auth, parking, reservation, facility, reports, chatbot
│       ├── jobs/                  # cron: free installers, cancel no-shows, late returns
│       ├── middleware/            # auth, RBAC, validation, rate limiting, errors
│       ├── routes/                # REST route definitions + Zod schemas
│       ├── services/
│       │   ├── chatbot/           # Gemini service, tools, knowledge, history
│       │   ├── installer.service  # atomic acquire / release
│       │   ├── reservation.service# window math, availability, allocation
│       │   ├── reports.service    # occupancy, behavior, revenue, P&L
│       │   └── email.service      # Brevo transactional templates
│       └── utils/                 # code generator, password hashing
│
├── USER_GUIDE.md                  # Complete end-user manual
└── render.yaml                    # Render deployment blueprint
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Notes |
|---|---|
| **Node.js 18+** | Required by Express 5 and Vite 8 |
| **Supabase project** | Provides PostgreSQL; you need the URL and service-role key |
| **Brevo account** | *Optional* — without a key, emails are logged to the console |
| **Gemini API key** | *Optional* — without a key, the chatbot is disabled |

### 1 · Database

Create the schema in your Supabase project (SQL editor), then seed the starting
inventory:

```sql
-- Minimum viable seed: one zone of 50 spaces and 3 robotic installers
INSERT INTO parking_space (space_number, location)
SELECT i, 'Zone-' || CHR(65 + ((i-1) / 10))
FROM generate_series(1, 50) AS i;

INSERT INTO installer (installer_name)
VALUES ('Installer-A'), ('Installer-B'), ('Installer-C');
```

You also need at least one `manager` user to sign in with. Insert it directly with a
bcrypt hash — the manager can then create attendants from the UI, and attendants create
subscribers.

> Floors and spaces can equally be created at runtime by a manager. Capacity is **never**
> configured through environment variables — every count is derived from `parking_space`.

### 2 · Backend

```bash
cd parkgo-backend
npm install
cp .env.example .env          # fill in Supabase + JWT values
npm run dev                   # http://localhost:5000
```

Verify with `curl http://localhost:5000/health`.

### 3 · Frontend

```bash
cd parkgo-frontend
npm install
cp .env.example .env          # defaults to http://localhost:5000/api
npm run dev                   # http://localhost:5173
```

---

## 🔧 Configuration

### Backend (`parkgo-backend/.env`)

**Core**

| Variable | Required | Description |
|----------|:--------:|-------------|
| `PORT` | — | API port. Leave unset on Render (injected). |
| `NODE_ENV` | — | `development` / `production` |
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | ✅ | Service-role key (server-side only — never expose) |
| `JWT_SECRET` | ✅ | 32+ character random secret |
| `JWT_EXPIRES_IN` | — | Token lifetime (default `7d`) |
| `FRONTEND_URL` | ✅ | CORS allow-list; single URL or comma-separated |

**Integrations**

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Enables the AI assistant. Empty ⇒ chatbot disabled (503). |
| `GEMINI_MODEL` | Model id (default `gemini-flash-latest`) |
| `BREVO_API_KEY` | Transactional email. Empty ⇒ emails logged to console. |
| `BREVO_FROM_EMAIL` / `BREVO_FROM_NAME` | Verified sender identity |

**Business rules**

| Variable | Default | Meaning |
|----------|:-------:|---------|
| `MAX_PARKING_HOURS` | `4` | Standard session length before overtime |
| `MAX_EXTENSION_HOURS` | `4` | Maximum additional time per session |
| `MIN_FREE_PERCENT` | `40` | Free-capacity floor enforced on reservations |
| `MIN_RESERVATION_HOURS_AHEAD` | `24` | Earliest a reservation may start |
| `MAX_RESERVATION_DAYS_AHEAD` | `7` | Latest a reservation may start |
| `NO_SHOW_GRACE_MINUTES` | `15` | Arrival window before a booking is voided |
| `MAX_DELAYS_BEFORE_CANCEL` | `3` | Late returns before the subscription is suspended |
| `INSTALLER_OPERATION_SECONDS` | `20` | Simulated robotic bay cycle time |

**Pricing** (ILS ₪, billing resets each calendar month)

| Variable | Default | Meaning |
|----------|:-------:|---------|
| `CURRENCY` | `ILS` | Display currency |
| `HOURLY_RATE` | `50` | Charged per started hour |
| `LATE_FINE` | `200` | Flat fine per recorded late return |
| `SUBSCRIPTION_FEE` | `150` | Monthly fee per active subscriber |

**Security**

| Variable | Default | Meaning |
|----------|:-------:|---------|
| `MAX_LOGIN_ATTEMPTS` | `3` | Failures before an account locks |
| `LOGIN_ATTEMPT_WINDOW_MINUTES` | `15` | Window in which failures accumulate |
| `LOGIN_LOCKOUT_MINUTES` | `15` | Base lockout, doubled per repeat |
| `LOGIN_MAX_LOCKOUT_MINUTES` | `120` | Lockout ceiling |
| `MAX_LOGIN_ATTEMPTS_PER_IP` | `15` | Per-IP threshold |
| `LOGIN_IP_LOCKOUT_MINUTES` | `30` | Per-IP lockout duration |

### Frontend (`parkgo-frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL (e.g. `http://localhost:5000/api`) |
| `VITE_APP_NAME` | Display name |

> The production API URL lives in `.env.production`, applied automatically by `vite build`.

---

## 📜 Scripts

**Backend**

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon (hot reload) |
| `npm start` | Start in production mode |
| `npm test` | Run the Node test runner |

**Frontend**

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check (`tsc -b`) + production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

---

## 🌐 API Reference

Base URL `/api`. All routes except `/auth/login` require `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/login` | public | Sign in; returns JWT + user. Rate-limited & lockout-protected. |
| `GET` | `/auth/me` | any | Current user profile |
| `POST` | `/auth/logout` | any | Symmetric no-op (JWT is stateless) |

### Parking
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/parking/drop-off` | subscriber | Drop off with or without a reservation code |
| `POST` | `/parking/pick-up` | subscriber | Retrieve against a confirmation code |
| `POST` | `/parking/extend/:parkingCode` | subscriber | Extend the active session |
| `POST` | `/parking/lost-code` | subscriber | Re-send the active code by email |
| `GET` | `/parking/my-active` | subscriber | Current open session |
| `GET` | `/parking/my-history` | subscriber | Personal session history |
| `GET` | `/parking/active` | attendant · manager | All open sessions, enriched with driver data |

### Reservations
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/reservations/check-availability` | subscriber | Non-committal availability probe |
| `POST` | `/reservations` | subscriber | Create a booking |
| `GET` | `/reservations/my` | subscriber | Own bookings |
| `GET` | `/reservations` | attendant · manager | All bookings |
| `PATCH` | `/reservations/:id/cancel` | owner · staff | Cancel a booking |

### Facility
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/facility/load` | any | Live load level |
| `GET` | `/facility/status` | any | Occupancy + installer status |
| `GET` | `/facility/hourly` | attendant · manager | Hourly occupancy trend |
| `POST` | `/facility/maintenance` | attendant · manager | Dispatch a technician |
| `GET`·`POST`·`DELETE` | `/facility/spaces[/:num]` | manager (write) | Space inventory |
| `GET`·`POST`·`DELETE` | `/facility/floors[/:location]` | manager (write) | Floor inventory |
| `GET`·`POST`·`DELETE` | `/facility/installers[/:id]` | manager | Installer fleet |

### Subscribers & staff
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/subscribers` | attendant | Register a subscriber |
| `GET` | `/subscribers` | attendant · manager | List subscribers |
| `GET` | `/subscribers/:id` | attendant · manager | Subscriber detail |
| `GET` | `/subscribers/me/profile` | subscriber | Own profile |
| `PATCH` | `/subscribers/:id` | owner | Update own details (password-confirmed) |
| `PATCH` | `/subscribers/:id/reactivate` | attendant | Restore a suspended subscription |
| `PATCH` | `/subscribers/:id/deactivate` | manager | Suspend a subscription |
| `POST` | `/subscribers/attendant` | manager | Provision an attendant account |
| `GET` | `/subscribers/attendants` | manager | List attendants |

### Reports
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/reports/occupancy?month=YYYY-MM` | manager | Occupancy + hour-of-day heatmap |
| `GET` | `/reports/behavior?month=YYYY-MM` | manager | Subscriber behaviour analysis |
| `GET` | `/reports/reservations?month=YYYY-MM` | manager | Reservation outcomes |
| `GET` | `/reports/revenue?month=YYYY-MM` | manager | Revenue by source and day |
| `GET` | `/reports/financial?month=YYYY-MM` | manager | P&L with break-even |
| `GET`·`PATCH` | `/reports/expenses` | manager | Expense configuration |
| `GET` | `/reports/my-billing?month=YYYY-MM` | subscriber | Personal statement |
| `GET` | `/reports/export/:type` | manager | CSV export |

### Assistant
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/chat` | any | Send a message (20/min) |
| `GET`·`DELETE` | `/chat/history` | any | Read or clear conversation history |

### Notable status codes

| Code | Meaning |
|------|---------|
| `409 INSUFFICIENT_AVAILABILITY` | Reservation would breach the free-capacity floor |
| `409 NO_FREE_SPACE` | No space available for the requested window |
| `409 BLOCKED_BY_RESERVATION` | Extension would overrun the next booking |
| `410` | Reservation expired — no-show grace elapsed |
| `429 ACCOUNT_LOCKED` | Brute-force lockout active; see `Retry-After` |
| `503 NO_FREE_INSTALLER` | All robotic units busy; response carries queue depth |

---

## ⏱ Background Jobs

| Job | Schedule | Responsibility |
|-----|:--------:|----------------|
| `freeInstallers` | every 5 s | Releases units whose `busy_until` elapsed but were never freed (crash recovery) |
| `cancelExpiredReservations` | every 1 min | Voids no-shows past the grace window, frees the space, emails the subscriber |
| `checkLateReturns` | every 5 min | Records late-return strikes, emails the driver, suspends at the strike limit |

---

## ☁️ Deployment

[`render.yaml`](render.yaml) is a Render blueprint provisioning both the API and the SPA.

**Production checklist**

- [ ] `NODE_ENV=production`, `PORT` unset (Render injects it)
- [ ] `JWT_SECRET` is a fresh 32+ character random value — never the dev default
- [ ] `FRONTEND_URL` lists every allowed origin
- [ ] `SUPABASE_SERVICE_KEY` set as a secret, never committed
- [ ] `BREVO_FROM_EMAIL` uses a verified sender domain
- [ ] `.env.production` points `VITE_API_URL` at the deployed API

> **Scaling note.** Rate limiting and login-attempt tracking are in-memory and therefore
> per-instance. Running more than one API instance requires moving both to a shared store
> (e.g. Redis) for the limits to hold globally.

---

## 📚 Documentation

| Document | Audience |
|---|---|
| [USER_GUIDE.md](USER_GUIDE.md) | End users — subscribers, attendants, managers |
| [PARKGO_PROJECT_PLAN.md](PARKGO_PROJECT_PLAN.md) | Schema, requirements, and design decisions |

---

## 📄 License

ISC © ParkGo

<div align="center">
<sub>Built with React, Express, Supabase & Gemini.</sub>
</div>
