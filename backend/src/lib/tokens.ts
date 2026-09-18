import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { AuthenticatedUser } from "../types";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: AuthenticatedUser["role"];
  permissions: string[];
}

const JWT_ALGORITHM = "HS256";

export function signAccessToken(user: AuthenticatedUser): string {
  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
  };
  const options: jwt.SignOptions = {
    algorithm: JWT_ALGORITHM,
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"],
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

/** Pinning `algorithms` isn't optional here - without it a verifier trusts whatever algorithm
 * the token itself claims, which is the classic "alg confusion" attack (e.g. a token that
 * claims `alg: none`, or one signed with an unrelated key of a different algorithm family).
 * Rejecting anything but the one algorithm this service ever signs with closes that off. */
export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: [JWT_ALGORITHM] }) as AccessTokenPayload;
}

/**
 * Refresh tokens are opaque random values, not JWTs: the client holds the raw value,
 * only its SHA-256 hash is stored, so a DB read alone never yields a usable token.
 */
export function generateRefreshToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(48).toString("hex");
  return { token, tokenHash: hashRefreshToken(token) };
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateOpaqueToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}
