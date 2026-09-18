import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import * as archivesController from "./controller";
import { listArchivesQuerySchema } from "./schema";

/** Read-only browsing of the append-only "what was archived, when, and why" trail (§20/§30 rule
 * #8). The actual archive action lives on each module's own /:id/archive endpoint - this is
 * just the audit view across all of them. */
export const archivesRouter = Router();

archivesRouter.use(authenticate);

archivesRouter.get(
  "/",
  requirePermission("archives.view"),
  validate({ query: listArchivesQuerySchema }),
  asyncHandler(archivesController.listArchives)
);
