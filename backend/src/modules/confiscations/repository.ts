import { pool, query } from "../../config/db";
import type { CreateConfiscationInput, ListConfiscationsQuery } from "./schema";

export interface ConfiscationRow {
  id: string;
  guest_id: string;
  guest_name: string;
  event_id: string;
  event_type: string;
  event_date: string;
  item_type: string;
  item_description: string | null;
  has_photo: boolean;
  storage_reference: string;
  deposited_by: string;
  deposited_by_name: string;
  deposited_at: Date;
  status: "holding" | "returned";
}

const COLUMNS = `
  c.id, c.guest_id, g.full_name AS guest_name, c.event_id, b.event_type, b.event_date,
  c.item_type, c.item_description, (c.photo_key IS NOT NULL) AS has_photo, c.storage_reference,
  c.deposited_by, u.full_name AS deposited_by_name, c.deposited_at, c.status
`;

const JOINS = `
  FROM confiscations c
  JOIN guests g ON g.id = c.guest_id
  JOIN events e ON e.id = c.event_id
  JOIN bookings b ON b.id = e.booking_id
  JOIN users u ON u.id = c.deposited_by
`;

export interface InsertConfiscationParams extends CreateConfiscationInput {
  eventId: string;
  photoKey: string | null;
  depositedBy: string;
}

export async function insertConfiscation(input: InsertConfiscationParams): Promise<ConfiscationRow> {
  const result = await query<{ id: string }>(
    `INSERT INTO confiscations (guest_id, event_id, item_type, item_description, photo_key, storage_reference, deposited_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      input.guestId,
      input.eventId,
      input.itemType,
      input.itemDescription ?? null,
      input.photoKey,
      input.storageReference,
      input.depositedBy,
    ]
  );
  return getConfiscationById(result.rows[0]!.id) as Promise<ConfiscationRow>;
}

export async function getConfiscationById(id: string): Promise<ConfiscationRow | null> {
  const result = await query<ConfiscationRow>(`SELECT ${COLUMNS} ${JOINS} WHERE c.id = $1`, [id]);
  return result.rows[0] ?? null;
}

export async function getPhotoKey(id: string): Promise<string | null> {
  const result = await query<{ photo_key: string | null }>(`SELECT photo_key FROM confiscations WHERE id = $1`, [id]);
  return result.rows[0]?.photo_key ?? null;
}

export async function listConfiscations(
  filters: ListConfiscationsQuery
): Promise<{ rows: ConfiscationRow[]; total: number }> {
  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];

  if (filters.eventId) {
    params.push(filters.eventId);
    conditions.push(`c.event_id = $${params.length}`);
  }
  if (filters.status) {
    params.push(filters.status);
    conditions.push(`c.status = $${params.length}`);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM confiscations c ${whereClause}`,
    params
  );

  const limit = filters.pageSize;
  const offset = (filters.page - 1) * filters.pageSize;
  params.push(limit, offset);

  const rowsResult = await query<ConfiscationRow>(
    `SELECT ${COLUMNS} ${JOINS} ${whereClause}
     ORDER BY c.deposited_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { rows: rowsResult.rows, total: Number(countResult.rows[0]!.count) };
}

export interface RestitutionRow {
  id: string;
  confiscation_id: string;
  returned_by: string;
  returned_to_note: string | null;
  returned_at: Date;
}

/** One transaction: the restitution record (its own uniqueness on confiscation_id is the real
 * guarantee against a duplicate return - spec §30 rule #7) and flipping the item to 'returned'. */
export async function insertRestitution(input: {
  confiscationId: string;
  returnedBy: string;
  returnedToNote?: string;
}): Promise<RestitutionRow> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query<RestitutionRow>(
      `INSERT INTO restitution_records (confiscation_id, returned_by, returned_to_note)
       VALUES ($1, $2, $3)
       RETURNING id, confiscation_id, returned_by, returned_to_note, returned_at`,
      [input.confiscationId, input.returnedBy, input.returnedToNote ?? null]
    );

    await client.query(`UPDATE confiscations SET status = 'returned' WHERE id = $1`, [input.confiscationId]);

    await client.query("COMMIT");
    return result.rows[0]!;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getRestitutionByConfiscationId(confiscationId: string): Promise<RestitutionRow | null> {
  const result = await query<RestitutionRow>(
    `SELECT id, confiscation_id, returned_by, returned_to_note, returned_at
     FROM restitution_records WHERE confiscation_id = $1`,
    [confiscationId]
  );
  return result.rows[0] ?? null;
}
