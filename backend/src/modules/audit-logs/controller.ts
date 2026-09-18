import type { Request, Response } from "express";
import * as auditLogsService from "./service";
import type { ListAuditLogsQuery } from "./schema";

export async function listAuditLogs(req: Request, res: Response) {
  const filters = req.query as unknown as ListAuditLogsQuery;
  const { rows, total } = await auditLogsService.listAuditLogs(filters);
  res.status(200).json({ data: rows, meta: { page: filters.page, pageSize: filters.pageSize, total } });
}
