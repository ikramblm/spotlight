import rateLimit from "express-rate-limit";
import { env } from "../config/env";

export const authRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_AUTH_WINDOW_MS,
  limit: env.RATE_LIMIT_AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "rate_limited", message: "Too many attempts, please try again later" } },
});

export const defaultRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_DEFAULT_WINDOW_MS,
  limit: env.RATE_LIMIT_DEFAULT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "rate_limited", message: "Too many requests, please slow down" } },
});

/** The public RSVP routes (`/api/v1/public/rsvp/*`) sit behind the app-wide `defaultRateLimiter`
 * already, but they're the one place an unauthenticated caller can trigger a DB write
 * (submitting an RSVP) - a tighter, dedicated limit is worth the small extra config given the
 * token itself is the real access control (192-bit entropy), not the rate limit. */
export const publicRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_PUBLIC_WINDOW_MS,
  limit: env.RATE_LIMIT_PUBLIC_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "rate_limited", message: "Too many requests, please try again later" } },
});
