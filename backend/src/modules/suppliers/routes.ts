import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import * as suppliersController from "./controller";
import {
  archiveSupplierSchema,
  createSupplierSchema,
  listSuppliersQuerySchema,
  supplierIdParamsSchema,
  updateSupplierSchema,
} from "./schema";

export const suppliersRouter = Router();

suppliersRouter.use(authenticate);

suppliersRouter.get(
  "/",
  requirePermission("suppliers.view"),
  validate({ query: listSuppliersQuerySchema }),
  asyncHandler(suppliersController.listSuppliers)
);

suppliersRouter.post(
  "/",
  requirePermission("suppliers.create"),
  validate({ body: createSupplierSchema }),
  asyncHandler(suppliersController.createSupplier)
);

suppliersRouter.get(
  "/:id",
  requirePermission("suppliers.view"),
  validate({ params: supplierIdParamsSchema }),
  asyncHandler(suppliersController.getSupplier)
);

suppliersRouter.patch(
  "/:id",
  requirePermission("suppliers.edit"),
  validate({ params: supplierIdParamsSchema, body: updateSupplierSchema }),
  asyncHandler(suppliersController.updateSupplier)
);

suppliersRouter.post(
  "/:id/archive",
  requirePermission("suppliers.archive"),
  validate({ params: supplierIdParamsSchema, body: archiveSupplierSchema }),
  asyncHandler(suppliersController.archiveSupplier)
);
