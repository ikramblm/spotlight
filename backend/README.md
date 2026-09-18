# Spotlight API (Phase 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10)

Node.js / Express / TypeScript backend for the Spotlight event-venue management platform.

- **Phase 1:** authentication, users, roles/permissions, audit-log foundation.
- **Phase 2:** customers, halls, event services, booking requests (with approve/reject/convert),
  and bookings — with hall booking-conflict prevention and remaining-balance calculation.
- **Phase 3:** the `events` record auto-created for every confirmed booking, and the calendar
  read endpoints (`GET /calendar`, `GET /calendar/today`).
- **Phase 4:** guests (`/events/:eventId/guests`, CSV import, attendance stats), invitations with
  an on-the-fly QR code (`/invitations/*`) and a public unauthenticated RSVP page
  (`/public/rsvp/:token`), and QR check-in (`/checkin/scan`, `/checkin/guest/:guestId`,
  `/checkin/override`) with an audited, DB-enforced duplicate-check-in guard.
- **Phase 5:** confiscated-item deposit and restitution (`/confiscations/*`) — a multipart photo
  upload that's validated by real decode (not just extension) and re-encoded to strip metadata,
  a DB constraint preventing two items sharing an active storage tag, and another preventing a
  duplicate restitution.
- **Phase 6:** expenses and expense categories (`/expenses/*`, `/expense-categories`) filterable
  by date range and category, a CSV export, and a financial summary endpoint (revenue, payments
  received, expenses, outstanding balance, per-category breakdown) — Business Owner only.
- **Phase 7:** employees (`/employees/*`, optionally linked to a `users` login) and payroll
  (`/payroll/*`, `/employees/:employeeId/payroll` for history) — one payroll run per employee per
  period (DB-enforced), `net_pay` computed by Postgres, edits locked once a run is marked paid —
  Business Owner only.
- **Phase 8:** caterers (`/caterers/*`, with booking assign/unassign), suppliers (`/suppliers/*`,
  with purchase-history and linked-equipment on the detail view), and equipment (`/equipment/*`,
  with `/equipment/:id/assignments` and `/equipment/assignments/:assignmentId/return`) — equipment
  quantity is decremented/restored under a `FOR UPDATE` row lock inside a transaction so two
  concurrent assignments can never both succeed past `quantity_available`, and a `CHECK` constraint
  stops `quantity_total` from ever being edited below what's currently assigned out.
- **Phase 9:** an append-only archive trail (`GET /archives`, filterable by `entityType`) that
  every module's `/:id/archive` endpoint now writes a "what, when, why, by whom" row to, a
  read-only audit log viewer (`GET /audit-logs`, filterable by user/action/entityType/date
  range), a single-round-trip dashboard KPI endpoint (`GET /dashboard`), a guest-list CSV export
  (`GET /events/:eventId/guests/export`), and a financial-summary PDF export
  (`GET /expenses/summary/export`, via `pdfkit`).
- **Phase 10:** a security hardening pass, CI (lint + typecheck + the full test suite against a
  real Postgres service container), a production `Dockerfile`, and a k6 load-test script — see
  [`../SECURITY.md`](../SECURITY.md) and [`../DEPLOYMENT.md`](../DEPLOYMENT.md).

See the shared architecture doc for the full system design and the phase-by-phase plan.

## Prerequisites

- Node.js 20+
- Docker (for local Postgres via `docker-compose.yml` at the project root), or your own Postgres 16 instance

## Linting

```bash
npm run lint
```

`eslint.config.js` (flat config) + `typescript-eslint`'s recommended rules. `no-console` is a
warning, not an error, everywhere except the handful of intentional CLI/startup log lines, which
each carry their own `// eslint-disable-next-line no-console`.

## Setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env: at minimum set real values for JWT_ACCESS_SECRET / JWT_REFRESH_SECRET

# from the project root, start Postgres
docker compose up -d

npm run migrate
npm run seed   # creates the demo Business Owner account (see console output for credentials)
npm run dev    # http://localhost:4000
```

`GET /health` should return `{ "status": "ok" }` once the server is running.

## Running tests

Unit tests (`src/lib/*.test.ts`, `tests/rbac.test.ts`) need no database and run standalone:

```bash
npx jest src/lib tests/rbac.test.ts
```

The full suite includes integration tests (`tests/auth.test.ts`, `tests/users.test.ts`,
`tests/customers.test.ts`, `tests/halls.test.ts`, `tests/booking-requests.test.ts`,
`tests/bookings.test.ts`, `tests/calendar.test.ts`, `tests/guests.test.ts`,
`tests/invitations-rsvp.test.ts`, `tests/checkin.test.ts`, `tests/confiscations.test.ts`,
`tests/expenses.test.ts`, `tests/employees.test.ts`, `tests/payroll.test.ts`,
`tests/caterers.test.ts`, `tests/suppliers.test.ts`, `tests/equipment.test.ts`,
`tests/archives.test.ts`, `tests/audit-logs.test.ts`, `tests/dashboard.test.ts`,
`tests/security.test.ts`) that hit a real
Postgres database — this matters because the actual guarantees (unique constraints, the hall
booking-overlap `EXCLUDE` constraint, the `remaining_balance`/`net_pay` generated columns, the
partial unique indexes governing check-ins and active storage tags) live in the database, not
in mocked application code.

```bash
# create a disposable test database once:
docker compose exec postgres psql -U spotlight -c "CREATE DATABASE spotlight_test"

# point DATABASE_URL at it for the test run (PowerShell):
$env:DATABASE_URL = "postgres://spotlight:spotlight@localhost:5432/spotlight_test"
npm test
```

`npm test` runs `pretest` first, which applies migrations to whatever `DATABASE_URL` currently
points at — never run it against a database with real data you care about.

`.github/workflows/backend-ci.yml` runs this exact `npm test` against a throwaway Postgres
service container on every push/PR — the first place in this project's history the integration
suite has actually executed (every environment it was built in up to Phase 10 had no Postgres
available at all).

## Project layout

See `docs/folder-structure.md` (or architecture doc §9). In short: `src/modules/<name>` holds one
vertical slice (`routes.ts`, `controller.ts`, `service.ts`, `repository.ts`, `schema.ts`) per
resource; `src/middleware` is the auth/RBAC/validation/rate-limit gate every request passes
through; `database/migrations` is the source of truth for the schema, applied via
`scripts/migrate.ts`.

## Phase 4 notes

- **QR codes are generated on the fly**, not pre-rendered and stored: `GET /invitations/:id/qr.png`
  encodes the invitation's `public_token` into a PNG at request time (via the `qrcode` package).
  `invitations.qr_code_key` stays in the schema but unused — reserved for a future cached image
  in object storage if that's ever needed at scale.
- **Sending an invitation is simulated**: `POST /invitations/:id/send` marks `sent_at` and logs
  the RSVP link to the console in development (same pattern as the Phase 1 password-reset email).
  No email/SMS provider is wired up yet — see `SMTP_*` in `.env.example`.
- **CSV guest import** (`POST /events/:eventId/guests/import`) accepts raw CSV text in the request
  body, not a file upload, and skips rows missing a name rather than failing the whole import.

## Phase 5 notes

- **Confiscation photos are stored on local disk in development** (`backend/storage/uploads/`,
  gitignored), behind the same key-based interface a real object-storage backend would use —
  see `src/lib/fileStorage.ts`. Swap that module, not its callers, once `OBJECT_STORAGE_*` is
  wired up.
- **Photo uploads are multipart** (`POST /confiscations`, field name `photo`), not base64-in-JSON
  — this keeps the app-wide 1MB JSON body limit intact for everything else instead of raising it
  globally to accommodate one route.
- **Every uploaded photo is decoded and re-encoded** with `sharp` before it's stored: decoding
  doubles as the "is this actually an image" check (a renamed non-image file fails here,
  regardless of what content-type the client claims), and re-encoding to a fresh JPEG strips all
  embedded metadata, including any GPS EXIF tag a phone camera would have written.

## Phase 6 notes

- **`expenses.supplier_id` doesn't exist yet.** The architecture doc's `expenses` schema
  references `suppliers`, but that table is a Phase 8 deliverable. Rather than forward-reference
  a table that doesn't exist, the column arrives via an `ALTER TABLE` in Phase 8's migration once
  `suppliers` is real.
- **"Revenue" vs. "Payments received"** are deliberately different figures: revenue sums
  `bookings.total_amount` (the contracted value, accrual-style) for non-canceled bookings in
  range; payments received sums `advance_payment` (cash actually collected) for the same set.
  Outstanding balance is a current snapshot, not date-ranged — it reflects money owed right now
  regardless of when the booking happened.
- **No expense deletion**, only create/edit — consistent with §20/§30's "don't casually destroy
  historical/financial records."

## Phase 7 notes

- **Payroll's `partial` payment status is unreachable.** The `payment_status` column reuses the
  existing `unpaid`/`partial`/`paid` enum, but there's no "amount paid so far" column to make a
  partial disbursement meaningful — only `POST /payroll/:id/pay` (unpaid → paid) is wired up.
  Modeling real partial payroll payments would need a dedicated amount-paid column; not built
  since the spec doesn't call for it explicitly.
- **A payroll run locks once paid** — `PATCH /payroll/:id` (bonuses/deductions) is refused after
  `POST /payroll/:id/pay`, so a finalized, disbursed run can't silently change after the fact.
- **One run per employee per period** is DB-enforced (`idx_payroll_one_per_period`), not just
  application-checked — re-running payroll for an already-processed period is a 409, not a
  silent duplicate.

## Phase 8 notes

- **`expenses.supplier_id` lands here**, closing the forward-reference noted in the Phase 6 notes
  above: `expenses` now optionally links to `suppliers`, and the expense CSV export gained a
  "Supplier" column.
- **Caterers/suppliers/equipment share the Halls/Services permission pattern**, not the
  Employees/Payroll one: Event Coordinator gets view-only, Operations Manager gets
  view/create/edit (and, for equipment, assign/return), and archive is Business Owner only —
  these are operational/catalog records, not sensitive financial or HR data.
- **Equipment assignment is concurrency-safe by construction**, not just by convention: the
  assign/return handlers open a transaction and take a `FOR UPDATE` row lock on the equipment row
  before checking `quantity_available`, so two simultaneous assignment requests for the last unit
  can't both succeed. A `CHECK (quantity_available <= quantity_total)` constraint on the table is
  the backstop if application logic is ever bypassed.
- **Caterer↔booking is a many-to-many junction** (`booking_caterers`, composite primary key), not
  a foreign key on `bookings`, since a single event can reasonably use more than one caterer.

## Phase 9 notes

- **Archiving stays a per-module action; `archives` is the trail layered underneath it**, not a
  generic "archive anything" endpoint. Each module's existing `/:id/archive` route now also
  writes a row (`entity_type`, `entity_id`, `reason`, `archived_by`, `archived_at`) to the shared
  `archives` table via `src/lib/archive.ts::recordArchive`, mirroring how `src/lib/audit.ts`
  already sat underneath every module since Phase 1. A single generic `POST /archives` was
  considered (and appears in the architecture doc's API table) but would have had to duplicate
  each module's own business-rule checks and authorization to archive safely, for no real benefit
  over the existing per-resource routes — `GET /archives` alone covers the "browse what was
  archived, when, and why" need.
- **Every archive endpoint now accepts an optional `reason` in its request body**, threaded
  through to the `archives` row. Existing callers that send no body are unaffected (`reason` is
  optional and defaults to `null`).
- **The dashboard's shape is driven by the caller's own finer-grained permissions**
  (`calendar.*`, `booking_requests.view`, `confiscations.view`, `expenses.view`), not a
  role check in the route — a Security Staff account and a Business Owner account calling the
  same `GET /dashboard` get different JSON back. This avoids a second permission system just for
  which KPI cards to show.
- **PDF export uses `pdfkit`, generating the file in memory** (`src/lib/pdf.ts::buildPdf`) rather
  than writing to disk — consistent with how CSV export already returns a string built entirely
  in memory. Fine at this scale; would need to move to a streamed response if reports ever grow
  large enough to matter.

## Phase 10 notes

Full detail lives in [`../SECURITY.md`](../SECURITY.md) and [`../DEPLOYMENT.md`](../DEPLOYMENT.md)
rather than duplicated here; the short version of what changed:

- **Two real bugs found and fixed by actually building and running the production artifact for
  the first time.** `package.json`'s `main`/`start` pointed at `dist/server.js`, and the
  Dockerfile's `CMD` did the same - but `tsconfig.json`'s `rootDir: "."` (needed so `tsc` can
  also compile `scripts/` and `tests/`) means the real compiled entry point is
  `dist/src/server.js`. Neither had ever been exercised before - local dev always ran through
  `tsx watch src/server.ts` directly, bypassing the compiled output. Caught by actually running
  `npm run build && npm start` rather than assuming the path was right, which is exactly the kind
  of thing a "deployment" phase is for.
- **`eslint` was referenced in `package.json`'s `lint` script but never actually installed or
  configured** - `npm run lint` would fail outright, not silently pass. Added `eslint.config.js`
  (flat config) + `typescript-eslint`, which immediately surfaced a handful of real, if minor,
  issues (a dead import, a stale `eslint-disable` comment, a few un-annotated `console` calls) -
  now fixed.
- **A full SQL-injection review of every dynamically-built query string across every module**
  turned up nothing - every request-derived value already flows through a `$N` parameter, never
  direct interpolation. Column names and `WHERE`/`SET` fragments are the only things ever
  template-interpolated, and those only ever come from fixed literals in the source, never from
  request input. Documented in `SECURITY.md` rather than left as tribal knowledge.
- **`src/config/db.ts` gained a `withTransaction` helper.** A few modules (equipment, bookings)
  already hand-rolled BEGIN/COMMIT/ROLLBACK correctly before this existed - not worth touching
  now that they work - but it's the pattern for anything new needing multi-statement atomicity,
  and the guest CSV bulk-import now uses it.

## Demo account

`npm run seed` creates a Business Owner account (email/password printed to the console, override
via `SEED_OWNER_EMAIL` / `SEED_OWNER_PASSWORD`). It is for local development only — change or
remove it before deploying anywhere real.
