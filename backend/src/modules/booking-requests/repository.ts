import { query } from "../../config/db";
import { venueDateExpr } from "../../lib/timezone";
import type { CreateBookingRequestInput, ListBookingRequestsQuery } from "./schema";

export interface BookingRequestRow {
  id: string;
  customer_id: string;
  hall_id: string;
  event_type: string;
  event_date: string;
  start_time: Date;
  end_time: Date;
  requested_services: string[];
  notes: string | null;
  status: "pending" | "approved" | "rejected" | "canceled";
  decided_by: string | null;
  decided_at: Date | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

const COLUMNS = `id, customer_id, hall_id, event_type, event_date, start_time, end_time,
  requested_services, notes, status, decided_by, decided_at, created_by, created_at, updated_at`;

export async function insertBookingRequest(
  input: CreateBookingRequestInput & { createdBy: string }
): Promise<BookingRequestRow> {
  const result = await query<{ id: string }>(
    `INSERT INTO booking_requests
       (customer_id, hall_id, event_type, event_date, start_time, end_time, requested_services, notes, created_by)
     VALUES ($1, $2, $3, ${venueDateExpr("$4")}, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      input.customerId,
      input.hallId,
      input.eventType,
      input.startTime,
      input.endTime,
      JSON.stringify(input.requestedServices ?? []),
      input.notes ?? null,
      input.createdBy,
    ]
  );
  return getBookingRequestById(result.rows[0]!.id) as Promise<BookingRequestRow>;
}

export async function getBookingRequestById(id: string): Promise<BookingRequestRow | null> {
  const result = await query<BookingRequestRow>(`SELECT ${COLUMNS} FROM booking_requests WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

export async function listBookingRequests(
  filters: ListBookingRequestsQuery
): Promise<{ rows: BookingRequestRow[]; total: number }> {
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

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM booking_requests ${whereClause}`,
    params
  );

  const limit = filters.pageSize;
  const offset = (filters.page - 1) * filters.pageSize;
  params.push(limit, offset);

  const rowsResult = await query<BookingRequestRow>(
    `SELECT ${COLUMNS} FROM booking_requests ${whereClause}
     ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { rows: rowsResult.rows, total: Number(countResult.rows[0]!.count) };
}

export async function setDecision(
  id: string,
  status: "approved" | "rejected",
  decidedBy: string
): Promise<BookingRequestRow> {
  const result = await query<BookingRequestRow>(
    `UPDATE booking_requests SET status = $1, decided_by = $2, decided_at = now(), updated_at = now()
     WHERE id = $3 RETURNING ${COLUMNS}`,
    [status, decidedBy, id]
  );
  return result.rows[0]!;
}

export async function setCanceled(id: string): Promise<BookingRequestRow> {
  const result = await query<BookingRequestRow>(
    `UPDATE booking_requests SET status = 'canceled', updated_at = now() WHERE id = $1 RETURNING ${COLUMNS}`,
    [id]
  );
  return result.rows[0]!;
}

export async function hasLinkedBooking(bookingRequestId: string): Promise<boolean> {
  const result = await query(`SELECT 1 FROM bookings WHERE source_request_id = $1`, [bookingRequestId]);
  return (result.rowCount ?? 0) > 0;
}
