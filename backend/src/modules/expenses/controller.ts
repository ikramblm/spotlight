import type { Request, Response } from "express";
import { AppError } from "../../lib/AppError";
import * as expensesService from "./service";
import type {
  CreateExpenseCategoryInput,
  CreateExpenseInput,
  ExportExpensesQuery,
  ListExpensesQuery,
  SummaryQuery,
  UpdateExpenseInput,
} from "./schema";

function requireActor(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
}

export async function listCategories(_req: Request, res: Response) {
  const categories = await expensesService.listCategories();
  res.status(200).json({ data: categories });
}

export async function createCategory(req: Request, res: Response) {
  const category = await expensesService.createCategory(req.body as CreateExpenseCategoryInput, requireActor(req));
  res.status(201).json({ data: category });
}

export async function createExpense(req: Request, res: Response) {
  const expense = await expensesService.createExpense(req.body as CreateExpenseInput, requireActor(req));
  res.status(201).json({ data: expense });
}

export async function listExpenses(req: Request, res: Response) {
  const filters = req.query as unknown as ListExpensesQuery;
  const { rows, total } = await expensesService.listExpenses(filters);
  res.status(200).json({ data: rows, meta: { page: filters.page, pageSize: filters.pageSize, total } });
}

export async function getExpense(req: Request, res: Response) {
  const expense = await expensesService.getExpense(req.params.id as string);
  res.status(200).json({ data: expense });
}

export async function updateExpense(req: Request, res: Response) {
  const expense = await expensesService.updateExpense(
    req.params.id as string,
    req.body as UpdateExpenseInput,
    requireActor(req)
  );
  res.status(200).json({ data: expense });
}

export async function getSummary(req: Request, res: Response) {
  const filters = req.query as unknown as SummaryQuery;
  const summary = await expensesService.getFinancialSummary(filters);
  res.status(200).json({ data: summary });
}

export async function exportCsv(req: Request, res: Response) {
  const filters = req.query as unknown as ExportExpensesQuery;
  const csv = await expensesService.exportExpensesCsv(filters);
  res
    .status(200)
    .set("Content-Type", "text/csv; charset=utf-8")
    .set("Content-Disposition", `attachment; filename="expenses.csv"`)
    .send(csv);
}

export async function exportSummaryPdf(req: Request, res: Response) {
  const filters = req.query as unknown as SummaryQuery;
  const pdf = await expensesService.exportFinancialSummaryPdf(filters);
  res
    .status(200)
    .set("Content-Type", "application/pdf")
    .set("Content-Disposition", `attachment; filename="financial-summary.pdf"`)
    .send(pdf);
}
