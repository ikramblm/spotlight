import { z } from "zod";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const createPayrollSchema = z
  .object({
    employeeId: z.string().uuid(),
    periodStart: dateOnly,
    periodEnd: dateOnly,
    // Defaults to the employee's current base_salary when omitted (see service.ts) - lets a
    // one-off adjustment (a raise mid-period, a correction) override it per payroll run.
    baseSalary: z.number().nonnegative().optional(),
    bonuses: z.number().nonnegative().default(0),
    deductions: z.number().nonnegative().default(0),
  })
  .refine((data) => data.periodEnd >= data.periodStart, {
    message: "Period end must be on or after the period start",
    path: ["periodEnd"],
  });

export const updatePayrollSchema = z.object({
  bonuses: z.number().nonnegative().optional(),
  deductions: z.number().nonnegative().optional(),
});

export const markPaidSchema = z.object({
  paymentDate: dateOnly.optional(),
});

export const listPayrollQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  employeeId: z.string().uuid().optional(),
  from: dateOnly.optional(),
  to: dateOnly.optional(),
});

export const payrollIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const employeeIdParamsSchema = z.object({
  employeeId: z.string().uuid(),
});

export type CreatePayrollInput = z.infer<typeof createPayrollSchema>;
export type UpdatePayrollInput = z.infer<typeof updatePayrollSchema>;
export type MarkPaidInput = z.infer<typeof markPaidSchema>;
export type ListPayrollQuery = z.infer<typeof listPayrollQuerySchema>;
