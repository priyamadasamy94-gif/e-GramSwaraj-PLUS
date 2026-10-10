# E-GramSwaraj+ — South Thittankulam (Phase 1)

A full-stack digital governance platform for **South Thittankulam Village Panchayat, Kovilpatti Taluk, Tamil Nadu – 628502, India**.

**Stack:** React 18 + Vite + Tailwind + React Router + Axios + Recharts + Leaflet/OpenStreetMap · Node.js + Express REST API · MySQL + Sequelize · JWT + bcrypt.

> Phase 1 = **one village + complete functionality**. Every village-specific record carries a `villageId`, so more villages can be added later without code changes.

---

## 1. Quick start

Requirements: **Node.js 18+** and **MySQL 8+**.

```bash
cd egramswaraj-plus

# 1. Install everything (root, backend, frontend)
npm run install:all

# 2. Create the database and configure .env from .env.example

# 3. For a new/demo database only: create the village + demo data
npm run seed

# 4. (Optional) Verify the database connection and village relationships
npm run check-db --prefix backend

# 5. Run backend + frontend together
npm run dev
```

| | URL |
|---|---|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:5000/api |
| **Health / DB status** | http://localhost:5000/api/health → `"database": "connected"` |

Run them separately instead if you prefer:

```bash
cd backend  && npm run dev     # API on :5000 (auto-restarts on change)
cd frontend && npm run dev     # UI on :5173 (proxies /api to :5000)
```

> **Real-data safety:** `npm run seed` creates demonstration records. Do not run it against a database containing manually entered real data.

Production build of the UI: `npm run build` → `frontend/dist/`. Serve it from any static host and set `VITE_API_URL` (see `frontend/.env.example`) plus `CORS_ORIGIN` in `.env`.

### MySQL setup

Create the database before starting the backend; Sequelize creates the application tables at startup.

```sql
CREATE DATABASE egramswaraj CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Set `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, and `MYSQL_PASSWORD` in the root `.env`. The previous MongoDB database is not modified, and its records are not copied automatically. Run `npm run seed` to create the active village and demo records in MySQL.

---

## 2. Demo logins (created by `npm run seed`)

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@stk.gov.demo` | `Admin@123` |
| Panchayat Officer | `officer@stk.gov.demo` | `Officer@123` |
| Staff (Overseer) | `staff@stk.gov.demo` | `Staff@123` |
| Staff (Water operator) | `staff2@stk.gov.demo` | `Staff@123` |
| Citizen | `citizen@stk.gov.demo` | `Citizen@123` |
| More citizens | `lakshmi@`, `ganesan@`, `kalaiselvi@`, `ramesh@`, `priya@` `stk.gov.demo` | `Citizen@123` |

New residents can self-register at `/register` (always as CITIZEN of the active village).

---

## 3. Environment variables (`.env` in project root)

| Variable | Purpose |
|---|---|
| `MYSQL_HOST` | MySQL server hostname |
| `MYSQL_PORT` | MySQL port, default `3306` |
| `MYSQL_DATABASE` | Database name |
| `MYSQL_USER` | Database user |
| `MYSQL_PASSWORD` | Database password |
| `JWT_SECRET` | Token signing secret (a random 96-char value was generated for you) |
| `JWT_EXPIRES_IN` | Token lifetime, default `7d` |
| `PORT` | API port, default `5000` |
| `CORS_ORIGIN` | Allowed frontend origin(s), comma-separated |
| `ACTIVE_VILLAGE_CODE` | Phase-1 active village, `STK` |
| `GOOGLE_TRANSLATE_API_KEY` | Backend-only Google Cloud Translation API key |

`.env` is git-ignored. `.env.example` is the template.

### Dynamic content translations

Enable the Google Cloud Translation API for your Google Cloud project and set `GOOGLE_TRANSLATE_API_KEY` in the project-root `.env`. Never add a `VITE_` prefix or place this key in frontend configuration. English displays source text; other supported languages translate displayed database text on demand. Results are cached in the separate `translationCache` table. On an existing database, startup creates only that cache table when missing; it does not alter project, work, asset, or village source records. If the key is missing or Google Translate is unavailable, the UI displays the original text.

---

## 4. Project structure

```text
egramswaraj-plus/
├── .env / .env.example / .gitignore / package.json (root scripts)
├── backend/
│   ├── server.js                 # boots DB, API, reminder job
│   ├── app.js                    # express app: helmet, CORS, sanitize, routes, errors
│   ├── config/                   # env.js, db.js, constants.js (roles & enums)
│   ├── models/                   # Village, User, Citizen, DevelopmentPlan, Work, Asset,
│   │                             # FinancialTransaction, Budget, Meeting, Grievance,
│   │                             # Notification, Announcement, Counter
│   ├── controllers/              # auth, village, modules (generic CRUD configs), work,
│   │                             # asset, grievance, notification, dashboard, report, user, meta
│   ├── services/                 # crudService (village-scoped), statsService, reportService,
│   │                             # budgetService, notificationService
│   ├── middleware/               # auth.js (protect/authorize), error.js
│   ├── routes/                   # index.js (all REST routes), _crud.js
│   ├── jobs/reminders.js         # meeting + maintenance reminders (every 6 h, de-duplicated)
│   ├── utils/                    # ApiError, asyncHandler, response, query (filters/pagination)
│   ├── seed/seed.js              # npm run seed
│   └── scripts/check-db.js       # npm run check-db
└── frontend/
    └── src/
        ├── App.jsx, main.jsx, index.css
        ├── components/ui/        # ResourcePage, DataTable, FilterBar, Form, Modal, Badge, …
        ├── components/charts/    # Donut, category bars, budget bars (Recharts)
        ├── layouts/              # AppLayout (official sidebar / citizen top-nav), nav.js
        ├── routes/               # ProtectedRoute, GuestRoute
        ├── context/              # Auth, Options, Notifications, Toast
        ├── hooks/                # useFetch, useDebounced
        ├── services/api.js       # axios instance (JWT header, 15 s timeout, error mapping)
        ├── utils/                # format (₹, dates), roles, export (CSV/PDF)
        └── pages/                # Dashboard, CitizenDashboard, VillageProfile, VillageInfo,
                                  # Plans, Works, Assets, Finance, Meetings, Citizens,
                                  # Grievances, CitizenGrievance, Announcements,
                                  # Notifications, Reports, Users, Settings, Errors
```

---

## 5. API endpoints

All responses: `{ "success": true, "data": …, "message": "…", "meta": {page,limit,total,pages} }` or `{ "success": false, "message": "…" }`.
Auth header: `Authorization: Bearer <token>`. List endpoints accept `?search=&page=&limit=&sort=&from=&to=` plus module filters (e.g. `GET /api/works?status=IN_PROGRESS&category=Road`). Filtering is performed through parameterized MySQL queries. The `villageId` always comes from the signed-in user, never from the client.

| Area | Endpoints | Roles |
|---|---|---|
| Public | `GET /api/health`, `GET /api/meta/options`, `GET /api/villages/public` | anyone |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET/PUT /api/auth/me`, `PUT /api/auth/change-password` | — / signed in |
| Village | `GET /api/villages/current`, `PUT /api/villages/current` (admin), `GET /api/villages` (admin, Phase-2 groundwork) | |
| Citizens | `GET/POST /api/citizens`, `GET/PUT/DELETE /api/citizens/:id` | read: officials · write: admin/officer · delete: admin |
| Plans | `/api/plans` CRUD — filters `category, priority, status, financialYear` | read: officials · write: admin/officer |
| Works | `/api/works` CRUD — filters `status, category, assignedTo`; `PATCH /api/works/:id/progress` | read: all (citizens get public fields) · progress: admin/officer, staff if assigned |
| Assets | `/api/assets` CRUD — filters `type, condition, status, ward`; `GET /api/assets/maintenance-due?days=30`; `POST /api/assets/:id/maintenance` | read: all · update: officials · create/delete: admin/officer |
| Budgets | `/api/budgets` CRUD; `GET /api/budgets/summary?financialYear=`; `GET /api/budgets/financial-years` | read: admin/officer · write: admin |
| Transactions | `/api/transactions` CRUD — filters `type, category, status, financialYear`, date range | read: admin/officer · write: admin |
| Meetings | `/api/meetings` CRUD — filters `type, status`, date range | read: all (citizens: public only) · write: admin/officer |
| Grievances | `GET /api/grievances`, `POST /api/grievances`, `GET /api/grievances/:id`, `GET /api/grievances/track/:ref`, `PATCH /:id/assign`, `PATCH /:id/status`, `DELETE /:id` | citizens: own · staff: assigned · admin/officer: all |
| Announcements | `/api/announcements` CRUD — filters `category, status` | read: all (citizens: published & not expired) · write: admin/officer |
| Notifications | `GET /api/notifications`, `GET /unread-count`, `PATCH /:id/read`, `PATCH /read-all`, `DELETE /:id` | own only |
| Dashboard | `GET /api/dashboard/stats` (officials), `GET /api/dashboard/citizen` | |
| Reports | `GET /api/reports/development`, `/assets` (officials), `/finance`, `/grievances` (admin/officer), `/public` (all) | |
| Users | `GET/POST /api/users`, `PUT/DELETE /api/users/:id` (admin), `GET /api/users/officials` (admin/officer) | |

---

## 6. What's implemented

- **Auth & RBAC:** bcrypt (12 rounds), JWT, role middleware on every route, rate-limited login/register, inactive accounts blocked, passwords never returned.
- **Village isolation:** every village-scoped model has an indexed `villageId`. The generic `crudService` always injects `req.user.villageId`, so one village can never see another's data.
- **Dashboard:** 10 live KPI cards + charts (work status, grievance status, budget allocation vs utilisation, asset condition, works/plans by category). Aggregates are computed in MySQL.
- **Village profile:** details, stats, panchayat, contact, facilities, development overview, and a Leaflet/OpenStreetMap map clearly labelled as an *approximate* prototype location. It shows no cadastral or survey boundaries. The model has a `gis` field ready for official GeoJSON in later phases. Admins can edit everything, including facilities.
- **Development plans:** CRUD, search, category/priority/status/date filters, table + cards + progress views.
- **Works:** CRUD, progress bars, progress updates with notes and history, auto-complete at 100%, staff can update only their assigned works.
- **Assets:** CRUD, GOOD/FAIR/POOR/CRITICAL condition, maintenance log, automatic next-maintenance scheduling, a 30-day reminder panel, and background reminder notifications.
- **Finance:** budget heads per FY, income/expense register, FY/category/type/date filters. Budget utilisation is **recalculated automatically** from completed expense transactions. Summary cards and charts. All finance data is flagged as demo.
- **Meetings:** Gram Sabha, Panchayat and Committee meetings with agenda, minutes, decisions and attendance (total/men/women/officials). Citizens see public meetings. Scheduling notifies everyone.
- **Grievances:** citizen submission → reference `STK-GRV-2026-0001` (atomic counter per village per year) → acknowledge/assign → in progress → resolved/rejected. Transitions are validated, a resolution is required to close, and there's a timeline and stepper. Citizens are notified on every change, and officials can file on behalf of walk-in citizens.
- **Announcements:** 6 categories, draft/published/archived, pin, expiry. Publishing notifies all users. Emergencies are highlighted.
- **Notifications:** per-user, unread badge (polls every 60 s), mark read / all read, delete, type filter.
- **Reports:** Development, Finance, Assets, Grievances + a citizen-safe Public report. Each has **Print**, **Export CSV** and **Export PDF**. List pages also have CSV export.
- **Security:** helmet, CORS allow-list, parameterized SQL queries, whitelisted writable fields (clients can't set `villageId`, `createdBy` or role on register), escaped search terms, JSON body limit, and a central error handler (validation → 400, duplicates → 409, bad ids → 400).
- **UX:** responsive (sidebar collapses to a drawer; tables become cards on phones), loading/empty/error states, confirmation dialogs, toasts, 15 s API timeout with clear messages, 404 and 403 pages, session-expiry handling.

## 7. Data honesty

All seeded records are flagged `isDemo: true`. Transactions use `DEMO-` reference numbers and a `[DEMO]` suffix. The UI shows "demo data, not official" notices on the dashboard, finance, reports and village pages. Population, area, facilities, officials' names and contacts are placeholders. Replace them with verified information through **Village Information** (admin).

## 8. Adding another village later (Phase 2)

1. Insert a new `Village` document (unique `villageCode`).
2. Create users with that `villageId`. All modules then work for that village with no code changes.
3. Add a State → District → Taluk → Village selector in the UI and let admins switch `ACTIVE_VILLAGE_CODE` or scope per user (already per user via `villageId`).

## 9. Testing done during development

The earlier MongoDB-specific test results do not validate this MySQL persistence change. After configuring MySQL, verify the connection and seeded village with `npm run seed` and `npm run check-db --prefix backend`.
