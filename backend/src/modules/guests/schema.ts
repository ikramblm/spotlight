import { z } from "zod";

export const createGuestSchema = z.object({
  fullName: z.string().min(2).max(150),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
  notes: z.string().max(2000).optional(),
});

export const updateGuestSchema = createGuestSchema.partial();

export const importGuestsSchema = z.object({
  csv: z.string().min(1, "CSV content is required"),
});

export const listGuestsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  q: z.string().optional(),
});

export const eventIdParamsSchema = z.object({
  eventId: z.string().uuid(),
});

export const guestIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreateGuestInput = z.infer<typeof createGuestSchema>;
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>;
export type ImportGuestsInput = z.infer<typeof importGuestsSchema>;
export type ListGuestsQuery = z.infer<typeof listGuestsQuerySchema>;
