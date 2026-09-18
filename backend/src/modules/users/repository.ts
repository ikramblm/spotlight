import { query } from "../../config/db";
import type { UserRole } from "../../types";
import type { CreateUserInput, ListUsersQuery, UpdateUserInput } from "./schema";

export interface UserRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  last_login_at: Date | null;
  created_at: Date;
}

const USER_COLUMNS = `u.id, u.full_name, u.email, u.phone, r.name AS role, u.is_active, u.last_login_at, u.created_at`;

export async function getRoleIdByName(role: UserRole): Promise<number> {
  const result = await query<{ id: number }>(`SELECT id FROM roles WHERE name = $1`, [role]);
  const row = result.rows[0];
  if (!row) {
    throw new Error(`Unknown role: ${role}`);
  }
  return row.id;
}

export async function emailExists(email: string): Promise<boolean> {
  const result = await query(`SELECT 1 FROM users WHERE email = $1`, [email]);
  return (result.rowCount ?? 0) > 0;
}

export async function insertUser(
  input: CreateUserInput & { passwordHash: string; roleId: number }
): Promise<UserRow> {
  const result = await query<{ id: string }>(
    `INSERT INTO users (full_name, email, phone, password_hash, role_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [input.fullName, input.email, input.phone ?? null, input.passwordHash, input.roleId]
  );
  const id = result.rows[0]!.id;
  return getUserById(id) as Promise<UserRow>;
}

export async function getUserById(id: string): Promise<UserRow | null> {
  const result = await query<UserRow>(
    `SELECT ${USER_COLUMNS} FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function listUsers(
  filters: ListUsersQuery
): Promise<{ rows: UserRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.role) {
    params.push(filters.role);
    conditions.push(`r.name = $${params.length}`);
  }
  if (filters.q) {
    params.push(`%${filters.q}%`);
    conditions.push(`(u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM users u JOIN roles r ON r.id = u.role_id ${whereClause}`,
    params
  );

  const limit = filters.pageSize;
  const offset = (filters.page - 1) * filters.pageSize;
  params.push(limit, offset);

  const rowsResult = await query<UserRow>(
    `SELECT ${USER_COLUMNS} FROM users u JOIN roles r ON r.id = u.role_id ${whereClause}
     ORDER BY u.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { rows: rowsResult.rows, total: Number(countResult.rows[0]!.count) };
}

export async function updateUser(id: string, input: UpdateUserInput & { roleId?: number }) {
  const sets: string[] = [];
  const params: unknown[] = [];

  if (input.fullName !== undefined) {
    params.push(input.fullName);
    sets.push(`full_name = $${params.length}`);
  }
  if (input.phone !== undefined) {
    params.push(input.phone);
    sets.push(`phone = $${params.length}`);
  }
  if (input.roleId !== undefined) {
    params.push(input.roleId);
    sets.push(`role_id = $${params.length}`);
  }

  if (sets.length === 0) {
    return getUserById(id);
  }

  sets.push(`updated_at = now()`);
  params.push(id);

  await query(`UPDATE users SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
  return getUserById(id);
}

export async function setUserActive(id: string, isActive: boolean): Promise<UserRow | null> {
  await query(`UPDATE users SET is_active = $1, updated_at = now() WHERE id = $2`, [isActive, id]);
  return getUserById(id);
}
