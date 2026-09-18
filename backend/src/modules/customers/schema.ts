import { z } from "zod";

export const createCustomerSchema = z.object({
  fullName: z.string().min(2).max(150),
  phone: z.string().min(6).max(30),
  email: z.string().email().optional(),
  address: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const listCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().optional(),
});

export const customerIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const archiveCustomerSchema = z.object({
  reason: z.string().trim().min(1).max(500).optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
export type ArchiveCustomerInput = z.infer<typeof archiveCustomerSchema>;
