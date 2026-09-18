import { z } from "zod";

export const createServiceSchema = z.object({
  name: z.string().min(2).max(120),
  category: z.enum(["catering", "decoration", "photography", "sound", "lighting", "other"]),
  defaultPrice: z.number().nonnegative(),
  description: z.string().max(2000).optional(),
});

export const updateServiceSchema = createServiceSchema.partial();

export const listServicesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  category: z.string().optional(),
});

export const serviceIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const archiveServiceSchema = z.object({
  reason: z.string().trim().min(1).max(500).optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ListServicesQuery = z.infer<typeof listServicesQuerySchema>;
export type ArchiveServiceInput = z.infer<typeof archiveServiceSchema>;
