import dotenv from "dotenv";

// Loads backend/.env if present (does not override already-set process.env values).
dotenv.config();

// Safe fallbacks so pure unit tests (password/tokens/rbac - no DB involved) run out of the
// box with zero setup. Integration tests (auth/users) still need a real Postgres reachable
// at DATABASE_URL - see backend/README.md "Running tests".
process.env.NODE_ENV ??= "test";
process.env.DATABASE_URL ??= "postgres://spotlight:spotlight@localhost:5432/spotlight_test";
process.env.JWT_ACCESS_SECRET ??= "test-only-access-secret-do-not-use-in-prod-0000";
process.env.JWT_REFRESH_SECRET ??= "test-only-refresh-secret-do-not-use-in-prod-0000";
