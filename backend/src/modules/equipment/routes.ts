import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import * as equipmentController from "./controller";
import {
  archiveEquipmentSchema,
  assignEquipmentSchema,
  assignmentIdParamsSchema,
  createEquipmentSchema,
  equipmentIdParamsSchema,
  listEquipmentQuerySchema,
  updateEquipmentSchema,
} from "./schema";

export const equipmentRouter = Router();

equipmentRouter.use(authenticate);

equipmentRouter.get(
  "/",
  requirePermission("equipment.view"),
  validate({ query: listEquipmentQuerySchema }),
  asyncHandler(equipmentController.listEquipment)
);

equipmentRouter.post(
  "/",
  requirePermission("equipment.create"),
  validate({ body: createEquipmentSchema }),
  asyncHandler(equipmentController.createEquipment)
);

equipmentRouter.get(
  "/:id",
  requirePermission("equipment.view"),
  validate({ params: equipmentIdParamsSchema }),
  asyncHandler(equipmentController.getEquipment)
);

equipmentRouter.patch(
  "/:id",
  requirePermission("equipment.edit"),
  validate({ params: equipmentIdParamsSchema, body: updateEquipmentSchema }),
  asyncHandler(equipmentController.updateEquipment)
);

equipmentRouter.post(
  "/:id/archive",
  requirePermission("equipment.archive"),
  validate({ params: equipmentIdParamsSchema, body: archiveEquipmentSchema }),
  asyncHandler(equipmentController.archiveEquipment)
);

equipmentRouter.post(
  "/:id/assignments",
  requirePermission("equipment.assign"),
  validate({ params: equipmentIdParamsSchema, body: assignEquipmentSchema }),
  asyncHandler(equipmentController.assignEquipment)
);

equipmentRouter.post(
  "/assignments/:assignmentId/return",
  requirePermission("equipment.assign"),
  validate({ params: assignmentIdParamsSchema }),
  asyncHandler(equipmentController.returnAssignment)
);
