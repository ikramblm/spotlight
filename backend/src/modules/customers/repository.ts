import { query } from "../../config/db";
import type { CreateCustomerInput, ListCustomersQuery, UpdateCustomerInput } from "./schema";

export interface CustomerRow {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  status: "active" | "archived" | "deleted";
  created_at: Date;
  updated_at: Date;
}

export interface CustomerFinancialSummary {
  total_paid: string;
  outstanding_balance: string;
  booking_count: string;
}

export async function phoneExists(phone: string, excludeId?: string): Promise<boolean> {
  const params: unknown[] = [phone];
  let sql = `SELECT 1 FROM customers WHERE phone = $1 AND status <> 'deleted'`;
  if (excludeId) {
    params.push(excludeId);
    sql += ` AND id <> $2`;
  }
  const result = await query(sql, params);
  return (result.rowCount ?? 0) > 0;
}

export async function insertCustomer(
  input: CreateCustomerInput & { createdBy: string }
): Promise<CustomerRow> {
  const result = await query<{ id: string }>(
    `INSERT INTO customers (full_name, phone, email, address, notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [input.fullName, input.phone, input.email ?? null, input.address ?? null, input.notes ?? null, input.createdBy]
  );
  return getCustomerById(result.rows[0]!.id) as Promise<CustomerRow>;
}

export async function getCustomerById(id: string): Promise<CustomerRow | null> {
  const result = await query<CustomerRow>(
    `SELECT id, full_name, phone, email, address, notes, status, created_at, updated_at
     FROM customers WHERE id = $1 AND status <> 'deleted'`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function listCustomers(
  filters: ListCustomersQuery
): Promise<{ rows: CustomerRow[]; total: number }> {
  const conditions: string[] = [`status <> 'deleted'`];
  const params: unknown[] = [];

  if (filters.q) {
    params.push(`%${filters.q}%`);
    conditions.push(`(full_name ILIKE $${params.length} OR phone ILIKE $${params.length} OR email ILIKE $${params.length})`);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM customers ${whereClause}`,
    params
  );

  const limit = filters.pageSize;
  const offset = (filters.page - 1) * filters.pageSize;
  params.push(limit, offset);

  const rowsResult = await query<CustomerRow>(
    `SELECT id, full_name, phone, email, address, notes, status, created_at, updated_at
     FROM customers ${whereClause}
     ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { rows: rowsResult.rows, total: Number(countResult.rows[0]!.count) };
}

export async function updateCustomer(id: string, input: UpdateCustomerInput): Promise<CustomerRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];

  for (const [key, column] of [
    ["fullName", "full_name"],
    ["phone", "phone"],
    ["email", "email"],
    ["address", "address"],
    ["notes", "notes"],
  ] as const) {
    const value = input[key];
    if (value !== undefined) {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    }
  }

  if (sets.length === 0) {
    return getCustomerById(id);
  }

  sets.push(`updated_at = now()`);
  params.push(id);

  await query(`UPDATE customers SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
  return getCustomerById(id);
}

export async function archiveCustomer(id: string): Promise<CustomerRow | null> {
  await query(`UPDATE customers SET status = 'archived', updated_at = now() WHERE id = $1`, [id]);
  return getCustomerById(id);
}

export async function getFinancialSummary(customerId: string): Promise<CustomerFinancialSummary> {
  const result = await query<CustomerFinancialSummary>(
    `SELECT
       COALESCE(SUM(advance_payment), 0)::text AS total_paid,
       COALESCE(SUM(remaining_balance), 0)::text AS outstanding_balance,
       COUNT(*)::text AS booking_count
     FROM bookings WHERE customer_id = $1 AND status <> 'canceled'`,
    [customerId]
  );
  return result.rows[0]!;
}

export interface CustomerBookingRow {
  id: string;
  hall_id: string;
  event_type: string;
  event_date: Date;
  status: string;
  total_amount: string;
  remaining_balance: string;
}

export async function getCustomerBookings(customerId: string): Promise<CustomerBookingRow[]> {
  const result = await query<CustomerBookingRow>(
    `SELECT id, hall_id, event_type, event_date, status, total_amount, remaining_balance
     FROM bookings WHERE customer_id = $1 ORDER BY event_date DESC`,
    [customerId]
  );
  return result.rows;
}
