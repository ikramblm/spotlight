import { z } from "zod";

export const createCatererSchema = z.object({
  name: z.string().min(2).max(150),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
  services: z.array(z.string()).default([]),
  pricingNotes: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateCatererSchema = createCatererSchema.partial();

export const listCaterersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  q: z.string().optional(),
});

export const catererIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const assignBookingSchema = z.object({
  bookingId: z.string().uuid(),
});

export const archiveCatererSchema = z.object({
  reason: z.string().trim().min(1).max(500).optional(),
});

export type CreateCatererInput = z.infer<typeof createCatererSchema>;
export type UpdateCatererInput = z.infer<typeof updateCatererSchema>;
export type ListCaterersQuery = z.infer<typeof listCaterersQuerySchema>;
export type AssignBookingInput = z.infer<typeof assignBookingSchema>;
export type ArchiveCatererInput = z.infer<typeof archiveCatererSchema>;
