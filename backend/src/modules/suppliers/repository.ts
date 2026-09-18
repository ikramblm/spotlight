import { query } from "../../config/db";
import type { CreateSupplierInput, ListSuppliersQuery, UpdateSupplierInput } from "./schema";

export interface SupplierRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  products: string[];
  pricing_notes: string | null;
  notes: string | null;
  status: "active" | "archived" | "deleted";
  created_at: Date;
}

const COLUMNS = `id, name, phone, email, products, pricing_notes, notes, status, created_at`;

export async function insertSupplier(input: CreateSupplierInput): Promise<SupplierRow> {
  const result = await query<{ id: string }>(
    `INSERT INTO suppliers (name, phone, email, products, pricing_notes, notes)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [
      input.name,
      input.phone ?? null,
      input.email ?? null,
      JSON.stringify(input.products ?? []),
      input.pricingNotes ?? null,
      input.notes ?? null,
    ]
  );
  return getSupplierById(result.rows[0]!.id) as Promise<SupplierRow>;
}

export async function getSupplierById(id: string): Promise<SupplierRow | null> {
  const result = await query<SupplierRow>(`SELECT ${COLUMNS} FROM suppliers WHERE id = $1 AND status <> 'deleted'`, [
    id,
  ]);
  return result.rows[0] ?? null;
}

export async function listSuppliers(
  filters: ListSuppliersQuery
): Promise<{ rows: SupplierRow[]; total: number }> {
  const conditions: string[] = [`status <> 'deleted'`];
  const params: unknown[] = [];

  if (filters.q) {
    params.push(`%${filters.q}%`);
    conditions.push(`name ILIKE $${params.length}`);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM suppliers ${whereClause}`,
    params
  );

  const limit = filters.pageSize;
  const offset = (filters.page - 1) * filters.pageSize;
  params.push(limit, offset);

  const rowsResult = await query<SupplierRow>(
    `SELECT ${COLUMNS} FROM suppliers ${whereClause} ORDER BY name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { rows: rowsResult.rows, total: Number(countResult.rows[0]!.count) };
}

export async function updateSupplier(id: string, input: UpdateSupplierInput): Promise<SupplierRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];

  for (const [key, column, transform] of [
    ["name", "name", (v: unknown) => v],
    ["phone", "phone", (v: unknown) => v],
    ["email", "email", (v: unknown) => v],
    ["products", "products", (v: unknown) => JSON.stringify(v)],
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
    return getSupplierById(id);
  }

  params.push(id);
  await query(`UPDATE suppliers SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
  return getSupplierById(id);
}

export async function archiveSupplier(id: string): Promise<SupplierRow | null> {
  await query(`UPDATE suppliers SET status = 'archived' WHERE id = $1`, [id]);
  return getSupplierById(id);
}

export interface SupplierExpenseRow {
  id: string;
  amount: string;
  expense_date: string;
  category_name: string;
  description: string | null;
}

export async function getPurchaseHistory(supplierId: string): Promise<SupplierExpenseRow[]> {
  const result = await query<SupplierExpenseRow>(
    `SELECT e.id, e.amount, e.expense_date, c.name AS category_name, e.description
     FROM expenses e
     JOIN expense_categories c ON c.id = e.category_id
     WHERE e.supplier_id = $1
     ORDER BY e.expense_date DESC`,
    [supplierId]
  );
  return result.rows;
}

export interface SupplierEquipmentRow {
  id: string;
  name: string;
  category: string;
  quantity_total: number;
  quantity_available: number;
}

export async function getSuppliedEquipment(supplierId: string): Promise<SupplierEquipmentRow[]> {
  const result = await query<SupplierEquipmentRow>(
    `SELECT id, name, category, quantity_total, quantity_available
     FROM equipment WHERE supplier_id = $1 AND status <> 'deleted'
     ORDER BY name ASC`,
    [supplierId]
  );
  return result.rows;
}
