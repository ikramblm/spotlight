import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import * as servicesController from "./controller";
import {
  archiveServiceSchema,
  createServiceSchema,
  listServicesQuerySchema,
  serviceIdParamsSchema,
  updateServiceSchema,
} from "./schema";

export const servicesRouter = Router();

servicesRouter.use(authenticate);

servicesRouter.get(
  "/",
  requirePermission("services.view"),
  validate({ query: listServicesQuerySchema }),
  asyncHandler(servicesController.listServices)
);

servicesRouter.post(
  "/",
  requirePermission("services.create"),
  validate({ body: createServiceSchema }),
  asyncHandler(servicesController.createService)
);

servicesRouter.get(
  "/:id",
  requirePermission("services.view"),
  validate({ params: serviceIdParamsSchema }),
  asyncHandler(servicesController.getService)
);

servicesRouter.patch(
  "/:id",
  requirePermission("services.edit"),
  validate({ params: serviceIdParamsSchema, body: updateServiceSchema }),
  asyncHandler(servicesController.updateService)
);

servicesRouter.post(
  "/:id/archive",
  requirePermission("services.archive"),
  validate({ params: serviceIdParamsSchema, body: archiveServiceSchema }),
  asyncHandler(servicesController.archiveService)
);
