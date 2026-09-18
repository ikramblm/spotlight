import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import * as customersController from "./controller";
import {
  archiveCustomerSchema,
  createCustomerSchema,
  customerIdParamsSchema,
  listCustomersQuerySchema,
  updateCustomerSchema,
} from "./schema";

export const customersRouter = Router();

customersRouter.use(authenticate);

customersRouter.get(
  "/",
  requirePermission("customers.view"),
  validate({ query: listCustomersQuerySchema }),
  asyncHandler(customersController.listCustomers)
);

customersRouter.post(
  "/",
  requirePermission("customers.create"),
  validate({ body: createCustomerSchema }),
  asyncHandler(customersController.createCustomer)
);

customersRouter.get(
  "/:id",
  requirePermission("customers.view"),
  validate({ params: customerIdParamsSchema }),
  asyncHandler(customersController.getCustomer)
);

customersRouter.patch(
  "/:id",
  requirePermission("customers.edit"),
  validate({ params: customerIdParamsSchema, body: updateCustomerSchema }),
  asyncHandler(customersController.updateCustomer)
);

customersRouter.post(
  "/:id/archive",
  requirePermission("customers.archive"),
  validate({ params: customerIdParamsSchema, body: archiveCustomerSchema }),
  asyncHandler(customersController.archiveCustomer)
);
