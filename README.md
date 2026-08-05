<div align="center">

# 🚗 ParkGo

### Automated Parking Management System

*Drop off, reserve, and pick up your car through a fully automated valet-style parking facility.*

[![Stack](https://img.shields.io/badge/stack-React_19_%2B_Express_5-3b82f6)](#-tech-stack)
[![Database](https://img.shields.io/badge/database-Supabase-3ecf8e)](https://supabase.com)
[![License](https://img.shields.io/badge/license-ISC-64748b)](#-license)

</div>

---

## 📖 Overview

**ParkGo** tackles urban parking shortages with an automated, valet-style facility.
Subscribers drop off their vehicle at the entrance, receive a confirmation code, and
retrieve it on demand — the system handles spot allocation, timing, and reservations
behind the scenes. Attendants register subscribers and monitor the lot, while managers
oversee facilities and analytics.

### 👥 Roles

| Role | Hebrew | Capabilities |
|------|--------|--------------|
| **Subscriber** | מנוי | Drop off / pick up cars, reserve spots, extend parking, view live availability |
| **Attendant** | סדרן | Register subscribers, monitor the facility, manage on-site operations |
| **Manager** | מנהל | Manage facilities, view reports & analytics |

---

## ✨ Features

- 🅿️ **Drop-off & pick-up** with 6-digit confirmation codes
- 📅 **Reservations** — book a spot 24 h to 7 days in advance
- ⏱️ **Live parking timer** with real-time countdown and overtime tracking
- 🧭 **Interactive 3D lot map** (React Three Fiber) showing live occupancy
- 📊 **Reports & analytics** dashboards for managers
- 📧 **Email notifications** for codes, reservations, and late returns
- 🕒 **Israel timezone (Asia/Jerusalem)** rendering across the app
- 🤖 **Automated jobs** — expired reservation cleanup & late-return checks (cron)
- 🔐 **JWT auth** with role-based routing

---

## 🛠 Tech Stack

**Frontend** — React 19 · TypeScript · Vite · TailwindCSS 4 · TanStack Query ·
Zustand · React Router · React Hook Form + Zod · Framer Motion · React Three Fiber · Recharts

**Backend** — Node.js · Express 5 · Supabase (PostgreSQL) · JWT · bcrypt ·
Nodemailer · node-cron · Helmet · Zod

---

## 📁 Project Structure

```
parkgo/
├── parkgo-frontend/        # React + Vite SPA
│   └── src/
│       ├── api/            # Axios clients (auth, parking, facility, …)
│       ├── components/     # UI, layout, charts, 3D
│       ├── hooks/          # React Query hooks
│       ├── pages/          # subscriber / attendant / manager modules
│       ├── store/          # Zustand auth store
│       └── utils/          # formatters, validators, constants
│
├── parkgo-backend/         # Express API
│   └── src/
│       ├── controllers/    # route handlers
│       ├── routes/         # auth, subscriber, parking, reservation, facility, reports
│       ├── services/       # email, installer, reports
│       ├── jobs/           # cron: cancel expired reservations, check late returns
│       ├── middleware/     # auth, validation
│       └── config/         # supabase, nodemailer
│
└── render.yaml             # Render deployment blueprint
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+**
- A **Supabase** project (URL + service key)
- An SMTP account for email (e.g. [Mailtrap](https://mailtrap.io) for development)

### 1 · Backend

```bash
cd parkgo-backend
npm install
cp .env.example .env      # then fill in the values below
npm run dev               # starts on http://localhost:5000
```

### 2 · Frontend

```bash
cd parkgo-frontend
npm install
cp .env.example .env      # points at http://localhost:5000/api by default
npm run dev               # starts on http://localhost:5173
```

---

## 🔧 Environment Variables

### Backend (`parkgo-backend/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | API port (leave unset on Render) |
| `NODE_ENV` | `development` / `production` |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service-role key |
| `JWT_SECRET` | 32+ character random secret |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `7d`) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Email config |
| `FRONTEND_URL` | Allowed CORS origin(s), comma-separated |

**Business constants** (with defaults):

| Variable | Default | Meaning |
|----------|:-------:|---------|
| `MAX_PARKING_HOURS` | `4` | Max parking time before overtime |
| `MAX_EXTENSION_HOURS` | `4` | Max extra time a subscriber may add |
| `MIN_FREE_PERCENT` | `40` | Reservation guardrail on free capacity |
| `MIN_RESERVATION_HOURS_AHEAD` | `24` | Earliest a reservation may start |
| `MAX_RESERVATION_DAYS_AHEAD` | `7` | Latest a reservation may start |
| `NO_SHOW_GRACE_MINUTES` | `15` | Grace window before a no-show cancels |
| `MAX_DELAYS_BEFORE_CANCEL` | `3` | Late returns before subscription is cancelled |
| `INSTALLER_OPERATION_SECONDS` | `20` | Simulated robot bay operation time |

### Frontend (`parkgo-frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL (e.g. `http://localhost:5000/api`) |
| `VITE_APP_NAME` | App display name |

> Capacity is **not** configured here — floors and spaces are created at runtime
> by the manager, and every count is derived from the `parking_space` table.

---

## 📜 Scripts

**Backend**

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon (hot reload) |
| `npm start` | Start in production |

**Frontend**

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

---

## 🌐 API Overview

Base URL: `/api`

| Resource | Base path | Purpose |
|----------|-----------|---------|
| Auth | `/api/auth` | Login, current user |
| Subscribers | `/api/subscribers` | Registration, profile, self-update |
| Parking | `/api/parking` | Drop off, pick up, extend, lost code |
| Reservations | `/api/reservations` | Create, list, cancel |
| Facility | `/api/facility` | Live load, spaces, occupancy |
| Reports | `/api/reports` | Analytics for managers |

---

## ☁️ Deployment

The repo ships a [`render.yaml`](render.yaml) blueprint for deploying both the
API and the SPA on [Render](https://render.com). The frontend's production API URL
is configured via `parkgo-frontend/.env.production`.

---

## 📄 License

ISC © ParkGo

<div align="center">
<sub>Built with React, Express & Supabase.</sub>
</div>
