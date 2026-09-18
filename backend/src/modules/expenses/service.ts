import { AppError } from "../../lib/AppError";
import { recordAudit } from "../../lib/audit";
import { toCsv } from "../../lib/csv";
import { buildPdf } from "../../lib/pdf";
import * as expensesRepo from "./repository";
import type {
  CreateExpenseCategoryInput,
  CreateExpenseInput,
  ExportExpensesQuery,
  ListExpensesQuery,
  SummaryQuery,
  UpdateExpenseInput,
} from "./schema";

export async function listCategories() {
  return expensesRepo.listCategories();
}

export async function createCategory(input: CreateExpenseCategoryInput, actorId: string) {
  const category = await expensesRepo.insertCategory(input);
  await recordAudit({
    userId: actorId,
    action: "expense_category.create",
    entityType: "expense_category",
    entityId: String(category.id),
  });
  return category;
}

const FOREIGN_KEY_VIOLATION = "23503";

function friendlyForeignKeyError(err: unknown): AppError | null {
  if (typeof err !== "object" || err === null || (err as { code?: string }).code !== FOREIGN_KEY_VIOLATION) {
    return null;
  }
  const constraint = (err as { constraint?: string }).constraint ?? "";
  if (constraint.includes("category_id")) {
    return AppError.badRequest("That expense category does not exist", { categoryId: "not found" });
  }
  if (constraint.includes("booking_id")) {
    return AppError.badRequest("That booking does not exist", { bookingId: "not found" });
  }
  if (constraint.includes("supplier_id")) {
    return AppError.badRequest("That supplier does not exist", { supplierId: "not found" });
  }
  return AppError.badRequest("This expense refers to something that doesn't exist");
}

export async function createExpense(input: CreateExpenseInput, actorId: string) {
  let expense;
  try {
    expense = await expensesRepo.insertExpense({ ...input, createdBy: actorId });
  } catch (err) {
    throw friendlyForeignKeyError(err) ?? err;
  }

  await recordAudit({
    userId: actorId,
    action: "expense.create",
    entityType: "expense",
    entityId: expense.id,
    metadata: { amount: input.amount, categoryId: input.categoryId },
  });
  return expense;
}

export async function listExpenses(filters: ListExpensesQuery) {
  return expensesRepo.listExpenses(filters);
}

export async function getExpense(id: string) {
  const expense = await expensesRepo.getExpenseById(id);
  if (!expense) {
    throw AppError.notFound("Expense not found");
  }
  return expense;
}

export async function updateExpense(id: string, input: UpdateExpenseInput, actorId: string) {
  await getExpense(id);

  let updated;
  try {
    updated = await expensesRepo.updateExpense(id, input);
  } catch (err) {
    throw friendlyForeignKeyError(err) ?? err;
  }

  await recordAudit({ userId: actorId, action: "expense.update", entityType: "expense", entityId: id });
  return updated;
}

export async function getFinancialSummary(filters: SummaryQuery) {
  const [summary, byCategory] = await Promise.all([
    expensesRepo.getFinancialSummary(filters),
    expensesRepo.getExpensesByCategory(filters),
  ]);
  return { ...summary, expenses_by_category: byCategory };
}

export async function exportFinancialSummaryPdf(filters: SummaryQuery): Promise<Buffer> {
  const summary = await getFinancialSummary(filters);

  return buildPdf((doc) => {
    doc.fontSize(18).text("Spotlight — Financial Summary", { align: "left" });
    const rangeLabel = filters.from || filters.to ? `${filters.from ?? "start"} to ${filters.to ?? "now"}` : "All time";
    doc.fontSize(10).fillColor("#555555").text(rangeLabel);
    doc.moveDown(1.5);

    doc.fillColor("#000000").fontSize(12);
    const kpis: [string, string][] = [
      ["Revenue", summary.revenue],
      ["Payments received", summary.payments_received],
      ["Expenses", summary.expenses],
      ["Outstanding balance", summary.outstanding_balance],
    ];
    for (const [label, value] of kpis) {
      doc.text(`${label}:  ${value}`);
    }
    doc.moveDown(1.5);

    doc.fontSize(14).text("Expenses by category");
    doc.moveDown(0.5);
    doc.fontSize(11);
    for (const row of summary.expenses_by_category) {
      doc.text(`${row.category_name}:  ${row.total}`);
    }
  });
}

export async function exportExpensesCsv(filters: ExportExpensesQuery): Promise<string> {
  const rows = await expensesRepo.listExpensesForExport(filters);
  return toCsv(rows, [
    { header: "Date", value: (r) => r.expense_date },
    { header: "Category", value: (r) => r.category_name },
    { header: "Amount", value: (r) => r.amount },
    { header: "Payment method", value: (r) => r.payment_method },
    { header: "Description", value: (r) => r.description },
    { header: "Booking ID", value: (r) => r.booking_id },
    { header: "Supplier", value: (r) => r.supplier_name },
    { header: "Recorded by", value: (r) => r.created_by_name },
  ]);
}
