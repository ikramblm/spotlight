import { z } from "zod";

export const createSupplierSchema = z.object({
  name: z.string().min(2).max(150),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
  products: z.array(z.string()).default([]),
  pricingNotes: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const listSuppliersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  q: z.string().optional(),
});

export const supplierIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const archiveSupplierSchema = z.object({
  reason: z.string().trim().min(1).max(500).optional(),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type ListSuppliersQuery = z.infer<typeof listSuppliersQuerySchema>;
export type ArchiveSupplierInput = z.infer<typeof archiveSupplierSchema>;
