import { query } from "../../config/db";
import { VENUE_TIMEZONE } from "../../lib/timezone";

export interface ResolvedInvitation {
  invitation_id: string;
  guest_id: string;
  guest_name: string;
  event_id: string;
  booking_status: "confirmed" | "completed" | "canceled";
  rsvp_status: "pending" | "accepted" | "declined";
  is_today: boolean;
}

const RESOLVE_COLUMNS = `
  i.id AS invitation_id, g.id AS guest_id, g.full_name AS guest_name, i.event_id,
  b.status AS booking_status, r.status AS rsvp_status,
  (b.event_date = (now() AT TIME ZONE '${VENUE_TIMEZONE}')::date) AS is_today
`;

const RESOLVE_JOINS = `
  FROM invitations i
  JOIN guests g ON g.id = i.guest_id
  JOIN events e ON e.id = i.event_id
  JOIN bookings b ON b.id = e.booking_id
  JOIN rsvps r ON r.invitation_id = i.id
`;

export async function resolveByToken(token: string): Promise<ResolvedInvitation | null> {
  const result = await query<ResolvedInvitation>(
    `SELECT ${RESOLVE_COLUMNS} ${RESOLVE_JOINS} WHERE i.public_token = $1`,
    [token]
  );
  return result.rows[0] ?? null;
}

export async function resolveByGuestId(guestId: string): Promise<ResolvedInvitation | null> {
  const result = await query<ResolvedInvitation>(
    `SELECT ${RESOLVE_COLUMNS} ${RESOLVE_JOINS} WHERE g.id = $1`,
    [guestId]
  );
  return result.rows[0] ?? null;
}

export async function hasGrantedCheckin(invitationId: string): Promise<boolean> {
  const result = await query(
    `SELECT 1 FROM check_ins WHERE invitation_id = $1 AND access_result = 'granted'`,
    [invitationId]
  );
  return (result.rowCount ?? 0) > 0;
}

export interface CheckinRow {
  id: string;
  invitation_id: string;
  guest_id: string;
  event_id: string;
  checked_in_by: string;
  checked_in_at: Date;
  access_result: string;
}

export async function insertCheckin(input: {
  invitationId: string;
  guestId: string;
  eventId: string;
  checkedInBy: string;
  accessResult: string;
}): Promise<CheckinRow> {
  const result = await query<CheckinRow>(
    `INSERT INTO check_ins (invitation_id, guest_id, event_id, checked_in_by, access_result)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, invitation_id, guest_id, event_id, checked_in_by, checked_in_at, access_result`,
    [input.invitationId, input.guestId, input.eventId, input.checkedInBy, input.accessResult]
  );
  return result.rows[0]!;
}

export interface CheckinListRow extends CheckinRow {
  guest_name: string;
  checked_in_by_name: string;
}

export async function listByEvent(eventId: string): Promise<CheckinListRow[]> {
  const result = await query<CheckinListRow>(
    `SELECT c.id, c.invitation_id, c.guest_id, c.event_id, c.checked_in_by, c.checked_in_at, c.access_result,
            g.full_name AS guest_name, u.full_name AS checked_in_by_name
     FROM check_ins c
     JOIN guests g ON g.id = c.guest_id
     JOIN users u ON u.id = c.checked_in_by
     WHERE c.event_id = $1
     ORDER BY c.checked_in_at DESC`,
    [eventId]
  );
  return result.rows;
}
