import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import * as employeesController from "./controller";
import {
  archiveEmployeeSchema,
  createEmployeeSchema,
  employeeIdParamsSchema,
  listEmployeesQuerySchema,
  updateEmployeeSchema,
} from "./schema";

export const employeesRouter = Router();

employeesRouter.use(authenticate);

employeesRouter.get(
  "/",
  requirePermission("employees.view"),
  validate({ query: listEmployeesQuerySchema }),
  asyncHandler(employeesController.listEmployees)
);

employeesRouter.post(
  "/",
  requirePermission("employees.create"),
  validate({ body: createEmployeeSchema }),
  asyncHandler(employeesController.createEmployee)
);

employeesRouter.get(
  "/:id",
  requirePermission("employees.view"),
  validate({ params: employeeIdParamsSchema }),
  asyncHandler(employeesController.getEmployee)
);

employeesRouter.patch(
  "/:id",
  requirePermission("employees.edit"),
  validate({ params: employeeIdParamsSchema, body: updateEmployeeSchema }),
  asyncHandler(employeesController.updateEmployee)
);

employeesRouter.post(
  "/:id/archive",
  requirePermission("employees.archive"),
  validate({ params: employeeIdParamsSchema, body: archiveEmployeeSchema }),
  asyncHandler(employeesController.archiveEmployee)
);
