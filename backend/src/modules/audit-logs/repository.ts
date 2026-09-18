import { query } from "../../config/db";
import { venueDateExpr } from "../../lib/timezone";
import type { ListAuditLogsQuery } from "./schema";

export interface AuditLogRow {
  id: string;
  user_id: string | null;
  user_name: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  ip_address: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
}

export async function listAuditLogs(filters: ListAuditLogsQuery): Promise<{ rows: AuditLogRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.userId) {
    params.push(filters.userId);
    conditions.push(`a.user_id = $${params.length}`);
  }
  if (filters.action) {
    params.push(filters.action);
    conditions.push(`a.action = $${params.length}`);
  }
  if (filters.entityType) {
    params.push(filters.entityType);
    conditions.push(`a.entity_type = $${params.length}`);
  }
  if (filters.from) {
    params.push(filters.from);
    conditions.push(`${venueDateExpr("a.created_at")} >= $${params.length}`);
  }
  if (filters.to) {
    params.push(filters.to);
    conditions.push(`${venueDateExpr("a.created_at")} <= $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM audit_logs a ${whereClause}`,
    params
  );

  const limit = filters.pageSize;
  const offset = (filters.page - 1) * filters.pageSize;
  params.push(limit, offset);

  const rowsResult = await query<AuditLogRow>(
    `SELECT a.id, a.user_id, u.full_name AS user_name, a.action, a.entity_type, a.entity_id,
            a.ip_address, a.metadata, a.created_at
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.user_id
     ${whereClause}
     ORDER BY a.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { rows: rowsResult.rows, total: Number(countResult.rows[0]!.count) };
}
