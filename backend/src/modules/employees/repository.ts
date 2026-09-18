import { query } from "../../config/db";
import type { CreateEmployeeInput, ListEmployeesQuery, UpdateEmployeeInput } from "./schema";

export interface EmployeeRow {
  id: string;
  user_id: string | null;
  full_name: string;
  phone: string | null;
  position: string;
  base_salary: string;
  employment_status: "active" | "on_leave" | "terminated";
  start_date: string;
  notes: string | null;
  status: "active" | "archived" | "deleted";
  created_at: Date;
  updated_at: Date;
}

const COLUMNS = `id, user_id, full_name, phone, position, base_salary, employment_status, start_date, notes, status, created_at, updated_at`;

export async function insertEmployee(input: CreateEmployeeInput): Promise<EmployeeRow> {
  const result = await query<{ id: string }>(
    `INSERT INTO employees (user_id, full_name, phone, position, base_salary, start_date, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      input.userId ?? null,
      input.fullName,
      input.phone ?? null,
      input.position,
      input.baseSalary,
      input.startDate,
      input.notes ?? null,
    ]
  );
  return getEmployeeById(result.rows[0]!.id) as Promise<EmployeeRow>;
}

export async function getEmployeeById(id: string): Promise<EmployeeRow | null> {
  const result = await query<EmployeeRow>(`SELECT ${COLUMNS} FROM employees WHERE id = $1 AND status <> 'deleted'`, [
    id,
  ]);
  return result.rows[0] ?? null;
}

export async function listEmployees(
  filters: ListEmployeesQuery
): Promise<{ rows: EmployeeRow[]; total: number }> {
  const conditions: string[] = [`status <> 'deleted'`];
  const params: unknown[] = [];

  if (filters.q) {
    params.push(`%${filters.q}%`);
    conditions.push(`(full_name ILIKE $${params.length} OR position ILIKE $${params.length})`);
  }
  if (filters.employmentStatus) {
    params.push(filters.employmentStatus);
    conditions.push(`employment_status = $${params.length}`);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM employees ${whereClause}`,
    params
  );

  const limit = filters.pageSize;
  const offset = (filters.page - 1) * filters.pageSize;
  params.push(limit, offset);

  const rowsResult = await query<EmployeeRow>(
    `SELECT ${COLUMNS} FROM employees ${whereClause}
     ORDER BY full_name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { rows: rowsResult.rows, total: Number(countResult.rows[0]!.count) };
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput): Promise<EmployeeRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];

  for (const [key, column] of [
    ["fullName", "full_name"],
    ["phone", "phone"],
    ["position", "position"],
    ["baseSalary", "base_salary"],
    ["startDate", "start_date"],
    ["notes", "notes"],
    ["userId", "user_id"],
    ["employmentStatus", "employment_status"],
  ] as const) {
    const value = input[key];
    if (value !== undefined) {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    }
  }

  if (sets.length === 0) {
    return getEmployeeById(id);
  }

  sets.push("updated_at = now()");
  params.push(id);

  await query(`UPDATE employees SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
  return getEmployeeById(id);
}

export async function archiveEmployee(id: string): Promise<EmployeeRow | null> {
  await query(`UPDATE employees SET status = 'archived', updated_at = now() WHERE id = $1`, [id]);
  return getEmployeeById(id);
}
