import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import * as guestsController from "./controller";
import {
  createGuestSchema,
  eventIdParamsSchema,
  guestIdParamsSchema,
  importGuestsSchema,
  listGuestsQuerySchema,
  updateGuestSchema,
} from "./schema";

/** Nested under /events/:eventId/guests - listing, adding, and bulk-importing guests for one event. */
export const eventGuestsRouter = Router({ mergeParams: true });

eventGuestsRouter.use(authenticate);

eventGuestsRouter.get(
  "/",
  requirePermission("guests.view"),
  validate({ params: eventIdParamsSchema, query: listGuestsQuerySchema }),
  asyncHandler(guestsController.listGuests)
);

eventGuestsRouter.post(
  "/",
  requirePermission("guests.create"),
  validate({ params: eventIdParamsSchema, body: createGuestSchema }),
  asyncHandler(guestsController.createGuest)
);

eventGuestsRouter.post(
  "/import",
  requirePermission("guests.create"),
  validate({ params: eventIdParamsSchema, body: importGuestsSchema }),
  asyncHandler(guestsController.importGuests)
);

eventGuestsRouter.get(
  "/stats",
  requirePermission("guests.view"),
  validate({ params: eventIdParamsSchema }),
  asyncHandler(guestsController.getAttendanceStats)
);

// Registered ahead of nothing that would conflict - "export" can never collide with a guest
// UUID the way it could on a flat /guests/:id route.
eventGuestsRouter.get(
  "/export",
  requirePermission("guests.view"),
  validate({ params: eventIdParamsSchema }),
  asyncHandler(guestsController.exportCsv)
);

/** Flat /guests/:id - operating on a single guest once you already have its id. */
export const guestsRouter = Router();

guestsRouter.use(authenticate);

guestsRouter.get(
  "/:id",
  requirePermission("guests.view"),
  validate({ params: guestIdParamsSchema }),
  asyncHandler(guestsController.getGuest)
);

guestsRouter.patch(
  "/:id",
  requirePermission("guests.edit"),
  validate({ params: guestIdParamsSchema, body: updateGuestSchema }),
  asyncHandler(guestsController.updateGuest)
);
