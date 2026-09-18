import { pool, query } from "../../config/db";
import type { CreateEquipmentInput, ListEquipmentQuery, UpdateEquipmentInput } from "./schema";

export interface EquipmentRow {
  id: string;
  name: string;
  category: string;
  quantity_total: number;
  quantity_available: number;
  condition: "good" | "needs_repair" | "retired";
  location: string | null;
  supplier_id: string | null;
  notes: string | null;
  status: "active" | "archived" | "deleted";
}

const COLUMNS = `id, name, category, quantity_total, quantity_available, condition, location, supplier_id, notes, status`;

export async function insertEquipment(input: CreateEquipmentInput): Promise<EquipmentRow> {
  const result = await query<{ id: string }>(
    `INSERT INTO equipment (name, category, quantity_total, quantity_available, condition, location, supplier_id, notes)
     VALUES ($1, $2, $3, $3, $4, $5, $6, $7) RETURNING id`,
    [
      input.name,
      input.category,
      input.quantityTotal,
      input.condition,
      input.location ?? null,
      input.supplierId ?? null,
      input.notes ?? null,
    ]
  );
  return getEquipmentById(result.rows[0]!.id) as Promise<EquipmentRow>;
}

export async function getEquipmentById(id: string): Promise<EquipmentRow | null> {
  const result = await query<EquipmentRow>(`SELECT ${COLUMNS} FROM equipment WHERE id = $1 AND status <> 'deleted'`, [
    id,
  ]);
  return result.rows[0] ?? null;
}

export async function listEquipment(
  filters: ListEquipmentQuery
): Promise<{ rows: EquipmentRow[]; total: number }> {
  const conditions: string[] = [`status <> 'deleted'`];
  const params: unknown[] = [];

  if (filters.q) {
    params.push(`%${filters.q}%`);
    conditions.push(`name ILIKE $${params.length}`);
  }
  if (filters.category) {
    params.push(filters.category);
    conditions.push(`category = $${params.length}`);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM equipment ${whereClause}`,
    params
  );

  const limit = filters.pageSize;
  const offset = (filters.page - 1) * filters.pageSize;
  params.push(limit, offset);

  const rowsResult = await query<EquipmentRow>(
    `SELECT ${COLUMNS} FROM equipment ${whereClause} ORDER BY category ASC, name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { rows: rowsResult.rows, total: Number(countResult.rows[0]!.count) };
}

export async function updateEquipment(id: string, input: UpdateEquipmentInput): Promise<EquipmentRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];

  for (const [key, column] of [
    ["name", "name"],
    ["category", "category"],
    ["quantityTotal", "quantity_total"],
    ["condition", "condition"],
    ["location", "location"],
    ["supplierId", "supplier_id"],
    ["notes", "notes"],
  ] as const) {
    const value = input[key];
    if (value !== undefined) {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    }
  }

  if (sets.length === 0) {
    return getEquipmentById(id);
  }

  params.push(id);
  await query(`UPDATE equipment SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
  return getEquipmentById(id);
}

export async function archiveEquipment(id: string): Promise<EquipmentRow | null> {
  await query(`UPDATE equipment SET status = 'archived' WHERE id = $1`, [id]);
  return getEquipmentById(id);
}

export interface AssignmentRow {
  id: string;
  equipment_id: string;
  booking_id: string;
  quantity: number;
  assigned_at: Date;
  returned_at: Date | null;
}

/** One transaction: check availability, decrement it, and insert the assignment row - the
 * CHECK constraint on equipment(quantity_available >= 0) is the final backstop against a race. */
export async function insertAssignment(input: {
  equipmentId: string;
  bookingId: string;
  quantity: number;
}): Promise<AssignmentRow> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const equipmentResult = await client.query<{ quantity_available: number }>(
      `SELECT quantity_available FROM equipment WHERE id = $1 FOR UPDATE`,
      [input.equipmentId]
    );
    const available = equipmentResult.rows[0]?.quantity_available;
    if (available === undefined) {
      throw new Error("EQUIPMENT_NOT_FOUND");
    }
    if (available < input.quantity) {
      throw new Error("INSUFFICIENT_QUANTITY");
    }

    await client.query(`UPDATE equipment SET quantity_available = quantity_available - $1 WHERE id = $2`, [
      input.quantity,
      input.equipmentId,
    ]);

    const result = await client.query<AssignmentRow>(
      `INSERT INTO equipment_assignments (equipment_id, booking_id, quantity)
       VALUES ($1, $2, $3)
       RETURNING id, equipment_id, booking_id, quantity, assigned_at, returned_at`,
      [input.equipmentId, input.bookingId, input.quantity]
    );

    await client.query("COMMIT");
    return result.rows[0]!;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getAssignmentById(id: string): Promise<AssignmentRow | null> {
  const result = await query<AssignmentRow>(
    `SELECT id, equipment_id, booking_id, quantity, assigned_at, returned_at FROM equipment_assignments WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function markAssignmentReturned(id: string, quantity: number, equipmentId: string): Promise<AssignmentRow> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(`UPDATE equipment_assignments SET returned_at = now() WHERE id = $1`, [id]);
    await client.query(`UPDATE equipment SET quantity_available = quantity_available + $1 WHERE id = $2`, [
      quantity,
      equipmentId,
    ]);

    const result = await client.query<AssignmentRow>(
      `SELECT id, equipment_id, booking_id, quantity, assigned_at, returned_at FROM equipment_assignments WHERE id = $1`,
      [id]
    );

    await client.query("COMMIT");
    return result.rows[0]!;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export interface AssignmentDetailRow extends AssignmentRow {
  event_type: string;
  event_date: string;
}

export async function listAssignmentsForEquipment(equipmentId: string): Promise<AssignmentDetailRow[]> {
  const result = await query<AssignmentDetailRow>(
    `SELECT ea.id, ea.equipment_id, ea.booking_id, ea.quantity, ea.assigned_at, ea.returned_at,
            b.event_type, b.event_date
     FROM equipment_assignments ea
     JOIN bookings b ON b.id = ea.booking_id
     WHERE ea.equipment_id = $1
     ORDER BY ea.assigned_at DESC`,
    [equipmentId]
  );
  return result.rows;
}
