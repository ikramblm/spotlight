import { z } from "zod";

export const createHallSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  capacity: z.number().int().positive(),
  location: z.string().max(255).optional(),
  basePrice: z.number().nonnegative(),
  features: z.array(z.string()).default([]),
  notes: z.string().max(2000).optional(),
});

export const updateHallSchema = createHallSchema.partial().extend({
  isAvailable: z.boolean().optional(),
});

export const listHallsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().optional(),
  availableOnly: z.coerce.boolean().optional(),
});

export const hallIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const hallAvailabilityQuerySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
});

export const archiveHallSchema = z.object({
  reason: z.string().trim().min(1).max(500).optional(),
});

export type CreateHallInput = z.infer<typeof createHallSchema>;
export type UpdateHallInput = z.infer<typeof updateHallSchema>;
export type ListHallsQuery = z.infer<typeof listHallsQuerySchema>;
export type HallAvailabilityQuery = z.infer<typeof hallAvailabilityQuerySchema>;
export type ArchiveHallInput = z.infer<typeof archiveHallSchema>;
