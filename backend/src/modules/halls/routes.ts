import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import * as hallsController from "./controller";
import {
  archiveHallSchema,
  createHallSchema,
  hallAvailabilityQuerySchema,
  hallIdParamsSchema,
  listHallsQuerySchema,
  updateHallSchema,
} from "./schema";

export const hallsRouter = Router();

hallsRouter.use(authenticate);

hallsRouter.get(
  "/",
  requirePermission("halls.view"),
  validate({ query: listHallsQuerySchema }),
  asyncHandler(hallsController.listHalls)
);

hallsRouter.post(
  "/",
  requirePermission("halls.create"),
  validate({ body: createHallSchema }),
  asyncHandler(hallsController.createHall)
);

hallsRouter.get(
  "/:id",
  requirePermission("halls.view"),
  validate({ params: hallIdParamsSchema }),
  asyncHandler(hallsController.getHall)
);

hallsRouter.patch(
  "/:id",
  requirePermission("halls.edit"),
  validate({ params: hallIdParamsSchema, body: updateHallSchema }),
  asyncHandler(hallsController.updateHall)
);

hallsRouter.post(
  "/:id/archive",
  requirePermission("halls.archive"),
  validate({ params: hallIdParamsSchema, body: archiveHallSchema }),
  asyncHandler(hallsController.archiveHall)
);

hallsRouter.get(
  "/:id/availability",
  requirePermission("halls.view"),
  validate({ params: hallIdParamsSchema, query: hallAvailabilityQuerySchema }),
  asyncHandler(hallsController.getAvailability)
);

hallsRouter.get(
  "/:id/bookings",
  requirePermission("halls.view"),
  validate({ params: hallIdParamsSchema }),
  asyncHandler(hallsController.getUpcomingBookings)
);
