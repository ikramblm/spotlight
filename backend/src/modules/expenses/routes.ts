import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import * as expensesController from "./controller";
import {
  createExpenseCategorySchema,
  createExpenseSchema,
  expenseIdParamsSchema,
  exportExpensesQuerySchema,
  listExpensesQuerySchema,
  summaryQuerySchema,
  updateExpenseSchema,
} from "./schema";

export const expenseCategoriesRouter = Router();

expenseCategoriesRouter.use(authenticate);

expenseCategoriesRouter.get("/", requirePermission("expenses.view"), asyncHandler(expensesController.listCategories));

expenseCategoriesRouter.post(
  "/",
  requirePermission("expenses.edit"),
  validate({ body: createExpenseCategorySchema }),
  asyncHandler(expensesController.createCategory)
);

export const expensesRouter = Router();

expensesRouter.use(authenticate);

// Registered ahead of /:id so "summary"/"export" are never mistaken for an expense id.
expensesRouter.get(
  "/summary",
  requirePermission("expenses.view"),
  validate({ query: summaryQuerySchema }),
  asyncHandler(expensesController.getSummary)
);

expensesRouter.get(
  "/export",
  requirePermission("expenses.view"),
  validate({ query: exportExpensesQuerySchema }),
  asyncHandler(expensesController.exportCsv)
);

expensesRouter.get(
  "/summary/export",
  requirePermission("expenses.view"),
  validate({ query: summaryQuerySchema }),
  asyncHandler(expensesController.exportSummaryPdf)
);

expensesRouter.get(
  "/",
  requirePermission("expenses.view"),
  validate({ query: listExpensesQuerySchema }),
  asyncHandler(expensesController.listExpenses)
);

expensesRouter.post(
  "/",
  requirePermission("expenses.create"),
  validate({ body: createExpenseSchema }),
  asyncHandler(expensesController.createExpense)
);

expensesRouter.get(
  "/:id",
  requirePermission("expenses.view"),
  validate({ params: expenseIdParamsSchema }),
  asyncHandler(expensesController.getExpense)
);

expensesRouter.patch(
  "/:id",
  requirePermission("expenses.edit"),
  validate({ params: expenseIdParamsSchema, body: updateExpenseSchema }),
  asyncHandler(expensesController.updateExpense)
);
