import { pool, query } from "../../config/db";
import { venueDateExpr } from "../../lib/timezone";
import type { BookingServiceLine, ListBookingsQuery, UpdateBookingInput } from "./schema";

export interface BookingRow {
  id: string;
  source_request_id: string | null;
  customer_id: string;
  hall_id: string;
  event_type: string;
  event_date: string;
  start_time: Date;
  end_time: Date;
  guest_count: number | null;
  total_amount: string;
  advance_payment: string;
  remaining_balance: string;
  payment_status: "unpaid" | "partial" | "paid";
  status: "confirmed" | "completed" | "canceled";
  notes: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface BookingServiceRow {
  id: string;
  service_id: string;
  quantity: number;
  unit_price: string;
}

const COLUMNS = `id, source_request_id, customer_id, hall_id, event_type, event_date, start_time, end_time,
  guest_count, total_amount, advance_payment, remaining_balance, payment_status, status, notes,
  created_by, created_at, updated_at`;

export interface InsertBookingParams {
  customerId: string;
  hallId: string;
  eventType: string;
  startTime: Date;
  endTime: Date;
  guestCount?: number;
  totalAmount: number;
  advancePayment: number;
  notes?: string;
  services: BookingServiceLine[];
  createdBy: string;
  sourceRequestId?: string;
}

/** A single atomic transaction: the booking row (guarded by the DB's EXCLUDE constraint),
 * its service lines, and the creation history entry. */
export async function insertBooking(input: InsertBookingParams): Promise<BookingRow> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const bookingResult = await client.query<{ id: string }>(
      `INSERT INTO bookings
         (source_request_id, customer_id, hall_id, event_type, event_date, start_time, end_time,
          guest_count, total_amount, advance_payment, notes, created_by)
       VALUES ($1, $2, $3, $4, ${venueDateExpr("$5")}, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        input.sourceRequestId ?? null,
        input.customerId,
        input.hallId,
        input.eventType,
        input.startTime,
        input.endTime,
        input.guestCount ?? null,
        input.totalAmount,
        input.advancePayment,
        input.notes ?? null,
        input.createdBy,
      ]
    );
    const bookingId = bookingResult.rows[0]!.id;

    for (const line of input.services) {
      await client.query(
        `INSERT INTO booking_services (booking_id, service_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
        [bookingId, line.serviceId, line.quantity, line.unitPrice]
      );
    }

    await client.query(
      `INSERT INTO booking_history (booking_id, changed_by, change_type, after_data)
       VALUES ($1, $2, 'create', $3)`,
      [bookingId, input.createdBy, JSON.stringify({ status: "confirmed", totalAmount: input.totalAmount })]
    );

    // Every confirmed booking has exactly one operational event record (architecture doc
    // ERD: BOOKINGS ||--|| EVENTS), created here so guests/invitations/check-in (Phase 4+)
    // always have somewhere to attach.
    await client.query(`INSERT INTO events (booking_id) VALUES ($1)`, [bookingId]);

    await client.query("COMMIT");

    const result = await client.query<BookingRow>(`SELECT ${COLUMNS} FROM bookings WHERE id = $1`, [bookingId]);
    return result.rows[0]!;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getBookingById(id: string): Promise<BookingRow | null> {
  const result = await query<BookingRow>(`SELECT ${COLUMNS} FROM bookings WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

export async function getBookingServices(bookingId: string): Promise<BookingServiceRow[]> {
  const result = await query<BookingServiceRow>(
    `SELECT id, service_id, quantity, unit_price FROM booking_services WHERE booking_id = $1`,
    [bookingId]
  );
  return result.rows;
}

export async function listBookings(
  filters: ListBookingsQuery
): Promise<{ rows: BookingRow[]; total: number }> {
  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];

  if (filters.status) {
    params.push(filters.status);
    conditions.push(`status = $${params.length}`);
  }
  if (filters.hallId) {
    params.push(filters.hallId);
    conditions.push(`hall_id = $${params.length}`);
  }
  if (filters.customerId) {
    params.push(filters.customerId);
    conditions.push(`customer_id = $${params.length}`);
  }
  if (filters.from) {
    params.push(filters.from);
    conditions.push(`event_date >= ${venueDateExpr(`$${params.length}`)}`);
  }
  if (filters.to) {
    params.push(filters.to);
    conditions.push(`event_date <= ${venueDateExpr(`$${params.length}`)}`);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM bookings ${whereClause}`,
    params
  );

  const limit = filters.pageSize;
  const offset = (filters.page - 1) * filters.pageSize;
  params.push(limit, offset);

  const rowsResult = await query<BookingRow>(
    `SELECT ${COLUMNS} FROM bookings ${whereClause}
     ORDER BY start_time DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { rows: rowsResult.rows, total: Number(countResult.rows[0]!.count) };
}

export async function updateBookingFields(id: string, input: UpdateBookingInput): Promise<BookingRow> {
  const sets: string[] = [];
  const params: unknown[] = [];

  for (const [key, column] of [
    ["eventType", "event_type"],
    ["startTime", "start_time"],
    ["endTime", "end_time"],
    ["guestCount", "guest_count"],
    ["totalAmount", "total_amount"],
    ["notes", "notes"],
  ] as const) {
    const value = input[key];
    if (value !== undefined) {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    }
  }

  if (input.startTime !== undefined) {
    params.push(input.startTime);
    sets.push(`event_date = ${venueDateExpr(`$${params.length}`)}`);
  }

  sets.push("updated_at = now()");
  params.push(id);

  const result = await query<BookingRow>(
    `UPDATE bookings SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING ${COLUMNS}`,
    params
  );
  return result.rows[0]!;
}

export async function updatePayment(
  id: string,
  advancePayment: number,
  paymentStatus: "unpaid" | "partial" | "paid"
): Promise<BookingRow> {
  const result = await query<BookingRow>(
    `UPDATE bookings SET advance_payment = $1, payment_status = $2, updated_at = now()
     WHERE id = $3 RETURNING ${COLUMNS}`,
    [advancePayment, paymentStatus, id]
  );
  return result.rows[0]!;
}

/** Updates the booking's status and, when canceling, archives its linked event in the same
 * transaction - a canceled booking never happened, so its event record shouldn't stay active. */
export async function updateStatus(
  id: string,
  status: "confirmed" | "completed" | "canceled"
): Promise<BookingRow> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query<BookingRow>(
      `UPDATE bookings SET status = $1, updated_at = now() WHERE id = $2 RETURNING ${COLUMNS}`,
      [status, id]
    );

    if (status === "canceled") {
      await client.query(
        `UPDATE events SET status = 'archived' WHERE booking_id = $1 AND status = 'active'`,
        [id]
      );
    }

    await client.query("COMMIT");
    return result.rows[0]!;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getLinkedEventId(bookingId: string): Promise<string | null> {
  const result = await query<{ id: string }>(`SELECT id FROM events WHERE booking_id = $1`, [bookingId]);
  return result.rows[0]?.id ?? null;
}

export async function recordHistory(entry: {
  bookingId: string;
  changedBy: string;
  changeType: string;
  beforeData?: unknown;
  afterData?: unknown;
}): Promise<void> {
  await query(
    `INSERT INTO booking_history (booking_id, changed_by, change_type, before_data, after_data)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      entry.bookingId,
      entry.changedBy,
      entry.changeType,
      entry.beforeData !== undefined ? JSON.stringify(entry.beforeData) : null,
      entry.afterData !== undefined ? JSON.stringify(entry.afterData) : null,
    ]
  );
}
