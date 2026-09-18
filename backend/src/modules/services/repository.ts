import { query } from "../../config/db";
import type { CreateServiceInput, ListServicesQuery, UpdateServiceInput } from "./schema";

export interface ServiceRow {
  id: string;
  name: string;
  category: string;
  default_price: string;
  description: string | null;
  status: "active" | "archived" | "deleted";
}

export async function insertService(input: CreateServiceInput): Promise<ServiceRow> {
  const result = await query<{ id: string }>(
    `INSERT INTO services (name, category, default_price, description) VALUES ($1, $2, $3, $4) RETURNING id`,
    [input.name, input.category, input.defaultPrice, input.description ?? null]
  );
  return getServiceById(result.rows[0]!.id) as Promise<ServiceRow>;
}

export async function getServiceById(id: string): Promise<ServiceRow | null> {
  const result = await query<ServiceRow>(
    `SELECT id, name, category, default_price, description, status FROM services WHERE id = $1 AND status <> 'deleted'`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function listServices(
  filters: ListServicesQuery
): Promise<{ rows: ServiceRow[]; total: number }> {
  const conditions: string[] = [`status <> 'deleted'`];
  const params: unknown[] = [];

  if (filters.category) {
    params.push(filters.category);
    conditions.push(`category = $${params.length}`);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM services ${whereClause}`,
    params
  );

  const limit = filters.pageSize;
  const offset = (filters.page - 1) * filters.pageSize;
  params.push(limit, offset);

  const rowsResult = await query<ServiceRow>(
    `SELECT id, name, category, default_price, description, status FROM services ${whereClause}
     ORDER BY category ASC, name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { rows: rowsResult.rows, total: Number(countResult.rows[0]!.count) };
}

export async function updateService(id: string, input: UpdateServiceInput): Promise<ServiceRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];

  for (const [key, column] of [
    ["name", "name"],
    ["category", "category"],
    ["defaultPrice", "default_price"],
    ["description", "description"],
  ] as const) {
    const value = input[key];
    if (value !== undefined) {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    }
  }

  if (sets.length === 0) {
    return getServiceById(id);
  }

  params.push(id);
  await query(`UPDATE services SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
  return getServiceById(id);
}

export async function archiveService(id: string): Promise<ServiceRow | null> {
  await query(`UPDATE services SET status = 'archived' WHERE id = $1`, [id]);
  return getServiceById(id);
}
