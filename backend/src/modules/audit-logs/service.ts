import * as auditLogsRepo from "./repository";
import type { ListAuditLogsQuery } from "./schema";

export async function listAuditLogs(filters: ListAuditLogsQuery) {
  return auditLogsRepo.listAuditLogs(filters);
}
