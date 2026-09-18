import { z } from "zod";

// Plain YYYY-MM-DD, never a full timestamp: expense_date is a calendar date the user picked,
// not derived from a timestamptz, so there's no timezone conversion to get wrong here as long
// as we never round-trip it through a JS Date.
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const createExpenseCategorySchema = z.object({
  name: z.string().min(2).max(80),
});

export const createExpenseSchema = z.object({
  categoryId: z.number().int().positive(),
  bookingId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  amount: z.number().nonnegative(),
  expenseDate: dateOnly,
  paymentMethod: z.enum(["cash", "bank_transfer", "card", "check"]),
  description: z.string().max(2000).optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const listExpensesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  from: dateOnly.optional(),
  to: dateOnly.optional(),
  categoryId: z.coerce.number().int().positive().optional(),
});

export const exportExpensesQuerySchema = listExpensesQuerySchema.omit({ page: true, pageSize: true });

export const summaryQuerySchema = z.object({
  from: dateOnly.optional(),
  to: dateOnly.optional(),
});

export const expenseIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreateExpenseCategoryInput = z.infer<typeof createExpenseCategorySchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
export type ExportExpensesQuery = z.infer<typeof exportExpensesQuerySchema>;
export type SummaryQuery = z.infer<typeof summaryQuerySchema>;
