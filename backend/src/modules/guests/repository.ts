import { query, withTransaction } from "../../config/db";
import type { CreateGuestInput, ListGuestsQuery, UpdateGuestInput } from "./schema";

export interface GuestRow {
  id: string;
  event_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: Date;
  invitation_id: string | null;
  public_token: string | null;
  sent_at: Date | null;
  rsvp_status: "pending" | "accepted" | "declined" | null;
  checked_in: boolean;
}

const GUEST_COLUMNS = `
  g.id, g.event_id, g.full_name, g.phone, g.email, g.notes, g.created_at,
  i.id AS invitation_id, i.public_token, i.sent_at, r.status AS rsvp_status,
  EXISTS(
    SELECT 1 FROM check_ins c WHERE c.guest_id = g.id AND c.access_result IN ('granted', 'override')
  ) AS checked_in
`;

const GUEST_JOINS = `
  FROM guests g
  LEFT JOIN invitations i ON i.guest_id = g.id
  LEFT JOIN rsvps r ON r.invitation_id = i.id
`;

export async function insertGuest(
  eventId: string,
  input: CreateGuestInput
): Promise<GuestRow> {
  const result = await query<{ id: string }>(
    `INSERT INTO guests (event_id, full_name, phone, email, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [eventId, input.fullName, input.phone ?? null, input.email ?? null, input.notes ?? null]
  );
  return getGuestById(result.rows[0]!.id) as Promise<GuestRow>;
}

export interface BulkGuestRow {
  fullName: string;
  phone?: string;
  email?: string;
}

/** All-or-nothing: a CSV that fails partway through (e.g. a row that somehow violates a
 * constraint) shouldn't leave the event with a silently incomplete guest list. */
export async function bulkInsertGuests(eventId: string, rows: BulkGuestRow[]): Promise<number> {
  return withTransaction(async (client) => {
    for (const row of rows) {
      await client.query(`INSERT INTO guests (event_id, full_name, phone, email) VALUES ($1, $2, $3, $4)`, [
        eventId,
        row.fullName,
        row.phone ?? null,
        row.email ?? null,
      ]);
    }
    return rows.length;
  });
}

export async function getGuestById(id: string): Promise<GuestRow | null> {
  const result = await query<GuestRow>(`SELECT ${GUEST_COLUMNS} ${GUEST_JOINS} WHERE g.id = $1`, [id]);
  return result.rows[0] ?? null;
}

export async function listGuestsByEvent(
  eventId: string,
  filters: ListGuestsQuery
): Promise<{ rows: GuestRow[]; total: number }> {
  const conditions = ["g.event_id = $1"];
  const params: unknown[] = [eventId];

  if (filters.q) {
    params.push(`%${filters.q}%`);
    conditions.push(`(g.full_name ILIKE $${params.length} OR g.phone ILIKE $${params.length} OR g.email ILIKE $${params.length})`);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM guests g ${whereClause}`,
    params
  );

  const limit = filters.pageSize;
  const offset = (filters.page - 1) * filters.pageSize;
  params.push(limit, offset);

  const rowsResult = await query<GuestRow>(
    `SELECT ${GUEST_COLUMNS} ${GUEST_JOINS}
     ${whereClause}
     ORDER BY g.full_name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { rows: rowsResult.rows, total: Number(countResult.rows[0]!.count) };
}

export async function listGuestsForExport(eventId: string): Promise<GuestRow[]> {
  const result = await query<GuestRow>(
    `SELECT ${GUEST_COLUMNS} ${GUEST_JOINS} WHERE g.event_id = $1 ORDER BY g.full_name ASC`,
    [eventId]
  );
  return result.rows;
}

export async function updateGuest(id: string, input: UpdateGuestInput): Promise<GuestRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];

  for (const [key, column] of [
    ["fullName", "full_name"],
    ["phone", "phone"],
    ["email", "email"],
    ["notes", "notes"],
  ] as const) {
    const value = input[key];
    if (value !== undefined) {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    }
  }

  if (sets.length === 0) {
    return getGuestById(id);
  }

  params.push(id);
  await query(`UPDATE guests SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
  return getGuestById(id);
}

export interface AttendanceStats {
  total_guests: string;
  invited: string;
  rsvp_accepted: string;
  rsvp_declined: string;
  rsvp_pending: string;
  checked_in: string;
}

export async function getAttendanceStats(eventId: string): Promise<AttendanceStats> {
  const result = await query<AttendanceStats>(
    `SELECT
       COUNT(DISTINCT g.id)::text AS total_guests,
       COUNT(DISTINCT i.id)::text AS invited,
       COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'accepted')::text AS rsvp_accepted,
       COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'declined')::text AS rsvp_declined,
       COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'pending')::text AS rsvp_pending,
       COUNT(DISTINCT c.guest_id) FILTER (WHERE c.access_result IN ('granted', 'override'))::text AS checked_in
     FROM guests g
     LEFT JOIN invitations i ON i.guest_id = g.id
     LEFT JOIN rsvps r ON r.invitation_id = i.id
     LEFT JOIN check_ins c ON c.guest_id = g.id
     WHERE g.event_id = $1`,
    [eventId]
  );
  return result.rows[0]!;
}
