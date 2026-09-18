import { query } from "../../config/db";
import type { CreateCatererInput, ListCaterersQuery, UpdateCatererInput } from "./schema";

export interface CatererRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  services: string[];
  pricing_notes: string | null;
  notes: string | null;
  status: "active" | "archived" | "deleted";
  created_at: Date;
}

const COLUMNS = `id, name, phone, email, services, pricing_notes, notes, status, created_at`;

export async function insertCaterer(input: CreateCatererInput): Promise<CatererRow> {
  const result = await query<{ id: string }>(
    `INSERT INTO caterers (name, phone, email, services, pricing_notes, notes)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [
      input.name,
      input.phone ?? null,
      input.email ?? null,
      JSON.stringify(input.services ?? []),
      input.pricingNotes ?? null,
      input.notes ?? null,
    ]
  );
  return getCatererById(result.rows[0]!.id) as Promise<CatererRow>;
}

export async function getCatererById(id: string): Promise<CatererRow | null> {
  const result = await query<CatererRow>(`SELECT ${COLUMNS} FROM caterers WHERE id = $1 AND status <> 'deleted'`, [
    id,
  ]);
  return result.rows[0] ?? null;
}

export async function listCaterers(
  filters: ListCaterersQuery
): Promise<{ rows: CatererRow[]; total: number }> {
  const conditions: string[] = [`status <> 'deleted'`];
  const params: unknown[] = [];

  if (filters.q) {
    params.push(`%${filters.q}%`);
    conditions.push(`name ILIKE $${params.length}`);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM caterers ${whereClause}`,
    params
  );

  const limit = filters.pageSize;
  const offset = (filters.page - 1) * filters.pageSize;
  params.push(limit, offset);

  const rowsResult = await query<CatererRow>(
    `SELECT ${COLUMNS} FROM caterers ${whereClause} ORDER BY name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { rows: rowsResult.rows, total: Number(countResult.rows[0]!.count) };
}

export async function updateCaterer(id: string, input: UpdateCatererInput): Promise<CatererRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];

  for (const [key, column, transform] of [
    ["name", "name", (v: unknown) => v],
    ["phone", "phone", (v: unknown) => v],
    ["email", "email", (v: unknown) => v],
    ["services", "services", (v: unknown) => JSON.stringify(v)],
    ["pricingNotes", "pricing_notes", (v: unknown) => v],
    ["notes", "notes", (v: unknown) => v],
  ] as const) {
    const value = input[key];
    if (value !== undefined) {
      params.push(transform(value));
      sets.push(`${column} = $${params.length}`);
    }
  }

  if (sets.length === 0) {
    return getCatererById(id);
  }

  params.push(id);
  await query(`UPDATE caterers SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
  return getCatererById(id);
}

export async function archiveCaterer(id: string): Promise<CatererRow | null> {
  await query(`UPDATE caterers SET status = 'archived' WHERE id = $1`, [id]);
  return getCatererById(id);
}

export interface AssignedBookingRow {
  booking_id: string;
  event_type: string;
  event_date: string;
  customer_name: string;
  assigned_at: Date;
}

export async function getAssignedBookings(catererId: string): Promise<AssignedBookingRow[]> {
  const result = await query<AssignedBookingRow>(
    `SELECT bc.booking_id, b.event_type, b.event_date, c.full_name AS customer_name, bc.assigned_at
     FROM booking_caterers bc
     JOIN bookings b ON b.id = bc.booking_id
     JOIN customers c ON c.id = b.customer_id
     WHERE bc.caterer_id = $1
     ORDER BY b.event_date DESC`,
    [catererId]
  );
  return result.rows;
}

export async function assignToBooking(catererId: string, bookingId: string): Promise<void> {
  await query(
    `INSERT INTO booking_caterers (booking_id, caterer_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [bookingId, catererId]
  );
}

export async function unassignFromBooking(catererId: string, bookingId: string): Promise<void> {
  await query(`DELETE FROM booking_caterers WHERE booking_id = $1 AND caterer_id = $2`, [bookingId, catererId]);
}
