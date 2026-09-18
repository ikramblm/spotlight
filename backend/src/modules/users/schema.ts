import { z } from "zod";

const roleEnum = z.enum([
  "business_owner",
  "operations_manager",
  "event_coordinator",
  "security_staff",
]);

export const createUserSchema = z.object({
  fullName: z.string().min(2).max(150),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: roleEnum,
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(150).optional(),
  phone: z.string().max(30).optional(),
  role: roleEnum.optional(),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  role: roleEnum.optional(),
  q: z.string().optional(),
});

export const userIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
