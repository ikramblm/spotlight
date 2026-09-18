import { query } from "../../config/db";
import type { CreateHallInput, ListHallsQuery, UpdateHallInput } from "./schema";

export interface HallRow {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  location: string | null;
  base_price: string;
  features: string[];
  is_available: boolean;
  status: "active" | "archived" | "deleted";
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

const COLUMNS = `id, name, description, capacity, location, base_price, features, is_available, status, notes, created_at, updated_at`;

export async function insertHall(input: CreateHallInput): Promise<HallRow> {
  const result = await query<{ id: string }>(
    `INSERT INTO halls (name, description, capacity, location, base_price, features, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [
      input.name,
      input.description ?? null,
      input.capacity,
      input.location ?? null,
      input.basePrice,
      JSON.stringify(input.features ?? []),
      input.notes ?? null,
    ]
  );
  return getHallById(result.rows[0]!.id) as Promise<HallRow>;
}

export async function getHallById(id: string): Promise<HallRow | null> {
  const result = await query<HallRow>(
    `SELECT ${COLUMNS} FROM halls WHERE id = $1 AND status <> 'deleted'`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function listHalls(filters: ListHallsQuery): Promise<{ rows: HallRow[]; total: number }> {
  const conditions: string[] = [`status <> 'deleted'`];
  const params: unknown[] = [];

  if (filters.q) {
    params.push(`%${filters.q}%`);
    conditions.push(`name ILIKE $${params.length}`);
  }
  if (filters.availableOnly) {
    conditions.push(`is_available = true AND status = 'active'`);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM halls ${whereClause}`,
    params
  );

  const limit = filters.pageSize;
  const offset = (filters.page - 1) * filters.pageSize;
  params.push(limit, offset);

  const rowsResult = await query<HallRow>(
    `SELECT ${COLUMNS} FROM halls ${whereClause} ORDER BY name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { rows: rowsResult.rows, total: Number(countResult.rows[0]!.count) };
}

export async function updateHall(id: string, input: UpdateHallInput): Promise<HallRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];

  const mapping: [keyof UpdateHallInput, string, (v: unknown) => unknown][] = [
    ["name", "name", (v) => v],
    ["description", "description", (v) => v],
    ["capacity", "capacity", (v) => v],
    ["location", "location", (v) => v],
    ["basePrice", "base_price", (v) => v],
    ["features", "features", (v) => JSON.stringify(v)],
    ["notes", "notes", (v) => v],
    ["isAvailable", "is_available", (v) => v],
  ];

  for (const [key, column, transform] of mapping) {
    const value = input[key];
    if (value !== undefined) {
      params.push(transform(value));
      sets.push(`${column} = $${params.length}`);
    }
  }

  if (sets.length === 0) {
    return getHallById(id);
  }

  sets.push(`updated_at = now()`);
  params.push(id);

  await query(`UPDATE halls SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
  return getHallById(id);
}

export async function archiveHall(id: string): Promise<HallRow | null> {
  await query(`UPDATE halls SET status = 'archived', updated_at = now() WHERE id = $1`, [id]);
  return getHallById(id);
}

export interface HallBookingRow {
  id: string;
  event_type: string;
  event_date: Date;
  start_time: Date;
  end_time: Date;
  status: string;
  customer_id: string;
}

/** Confirmed bookings overlapping [from, to) - used both for the friendly pre-check and for
 * showing a hall's upcoming bookings. */
export async function findOverlappingBookings(
  hallId: string,
  from: Date,
  to: Date,
  excludeBookingId?: string
): Promise<HallBookingRow[]> {
  const params: unknown[] = [hallId, from, to];
  let sql = `
    SELECT id, event_type, event_date, start_time, end_time, status, customer_id
    FROM bookings
    WHERE hall_id = $1 AND status = 'confirmed'
      AND tsrange(start_time, end_time) && tsrange($2::timestamptz, $3::timestamptz)
  `;
  if (excludeBookingId) {
    params.push(excludeBookingId);
    sql += ` AND id <> $${params.length}`;
  }
  const result = await query<HallBookingRow>(sql, params);
  return result.rows;
}

export async function getUpcomingBookings(hallId: string): Promise<HallBookingRow[]> {
  const result = await query<HallBookingRow>(
    `SELECT id, event_type, event_date, start_time, end_time, status, customer_id
     FROM bookings
     WHERE hall_id = $1 AND status = 'confirmed' AND end_time > now()
     ORDER BY start_time ASC`,
    [hallId]
  );
  return result.rows;
}
