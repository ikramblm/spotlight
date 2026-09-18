import { query } from "../../config/db";
import { venueDateExpr, VENUE_TIMEZONE } from "../../lib/timezone";

export interface CalendarEntryRow {
  booking_id: string;
  event_id: string;
  hall_id: string;
  hall_name: string;
  customer_id: string;
  customer_name: string;
  event_type: string;
  event_date: string;
  start_time: Date;
  end_time: Date;
  status: "confirmed" | "completed" | "canceled";
  guest_count: number | null;
  total_amount: string;
  remaining_balance: string;
}

const CALENDAR_COLUMNS = `
  b.id AS booking_id, e.id AS event_id, b.hall_id, h.name AS hall_name,
  b.customer_id, c.full_name AS customer_name, b.event_type, b.event_date,
  b.start_time, b.end_time, b.status, b.guest_count, b.total_amount, b.remaining_balance
`;

const CALENDAR_FROM = `
  FROM bookings b
  JOIN events e ON e.booking_id = b.id
  JOIN halls h ON h.id = b.hall_id
  JOIN customers c ON c.id = b.customer_id
`;

export async function listCalendarEntries(filters: {
  from: Date;
  to: Date;
  hallId?: string;
  status?: string;
}): Promise<CalendarEntryRow[]> {
  const conditions = [`b.event_date >= ${venueDateExpr("$1")}`, `b.event_date <= ${venueDateExpr("$2")}`];
  const params: unknown[] = [filters.from, filters.to];

  if (filters.hallId) {
    params.push(filters.hallId);
    conditions.push(`b.hall_id = $${params.length}`);
  }
  if (filters.status) {
    params.push(filters.status);
    conditions.push(`b.status = $${params.length}`);
  }

  const result = await query<CalendarEntryRow>(
    `SELECT ${CALENDAR_COLUMNS} ${CALENDAR_FROM}
     WHERE ${conditions.join(" AND ")}
     ORDER BY b.start_time ASC`,
    params
  );
  return result.rows;
}

/** "Today" is computed in the venue's own timezone, not the server's - a booking that starts
 * at 23:00 local time shouldn't fall off Security Staff's check-in list because the server
 * runs in UTC. Algeria uses a single fixed offset (Africa/Algiers, no DST since 1981) - the
 * same constant event_date itself is derived from, so the two never disagree near midnight UTC. */
export async function listTodayEntries(hallId?: string): Promise<CalendarEntryRow[]> {
  const conditions = [`b.event_date = (now() AT TIME ZONE '${VENUE_TIMEZONE}')::date`];
  const params: unknown[] = [];

  if (hallId) {
    params.push(hallId);
    conditions.push(`b.hall_id = $${params.length}`);
  }

  const result = await query<CalendarEntryRow>(
    `SELECT ${CALENDAR_COLUMNS} ${CALENDAR_FROM}
     WHERE ${conditions.join(" AND ")}
     ORDER BY b.start_time ASC`,
    params
  );
  return result.rows;
}
