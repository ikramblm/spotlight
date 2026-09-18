import { z } from "zod";

export const createEmployeeSchema = z.object({
  fullName: z.string().min(2).max(150),
  phone: z.string().max(30).optional(),
  position: z.string().min(2).max(100),
  baseSalary: z.number().nonnegative(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  notes: z.string().max(2000).optional(),
  userId: z.string().uuid().optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  employmentStatus: z.enum(["active", "on_leave", "terminated"]).optional(),
});

export const listEmployeesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  q: z.string().optional(),
  employmentStatus: z.enum(["active", "on_leave", "terminated"]).optional(),
});

export const employeeIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const archiveEmployeeSchema = z.object({
  reason: z.string().trim().min(1).max(500).optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;
export type ArchiveEmployeeInput = z.infer<typeof archiveEmployeeSchema>;
