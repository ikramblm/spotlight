import { query } from "../../config/db";
import type { UserRole } from "../../types";

export interface UserWithPermissions {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
  permissions: string[];
}

export async function findUserByEmail(email: string): Promise<UserWithPermissions | null> {
  const result = await query<UserWithPermissions>(
    `SELECT u.id, u.full_name, u.email, u.password_hash, r.name AS role, u.is_active,
            COALESCE(array_agg(p.code) FILTER (WHERE p.code IS NOT NULL), '{}') AS permissions
     FROM users u
     JOIN roles r ON r.id = u.role_id
     LEFT JOIN role_permissions rp ON rp.role_id = r.id
     LEFT JOIN permissions p ON p.id = rp.permission_id
     WHERE u.email = $1
     GROUP BY u.id, r.name`,
    [email]
  );
  return result.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserWithPermissions | null> {
  const result = await query<UserWithPermissions>(
    `SELECT u.id, u.full_name, u.email, u.password_hash, r.name AS role, u.is_active,
            COALESCE(array_agg(p.code) FILTER (WHERE p.code IS NOT NULL), '{}') AS permissions
     FROM users u
     JOIN roles r ON r.id = u.role_id
     LEFT JOIN role_permissions rp ON rp.role_id = r.id
     LEFT JOIN permissions p ON p.id = rp.permission_id
     WHERE u.id = $1
     GROUP BY u.id, r.name`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function touchLastLogin(userId: string): Promise<void> {
  await query(`UPDATE users SET last_login_at = now() WHERE id = $1`, [userId]);
}

export async function storeRefreshToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date
): Promise<void> {
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );
}

export async function findActiveRefreshToken(tokenHash: string) {
  const result = await query<{ id: string; user_id: string; expires_at: Date; revoked_at: Date | null }>(
    `SELECT id, user_id, expires_at, revoked_at FROM refresh_tokens
     WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()`,
    [tokenHash]
  );
  return result.rows[0] ?? null;
}

export async function revokeRefreshTokenByHash(tokenHash: string): Promise<void> {
  await query(`UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1`, [tokenHash]);
}

export async function revokeAllRefreshTokensForUser(userId: string): Promise<void> {
  await query(
    `UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
}

export async function storePasswordReset(
  userId: string,
  tokenHash: string,
  expiresAt: Date
): Promise<void> {
  await query(
    `INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );
}

export async function findActivePasswordReset(tokenHash: string) {
  const result = await query<{ id: string; user_id: string }>(
    `SELECT id, user_id FROM password_resets
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()`,
    [tokenHash]
  );
  return result.rows[0] ?? null;
}

export async function markPasswordResetUsed(id: string): Promise<void> {
  await query(`UPDATE password_resets SET used_at = now() WHERE id = $1`, [id]);
}

export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  await query(`UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`, [
    passwordHash,
    userId,
  ]);
}
