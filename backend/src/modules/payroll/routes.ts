import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import * as payrollController from "./controller";
import {
  createPayrollSchema,
  employeeIdParamsSchema,
  listPayrollQuerySchema,
  markPaidSchema,
  payrollIdParamsSchema,
  updatePayrollSchema,
} from "./schema";

export const payrollRouter = Router();

payrollRouter.use(authenticate);

payrollRouter.get(
  "/",
  requirePermission("payroll.view"),
  validate({ query: listPayrollQuerySchema }),
  asyncHandler(payrollController.listPayroll)
);

payrollRouter.post(
  "/",
  requirePermission("payroll.create"),
  validate({ body: createPayrollSchema }),
  asyncHandler(payrollController.createPayroll)
);

payrollRouter.get(
  "/:id",
  requirePermission("payroll.view"),
  validate({ params: payrollIdParamsSchema }),
  asyncHandler(payrollController.getPayroll)
);

payrollRouter.patch(
  "/:id",
  requirePermission("payroll.edit"),
  validate({ params: payrollIdParamsSchema, body: updatePayrollSchema }),
  asyncHandler(payrollController.updatePayroll)
);

payrollRouter.post(
  "/:id/pay",
  requirePermission("payroll.pay"),
  validate({ params: payrollIdParamsSchema, body: markPaidSchema }),
  asyncHandler(payrollController.markPaid)
);

/** Nested under /employees/:employeeId/payroll - the "payroll history" view for one employee. */
export const employeePayrollRouter = Router({ mergeParams: true });

employeePayrollRouter.use(authenticate);

employeePayrollRouter.get(
  "/",
  requirePermission("payroll.view"),
  validate({ params: employeeIdParamsSchema, query: listPayrollQuerySchema }),
  asyncHandler(payrollController.listPayrollForEmployee)
);
