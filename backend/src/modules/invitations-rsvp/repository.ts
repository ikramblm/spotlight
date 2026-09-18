import { pool, query } from "../../config/db";

export interface InvitationRow {
  id: string;
  guest_id: string;
  event_id: string;
  public_token: string;
  sent_at: Date | null;
  created_at: Date;
}

export interface RsvpRow {
  id: string;
  invitation_id: string;
  status: "pending" | "accepted" | "declined";
  responded_at: Date | null;
  party_size: number | null;
  message: string | null;
}

export async function guestHasInvitation(guestId: string): Promise<boolean> {
  const result = await query(`SELECT 1 FROM invitations WHERE guest_id = $1`, [guestId]);
  return (result.rowCount ?? 0) > 0;
}

/** One transaction: the invitation row plus its pending RSVP row, so every invitation always
 * has exactly one RSVP to update rather than the public endpoint needing to create one. */
export async function insertInvitation(
  guestId: string,
  eventId: string,
  publicToken: string
): Promise<InvitationRow> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query<InvitationRow>(
      `INSERT INTO invitations (guest_id, event_id, public_token) VALUES ($1, $2, $3)
       RETURNING id, guest_id, event_id, public_token, sent_at, created_at`,
      [guestId, eventId, publicToken]
    );
    const invitation = result.rows[0]!;

    await client.query(`INSERT INTO rsvps (invitation_id, status) VALUES ($1, 'pending')`, [invitation.id]);

    await client.query("COMMIT");
    return invitation;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getInvitationById(id: string): Promise<InvitationRow | null> {
  const result = await query<InvitationRow>(
    `SELECT id, guest_id, event_id, public_token, sent_at, created_at FROM invitations WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function getInvitationByToken(token: string): Promise<InvitationRow | null> {
  const result = await query<InvitationRow>(
    `SELECT id, guest_id, event_id, public_token, sent_at, created_at FROM invitations WHERE public_token = $1`,
    [token]
  );
  return result.rows[0] ?? null;
}

export async function markSent(id: string): Promise<InvitationRow> {
  const result = await query<InvitationRow>(
    `UPDATE invitations SET sent_at = now() WHERE id = $1
     RETURNING id, guest_id, event_id, public_token, sent_at, created_at`,
    [id]
  );
  return result.rows[0]!;
}

export async function getRsvpByInvitationId(invitationId: string): Promise<RsvpRow | null> {
  const result = await query<RsvpRow>(
    `SELECT id, invitation_id, status, responded_at, party_size, message FROM rsvps WHERE invitation_id = $1`,
    [invitationId]
  );
  return result.rows[0] ?? null;
}

export async function updateRsvp(
  invitationId: string,
  input: { status: "accepted" | "declined"; partySize?: number; message?: string }
): Promise<RsvpRow> {
  const result = await query<RsvpRow>(
    `UPDATE rsvps SET status = $1, party_size = $2, message = $3, responded_at = now()
     WHERE invitation_id = $4
     RETURNING id, invitation_id, status, responded_at, party_size, message`,
    [input.status, input.partySize ?? null, input.message ?? null, invitationId]
  );
  return result.rows[0]!;
}

export interface PublicInvitationView {
  invitation_id: string;
  public_token: string;
  guest_name: string;
  event_type: string;
  event_date: string;
  start_time: Date;
  hall_name: string;
  rsvp_status: "pending" | "accepted" | "declined";
  party_size: number | null;
}

export async function getPublicInvitationView(token: string): Promise<PublicInvitationView | null> {
  const result = await query<PublicInvitationView>(
    `SELECT
       i.id AS invitation_id, i.public_token, g.full_name AS guest_name,
       b.event_type, b.event_date, b.start_time, h.name AS hall_name,
       r.status AS rsvp_status, r.party_size
     FROM invitations i
     JOIN guests g ON g.id = i.guest_id
     JOIN events e ON e.id = i.event_id
     JOIN bookings b ON b.id = e.booking_id
     JOIN halls h ON h.id = b.hall_id
     JOIN rsvps r ON r.invitation_id = i.id
     WHERE i.public_token = $1`,
    [token]
  );
  return result.rows[0] ?? null;
}
