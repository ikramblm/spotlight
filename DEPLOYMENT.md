# Deploying Spotlight

Architecture doc §10's promotion flow: `local` (docker-compose: Postgres + `npm run dev`) →
`staging` → `production`, the same container image promoted between the latter two, configured
only by environment variables - never a code change between environments.

## Building the backend image

Build from the **repo root**, not `backend/` - `scripts/migrate.ts` expects `database/` to sit
alongside `backend/`, exactly as it does in the working tree:

```bash
docker build -f backend/Dockerfile -t spotlight-backend:latest .
```

To try the built image locally against the dev Postgres container before pushing anywhere:

```bash
docker compose --profile full up -d
```

(a plain `docker compose up -d`, without `--profile full`, still only starts Postgres - see
`backend/README.md` for the `npm run dev` local workflow that normally covers day-to-day work).

## Environment variables

Every variable the backend reads is documented with a placeholder in
[`backend/.env.example`](backend/.env.example). None of the following should ever hold a value
committed to the repo:

| Variable | Staging/production guidance |
|---|---|
| `DATABASE_URL` | Managed Postgres (e.g. Neon/Supabase/RDS) connection string, with backups and point-in-time recovery enabled - matters given the "never casually destroy history" rule (§30 #8) most of this app's data model is built around. |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Two **different**, long, random values (32+ bytes of entropy) - `env.ts` rejects anything under 16 characters, but that floor is a typo-catcher, not a real strength bar. Generate with `openssl rand -hex 32`, one run per secret. Rotating either invalidates every session immediately. |
| `CORS_ORIGIN` | The Flutter web build's real deployed origin, not `localhost`. Wrong here means the web app can authenticate but every subsequent request gets blocked by the browser. |
| `RATE_LIMIT_*` | Defaults (in `.env.example`) are reasonable starting points; tighten `RATE_LIMIT_AUTH_MAX` further if login brute-forcing shows up in the audit log. |
| `OBJECT_STORAGE_*` | Unset today - confiscation photos fall back to local disk (`backend/storage/uploads/`, see `src/lib/fileStorage.ts`), which does **not** survive a container redeploy. Required before a real deployment: point this at an S3-compatible bucket. |
| `SMTP_*` | Unset today - password-reset and invitation "sending" both just log to console in non-production (`NODE_ENV !== "production"`) and silently no-op otherwise. Required before a real deployment: wire an actual provider, or those two flows are broken in production. |
| `NODE_ENV` | `production` - among other things, this is what suppresses the dev-only console logging of password-reset tokens in `src/modules/auth/service.ts`. |

## Release steps

1. CI (`.github/workflows/backend-ci.yml`) runs lint, `tsc --noEmit`, and the full test suite -
   DB-free unit tests and the Postgres-backed integration tests together - against a throwaway
   Postgres service container, on every push and PR touching `backend/` or `database/`.
2. Build and push the image (`docker build -f backend/Dockerfile ...` as above, tagged with the
   commit SHA).
3. Deploy it to staging first. The container's own entrypoint runs `scripts/migrate.ts` before
   starting the server, so migrations apply automatically - but see "Migrations" below before
   doing this against production.
4. Smoke-test staging: `GET /health` returns `{"status":"ok"}`, log in as the seeded demo owner,
   confirm the audit log (`GET /audit-logs`) is picking up real entries.
5. Promote the same image to production.

## Migrations

`scripts/migrate.ts` tracks what's applied in a `schema_migrations` table and only runs new
files, in filename order - safe to run on every deploy, including against a database that's
already up to date. It is **not** safe to assume a migration is reversible: none of the
`database/migrations/*.sql` files ship a rollback. Review a new migration against production data
shape before it ships, the same way you'd review any other change that can't be undone by
redeploying the previous image.

## Load testing

`backend/loadtest/login-browse.js` is a [k6](https://k6.io) script - login once per virtual user,
then repeated calendar/dashboard/customer-list reads, ramped from 0 to 50 concurrent users. Run
it against staging (never production) before a launch:

```bash
k6 run -e BASE_URL=https://staging.example.com/api/v1 -e EMAIL=... -e PASSWORD=... backend/loadtest/login-browse.js
```

It hasn't been run in this repo's own environment - there's no live staging deployment yet - so
treat the thresholds in the script (`p(95)<800ms`, `<1%` error rate) as a starting point to tune
once real numbers come back, not a validated baseline.

## Rollback

Since deploys promote a tagged image and migrations are forward-only, a rollback is: redeploy the
previous image tag. If the release included a migration the rolled-back code doesn't know about,
confirm the new columns/tables are additive (nullable, defaulted) before rolling back the code
underneath them - none of this project's migrations so far drop or rename anything a previous
version of the code depends on, but that's a property to keep checking, not something migrate.ts
enforces for you.
