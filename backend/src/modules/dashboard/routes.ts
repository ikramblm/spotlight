import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import * as dashboardController from "./controller";

/** Aggregate KPI endpoint (architecture doc §8: "single round trip"). Every role can reach it -
 * which KPI blocks actually come back is driven by the requester's own finer-grained
 * permissions (calendar.*, booking_requests.view, confiscations.view, expenses.view), not a
 * role check here. */
export const dashboardRouter = Router();

dashboardRouter.use(authenticate);

dashboardRouter.get("/", requirePermission("dashboard.view"), asyncHandler(dashboardController.getDashboard));
