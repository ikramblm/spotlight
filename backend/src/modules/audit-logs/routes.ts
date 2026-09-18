import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import * as auditLogsController from "./controller";
import { listAuditLogsQuerySchema } from "./schema";

/** Read-only view of the security audit trail every phase has been writing to since Phase 1
 * (src/lib/audit.ts). Owner-only (architecture doc §4: "owner-only, read-only"). */
export const auditLogsRouter = Router();

auditLogsRouter.use(authenticate);

auditLogsRouter.get(
  "/",
  requirePermission("audit_logs.view"),
  validate({ query: listAuditLogsQuerySchema }),
  asyncHandler(auditLogsController.listAuditLogs)
);
