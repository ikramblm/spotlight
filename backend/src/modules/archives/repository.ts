import { query } from "../../config/db";
import type { ListArchivesQuery } from "./schema";

export interface ArchiveRow {
  id: string;
  entity_type: string;
  entity_id: string;
  reason: string | null;
  archived_by: string;
  archived_by_name: string;
  archived_at: Date;
}

export async function listArchives(filters: ListArchivesQuery): Promise<{ rows: ArchiveRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.entityType) {
    params.push(filters.entityType);
    conditions.push(`a.entity_type = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM archives a ${whereClause}`,
    params
  );

  const limit = filters.pageSize;
  const offset = (filters.page - 1) * filters.pageSize;
  params.push(limit, offset);

  const rowsResult = await query<ArchiveRow>(
    `SELECT a.id, a.entity_type, a.entity_id, a.reason, a.archived_by, u.full_name AS archived_by_name, a.archived_at
     FROM archives a
     JOIN users u ON u.id = a.archived_by
     ${whereClause}
     ORDER BY a.archived_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { rows: rowsResult.rows, total: Number(countResult.rows[0]!.count) };
}
