import { AppError } from "../../lib/AppError";
import { recordAudit } from "../../lib/audit";
import { hashPassword, verifyPassword } from "../../lib/password";
import {
  generateOpaqueToken,
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken,
} from "../../lib/tokens";
import type { AuthenticatedUser } from "../../types";
import { env } from "../../config/env";
import * as authRepo from "./repository";

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}

function toAuthenticatedUser(row: authRepo.UserWithPermissions): AuthenticatedUser {
  return { id: row.id, email: row.email, role: row.role, permissions: row.permissions };
}

function refreshExpiry(): Date {
  const days = env.REFRESH_TOKEN_TTL_DAYS;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export async function login(
  email: string,
  password: string,
  ipAddress: string | null
): Promise<LoginResult> {
  const row = await authRepo.findUserByEmail(email);

  // Same generic error whether the email doesn't exist or the password is wrong,
  // so a login attempt never reveals which accounts exist.
  const invalidCredentials = () => AppError.unauthorized("Invalid email or password");

  if (!row) {
    throw invalidCredentials();
  }
  if (!row.is_active) {
    throw AppError.forbidden("This account has been deactivated");
  }

  const passwordOk = await verifyPassword(row.password_hash, password);
  if (!passwordOk) {
    await recordAudit({ userId: row.id, action: "auth.login_failed", ipAddress });
    throw invalidCredentials();
  }

  const user = toAuthenticatedUser(row);
  const accessToken = signAccessToken(user);
  const { token: refreshToken, tokenHash } = generateRefreshToken();

  await authRepo.storeRefreshToken(user.id, tokenHash, refreshExpiry());
  await authRepo.touchLastLogin(user.id);
  await recordAudit({ userId: user.id, action: "auth.login", ipAddress });

  return { accessToken, refreshToken, user };
}

export async function refresh(refreshToken: string, ipAddress: string | null): Promise<LoginResult> {
  const tokenHash = hashRefreshToken(refreshToken);
  const stored = await authRepo.findActiveRefreshToken(tokenHash);
  if (!stored) {
    throw AppError.unauthorized("Refresh token is invalid or expired");
  }

  const row = await authRepo.findUserById(stored.user_id);
  if (!row || !row.is_active) {
    throw AppError.unauthorized("Account is no longer active");
  }

  // Rotate: the presented token is single-use, a fresh one replaces it.
  await authRepo.revokeRefreshTokenByHash(tokenHash);

  const user = toAuthenticatedUser(row);
  const accessToken = signAccessToken(user);
  const { token: newRefreshToken, tokenHash: newHash } = generateRefreshToken();
  await authRepo.storeRefreshToken(user.id, newHash, refreshExpiry());
  await recordAudit({ userId: user.id, action: "auth.refresh", ipAddress });

  return { accessToken, refreshToken: newRefreshToken, user };
}

export async function logout(refreshToken: string, userId: string | null): Promise<void> {
  await authRepo.revokeRefreshTokenByHash(hashRefreshToken(refreshToken));
  await recordAudit({ userId, action: "auth.logout" });
}

export async function requestPasswordReset(email: string): Promise<void> {
  const row = await authRepo.findUserByEmail(email);
  // Always succeed from the caller's perspective, whether or not the email exists,
  // so this endpoint can't be used to enumerate accounts.
  if (!row || !row.is_active) {
    return;
  }

  const token = generateOpaqueToken();
  const tokenHash = hashRefreshToken(token);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await authRepo.storePasswordReset(row.id, tokenHash, expiresAt);
  await recordAudit({ userId: row.id, action: "auth.password_reset_requested" });

  // TODO(Phase 1 follow-up): send `token` via the SMTP_* configured email transport.
  // Deliberately not implemented yet - no email provider has been chosen; logging keeps
  // the flow testable end-to-end without silently dropping the reset token.
  if (env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.info(`[dev] Password reset token for ${email}: ${token}`);
  }
}

export async function confirmPasswordReset(token: string, newPassword: string): Promise<void> {
  const tokenHash = hashRefreshToken(token);
  const reset = await authRepo.findActivePasswordReset(tokenHash);
  if (!reset) {
    throw AppError.badRequest("Reset token is invalid or expired");
  }

  const passwordHash = await hashPassword(newPassword);
  await authRepo.updateUserPassword(reset.user_id, passwordHash);
  await authRepo.markPasswordResetUsed(reset.id);
  await authRepo.revokeAllRefreshTokensForUser(reset.user_id);
  await recordAudit({ userId: reset.user_id, action: "auth.password_reset_completed" });
}
