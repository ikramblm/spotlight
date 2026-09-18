import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import * as caterersController from "./controller";
import {
  archiveCatererSchema,
  assignBookingSchema,
  catererIdParamsSchema,
  createCatererSchema,
  listCaterersQuerySchema,
  updateCatererSchema,
} from "./schema";

export const caterersRouter = Router();

caterersRouter.use(authenticate);

caterersRouter.get(
  "/",
  requirePermission("caterers.view"),
  validate({ query: listCaterersQuerySchema }),
  asyncHandler(caterersController.listCaterers)
);

caterersRouter.post(
  "/",
  requirePermission("caterers.create"),
  validate({ body: createCatererSchema }),
  asyncHandler(caterersController.createCaterer)
);

caterersRouter.get(
  "/:id",
  requirePermission("caterers.view"),
  validate({ params: catererIdParamsSchema }),
  asyncHandler(caterersController.getCaterer)
);

caterersRouter.patch(
  "/:id",
  requirePermission("caterers.edit"),
  validate({ params: catererIdParamsSchema, body: updateCatererSchema }),
  asyncHandler(caterersController.updateCaterer)
);

caterersRouter.post(
  "/:id/archive",
  requirePermission("caterers.archive"),
  validate({ params: catererIdParamsSchema, body: archiveCatererSchema }),
  asyncHandler(caterersController.archiveCaterer)
);

caterersRouter.post(
  "/:id/bookings",
  requirePermission("caterers.edit"),
  validate({ params: catererIdParamsSchema, body: assignBookingSchema }),
  asyncHandler(caterersController.assignToBooking)
);

const unassignParamsSchema = catererIdParamsSchema.extend({ bookingId: z.string().uuid() });

caterersRouter.delete(
  "/:id/bookings/:bookingId",
  requirePermission("caterers.edit"),
  validate({ params: unassignParamsSchema }),
  asyncHandler(caterersController.unassignFromBooking)
);
