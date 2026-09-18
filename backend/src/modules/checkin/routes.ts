import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import * as checkinController from "./controller";
import { eventIdParamsSchema, guestIdParamsSchema, scanSchema } from "./schema";

export const checkinRouter = Router();

checkinRouter.use(authenticate);

checkinRouter.post(
  "/scan",
  requirePermission("checkin.scan"),
  validate({ body: scanSchema }),
  asyncHandler(checkinController.scan)
);

// Only Business Owner and Security Staff hold checkin.override (matrix §6: "F" on QR
// check-in) - the explicit, audited escape hatch for spec §30 rule #5.
checkinRouter.post(
  "/override",
  requirePermission("checkin.override"),
  validate({ body: scanSchema }),
  asyncHandler(checkinController.override)
);

checkinRouter.post(
  "/guest/:guestId",
  requirePermission("checkin.scan"),
  validate({ params: guestIdParamsSchema }),
  asyncHandler(checkinController.checkinByGuestId)
);

checkinRouter.get(
  "/event/:eventId",
  requirePermission("checkin.view"),
  validate({ params: eventIdParamsSchema }),
  asyncHandler(checkinController.listCheckinsForEvent)
);
