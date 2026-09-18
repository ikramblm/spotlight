# Security notes

What Spotlight's backend does, and deliberately doesn't do, to protect the data it holds. This
is the record of the Phase 10 hardening pass, kept up to date as the threat model changes rather
than treated as a one-time checklist.

## Authentication & sessions

- Passwords are hashed with argon2id (`src/lib/password.ts`) - never stored, logged, or
  returned in an API response.
- Access tokens are short-lived JWTs (`ACCESS_TOKEN_TTL`, default 15m); refresh tokens are
  opaque random values, rotated on every use, with only their SHA-256 hash ever touching the
  database (`src/lib/tokens.ts`).
- JWT verification pins the signing algorithm (`{ algorithms: ["HS256"] }`) rather than trusting
  whatever `alg` the token claims - closes the classic algorithm-confusion attack, where an
  attacker crafts an `alg: none` or mismatched-algorithm token to bypass signature checking
  entirely. Regression-tested in `src/lib/tokens.test.ts` and `tests/security.test.ts`.
- Login and password-reset never reveal whether an email exists: the same generic error/response
  either way (`src/modules/auth/service.ts`).
- `/auth/login`, `/auth/refresh`, and the password-reset endpoints carry their own tighter rate
  limit (`authRateLimiter`) on top of the app-wide default; `/public/rsvp/*` gets a dedicated
  `publicRateLimiter` since it's the one unauthenticated route that writes to the database.

## Authorization

- Every route (other than `/health` and `/public/rsvp/*`) requires a valid access token
  (`authenticate`) plus an explicit permission code (`requirePermission`) - there is no
  "authenticated implies allowed" fallback anywhere in the router layer.
- The mobile app hiding a button is convenience only. The actual boundary is server-side, so a
  request forged with curl and a stolen-but-valid token still gets the same 403 the UI would have
  prevented.

## Data handling

- All SQL is parameterized (`$1`, `$2`, ... via `pg`) - reviewed end to end for this phase, and
  every place a query string is built dynamically (`WHERE` clauses, `SET` lists, column lists)
  interpolates only fixed column names or `$N` placeholder indices, never a request-supplied
  value directly. No ORM; this discipline is the actual guarantee.
- Uploaded confiscation photos are decoded and re-encoded with `sharp` before storage (Phase 5)
  - this doubles as the real "is this actually an image" check (a renamed non-image file fails
    the decode, regardless of what `Content-Type` the client claims) and strips embedded
    metadata, including any GPS EXIF a phone camera would have written.
- Nothing with business history is hard-deleted from the API layer (§20/§30 rule #8): archiving
  flips a `status` column and appends a row to `archives` recording who/when/why; the `deleted`
  status exists in the schema but is intentionally never reachable through any route.
- A CSV guest import is capped at `MAX_IMPORT_ROWS` (2000) and now runs inside a single
  transaction - before Phase 10, an oversized file would have run thousands of sequential inserts
  against the shared connection pool with no size limit and no atomicity.

## Transport & headers

- `helmet()` is applied with one deliberate override: `crossOriginResourcePolicy: cross-origin`,
  so the Flutter web build (a different origin from the API) can load QR-code and
  confiscation-photo images. Every route behind that header is still gated by
  `authenticate`/`requirePermission` or, for the public RSVP endpoints, the link token itself -
  CORP isn't doing access-control work here, so relaxing it costs nothing.
- CORS is locked to a single configured origin (`CORS_ORIGIN`), not a wildcard.
- Request bodies are capped at 1MB (`express.json({ limit: "1mb" })`); exceeding it now returns a
  correct `413`, and malformed JSON a correct `400` - both used to fall through to a generic
  `500` before this phase.
- File uploads (`multer`) are capped at 5MB per file.

## Auditing

- Every security- or business-sensitive action - login, login failures, user changes,
  every approve/reject/archive/pay/check-in - is written to `audit_logs` (`src/lib/audit.ts`),
  readable only by Business Owner via `GET /audit-logs`.

## Known gaps (tracked, not hidden)

- **Email/SMS is not wired up.** Password-reset tokens and invitation "sends" log to the console
  in non-production and silently no-op in production until `SMTP_*` is configured - see
  [`DEPLOYMENT.md`](DEPLOYMENT.md).
- **Confiscation photos live on local disk** until `OBJECT_STORAGE_*` is configured, meaning
  they don't survive a container redeploy in the current default configuration.
- **No account lockout beyond IP-based rate limiting.** Five failed attempts per minute per IP
  (`RATE_LIMIT_AUTH_MAX`) slows brute-forcing considerably but doesn't lock the *account* itself
  after N failures from different IPs. Worth adding if this ever needs to withstand a
  credential-stuffing attempt specifically, not just a single attacker hammering one login.
- **No dependency-vulnerability scanning in CI.** `npm audit` is run manually as part of each
  hardening pass (currently: 0 known vulnerabilities); it isn't yet a CI gate that would catch a
  newly-disclosed CVE in an existing dependency between passes.
